-- Remove role check constraint from users table to allow custom roles
-- This allows any role name to be stored in the users table

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Verify the constraint was removed
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname LIKE '%role%';
