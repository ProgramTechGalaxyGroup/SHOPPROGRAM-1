import {
  json,
  readJson,
  badRequest,
  now,
  uid,
  ensureProductionTables,
  normalizeUnit,
} from "../_lib.js";

function parseInputs(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    componentId: String(item.componentId || item.component_id || "").trim(),
    qty: Number(item.qty),
    unit: normalizeUnit(item.unit || ""),
  })).filter((item) => item.componentId);
}

async function validateRecipe(db, body) {
  const name = String(body.name || "").trim();
  const outputComponentId = String(body.outputComponentId || body.output_component_id || "").trim();
  const plannedOutputQty = Number(body.plannedOutputQty != null ? body.plannedOutputQty : body.planned_output_qty);
  const outputUnit = normalizeUnit(body.outputUnit || body.output_unit || "");
  const inputs = parseInputs(body.inputs || body.inputsJson || body.inputs_json);

  if (!name) return { error: "recipe name is required" };
  if (!outputComponentId) return { error: "output component is required" };
  if (!Number.isFinite(plannedOutputQty) || plannedOutputQty <= 0) {
    return { error: "planned output quantity must be greater than 0" };
  }
  if (!outputUnit) return { error: "output unit is required" };
  if (!inputs.length) return { error: "at least one input is required" };

  const output = await db.prepare(
    `SELECT id, label, unit, item_type FROM components WHERE id = ? AND is_active = 1`
  ).bind(outputComponentId).first();
  if (!output) return { error: "output component not found" };
  if (output.item_type !== "semi_finished") {
    return { error: "output component must be semi_finished" };
  }
  const normalizedOutputUnit = normalizeUnit(output.unit || "");
  if (normalizedOutputUnit && outputUnit !== normalizedOutputUnit) {
    return { error: `output unit must match component unit: ${normalizedOutputUnit}` };
  }

  const normalizedInputs = [];
  for (const input of inputs) {
    if (!Number.isFinite(input.qty) || input.qty <= 0) {
      return { error: `input quantity must be greater than 0: ${input.componentId}` };
    }
    if (input.componentId === outputComponentId) {
      return { error: "output component cannot also be an input" };
    }
    const component = await db.prepare(
      `SELECT id, label, unit, item_type FROM components WHERE id = ? AND is_active = 1`
    ).bind(input.componentId).first();
    if (!component) return { error: `input component not found: ${input.componentId}` };
    const componentUnit = normalizeUnit(component.unit || "");
    const inputUnit = input.unit || componentUnit;
    if (!componentUnit || !inputUnit || inputUnit !== componentUnit) {
      return { error: `input unit must match ${component.id} unit: ${componentUnit || "unset"}` };
    }
    normalizedInputs.push({
      componentId: component.id,
      qty: input.qty,
      unit: componentUnit,
    });
  }

  return {
    value: {
      name,
      outputComponentId,
      plannedOutputQty,
      outputUnit: normalizedOutputUnit || outputUnit,
      inputs: normalizedInputs,
      note: body.note || null,
      isActive: body.isActive === false || body.is_active === 0 ? 0 : 1,
    },
  };
}

export const onRequestGet = async ({ env, request }) => {
  await ensureProductionTables(env.DB);
  const url = new URL(request.url);
  const includeInactive = url.searchParams.get("all") === "1";
  const { results } = await env.DB.prepare(
    `SELECT pr.id, pr.name, pr.output_component_id, pr.planned_output_qty,
            pr.output_unit, pr.inputs_json, pr.note, pr.is_active, pr.updated_at,
            c.label AS output_label, c.stock_qty AS output_stock
     FROM production_recipes pr
     LEFT JOIN components c ON c.id = pr.output_component_id
     ${includeInactive ? "" : "WHERE pr.is_active = 1"}
     ORDER BY pr.updated_at DESC, pr.name COLLATE NOCASE`
  ).all();

  return json({
    ok: true,
    recipes: (results || []).map((row) => ({
      id: row.id,
      name: row.name,
      outputComponentId: row.output_component_id,
      outputLabel: row.output_label || row.output_component_id,
      plannedOutputQty: Number(row.planned_output_qty) || 0,
      outputUnit: row.output_unit || "",
      inputs: safeParse(row.inputs_json),
      note: row.note || "",
      isActive: !!row.is_active,
      updatedAt: Number(row.updated_at) || 0,
      outputStock: Number(row.output_stock) || 0,
    })),
  });
};

export const onRequestPost = async ({ env, request }) => {
  await ensureProductionTables(env.DB);
  const body = await readJson(request);
  if (!body) return badRequest("body is required");
  const validated = await validateRecipe(env.DB, body);
  if (validated.error) return badRequest(validated.error);

  const recipe = validated.value;
  const id = String(body.id || "").trim() || uid("prep");
  const ts = now();
  await env.DB.prepare(
    `INSERT INTO production_recipes
       (id, name, output_component_id, planned_output_qty, output_unit,
        inputs_json, note, is_active, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name,
       output_component_id=excluded.output_component_id,
       planned_output_qty=excluded.planned_output_qty,
       output_unit=excluded.output_unit,
       inputs_json=excluded.inputs_json,
       note=excluded.note,
       is_active=excluded.is_active,
       updated_at=excluded.updated_at`
  ).bind(
    id,
    recipe.name,
    recipe.outputComponentId,
    recipe.plannedOutputQty,
    recipe.outputUnit,
    JSON.stringify(recipe.inputs),
    recipe.note,
    recipe.isActive,
    ts
  ).run();

  return json({ ok: true, id });
};

export const onRequestDelete = async ({ env, request }) => {
  await ensureProductionTables(env.DB);
  const body = await readJson(request);
  if (!body || !body.id) return badRequest("id required");
  await env.DB.prepare(
    `UPDATE production_recipes SET is_active = 0, updated_at = ? WHERE id = ?`
  ).bind(now(), body.id).run();
  return json({ ok: true, id: body.id });
};

function safeParse(text) {
  try {
    const parsed = JSON.parse(text || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
