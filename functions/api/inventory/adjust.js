import {
  json, readJson, badRequest, now,
  isDuplicateOp, recordOpStmt, runIdempotentBatch,
  inventoryDeltaStmt, movementStmt,
  ensureProductsInventoryModeColumn,
} from "../_lib.js";

// POST /api/inventory/adjust
// Direct stock adjustment for quick inline edits or stocktake corrections.
// Records a stock_movements row of type ADJUST so the ledger stays complete.
//
// Two input modes:
//   { productId, newQty, reason?, clientOpId }   — set absolute on-hand
//   { productId, delta,  reason?, clientOpId }   — relative change (+/-)
//
// Either form is supported; absolute form is preferred because it survives
// race conditions (two devices both setting "5" agree on the result).
export const onRequestPost = async ({ env, request }) => {
  await ensureProductsInventoryModeColumn(env.DB);
  const body = await readJson(request);
  if (!body || !body.productId || typeof body.productId !== "string") {
    return badRequest("productId required");
  }

  if (body.clientOpId) {
    const dup = await isDuplicateOp(env.DB, body.clientOpId);
    if (dup) return json({ ok: true, duplicate: true });
  }

  const productMeta = await env.DB.prepare(
    `SELECT inventory_mode FROM products WHERE id = ?`
  ).bind(body.productId).first();
  if (productMeta && productMeta.inventory_mode === "recipe") {
    return badRequest("recipe-based product stock is derived from components");
  }
  if (!productMeta || productMeta.inventory_mode !== "stock") {
    return badRequest("inventory mode required before adjusting direct stock");
  }

  // Resolve target qty.
  let targetQty;
  let delta;
  const cur = await env.DB.prepare(
    `SELECT COALESCE(qty_on_hand, 0) AS qty FROM inventory WHERE product_id = ?`
  ).bind(body.productId).first();
  const oldQty = cur ? Number(cur.qty) || 0 : 0;

  if (body.newQty != null) {
    targetQty = Math.max(0, Math.floor(Number(body.newQty)));
    if (!Number.isFinite(targetQty)) return badRequest("newQty must be a number");
    delta = targetQty - oldQty;
  } else if (body.delta != null) {
    const d = Math.floor(Number(body.delta));
    if (!Number.isFinite(d)) return badRequest("delta must be a number");
    targetQty = Math.max(0, oldQty + d);
    delta = targetQty - oldQty;
  } else {
    return badRequest("either newQty or delta required");
  }

  if (delta === 0) {
    // No-op; still record sync_log so client doesn't re-send.
    if (body.clientOpId) {
      await recordOpStmt(env.DB, body.clientOpId, "adjust", null).run();
    }
    return json({ ok: true, productId: body.productId, qty: oldQty, delta: 0 });
  }

  const ts = now();
  const stmts = [
    movementStmt(env.DB, {
      productId: body.productId,
      movementType: "ADJUST",
      qtyChange: delta,
      unitCost: null,
      refType: "manual",
      refId: body.refId || null,
      note: body.reason || body.note || "Inline stock edit",
      createdAt: ts,
    }),
    inventoryDeltaStmt(env.DB, body.productId, delta, ts),
    recordOpStmt(env.DB, body.clientOpId, "adjust", body.productId),
  ];
  const outcome = await runIdempotentBatch(env.DB, stmts, body.clientOpId);
  if (outcome.duplicate) {
    return json({ ok: true, duplicate: true, productId: body.productId });
  }

  return json({ ok: true, productId: body.productId, qty: targetQty, delta });
};
