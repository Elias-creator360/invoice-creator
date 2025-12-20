-- Migration script to add user roles to existing database
-- This script adds role management columns to the users table

-- Add role column (default: User)
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'User' CHECK(role IN ('Admin', 'User'));

-- Add is_active column (default: 1 for active)
ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;

-- Add last_login timestamp
ALTER TABLE users ADD COLUMN last_login DATETIME;

-- Update existing users to have 'Admin' role (first user should be admin)
-- You can manually update specific users after running this
UPDATE users SET role = 'Admin' WHERE id = 1;

-- Verify the changes
SELECT id, email, company_name, role, is_active, last_login, created_at FROM users;
