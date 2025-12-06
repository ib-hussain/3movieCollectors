# Feature 5 Testing Guide - Global Frontend app.js

## Overview

Feature 5 provides a global JavaScript application object (`App`) with reusable utilities, API helpers, and consistent UI components. This eliminates code duplication and establishes a foundation for all future pages.

## What We Built

### 1. Global App Object (`js/app.js`)

- **API Helpers**: `App.get()`, `App.post()`, `App.patch()`, `App.delete()`, `App.fetchJSON()`
- **Auth Helpers**: `App.checkAuth()`, `App.getCurrentUser()`, `App.logout()`, `App.requireAuth()`
- **UI Helpers**: `App.showToast()`, `App.showError()`, `App.showSuccess()`, `App.showWarning()`, `App.showInfo()`
- **Loading States**: `App.showLoading()`, `App.hideLoading()`
- **Utilities**: `App.formatDate()`, `App.formatDateTime()`, `App.debounce()`
- **Page Initialization**: Automatic page-specific initialization via `window.initPage[pageName]`

### 2. Refactored Login & Signup

- **Removed duplicate code**: Error handling, fetch calls, loading states
- **Using App utilities**: Toast notifications, API calls via `App.post()`
- **Page initialization pattern**: `window.initPage.login` and `window.initPage.signup`

## Files Modified

```
✅ js/app.js (NEW) - Global application utilities
✅ js/login.js (UPDATED) - Refactored to use App utilities
✅ js/signup.js (UPDATED) - Refactored to use App utilities
✅ html/login.html (UPDATED) - Added data-page="login" and app.js script
✅ html/signup.html (UPDATED) - Added data-page="signup" and app.js script
```

---

## Testing Instructions

### Prerequisites

1. **Server running**: `node app.js` (should show "Database: ✓ Connected")
2. **Browser**: Chrome/Firefox/Edge with DevTools open
3. **Clean state**: Clear cookies or use incognito mode

### Test 1: Login with App Toast Notifications

**What to test**: Login page now uses global toast notifications

**Steps**:

1. Open http://localhost:3000/html/login.html
2. Open DevTools Console
3. **Check initialization**:

   ```
   Expected Console Output:
   [App] Global application loaded
   [App] Initializing page: login
   [Login] Page initialized
   ```

4. **Test error toast**:

   - Click "Log in" without entering credentials
   - **Expected**: Top-right toast appears with red background
   - Message: "Please enter both email and password."
   - Toast auto-disappears after 5 seconds

5. **Test invalid credentials**:

   - Email: `wrong@email.com`
   - Password: `wrongpass`
   - Click "Log in"
   - **Expected**: Red error toast: "Invalid email or password"

6. **Test successful login**:
   - Email: (use your registered email from Feature 4)
   - Password: (your password)
   - Click "Log in"
   - **Expected**:
     - Green success toast: "Login successful! Redirecting..."
     - Button shows "Logging in..." (disabled)
     - Redirect to dashboard.html after 0.5 seconds

✅ **Pass Criteria**: All toasts appear in top-right, have correct colors, auto-dismiss, and login redirects successfully

---

### Test 2: Signup with App Utilities

**What to test**: Signup page uses App API helpers and toasts

**Steps**:

1. Open http://localhost:3000/html/signup.html
2. Open DevTools Console
3. **Check initialization**:

   ```
   Expected Console Output:
   [App] Global application loaded
   [App] Initializing page: signup
   [Signup] Page initialized
   ```

4. **Test password validation**:

   - Full Name: `Jane Doe`
   - Email: `jane@example.com`
   - Password: `123` (too short)
   - Confirm Password: `123`
   - Click "Create Account"
   - **Expected**: Red error toast: "Password must be at least 6 characters long."

5. **Test password mismatch**:

   - Password: `password123`
   - Confirm Password: `password456`
   - Click "Create Account"
   - **Expected**: Red error toast: "Passwords do not match!"

6. **Test successful signup**:
   - Full Name: `Jane Doe`
   - Email: `jane.doe@example.com` (new unique email)
   - Password: `password123`
   - Confirm Password: `password123`
   - Click "Create Account"
   - **Expected**:
     - Green success toast: "Account created successfully! Redirecting to dashboard..."
     - Button shows "Creating Account..." (disabled)
     - Redirect to dashboard.html after 1.5 seconds

✅ **Pass Criteria**: All validations show error toasts, successful signup shows success toast and redirects

---

### Test 3: App API Helpers

**What to test**: `App.fetchJSON()`, `App.post()`, `App.get()` work correctly

**Steps**:

1. Stay logged in (from Test 1 or Test 2)
2. Open http://localhost:3000/html/dashboard.html (or any page)
3. Open DevTools Console
4. **Test GET request**:

   ```javascript
   const user = await App.get("/auth/me");
   console.log(user);
   ```

   **Expected**:

   ```javascript
   {
     success: true,
     user: {
       userId: 1,
       username: "your_username",
       name: "Your Name",
       email: "your@email.com",
       role: "user"
     }
   }
   ```

5. **Test authentication check**:

   ```javascript
   const isAuth = await App.checkAuth();
   console.log("Authenticated:", isAuth);
   console.log("Current User:", App.currentUser);
   ```

   **Expected**:

   ```
   Authenticated: true
   Current User: { userId: 1, username: "...", ... }
   ```

6. **Test error handling**:
   ```javascript
   try {
     await App.get("/auth/nonexistent");
   } catch (error) {
     console.log("Caught error:", error.message);
   }
   ```
   **Expected**: `Caught error: Cannot GET /api/auth/nonexistent`

✅ **Pass Criteria**: All API calls work, return expected JSON, and errors are caught properly

---

### Test 4: UI Helpers - Toast System

**What to test**: All toast types and behaviors

**Steps**:

1. Open any page (e.g., http://localhost:3000/html/login.html)
2. Open DevTools Console
3. **Test all toast types**:

   ```javascript
   App.showError("This is an error message");
   ```

   **Expected**: Red toast in top-right corner

   ```javascript
   App.showSuccess("This is a success message");
   ```

   **Expected**: Green toast replaces previous one

   ```javascript
   App.showWarning("This is a warning message");
   ```

   **Expected**: Yellow/orange toast

   ```javascript
   App.showInfo("This is an info message");
   ```

   **Expected**: Blue toast

4. **Test custom duration**:

   ```javascript
   App.showToast("This disappears in 1 second", "info", 1000);
   ```

   **Expected**: Toast auto-removes after 1 second

5. **Test toast replacement**:
   ```javascript
   App.showError("First message");
   App.showSuccess("Second message"); // Should replace first
   ```
   **Expected**: Only one toast visible at a time

✅ **Pass Criteria**: All toast types show with correct colors, only one toast visible at a time, auto-dismiss works

---

### Test 5: Loading Overlay

**What to test**: Global loading overlay for async operations

**Steps**:

1. Open DevTools Console on any page
2. **Test show/hide loading**:

   ```javascript
   App.showLoading("Processing...");
   ```

   **Expected**:

   - Full-screen semi-transparent overlay
   - White card in center
   - Spinning blue loader
   - Text: "Processing..."

3. **Wait 3 seconds, then hide**:

   ```javascript
   setTimeout(() => App.hideLoading(), 3000);
   ```

   **Expected**: Overlay smoothly disappears after 3 seconds

4. **Test async operation**:
   ```javascript
   async function testLoading() {
     App.showLoading("Fetching data...");
     await new Promise((resolve) => setTimeout(resolve, 2000));
     App.hideLoading();
     App.showSuccess("Data loaded!");
   }
   testLoading();
   ```
   **Expected**: Loading overlay for 2 seconds, then success toast

✅ **Pass Criteria**: Loading overlay appears correctly, blocks interaction, hides cleanly

---

### Test 6: Date Formatting Utilities

**What to test**: `App.formatDate()` and `App.formatDateTime()`

**Steps**:

1. Open DevTools Console
2. **Test date formatting**:

   ```javascript
   App.formatDate("2024-01-15T10:30:00Z");
   ```

   **Expected**: `"January 15, 2024"`

   ```javascript
   App.formatDateTime("2024-01-15T10:30:00Z");
   ```

   **Expected**: `"Jan 15, 2024, 10:30 AM"` (or similar based on timezone)

   ```javascript
   App.formatDate(new Date());
   ```

   **Expected**: Today's date in readable format

✅ **Pass Criteria**: Dates format correctly and are human-readable

---

### Test 7: Debounce Utility

**What to test**: `App.debounce()` delays function execution

**Steps**:

1. Open DevTools Console
2. **Test debounced function**:

   ```javascript
   let count = 0;
   const debouncedFn = App.debounce(() => {
     count++;
     console.log("Executed:", count);
   }, 500);

   // Call multiple times rapidly
   debouncedFn();
   debouncedFn();
   debouncedFn();
   debouncedFn();
   ```

   **Expected**: Only logs "Executed: 1" once, 500ms after last call

3. **Test with different delays**:
   ```javascript
   const quickDebounce = App.debounce(() => {
     console.log("Quick execution");
   }, 100);
   quickDebounce();
   ```
   **Expected**: Logs after 100ms

✅ **Pass Criteria**: Function only executes once after delay, regardless of how many times called

---

### Test 8: Page Initialization System

**What to test**: Automatic page-specific initialization

**Steps**:

1. **Test login page**:

   - Open http://localhost:3000/html/login.html
   - Check Console
   - **Expected**: `[Login] Page initialized`

2. **Test signup page**:

   - Open http://localhost:3000/html/signup.html
   - Check Console
   - **Expected**: `[Signup] Page initialized`

3. **Test page with no initializer** (e.g., index.html):

   - Open http://localhost:3000/html/index.html
   - Check Console
   - **Expected**: `[App] Initializing page: index` (but no error if initPage.index doesn't exist)

4. **Verify data-page attribute**:
   - Open DevTools Inspector on login.html
   - Check `<body>` tag
   - **Expected**: `<body data-page="login">`

✅ **Pass Criteria**: Pages initialize correctly, console shows proper logs, no errors

---

### Test 9: Authentication Flow Integration

**What to test**: Complete auth flow with new utilities

**Steps**:

1. **Start logged out**:

   - Clear cookies or use incognito
   - Open http://localhost:3000/html/login.html

2. **Complete signup**:

   - Navigate to signup page
   - Create new account
   - **Expected**: Success toast → redirect to dashboard

3. **Verify session persists**:

   - Open Console on dashboard
   - Run: `await App.checkAuth()`
   - **Expected**: Returns `true`, `App.currentUser` populated

4. **Test logout** (when we build it):
   - Run: `await App.logout()`
   - **Expected**: Redirect to index.html, session cleared

✅ **Pass Criteria**: Signup → Login → Session persists → Logout all work seamlessly with App utilities

---

### Test 10: Browser Compatibility

**What to test**: Works across browsers

**Steps**:

1. **Test in Chrome**: Follow Tests 1-9
2. **Test in Firefox**: Follow Tests 1-9
3. **Test in Edge**: Follow Tests 1-9

✅ **Pass Criteria**: All features work identically across browsers

---

## Expected Database State After Testing

Run `npm run db:verify` after testing:

```
Expected Output:
- user: 2+ rows (original user + Jane Doe from Test 2)
- movie: 20 rows (unchanged)
- moviecast: 100 rows (unchanged)
- genres: 13 rows (unchanged)
- All other tables: 0 rows
```

---

## Verification Checklist

Before moving to Feature 6, confirm:

- [ ] Login page uses App toast notifications
- [ ] Signup page uses App toast notifications
- [ ] Console shows proper page initialization logs
- [ ] All toast types (error, success, warning, info) display correctly
- [ ] Loading overlay appears and hides properly
- [ ] `App.get()`, `App.post()` API calls work
- [ ] `App.checkAuth()` returns user data
- [ ] `App.formatDate()` and `App.formatDateTime()` format correctly
- [ ] `App.debounce()` delays function execution
- [ ] No duplicate error/success divs in login/signup (removed in refactor)
- [ ] Browser console shows no errors
- [ ] All tests pass in Chrome, Firefox, and Edge

---

## Common Issues & Solutions

### Issue: "App is not defined"

**Cause**: `app.js` not loaded before page-specific JS
**Solution**: Verify `<script src="../js/app.js"></script>` comes before other scripts in HTML

### Issue: Toast doesn't appear

**Cause**: Z-index conflict or CSS override
**Solution**: Check console for errors, ensure no CSS rules blocking toast (z-index: 9999)

### Issue: Page initialization doesn't run

**Cause**: Missing `data-page` attribute or incorrect page name
**Solution**: Add `data-page="pagename"` to `<body>` tag, ensure `window.initPage.pagename` matches

### Issue: Hard refresh required for changes

**Cause**: Browser caching
**Solution**: Use Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac) for hard refresh

---

## What's Next?

After confirming Feature 5 is working:

**Feature 6: Dashboard** - User dashboard with watchlist summary, recent activity, friend updates, and recommended movies using App utilities

Would you like to proceed to Feature 6?
