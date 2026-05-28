import { json } from "../_lib.js";

// GET /api/sync/pull?since=<ts>
// Returns a delta of everything updated after `since`. Client uses it for
// background sync. Without `since` it returns the full snapshot.
export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);
  const since = Number(url.searchParams.get("since")) || 0;

  const [categories, addOns, products, inventory, settings, recentSales] =
    await Promise.all([
      env.DB.prepare(
        `SELECT id, label, icon, sort_order, is_active, updated_at,
                parent_id, level, code
         FROM categories WHERE updated_at > ?`
      ).bind(since).all(),

      env.DB.prepare(
        `SELECT id, label, price, group_key, is_active, updated_at
         FROM add_ons WHERE updated_at > ?`
      ).bind(since).all(),

      // We INCLUDE deactivated products (is_active=0) on purpose so the
      // client can MIRROR soft-deletes — without them, a cached row in
      // localStorage from before the deactivation would linger forever.
      // When `since=0` (first pull) we return EVERYTHING; otherwise only
      // rows touched after `since`.
      env.DB.prepare(
        `SELECT p.id, p.name, p.category_id, p.price, p.cost_price, p.barcode,
                p.image, p.description, p.component_ids, p.min_stock, p.is_active,
                p.unit, p.sku_code, p.updated_at,
                COALESCE(i.qty_on_hand, 0) AS stock
         FROM products p
         LEFT JOIN inventory i ON i.product_id = p.id
         WHERE p.updated_at > ? OR (i.updated_at IS NOT NULL AND i.updated_at > ?)
            OR p.is_active = 0`
      ).bind(since, since).all(),

      env.DB.prepare(
        `SELECT product_id, qty_on_hand, location, updated_at
         FROM inventory WHERE updated_at > ?`
      ).bind(since).all(),

      // Pull every settings row whose updated_at is newer than `since`.
      // Includes 'shop', 'invoice_templates', 'barcode_templates' and any
      // other future key — clients should handle them by key.
      env.DB.prepare(
        `SELECT key, value, updated_at FROM settings WHERE updated_at > ?`
      ).bind(since).all(),

      env.DB.prepare(
        `SELECT id, created_at, total, payment_method, customer_name
         FROM sales WHERE created_at > ? ORDER BY created_at DESC LIMIT 50`
      ).bind(since).all(),
    ]);

  return json({
    ok: true,
    serverTime: Date.now(),
    since,
    categories: categories.results || [],
    addOns:     addOns.results || [],
    products:   products.results || [],
    inventory:  inventory.results || [],
    settings:   settings.results || [],
    recentSales: recentSales.results || [],
  });
};
