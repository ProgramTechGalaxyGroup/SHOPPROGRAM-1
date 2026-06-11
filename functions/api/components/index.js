import {
  json,
  readJson,
  badRequest,
  now,
  ensureComponentsInventoryColumns,
  normalizeInventoryItemType,
  normalizeUnit,
} from "../_lib.js";

export const onRequestGet = async ({ env }) => {
  await ensureComponentsInventoryColumns(env.DB);
  const { results } = await env.DB.prepare(
    `SELECT id, label, unit, note, stock_qty, min_stock, item_type, cost_per_unit, is_active, updated_at
     FROM components
     WHERE is_active = 1
     ORDER BY label COLLATE NOCASE`
  ).all();
  return json({ ok: true, components: results || [] });
};

export const onRequestPost = async ({ env, request }) => {
  await ensureComponentsInventoryColumns(env.DB);
  const body = await readJson(request);
  if (!body || !body.id || !body.label) return badRequest("id + label required");
  const itemType = normalizeInventoryItemType(body.itemType || body.item_type);
  const unit = normalizeUnit(body.unit || "");
  await env.DB.prepare(
    `INSERT INTO components (id, label, unit, note, stock_qty, min_stock, item_type, cost_per_unit, is_active, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
     ON CONFLICT(id) DO UPDATE SET
       label=excluded.label,
       unit=excluded.unit,
       note=excluded.note,
       stock_qty=excluded.stock_qty,
       min_stock=excluded.min_stock,
       item_type=excluded.item_type,
       cost_per_unit=excluded.cost_per_unit,
       is_active=1,
       updated_at=excluded.updated_at`
  ).bind(
    body.id,
    body.label,
    unit || null,
    body.note || null,
    Math.max(0, Number(body.stockQty) || 0),
    Math.max(0, Number(body.minStock) || 0),
    itemType,
    Math.max(0, Math.round(Number(body.costPerUnit != null ? body.costPerUnit : body.cost_per_unit) || 0)),
    now()
  ).run();
  return json({ ok: true, id: body.id });
};

export const onRequestDelete = async ({ env, request }) => {
  await ensureComponentsInventoryColumns(env.DB);
  const body = await readJson(request);
  if (!body || !body.id) return badRequest("id required");
  await env.DB.prepare(
    `UPDATE components SET is_active = 0, updated_at = ? WHERE id = ?`
  ).bind(now(), body.id).run();
  return json({ ok: true, id: body.id });
};
