-- Remove CHECK constraint from users table to allow dynamic roles
-- This allows roles like 'CR Representative', 'Manager', 'Accountant', etc.

-- First, create a new table without the constraint
CREATE TABLE users_new (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  company_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'User' NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Copy data from old table to new table
INSERT INTO users_new (id, email, password, company_name, first_name, last_name, role, is_active, last_login, created_at, updated_at)
SELECT id, email, password, company_name, first_name, last_name, role, is_active, last_login, created_at, 
       COALESCE(updated_at, created_at) as updated_at
FROM users;

-- Drop old table
DROP TABLE users;

-- Rename new table to users
ALTER TABLE users_new RENAME TO users;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update sequence to continue from current max id
SELECT setval('users_new_id_seq', (SELECT MAX(id) FROM users));
