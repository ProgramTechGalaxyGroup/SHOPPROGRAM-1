import { json, notFound } from "../_lib.js";

// GET /api/purchases/:id  — header + items.
export const onRequestGet = async ({ env, params }) => {
  const head = await env.DB.prepare(
    `SELECT * FROM purchase_orders WHERE id = ?`
  ).bind(params.id).first();
  if (!head) return notFound();
  const { results: items } = await env.DB.prepare(
    `SELECT * FROM purchase_order_items WHERE purchase_id = ? ORDER BY rowid`
  ).bind(params.id).all();
  return json({ ok: true, purchase: head, items: items || [] });
};
