# Admin Panel Documentation

## Overview
The Admin Panel is a comprehensive system for managing users, roles, and permissions in the Invoice Creator application. Only users with the Admin role can access this panel.

## Features

### 1. User Management
- **Create Users**: Add new users with email, password, company name, and role
- **Edit Users**: Update user information, change passwords, modify roles
- **Deactivate Users**: Toggle user active status without deleting accounts
- **Delete Users**: Permanently remove users from the system
- **Assign Roles**: Assign multiple roles to users for granular permissions

### 2. Role Management
- **System Roles**: Pre-defined roles (Admin, User, Manager, Accountant, Sales)
- **Custom Roles**: Create your own roles with custom names and descriptions
- **Edit Roles**: Modify custom role names and descriptions
- **Delete Roles**: Remove custom roles (system roles cannot be deleted)
- **Role Statistics**: View user count and permission count for each role

### 3. Permission Management
- **Page-Level Permissions**: Control access to each page in the application
- **Access Levels**:
  - **None**: User cannot access the page
  - **View Only**: User can view but cannot create/edit/delete
  - **Full Access**: User has complete access to all features
- **Per-Role Configuration**: Set different permission levels for each role
- **Real-time Updates**: Changes take effect immediately

## Default Roles

### Admin
- Full access to all features including the Admin Panel
- Cannot be deleted or modified (system role)

### User
- Standard access to customers, products, invoices, expenses, and vendors (edit)
- View-only access to dashboard, reports, and transactions
- No access to Admin Panel

### Manager
- Edit access to all pages except Admin Panel
- Suitable for team leads and department managers

### Accountant
- Edit access to expenses, transactions, reports, and invoices
- View access to dashboard, customers, and vendors
- No access to products or Admin Panel

### Sales
- Edit access to customers, invoices, and products
- View access to dashboard and reports
- No access to expenses, vendors, transactions, or Admin Panel

## Database Schema

### Tables Created

#### `roles`
- `id`: Primary key
- `name`: Role name (unique)
- `description`: Role description
- `is_system`: Flag for system roles (1) vs custom roles (0)
- `created_at`, `updated_at`: Timestamps

#### `permissions`
- `id`: Primary key
- `page_name`: Display name of the page
- `page_path`: URL path to the page
- `description`: Description of what the page does
- `created_at`: Timestamp

#### `role_permissions`
- `id`: Primary key
- `role_id`: Foreign key to roles table
- `permission_id`: Foreign key to permissions table
- `access_level`: 'none', 'view', or 'edit'
- `created_at`, `updated_at`: Timestamps

#### `user_roles`
- `id`: Primary key
- `user_id`: Foreign key to users table
- `role_id`: Foreign key to roles table
- `assigned_by`: User ID of admin who assigned the role
- `assigned_at`: Timestamp

## API Endpoints

### User Management
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get single user details
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/roles` - Assign roles to user

### Role Management
- `GET /api/admin/roles` - Get all roles
- `GET /api/admin/roles/:id` - Get role details with permissions
- `POST /api/admin/roles` - Create new role
- `PUT /api/admin/roles/:id` - Update role (custom roles only)
- `DELETE /api/admin/roles/:id` - Delete role (custom roles only)

### Permission Management
- `GET /api/admin/permissions` - Get all available permissions
- `PUT /api/admin/roles/:id/permissions` - Update role permissions
- `GET /api/auth/permissions` - Get current user's permissions

## Setup Instructions

### 1. Database Initialization
The database tables are automatically created when the backend server starts. The default roles and permissions are also set up automatically.

If you need to manually run the setup:
```bash
# The server will automatically run the initialization
# No manual setup required
```

### 2. Creating the First Admin
When you register the first user, make sure to select "Admin" as the role. This will give you full access to the Admin Panel.

### 3. Accessing the Admin Panel
1. Log in as an Admin user
2. Click on "Admin Panel" in the sidebar
3. You'll see three tabs: Users, Roles, and Permissions

## Usage Guide

### Creating a New User
1. Go to Admin Panel > Users tab
2. Click "Create User"
3. Fill in:
   - Email address
   - Password
   - Company name
   - Role (Admin or User)
   - Active status checkbox
4. Click "Create"
5. Optionally, click "Roles" button to assign additional custom roles

### Creating a Custom Role
1. Go to Admin Panel > Roles tab
2. Click "Create Role"
3. Enter:
   - Role name (e.g., "Customer Support")
   - Description
4. Click "Create"
5. Go to Permissions tab to configure access levels

### Setting Up Permissions
1. Go to Admin Panel > Permissions tab
2. Select a role from the left panel
3. For each page, choose:
   - **None**: No access
   - **View Only**: Read-only access
   - **Full Access**: Complete access
4. Click "Save Changes"

### Assigning Multiple Roles to a User
1. Go to Admin Panel > Users tab
2. Click "Roles" button next to a user
3. Check the roles you want to assign
4. Click "Assign Roles"

Note: Users can have multiple roles. The highest permission level from any role will apply.

## Security Features

1. **Admin-Only Access**: Only users with Admin role can access the Admin Panel
2. **Protected System Roles**: Default roles (Admin, User) cannot be deleted or renamed
3. **Self-Protection**: Admins cannot delete their own account
4. **Password Hashing**: All passwords are hashed using bcrypt
5. **JWT Authentication**: All API requests require valid JWT token
6. **Role Validation**: Access levels are validated on every request

## Permission Logic

When a user has multiple roles:
- **Edit** access takes precedence over **View**
- **View** access takes precedence over **None**
- The highest access level from any assigned role is granted

Example:
- User has "Sales" role (Customers: Edit) and "Accountant" role (Customers: View)
- Result: User gets Edit access to Customers

## Troubleshooting

### Admin Panel Not Visible
- Ensure you're logged in as a user with Admin role
- Check the sidebar - "Admin Panel" should appear at the bottom
- Verify your JWT token is valid

### Cannot Create Users
- Verify you have Admin role
- Check browser console for errors
- Ensure backend server is running on port 3001

### Permission Changes Not Taking Effect
- Permissions are applied immediately
- Log out and log back in to ensure fresh token
- Check that roles are properly assigned to the user

### Cannot Delete Role
- System roles (Admin, User, Manager, Accountant, Sales) cannot be deleted
- Only custom roles can be deleted
- Ensure no users are assigned to the role before deleting

## Best Practices

1. **Principle of Least Privilege**: Give users only the permissions they need
2. **Regular Audits**: Periodically review user roles and permissions
3. **Use Custom Roles**: Create specific roles for your organization's needs
4. **Document Changes**: Keep track of permission changes for audit purposes
5. **Test Permissions**: Test new roles with a test user before assigning to real users
6. **Backup Database**: Regularly backup your database before making bulk changes

## Future Enhancements

Potential improvements:
1. Audit log for all admin actions
2. Bulk user operations
3. CSV import/export for users
4. Advanced filtering and search
5. Permission templates
6. Time-based role assignments
7. Two-factor authentication
8. IP-based access restrictions
9. Session management
10. Activity monitoring dashboard
