# User Authentication & Role-Based Access Control

## Overview
This document describes the authentication system implemented in the Invoice Creator application with role-based access control.

## Features Implemented

### 1. User Roles
- **Admin**: Full access to all features and data
- **User**: Standard access to application features

### 2. Database Schema
The `users` table has been enhanced with:
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  company_name TEXT NOT NULL,
  role TEXT DEFAULT 'User' CHECK(role IN ('Admin', 'User')),
  is_active INTEGER DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 3. Authentication Flow

#### Login Process:
1. User enters email and password on `/login` page
2. Backend validates credentials and checks if user is active
3. JWT token is generated with user ID and role
4. Token and user info stored in localStorage
5. User redirected to dashboard

#### Registration Process:
1. User fills registration form (email, password, company name, role)
2. Password is hashed with bcrypt
3. User record created in database
4. JWT token generated and returned
5. User automatically logged in

#### Session Management:
- JWT tokens are valid for 7 days
- Token includes userId and role
- Auth middleware validates token on protected routes
- Last login timestamp updated on each successful login

### 4. Frontend Components

#### Login Page (`/login`)
- Toggleable login/register forms
- Email and password inputs
- Role selection for registration (Admin/User)
- Error handling and loading states
- Automatic redirect to dashboard on success

#### Auth Context (`lib/auth.tsx`)
- React Context for global auth state
- Hooks: `useAuth()`, `useRequireAuth()`, `useRequireAdmin()`
- Login/logout functionality
- Automatic persistence with localStorage

#### Protected Routes
- Dashboard layout requires authentication
- Automatic redirect to login if not authenticated
- Loading state while checking authentication

### 5. Backend Endpoints

#### Auth Endpoints:
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate and get token
- `GET /api/auth/me` - Get current user info (requires auth)
- `POST /api/auth/logout` - Logout (clears client session)

All endpoints return:
```json
{
  "token": "jwt-token-here",
  "userId": 1,
  "role": "Admin",
  "email": "user@example.com",
  "companyName": "Company Name"
}
```

### 6. Security Features
- Passwords hashed with bcrypt (10 rounds)
- JWT signed with secret key
- HTTPS recommended for production
- Active user check on login
- Token expiration (7 days)
- Protected API routes with middleware

## Usage

### Creating the First Admin User
When you first register, select "Admin" as the role. This will create an admin account.

### Login
1. Navigate to `http://localhost:3000` or `http://localhost:3000/login`
2. Enter your credentials
3. Click "Sign In"

### Logout
Click the "Logout" button in the sidebar.

### Checking User Role
In any component:
```typescript
const { user, isAdmin } = useAuth()

if (isAdmin) {
  // Admin-only functionality
}
```

## Migration for Existing Databases

If you have an existing database, run the migration:
```sql
-- Run database-migration-roles.sql
```

This will add the new columns to your existing users table.

## API Integration

When making API calls, include the token:
```typescript
const token = localStorage.getItem('token')

fetch('http://localhost:3001/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

## Future Enhancements

Potential improvements:
1. Password reset functionality
2. Email verification
3. Two-factor authentication (2FA)
4. Session timeout warnings
5. Password strength requirements
6. User management interface for admins
7. Audit logging for user actions
8. Refresh tokens for extended sessions
9. OAuth integration (Google, Microsoft)
10. Role-based feature restrictions in UI

## Troubleshooting

### Cannot Login
- Ensure backend server is running on port 3001
- Check browser console for errors
- Verify database.db file exists
- Check that user account is active (is_active = 1)

### Token Expired
- Tokens expire after 7 days
- User must log in again
- Old tokens are automatically rejected

### Database Issues
- Delete database.db to reset (will lose all data)
- Server will recreate tables on restart
- Run migration script for existing databases
