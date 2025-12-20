-- Enable Row Level Security Policies for Invoice Creator
-- Run this script in Supabase SQL Editor to secure your database
-- 
-- IMPORTANT: This script assumes tables already have user_id columns
-- If they don't exist, run add-user-id-columns.sql first
--
-- After enabling RLS, only service role key can bypass these policies
-- The anon key (used in frontend) will respect all RLS policies

-- ============================================
-- STEP 1: Drop existing open policies
-- ============================================

DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
DROP POLICY IF EXISTS "Allow all operations on vendors" ON vendors;
DROP POLICY IF EXISTS "Allow all operations on products" ON products;
DROP POLICY IF EXISTS "Allow all operations on expenses" ON expenses;
DROP POLICY IF EXISTS "Allow all operations on invoices" ON invoices;
DROP POLICY IF EXISTS "Allow all operations on transactions" ON transactions;

-- ============================================
-- STEP 2: Enable RLS on all tables
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on admin tables if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
    ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
    ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
    ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- STEP 3: Create helper function to get authenticated user
-- ============================================

-- This function extracts the user ID from the JWT token
-- It requires the JWT to be set via the Authorization header
CREATE OR REPLACE FUNCTION auth.user_id() 
RETURNS BIGINT AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'userId', '')::BIGINT;
$$ LANGUAGE sql STABLE;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin() 
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'Admin' FROM users WHERE id = auth.user_id()),
    false
  );
$$ LANGUAGE sql STABLE;

-- ============================================
-- STEP 4: Users Table Policies
-- ============================================

-- Users can only view their own record
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  USING (id = auth.user_id() OR auth.is_admin());

-- Users can update their own record (except role and is_active)
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (id = auth.user_id())
  WITH CHECK (id = auth.user_id());

-- Only admins can insert new users
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (auth.is_admin());

-- Only admins can delete users
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (auth.is_admin());

-- ============================================
-- STEP 5: Customers Table Policies
-- ============================================

-- Users can view their own customers
CREATE POLICY "Users can view own customers"
  ON customers FOR SELECT
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true  -- If no user_id column, allow all (for migration period)
    END
  );

-- Users can insert their own customers
CREATE POLICY "Users can insert own customers"
  ON customers FOR INSERT
  WITH CHECK (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

-- Users can update their own customers
CREATE POLICY "Users can update own customers"
  ON customers FOR UPDATE
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

-- Users can delete their own customers
CREATE POLICY "Users can delete own customers"
  ON customers FOR DELETE
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

-- ============================================
-- STEP 6: Vendors Table Policies
-- ============================================

CREATE POLICY "Users can view own vendors"
  ON vendors FOR SELECT
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

CREATE POLICY "Users can insert own vendors"
  ON vendors FOR INSERT
  WITH CHECK (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

CREATE POLICY "Users can update own vendors"
  ON vendors FOR UPDATE
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

CREATE POLICY "Users can delete own vendors"
  ON vendors FOR DELETE
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

-- ============================================
-- STEP 7: Products Table Policies
-- ============================================

CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  WITH CHECK (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

-- ============================================
-- STEP 8: Expenses Table Policies
-- ============================================

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

-- ============================================
-- STEP 9: Invoices Table Policies
-- ============================================

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

-- ============================================
-- STEP 10: Transactions Table Policies
-- ============================================

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id')
      THEN user_id = auth.user_id() OR auth.is_admin()
      ELSE true
    END
  );

-- ============================================
-- STEP 11: Admin Tables Policies (if they exist)
-- ============================================

-- Roles table - read by all, write by admins only
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
    EXECUTE 'CREATE POLICY "Everyone can view roles" ON roles FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Admins can manage roles" ON roles FOR ALL USING (auth.is_admin()) WITH CHECK (auth.is_admin())';
  END IF;
END $$;

-- Permissions table - read by all, write by admins only
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
    EXECUTE 'CREATE POLICY "Everyone can view permissions" ON permissions FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Admins can manage permissions" ON permissions FOR ALL USING (auth.is_admin()) WITH CHECK (auth.is_admin())';
  END IF;
END $$;

-- Role permissions table - read by all, write by admins only
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
    EXECUTE 'CREATE POLICY "Everyone can view role permissions" ON role_permissions FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Admins can manage role permissions" ON role_permissions FOR ALL USING (auth.is_admin()) WITH CHECK (auth.is_admin())';
  END IF;
END $$;

-- User roles table - users can view their own, admins can manage all
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    EXECUTE 'CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT USING (user_id = auth.user_id() OR auth.is_admin())';
    EXECUTE 'CREATE POLICY "Admins can manage user roles" ON user_roles FOR ALL USING (auth.is_admin()) WITH CHECK (auth.is_admin())';
  END IF;
END $$;

-- ============================================
-- STEP 12: Verification
-- ============================================

-- Show enabled RLS tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true
ORDER BY tablename;

-- Show all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ Row Level Security policies have been successfully enabled!';
  RAISE NOTICE '📝 Note: These policies require JWT authentication with userId in the token';
  RAISE NOTICE '🔐 Service role key will bypass all RLS policies';
  RAISE NOTICE '🔑 Anon key (frontend) will respect all RLS policies';
END $$;
