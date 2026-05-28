import {
  json, badRequest, readJson, now, isDuplicateOp, recordOpStmt, runIdempotentBatch,
} from "../_lib.js";

// GET /api/products
// Returns active products joined with current inventory.
export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);
  const includeInactive = url.searchParams.get("all") === "1";
  const sql = `
    SELECT p.id, p.name, p.category_id, p.price, p.cost_price, p.barcode,
           p.image, p.description, p.component_ids, p.min_stock, p.is_active,
           p.unit, p.sku_code, p.updated_at,
           COALESCE(i.qty_on_hand, 0) AS stock,
           i.updated_at AS inventory_updated_at
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    ${includeInactive ? "" : "WHERE p.is_active = 1"}
    ORDER BY p.name COLLATE NOCASE
  `;
  const { results } = await env.DB.prepare(sql).all();
  const products = (results || []).map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category_id,
    price: Number(r.price) || 0,
    costPrice: Number(r.cost_price) || 0,
    barcode: r.barcode || "",
    image: r.image || "",
    description: r.description || "",
    componentIds: r.component_ids ? safeParse(r.component_ids) : [],
    minStock: Number(r.min_stock) || 0,
    isActive: !!r.is_active,
    stock: Number(r.stock) || 0,
    unit: r.unit || "",
    skuCode: r.sku_code || r.id,
    updatedAt: Number(r.updated_at) || 0,
  }));
  return json({ ok: true, products });
};

// POST /api/products
// Upsert (create or update). Body: { id?, name, category, price, costPrice?,
//   barcode?, image?, description?, componentIds?, minStock?, clientOpId? }
export const onRequestPost = async ({ env, request }) => {
  const body = await readJson(request);
  if (!body || !body.name) return badRequest("name is required");

  if (body.clientOpId) {
    const dup = await isDuplicateOp(env.DB, body.clientOpId);
    if (dup) return json({ ok: true, duplicate: true, id: dup });
  }

  const id = body.id || ("p-" + Math.random().toString(36).slice(2, 10));
  const ts = now();
  const componentIds = Array.isArray(body.componentIds)
    ? JSON.stringify(body.componentIds)
    : "[]";

  const outcome = await runIdempotentBatch(env.DB, [
    env.DB.prepare(
      `INSERT INTO products
         (id, name, category_id, price, cost_price, barcode, image, description,
          component_ids, min_stock, is_active, updated_at, unit, sku_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name,
         category_id=excluded.category_id,
         price=excluded.price,
         cost_price=excluded.cost_price,
         barcode=excluded.barcode,
         image=excluded.image,
         description=excluded.description,
         component_ids=excluded.component_ids,
         min_stock=excluded.min_stock,
         is_active=1,
         unit=excluded.unit,
         sku_code=excluded.sku_code,
         updated_at=excluded.updated_at`
    ).bind(
      id,
      String(body.name).trim(),
      body.category || null,
      Number(body.price) || 0,
      Number(body.costPrice) || 0,
      body.barcode || null,
      body.image || null,
      body.description || null,
      componentIds,
      Number(body.minStock) || 0,
      ts,
      body.unit || null,
      body.skuCode || id
    ),
    // Ensure an inventory row exists even if 0.
    env.DB.prepare(
      `INSERT OR IGNORE INTO inventory (product_id, qty_on_hand, location, updated_at)
       VALUES (?, 0, 'main', ?)`
    ).bind(id, ts),
    recordOpStmt(env.DB, body.clientOpId, "product", id),
  ], body.clientOpId);

  if (outcome.duplicate) {
    return json({ ok: true, duplicate: true, id: outcome.refId || id });
  }
  return json({ ok: true, id });
};

function safeParse(text) {
  try { return JSON.parse(text); } catch { return []; }
}
