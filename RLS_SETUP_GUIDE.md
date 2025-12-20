# Row Level Security (RLS) Setup Guide

This guide will help you enable proper Row Level Security in your Supabase database to ensure data isolation between users.

## Overview

**Row Level Security (RLS)** is PostgreSQL's security feature that restricts which rows users can access based on policies. This is critical for multi-tenant applications where each user should only see their own data.

### Current Architecture

- **Backend (Express)**: Uses **service role key** → bypasses RLS (full access)
- **Frontend (Next.js)**: Uses **anon key** → respects RLS (restricted access)

## Why Enable RLS?

Currently, your database has "allow all" policies (development mode), which means:
- ❌ Any user can see all other users' data
- ❌ No data isolation between accounts
- ❌ Security vulnerability if anon key is exposed

After enabling RLS:
- ✅ Each user can only access their own data
- ✅ Admins can access all data
- ✅ Proper multi-tenant security

## Setup Instructions

### Step 1: Add user_id Columns (if needed)

First, check if your tables have `user_id` columns. If not, run:

```sql
-- In Supabase SQL Editor
\i add-user-id-columns.sql
```

This script will:
1. Add `user_id` column to all data tables
2. Create indexes for better performance
3. Show which records need user assignment

### Step 2: Assign Existing Data to Users

If you have existing data without `user_id`, you need to assign it to users:

```sql
-- Option A: Assign all to your admin user
UPDATE customers SET user_id = 1 WHERE user_id IS NULL;
UPDATE vendors SET user_id = 1 WHERE user_id IS NULL;
UPDATE products SET user_id = 1 WHERE user_id IS NULL;
UPDATE expenses SET user_id = 1 WHERE user_id IS NULL;
UPDATE invoices SET user_id = 1 WHERE user_id IS NULL;
UPDATE transactions SET user_id = 1 WHERE user_id IS NULL;

-- Option B: Delete unassigned data (careful!)
DELETE FROM customers WHERE user_id IS NULL;
-- ... repeat for other tables
```

### Step 3: Enable RLS Policies

Once all data has `user_id` assigned, enable RLS:

```sql
-- In Supabase SQL Editor
\i enable-rls-policies.sql
```

This script will:
1. Drop the old "allow all" policies
2. Enable RLS on all tables
3. Create secure policies based on user_id
4. Set up admin override policies
5. Verify the setup

### Step 4: Update Backend Code (Already Done!)

Your backend already uses the service role key, which bypasses RLS. This is correct!

**backend/server.js** uses:
```javascript
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

### Step 5: Verify Frontend Configuration (Already Done!)

Your frontend uses the anon key, which respects RLS. This is correct!

**lib/supabase.ts** uses:
```typescript
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Understanding the Policies

### User Data Policies

For tables with `user_id` (customers, vendors, products, expenses, invoices, transactions):

- **SELECT**: Users can view only their own records OR admin can view all
- **INSERT**: Users can only insert records with their own user_id
- **UPDATE**: Users can only update their own records
- **DELETE**: Users can only delete their own records

### Users Table Policies

- **SELECT**: Users can view only their own profile, admins can view all
- **UPDATE**: Users can update only their own profile
- **INSERT**: Only admins can create new users
- **DELETE**: Only admins can delete users

### Admin Tables (roles, permissions, etc.)

- **SELECT**: Everyone can view (needed for permission checks)
- **INSERT/UPDATE/DELETE**: Only admins

## Authentication Flow

Your app uses **custom JWT authentication**:

1. User logs in via `/api/auth/login` (backend)
2. Backend generates JWT token with `userId` and `role`
3. Frontend stores JWT in Supabase auth storage
4. Frontend makes requests with JWT in Authorization header
5. RLS policies check `auth.user_id()` from JWT

### Helper Functions

The RLS script creates these helper functions:

```sql
-- Get user ID from JWT token
auth.user_id() -- Returns the logged-in user's ID

-- Check if user is admin
auth.is_admin() -- Returns true if user has Admin role
```

## Testing RLS

### Test 1: Create Test Users

```sql
-- Create test users
INSERT INTO users (email, password, company_name, role, is_active)
VALUES 
  ('user1@test.com', 'hashed_password', 'Company 1', 'User', true),
  ('user2@test.com', 'hashed_password', 'Company 2', 'User', true);
```

### Test 2: Add Test Data

```sql
-- User 1's customer
INSERT INTO customers (name, email, user_id) 
VALUES ('Customer A', 'a@test.com', 1);

-- User 2's customer
INSERT INTO customers (name, email, user_id) 
VALUES ('Customer B', 'b@test.com', 2);
```

### Test 3: Login and Query

1. Login as User 1 via your app
2. Query customers - should only see "Customer A"
3. Login as User 2 via your app
4. Query customers - should only see "Customer B"

### Test 4: Admin Override

1. Login as Admin user
2. Query customers - should see both customers
3. Admin can manage all users' data

## Troubleshooting

### "JWT token invalid" errors

Make sure your backend is setting the JWT correctly:
```javascript
const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);
```

### "No rows returned" after enabling RLS

Check if:
1. User is authenticated (JWT token present)
2. Records have `user_id` assigned
3. `user_id` matches logged-in user's ID

### Backend can't access data

Backend should use **service role key**, not anon key:
```javascript
// ✅ Correct - bypasses RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ❌ Wrong - would be blocked by RLS
const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Frontend can access other users' data

This means:
1. RLS is not enabled, OR
2. Policies are too permissive, OR
3. Using service role key in frontend (NEVER do this!)

## Rollback (Emergency)

If something goes wrong, you can temporarily disable RLS:

```sql
-- Disable RLS (emergency only!)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
```

Then investigate the issue and re-enable with fixes.

## Production Checklist

Before going to production:

- [ ] All tables have `user_id` columns
- [ ] All existing data has `user_id` assigned
- [ ] RLS policies are enabled
- [ ] Backend uses service role key
- [ ] Frontend uses anon key (NOT service role!)
- [ ] Service role key is in `.env.local` (never committed)
- [ ] Tested login/logout flows
- [ ] Tested data isolation between users
- [ ] Tested admin can see all data
- [ ] Verified no unauthorized access possible

## Security Best Practices

1. **Never expose service role key** in frontend code
2. **Always use anon key** in client-side code
3. **Keep service role key** in server-side `.env.local` only
4. **Add `.env.local`** to `.gitignore`
5. **Rotate keys** if accidentally committed
6. **Monitor access logs** in Supabase dashboard
7. **Test RLS thoroughly** before production

## Files in This Setup

- `add-user-id-columns.sql` - Adds user_id to tables
- `enable-rls-policies.sql` - Enables RLS and creates policies
- `disable-rls.sql` - Emergency rollback (dev only)
- `.env.local` - Contains anon key and service role key
- `backend/server.js` - Uses service role key
- `lib/supabase.ts` - Uses anon key

## Support

For issues:
1. Check Supabase logs in dashboard
2. Run verification queries in SQL editor
3. Check browser console for errors
4. Verify JWT token contents

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
