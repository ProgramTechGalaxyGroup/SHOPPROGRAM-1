-- Allow purchase orders to receive ingredient/component stock directly.
-- Product purchase lines stay in purchase_order_items so old reports remain compatible.

CREATE TABLE IF NOT EXISTS purchase_component_items (
  id             TEXT PRIMARY KEY,
  purchase_id    TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  component_id   TEXT NOT NULL REFERENCES components(id),
  component_name TEXT,
  qty            REAL NOT NULL,
  unit           TEXT,
  unit_cost      INTEGER NOT NULL,
  subtotal       INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_po_component_items_purchase
  ON purchase_component_items(purchase_id);

CREATE INDEX IF NOT EXISTS idx_po_component_items_component
  ON purchase_component_items(component_id);

CREATE TABLE IF NOT EXISTS component_stock_movements (
  id            TEXT PRIMARY KEY,
  component_id  TEXT NOT NULL REFERENCES components(id),
  movement_type TEXT NOT NULL,
  qty_change    REAL NOT NULL,
  unit_cost     INTEGER,
  ref_type      TEXT,
  ref_id        TEXT,
  note          TEXT,
  created_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_component_mov_component
  ON component_stock_movements(component_id, created_at);

CREATE INDEX IF NOT EXISTS idx_component_mov_ref
  ON component_stock_movements(ref_type, ref_id);
