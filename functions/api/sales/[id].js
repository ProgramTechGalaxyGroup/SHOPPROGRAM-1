import { json, notFound } from "../_lib.js";

export const onRequestGet = async ({ env, params }) => {
  const head = await env.DB.prepare(`SELECT * FROM sales WHERE id = ?`)
    .bind(params.id).first();
  if (!head) return notFound();
  const { results: items } = await env.DB.prepare(
    `SELECT * FROM sale_items WHERE sale_id = ? ORDER BY rowid`
  ).bind(params.id).all();
  return json({ ok: true, sale: head, items: items || [] });
};
