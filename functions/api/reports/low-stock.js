import { json } from "../_lib.js";

// GET /api/reports/low-stock — products whose on-hand qty is at or below
// min_stock. Products with min_stock = 0 are NOT considered low (it's the
// "I don't track" sentinel) — matches frontend lowStockProducts logic.
export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.name, p.image, p.min_stock, p.unit, p.category_id,
            COALESCE(i.qty_on_hand, 0) AS qty_on_hand
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     WHERE p.is_active = 1
       AND p.min_stock > 0
       AND COALESCE(i.qty_on_hand, 0) <= p.min_stock
     ORDER BY (COALESCE(i.qty_on_hand, 0) * 1.0 / NULLIF(p.min_stock, 0)) ASC,
              p.name COLLATE NOCASE`
  ).all();
  return json({ ok: true, items: results || [] });
};
