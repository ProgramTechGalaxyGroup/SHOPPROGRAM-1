import { json, readJson, badRequest, now, uid } from "../_lib.js";

export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT id, name, phone, address, note, is_active, updated_at
     FROM suppliers WHERE is_active = 1 ORDER BY name COLLATE NOCASE`
  ).all();
  return json({ ok: true, suppliers: results || [] });
};

export const onRequestPost = async ({ env, request }) => {
  const body = await readJson(request);
  if (!body || !body.name) return badRequest("name required");
  const id = body.id || uid("sup");
  await env.DB.prepare(
    `INSERT INTO suppliers (id, name, phone, address, note, is_active, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, phone=excluded.phone,
       address=excluded.address, note=excluded.note,
       is_active=1, updated_at=excluded.updated_at`
  ).bind(id, body.name.trim(), body.phone || null, body.address || null, body.note || null, now()).run();
  return json({ ok: true, id });
};
