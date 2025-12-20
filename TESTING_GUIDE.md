# 🚀 Quick Start - Testing Authentication

## Step-by-Step Testing Guide

### 1. Start the Backend Server

Open a new PowerShell terminal and run:
```powershell
npm run server
```

**Expected Output:**
```
Database initialized successfully
Server running on port 3001
```

The server will automatically create the database with the enhanced users table including role support.

### 2. Start the Frontend

Open another PowerShell terminal and run:
```powershell
npm run dev
```

**Expected Output:**
```
Ready on http://localhost:3000
```

### 3. Test Registration

1. Open browser: http://localhost:3000
2. Click "Sign In" button
3. Click "Don't have an account? Sign up"
4. Fill in the registration form:
   - **Company Name:** Your Company Name
   - **Email:** admin@test.com
   - **Password:** admin123
   - **Role:** Admin (select from dropdown)
5. Click "Sign Up"

**Expected Result:**
- ✅ Automatically logged in
- ✅ Redirected to /dashboard
- ✅ Sidebar shows your email and company name
- ✅ Purple "Admin" badge displayed
- ✅ Logout button visible

### 4. Test the Dashboard

After logging in, you should see:
- ✅ Dashboard page with stats
- ✅ Sidebar navigation working
- ✅ Your user info in sidebar footer
- ✅ Admin role badge (purple)

### 5. Test Logout

1. Click "Logout" button in sidebar
2. **Expected Result:**
   - ✅ Redirected to /login
   - ✅ No longer have access to dashboard

### 6. Test Login

1. Fill in login form:
   - **Email:** admin@test.com
   - **Password:** admin123
2. Click "Sign In"

**Expected Result:**
- ✅ Logged in successfully
- ✅ Redirected to /dashboard
- ✅ Session restored

### 7. Test Session Persistence

1. While logged in, refresh the page (F5)
2. **Expected Result:**
   - ✅ Still logged in
   - ✅ User info still displayed
3. Close browser completely
4. Reopen and go to http://localhost:3000
5. **Expected Result:**
   - ✅ Automatically redirected to dashboard (still logged in)

### 8. Test Protected Routes

1. Logout completely
2. Try to access: http://localhost:3000/dashboard
3. **Expected Result:**
   - ✅ Automatically redirected to /login
   - ✅ Cannot access dashboard without authentication

### 9. Create a Regular User

1. Logout if logged in
2. Register a new account:
   - **Company Name:** Test Company
   - **Email:** user@test.com
   - **Password:** user123
   - **Role:** User (not Admin)
3. **Expected Result:**
   - ✅ Successfully registered
   - ✅ Blue "User" badge (not purple)

### 10. Test Role Display

Compare the two accounts:
- **Admin account:** Purple "Admin" badge
- **User account:** Blue "User" badge

## 🎯 What to Verify

### ✅ Checklist

- [ ] Backend server starts without errors
- [ ] Frontend starts without errors
- [ ] Can register new Admin account
- [ ] Can register new User account
- [ ] Login works with correct credentials
- [ ] Login fails with incorrect credentials
- [ ] Dashboard is protected (requires login)
- [ ] User info displays in sidebar
- [ ] Role badge shows correct color
- [ ] Logout works and redirects to login
- [ ] Session persists on page refresh
- [ ] Session persists on browser restart (within 7 days)
- [ ] Protected routes redirect to login when not authenticated

## 🔍 Debugging

### Check Browser Console
Press F12 in browser to open DevTools:
- Look for any red error messages
- Network tab should show successful API calls

### Check Backend Terminal
Look for:
- "Database initialized successfully"
- "Server running on port 3001"
- No error messages

### Check localStorage
In browser DevTools → Application → Local Storage:
- Should see: token, userId, email, companyName, role

## 📊 Test Different Scenarios

### Scenario 1: Invalid Credentials
1. Try to login with wrong password
2. **Expected:** Error message "Invalid credentials"

### Scenario 2: Duplicate Email
1. Try to register with existing email
2. **Expected:** Error message about duplicate email

### Scenario 3: Empty Fields
1. Try to submit login/register with empty fields
2. **Expected:** Browser validation prevents submission

## 🎉 Success Indicators

If you see all of these, authentication is working perfectly:

1. ✅ Can register and login
2. ✅ Dashboard is protected
3. ✅ User info displays correctly
4. ✅ Role badges show correct colors
5. ✅ Logout redirects to login
6. ✅ Sessions persist across refreshes
7. ✅ No errors in console or terminal

## 🐛 Common Issues

### "Cannot connect to server"
- **Solution:** Make sure backend is running on port 3001

### "Token expired"
- **Solution:** This is normal after 7 days - just login again

### "Database error"
- **Solution:** Delete database.db and restart backend server

### Page keeps redirecting
- **Solution:** Clear localStorage in browser DevTools

## 📞 Next Steps

Once authentication is working:
1. ✅ You can add more users
2. ✅ Each user's data will be isolated
3. ✅ Admin users can access all features
4. ✅ Sessions are secure and persistent

---

**Happy Testing! 🚀**

Everything is set up and ready to use. The authentication system is fully functional with role-based access control.
