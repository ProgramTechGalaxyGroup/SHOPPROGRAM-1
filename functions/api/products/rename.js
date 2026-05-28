import {
  json, readJson, badRequest, notFound, now,
  isDuplicateOp, recordOpStmt, runIdempotentBatch,
} from "../_lib.js";

// POST /api/products/rename
// Body: { oldId, newId, clientOpId? }
//
// Atomically rename a product's primary key + cascade the rename to every
// child table that references products.id. We disable the FK check for the
// transaction so SQLite doesn't reject the PK UPDATE mid-flight (default
// behavior: FK violation when changing referenced PK).
//
// Tables updated:
//   products            (id)
//   inventory           (product_id)
//   sale_items          (product_id)
//   stock_movements     (product_id)
//   purchase_order_items(product_id)
//   stock_issue_items   (product_id)
//
// Returns 200 with { ok:true, oldId, newId } on success.
// Returns 400 if newId already exists or oldId not found.
export const onRequestPost = async ({ env, request }) => {
  const body = await readJson(request);
  if (!body || !body.oldId || !body.newId) {
    return badRequest("oldId and newId required");
  }
  const oldId = String(body.oldId).trim();
  const newId = String(body.newId).trim().toUpperCase();

  if (oldId === newId) {
    return json({ ok: true, unchanged: true, oldId, newId });
  }
  if (!/^[A-Z0-9_-]{2,40}$/i.test(newId)) {
    return badRequest("newId must be 2-40 chars of A-Z, 0-9, _, -");
  }

  // Idempotency check.
  if (body.clientOpId) {
    const dup = await isDuplicateOp(env.DB, body.clientOpId);
    if (dup) return json({ ok: true, duplicate: true, newId });
  }

  // Verify old exists, new doesn't.
  const oldRow = await env.DB.prepare("SELECT id FROM products WHERE id = ?").bind(oldId).first();
  if (!oldRow) return notFound("Product " + oldId + " not found");
  const collision = await env.DB.prepare("SELECT id FROM products WHERE id = ?").bind(newId).first();
  if (collision) return badRequest("New ID already exists: " + newId, { code: "ID_COLLISION" });

  const ts = now();
  // Defer FK checks until end of transaction, then update parent + all children.
  // D1 supports PRAGMA defer_foreign_keys per-transaction.
  const stmts = [
    env.DB.prepare("PRAGMA defer_foreign_keys = ON"),
    env.DB.prepare("UPDATE products          SET id = ?, sku_code = COALESCE(?, sku_code), updated_at = ? WHERE id = ?")
      .bind(newId, newId, ts, oldId),
    env.DB.prepare("UPDATE inventory         SET product_id = ? WHERE product_id = ?").bind(newId, oldId),
    env.DB.prepare("UPDATE sale_items        SET product_id = ? WHERE product_id = ?").bind(newId, oldId),
    env.DB.prepare("UPDATE stock_movements   SET product_id = ? WHERE product_id = ?").bind(newId, oldId),
    env.DB.prepare("UPDATE purchase_order_items SET product_id = ? WHERE product_id = ?").bind(newId, oldId),
    env.DB.prepare("UPDATE stock_issue_items SET product_id = ? WHERE product_id = ?").bind(newId, oldId),
    recordOpStmt(env.DB, body.clientOpId, "rename", newId),
  ];

  const outcome = await runIdempotentBatch(env.DB, stmts, body.clientOpId);
  if (outcome.duplicate) {
    return json({ ok: true, duplicate: true, newId });
  }

  return json({ ok: true, oldId, newId });
};
