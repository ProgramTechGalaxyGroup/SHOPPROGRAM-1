import {
  json, readJson, badRequest, now, uid,
  isDuplicateOp, recordOpStmt, runIdempotentBatch, nextDocId,
  inventoryDeltaStmt, movementStmt, getProductCost,
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

  // -------- B1: Server-side stock guard --------
  // Aggregate required qty per product, then load current on-hand and reject
  // when not enough (unless explicitly allowed for stocktake/admin flows).
  const requiredByProduct = new Map();
  for (const it of body.items) {
    if (!it.productId) continue;
    requiredByProduct.set(
      it.productId,
      (requiredByProduct.get(it.productId) || 0) + (Number(it.qty) || 0)
    );
  }
  if (!body.allowNegativeStock) {
    const checks = await Promise.all(
      [...requiredByProduct.keys()].map((pid) =>
        env.DB.prepare(
          `SELECT p.name, COALESCE(i.qty_on_hand, 0) AS stock
           FROM products p LEFT JOIN inventory i ON i.product_id = p.id
           WHERE p.id = ?`
        ).bind(pid).first()
      )
    );
    const insufficient = [];
    [...requiredByProduct.entries()].forEach(([pid, need], idx) => {
      const row = checks[idx];
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
  const paidAmount = Math.max(0, Math.round(Number(body.paid) || 0));
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
      body.paymentMethod || null,
      body.cashierName || null,
      body.note || null,
      ts
    )
  );

  // Aggregate qty per product for inventory updates (a product may appear twice
  // with different addons but stock decrements by total qty).
  const qtyByProduct = new Map();

  enriched.forEach((it) => {
    const qty = Number(it.qty) || 0;
    qtyByProduct.set(it.productId, (qtyByProduct.get(it.productId) || 0) + qty);

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
