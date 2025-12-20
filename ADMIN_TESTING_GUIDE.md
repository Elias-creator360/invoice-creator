# Admin Panel Testing Guide

## 🧪 Testing Overview

This guide provides comprehensive testing procedures for the Admin Panel functionality.

## ✅ Pre-Testing Checklist

- [ ] Backend server running on port 3001
- [ ] Frontend running on port 3000
- [ ] Database tables created (roles, permissions, role_permissions, user_roles)
- [ ] At least one Admin user exists
- [ ] Browser console open for error monitoring

## 🔐 Test 1: Admin Panel Access Control

### Test 1.1: Admin User Can Access
**Steps:**
1. Log in as user with Admin role
2. Check sidebar for "Admin Panel" link
3. Click "Admin Panel"

**Expected:**
- ✅ "Admin Panel" link visible in sidebar
- ✅ Admin Panel page loads successfully
- ✅ Three tabs visible: Users, Roles, Permissions
- ✅ No errors in console

### Test 1.2: Non-Admin User Cannot Access
**Steps:**
1. Create a user with "User" role
2. Log in as that user
3. Check sidebar
4. Try navigating to `/dashboard/admin` directly

**Expected:**
- ✅ "Admin Panel" link NOT visible in sidebar
- ✅ Direct navigation redirects to /dashboard
- ✅ Or shows 403 Forbidden error

## 👤 Test 2: User Management

### Test 2.1: Create New User
**Steps:**
1. Go to Admin Panel > Users tab
2. Click "Create User"
3. Fill in form:
   - Email: test@example.com
   - Password: Test123!
   - Company Name: Test Company
   - Role: User
   - Active: Checked
4. Click "Create"

**Expected:**
- ✅ Success message appears
- ✅ Modal closes
- ✅ User appears in user list
- ✅ User has correct details
- ✅ Backend log shows: INSERT INTO users
- ✅ Database has new user record

**Verify in Database:**
```sql
SELECT * FROM users WHERE email = 'test@example.com';
```

### Test 2.2: Edit Existing User
**Steps:**
1. Click "Edit" icon next to a user
2. Change company name to "Updated Company"
3. Change role to "Admin"
4. Click "Update"

**Expected:**
- ✅ Success message
- ✅ Modal closes
- ✅ User list refreshes
- ✅ Changes reflected in UI
- ✅ Database updated

### Test 2.3: Deactivate User
**Steps:**
1. Edit a user
2. Uncheck "Active" checkbox
3. Click "Update"
4. Try logging in as that user

**Expected:**
- ✅ User status changes to "Inactive" (red badge)
- ✅ Login attempt fails with error
- ✅ Error message: "Account is deactivated"

### Test 2.4: Delete User
**Steps:**
1. Click "Delete" icon (trash) next to a user
2. Confirm deletion

**Expected:**
- ✅ Confirmation dialog appears
- ✅ Success message after confirmation
- ✅ User removed from list
- ✅ User deleted from database

### Test 2.5: Prevent Self-Deletion
**Steps:**
1. Try to delete your own admin account

**Expected:**
- ✅ Error message: "Cannot delete your own account"
- ✅ User NOT deleted

### Test 2.6: Password Update
**Steps:**
1. Edit a user
2. Enter new password
3. Click "Update"
4. Log out
5. Log in as that user with new password

**Expected:**
- ✅ Update successful
- ✅ Old password no longer works
- ✅ New password works
- ✅ Password is hashed in database

## 🛡️ Test 3: Role Management

### Test 3.1: View Default Roles
**Steps:**
1. Go to Admin Panel > Roles tab

**Expected:**
- ✅ 5 default roles visible:
  - Admin (System badge)
  - User (System badge)
  - Manager
  - Accountant
  - Sales
- ✅ Each shows user count and permission count
- ✅ System roles show "System" badge

### Test 3.2: Create Custom Role
**Steps:**
1. Click "Create Role"
2. Fill in:
   - Name: "Support"
   - Description: "Customer support team"
3. Click "Create"

**Expected:**
- ✅ Success message
- ✅ New role card appears
- ✅ Role has 0 users, 0 permissions initially
- ✅ No "System" badge
- ✅ Edit and Delete buttons visible

**Verify in Database:**
```sql
SELECT * FROM roles WHERE name = 'Support';
```

### Test 3.3: Edit Custom Role
**Steps:**
1. Click "Edit" on custom role
2. Change description
3. Click "Update"

**Expected:**
- ✅ Success message
- ✅ Description updated in UI
- ✅ Database updated

### Test 3.4: Attempt to Edit System Role
**Steps:**
1. Try to edit "Admin" or "User" role

**Expected:**
- ✅ Edit button not visible for system roles
- ✅ Or: Error message if attempted via API

### Test 3.5: Delete Custom Role
**Steps:**
1. Click "Delete" on custom role (with 0 users)
2. Confirm

**Expected:**
- ✅ Confirmation dialog
- ✅ Success message
- ✅ Role removed from list
- ✅ Deleted from database

### Test 3.6: Attempt to Delete System Role
**Steps:**
1. Try to delete "Admin" role

**Expected:**
- ✅ Delete button not visible
- ✅ Or: Error: "Cannot delete system roles"

## 🔑 Test 4: Permission Management

### Test 4.1: View Role Permissions
**Steps:**
1. Go to Admin Panel > Permissions tab
2. Click on "Sales" role

**Expected:**
- ✅ Role selected (highlighted)
- ✅ All 9 permissions displayed
- ✅ Each shows current access level
- ✅ Default permissions for Sales:
  - Customers: Edit (Green)
  - Invoices: Edit (Green)
  - Products: Edit (Green)
  - Dashboard: View (Yellow)
  - Reports: View (Yellow)
  - Others: None (Red)

### Test 4.2: Update Role Permissions
**Steps:**
1. Select "Support" role (custom role)
2. Set permissions:
   - Customers: Edit
   - Dashboard: View
   - All others: None
3. Click "Save Changes"

**Expected:**
- ✅ Success message
- ✅ Permissions saved
- ✅ Database updated

**Verify in Database:**
```sql
SELECT p.page_name, rp.access_level 
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'Support';
```

### Test 4.3: Admin Full Access
**Steps:**
1. Select "Admin" role
2. Check all permissions

**Expected:**
- ✅ All permissions show "Edit" (Green)
- ✅ Including "Admin Panel"

## 👥 Test 5: Role Assignment

### Test 5.1: Assign Single Role to User
**Steps:**
1. Go to Admin Panel > Users tab
2. Click "Roles" button for a user
3. Check "Sales" role
4. Click "Assign Roles"

**Expected:**
- ✅ Success message
- ✅ Modal closes
- ✅ User list updated

**Verify:**
```sql
SELECT u.email, r.name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'test@example.com';
```

### Test 5.2: Assign Multiple Roles
**Steps:**
1. Click "Roles" for a user
2. Check both "Sales" and "Accountant"
3. Assign

**Expected:**
- ✅ Both roles assigned
- ✅ Database has 2 records in user_roles

### Test 5.3: Remove Role Assignment
**Steps:**
1. Click "Roles" for a user with multiple roles
2. Uncheck one role
3. Assign

**Expected:**
- ✅ Role removed
- ✅ Other roles remain
- ✅ Database updated

## 🔒 Test 6: Permission Checking

### Test 6.1: User with View Permission
**Steps:**
1. Create user with "Accountant" role
2. Log in as that user
3. Go to Expenses page

**Expected:**
- ✅ Can view expense list
- ✅ Edit/Delete buttons visible (Accountant has edit on Expenses)

### Test 6.2: User with No Permission
**Steps:**
1. Create user with "Sales" role only
2. Log in as that user
3. Try to access Expenses page directly

**Expected:**
- ✅ Redirected to Dashboard
- ✅ Or: "Access Denied" message
- ✅ Expenses link hidden/disabled in sidebar

### Test 6.3: Multi-Role Permission Priority
**Steps:**
1. Create user with both:
   - "Sales" role (Customers: Edit)
   - "Accountant" role (Customers: View)
2. Log in
3. Go to Customers page

**Expected:**
- ✅ Edit buttons visible
- ✅ Can create/edit/delete customers
- ✅ Highest permission (Edit) takes precedence

## 🔐 Test 7: Security Tests

### Test 7.1: JWT Token Validation
**Steps:**
1. Open browser DevTools
2. Clear localStorage
3. Try to access admin panel

**Expected:**
- ✅ Redirected to login
- ✅ API calls return 401 Unauthorized

### Test 7.2: Non-Admin API Access
**Steps:**
1. Log in as regular User
2. Open browser console
3. Try: 
```javascript
fetch('http://localhost:3001/api/admin/users', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
```

**Expected:**
- ✅ Response: 403 Forbidden
- ✅ Error: "Access denied. Admin role required."

### Test 7.3: Invalid Token
**Steps:**
1. In console, set invalid token:
```javascript
localStorage.setItem('token', 'invalid-token-123')
```
2. Try to access admin panel

**Expected:**
- ✅ 401 Unauthorized
- ✅ Redirected to login

### Test 7.4: Password Hashing
**Steps:**
1. Create a user
2. Check database:
```sql
SELECT password FROM users WHERE email = 'test@example.com';
```

**Expected:**
- ✅ Password is hashed (starts with $2a$ or $2b$)
- ✅ NOT plain text
- ✅ Different from input password

## 📊 Test 8: UI/UX Tests

### Test 8.1: Success Messages
**Steps:**
1. Perform any create/update operation
2. Observe success message

**Expected:**
- ✅ Green message appears at top
- ✅ Check icon visible
- ✅ Message auto-dismisses after 5 seconds

### Test 8.2: Error Messages
**Steps:**
1. Try to create user with existing email
2. Observe error message

**Expected:**
- ✅ Red message appears
- ✅ Alert icon visible
- ✅ Clear error description

### Test 8.3: Loading States
**Steps:**
1. Slow down network (DevTools > Network > Slow 3G)
2. Perform operations
3. Observe UI

**Expected:**
- ✅ Loading spinner visible during fetch
- ✅ Buttons disabled during operations
- ✅ Smooth transitions

### Test 8.4: Modal Behavior
**Steps:**
1. Open create user modal
2. Click outside modal
3. Press ESC key

**Expected:**
- ✅ Modal closes on X click
- ✅ Form resets after close
- ✅ No data persisted

### Test 8.5: Responsive Design
**Steps:**
1. Resize browser window
2. Test on mobile view (DevTools)

**Expected:**
- ✅ Layout adapts to screen size
- ✅ Tables scroll horizontally if needed
- ✅ Modals fit mobile screens
- ✅ All features accessible

## 🔄 Test 9: Data Integrity

### Test 9.1: Role Deletion with Users
**Steps:**
1. Assign role to a user
2. Try to delete that role

**Expected:**
- ✅ Warning about users with role
- ✅ Or: Cascade delete removes assignments

### Test 9.2: User Deletion Cascade
**Steps:**
1. Assign roles to a user
2. Delete the user
3. Check user_roles table

**Expected:**
- ✅ User deleted from users table
- ✅ Role assignments also deleted (CASCADE)
- ✅ No orphaned records

### Test 9.3: Permission Updates Persist
**Steps:**
1. Update role permissions
2. Refresh page
3. Check permissions again

**Expected:**
- ✅ Changes persisted in database
- ✅ Same permissions displayed
- ✅ No data loss

## 🚀 Test 10: Performance

### Test 10.1: Large User List
**Steps:**
1. Create 50+ users
2. View user list
3. Observe load time

**Expected:**
- ✅ List loads within 2 seconds
- ✅ Smooth scrolling
- ✅ No UI lag

### Test 10.2: Permission Query Performance
**Steps:**
1. Assign 10+ roles to a user
2. Check permissions API response time

**Expected:**
- ✅ Response within 500ms
- ✅ Correct permission resolution
- ✅ No duplicate queries

## 📝 Test Report Template

```
Test Date: __________
Tester: __________
Environment: __________

Test Results:
┌────────┬────────────────────┬────────┬────────┐
│ Test # │ Test Name          │ Status │ Notes  │
├────────┼────────────────────┼────────┼────────┤
│ 1.1    │ Admin Access       │ ✅ Pass│        │
│ 1.2    │ Non-Admin Block    │ ✅ Pass│        │
│ 2.1    │ Create User        │ ✅ Pass│        │
│ ...    │ ...                │        │        │
└────────┴────────────────────┴────────┴────────┘

Issues Found:
1. _______________
2. _______________

Overall Status: ☐ Pass ☐ Fail ☐ Partial

Recommendations:
_______________
```

## 🐛 Common Issues & Solutions

### Issue: Admin Panel Not Showing
**Solution:**
- Check user role is "Admin"
- Clear cache and reload
- Check console for errors

### Issue: Permissions Not Working
**Solution:**
- Verify role assignments in database
- Check permission API returns data
- Ensure token is valid

### Issue: Database Errors
**Solution:**
- Run database initialization
- Check table structure
- Verify foreign key constraints

## ✅ Automated Testing (Future)

Consider adding:
- Unit tests for API endpoints
- Integration tests for auth flow
- E2E tests with Playwright/Cypress
- Permission logic tests
- Database constraint tests

## 📞 Reporting Bugs

When reporting issues, include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser console errors
4. Backend server logs
5. Database state (if relevant)
6. Screenshots/video

---

**Testing Status**: Ready for QA  
**Last Updated**: December 19, 2025
