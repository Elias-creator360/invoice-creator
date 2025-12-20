# Database Migration Guide for Admin System

## 🎯 Purpose
This guide helps you migrate your existing Invoice Creator database to include the new admin panel features.

## ⚠️ Before You Start

### Backup Your Database
```bash
# Make a backup of your database
cp database.db database.db.backup
```

### Stop the Server
Make sure the backend server is not running:
```bash
# If running in terminal, press Ctrl+C
```

## 🔄 Migration Methods

### Method 1: Automatic Migration (Recommended)

The backend server will automatically create the new tables when it starts.

1. **Start the backend server:**
   ```bash
   cd backend
   node server.js
   ```

2. **Check the console output:**
   You should see:
   ```
   Database initialized successfully
   Default roles created
   Default permissions created
   Default role permissions set up
   ```

3. **Verify tables were created:**
   The server will create:
   - `roles` table
   - `permissions` table
   - `role_permissions` table
   - `user_roles` table

4. **Done!** Your database is now ready for the admin panel.

### Method 2: Manual SQL Migration

If you prefer to run the SQL manually:

1. **Open SQLite CLI or DB Browser:**
   ```bash
   sqlite3 database.db
   ```

2. **Copy and paste from `database-admin-setup.sql`:**
   - Open the file `database-admin-setup.sql`
   - Copy the entire contents
   - Paste into SQLite CLI
   - Press Enter

3. **Verify tables:**
   ```sql
   .tables
   -- Should show: roles, permissions, role_permissions, user_roles
   ```

4. **Check default data:**
   ```sql
   SELECT * FROM roles;
   SELECT * FROM permissions;
   ```

## 📊 What Gets Created

### New Tables

#### 1. roles
```sql
- id (Primary Key)
- name (e.g., "Admin", "Manager", "Sales")
- description
- is_system (1 for default roles, 0 for custom)
- created_at, updated_at
```

#### 2. permissions
```sql
- id (Primary Key)
- page_name (e.g., "Customers", "Invoices")
- page_path (e.g., "/dashboard/customers")
- description
- created_at
```

#### 3. role_permissions
```sql
- id (Primary Key)
- role_id (Foreign Key to roles)
- permission_id (Foreign Key to permissions)
- access_level ("none", "view", or "edit")
- created_at, updated_at
```

#### 4. user_roles
```sql
- id (Primary Key)
- user_id (Foreign Key to users)
- role_id (Foreign Key to roles)
- assigned_by (User ID of admin who assigned)
- assigned_at
```

### Default Data Inserted

#### 5 Roles:
1. Admin - Full system access
2. User - Standard user access
3. Manager - Extended permissions
4. Accountant - Financial focus
5. Sales - Customer and invoice focus

#### 9 Permissions:
1. Dashboard
2. Customers
3. Products
4. Invoices
5. Expenses
6. Vendors
7. Transactions
8. Reports
9. Admin Panel

#### Role Permissions:
Pre-configured permission sets for all default roles.

## 🔍 Verification Steps

### Step 1: Check Tables Exist
```sql
.tables
```
Expected output should include:
- roles
- permissions
- role_permissions
- user_roles

### Step 2: Check Default Roles
```sql
SELECT id, name, description, is_system FROM roles;
```
Should show 5 roles.

### Step 3: Check Default Permissions
```sql
SELECT id, page_name, page_path FROM permissions;
```
Should show 9 permissions.

### Step 4: Check Role Permissions
```sql
SELECT COUNT(*) as total FROM role_permissions;
```
Should show multiple records (45 default permission assignments).

### Step 5: Test Admin Panel Access
1. Start backend and frontend
2. Log in as an Admin user
3. Check if "Admin Panel" appears in sidebar
4. Click and verify it loads without errors

## 🆘 Troubleshooting

### Issue: Tables Not Created
**Solution:**
```bash
# Delete database and let server recreate
rm database.db
node server.js
# Then re-register users
```

### Issue: No Default Roles
**Solution:**
```bash
# Stop server
# Delete and restart to trigger initialization
rm database.db
node server.js
```

### Issue: Admin Panel Not Showing
**Possible causes:**
1. User doesn't have Admin role
   ```sql
   -- Check user role
   SELECT id, email, role FROM users WHERE email = 'your@email.com';
   
   -- Update to Admin if needed
   UPDATE users SET role = 'Admin' WHERE email = 'your@email.com';
   ```

2. Frontend not updated
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run dev
   ```

### Issue: Permission Errors
**Solution:**
```sql
-- Check if role_permissions exist
SELECT COUNT(*) FROM role_permissions;

-- If 0, run initialization
-- Stop server and delete database.db, then restart
```

## 📝 Post-Migration Tasks

### 1. Assign Admin Role to Existing Users
```sql
-- View all users
SELECT id, email, role FROM users;

-- Update specific user to Admin
UPDATE users SET role = 'Admin' WHERE id = 1;
```

### 2. Assign Roles to Users (Optional)
After migration, you can assign additional custom roles:
1. Go to Admin Panel > Users
2. Click "Roles" button for a user
3. Assign additional roles

### 3. Customize Permissions (Optional)
Adjust permissions for roles:
1. Go to Admin Panel > Permissions
2. Select a role
3. Modify access levels
4. Save changes

## 🔄 Rollback Instructions

If you need to revert the changes:

### Option 1: Restore Backup
```bash
# Stop the server
# Restore from backup
cp database.db.backup database.db
# Restart server
node server.js
```

### Option 2: Drop New Tables
```sql
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
```

**Note:** This will remove all admin functionality but keep your existing data (users, customers, invoices, etc.) intact.

## ✅ Migration Checklist

- [ ] Backup existing database
- [ ] Stop backend server
- [ ] Run migration (automatic or manual)
- [ ] Verify new tables created
- [ ] Verify default data inserted
- [ ] Start backend server
- [ ] Start frontend
- [ ] Log in as admin user
- [ ] Access Admin Panel
- [ ] Test user creation
- [ ] Test role creation
- [ ] Test permission management
- [ ] Document any issues
- [ ] Celebrate! 🎉

## 📞 Support

If you encounter issues:
1. Check server logs for errors
2. Verify database file exists and is writable
3. Check that all new files are present
4. Review browser console for frontend errors
5. Consult `ADMIN_PANEL_GUIDE.md` for detailed docs

## 🎓 Learn More

After migration, read:
- `ADMIN_QUICK_START.md` - Quick start guide
- `ADMIN_PANEL_GUIDE.md` - Comprehensive documentation
- `ADMIN_IMPLEMENTATION_SUMMARY.md` - Technical details

---

**Last Updated**: December 19, 2025  
**Migration Version**: 1.0  
**Compatibility**: Invoice Creator v1.0+
