import { json, notFound } from "../_lib.js";

// GET /api/products/:id
export const onRequestGet = async ({ env, params }) => {
  const row = await env.DB.prepare(
    `SELECT p.*, COALESCE(i.qty_on_hand, 0) AS stock
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     WHERE p.id = ?`
  ).bind(params.id).first();
  if (!row) return notFound();
  return json({ ok: true, product: row });
};

// DELETE /api/products/:id  — soft delete (is_active = 0)
export const onRequestDelete = async ({ env, params }) => {
  const r = await env.DB.prepare(
    `UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?`
  ).bind(Date.now(), params.id).run();
  if (r.meta && r.meta.changes === 0) return notFound();
  return json({ ok: true });
};
