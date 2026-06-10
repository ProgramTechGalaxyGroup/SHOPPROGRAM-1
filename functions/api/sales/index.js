import {
  json, readJson, badRequest, now, uid,
  isDuplicateOp, recordOpStmt, runIdempotentBatch, nextDocId,
  inventoryDeltaStmt, movementStmt, getProductCost,
  ensureProductsInventoryModeColumn, ensureComponentsInventoryColumns,
  normalizePaymentMethod,
} from "../_lib.js";

// GET /api/sales?from=&to=&limit=
export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);
  const from = Number(url.searchParams.get("from"));
  const to = Number(url.searchParams.get("to"));
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 1000);
  const where = [];
  const binds = [];
  if (from) { where.push("created_at >= ?"); binds.push(from); }
  if (to)   { where.push("created_at <= ?"); binds.push(to); }
  const sql = `
    SELECT * FROM sales
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY created_at DESC
    LIMIT ?
  `;
  binds.push(limit);
  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return json({ ok: true, sales: results || [] });
};

// POST /api/sales — Chốt hóa đơn
// Body:
//   {
//     clientOpId, orderId?, customerName?, paymentMethod?, cashierName?,
//     subtotal, vatAmount, discount?, total, paid, changeAmount,
//     note?,
//     items: [{ productId, productName, qty, unitPrice,
//               addons: [...] | addonsJson, addonsTotal, lineTotal }]
//   }
// Atomic: sales + sale_items + stock_movements (SALE) + inventory delta.
export const onRequestPost = async ({ env, request }) => {
  await ensureProductsInventoryModeColumn(env.DB);
  await ensureComponentsInventoryColumns(env.DB);
  const body = await readJson(request);
  if (!body || !Array.isArray(body.items) || !body.items.length) {
    return badRequest("items required");
  }

  // -------- Item-level validation (E3, E6, E8) --------
  // Normalize qty to integer, reject lines that are unsalvageable.
  for (let i = 0; i < body.items.length; i++) {
    const it = body.items[i];
    if (!it || typeof it !== "object") {
      return badRequest(`items[${i}] must be an object`);
    }
    if (!it.productId || typeof it.productId !== "string") {
      return badRequest(`items[${i}].productId required`);
    }
    // Coerce qty: must be a positive integer.
    const q = Number(it.qty);
    if (!Number.isFinite(q) || q <= 0) {
      return badRequest(`items[${i}].qty must be > 0 (got ${it.qty})`);
    }
    // Floor decimals — keep behaviour deterministic and never silently store 1.5.
    it.qty = Math.floor(q);
    // Clamp unitPrice / addonsTotal so a tampered negative can't be billed.
    if (it.unitPrice != null) {
      const up = Number(it.unitPrice);
      it.unitPrice = Number.isFinite(up) ? Math.max(0, up) : 0;
    }
    if (it.addonsTotal != null) {
      const at = Number(it.addonsTotal);
      it.addonsTotal = Number.isFinite(at) ? Math.max(0, at) : 0;
    }
  }

  if (body.clientOpId) {
    const dup = await isDuplicateOp(env.DB, body.clientOpId);
    if (dup) return json({ ok: true, duplicate: true, id: dup });
  }

  // -------- B1: Server-side stock guard & BOM Expansion --------
  // Expand explicitly-marked recipe products into their components.
  const productIds = [...new Set(body.items.map((it) => it.productId).filter(Boolean))];
  let productInfoMap = new Map();
  if (productIds.length > 0) {
    const placeholders = productIds.map(() => "?").join(",");
    const sql = `
      SELECT p.id, p.component_ids, p.inventory_mode
      FROM products p
      WHERE p.id IN (${placeholders})
    `;
    const { results } = await env.DB.prepare(sql).bind(...productIds).all();
    if (results) {
      results.forEach((r) => productInfoMap.set(r.id, r));
    }
  }

  const requiredByProduct = new Map();
  const requiredByComponent = new Map();
  const qtyByProduct = new Map();
  const qtyByComponent = new Map();

  for (const it of body.items) {
    if (!it.productId) continue;
    const qty = Number(it.qty) || 0;
    if (qty <= 0) continue;

    const info = productInfoMap.get(it.productId);
    let isMixedDrink = false;
    if (info && info.inventory_mode === "recipe") {
      isMixedDrink = true;
    } else if (info && info.inventory_mode === "stock") {
      isMixedDrink = false;
    } else if (info) {
      return badRequest(`inventory mode required for product: ${it.productId}`);
    }

    if (isMixedDrink) {
      let components = [];
      try {
        components = JSON.parse(info.component_ids || "[]");
      } catch (e) {}
      if (Array.isArray(components) && components.length > 0) {
        for (const comp of components) {
          const compId = typeof comp === "string" ? comp : comp.id;
          const compQty = typeof comp === "string" ? 1 : (Number(comp.qty) || 1);
          const totalCompQty = compQty * qty;
          requiredByComponent.set(compId, (requiredByComponent.get(compId) || 0) + totalCompQty);
          qtyByComponent.set(compId, (qtyByComponent.get(compId) || 0) + totalCompQty);
        }
      }
    } else {
      requiredByProduct.set(it.productId, (requiredByProduct.get(it.productId) || 0) + qty);
      qtyByProduct.set(it.productId, (qtyByProduct.get(it.productId) || 0) + qty);
    }
  }

  if (!body.allowNegativeStock) {
    const productChecks = await Promise.all(
      [...requiredByProduct.keys()].map((pid) =>
        env.DB.prepare(
          `SELECT p.name, COALESCE(i.qty_on_hand, 0) AS stock
           FROM products p LEFT JOIN inventory i ON i.product_id = p.id
           WHERE p.id = ?`
        ).bind(pid).first()
      )
    );
    const componentChecks = await Promise.all(
      [...requiredByComponent.keys()].map((componentId) =>
        env.DB.prepare(
          `SELECT label AS name, COALESCE(stock_qty, 0) AS stock
           FROM components WHERE id = ?`
        ).bind(componentId).first()
      )
    );
    const insufficient = [];
    [...requiredByProduct.entries()].forEach(([pid, need], idx) => {
      const row = productChecks[idx];
      const have = row ? Number(row.stock) || 0 : 0;
      if (have < need) {
        insufficient.push({
          productId: pid,
          name: row ? row.name : pid,
          available: have,
          required: need,
        });
      }
    });
    [...requiredByComponent.entries()].forEach(([componentId, need], idx) => {
      const row = componentChecks[idx];
      const have = row ? Number(row.stock) || 0 : 0;
      if (have < need) {
        insufficient.push({
          productId: componentId,
          name: row ? row.name : componentId,
          available: have,
          required: need,
        });
      }
    });
    if (insufficient.length) {
      return badRequest("Insufficient stock", {
        code: "INSUFFICIENT_STOCK",
        insufficient,
      });
    }
  }

  // -------- B2: Server-side recompute totals from items --------
  // We TRUST line items (productId, qty, unitPrice, addonsTotal) but NOT the
  // top-level subtotal/vat/total — those are recomputed here so a tampered
  // client can't change the billed price.
  //
  // PRICING MODEL: VAT-inclusive. The displayed product price already contains
  // the tax. So `total` = subtotal - discount (no extra VAT addition). For
  // accounting reports we still need a `vat_amount`, which we compute
  // BACKWARDS from the gross total:   net = gross / (1+rate)  ⇒  vat = gross - net
  let serverSubtotal = 0;
  for (const it of body.items) {
    const qty = Number(it.qty) || 0;
    const unitPrice = Number(it.unitPrice) || Number(it.price) || 0;
    const lineTotal = Math.round(unitPrice * qty);
    serverSubtotal += lineTotal;
    it.__lineTotal = lineTotal;
  }
  const discount = Math.max(0, Math.round(Number(body.discount) || 0));
  const VAT_RATE = Number.isFinite(Number(body.vatRate)) ? Number(body.vatRate) : 0.08;
  const serverTotal = Math.max(0, serverSubtotal - discount);
  const serverVat = VAT_RATE > 0
    ? Math.round(serverTotal - (serverTotal / (1 + VAT_RATE)))
    : 0;
  // If the client supplied a total that disagrees materially, surface it
  // for debugging — but the values written are always the server's.
  if (Number.isFinite(Number(body.total)) && Math.abs(Number(body.total) - serverTotal) > 1) {
    console.warn(
      "sales: client total %d disagrees with server total %d",
      Number(body.total),
      serverTotal
    );
  }

  const paymentMethod = normalizePaymentMethod(body.paymentMethod);
  const hasPaidAmount =
    body.paid !== undefined &&
    body.paid !== null &&
    String(body.paid).trim() !== "";
  const rawPaidAmount = Number(body.paid);
  if (serverTotal > 0 && (!hasPaidAmount || !Number.isFinite(rawPaidAmount) || rawPaidAmount <= 0)) {
    return badRequest("paid amount required", {
      code: "PAYMENT_REQUIRED",
      total: serverTotal,
      paymentMethod,
    });
  }

  // A completed checkout must be fully paid. This keeps sales reports,
  // payment-method dashboards, and later DB imports consistent.
  const paidAmount = Math.max(0, Math.round(rawPaidAmount || 0));
  if (serverTotal > 0 && paidAmount < serverTotal) {
    return badRequest("paid amount is less than total", {
      code: "PAYMENT_INSUFFICIENT",
      total: serverTotal,
      paid: paidAmount,
      shortBy: serverTotal - paidAmount,
      paymentMethod,
    });
  }

  const ts = now();
  const saleId = body.id || await nextDocId(env.DB, "HD", ts);

  // Snapshot costs for gross-profit reporting.
  const enriched = await Promise.all(body.items.map(async (it) => ({
    ...it,
    unitCost: it.unitCost != null
      ? Number(it.unitCost)
      : await getProductCost(env.DB, it.productId),
  })));

  const stmts = [];
  // Use SERVER-computed amounts so a tampered client can't change billing.
  const changeAmount = Math.max(0, paidAmount - serverTotal);
  stmts.push(
    env.DB.prepare(
      `INSERT INTO sales
         (id, order_id, customer_name, subtotal, vat_amount, discount, total,
          paid, change_amount, payment_method, cashier_name,
          payment_status, order_status, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'completed', ?, ?)`
    ).bind(
      saleId,
      body.orderId || null,
      body.customerName || null,
      serverSubtotal,
      serverVat,
      discount,
      serverTotal,
      paidAmount,
      changeAmount,
      paymentMethod,
      body.cashierName || null,
      body.note || null,
      ts
    )
  );

  enriched.forEach((it) => {
    const qty = Number(it.qty) || 0;

    stmts.push(
      env.DB.prepare(
        `INSERT INTO sale_items
           (id, sale_id, product_id, product_name, qty, unit_price,
            addons_json, addons_total, line_total, unit_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        uid("si"),
        saleId,
        it.productId || null,
        it.productName || it.name || "",
        qty,
        Number(it.unitPrice) || Number(it.price) || 0,
        it.addonsJson || (it.addons ? JSON.stringify(it.addons) : null),
        Number(it.addonsTotal) || 0,
        // B2: server-recomputed line total
        Number(it.__lineTotal) || (Number(it.unitPrice) || 0) * qty,
        it.unitCost || 0
      )
    );
  });

  // One stock movement + one inventory delta per distinct product.
  for (const [productId, qty] of qtyByProduct.entries()) {
    if (!productId || !qty) continue;
    const cost = await getProductCost(env.DB, productId);
    stmts.push(
      movementStmt(env.DB, {
        productId,
        movementType: "SALE",
        qtyChange: -qty,
        unitCost: cost,
        refType: "sale",
        refId: saleId,
        note: null,
        createdAt: ts,
      })
    );
    stmts.push(inventoryDeltaStmt(env.DB, productId, -qty, ts));
  }
  for (const [componentId, qty] of qtyByComponent.entries()) {
    if (!componentId || !qty) continue;
    stmts.push(
      env.DB.prepare(
        `UPDATE components
         SET stock_qty = MAX(0, COALESCE(stock_qty, 0) - ?),
             updated_at = ?
         WHERE id = ?`
      ).bind(qty, ts, componentId)
    );
  }

  stmts.push(recordOpStmt(env.DB, body.clientOpId, "sale", saleId));

  // Use runIdempotentBatch so two parallel POSTs with the same clientOpId
  // can no longer both insert a sale. The UNIQUE constraint on sync_log
  // rolls back the loser's whole batch and we surface a "duplicate" reply.
  const outcome = await runIdempotentBatch(env.DB, stmts, body.clientOpId);
  if (outcome.duplicate) {
    return json({ ok: true, duplicate: true, id: outcome.refId });
  }
  return json({
    ok: true,
    id: saleId,
    serverTotal,
    serverSubtotal,
    serverVat,
    change: changeAmount,
  });
};
