# Permission Configuration Guide

## Overview
This guide explains how to configure and manage permissions for users in the invoice management system.

## Permission Levels

The system uses three permission levels:

| Level | Sidebar | Page Access | Actions | Use Case |
|-------|---------|-------------|---------|----------|
| **none** | Hidden | Blocked (redirects) | None | User has no access |
| **view** | Visible | Allowed | Read-only | User can view but not modify |
| **edit** | Visible | Allowed | Full access | User can create, edit, delete |

## Available Features

The following features can have permissions configured:

1. **Dashboard** - `/dashboard`
2. **Customers** - `/dashboard/customers`
3. **Products** - `/dashboard/products`
4. **Invoices** - `/dashboard/invoices`
5. **Expenses** - `/dashboard/expenses`
6. **Vendors** - `/dashboard/vendors`
7. **Transactions** - `/dashboard/transactions`
8. **Reports** - `/dashboard/reports`
9. **Admin Panel** - `/dashboard/admin` (Admin only)

## Configuration Methods

### Method 1: Using Admin Panel (Recommended)

1. **Login as Admin**
   - Navigate to `/dashboard/admin`

2. **Go to Roles & Permissions Tab**
   - Click on "Roles & Permissions"

3. **Select Role to Edit**
   - Choose from: Admin, User, Manager, Accountant, Sales, etc.

4. **Set Permissions**
   - For each feature, select access level:
     - None (no access)
     - View (read-only)
     - Edit (full access)

5. **Save Changes**
   - Click "Update Permissions"
   - Changes take effect immediately for new logins

### Method 2: Direct Database Update

#### Using Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Open your project
   - Navigate to Table Editor
   - Select `role_permissions` table

2. **Find the permission row**
   ```sql
   WHERE role = 'User' AND feature = 'Customers'
   ```

3. **Update access_level**
   - Change value to: `none`, `view`, or `edit`

4. **Save**

#### Using SQL

```sql
-- Give User role edit access to Customers
UPDATE role_permissions 
SET access_level = 'edit' 
WHERE role = 'User' AND feature = 'Customers';

-- Give User role view access to Invoices
UPDATE role_permissions 
SET access_level = 'view' 
WHERE role = 'User' AND feature = 'Invoices';

-- Remove User role access to Expenses
UPDATE role_permissions 
SET access_level = 'none' 
WHERE role = 'User' AND feature = 'Expenses';
```

### Method 3: Using Backend API

#### Update Role Permissions

```bash
PUT /api/admin/roles/:roleId/permissions
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "permissions": [
    {
      "permission_id": 1,
      "access_level": "edit"
    },
    {
      "permission_id": 2,
      "access_level": "view"
    },
    {
      "permission_id": 3,
      "access_level": "none"
    }
  ]
}
```

## Common Permission Configurations

### Configuration 1: Sales Team

**Use Case:** Sales team needs to manage customers and invoices, but shouldn't access financial reports or expenses.

```sql
-- Customers: Full Access
UPDATE role_permissions SET access_level = 'edit' 
WHERE role = 'Sales' AND feature = 'Customers';

-- Products: Full Access
UPDATE role_permissions SET access_level = 'edit' 
WHERE role = 'Sales' AND feature = 'Products';

-- Invoices: Full Access
UPDATE role_permissions SET access_level = 'edit' 
WHERE role = 'Sales' AND feature = 'Invoices';

-- Dashboard: View Only
UPDATE role_permissions SET access_level = 'view' 
WHERE role = 'Sales' AND feature = 'Dashboard';

-- Reports: View Only
UPDATE role_permissions SET access_level = 'view' 
WHERE role = 'Sales' AND feature = 'Reports';

-- No Access
UPDATE role_permissions SET access_level = 'none' 
WHERE role = 'Sales' AND feature IN ('Expenses', 'Vendors', 'Transactions', 'Admin Panel');
```

**Expected Sidebar:** Dashboard, Customers, Products, Invoices, Reports

---

### Configuration 2: Accountant

**Use Case:** Accountant needs full access to financial data but limited access to sales functions.

```sql
-- Full Financial Access
UPDATE role_permissions SET access_level = 'edit' 
WHERE role = 'Accountant' AND feature IN ('Expenses', 'Transactions', 'Reports', 'Invoices');

-- View Only
UPDATE role_permissions SET access_level = 'view' 
WHERE role = 'Accountant' AND feature IN ('Dashboard', 'Customers', 'Vendors');

-- No Access
UPDATE role_permissions SET access_level = 'none' 
WHERE role = 'Accountant' AND feature IN ('Products', 'Admin Panel');
```

**Expected Sidebar:** Dashboard, Customers, Invoices, Expenses, Vendors, Transactions, Reports

---

### Configuration 3: Manager

**Use Case:** Manager needs access to everything except admin functions.

```sql
-- Full Access to Everything Except Admin
UPDATE role_permissions SET access_level = 'edit' 
WHERE role = 'Manager' AND feature NOT IN ('Admin Panel');

-- No Admin Access
UPDATE role_permissions SET access_level = 'none' 
WHERE role = 'Manager' AND feature = 'Admin Panel';
```

**Expected Sidebar:** All features except Admin Panel

---

### Configuration 4: Read-Only Auditor

**Use Case:** External auditor needs to view all data but cannot make changes.

```sql
-- View Only for All Features
UPDATE role_permissions SET access_level = 'view' 
WHERE role = 'Auditor';

-- Definitely No Admin Access
UPDATE role_permissions SET access_level = 'none' 
WHERE role = 'Auditor' AND feature = 'Admin Panel';
```

**Expected Sidebar:** All features except Admin Panel (all read-only)

---

## Creating Custom Roles

### Step 1: Insert New Role Permissions

```sql
-- Create permissions for a new "Bookkeeper" role
INSERT INTO role_permissions (role, feature, feature_path, access_level) VALUES
('Bookkeeper', 'Dashboard', '/dashboard', 'view'),
('Bookkeeper', 'Customers', '/dashboard/customers', 'view'),
('Bookkeeper', 'Products', '/dashboard/products', 'none'),
('Bookkeeper', 'Invoices', '/dashboard/invoices', 'edit'),
('Bookkeeper', 'Expenses', '/dashboard/expenses', 'edit'),
('Bookkeeper', 'Vendors', '/dashboard/vendors', 'view'),
('Bookkeeper', 'Transactions', '/dashboard/transactions', 'view'),
('Bookkeeper', 'Reports', '/dashboard/reports', 'view'),
('Bookkeeper', 'Admin Panel', '/dashboard/admin', 'none');
```

### Step 2: Assign Role to User

```sql
-- Update user's role
UPDATE users 
SET role = 'Bookkeeper' 
WHERE email = 'bookkeeper@company.com';
```

### Step 3: Test

1. Login as the user
2. Verify sidebar shows correct items
3. Test page access and button visibility

## Permission Matrix

Quick reference for common roles:

| Feature | Admin | Manager | Accountant | Sales | User |
|---------|-------|---------|------------|-------|------|
| Dashboard | edit | edit | view | view | view |
| Customers | edit | edit | view | edit | edit |
| Products | edit | edit | none | edit | edit |
| Invoices | edit | edit | edit | edit | edit |
| Expenses | edit | edit | edit | none | edit |
| Vendors | edit | edit | view | none | edit |
| Transactions | edit | edit | edit | none | view |
| Reports | edit | edit | edit | view | view |
| Admin Panel | edit | none | none | none | none |

## Troubleshooting

### Users See Wrong Permissions

**Issue:** User sees features they shouldn't have access to

**Solutions:**
1. Check user's role:
   ```sql
   SELECT email, role FROM users WHERE email = 'user@example.com';
   ```
2. Check role permissions:
   ```sql
   SELECT * FROM role_permissions WHERE role = 'User';
   ```
3. Have user logout and login again
4. Clear browser cache and localStorage

### Changes Not Taking Effect

**Issue:** Updated permissions but user still sees old permissions

**Solutions:**
1. User must logout and login again
2. Check if backend is using correct database
3. Verify `/api/auth/permissions` endpoint returns updated permissions:
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3001/api/auth/permissions
   ```

### Missing Permissions in Database

**Issue:** Some features don't have permission entries

**Solutions:**
1. Run the initial setup script again:
   ```sql
   -- See database-admin-setup.sql for full setup
   ```
2. Manually insert missing permissions:
   ```sql
   INSERT INTO role_permissions (role, feature, feature_path, access_level)
   VALUES ('User', 'NewFeature', '/dashboard/newfeature', 'view');
   ```

## Best Practices

1. **Default Deny**: Start with `none` and grant permissions as needed
2. **Principle of Least Privilege**: Only give users the access they need
3. **Regular Audits**: Review permissions quarterly
4. **Document Changes**: Keep log of permission changes
5. **Test Before Production**: Test permission changes in development first
6. **Admin Backup**: Always have at least 2 admin users
7. **Role Templates**: Create role templates for common user types

## Security Considerations

1. **Backend Enforcement**: Always enforce permissions on backend API, not just frontend
2. **Token Validation**: Ensure all API calls validate JWT tokens
3. **Admin Protection**: Admin Panel should only be accessible to Admin role
4. **Audit Logging**: Consider logging permission changes
5. **Regular Reviews**: Review user permissions regularly
6. **Offboarding**: Remove permissions immediately when users leave

## Quick Commands

```sql
-- See all permissions for a role
SELECT feature, access_level 
FROM role_permissions 
WHERE role = 'User' 
ORDER BY feature;

-- Count users per role
SELECT role, COUNT(*) as user_count 
FROM users 
GROUP BY role;

-- Find users with specific permission
SELECT u.email, rp.feature, rp.access_level
FROM users u
JOIN role_permissions rp ON rp.role = u.role
WHERE rp.feature = 'Customers' AND rp.access_level = 'edit';

-- Bulk update for role
UPDATE role_permissions 
SET access_level = 'view' 
WHERE role = 'User' AND access_level = 'edit';
```

---

**Last Updated**: December 20, 2025
**Version**: 1.0
