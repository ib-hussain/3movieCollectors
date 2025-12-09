# User Management Testing Guide

**Last Updated:** December 9, 2025  
**Page:** User Management (Phase 7)  
**URL:** `http://localhost:3000/html/admin/admin-users.html`

---

## 🎯 Testing Objectives

Verify that all user management features work correctly including:

- User listing with pagination
- Search and filter functionality
- Suspend/unsuspend users
- Change user roles
- Real-time stats updates
- Authentication and authorization

---

## ✅ Pre-Testing Checklist

### 1. Server Setup

- [ ] Server is running: `node app.js` from project root
- [ ] Database is connected (check terminal output)
- [ ] Port 3000 is accessible

### 2. Admin Login

- [ ] Navigate to: `http://localhost:3000/html/login.html`
- [ ] Login with admin credentials:
  - **Email:** `admin@3moviecollectors.com`
  - **Username:** `admin`
  - **Password:** [your admin password]
- [ ] Verify redirect to admin dashboard

### 3. Navigation

- [ ] Click "Users" in sidebar or navigate directly to:
  - `http://localhost:3000/html/admin/admin-users.html`
- [ ] Page loads without errors
- [ ] No console errors (F12 → Console tab)

---

## 📊 Test Cases

### **TEST 1: Page Load & Stats Cards** ✅ READY TO TEST

**Objective:** Verify page loads correctly with accurate statistics

**Preparation:**

- ✅ Dummy data created: 15 regular users + 2 suspended users + 1 admin
- ✅ Server running on port 3000
- ✅ Admin logged in

**Steps:**

1. Navigate to: `http://localhost:3000/html/admin/admin-users.html`
2. Wait for page to load completely (2-3 seconds)
3. Observe the 4 stats cards at the top of the page
4. Compare displayed numbers with expected values

**Expected Results:**

- ✅ **Total Users** card displays: **20**
- ✅ **Active Users** card displays: **18** (20 total - 2 suspended)
- ✅ **Suspended Users** card displays: **2**
  - bob_wilson (Violated community guidelines)
  - edward_stark (Spam posting)
- ✅ **Admins** card displays: **1** (Administrator)
- ✅ All icons display correctly with gradient backgrounds:
  - Total Users: Purple gradient (👥)
  - Active Users: Green gradient (✓)
  - Suspended Users: Red/orange gradient (⊘)
  - Admins: Blue gradient (🛡️)
- ✅ Numbers appear within 2 seconds of page load
- ✅ No loading spinners or errors visible

**Actual Results:** (Fill in during testing)

- Total Users: \_\_\_
- Active Users: \_\_\_
- Suspended Users: \_\_\_
- Admins: \_\_\_

**Debug Information:**

- Check browser console (F12) for any errors
- Check Network tab for API call: `/api/admin/dashboard/overview`
- Expected response includes: `totalUsers`, `suspendedUsers`
- Check second API call: `/api/admin/users?role=admin&limit=1` for admin count

**Pass Criteria:** All 4 stats display exactly:

- Total: 20
- Active: 18
- Suspended: 2
- Admins: 1

**Status:** [ ] Pass / [ ] Fail

**Notes:**

---

---

### **TEST 2: User Table Display**

**Objective:** Verify user table renders correctly

**Steps:**

1. Scroll to the users table
2. Check table headers and content

**Expected Results:**

- ✅ Table has 8 columns: ID, Username, Name, Email, Role, Status, Registered, Actions
- ✅ Users display in rows with correct data
- ✅ Role badges show "USER" (blue) or "ADMIN" (yellow)
- ✅ Status badges show "ACTIVE" (green) or "SUSPENDED" (red)
- ✅ Registration dates formatted as "MMM DD, YYYY"
- ✅ Action buttons visible for each user

**Pass Criteria:** Table displays all users with properly formatted data

---

### **TEST 3: Search Functionality**

**Objective:** Verify search works with debouncing

**Steps:**

1. Type in search box: partial username (e.g., "john")
2. Wait 500ms for debounce
3. Try searching by email
4. Try searching by name
5. Clear search box

**Expected Results:**

- ✅ Results filter after 500ms delay (not instant)
- ✅ Search matches username, email, OR name
- ✅ "No users found" message shows if no matches
- ✅ Clearing search shows all users again
- ✅ Console logs show "Search filter changed: [query]"

**Pass Criteria:** Search filters correctly with 500ms debounce

---

### **TEST 4: Role Filter**

**Objective:** Verify role filtering works

**Steps:**

1. Select "Users" from Role dropdown
2. Observe filtered results
3. Select "Admins" from Role dropdown
4. Select "All Roles"

**Expected Results:**

- ✅ "Users" shows only users with role=user
- ✅ "Admins" shows only admin (should be 1)
- ✅ "All Roles" shows all users
- ✅ Page resets to 1 when filter changes
- ✅ Total count updates accordingly
- ✅ Console logs "Role filter changed: [value]"

**Pass Criteria:** Filter correctly shows users by role

---

### **TEST 5: Status Filter**

**Objective:** Verify status filtering works

**Steps:**

1. Select "Active" from Status dropdown
2. Observe filtered results
3. Select "Suspended" from Status dropdown
4. Select "All Status"

**Expected Results:**

- ✅ "Active" shows only non-suspended users
- ✅ "Suspended" shows only suspended users (may be 0)
- ✅ "All Status" shows all users
- ✅ Page resets to 1 when filter changes
- ✅ Console logs "Status filter changed: [value]"

**Pass Criteria:** Filter correctly shows users by suspension status

---

### **TEST 6: Combined Filters**

**Objective:** Verify multiple filters work together

**Steps:**

1. Set Role to "Users"
2. Set Status to "Active"
3. Type in search box
4. Click "Reset" button

**Expected Results:**

- ✅ All filters apply simultaneously
- ✅ Results match all filter criteria (AND logic)
- ✅ Reset button clears all filters
- ✅ All dropdowns reset to default values
- ✅ Search box clears
- ✅ Console logs "Filters reset"

**Pass Criteria:** Filters work in combination and reset properly

---

### **TEST 7: Pagination**

**Objective:** Verify pagination works correctly

**Steps:**

1. Check if more than 10 users exist
2. Click "Next" button
3. Click "Previous" button
4. Check pagination info

**Expected Results:**

- ✅ Shows 10 users per page
- ✅ "Next" button enabled if more pages exist
- ✅ "Previous" button disabled on page 1
- ✅ Pagination info shows: "Page X of Y (Total: Z users)"
- ✅ Page numbers update correctly
- ✅ Users load when changing pages

**Pass Criteria:** Pagination controls work and display correct info

---

### **TEST 8: Suspend User**

**Objective:** Verify user suspension functionality

**Steps:**

1. Find a regular user (not admin)
2. Click "Suspend" button
3. Modal appears with suspension form
4. Enter suspension reason: "Test suspension"
5. Click "Suspend User" button
6. Check user status in table

**Expected Results:**

- ✅ Suspend modal opens with user info
- ✅ Reason textarea is required
- ✅ Cannot submit without reason
- ✅ Success message appears after suspension
- ✅ Modal closes automatically
- ✅ User status badge changes to "SUSPENDED" (red)
- ✅ "Suspend" button changes to "Unsuspend" button
- ✅ Suspended Users stat card increments by 1
- ✅ Console logs "User [ID] suspended"
- ✅ Page refreshes user list

**Pass Criteria:** User successfully suspended with all UI updates

---

### **TEST 9: Unsuspend User**

**Objective:** Verify user unsuspension functionality

**Steps:**

1. Find the suspended user from TEST 8
2. Click "Unsuspend" button
3. Confirmation modal appears
4. Click "Unsuspend User" button
5. Check user status in table

**Expected Results:**

- ✅ Unsuspend modal opens with user info
- ✅ Confirmation message displayed
- ✅ Success message appears after unsuspension
- ✅ Modal closes automatically
- ✅ User status badge changes to "ACTIVE" (green)
- ✅ "Unsuspend" button changes back to "Suspend"
- ✅ Suspended Users stat card decrements by 1
- ✅ Console logs "User [ID] unsuspended"
- ✅ Page refreshes user list

**Pass Criteria:** User successfully unsuspended with all UI updates

---

### **TEST 9B: Self-Suspension Prevention** 🆕

**Objective:** Verify admin cannot suspend themselves

**Steps:**

1. Find your own admin account in table (username: "admin")
2. Click "Suspend" button
3. Modal appears with suspension form
4. Enter any reason: "Testing self-suspension"
5. Click "Suspend User" button

**Expected Results:**

- ✅ Suspend modal opens normally
- ✅ Can enter suspension reason
- ✅ Error message appears: "Cannot suspend yourself"
- ✅ Modal may close or remain open showing error
- ✅ Status remains "ACTIVE"
- ✅ No changes made to admin account
- ✅ Suspended Users count does NOT increment
- ✅ Console may log error

**Pass Criteria:** System prevents admin self-suspension with clear error message

---

### **TEST 10: Change User Role to Admin**

**Objective:** Verify promoting user to admin

**Steps:**

1. Find a regular user
2. Click "Role" button
3. Modal appears with role dropdown
4. Select "Admin" from dropdown
5. Click "Change Role" button
6. Check user role in table

**Expected Results:**

- ✅ Role modal opens with user info
- ✅ Current role pre-selected in dropdown
- ✅ Can select "User" or "Admin"
- ✅ Success message appears after change
- ✅ Modal closes automatically
- ✅ Role badge changes to "ADMIN" (yellow)
- ✅ Admins stat card increments by 1
- ✅ Console logs "User [ID] role changed to admin"
- ✅ Page refreshes user list

**Pass Criteria:** User role successfully changed to admin

---

### **TEST 11: Change Admin Role to User**

**Objective:** Verify demoting admin to user

**Steps:**

1. Find the user promoted in TEST 10
2. Click "Role" button
3. Select "User" from dropdown
4. Click "Change Role" button
5. Check user role in table

**Expected Results:**

- ✅ Role modal opens
- ✅ Success message appears
- ✅ Role badge changes to "USER" (blue)
- ✅ Admins stat card decrements by 1
- ✅ Console logs "User [ID] role changed to user"

**Pass Criteria:** Admin role successfully changed to user

---

### **TEST 12: Self-Demotion Prevention**

**Objective:** Verify admin cannot demote themselves

**Steps:**

1. Find your own admin account in table (username: "admin")
2. Click "Role" button
3. Select "User" from dropdown
4. Click "Change Role" button

**Expected Results:**

- ✅ Error message appears: "Cannot demote yourself from admin"
- ✅ Role remains "ADMIN"
- ✅ No changes made to database
- ✅ Modal may close or show error

**Pass Criteria:** System prevents self-demotion

---

### **TEST 13: Modal Close Functionality**

**Objective:** Verify all modal close methods work

**Steps:**

1. Open Suspend modal → Click X button
2. Open Suspend modal → Click "Cancel" button
3. Open Suspend modal → Click outside modal (background)
4. Repeat for Unsuspend modal
5. Repeat for Role modal

**Expected Results:**

- ✅ X button closes modal
- ✅ Cancel button closes modal
- ✅ Clicking background closes modal
- ✅ No data submitted when closing
- ✅ Selected user ID resets

**Pass Criteria:** All close methods work for all modals

---

### **TEST 14: Real-time Updates (Polling)**

**Objective:** Verify stats update every 30 seconds

**Steps:**

1. Open User Management page
2. Note current stats
3. In another browser tab, suspend a user (or change data)
4. Wait 30 seconds
5. Check if stats updated automatically

**Expected Results:**

- ✅ Stats refresh every 30 seconds
- ✅ Console logs "Stats loaded: [data]" every 30 seconds
- ✅ Changes from other tabs reflect automatically
- ✅ No page refresh required

**Pass Criteria:** Polling works and stats update automatically

---

### **TEST 15: Notification Bell**

**Objective:** Verify notification bell integration

**Steps:**

1. Click the bell icon in top bar
2. Observe redirect

**Expected Results:**

- ✅ Redirects to dashboard at: `/html/admin/admin-dashboard.html#notifications`
- ✅ Dashboard loads
- ✅ Scrolls to notifications section smoothly

**Pass Criteria:** Notification bell navigates to dashboard notifications

---

### **TEST 16: Logout Functionality**

**Objective:** Verify logout works correctly

**Steps:**

1. Click logout button in sidebar or top bar
2. Confirm logout in dialog
3. Observe redirect

**Expected Results:**

- ✅ Confirmation dialog appears
- ✅ Clicking "OK" logs out and redirects to `/html/login.html`
- ✅ Clicking "Cancel" stays on page
- ✅ Session cleared (cannot access admin pages)
- ✅ Console logs "Logout error" if any issues

**Pass Criteria:** Logout works and clears session

---

### **TEST 17: Authorization Check**

**Objective:** Verify non-admin users cannot access page

**Steps:**

1. Logout from admin account
2. Login as regular user
3. Try to access: `http://localhost:3000/html/admin/admin-users.html`

**Expected Results:**

- ✅ Alert: "Access denied. Admin privileges required."
- ✅ Redirects to `/html/login.html`
- ✅ Cannot access page content
- ✅ Console logs "Auth check failed"

**Pass Criteria:** Non-admin users blocked from accessing page

---

### **TEST 18: Direct URL Access (No Session)**

**Objective:** Verify page blocks unauthenticated access

**Steps:**

1. Open incognito/private window
2. Navigate directly to: `http://localhost:3000/html/admin/admin-users.html`

**Expected Results:**

- ✅ Alert: "Access denied. Admin privileges required."
- ✅ Redirects to `/html/login.html`
- ✅ No user data loaded
- ✅ Page doesn't render

**Pass Criteria:** Unauthenticated access blocked

---

### **TEST 19: Error Handling**

**Objective:** Verify graceful error handling

**Steps:**

1. Stop the server (`Ctrl+C`)
2. Try to suspend a user
3. Try to change role
4. Restart server

**Expected Results:**

- ✅ Error messages display: "Failed to suspend user" / "Failed to change user role"
- ✅ Console shows error details
- ✅ Page doesn't crash
- ✅ User can retry after server restarts

**Pass Criteria:** Errors handled gracefully without crashes

---

### **TEST 20: Responsive Design**

**Objective:** Verify page works on different screen sizes

**Steps:**

1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)

**Expected Results:**

- ✅ Layout adapts to screen size
- ✅ Table scrolls horizontally on small screens
- ✅ Filters stack vertically on mobile
- ✅ Modals fit within viewport
- ✅ Action buttons remain accessible
- ✅ No horizontal overflow

**Pass Criteria:** Page usable on all screen sizes

---

## 🐛 Known Issues & Limitations

### Current Limitations:

1. **No Soft Delete UI:** isDeleted flag exists but no delete button implemented
2. **No User Details View:** No modal to view full user details
3. **No Activity Stats:** User stats (posts, reviews) not displayed
4. **Simple Alerts:** Using browser alerts instead of toast notifications
5. **No Bulk Actions:** Cannot suspend/delete multiple users at once

### Future Enhancements:

- View user details modal with activity history
- Soft delete functionality
- Export users to CSV
- Bulk user operations
- Advanced search with date ranges
- User profile picture display
- Suspension duration settings
- Email notification on suspension

---

## 📝 Test Results Template

Copy this template to document your test results:

```
## Test Execution Report
**Date:** [DATE]
**Tester:** [NAME]
**Browser:** [Chrome/Firefox/Edge + Version]
**Server:** Running on port 3000

### Summary
- Total Tests: 20
- Passed: __/20
- Failed: __/20
- Skipped: __/20

### Failed Tests (if any):
1. TEST #: [Test Name]
   - Issue: [Description]
   - Steps to Reproduce: [Steps]
   - Expected: [Expected result]
   - Actual: [Actual result]
   - Screenshot: [Link if available]

### Notes:
[Any additional observations]
```

---

## 🔧 Troubleshooting

### Issue: "Access denied" alert

**Solution:** Ensure logged in as admin with role='admin'

### Issue: Users not loading

**Solution:**

1. Check server console for errors
2. Verify database connection
3. Check browser console for API errors

### Issue: Stats showing 0

**Solution:**

1. Verify users exist in database
2. Check `/api/admin/dashboard/overview` endpoint
3. Restart server if needed

### Issue: Suspend/Unsuspend not working

**Solution:**

1. Check server console for SQL errors
2. Verify session exists (`req.session.userId`)
3. Check user is not trying to suspend themselves

### Issue: Polling not working

**Solution:**

1. Check console for repeated API calls every 30s
2. Verify no JavaScript errors
3. Check network tab for requests

---

## ✅ Sign-Off Checklist

Before marking User Management as complete:

- [ ] All 20 tests passed
- [ ] No console errors
- [ ] No server errors
- [ ] Stats display correctly
- [ ] Search and filters work
- [ ] Suspend/unsuspend functional
- [ ] Role changes work
- [ ] Authorization enforced
- [ ] Pagination works
- [ ] Responsive on mobile
- [ ] Real-time updates work
- [ ] Modals function properly
- [ ] Logout works
- [ ] Performance acceptable (<2s load time)
- [ ] Code reviewed for security issues

---

## 📚 Additional Resources

- **API Endpoints:** `/api/admin/users` (GET, PUT)
- **Database Table:** `User` table schema
- **Related Pages:** Admin Dashboard, Movie Management
- **Backend Routes:** `server/routes/admin/users.js`
- **Frontend Code:** `js/admin/admin-users.js`

---

**Testing Complete!** ✅

Once all tests pass, update `PROGRESS_SUMMARY.md` and proceed to Phase 8: Moderation Interface.
