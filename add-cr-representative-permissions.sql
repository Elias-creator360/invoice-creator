-- Add permissions for CR Representative role
-- This role should have edit access to Customers and view access to Dashboard

-- Insert permissions for CR Representative role
INSERT INTO role_permissions (role, feature, feature_path, access_level, created_at, updated_at)
VALUES
  -- Dashboard - View only
  ('CR Representative', 'Dashboard', '/dashboard', 'view', NOW(), NOW()),
  
  -- Customers - Edit access (full access)
  ('CR Representative', 'Customers', '/dashboard/customers', 'edit', NOW(), NOW()),
  
  -- Products - View only (can see products when creating invoices)
  ('CR Representative', 'Products', '/dashboard/products', 'view', NOW(), NOW()),
  
  -- Invoices - View only (can see customer invoices)
  ('CR Representative', 'Invoices', '/dashboard/invoices', 'view', NOW(), NOW()),
  
  -- Expenses - No access
  ('CR Representative', 'Expenses', '/dashboard/expenses', 'none', NOW(), NOW()),
  
  -- Vendors - No access
  ('CR Representative', 'Vendors', '/dashboard/vendors', 'none', NOW(), NOW()),
  
  -- Transactions - No access
  ('CR Representative', 'Transactions', '/dashboard/transactions', 'none', NOW(), NOW()),
  
  -- Reports - View only
  ('CR Representative', 'Reports', '/dashboard/reports', 'view', NOW(), NOW()),
  
  -- Admin Panel - No access
  ('CR Representative', 'Admin Panel', '/dashboard/admin', 'none', NOW(), NOW())

ON CONFLICT (role, feature) 
DO UPDATE SET 
  access_level = EXCLUDED.access_level,
  updated_at = NOW();
