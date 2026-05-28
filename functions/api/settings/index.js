import { json, readJson, badRequest, now } from "../_lib.js";

// GET /api/settings
export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT key, value, updated_at FROM settings`
  ).all();
  const out = {};
  for (const r of results || []) {
    try { out[r.key] = JSON.parse(r.value); }
    catch { out[r.key] = r.value; }
  }
  return json({ ok: true, settings: out });
};

// POST /api/settings  body: { key, value }
export const onRequestPost = async ({ env, request }) => {
  const body = await readJson(request);
  if (!body || !body.key) return badRequest("key required");
  const value = typeof body.value === "string" ? body.value : JSON.stringify(body.value ?? {});
  await env.DB.prepare(
    `INSERT INTO settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`
  ).bind(body.key, value, now()).run();
  return json({ ok: true });
};
