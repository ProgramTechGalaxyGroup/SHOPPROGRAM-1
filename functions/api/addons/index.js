import { json, readJson, badRequest, now } from "../_lib.js";

export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT id, label, price, group_key, is_active, updated_at
     FROM add_ons WHERE is_active = 1 ORDER BY group_key, label`
  ).all();
  return json({ ok: true, addOns: results || [] });
};

export const onRequestPost = async ({ env, request }) => {
  const body = await readJson(request);
  if (!body || !body.id || !body.label) return badRequest("id + label required");
  await env.DB.prepare(
    `INSERT INTO add_ons (id, label, price, group_key, is_active, updated_at)
     VALUES (?, ?, ?, ?, 1, ?)
     ON CONFLICT(id) DO UPDATE SET
       label=excluded.label, price=excluded.price,
       group_key=excluded.group_key, is_active=1,
       updated_at=excluded.updated_at`
  ).bind(
    body.id,
    body.label,
    Number(body.price) || 0,
    body.group || body.groupKey || "extras",
    now()
  ).run();
  return json({ ok: true, id: body.id });
};
