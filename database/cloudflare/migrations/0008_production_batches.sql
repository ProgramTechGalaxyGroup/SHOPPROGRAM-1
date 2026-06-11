PRAGMA foreign_keys = ON;

ALTER TABLE components ADD COLUMN item_type TEXT NOT NULL DEFAULT 'raw_material';
ALTER TABLE components ADD COLUMN cost_per_unit INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS production_recipes (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  output_component_id TEXT NOT NULL REFERENCES components(id),
  planned_output_qty  REAL NOT NULL,
  output_unit         TEXT NOT NULL,
  inputs_json         TEXT NOT NULL,
  note                TEXT,
  is_active           INTEGER NOT NULL DEFAULT 1,
  updated_at          INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_production_recipes_output
  ON production_recipes(output_component_id);

CREATE TABLE IF NOT EXISTS production_batches (
  id                   TEXT PRIMARY KEY,
  recipe_id            TEXT NOT NULL REFERENCES production_recipes(id),
  output_component_id  TEXT NOT NULL REFERENCES components(id),
  planned_output_qty   REAL NOT NULL,
  actual_output_qty    REAL NOT NULL,
  output_unit          TEXT NOT NULL,
  total_input_cost     INTEGER NOT NULL DEFAULT 0,
  actual_cost_per_unit INTEGER NOT NULL DEFAULT 0,
  note                 TEXT,
  created_at           INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_production_batches_recipe
  ON production_batches(recipe_id, created_at);

CREATE INDEX IF NOT EXISTS idx_production_batches_output
  ON production_batches(output_component_id, created_at);
