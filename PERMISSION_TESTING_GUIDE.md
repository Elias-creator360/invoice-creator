# Permission System Testing Guide

## Quick Start Testing

### Prerequisites
1. Ensure Supabase database has `role_permissions` table populated
2. Have at least 2-3 test users with different roles
3. Backend server running on port 3001
4. Frontend running on port 3000

## Test Scenarios

### Scenario 1: Admin User (Full Access)
**Expected Behavior:**
- ✅ All features visible in sidebar
- ✅ All pages accessible
- ✅ All buttons and forms enabled
- ✅ Admin Panel visible in sidebar

**Test Steps:**
1. Login as Admin user
2. Check sidebar - should see all 9 items (Dashboard, Customers, Products, Invoices, Expenses, Vendors, Transactions, Reports, Admin Panel)
3. Navigate to each page
4. Verify all Create/Add/Edit/Delete buttons are visible and functional
5. Verify no "view-only" warnings appear

---

### Scenario 2: User with View-Only Permissions
**Expected Behavior:**
- ✅ Features with "view" permission visible in sidebar
- ✅ Features with "none" permission hidden from sidebar
- ✅ "View-only access" warning shown on pages
- ❌ Create/Edit/Delete buttons hidden
- ❌ Forms do not appear

**Test Steps:**
1. Login as user with view-only permissions
2. Check sidebar:
   - Should see features with "view" or "edit" access
   - Should NOT see features with "none" access
3. Navigate to a page with "view" permission:
   - Should see amber warning: "⚠️ You have view-only access"
   - Should NOT see Add/Create buttons
   - Should NOT see Edit/Delete buttons in tables
   - Forms should not appear when trying to edit
4. Try to access a feature with "none" permission via URL:
   - Should redirect to /dashboard

**Example User Setup in Supabase:**
```sql
-- User has view access to Customers, but none to Invoices
UPDATE role_permissions 
SET access_level = 'view' 
WHERE role = 'User' AND feature = 'Customers';

UPDATE role_permissions 
SET access_level = 'none' 
WHERE role = 'User' AND feature = 'Invoices';
```

---

### Scenario 3: User with Mixed Permissions
**Expected Behavior:**
- ✅ Some features have full edit access
- ✅ Some features have view-only access
- ✅ Some features completely hidden

**Test Steps:**
1. Create a user with mixed permissions:
   - Edit: Customers, Products
   - View: Invoices, Reports
   - None: Expenses, Vendors
2. Login and verify sidebar shows only Customers, Products, Invoices, Reports
3. Test Customers page (edit permission):
   - Should have full functionality
   - Should be able to create/edit/delete
4. Test Invoices page (view permission):
   - Should show view-only warning
   - Should NOT be able to create/edit/delete
5. Try accessing /dashboard/expenses (none permission):
   - Should redirect to /dashboard

**Example SQL:**
```sql
UPDATE role_permissions SET access_level = 'edit' 
WHERE role = 'User' AND feature IN ('Customers', 'Products');

UPDATE role_permissions SET access_level = 'view' 
WHERE role = 'User' AND feature IN ('Invoices', 'Reports');

UPDATE role_permissions SET access_level = 'none' 
WHERE role = 'User' AND feature IN ('Expenses', 'Vendors');
```

---

## Page-Specific Tests

### Customers Page
**View Permission:**
- ❌ "Add Customer" button hidden
- ❌ Edit icon buttons hidden
- ❌ Delete icon buttons hidden
- ✅ Can see customer list
- ✅ Can search customers

**Edit Permission:**
- ✅ "Add Customer" button visible
- ✅ Can click to add new customer
- ✅ Edit/Delete buttons visible
- ✅ Can modify customer data

### Invoices Page
**View Permission:**
- ❌ "Create Invoice" button hidden
- ❌ Edit icon hidden
- ❌ Delete icon hidden
- ✅ View icon visible
- ✅ Can see invoice list
- ✅ Can search invoices

**Edit Permission:**
- ✅ "Create Invoice" button visible
- ✅ All action buttons visible
- ✅ Can create/edit/delete invoices

### Expenses Page
**View Permission:**
- ❌ "Add Expense" button hidden
- ❌ Delete button hidden
- ✅ Can see expense list
- ✅ Can see total expenses

**Edit Permission:**
- ✅ "Add Expense" button visible
- ✅ Delete buttons visible
- ✅ Can add new expenses

## API Testing

### Test Permission Endpoint
```bash
# Get permissions for logged-in user
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/auth/permissions
```

**Expected Response:**
```json
[
  {
    "page_name": "Customers",
    "page_path": "/dashboard/customers",
    "access_level": "edit"
  },
  {
    "page_name": "Invoices",
    "page_path": "/dashboard/invoices",
    "access_level": "view"
  },
  {
    "page_name": "Expenses",
    "page_path": "/dashboard/expenses",
    "access_level": "none"
  }
]
```

## Common Issues & Solutions

### Issue: All features showing for non-admin user
**Solution:** Check that role_permissions table has correct data for the user's role

### Issue: Permission guard not redirecting
**Solution:** Verify usePermissions hook is loading correctly and permissions are being fetched

### Issue: Buttons still visible with view permission
**Solution:** Check that ConditionalRender is properly wrapping the buttons

### Issue: Sidebar not filtering items
**Solution:** Ensure Sidebar.tsx is using the filtered navItems array

## Database Verification Queries

```sql
-- Check all permissions for a role
SELECT * FROM role_permissions WHERE role = 'User';

-- Check what permissions a user should have
SELECT u.email, u.role, rp.feature, rp.access_level
FROM users u
JOIN role_permissions rp ON rp.role = u.role
WHERE u.email = 'user@example.com';

-- Update a permission
UPDATE role_permissions 
SET access_level = 'view' 
WHERE role = 'User' AND feature = 'Customers';
```

## Visual Testing Checklist

For each user role, verify:

- [ ] Sidebar items match expected permissions
- [ ] No "none" permission items appear in sidebar
- [ ] Pages with "none" permission redirect
- [ ] Pages with "view" permission show warning
- [ ] Pages with "view" permission hide all edit buttons
- [ ] Pages with "edit" permission have full functionality
- [ ] Forms only appear with "edit" permission
- [ ] Admin users see Admin Panel
- [ ] Non-admin users don't see Admin Panel

## Performance Testing

1. Check that permission loading doesn't block page render
2. Verify permissions are cached (not fetched on every page navigation)
3. Test with 50+ permissions to ensure no slowdown

## Security Testing

1. Try accessing restricted pages via direct URL
2. Try manipulating browser localStorage to fake permissions
3. Verify backend also enforces permissions (not just frontend)
4. Check that API calls fail appropriately without proper permissions

---

## Test Report Template

```
Date: _________________
Tester: _________________

Test User Details:
- Email: _________________
- Role: _________________
- Expected Permissions: _________________

Test Results:
[ ] Sidebar filtering works correctly
[ ] Page access control works correctly
[ ] Button visibility works correctly
[ ] Form display works correctly
[ ] View-only warnings appear correctly
[ ] Redirects work for "none" permissions

Issues Found:
1. _________________
2. _________________

Notes:
_________________
```

---

**Testing Completed**: Ready for production after all scenarios pass ✅
