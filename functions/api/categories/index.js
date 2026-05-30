import { json, readJson, badRequest, now } from "../_lib.js";

// GET /api/categories
// Returns categories ordered for tree-rendering: each parent immediately
// followed by its children. `level` and `parent_id` are echoed back so the
// client can build a tree if it needs to.
export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT id, label, icon, sort_order, is_active, updated_at,
            parent_id, level, code
     FROM categories WHERE is_active = 1
     ORDER BY sort_order, label`
  ).all();
  return json({ ok: true, categories: results || [] });
};

// POST /api/categories  — upsert
export const onRequestPost = async ({ env, request }) => {
  const body = await readJson(request);
  if (!body || !body.id || !body.label) return badRequest("id + label required");
  await env.DB.prepare(
    `INSERT INTO categories (id, label, icon, code, sort_order, is_active, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)
     ON CONFLICT(id) DO UPDATE SET
       label=excluded.label, icon=excluded.icon,
       code=excluded.code, sort_order=excluded.sort_order,
       is_active=1, updated_at=excluded.updated_at`
  ).bind(body.id, body.label, body.icon || null, body.code || null, Number(body.sortOrder) || 0, now()).run();
  return json({ ok: true, id: body.id });
};

// DELETE /api/categories  — soft-delete (set is_active = 0)
export const onRequestDelete = async ({ env, request }) => {
  const body = await readJson(request);
  if (!body || !body.id) return badRequest("id required");
  await env.DB.prepare(
    `UPDATE categories SET is_active = 0, updated_at = ? WHERE id = ?`
  ).bind(now(), body.id).run();
  return json({ ok: true, id: body.id });
};
