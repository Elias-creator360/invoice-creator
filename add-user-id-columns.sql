-- Add user_id columns to tables for Row Level Security
-- Run this BEFORE enabling RLS policies if tables don't have user_id columns
-- This script is safe to run multiple times (uses IF NOT EXISTS checks)

-- ============================================
-- Add user_id column to customers table
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
    CREATE INDEX idx_customers_user_id ON customers(user_id);
    RAISE NOTICE '✅ Added user_id column to customers table';
  ELSE
    RAISE NOTICE '⏭️  user_id column already exists in customers table';
  END IF;
END $$;

-- ============================================
-- Add user_id column to vendors table
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE vendors ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
    CREATE INDEX idx_vendors_user_id ON vendors(user_id);
    RAISE NOTICE '✅ Added user_id column to vendors table';
  ELSE
    RAISE NOTICE '⏭️  user_id column already exists in vendors table';
  END IF;
END $$;

-- ============================================
-- Add user_id column to products table
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE products ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
    CREATE INDEX idx_products_user_id ON products(user_id);
    RAISE NOTICE '✅ Added user_id column to products table';
  ELSE
    RAISE NOTICE '⏭️  user_id column already exists in products table';
  END IF;
END $$;

-- ============================================
-- Add user_id column to expenses table
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
    CREATE INDEX idx_expenses_user_id ON expenses(user_id);
    RAISE NOTICE '✅ Added user_id column to expenses table';
  ELSE
    RAISE NOTICE '⏭️  user_id column already exists in expenses table';
  END IF;
END $$;

-- ============================================
-- Add user_id column to invoices table
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
    CREATE INDEX idx_invoices_user_id ON invoices(user_id);
    RAISE NOTICE '✅ Added user_id column to invoices table';
  ELSE
    RAISE NOTICE '⏭️  user_id column already exists in invoices table';
  END IF;
END $$;

-- ============================================
-- Add user_id column to transactions table
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;
    CREATE INDEX idx_transactions_user_id ON transactions(user_id);
    RAISE NOTICE '✅ Added user_id column to transactions table';
  ELSE
    RAISE NOTICE '⏭️  user_id column already exists in transactions table';
  END IF;
END $$;

-- ============================================
-- Optional: Assign existing data to a user
-- ============================================

-- Uncomment and modify the following section if you want to assign 
-- existing records to a specific user. Replace '1' with the actual user_id

/*
DO $$ 
DECLARE
  target_user_id BIGINT := 1; -- Change this to your admin user ID
BEGIN
  -- Check if the user exists
  IF EXISTS (SELECT 1 FROM users WHERE id = target_user_id) THEN
    UPDATE customers SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE vendors SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE products SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE expenses SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE invoices SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE transactions SET user_id = target_user_id WHERE user_id IS NULL;
    
    RAISE NOTICE '✅ Assigned all existing records to user_id: %', target_user_id;
  ELSE
    RAISE EXCEPTION '❌ User with id % does not exist', target_user_id;
  END IF;
END $$;
*/

-- ============================================
-- Make user_id NOT NULL (Optional - use with caution)
-- ============================================

-- Uncomment the following section ONLY if:
-- 1. All existing records have been assigned to users
-- 2. You want to enforce that every record must have an owner
-- 
-- WARNING: This will fail if any records still have NULL user_id

/*
DO $$ 
BEGIN
  -- Check if all records have user_id
  IF NOT EXISTS (SELECT 1 FROM customers WHERE user_id IS NULL) THEN
    ALTER TABLE customers ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE '✅ Made customers.user_id NOT NULL';
  ELSE
    RAISE NOTICE '⚠️  Cannot make customers.user_id NOT NULL - records with NULL user_id exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM vendors WHERE user_id IS NULL) THEN
    ALTER TABLE vendors ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE '✅ Made vendors.user_id NOT NULL';
  ELSE
    RAISE NOTICE '⚠️  Cannot make vendors.user_id NOT NULL - records with NULL user_id exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM products WHERE user_id IS NULL) THEN
    ALTER TABLE products ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE '✅ Made products.user_id NOT NULL';
  ELSE
    RAISE NOTICE '⚠️  Cannot make products.user_id NOT NULL - records with NULL user_id exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM expenses WHERE user_id IS NULL) THEN
    ALTER TABLE expenses ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE '✅ Made expenses.user_id NOT NULL';
  ELSE
    RAISE NOTICE '⚠️  Cannot make expenses.user_id NOT NULL - records with NULL user_id exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM invoices WHERE user_id IS NULL) THEN
    ALTER TABLE invoices ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE '✅ Made invoices.user_id NOT NULL';
  ELSE
    RAISE NOTICE '⚠️  Cannot make invoices.user_id NOT NULL - records with NULL user_id exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM transactions WHERE user_id IS NULL) THEN
    ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE '✅ Made transactions.user_id NOT NULL';
  ELSE
    RAISE NOTICE '⚠️  Cannot make transactions.user_id NOT NULL - records with NULL user_id exist';
  END IF;
END $$;
*/

-- ============================================
-- Verification
-- ============================================

-- Show all tables with user_id column
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND column_name = 'user_id'
ORDER BY table_name;

-- Show count of records without user_id (NULL values)
DO $$ 
DECLARE
  null_customers INT;
  null_vendors INT;
  null_products INT;
  null_expenses INT;
  null_invoices INT;
  null_transactions INT;
BEGIN
  SELECT COUNT(*) INTO null_customers FROM customers WHERE user_id IS NULL;
  SELECT COUNT(*) INTO null_vendors FROM vendors WHERE user_id IS NULL;
  SELECT COUNT(*) INTO null_products FROM products WHERE user_id IS NULL;
  SELECT COUNT(*) INTO null_expenses FROM expenses WHERE user_id IS NULL;
  SELECT COUNT(*) INTO null_invoices FROM invoices WHERE user_id IS NULL;
  SELECT COUNT(*) INTO null_transactions FROM transactions WHERE user_id IS NULL;
  
  RAISE NOTICE '📊 Records without user_id:';
  RAISE NOTICE '   Customers: %', null_customers;
  RAISE NOTICE '   Vendors: %', null_vendors;
  RAISE NOTICE '   Products: %', null_products;
  RAISE NOTICE '   Expenses: %', null_expenses;
  RAISE NOTICE '   Invoices: %', null_invoices;
  RAISE NOTICE '   Transactions: %', null_transactions;
  
  IF (null_customers + null_vendors + null_products + null_expenses + null_invoices + null_transactions) > 0 THEN
    RAISE NOTICE '⚠️  Warning: You have records without user_id. Assign them to users before enabling strict RLS.';
  ELSE
    RAISE NOTICE '✅ All records have user_id assigned. Ready for RLS!';
  END IF;
END $$;

-- Final message
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Assign existing records to users (uncomment section above)';
  RAISE NOTICE '   2. Run enable-rls-policies.sql to enable Row Level Security';
  RAISE NOTICE '   3. Test with frontend using anon key';
  RAISE NOTICE '========================================';
END $$;
