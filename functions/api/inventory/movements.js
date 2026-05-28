import { json } from "../_lib.js";

// GET /api/inventory/movements?productId=&type=&from=&to=&limit=
// Returns rows from stock_movements, newest first.
export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const type = url.searchParams.get("type");           // IN | OUT | SALE | ADJUST | RETURN
  const from = Number(url.searchParams.get("from"));
  const to = Number(url.searchParams.get("to"));
  const limit = Math.min(Number(url.searchParams.get("limit")) || 200, 1000);

  const where = [];
  const binds = [];
  if (productId) { where.push("m.product_id = ?"); binds.push(productId); }
  if (type)      { where.push("m.movement_type = ?"); binds.push(type); }
  if (from)      { where.push("m.created_at >= ?"); binds.push(from); }
  if (to)        { where.push("m.created_at <= ?"); binds.push(to); }

  const sql = `
    SELECT m.id, m.product_id, p.name AS product_name, p.image,
           m.movement_type, m.qty_change, m.unit_cost,
           m.ref_type, m.ref_id, m.note, m.created_at
    FROM stock_movements m
    LEFT JOIN products p ON p.id = m.product_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY m.created_at DESC
    LIMIT ?
  `;
  binds.push(limit);
  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return json({ ok: true, movements: results || [] });
};
