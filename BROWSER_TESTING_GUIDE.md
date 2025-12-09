# Browser Testing Guide - Admin System

**Date:** December 9, 2025  
**Status:** Ready for Testing

---

## 🎯 Testing Checklist

### Prerequisites ✅

- [x] Server running on localhost:3000
- [x] Database connected
- [x] Admin user exists

---

## 📋 Test Phases

### Phase 1: Server & Authentication Testing

**Test File:** `test-dashboard.html`  
**URL:** Open in browser from file system or via server

#### Tests to Perform:

1. ☐ **Server Health Check**

   - Click "Check Server" button
   - Should show: ✅ Server is online with health data

2. ☐ **Admin Login Test**

   - Click "Test Admin Login" button
   - Should show: ✅ Admin login successful
   - Check: User role = "admin"

3. ☐ **Dashboard API Test**
   - Click "Test Dashboard API" button
   - Should show: ✅ Dashboard API working
   - Check: Returns stats (users, movies, flags, posts)

---

### Phase 2: Admin Dashboard Testing

**URL:** `html/admin/admin-dashboard.html`  
**Direct:** Click "Open Dashboard" from test page

#### 2.1 Authentication & Redirect

- ☐ If not logged in, should redirect to login page
- ☐ If logged in as non-admin, should redirect to login
- ☐ If logged in as admin, should load dashboard

#### 2.2 Dashboard Layout

- ☐ **Sidebar Navigation** visible with 9 menu items:

  - ☐ Dashboard (active)
  - ☐ Moderation
  - ☐ Users
  - ☐ Movies
  - ☐ Messages
  - ☐ Restricted Words
  - ☐ Reports
  - ☐ Audit Log
  - ☐ Security

- ☐ **Top Bar** displays:
  - ☐ Page title "Admin Dashboard"
  - ☐ Notification bell with badge count
  - ☐ Admin username
  - ☐ Logout button

#### 2.3 Stats Cards

- ☐ **Total Users** card shows count
- ☐ **Total Movies** card shows count
- ☐ **Pending Flags** card shows count
- ☐ **Total Posts** card shows count
- ☐ Each card shows weekly change indicator (↑/↓)

#### 2.4 Charts

- ☐ **Activity Chart** (line chart) renders correctly

  - ☐ Shows daily user activity
  - ☐ Chart.js rendering properly
  - ☐ Legend visible

- ☐ **Content Distribution** (doughnut chart) renders
  - ☐ Shows posts, comments, reviews, watchlists
  - ☐ Colors match legend
  - ☐ Percentages correct

#### 2.5 Data Tables

- ☐ **Recent Flags** table shows:

  - ☐ Content type
  - ☐ Reason
  - ☐ Reporter
  - ☐ Date
  - ☐ Status badges (color-coded)

- ☐ **Active Users** table shows:

  - ☐ Username
  - ☐ Email
  - ☐ Posts count
  - ☐ Comments count
  - ☐ Activity score

- ☐ **Audit Log** table shows:
  - ☐ Admin name
  - ☐ Action
  - ☐ Target
  - ☐ Timestamp

#### 2.6 Notifications

- ☐ Notification panel shows unread notifications
- ☐ Each notification has:

  - ☐ Icon (based on type)
  - ☐ Message text
  - ☐ Time stamp
  - ☐ "Mark as read" button

- ☐ Click "Mark as read" on single notification

  - ☐ Notification status updates
  - ☐ Badge count decreases

- ☐ Click "Mark all as read"
  - ☐ All notifications marked
  - ☐ Badge shows 0

#### 2.7 Real-time Updates

- ☐ Wait 30 seconds
- ☐ Data should auto-refresh
- ☐ Check console for polling requests
- ☐ No errors in console

#### 2.8 Responsive Design

- ☐ Resize browser to tablet size (768px-1024px)

  - ☐ Layout adjusts properly
  - ☐ Sidebar collapses or adapts
  - ☐ Charts remain visible

- ☐ Resize to mobile size (<768px)
  - ☐ Mobile-friendly layout
  - ☐ Navigation accessible
  - ☐ Content readable

#### 2.9 Logout

- ☐ Click logout button
- ☐ Should redirect to login page
- ☐ Session cleared
- ☐ Cannot access dashboard without login

---

### Phase 3: Movie Management Testing

**URL:** `html/admin/admin-movies.html`  
**Access:** Click "Movies" in sidebar

#### 3.1 Page Load

- ☐ Authentication check passes
- ☐ Movies table loads
- ☐ Stats cards display:
  - ☐ Total Movies
  - ☐ Total Views
  - ☐ Average Rating

#### 3.2 Movie Listing

- ☐ Table shows movies with:

  - ☐ Poster thumbnail
  - ☐ Title
  - ☐ Director
  - ☐ Year
  - ☐ Genres (comma-separated)
  - ☐ Rating (with star icon)
  - ☐ Views count
  - ☐ Action buttons (Edit, Delete)

- ☐ Poster images load correctly
- ☐ Default poster shows if image missing

#### 3.3 Search Functionality

- ☐ Type in search box
- ☐ Wait 500ms for debounce
- ☐ Results filter in real-time
- ☐ Search works for:

  - ☐ Movie title
  - ☐ Director name
  - ☐ Year

- ☐ Clear search box
  - ☐ All movies return

#### 3.4 Filter Functionality

- ☐ **Genre Filter**
  - ☐ Dropdown populated with all genres
  - ☐ Select a genre
  - ☐ Only movies with that genre show
- ☐ **Year Filter**

  - ☐ Dropdown shows available years
  - ☐ Select a year
  - ☐ Only movies from that year show

- ☐ **Sort Options**

  - ☐ Title A-Z: Movies sort alphabetically
  - ☐ Title Z-A: Reverse alphabetical
  - ☐ Year Newest: Recent movies first
  - ☐ Year Oldest: Old movies first
  - ☐ Rating High: Best rated first
  - ☐ Views High: Most viewed first

- ☐ **Reset Filters**
  - ☐ Click reset button
  - ☐ All filters clear
  - ☐ Shows all movies

#### 3.5 Pagination

- ☐ Pagination info shows correctly:

  - ☐ Current page number
  - ☐ Total pages
  - ☐ "Showing X-Y of Z movies"

- ☐ Click "Next" button

  - ☐ Loads next page
  - ☐ Previous button enables
  - ☐ Page number updates

- ☐ Click "Previous" button

  - ☐ Loads previous page
  - ☐ Works correctly

- ☐ Buttons disabled appropriately:
  - ☐ Previous disabled on page 1
  - ☐ Next disabled on last page

#### 3.6 Add Movie

- ☐ Click "Add Movie" button
- ☐ Modal opens with form:

  - ☐ Title field \*
  - ☐ Release Year field \*
  - ☐ Director field \*
  - ☐ Synopsis textarea
  - ☐ Genre checkboxes (scrollable)
  - ☐ Poster URL field

- ☐ Fill in required fields only
- ☐ Click "Save Movie"

  - ☐ Success notification appears
  - ☐ Modal closes
  - ☐ Movie appears in table
  - ☐ Stats update

- ☐ Try to submit with missing required fields
  - ☐ Error notification shows

#### 3.7 Edit Movie

- ☐ Click Edit button on a movie
- ☐ Modal opens with pre-filled data:

  - ☐ All fields populated
  - ☐ Genre checkboxes pre-selected
  - ☐ Modal title says "Edit Movie"

- ☐ Change some fields
- ☐ Click "Save Movie"

  - ☐ Success notification
  - ☐ Changes reflect in table
  - ☐ Modal closes

- ☐ Click "Cancel"
  - ☐ Modal closes without saving

#### 3.8 Delete Movie

- ☐ Click Delete button on a movie
- ☐ Confirmation modal appears:

  - ☐ Shows movie title
  - ☐ Warning message displayed
  - ☐ "Delete Movie" button (red)
  - ☐ "Cancel" button

- ☐ Click "Cancel"

  - ☐ Modal closes
  - ☐ Movie not deleted

- ☐ Click "Delete Movie"
  - ☐ Success notification
  - ☐ Movie removed from table
  - ☐ Stats update
  - ☐ Modal closes

#### 3.9 Bulk Import

- ☐ Click "Bulk Import" button
- ☐ Modal opens with:

  - ☐ Textarea for TMDB IDs
  - ☐ Instructions visible
  - ☐ "Import from TMDB" button

- ☐ Enter valid TMDB IDs (e.g., "550, 13, 27205")
- ☐ Click "Import from TMDB"

  - ☐ Progress bar appears
  - ☐ Progress fills to 100%
  - ☐ Success message shows count
  - ☐ Skipped count if any

- ☐ Wait 2 seconds

  - ☐ Modal auto-closes
  - ☐ Movie list refreshes
  - ☐ New movies visible

- ☐ Try with invalid IDs
  - ☐ Error message displays

#### 3.10 Responsive Design (Movies Page)

- ☐ Tablet view:

  - ☐ Search/filters adapt
  - ☐ Table readable
  - ☐ Modals fit screen

- ☐ Mobile view:
  - ☐ Poster column hidden
  - ☐ Content stacks properly
  - ☐ Buttons accessible
  - ☐ Forms usable

#### 3.11 Error Handling

- ☐ Disconnect network
- ☐ Try to load movies

  - ☐ Error message displays
  - ☐ No crash

- ☐ Reconnect network
- ☐ Try again
  - ☐ Works normally

---

## 🔍 Console Checks

### During Testing, Monitor Console For:

- ☐ No JavaScript errors
- ☐ API calls successful (200 status)
- ☐ No 401/403 authentication errors
- ☐ No CORS errors
- ☐ Chart.js loads correctly
- ☐ Font Awesome icons load

### Expected Console Output:

```
✓ Auth check passed
✓ Dashboard stats loaded
✓ Charts initialized
✓ Polling started (every 30s)
```

---

## 🐛 Known Issues to Watch For

### Potential Issues:

1. **Images not loading:**

   - Check poster URLs are valid
   - Verify CORS settings
   - Check default.jpg exists

2. **Charts not rendering:**

   - Verify Chart.js CDN loaded
   - Check data format correct
   - Inspect console for errors

3. **Polling issues:**

   - Check network tab for requests
   - Verify 30-second intervals
   - Ensure no memory leaks

4. **Modal issues:**

   - Check z-index conflicts
   - Verify click-outside closes
   - Test escape key

5. **Authentication:**
   - Session persistence
   - Token/cookie handling
   - Redirect loops

---

## 📸 Screenshots to Capture

During testing, capture screenshots of:

1. ☐ Dashboard overview (full page)
2. ☐ Stats cards with data
3. ☐ Charts rendering
4. ☐ Data tables with content
5. ☐ Notification panel
6. ☐ Movies page with listings
7. ☐ Add/Edit movie modal
8. ☐ Bulk import modal
9. ☐ Delete confirmation
10. ☐ Mobile responsive view

---

## 📊 Performance Checks

### Page Load Times:

- ☐ Dashboard: < 2 seconds
- ☐ Movies page: < 3 seconds (with data)
- ☐ API responses: < 500ms average

### Resource Usage:

- ☐ Memory stays stable (no leaks)
- ☐ CPU usage reasonable
- ☐ Network requests efficient

---

## ✅ Final Checklist

### Critical Functionality:

- ☐ All pages load without errors
- ☐ Authentication works correctly
- ☐ CRUD operations successful
- ☐ Real-time updates working
- ☐ Charts render properly
- ☐ Responsive design functional
- ☐ No console errors
- ☐ Performance acceptable

### User Experience:

- ☐ Intuitive navigation
- ☐ Clear feedback for actions
- ☐ Consistent styling
- ☐ Accessible on all devices
- ☐ Fast and responsive

---

## 🚀 Post-Testing Actions

After completing all tests:

1. **Document Issues:**

   - Create issue list with severity
   - Include screenshots
   - Note reproduction steps

2. **Record Results:**

   - Total tests: \_\_\_
   - Passed: \_\_\_
   - Failed: \_\_\_
   - Pass rate: \_\_\_%

3. **Next Steps:**
   - Fix critical bugs
   - Optimize performance
   - Continue to Phase 7

---

## 🔗 Quick Links

- Test Dashboard: `test-dashboard.html`
- Admin Dashboard: `html/admin/admin-dashboard.html`
- Movie Management: `html/admin/admin-movies.html`
- Server Health: `http://localhost:3000/api/health`
- API Docs: `ADMIN_QUICK_REFERENCE.md`

---

**Tester:** ******\_\_\_******  
**Date:** December 9, 2025  
**Environment:** Windows / Browser: ******\_\_\_******  
**Status:** ☐ In Progress ☐ Completed  
**Result:** ☐ Pass ☐ Pass with Issues ☐ Fail
