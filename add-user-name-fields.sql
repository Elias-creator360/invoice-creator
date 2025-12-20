-- Add first_name and last_name columns to users table
-- Run this in Supabase SQL Editor

-- Add first_name column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE users ADD COLUMN first_name TEXT;
    RAISE NOTICE '✅ Added first_name column to users table';
  ELSE
    RAISE NOTICE '⏭️  first_name column already exists in users table';
  END IF;
END $$;

-- Add last_name column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE users ADD COLUMN last_name TEXT;
    RAISE NOTICE '✅ Added last_name column to users table';
  ELSE
    RAISE NOTICE '⏭️  last_name column already exists in users table';
  END IF;
END $$;

-- Optional: Migrate existing company_name to first_name/last_name
-- Uncomment if you want to split company names into first/last names
/*
UPDATE users 
SET 
  first_name = SPLIT_PART(company_name, ' ', 1),
  last_name = CASE 
    WHEN POSITION(' ' IN company_name) > 0 
    THEN SUBSTRING(company_name FROM POSITION(' ' IN company_name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL;
*/

-- Verification
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('first_name', 'last_name', 'company_name')
ORDER BY column_name;

-- Show current users
SELECT id, email, first_name, last_name, company_name, role 
FROM users 
ORDER BY created_at DESC
LIMIT 10;

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ User name fields migration complete!';
  RAISE NOTICE '📝 first_name and last_name columns added';
  RAISE NOTICE '========================================';
END $$;
