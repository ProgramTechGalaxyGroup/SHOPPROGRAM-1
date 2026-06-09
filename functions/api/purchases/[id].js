import { json, notFound } from "../_lib.js";

async function ensurePurchaseComponentTables(db) {
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
}

// GET /api/purchases/:id  — header + items.
export const onRequestGet = async ({ env, params }) => {
  await ensurePurchaseComponentTables(env.DB);
  const head = await env.DB.prepare(
    `SELECT * FROM purchase_orders WHERE id = ?`
  ).bind(params.id).first();
  if (!head) return notFound();
  const { results: productItems } = await env.DB.prepare(
    `SELECT * FROM purchase_order_items WHERE purchase_id = ? ORDER BY rowid`
  ).bind(params.id).all();
  const { results: componentItems } = await env.DB.prepare(
    `SELECT id, purchase_id, component_id, component_name, qty, unit, unit_cost, subtotal
     FROM purchase_component_items
     WHERE purchase_id = ?
     ORDER BY rowid`
  ).bind(params.id).all();
  const items = (productItems || []).map((item) => ({
    ...item,
    item_type: "product",
  })).concat((componentItems || []).map((item) => ({
    ...item,
    item_type: "component",
    product_id: item.component_id,
    product_name: item.component_name,
  })));
  return json({ ok: true, purchase: head, items: items || [] });
};
