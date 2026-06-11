import {
  json,
  readJson,
  badRequest,
  now,
  uid,
  isDuplicateOp,
  recordOpStmt,
  runIdempotentBatch,
  ensureProductionTables,
  componentMovementStmt,
  normalizeUnit,
} from "../_lib.js";

function safeParseInputs(text) {
  try {
    const parsed = JSON.parse(text || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const onRequestGet = async ({ env, request }) => {
  await ensureProductionTables(env.DB);
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);
  const { results } = await env.DB.prepare(
    `SELECT pb.id, pb.recipe_id, pr.name AS recipe_name,
            pb.output_component_id, c.label AS output_label,
            pb.planned_output_qty, pb.actual_output_qty, pb.output_unit,
            pb.total_input_cost, pb.actual_cost_per_unit, pb.note, pb.created_at
     FROM production_batches pb
     LEFT JOIN production_recipes pr ON pr.id = pb.recipe_id
     LEFT JOIN components c ON c.id = pb.output_component_id
     ORDER BY pb.created_at DESC
     LIMIT ?`
  ).bind(limit).all();
  return json({ ok: true, batches: results || [] });
};

export const onRequestPost = async ({ env, request }) => {
  await ensureProductionTables(env.DB);
  const body = await readJson(request);
  if (!body || !body.productionRecipeId && !body.recipeId) {
    return badRequest("productionRecipeId is required");
  }

  if (body.clientOpId) {
    const dup = await isDuplicateOp(env.DB, body.clientOpId);
    if (dup) return json({ ok: true, duplicate: true, id: dup });
  }

  const recipeId = String(body.productionRecipeId || body.recipeId).trim();
  const actualOutputQty = Number(body.actualOutputQuantity != null ? body.actualOutputQuantity : body.actualOutputQty);
  if (!Number.isFinite(actualOutputQty) || actualOutputQty <= 0) {
    return badRequest("actual output quantity must be greater than 0");
  }

  const recipe = await env.DB.prepare(
    `SELECT id, name, output_component_id, planned_output_qty, output_unit, inputs_json, is_active
     FROM production_recipes
     WHERE id = ?`
  ).bind(recipeId).first();
  if (!recipe || recipe.is_active === 0) return badRequest("production recipe not found or inactive");

  const output = await env.DB.prepare(
    `SELECT id, label, unit, item_type, stock_qty, cost_per_unit
     FROM components
     WHERE id = ? AND is_active = 1`
  ).bind(recipe.output_component_id).first();
  if (!output) return badRequest("output component not found");
  if (output.item_type !== "semi_finished") return badRequest("output component must be semi_finished");
  const outputUnit = normalizeUnit(recipe.output_unit || output.unit || "");
  if (!outputUnit || outputUnit !== normalizeUnit(output.unit || "")) {
    return badRequest(`output unit must match component unit: ${normalizeUnit(output.unit || "") || "unset"}`);
  }

  const inputs = safeParseInputs(recipe.inputs_json);
  if (!inputs.length) return badRequest("production recipe has no inputs");

  const inputRows = [];
  for (const input of inputs) {
    const componentId = String(input.componentId || input.component_id || "").trim();
    const qty = Number(input.qty);
    const unit = normalizeUnit(input.unit || "");
    if (!componentId || !Number.isFinite(qty) || qty <= 0) {
      return badRequest("invalid recipe input");
    }
    const component = await env.DB.prepare(
      `SELECT id, label, unit, stock_qty, cost_per_unit
       FROM components
       WHERE id = ? AND is_active = 1`
    ).bind(componentId).first();
    if (!component) return badRequest(`input component not found: ${componentId}`);
    const componentUnit = normalizeUnit(component.unit || "");
    if (!componentUnit || unit !== componentUnit) {
      return badRequest(`input unit must match ${componentId} unit: ${componentUnit || "unset"}`);
    }
    const have = Number(component.stock_qty) || 0;
    if (have < qty) {
      return badRequest("Insufficient stock", {
        code: "INSUFFICIENT_COMPONENT_STOCK",
        insufficient: [{
          componentId,
          name: component.label || componentId,
          available: have,
          required: qty,
          unit: componentUnit,
        }],
      });
    }
    inputRows.push({
      componentId,
      label: component.label || componentId,
      qty,
      unit: componentUnit,
      unitCost: Number(component.cost_per_unit) || 0,
    });
  }

  const ts = now();
  const batchId = body.id || uid("pb");
  const totalInputCost = Math.round(inputRows.reduce((sum, item) => sum + item.qty * item.unitCost, 0));
  const actualCostPerUnit = actualOutputQty > 0 ? Math.round(totalInputCost / actualOutputQty) : 0;
  const prevOutputQty = Number(output.stock_qty) || 0;
  const prevOutputCost = Number(output.cost_per_unit) || 0;
  const newOutputQty = prevOutputQty + actualOutputQty;
  const newOutputCost = newOutputQty > 0
    ? Math.round((prevOutputQty * prevOutputCost + totalInputCost) / newOutputQty)
    : actualCostPerUnit;

  const stmts = [];
  stmts.push(
    env.DB.prepare(
      `INSERT INTO production_batches
         (id, recipe_id, output_component_id, planned_output_qty, actual_output_qty,
          output_unit, total_input_cost, actual_cost_per_unit, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      batchId,
      recipe.id,
      output.id,
      Number(recipe.planned_output_qty) || 0,
      actualOutputQty,
      outputUnit,
      totalInputCost,
      actualCostPerUnit,
      body.note || null,
      ts
    )
  );

  inputRows.forEach((input) => {
    stmts.push(
      env.DB.prepare(
        `UPDATE components
         SET stock_qty = stock_qty - ?,
             updated_at = ?
         WHERE id = ?`
      ).bind(input.qty, ts, input.componentId)
    );
    stmts.push(
      componentMovementStmt(env.DB, {
        componentId: input.componentId,
        movementType: "production_input",
        qtyChange: -input.qty,
        unitCost: input.unitCost,
        refType: "production_batch",
        refId: batchId,
        note: body.note || recipe.name || null,
        createdAt: ts,
      })
    );
  });

  stmts.push(
    env.DB.prepare(
      `UPDATE components
       SET stock_qty = COALESCE(stock_qty, 0) + ?,
           cost_per_unit = ?,
           updated_at = ?
       WHERE id = ?`
    ).bind(actualOutputQty, newOutputCost, ts, output.id)
  );
  stmts.push(
    componentMovementStmt(env.DB, {
      componentId: output.id,
      movementType: "production_output",
      qtyChange: actualOutputQty,
      unitCost: actualCostPerUnit,
      refType: "production_batch",
      refId: batchId,
      note: body.note || recipe.name || null,
      createdAt: ts,
    })
  );
  stmts.push(recordOpStmt(env.DB, body.clientOpId, "production_batch", batchId));

  const outcome = await runIdempotentBatch(env.DB, stmts, body.clientOpId);
  if (outcome.duplicate) {
    return json({ ok: true, duplicate: true, id: outcome.refId || batchId });
  }

  return json({
    ok: true,
    id: batchId,
    recipeId: recipe.id,
    outputComponentId: output.id,
    actualOutputQty,
    outputUnit,
    deductedInputs: inputRows,
    totalInputCost,
    actualCostPerUnit,
  });
};
