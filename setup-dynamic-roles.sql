-- Complete Setup Script for Dynamic Roles System
-- Run this in your Supabase SQL Editor to enable full dynamic role support

-- Step 1: Remove role constraint from users table (if it exists)
-- Note: Supabase may not have this constraint, but we ensure it's removed

-- First check if we need to modify the table
DO $$ 
BEGIN
    -- Try to alter the table to remove any CHECK constraint on role column
    -- This is safe even if the constraint doesn't exist
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
EXCEPTION 
    WHEN undefined_object THEN
        -- Constraint doesn't exist, that's fine
        NULL;
END $$;

-- Step 2: Ensure the role_permissions table exists and has the correct structure
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role TEXT NOT NULL,
  feature TEXT NOT NULL,
  feature_path TEXT NOT NULL,
  access_level TEXT NOT NULL CHECK(access_level IN ('none', 'view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, feature)
);

-- Step 3: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_feature ON role_permissions(feature);

-- Step 4: Insert/Update Admin role permissions (full access to everything)
INSERT INTO role_permissions (role, feature, feature_path, access_level) VALUES
('Admin', 'Dashboard', '/dashboard', 'edit'),
('Admin', 'Customers', '/dashboard/customers', 'edit'),
('Admin', 'Products', '/dashboard/products', 'edit'),
('Admin', 'Invoices', '/dashboard/invoices', 'edit'),
('Admin', 'Expenses', '/dashboard/expenses', 'edit'),
('Admin', 'Vendors', '/dashboard/vendors', 'edit'),
('Admin', 'Transactions', '/dashboard/transactions', 'edit'),
('Admin', 'Reports', '/dashboard/reports', 'edit'),
('Admin', 'Admin Panel', '/dashboard/admin', 'edit')
ON CONFLICT (role, feature) DO UPDATE SET
  access_level = EXCLUDED.access_level,
  updated_at = NOW();

-- Step 5: Insert/Update User role permissions (limited access)
INSERT INTO role_permissions (role, feature, feature_path, access_level) VALUES
('User', 'Dashboard', '/dashboard', 'view'),
('User', 'Customers', '/dashboard/customers', 'edit'),
('User', 'Products', '/dashboard/products', 'edit'),
('User', 'Invoices', '/dashboard/invoices', 'edit'),
('User', 'Expenses', '/dashboard/expenses', 'edit'),
('User', 'Vendors', '/dashboard/vendors', 'view'),
('User', 'Transactions', '/dashboard/transactions', 'view'),
('User', 'Reports', '/dashboard/reports', 'view'),
('User', 'Admin Panel', '/dashboard/admin', 'none')
ON CONFLICT (role, feature) DO UPDATE SET
  access_level = EXCLUDED.access_level,
  updated_at = NOW();

-- Step 6: Insert/Update CR Representative role permissions
INSERT INTO role_permissions (role, feature, feature_path, access_level) VALUES
  -- Dashboard - View only
  ('CR Representative', 'Dashboard', '/dashboard', 'view'),
  
  -- Customers - Edit access (full access)
  ('CR Representative', 'Customers', '/dashboard/customers', 'edit'),
  
  -- Products - View only (can see products when creating invoices)
  ('CR Representative', 'Products', '/dashboard/products', 'view'),
  
  -- Invoices - View only (can see customer invoices)
  ('CR Representative', 'Invoices', '/dashboard/invoices', 'view'),
  
  -- Expenses - No access
  ('CR Representative', 'Expenses', '/dashboard/expenses', 'none'),
  
  -- Vendors - No access
  ('CR Representative', 'Vendors', '/dashboard/vendors', 'none'),
  
  -- Transactions - No access
  ('CR Representative', 'Transactions', '/dashboard/transactions', 'none'),
  
  -- Reports - View only
  ('CR Representative', 'Reports', '/dashboard/reports', 'view'),
  
  -- Admin Panel - No access
  ('CR Representative', 'Admin Panel', '/dashboard/admin', 'none')
ON CONFLICT (role, feature) DO UPDATE SET
  access_level = EXCLUDED.access_level,
  updated_at = NOW();

-- Step 7: Verify the setup
SELECT 
  role,
  COUNT(*) as permission_count,
  COUNT(CASE WHEN access_level = 'edit' THEN 1 END) as edit_count,
  COUNT(CASE WHEN access_level = 'view' THEN 1 END) as view_count,
  COUNT(CASE WHEN access_level = 'none' THEN 1 END) as none_count
FROM role_permissions
GROUP BY role
ORDER BY 
  CASE 
    WHEN role = 'Admin' THEN 1
    WHEN role = 'User' THEN 2
    ELSE 3
  END,
  role;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'Dynamic roles system setup complete!';
  RAISE NOTICE 'You can now:';
  RAISE NOTICE '1. Create users with any role (Admin, User, CR Representative, etc.)';
  RAISE NOTICE '2. Create new custom roles via the Admin Panel';
  RAISE NOTICE '3. Modify permissions for any role dynamically';
  RAISE NOTICE '';
  RAISE NOTICE 'Current roles configured:';
END $$;

SELECT DISTINCT role FROM role_permissions ORDER BY role;
