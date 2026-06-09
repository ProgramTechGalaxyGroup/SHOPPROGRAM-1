import {
  json,
  badRequest,
  readJson,
  now,
  uid,
  isDuplicateOp,
  recordOpStmt,
  runIdempotentBatch,
  inventoryDeltaStmt,
  movementStmt,
  getProductCost,
  ensureProductsInventoryModeColumn,
  ensureComponentsInventoryColumns,
} from "../_lib.js";

// POST /api/inventory/convert
// Converts sellable retail stock into ingredient/component stock.
// Example: Fruit Box -1 box -> Cut fruit component +300g.
export const onRequestPost = async ({ env, request }) => {
  await ensureProductsInventoryModeColumn(env.DB);
  await ensureComponentsInventoryColumns(env.DB);

  const body = await readJson(request);
  if (!body || !body.productId) return badRequest("productId required");
  if (!body.componentId) return badRequest("componentId required");

  const productQty = Number(body.productQty != null ? body.productQty : body.qty);
  const componentQty = Number(body.componentQty != null ? body.componentQty : body.qty);
  if (!Number.isFinite(productQty) || productQty <= 0) {
    return badRequest("productQty must be > 0");
  }
  if (!Number.isFinite(componentQty) || componentQty <= 0) {
    return badRequest("componentQty must be > 0");
  }

  if (body.clientOpId) {
    const dup = await isDuplicateOp(env.DB, body.clientOpId);
    if (dup) return json({ ok: true, duplicate: true, id: dup });
  }

  const product = await env.DB.prepare(
    `SELECT p.id, p.name, p.inventory_mode, COALESCE(i.qty_on_hand, 0) AS stock
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     WHERE p.id = ? AND p.is_active = 1`
  ).bind(body.productId).first();

  if (!product) return badRequest("product not found");
  if (product.inventory_mode === "recipe") {
    return badRequest("recipe products do not keep direct stock");
  }

  const available = Number(product.stock) || 0;
  if (!body.allowNegativeStock && available < productQty) {
    return badRequest("Insufficient stock", {
      code: "INSUFFICIENT_STOCK",
      available,
      required: productQty,
    });
  }

  const componentId = String(body.componentId).trim();
  const componentLabel = String(body.componentLabel || componentId).trim();
  if (!componentLabel) return badRequest("componentLabel required");

  const ts = now();
  const conversionId = uid("conv");
  const componentUnit = body.componentUnit || body.unit || "";
  const shelfLifeNote = body.expiryNote || body.expiryDate || "";
  const note = [
    "Convert retail stock to component",
    `Product: ${product.name} (${product.id}) -${productQty}`,
    `Component: ${componentLabel} (${componentId}) +${componentQty}${componentUnit ? " " + componentUnit : ""}`,
    body.reason || body.note || "",
    shelfLifeNote ? `Shelf life: ${shelfLifeNote}` : "",
  ].filter(Boolean).join(" | ");

  const cost = await getProductCost(env.DB, product.id);
  const stmts = [
    inventoryDeltaStmt(env.DB, product.id, -productQty, ts),
    movementStmt(env.DB, {
      productId: product.id,
      movementType: "OUT",
      qtyChange: -productQty,
      unitCost: cost,
      refType: "convert",
      refId: conversionId,
      note,
      createdAt: ts,
    }),
    env.DB.prepare(
      `INSERT INTO components (id, label, unit, note, stock_qty, min_stock, is_active, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, 1, ?)
       ON CONFLICT(id) DO UPDATE SET
         stock_qty = COALESCE(components.stock_qty, 0) + excluded.stock_qty,
         unit = COALESCE(NULLIF(components.unit, ''), excluded.unit),
         note = COALESCE(NULLIF(components.note, ''), excluded.note),
         is_active = 1,
         updated_at = excluded.updated_at`
    ).bind(
      componentId,
      componentLabel,
      componentUnit || null,
      body.componentNote || note,
      componentQty,
      ts
    ),
    recordOpStmt(env.DB, body.clientOpId, "inventory-convert", conversionId),
  ];

  const outcome = await runIdempotentBatch(env.DB, stmts, body.clientOpId);
  if (outcome.duplicate) {
    return json({ ok: true, duplicate: true, id: outcome.refId });
  }

  return json({
    ok: true,
    id: conversionId,
    productId: product.id,
    componentId,
    productStock: available - productQty,
    componentQtyAdded: componentQty,
  });
};
