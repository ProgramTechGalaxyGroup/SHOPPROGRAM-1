import { json } from "../_lib.js";

// GET /api/inventory
// Returns current on-hand for every product plus min_stock + low-stock flag.
export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);
  const lowOnly = url.searchParams.get("low") === "1";
  const sql = `
    SELECT p.id AS product_id, p.name, p.image, p.category_id,
           p.min_stock, p.cost_price, p.price,
           COALESCE(i.qty_on_hand, 0) AS qty_on_hand,
           i.updated_at AS updated_at
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE p.is_active = 1
    ${lowOnly ? "AND COALESCE(i.qty_on_hand, 0) <= p.min_stock" : ""}
    ORDER BY qty_on_hand ASC, p.name COLLATE NOCASE
  `;
  const { results } = await env.DB.prepare(sql).all();
  return json({ ok: true, items: results || [] });
};
