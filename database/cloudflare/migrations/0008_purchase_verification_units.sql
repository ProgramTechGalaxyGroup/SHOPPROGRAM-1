-- Purchase verification flow and purchase-unit audit fields.
-- Pending buyer receipts keep purchase_orders.status='draft' so the original
-- status CHECK remains compatible; verification_status stores the real workflow.

ALTER TABLE purchase_orders ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'verified';
ALTER TABLE purchase_orders ADD COLUMN source_request_ids TEXT;
ALTER TABLE purchase_orders ADD COLUMN verified_at INTEGER;
ALTER TABLE purchase_orders ADD COLUMN verified_by TEXT;

ALTER TABLE purchase_order_items ADD COLUMN purchase_qty REAL;
ALTER TABLE purchase_order_items ADD COLUMN purchase_unit TEXT;
ALTER TABLE purchase_order_items ADD COLUMN purchase_unit_cost INTEGER;

ALTER TABLE purchase_component_items ADD COLUMN purchase_qty REAL;
ALTER TABLE purchase_component_items ADD COLUMN purchase_unit TEXT;
ALTER TABLE purchase_component_items ADD COLUMN purchase_unit_cost INTEGER;
