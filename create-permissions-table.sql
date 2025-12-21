-- Create role_permissions table in Supabase to manage access control
-- This table stores which features each role can access and their access level

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

-- Insert default permissions for Admin (full access to everything)
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
ON CONFLICT (role, feature) DO NOTHING;

-- Insert default permissions for User (limited access)
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
ON CONFLICT (role, feature) DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- Enable RLS (Row Level Security) - Optional: disable if using service role key
-- ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Note: Since this app uses custom JWT auth (not Supabase Auth), 
-- we're not enabling RLS policies. The backend API handles authorization.
-- If you want to enable RLS, you'll need to set up custom claims in your JWT tokens.
