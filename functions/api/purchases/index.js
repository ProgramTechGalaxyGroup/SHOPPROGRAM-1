import {
  json, readJson, badRequest, now, uid,
  isDuplicateOp, recordOpStmt, runIdempotentBatch, nextDocId,
  inventoryDeltaStmt, movementStmt, getProductName, normalizePaymentMethod,
  ensureComponentsInventoryColumns,
  ensureProductsInventoryModeColumn,
} from "../_lib.js";

async function ensurePurchaseComponentTables(db) {
  await ensureComponentsInventoryColumns(db);
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS purchase_component_items (
      id             TEXT PRIMARY KEY,
      purchase_id    TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      component_id   TEXT NOT NULL REFERENCES components(id),
      component_name TEXT,
      qty            REAL NOT NULL,
      unit           TEXT,
      unit_cost      INTEGER NOT NULL,
      subtotal       INTEGER NOT NULL
    )`
  ).run();
  await db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_po_component_items_purchase
     ON purchase_component_items(purchase_id)`
  ).run();
  await db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_po_component_items_component
     ON purchase_component_items(component_id)`
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS component_stock_movements (
      id            TEXT PRIMARY KEY,
      component_id  TEXT NOT NULL REFERENCES components(id),
      movement_type TEXT NOT NULL,
      qty_change    REAL NOT NULL,
      unit_cost     INTEGER,
      ref_type      TEXT,
      ref_id        TEXT,
      note          TEXT,
      created_at    INTEGER NOT NULL
    )`
  ).run();
  await db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_component_mov_component
     ON component_stock_movements(component_id, created_at)`
  ).run();
  await db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_component_mov_ref
     ON component_stock_movements(ref_type, ref_id)`
  ).run();
}

function componentMovementStmt(db, params) {
  return db.prepare(
    `INSERT INTO component_stock_movements
       (id, component_id, movement_type, qty_change, unit_cost, ref_type, ref_id, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    params.id || uid("cmv"),
    params.componentId,
    params.movementType,
    params.qtyChange,
    params.unitCost == null ? null : params.unitCost,
    params.refType || null,
    params.refId || null,
    params.note || null,
    params.createdAt || Date.now()
  );
}

// GET /api/purchases?from=&to=&limit=
// List purchase orders, newest first, with item count + supplier name.
export const onRequestGet = async ({ env, request }) => {
  await ensurePurchaseComponentTables(env.DB);
  const url = new URL(request.url);
  const from = Number(url.searchParams.get("from"));
  const to   = Number(url.searchParams.get("to"));
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);
  const where = [];
  const binds = [];
  if (from) { where.push("po.created_at >= ?"); binds.push(from); }
  if (to)   { where.push("po.created_at <= ?"); binds.push(to); }
  const sql = `
    SELECT po.*,
           COALESCE(product_items.item_count, 0) + COALESCE(component_items.item_count, 0) AS item_count
    FROM purchase_orders po
    LEFT JOIN (
      SELECT purchase_id, COUNT(*) AS item_count
      FROM purchase_order_items
      GROUP BY purchase_id
    ) product_items ON product_items.purchase_id = po.id
    LEFT JOIN (
      SELECT purchase_id, COUNT(*) AS item_count
      FROM purchase_component_items
      GROUP BY purchase_id
    ) component_items ON component_items.purchase_id = po.id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
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
//     items: [{ itemType: "product", productId, qty, unitCost }
//             | { itemType: "component", componentId, qty, unitCost, unit }]
//   }
// Atomic: creates purchase_orders row, items, stock_movements (IN), inventory deltas,
// updates product cost_price to a running weighted average.
export const onRequestPost = async ({ env, request }) => {
  await ensureProductsInventoryModeColumn(env.DB);
  await ensurePurchaseComponentTables(env.DB);
  const body = await readJson(request);
  if (!body || !Array.isArray(body.items) || !body.items.length) {
    return badRequest("items required");
  }
  // Item validation — products use productId, components use componentId.
  for (let i = 0; i < body.items.length; i++) {
    const it = body.items[i];
    if (!it) return badRequest(`items[${i}] required`);
    it.itemType = it.itemType === "component" || it.type === "component" ? "component" : "product";
    if (it.itemType === "component") {
      it.componentId = String(it.componentId || it.itemId || "").trim();
      if (!it.componentId) return badRequest(`items[${i}].componentId required`);
    } else {
      it.productId = String(it.productId || it.itemId || "").trim();
      if (!it.productId) return badRequest(`items[${i}].productId required`);
    }
    const q = Number(it.qty);
    if (!Number.isFinite(q) || q <= 0) {
      return badRequest(`items[${i}].qty must be > 0 (got ${it.qty})`);
    }
    it.qty = it.itemType === "component" ? q : Math.floor(q);
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
  const componentRows = [];
  for (const it of body.items) {
    const qty = Number(it.qty) || 0;
    const cost = Number(it.unitCost) || 0;
    const subtotal = qty * cost;
    total += subtotal;
    if (it.itemType === "component") {
      const component = await env.DB.prepare(
        `SELECT id, label, unit FROM components WHERE id = ? AND is_active = 1`
      ).bind(it.componentId).first();
      if (!component) return badRequest(`component not found: ${it.componentId}`);
      componentRows.push({
        id: uid("pci"),
        componentId: it.componentId,
        componentName: it.componentName || it.productName || component.label || it.componentId,
        unit: it.unit || component.unit || "",
        qty,
        unitCost: cost,
        subtotal,
      });
    } else {
      itemRows.push({
        id: uid("poi"),
        productId: it.productId,
        productName: it.productName || (await getProductName(env.DB, it.productId)),
        qty,
        unitCost: cost,
        subtotal,
      });
    }
  }

  // Fetch existing inventory + cost so we can update weighted-average cost.
  // Run in parallel to keep request cheap.
  const productStateRows = await Promise.all(
    itemRows.map((row) =>
      env.DB.prepare(
        `SELECT p.cost_price, p.inventory_mode, COALESCE(i.qty_on_hand, 0) AS qty
         FROM products p
         LEFT JOIN inventory i ON i.product_id = p.id
         WHERE p.id = ?`
      ).bind(row.productId).first()
    )
  );
  for (let i = 0; i < itemRows.length; i++) {
    const state = productStateRows[i];
    if (!state) return badRequest(`product not found: ${itemRows[i].productId}`);
    if (state.inventory_mode === "recipe") {
      return badRequest(`recipe product stock is derived from components: ${itemRows[i].productId}`);
    }
    if (state.inventory_mode !== "stock") {
      return badRequest(`inventory mode required for product: ${itemRows[i].productId}`);
    }
  }

  const stmts = [];
  const paymentMethod = normalizePaymentMethod(body.paymentMethod || "cash");
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
      Math.round(total),
      Number(body.paidAmount) || Math.round(total),
      paymentMethod,
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

  componentRows.forEach((row) => {
    stmts.push(
      env.DB.prepare(
        `INSERT INTO purchase_component_items
           (id, purchase_id, component_id, component_name, qty, unit, unit_cost, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        row.id,
        purchaseId,
        row.componentId,
        row.componentName,
        row.qty,
        row.unit || null,
        row.unitCost,
        Math.round(row.subtotal)
      )
    );
    stmts.push(
      env.DB.prepare(
        `UPDATE components
         SET stock_qty = COALESCE(stock_qty, 0) + ?,
             unit = COALESCE(NULLIF(unit, ''), ?),
             updated_at = ?
         WHERE id = ?`
      ).bind(row.qty, row.unit || null, ts, row.componentId)
    );
    stmts.push(
      componentMovementStmt(env.DB, {
        componentId: row.componentId,
        movementType: "IN",
        qtyChange: row.qty,
        unitCost: row.unitCost,
        refType: "purchase",
        refId: purchaseId,
        note: body.note || null,
        createdAt: ts,
      })
    );
  });

  stmts.push(recordOpStmt(env.DB, body.clientOpId, "purchase", purchaseId));

  const outcome = await runIdempotentBatch(env.DB, stmts, body.clientOpId);
  if (outcome.duplicate) {
    return json({ ok: true, duplicate: true, id: outcome.refId });
  }
  return json({ ok: true, id: purchaseId, total });
};
