# Quick Start Guide - Admin Panel

## 🚀 Getting Started with Admin Panel

### Prerequisites
- Backend server running on port 3001
- Frontend running on port 3000
- At least one Admin user created

### Step 1: Start the Servers

**Backend:**
```bash
cd backend
node server.js
```

**Frontend:**
```bash
npm run dev
```

### Step 2: Create Admin User

If you don't have an admin user yet:

1. Go to `http://localhost:3000/login`
2. Click "Register" or toggle to registration form
3. Fill in the details:
   - Email
   - Password
   - Company Name
   - **Important**: Select "Admin" as the role
4. Click "Register"

### Step 3: Access Admin Panel

1. Log in with your admin credentials
2. Look for "Admin Panel" at the bottom of the sidebar
3. Click to open the admin panel

## 📋 Quick Actions

### Create a New User
1. Admin Panel > Users tab
2. Click "Create User" button
3. Fill in the form
4. Click "Create"

### Create a Custom Role
1. Admin Panel > Roles tab
2. Click "Create Role" button
3. Enter name and description
4. Click "Create"
5. Go to Permissions tab to set access levels

### Assign Permissions to a Role
1. Admin Panel > Permissions tab
2. Select a role from the left panel
3. For each page, choose access level:
   - **None**: No access
   - **View Only**: Read-only
   - **Full Access**: Complete control
4. Click "Save Changes"

### Assign Roles to a User
1. Admin Panel > Users tab
2. Find the user
3. Click "Roles" button
4. Check the roles to assign
5. Click "Assign Roles"

## 🎯 Common Use Cases

### Scenario 1: Sales Team Member
Create a user for your sales team:
1. Create user with basic "User" role
2. Assign the "Sales" role
3. They will have access to:
   - Customers (Full Access)
   - Invoices (Full Access)
   - Products (Full Access)
   - Dashboard (View Only)
   - Reports (View Only)

### Scenario 2: Accountant
Create a user for financial tasks:
1. Create user with basic "User" role
2. Assign the "Accountant" role
3. They will have access to:
   - Expenses (Full Access)
   - Transactions (Full Access)
   - Reports (Full Access)
   - Invoices (Full Access)
   - Dashboard (View Only)

### Scenario 3: Custom Role
Create a custom role for specific needs:
1. Admin Panel > Roles > Create Role
2. Name it (e.g., "Customer Support")
3. Go to Permissions tab
4. Select your new role
5. Set permissions:
   - Customers: Full Access
   - Invoices: View Only
   - Dashboard: View Only
   - Everything else: None
6. Save Changes
7. Assign role to users

## 🔐 Security Tips

1. **Principle of Least Privilege**: Only give users the permissions they need
2. **Regular Audits**: Review user roles monthly
3. **Strong Passwords**: Enforce strong passwords for all users
4. **Deactivate, Don't Delete**: Deactivate users instead of deleting for audit trails
5. **Admin Accounts**: Limit the number of admin accounts

## ❓ Troubleshooting

### Can't See Admin Panel
- Verify you're logged in as Admin
- Check user role in sidebar (should show "Admin" badge)
- Log out and log back in

### Permission Changes Not Working
- Permissions apply immediately
- Refresh the page
- Check that roles are properly assigned

### Can't Delete a Role
- System roles (Admin, User, Manager, etc.) cannot be deleted
- Only custom roles can be deleted
- Remove users from role before deleting

## 📚 Next Steps

- Read the full [Admin Panel Guide](./ADMIN_PANEL_GUIDE.md)
- Learn about [Role-Based Access Control](./AUTHENTICATION.md)
- Set up [Multiple Roles per User](./ADMIN_PANEL_GUIDE.md#assigning-multiple-roles-to-a-user)

## 🆘 Need Help?

Check the following files:
- `ADMIN_PANEL_GUIDE.md` - Comprehensive documentation
- `AUTHENTICATION.md` - Authentication system details
- `backend/server.js` - Admin API endpoints (line 400+)
- `app/dashboard/admin/page.tsx` - Admin UI code

## 📞 Support

For issues or questions:
1. Check the documentation files
2. Review the browser console for errors
3. Check backend server logs
4. Verify database tables were created correctly

---

**Happy Administrating! 🎉**
