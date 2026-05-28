import { json, notFound } from "../_lib.js";

export const onRequestGet = async ({ env, params }) => {
  const head = await env.DB.prepare(`SELECT * FROM stock_issues WHERE id = ?`)
    .bind(params.id).first();
  if (!head) return notFound();
  const { results: items } = await env.DB.prepare(
    `SELECT * FROM stock_issue_items WHERE issue_id = ? ORDER BY rowid`
  ).bind(params.id).all();
  return json({ ok: true, issue: head, items: items || [] });
};
