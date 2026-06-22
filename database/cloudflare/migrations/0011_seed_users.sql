-- Seed users table with default accounts matching JS/Python mock servers

INSERT OR IGNORE INTO users (id, email, password_hash, role, full_name, is_active, created_at, updated_at) VALUES
  ('usr_admin', 'admin@shopprogram.local', '9e19e51e88c9fcf0beffff3c723e9b400117df6c841505a8725632ad74c3ecb8', 'admin', 'Default Admin', 1, 1781613889044, 1781613889044),
  ('usr_manager', 'manager@shopprogram.local', '38dff1c3dda8345352245ce53a4ebe764b87470f8c8ad43d805f5096129b235d', 'manager', 'Default Manager', 1, 1781613889044, 1781613889044),
  ('usr_cashier', 'cashier@shopprogram.local', 'edae5c97f5aa3b493ddee3164ef2a046b101aa241cdee00f3c8afc3aafc0b24a', 'cashier', 'Default Cashier', 1, 1781613889044, 1781613889044),
  ('usr_inventory', 'inventory@shopprogram.local', '1f2c46ca072a2dad5ff1449d38177edd4cbd2d1c6a2c8bfae123f1b8f2c0212c', 'inventory', 'Default Inventory Staff', 1, 1781613889044, 1781613889044),
  ('usr_accountant', 'accountant@shopprogram.local', '004c7ef32e73a8852e845d26b9d6eeebf9f80c5eab1d3dffe6cd6d925aea07c2', 'accountant', 'Default Accountant', 1, 1781613889044, 1781613889044);
