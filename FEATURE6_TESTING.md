# Feature 6 Testing Guide - Dashboard Page

## Overview

Feature 6 implements a personalized user dashboard that displays statistics, recommended movies, and recent activity from friends. This is the main landing page after login.

## What We Built

### 1. Backend API Routes (`server/routes/dashboard.js`)

- **GET /api/dashboard/stats** - User statistics (watchlist, watched, friends, reviews, events)
- **GET /api/dashboard/recommended** - Personalized movie recommendations based on user's favorite genres
- **GET /api/dashboard/recent-activity** - Recent reviews and activity from friends
- **GET /api/dashboard/recent-watchlist** - User's recently added watchlist items

### 2. Frontend Dashboard (`html/dashboard.html` + `js/dashboard.js`)

- Authentication check with auto-redirect if not logged in
- Personalized welcome message
- Real-time statistics cards
- Recommended movies tab with genre-based suggestions
- Activity feed showing friend reviews
- Tab switching between trending and recommended

## Files Modified/Created

```
✅ server/routes/dashboard.js (NEW) - Backend API routes
✅ app.js (UPDATED) - Mounted dashboard routes at /api/dashboard
✅ js/dashboard.js (UPDATED) - Complete rewrite with App utilities
✅ html/dashboard.html (UPDATED) - Added app.js script
```

---

## Testing Instructions

### Prerequisites

1. **Server running**: Check terminal shows "Database: ✓ Connected"
2. **Logged in user**: You should be logged in from previous tests
3. **Browser**: Chrome/Firefox/Edge with DevTools open (F12)

---

### Test 1: Dashboard Authentication & Redirect

**What to test**: Dashboard requires login, redirects if not authenticated

**Steps**:

1. **Log out first** (clear cookies or use incognito mode)
2. Try to access: http://localhost:3000/dashboard.html
3. **Expected**:

   - Automatic redirect to login.html
   - No dashboard content shown
   - Console shows: `[App] Initializing page: dashboard`

4. **Now log in**:
   - Go to http://localhost:3000/login.html
   - Use your credentials from Feature 4
   - **Expected**: Redirect to dashboard.html

✅ **Pass Criteria**: Can't access dashboard without login, auto-redirects to login page

---

### Test 2: Welcome Message Personalization

**What to test**: Dashboard shows user's name dynamically

**Steps**:

1. After logging in, you should be on dashboard.html
2. Look at the header (top of page)
3. **Expected**:

   - "Welcome back, [Your Name]!" (uses your actual name from signup)
   - NOT "Welcome back, Alex!" (that was the placeholder)

4. **Check console**:
   ```
   Expected Output:
   [App] Global application loaded
   [App] Initializing page: dashboard
   [Dashboard] Initializing...
   [Dashboard] Initialized successfully
   ```

✅ **Pass Criteria**: Header shows YOUR name, not the hardcoded "Alex"

---

### Test 3: Dashboard Statistics

**What to test**: Stat cards show real data from database

**Steps**:

1. On dashboard, look at the 3 stat cards at the top
2. **Expected values** (based on your current data):

   - **Movies Watched**: 0 (you haven't marked any as watched yet)
   - **Friends**: 0 (no friends added yet)
   - **Upcoming Events**: 0 (no events created yet)

3. **Check network request**:
   - Open DevTools → Network tab
   - Refresh page (Ctrl+R or F5)
   - Find request to: `dashboard/stats`
   - Click it → Preview tab
   - **Expected JSON**:
     ```json
     {
       "success": true,
       "stats": {
         "watchlist": 0,
         "watched": 0,
         "friends": 0,
         "reviews": 0,
         "upcomingEvents": 0
       }
     }
     ```

✅ **Pass Criteria**: Stat cards show numbers, API returns correct JSON

---

### Test 4: Recommended Movies

**What to test**: Recommended tab shows movies from database

**Steps**:

1. On dashboard, look at the right sidebar
2. You'll see two tabs: **"Trending"** and **"Recommended"**
3. Click **"Recommended"** tab
4. **Expected** (since you haven't rated any movies yet):

   - Shows up to 5 movies from your database
   - Subtitle says: "Based on: Popular movies"
   - Each movie shows:
     - Movie title
     - Release year
     - Star rating (if available)
     - Poster thumbnail

5. **Check network request**:

   - DevTools → Network tab
   - Find request: `dashboard/recommended?limit=5`
   - **Expected JSON**:
     ```json
     {
       "success": true,
       "movies": [ ... array of 5 movies ... ],
       "basedOn": ["Popular movies"]
     }
     ```

6. **Click on a recommended movie**:
   - **Expected**: Should navigate to movie.html?id=X (will show 404 for now, that's okay)

✅ **Pass Criteria**: Recommended tab populates with movies from database, clickable

---

### Test 5: Tab Switching

**What to test**: Trending/Recommended tabs switch properly

**Steps**:

1. On dashboard right sidebar, click **"Trending"** tab
2. **Expected**:

   - Tab becomes highlighted (active)
   - Shows the hardcoded trending list (The Shawshank Redemption, etc.)

3. Click **"Recommended"** tab again
4. **Expected**:

   - Tab becomes highlighted
   - Hides trending list
   - Shows recommended movies from your database

5. Switch back and forth multiple times
6. **Expected**: No errors, smooth transitions

✅ **Pass Criteria**: Tabs switch smoothly, only one list visible at a time

---

### Test 6: Activity Feed (No Friends)

**What to test**: Activity feed handles empty state

**Steps**:

1. Scroll down to "Activity Feed" section
2. **Expected** (since you have no friends yet):

   - Shows empty message:
     > "No recent activity from friends."
     > "Add friends to see their movie reviews and updates!"
   - Original placeholder cards (Sarah Connor, John Smith) are removed
   - OR they might still show as examples (that's fine too)

3. **Check network request**:
   - DevTools → Network tab
   - Find: `dashboard/recent-activity?limit=10`
   - **Expected JSON**:
     ```json
     {
       "success": true,
       "activities": []
     }
     ```

✅ **Pass Criteria**: Activity feed handles empty state gracefully, no errors

---

### Test 7: Load More Button

**What to test**: Load more button shows info toast

**Steps**:

1. Scroll to bottom of activity feed
2. Click **"Load More Activity"** button
3. **Expected**:
   - Blue info toast appears: "Load more functionality coming soon!"
   - No errors in console

✅ **Pass Criteria**: Button works, shows toast notification

---

### Test 8: Console Verification

**What to test**: No JavaScript errors, proper initialization

**Steps**:

1. Open DevTools Console (F12 → Console tab)
2. Refresh dashboard page (Ctrl+R)
3. **Expected console output** (in order):

   ```
   [App] Global application loaded
   [App] Initializing page: dashboard
   [Dashboard] Initializing...
   [Dashboard] Initialized successfully
   ```

4. **Check for errors**:
   - NO red error messages
   - All API calls succeed (green status in Network tab)

✅ **Pass Criteria**: Clean console, no errors, proper initialization logs

---

### Test 9: API Error Handling

**What to test**: Dashboard handles API failures gracefully

**Steps**:

1. **Stop the server** (in terminal, press Ctrl+C)
2. Refresh dashboard page
3. **Expected**:

   - Red error toast: "Failed to load statistics"
   - Console shows: `[Dashboard] Failed to load stats: [error]`
   - Page doesn't crash, stays functional

4. **Restart server**:
   - Run: `node app.js`
   - Refresh page
   - **Expected**: Everything loads normally again

✅ **Pass Criteria**: Graceful error handling, user sees error messages

---

### Test 10: Multiple API Calls in Parallel

**What to test**: Dashboard loads stats, recommended, and activity simultaneously

**Steps**:

1. Open DevTools → Network tab
2. Refresh dashboard page
3. **Look at the requests**:

   - You should see these 3 requests fired at ~same time:
     - `/api/dashboard/stats`
     - `/api/dashboard/recommended?limit=5`
     - `/api/dashboard/recent-activity?limit=10`

4. **Check timing**:
   - All 3 should start around the same timestamp
   - This proves they're loading in parallel (faster!)

✅ **Pass Criteria**: All 3 API calls load simultaneously, not sequentially

---

## Expected Database State

Run `npm run db:verify` to check current state:

```
Expected Output:
- user: 2+ rows (your test users)
- movie: 20 rows
- moviecast: 100 rows
- genres: 13 rows
- moviegenres: 58 rows
- watchlist: 0 rows (no watchlist items added yet)
- friends: 0 rows (no friends yet)
- reviewratings: 0 rows (no reviews yet)
- watchevent: 0 rows (no events yet)
```

---

## Verification Checklist

Before moving to Feature 7, confirm:

- [ ] Dashboard requires authentication (redirects if not logged in)
- [ ] Welcome message shows YOUR name, not "Alex"
- [ ] Stat cards display numbers (0, 0, 0 is correct for now)
- [ ] `/api/dashboard/stats` API returns JSON with stats
- [ ] Recommended tab shows 5 movies from your database
- [ ] `/api/dashboard/recommended` API returns movies array
- [ ] Clicking recommended movie navigates to movie.html?id=X
- [ ] Trending/Recommended tabs switch properly
- [ ] Activity feed shows empty state message (no friends)
- [ ] Load More button shows info toast
- [ ] Console shows initialization logs, no errors
- [ ] All 3 API calls load in parallel
- [ ] Error handling works (tested by stopping server)

---

## Common Issues & Solutions

### Issue: "App is not defined"

**Cause**: app.js not loaded before dashboard.js
**Solution**: Check html/dashboard.html includes `<script src="../js/app.js"></script>` before dashboard.js

### Issue: Dashboard shows "Alex" instead of my name

**Cause**: Backend not returning user data
**Solution**: Check `/api/auth/me` returns your user data, verify session is valid

### Issue: Recommended shows "No recommendations yet"

**Cause**: No movies in database OR API error
**Solution**: Run `npm run db:verify`, should show 20 movies. Check Network tab for API errors

### Issue: Stat cards still show 127, 48, 3 (old values)

**Cause**: JavaScript not loading or API failing
**Solution**: Hard refresh (Ctrl+Shift+R), check console for errors, verify API returns data

### Issue: Activity feed still shows Sarah Connor and John Smith

**Cause**: Old placeholder cards not removed
**Solution**: Expected behavior - they're examples. Real friend activity will append below them

---

## What's Next?

After confirming Feature 6 is working:

**Feature 7: Browse Movies** - Movie browsing page with search, filters (genre, year, rating), pagination, and grid/list view toggle

**Would you like to proceed to Feature 7?**
