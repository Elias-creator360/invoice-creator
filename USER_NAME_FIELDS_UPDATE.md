# User Name Fields Update

## Overview
Added first name and last name fields to the user management system. Users can now provide their first and last names during registration, and these names will be displayed in the admin panel.

## Changes Made

### 1. Database Schema (backend/server.js)
- **Updated users table** to include `first_name` and `last_name` columns:
  ```sql
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    company_name TEXT NOT NULL,
    role TEXT DEFAULT 'User' CHECK(role IN ('Admin', 'User')),
    is_active INTEGER DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  ```

- **Added migration logic** to add columns to existing databases:
  ```javascript
  try {
    db.run(`ALTER TABLE users ADD COLUMN first_name TEXT NOT NULL DEFAULT ''`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.run(`ALTER TABLE users ADD COLUMN last_name TEXT NOT NULL DEFAULT ''`);
  } catch (e) {
    // Column already exists
  }
  ```

### 2. Backend API Endpoints (backend/server.js)
Updated the following endpoints to handle first_name and last_name:

- **POST /api/auth/register**: Now accepts `firstName` and `lastName` parameters
- **GET /api/auth/me**: Returns `first_name` and `last_name` in response
- **GET /api/admin/users**: Includes `first_name` and `last_name` in user list
- **GET /api/admin/users/:id**: Returns user details with name fields
- **POST /api/admin/users**: Creates users with first and last names
- **PUT /api/admin/users/:id**: Updates user names

### 3. TypeScript Types (lib/admin-types.ts)
- **Updated AdminUser interface**:
  ```typescript
  export interface AdminUser {
    id: number
    first_name?: string
    last_name?: string
    email: string
    company_name: string
    role: 'Admin' | 'User'
    is_active: number
    last_login: string | null
    created_at: string
    roles?: string[]
    assignedRoles?: AdminRole[]
  }
  ```

- **Updated CreateUserRequest interface**:
  ```typescript
  export interface CreateUserRequest {
    firstName?: string
    lastName?: string
    email: string
    password: string
    companyName: string
    role?: 'Admin' | 'User'
    isActive?: boolean
    roleIds?: number[]
  }
  ```

- **Updated UpdateUserRequest interface**:
  ```typescript
  export interface UpdateUserRequest {
    firstName?: string
    lastName?: string
    email?: string
    companyName?: string
    role?: 'Admin' | 'User'
    isActive?: boolean
    password?: string
  }
  ```

### 4. Admin Panel UI (app/dashboard/admin/page.tsx)
- **Updated User interface** to include `first_name` and `last_name` fields
- **Updated userForm state** to include firstName and lastName
- **Added input fields** for First Name and Last Name in the user creation/edit modal
- **Added "Full Name" column** to the user table that displays concatenated first and last names
- **Updated openEditUser function** to populate name fields when editing
- **Updated form reset logic** to clear name fields

#### User Table Display:
```tsx
<th className="text-left py-3 px-4">Full Name</th>
...
<td className="py-3 px-4">
  {user.first_name || user.last_name 
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
    : '-'
  }
</td>
```

#### User Creation/Edit Modal:
```tsx
<div>
  <Label htmlFor="firstName">First Name</Label>
  <Input
    id="firstName"
    type="text"
    value={userForm.firstName}
    onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
    placeholder="John"
  />
</div>

<div>
  <Label htmlFor="lastName">Last Name</Label>
  <Input
    id="lastName"
    type="text"
    value={userForm.lastName}
    onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
    placeholder="Doe"
  />
</div>
```

### 5. Login/Registration Page (app/login/page.tsx)
- **Updated formData state** to include firstName and lastName
- **Added input fields** for First Name and Last Name in the registration form
- **Updated Supabase insert** to include first_name and last_name fields

#### Registration Form Fields:
```tsx
<div className="space-y-2">
  <Label htmlFor="firstName">First Name</Label>
  <Input
    id="firstName"
    name="firstName"
    type="text"
    placeholder="John"
    value={formData.firstName}
    onChange={handleChange}
    required={!isLogin}
  />
</div>

<div className="space-y-2">
  <Label htmlFor="lastName">Last Name</Label>
  <Input
    id="lastName"
    name="lastName"
    type="text"
    placeholder="Doe"
    value={formData.lastName}
    onChange={handleChange}
    required={!isLogin}
  />
</div>
```

## Database Migration
The database schema automatically handles both new databases and existing databases:

1. **New Databases**: The `CREATE TABLE` statement includes the first_name and last_name columns
2. **Existing Databases**: The `ALTER TABLE` commands add the columns if they don't exist (errors are caught and ignored if columns already exist)

## User Experience
1. **Registration**: New users must provide their first and last names
2. **Admin Panel**: 
   - User list displays full names in a dedicated column
   - Users without names show "-" in the Full Name column
   - User creation/edit form includes first and last name fields
3. **Backward Compatibility**: Existing users without names will have empty strings, displaying as "-" in the UI

## Testing Checklist
- [ ] Create new user with first and last name via registration page
- [ ] Create new user with first and last name via admin panel
- [ ] View user list showing Full Name column
- [ ] Edit existing user to update name
- [ ] Verify existing users without names display correctly ("-")
- [ ] Test backend API endpoints return name fields
- [ ] Verify database migration runs successfully on existing database

## Notes
- First and last names are optional (default to empty string)
- The Full Name column displays a dash ("-") if both names are empty
- All name fields are stored as TEXT with NOT NULL DEFAULT '' constraint
- The migration is safe to run multiple times (idempotent)
