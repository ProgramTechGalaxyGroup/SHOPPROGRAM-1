import { json, ensureProductsInventoryModeColumn, ensureComponentsInventoryColumns } from "../_lib.js";

// GET /api/reports/low-stock
// Returns direct-stock products and components whose current quantity is at or
// below their configured min_stock. Recipe products are derived from
// components, so their direct inventory row is intentionally ignored here.
export const onRequestGet = async ({ env }) => {
  await ensureProductsInventoryModeColumn(env.DB);
  await ensureComponentsInventoryColumns(env.DB);

  const { results } = await env.DB.prepare(
    `SELECT 'product' AS type,
            p.id AS id,
            p.name AS name,
            p.image AS image,
            p.min_stock AS min_stock,
            p.unit AS unit,
            p.category_id AS category_id,
            p.barcode AS barcode,
            COALESCE(i.qty_on_hand, 0) AS qty_on_hand,
            (COALESCE(i.qty_on_hand, 0) * 1.0 / NULLIF(p.min_stock, 0)) AS stock_ratio
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     WHERE p.is_active = 1
       AND p.inventory_mode = 'stock'
       AND p.min_stock > 0
       AND COALESCE(i.qty_on_hand, 0) <= p.min_stock

     UNION ALL

     SELECT 'component' AS type,
            c.id AS id,
            c.label AS name,
            NULL AS image,
            c.min_stock AS min_stock,
            c.unit AS unit,
            c.item_type AS category_id,
            NULL AS barcode,
            COALESCE(c.stock_qty, 0) AS qty_on_hand,
            (COALESCE(c.stock_qty, 0) * 1.0 / NULLIF(c.min_stock, 0)) AS stock_ratio
     FROM components c
     WHERE c.is_active = 1
       AND c.min_stock > 0
       AND COALESCE(c.stock_qty, 0) <= c.min_stock

     ORDER BY stock_ratio ASC, name`
  ).all();

  return json({ ok: true, items: results || [] });
};
