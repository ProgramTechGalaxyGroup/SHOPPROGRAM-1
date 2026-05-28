import {
  json, readJson, badRequest, now, uid,
  isDuplicateOp, recordOpStmt, runIdempotentBatch, nextDocId,
  inventoryDeltaStmt, movementStmt, getProductName,
} from "../_lib.js";

// GET /api/purchases?from=&to=&limit=
// List purchase orders, newest first, with item count + supplier name.
export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);
  const from = Number(url.searchParams.get("from"));
  const to   = Number(url.searchParams.get("to"));
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);
  const where = [];
  const binds = [];
  if (from) { where.push("po.created_at >= ?"); binds.push(from); }
  if (to)   { where.push("po.created_at <= ?"); binds.push(to); }
  const sql = `
    SELECT po.*, COUNT(poi.id) AS item_count
    FROM purchase_orders po
    LEFT JOIN purchase_order_items poi ON poi.purchase_id = po.id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    GROUP BY po.id
    ORDER BY po.created_at DESC
    LIMIT ?
  `;
  binds.push(limit);
  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return json({ ok: true, purchases: results || [] });
};

// POST /api/purchases
// Body:
//   {
//     clientOpId: string (required for idempotency),
//     supplierId?: string,
//     supplierName?: string,
//     paymentMethod?: string,
//     note?: string,
//     items: [{ productId, qty, unitCost }]
//   }
// Atomic: creates purchase_orders row, items, stock_movements (IN), inventory deltas,
// updates product cost_price to a running weighted average.
export const onRequestPost = async ({ env, request }) => {
  const body = await readJson(request);
  if (!body || !Array.isArray(body.items) || !body.items.length) {
    return badRequest("items required");
  }
  // Item validation — productId required, qty positive integer, unit_cost >= 0.
  for (let i = 0; i < body.items.length; i++) {
    const it = body.items[i];
    if (!it || !it.productId || typeof it.productId !== "string") {
      return badRequest(`items[${i}].productId required`);
    }
    const q = Number(it.qty);
    if (!Number.isFinite(q) || q <= 0) {
      return badRequest(`items[${i}].qty must be > 0 (got ${it.qty})`);
    }
    it.qty = Math.floor(q);
    const cost = Number(it.unitCost);
    it.unitCost = Number.isFinite(cost) && cost >= 0 ? Math.round(cost) : 0;
  }

  if (body.clientOpId) {
    const dup = await isDuplicateOp(env.DB, body.clientOpId);
    if (dup) return json({ ok: true, duplicate: true, id: dup });
  }

  const ts = now();
  const purchaseId = body.id || await nextDocId(env.DB, "PN", ts);

  // Compute total + collect per-product info.
  let total = 0;
  const itemRows = [];
  for (const it of body.items) {
    const qty = Number(it.qty) || 0;
    const cost = Number(it.unitCost) || 0;
    const subtotal = qty * cost;
    total += subtotal;
    itemRows.push({
      id: uid("poi"),
      productId: it.productId,
      productName: it.productName || (await getProductName(env.DB, it.productId)),
      qty,
      unitCost: cost,
      subtotal,
    });
  }

  // Fetch existing inventory + cost so we can update weighted-average cost.
  // Run in parallel to keep request cheap.
  const productStateRows = await Promise.all(
    itemRows.map((row) =>
      env.DB.prepare(
        `SELECT p.cost_price, COALESCE(i.qty_on_hand, 0) AS qty
         FROM products p
         LEFT JOIN inventory i ON i.product_id = p.id
         WHERE p.id = ?`
      ).bind(row.productId).first()
    )
  );

  const stmts = [];
  stmts.push(
    env.DB.prepare(
      `INSERT INTO purchase_orders
         (id, supplier_id, supplier_name, total_amount, paid_amount,
          payment_method, status, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?)`
    ).bind(
      purchaseId,
      body.supplierId || null,
      body.supplierName || null,
      total,
      Number(body.paidAmount) || total,
      body.paymentMethod || null,
      body.note || null,
      ts
    )
  );

  itemRows.forEach((row, idx) => {
    stmts.push(
      env.DB.prepare(
        `INSERT INTO purchase_order_items
           (id, purchase_id, product_id, product_name, qty, unit_cost, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(row.id, purchaseId, row.productId, row.productName, row.qty, row.unitCost, row.subtotal)
    );

    stmts.push(
      movementStmt(env.DB, {
        productId: row.productId,
        movementType: "IN",
        qtyChange: row.qty,
        unitCost: row.unitCost,
        refType: "purchase",
        refId: purchaseId,
        note: body.note || null,
        createdAt: ts,
      })
    );

    stmts.push(inventoryDeltaStmt(env.DB, row.productId, row.qty, ts));

    // Weighted average cost update.
    const prev = productStateRows[idx] || { qty: 0, cost_price: 0 };
    const prevQty = Number(prev.qty) || 0;
    const prevCost = Number(prev.cost_price) || 0;
    const newQty = prevQty + row.qty;
    const newCost = newQty > 0
      ? Math.round((prevQty * prevCost + row.qty * row.unitCost) / newQty)
      : row.unitCost;
    stmts.push(
      env.DB.prepare(
        `UPDATE products SET cost_price = ?, updated_at = ? WHERE id = ?`
      ).bind(newCost, ts, row.productId)
    );
  });

  stmts.push(recordOpStmt(env.DB, body.clientOpId, "purchase", purchaseId));

  const outcome = await runIdempotentBatch(env.DB, stmts, body.clientOpId);
  if (outcome.duplicate) {
    return json({ ok: true, duplicate: true, id: outcome.refId });
  }
  return json({ ok: true, id: purchaseId, total });
};
