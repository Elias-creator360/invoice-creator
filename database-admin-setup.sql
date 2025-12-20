-- Admin Panel Database Setup
-- This script creates tables for managing roles and permissions

-- 1. Create roles table (custom roles beyond Admin/User)
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_system INTEGER DEFAULT 0, -- 1 for Admin/User, 0 for custom roles
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create permissions table (defines what pages can be accessed)
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_name TEXT NOT NULL, -- dashboard, customers, invoices, etc.
  page_path TEXT NOT NULL, -- /dashboard, /dashboard/customers, etc.
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create role_permissions table (links roles to permissions with access level)
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  access_level TEXT NOT NULL CHECK(access_level IN ('none', 'view', 'edit')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- 4. Create user_roles table (maps users to roles - many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  assigned_by INTEGER, -- user_id of admin who assigned the role
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  UNIQUE(user_id, role_id)
);

-- 5. Insert default system roles
INSERT OR IGNORE INTO roles (id, name, description, is_system) VALUES
(1, 'Admin', 'Full system access with all permissions', 1),
(2, 'User', 'Standard user with basic permissions', 1),
(3, 'Manager', 'Manager with extended permissions', 0),
(4, 'Accountant', 'Financial data access only', 0),
(5, 'Sales', 'Customer and invoice management', 0);

-- 6. Insert default permissions (pages in the system)
INSERT OR IGNORE INTO permissions (page_name, page_path, description) VALUES
('Dashboard', '/dashboard', 'Main dashboard with statistics'),
('Customers', '/dashboard/customers', 'Customer management'),
('Products', '/dashboard/products', 'Product catalog management'),
('Invoices', '/dashboard/invoices', 'Invoice creation and management'),
('Expenses', '/dashboard/expenses', 'Expense tracking'),
('Vendors', '/dashboard/vendors', 'Vendor management'),
('Transactions', '/dashboard/transactions', 'Transaction history'),
('Reports', '/dashboard/reports', 'Financial reports'),
('Admin Panel', '/dashboard/admin', 'User and role management');

-- 7. Set up default permissions for Admin role (full access to everything)
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, access_level)
SELECT 1, id, 'edit' FROM permissions;

-- 8. Set up default permissions for User role (view most, edit some)
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, access_level)
SELECT 2, id, 
  CASE 
    WHEN page_name IN ('Dashboard', 'Reports', 'Transactions') THEN 'view'
    WHEN page_name IN ('Customers', 'Products', 'Invoices', 'Expenses', 'Vendors') THEN 'edit'
    WHEN page_name = 'Admin Panel' THEN 'none'
    ELSE 'view'
  END
FROM permissions;

-- 9. Set up permissions for Manager role
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, access_level)
SELECT 3, id,
  CASE 
    WHEN page_name = 'Admin Panel' THEN 'none'
    ELSE 'edit'
  END
FROM permissions;

-- 10. Set up permissions for Accountant role (financial focus)
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, access_level)
SELECT 4, id,
  CASE 
    WHEN page_name IN ('Expenses', 'Transactions', 'Reports', 'Invoices') THEN 'edit'
    WHEN page_name IN ('Dashboard', 'Customers', 'Vendors') THEN 'view'
    WHEN page_name IN ('Products', 'Admin Panel') THEN 'none'
    ELSE 'view'
  END
FROM permissions;

-- 11. Set up permissions for Sales role (customer and invoice focus)
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, access_level)
SELECT 5, id,
  CASE 
    WHEN page_name IN ('Customers', 'Invoices', 'Products') THEN 'edit'
    WHEN page_name IN ('Dashboard', 'Reports') THEN 'view'
    WHEN page_name IN ('Expenses', 'Vendors', 'Transactions', 'Admin Panel') THEN 'none'
    ELSE 'view'
  END
FROM permissions;

-- 12. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- 13. Create view for easy permission checking
CREATE VIEW IF NOT EXISTS user_permissions AS
SELECT 
  u.id as user_id,
  u.email,
  r.name as role_name,
  p.page_name,
  p.page_path,
  rp.access_level
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.is_active = 1;

-- Verify tables were created
SELECT 'Tables created successfully!' as status;
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('roles', 'permissions', 'role_permissions', 'user_roles');
