# Dynamic Roles System - Setup & Testing Guide

## What Was Fixed

The system has been updated to support **dynamic roles** instead of being hardcoded to only "Admin" and "User". Now you can:

✅ Create custom roles like "CR Representative", "Manager", "Accountant", etc.
✅ Assign any role to users
✅ Modify permissions for any role dynamically via the Admin Panel
✅ Permissions automatically apply based on role assignments

## Changes Made

### 1. **Frontend Type System** 
- Updated `lib/auth.tsx` - Role type changed from `'Admin' | 'User'` to `string`
- Updated `lib/admin-types.ts` - All role types now accept any string
- Alert component exists (no longer an error)

### 2. **Backend API** (`backend/server.js`)
- ✅ Removed hardcoded role validation in `/api/auth/register`
- ✅ Made `/api/admin/roles/:id` dynamically fetch role names
- ✅ Made `/api/admin/roles/:id/permissions` work with any role
- ✅ Made `/api/admin/roles` endpoint fetch all unique roles from database
- ✅ Updated delete role endpoint to work dynamically

### 3. **Admin Panel** (`app/dashboard/admin/page.tsx`)
- Already uses dynamic role fetching
- Role dropdown automatically populated from database
- No hardcoded role references

### 4. **Database Schema**
- Created `setup-dynamic-roles.sql` - Complete setup script
- Includes CR Representative role with proper permissions
- Removes any role constraints

## Setup Instructions

### Step 1: Run the Database Setup Script

In your **Supabase SQL Editor**, run the complete setup script:

```bash
# The file is located at:
setup-dynamic-roles.sql
```

This script will:
- Remove any role constraints from the users table
- Ensure role_permissions table exists
- Insert Admin, User, and CR Representative roles with their permissions
- Create necessary indexes
- Display a summary of configured roles

### Step 2: Verify Database Setup

After running the script, verify by running this query in Supabase:

```sql
SELECT role, feature, access_level 
FROM role_permissions 
WHERE role = 'CR Representative'
ORDER BY feature;
```

You should see 9 rows with these permissions:
- Dashboard: view
- Customers: edit ✅
- Products: view
- Invoices: view
- Expenses: none
- Vendors: none
- Transactions: none
- Reports: view
- Admin Panel: none

### Step 3: Restart Your Backend Server

The backend needs to be restarted to load the new code:

```powershell
# Stop the current server (Ctrl+C)
# Then run:
npm run server
```

### Step 4: Restart Your Frontend

```powershell
# Stop the current dev server (Ctrl+C)
# Then run:
npm run dev
```

## Testing the CR Representative Role

### Option 1: Create via Admin Panel

1. Login as an Admin user
2. Navigate to `/dashboard/admin`
3. Go to "Users" tab
4. Click "Create User"
5. Fill in the form:
   - Email: `rep@test.com`
   - Password: `password123`
   - Company Name: `Test Company`
   - **Role: Select "CR Representative"** from dropdown
   - Check "Active"
6. Click "Create"

### Option 2: Create via API/Database

Run this in Supabase SQL Editor:

```sql
-- Insert a test CR Representative user
INSERT INTO users (email, password, company_name, role, is_active)
VALUES (
  'cr-rep@test.com',
  '$2a$10$abcdefghijklmnopqrstuv', -- This is a hashed password
  'Test Company',
  'CR Representative',
  TRUE
);

-- Note: For a real password hash, use the admin panel or register endpoint
```

### Option 3: Update Existing User

Update an existing user's role:

```sql
UPDATE users 
SET role = 'CR Representative'
WHERE email = 'your-test-user@example.com';
```

## Expected Behavior

When logged in as a **CR Representative**, the user should see:

### ✅ Visible in Sidebar:
- Dashboard (view only)
- Customers (full edit access)
- Products (view only)
- Invoices (view only)
- Reports (view only)

### ❌ Hidden from Sidebar:
- Expenses (no access)
- Vendors (no access)
- Transactions (no access)
- Admin Panel (no access)

### Access Restrictions:
- **Customers Page**: Can create, edit, delete customers
- **Dashboard**: Can view but no edit buttons
- **Products**: Can view products but no add/edit/delete buttons
- **Invoices**: Can view invoices but no create/edit/delete buttons
- **Reports**: Can view reports
- **Expenses, Vendors, Transactions**: Redirected to dashboard if they try to access

## Creating New Custom Roles

You can now create custom roles dynamically:

### Via Admin Panel:
1. Login as Admin
2. Go to Admin Panel → Roles tab
3. Click "Create Role"
4. Enter role name (e.g., "Sales Manager")
5. Enter description
6. Click Create
7. Go to "Permissions" tab
8. Select the new role
9. Configure permissions for each feature
10. Click "Update Permissions"

### Via API:

```javascript
// Create a new role
POST /api/admin/roles
{
  "name": "Sales Manager",
  "description": "Manages sales team and customer relationships"
}

// Then update its permissions
PUT /api/admin/roles/:id/permissions
{
  "permissions": [
    { "permission_id": 1, "access_level": "view" },  // Dashboard
    { "permission_id": 2, "access_level": "edit" },  // Customers
    // ... etc
  ]
}
```

## Modifying Role Permissions

To change what a role can access:

1. Login as Admin
2. Go to Admin Panel → Permissions tab
3. Select the role from dropdown (Admin, User, CR Representative, etc.)
4. For each feature, select access level:
   - **None**: Hidden from sidebar, redirects if accessed
   - **View**: Visible in sidebar, read-only access
   - **Edit**: Visible in sidebar, full CRUD access
5. Click "Update Permissions"
6. Changes take effect immediately (users may need to refresh)

## Troubleshooting

### Issue: CR Representative role not showing in dropdown
**Solution**: Run `setup-dynamic-roles.sql` in Supabase to create the role permissions

### Issue: User can't see features they should have access to
**Solution**: 
1. Check role_permissions table: `SELECT * FROM role_permissions WHERE role = 'CR Representative'`
2. Verify user has correct role: `SELECT email, role FROM users WHERE email = 'user@example.com'`
3. Clear browser cache and refresh
4. User may need to logout and login again

### Issue: Backend returns 401 or 403 errors
**Solution**: 
1. Restart backend server
2. Check that JWT token is valid (login again)
3. Verify admin middleware in backend is checking role correctly

### Issue: "Cannot read properties of undefined"
**Solution**: 
1. Ensure `setup-dynamic-roles.sql` was run completely
2. Check that all 9 features exist in role_permissions for each role
3. Restart both frontend and backend

## Verification Checklist

- [ ] Ran `setup-dynamic-roles.sql` in Supabase
- [ ] Backend server restarted
- [ ] Frontend dev server restarted
- [ ] Can see "CR Representative" in role dropdown when creating users
- [ ] Created test user with CR Representative role
- [ ] Logged in as CR Representative user
- [ ] Sidebar only shows: Dashboard, Customers, Products, Invoices, Reports
- [ ] Can fully edit customers
- [ ] Can view but not edit other features
- [ ] Cannot access Expenses, Vendors, Transactions
- [ ] Cannot access Admin Panel

## Additional Notes

- All role changes are stored in the `role_permissions` table in Supabase
- Permissions are checked on every page load via `usePermissions()` hook
- Backend validates permissions for API calls via `/api/auth/permissions` endpoint
- System roles (Admin, User) are protected and cannot be deleted
- Custom roles can be created, modified, and deleted via Admin Panel

## Success! 🎉

Your invoice creator now supports dynamic roles. You can create any role with any permission combination, and the system will automatically enforce those permissions across the UI and API.
