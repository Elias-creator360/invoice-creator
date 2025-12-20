-- Disable Row Level Security for development
-- Run this in Supabase SQL Editor

-- Disable RLS on all main tables
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Note: This is for development only
-- In production, you should create proper RLS policies
