# Feature 4: Authentication System - Testing Guide

## What Was Implemented

✅ **Backend Auth Routes** (`server/routes/auth.js`):

- `POST /api/auth/signup` - User registration with validation
- `POST /api/auth/login` - User login with password verification
- `POST /api/auth/logout` - User logout with session destruction
- `GET /api/auth/me` - Get current logged-in user
- `GET /api/auth/check` - Quick authentication check

✅ **Security Features**:

- Password hashing with bcrypt (10 salt rounds)
- Session management with express-session
- Input validation with express-validator
- Duplicate email/username prevention

✅ **Frontend Integration**:

- Updated `js/login.js` with real API calls
- Updated `js/signup.js` with real API calls
- Error message display
- Loading states
- Success feedback

✅ **User Experience**:

- Auto-generated usernames from email
- Password visibility toggle (existing feature)
- Client-side and server-side validation
- Automatic redirect after successful auth

## Testing Instructions

### Preparation

1. **Make sure server is running:**

   ```cmd
   npm start
   ```

2. **Open browser:**
   - Navigate to: http://localhost:3000

---

### Test 1: User Signup

1. **Go to signup page:**

   - Click "Sign up" link or go to: http://localhost:3000/signup.html

2. **Fill out the form:**

   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
   - Check the Terms checkbox

3. **Click "Create Account"**

**Expected Results:**

- ✅ Green success message: "Account created successfully! Redirecting to dashboard..."
- ✅ Automatically redirected to dashboard after 1.5 seconds
- ✅ User created in database with hashed password

**Test Edge Cases:**

- Try signup with same email again → Should show "Email already registered"
- Try password < 6 characters → Should show validation error
- Try mismatched passwords → Should show "Passwords do not match!"
- Try leaving fields empty → Should show "Please fill out all fields"

---

### Test 2: User Login

1. **Go to login page:**

   - Go to: http://localhost:3000/login.html

2. **Login with created account:**

   - Email: `test@example.com`
   - Password: `password123`

3. **Click "Log in"**

**Expected Results:**

- ✅ Redirected to dashboard immediately
- ✅ Session created (stored in browser cookies)

**Test Edge Cases:**

- Try wrong email → Should show "Invalid email or password"
- Try wrong password → Should show "Invalid email or password"
- Try empty fields → Should show "Please enter both email and password"

---

### Test 3: Session Persistence

1. **After logging in, try these:**
   - Refresh the page → Should stay logged in
   - Navigate to different pages → Should stay logged in
   - Check auth status: http://localhost:3000/api/auth/me

**Expected Results:**

- ✅ API returns user data with 200 status
- ✅ Session persists across page refreshes
- ✅ Response shows: `{ success: true, user: {...} }`

---

### Test 4: User Logout

1. **Test logout endpoint:**
   Open browser console (F12) and run:

   ```javascript
   fetch("/api/auth/logout", { method: "POST" })
     .then((r) => r.json())
     .then(console.log);
   ```

2. **Check auth status again:**
   ```javascript
   fetch("/api/auth/me")
     .then((r) => r.json())
     .then(console.log);
   ```

**Expected Results:**

- ✅ Logout returns: `{ success: true, message: "Logout successful" }`
- ✅ /me returns: `{ success: false, message: "Not authenticated" }` with 401 status
- ✅ Session cleared

---

### Test 5: API Endpoints (Using Browser/Postman)

**Test Signup Endpoint:**

```javascript
fetch("http://localhost:3000/api/auth/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "johndoe",
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

**Test Login Endpoint:**

```javascript
fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "john@example.com",
    password: "password123",
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

**Test Get Current User:**

```javascript
fetch("http://localhost:3000/api/auth/me")
  .then((r) => r.json())
  .then(console.log);
```

---

### Test 6: Database Verification

Check that users are stored correctly:

**Option 1: Using MySQL Workbench or Command Line:**

```sql
USE 3movieCollectors;
SELECT userID, username, name, email, role, registrationDate FROM User;
```

**Option 2: Using npm script:**

```cmd
npm run db:verify
```

Look for rows in the `user` table (should show 1+ users)

**Expected Results:**

- ✅ Users exist in database
- ✅ Passwords are hashed (NOT plain text)
- ✅ Username is auto-generated from email
- ✅ Role is set to 'user' by default

---

## Testing Checklist

Please confirm the following:

- [ ] **Signup Works:** Can create new user account
- [ ] **Duplicate Prevention:** Cannot signup with same email twice
- [ ] **Validation:** Password length, email format validated
- [ ] **Login Works:** Can login with correct credentials
- [ ] **Login Fails:** Wrong credentials show error message
- [ ] **Session Persists:** Stays logged in after page refresh
- [ ] **Get Current User:** `/api/auth/me` returns user data when logged in
- [ ] **Logout Works:** Session cleared after logout
- [ ] **Passwords Hashed:** Passwords stored as hashes in database
- [ ] **UI Feedback:** Error/success messages display properly

---

## Troubleshooting

### Error: "Cannot find module 'bcrypt'"

Run: `npm install`

### Error: "Session not saving"

Check that express-session is configured in app.js (already done)

### Error: "CORS issues"

This shouldn't happen since frontend and backend are same origin

### Passwords not matching

Make sure bcrypt is installed: `npm install bcrypt`

### Users not appearing in database

- Check database connection in server logs
- Verify User table exists: `npm run db:verify`
- Check for SQL errors in console

---

## Security Notes

✅ **Passwords are hashed** - Never stored in plain text
✅ **Sessions are secure** - HttpOnly cookies prevent XSS
✅ **Input validation** - Both client and server side
✅ **SQL injection prevention** - Using parameterized queries
✅ **Duplicate prevention** - Unique constraints on email/username

---

## What's Next?

Once Feature 4 is confirmed working, we'll move to:

- **Feature 5:** Global Frontend app.js (shared utilities)

Then continue with the remaining features from the plan!

---

**Please test all scenarios and confirm:**

1. Can you create a new account?
2. Can you login with that account?
3. Does the session persist across refreshes?
4. Are passwords hashed in the database?

Let me know the results! 🔐
