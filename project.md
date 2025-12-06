# 3movieCollectors – Full Project Overview, Current State, and Next Iteration Plan (Node.js + DB + TMDB)

> This document explains **what 3movieCollectors is**, **how the current frontend works**, **what is missing**, and **exactly what needs to be done per page** to move to a **Node.js + database-backed, dynamically loaded system** similar to your Cinemago project.

---

## 1. What This Project Is

**3movieCollectors** is a movie–community platform designed to:

- Let users **browse and discover movies** (with filters, sorting, ratings).
- Maintain a **personal watchlist** (want to watch, watching, completed).
- Interact in a **social layer**:
  - Friends, friend requests, suggestions.
  - Events (movie nights, meetups).
  - Messages between users.
  - Notifications for activity.
- Expose **user profiles** with stats and collections.
- Eventually support:
  - Viewing **other users’ profiles**.
  - **Liking** posts and **commenting** on them (core feature still missing).

Right now, the project is essentially:

- A **fully fleshed-out frontend**: HTML/CSS/JS, with a shared layout (navbar + sidebar + footer), static demo data, and page-level interactivity.
- A **database design** in `/AdvancedERD` that defines the relational model.
- No actual Node.js backend yet – all “dynamic” behaviour is simulated in **static JS**.

Your reference mental model for how this *should* work comes from **Cinemago**, which uses Flask + SQLite and dynamically fills templates and grids with DB-backed movie data on runtime.

---

## 2. Frontend Architecture of 3movieCollectors (Current State)

### 2.1 Global Layout & Shared Components

Across all major pages (dashboard, browse, watchlist, friends, events, messages, profile, etc.), layout is consistent:

- **Navbar** at the top, injected from `main-navbar.html` and styled by `main-navbar.css`.
- **Sidebar (side panel)** on the left, which can be expanded or collapsed.
- **Content area** on the right (`.content-area`) where each page’s main content lives.
- **Footer** at the bottom, injected from `main-footer.html` and aligned with sidebar width using `include-footer.js`.  

The component loaders:

- `include-main-navbar.js` – fetches navbar HTML and injects it into `#navbar-container`. It also sets active page highlighting using `data-page` attributes and/or URL-based logic.  
- `include-side-panel.js` (+ `include-side-panel-collapsed.js`) – load the sidebar component and handle open/collapsed state, updating classes on `.side-panel`, `.content-area`, and sometimes `body` so the layout shifts correctly.  
- `include-footer.js` – fetches footer HTML and then runs `updateFooterMargin()` to align the footer’s `margin-left` with the sidebar’s width (78px collapsed or 260px expanded).  

**Result:** You already have a robust **componentized layout system** that feels like a small design system: each page only contains its own main content; navbar/sidepanel/footer are shared.

---

### 2.2 Page-Specific Frontend Behaviour

You’ve built **page-level JS files** that attach to the relevant HTML and control the UI.  
A few key examples:

#### Login Page (`login.js`)

- Handles **password visibility toggle** (eye vs eye-closed icon) and switches input type `password`/`text`.  
- Currently does a **temporary bypass**: on submit, checks if email and password are non-empty and then just redirects to `dashboard.html` without real authentication.  

#### Messages Page (`messages.js`)

- Manages a **two-column messaging layout**:
  - Left: threads list.
  - Right: conversation body.
- When a thread is clicked:
  - Layout switches from “empty” to “active” state.
  - Selected thread is marked active.
  - Unread badge is removed.
  - Input is enabled.  
- Sending a message:
  - Creates a new DOM node with the text and current time.
  - Scrolls the conversation to bottom.
  - Works on button click and `Enter` key.  
- **All data is local**: no persistence, no backend.

#### Notifications Page (`notifications.js`)

- Implements **tabs** for “All” and “Unread” using CSS class `notifications-tab--active`.
- Tracks each `.notification-item`’s `data-status` (`read` / `unread`).
- Updates counters for unread, unread tab, and total.  
- Clicking an item toggles its status; “Mark all as read” sets them all to `read`.  
- Again, **fully front-end only**.

#### Profile Page (`profile.js`)

- Controls **profile tabs** (e.g. Overview, Reviews, Watchlist, etc.).  
- Maintains:
  - `.tab-btn` for buttons.
  - `.tab-content` for page sections.
- On click:
  - Deactivates all buttons.
  - Activates the clicked one.
  - Shows corresponding `#tab-<name>` section.  

#### Dashboard / Browse / Watchlist / Friends / Events

From the earlier uploaded files:

- **Dashboard** (`dashboard.html`, `dashboard.css`, `dashboard.js`)  
  - Displays stats cards, an activity feed, and a trending panel.  
  - Currently all numbers and feed items are **hard-coded** in HTML or local JS.

- **Browse Movies** (`browse-movies.html`, `browse-movies.css`, `browse-movies.js`)  
  - Shows filters (genre chips, sort drop-down) and a **grid of movie cards** with square posters.  
  - Your CSS enforces the square posters and consistent card design.
  - Existing JS (not shown above but implied) likely filters a static list of movies.

- **Watchlist** (`watchlist.html`, `watchlist.css`, `watchlist.js`)  
  - Header + stats row + filter chips (All / Want to Watch / Watching / Completed).  
  - Grid of movie cards with `data-status` attributes; CSS again uses square posters and pills for status.
  - JS shows/hides cards based on the selected filter.

- **Friends** (`friends.html`, `friends.css`, `friends.js`)  
  - Summary stats at top (Total Friends, Online, Requests, Suggestions).  
  - Search bar with client-side filter in `friends.js`.
  - Tabs: “All Friends”, “Requests”, “Suggestions”.
  - Each friend/suggestion/request is rendered as a **card** with actions (Message, View Profile, Accept/Decline, Add Friend).

- **Events** (`events.html`, `events.css`, `events.js`)  
  - Tabs: Upcoming Events, Hosted by Me, Past Events.  
  - `events.js` just switches tabs (no backend integration yet).

Overall, every page is **layout-complete** and **interaction-complete**, but **data-fake**.

---

## 3. Cinemago as a Reference for Dynamic Loading

In **Cinemago**, you’ve already built the dynamic pattern you want:

### 3.1 Flask Backend (`app.py`)

- Uses `sqlite3` for DB, CSV for users, and defines **REST-like endpoints**.
- Examples:
  - `/get_all_movies` – returns JSON of all movies with `movie_id`, `movie_name`, `poster`, `total_weighted`, `num_ratings`.  
  - `/get_movie` – returns a single movie row by `movie_id`.  
  - `/rate_movie` – updates cumulative rating and number of ratings.  
  - `/signup`, `/login` – handle auth using CSV for users.  
  - `/admin/scrape_movies` – calls `scrape_tmdb.py` to pull data from TMDB and add it to the DB.  

### 3.2 Dynamic Movie Detail (`movie.js` + `movie_template.html`)

- `movie_template.html` is a mostly-empty container with named IDs.  
- `movie.js`:
  - Reads `movie_id` from URL query string.
  - Calls `/get_movie` with that ID.
  - Uses JSON to fill the movie template (title, poster, description, director, etc.).
  - Sets the browser tab title dynamically.
  - Updates the “Rate” link to include `movie_id` for the rating page.  

### 3.3 Dynamic Movie Grid (`rate-grid.js` + `rate.html`)

- `rate.html` has a `<section id="rate-grid">` container with no static cards.  
- `rate-grid.js`:
  - Calls `/get_all_movies` to fetch a list of all movies.
  - Builds card `<a>` elements dynamically for each movie (poster + title).
  - Adds live search filtering on the client side.  

This is exactly the **“almost empty HTML → JS + API → dynamically rendered UI”** pattern you want to replicate in 3movieCollectors, but now using **Node.js + your AdvancedERD DB + TMDB ingestion**.

---

## 4. What Is Missing / Problems in 3movieCollectors

1. **No Node.js backend yet**
   - `express` and `mysql` are intended, but no `app.js`/`index.js` Node controller is implemented.
   - All pages are served as static files (or assumed to be).

2. **No database connection**
   - `/AdvancedERD` has the schema, but there is no Node code that:
     - Connects to the DB.
     - Runs queries.
     - Exposes data as JSON endpoints.

3. **Static JS only**
   - Every page’s JS uses either:
     - Hard-coded arrays/DOM content, or
     - Purely client-side interactions (toggling classes).
   - No `fetch()` to backend, no auth context, no data persistence across reloads.

4. **Missing social features**
   - Users **cannot view each other’s profiles** yet (only “your own” profile is implied).
   - There is **no like/comment system** for posts/activity, though the UI (dashboard activity cards, profile review sections, etc.) suggests such features.

5. **TMDB integration not yet wired**
   - Target design: Use TMDB API → CSV → Python script → DB.
   - Actual state: This pipeline exists in spirit (and in Cinemago via `scrape_tmdb.py`), but not yet in this Node+MySQL stack.

6. **JS organisation goal not yet applied**
   - Desired:  
     - **One page JS file per page** (e.g. `dashboard.js`, `browse-movies.js` … each handling its own behaviour).
     - A single **root `app.js`** at project root for:
       - Global initialization, global helpers.
       - Possibly cross-page utilities, error handling for fetch, auth checks, etc.
     - Optional helper JS files at root for API clients, utilities.
   - Current:  
     - Many per-page files exist, but no global **app.js** orchestrator and no unified API helper layer.

---

## 5. Target Architecture – Node.js + DB + TMDB

### 5.1 Data Ingestion (TMDB → CSV → Python → DB)

Planned pipeline:

1. **TMDB API**:
   - Python script (similar to Cinemago’s `scrape_tmdb.py`) queries TMDB for N popular/top-rated/etc. movies.
   - Writes relevant fields to a **CSV file** (title, year, genre, TMDB ID, poster path, description, etc.).

2. **CSV → Database**:
   - Another Python script (or same one) reads this CSV and runs `INSERT`/`UPDATE` statements into the DB configured in `/AdvancedERD`.
   - You end up with fully seeded tables: `Movies`, `Genres`, `Users` (maybe later), etc.

3. **Node.js backend**:
   - Only reads data from the DB.
   - Does *not* talk to TMDB directly in runtime; ingestion is offline/batch.

This mirrors your Cinemago approach where `scrape_tmdb.py` populates SQLite and your app just queries that DB.  

---

### 5.2 Node.js Backend and File Organisation

You want:

- **One main controller file at root:** `app.js`
- **Per-page JS files** (already largely present) that:
  - Are executed in the browser.
  - Call the backend API when they need data.
- Optionally, **a few helper JS modules at root** (front-end side or server side) for:
  - API client (front-end),
  - Fetch wrappers,
  - Shared UI logic (loading spinners, toasts),
  - Server-side utility functions (e.g. DB connection pool).

**On the server (Node):**

Suggested structure:

```text
project-root/
├── app.js                 # Main Express app entry
├── server/
│   ├── db.js              # MySQL connection pool, using AdvancedERD schema
│   ├── routes/
│   │   ├── auth.js
│   │   ├── movies.js
│   │   ├── watchlist.js
│   │   ├── profile.js
│   │   ├── friends.js
│   │   ├── events.js
│   │   ├── messages.js
│   │   ├── notifications.js
│   │   └── posts.js       # likes/comments
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   └── utils/
│       └── queryHelpers.js
├── html/
├── css/
├── js/                    # Browser-side files: dashboard.js, browse-movies.js, etc.
├── components/
├── AdvancedERD/
└── ...
```

# App.js Responsibilities

## Backend (Node/Express)
* **Initialize Express.**
* **Configuration:** Set up JSON parsing, cookies/sessions/JWT.
* **Static Assets:** Serve static files from `html/`, `css/`, `js/`, `pictures/`, `components/`.
* **Routing:** Mount `/api/...` routes.
* **Error Handling:** Handle errors (global error handler).

## Front-end `app.js` (Browser-Level Global Script)
If you also want a global front-end `app.js`:

1.  **Location:** Put it under `/js/app.js`.
2.  **Usage:** Include it on all pages.
3.  **Responsibilities:**
    * Provide a global `window.App` or `window.apiClient`.
    * **Common helpers:** `fetchJSON(url, options)`, `showError(message)`, `withLoading(...)`.
    * **Page Detection:** Detect `document.body.dataset.page` and call the relevant page initializer.
    * *Example:* `if (page === 'messages') initMessagesPage();`

Each page’s JS file (e.g., `messages.js`, `notifications.js`) defines `window.initMessagesPage = function() { ... }` or similar.

---

# 6. Per-Page Implementation Plan (What to Do Next)
Below is a page-by-page breakdown of **what’s currently there** and **what needs to change** to reach a fully dynamic Node+DB system.

### 6.1 Authentication & Login
**Current:**
* `login.js` toggles password visibility and performs a client-side “fake” login redirect to `dashboard.html`.

**Backend (Node) – To Implement:**
* **Auth Tables** (from AdvancedERD):
    * `Users` with columns: `id`, `email`, `password_hash`, `display_name`, etc.
* **Routes:**
    * `POST /api/auth/signup`
    * `POST /api/auth/login`
    * `POST /api/auth/logout`
    * `GET /api/auth/me` (return current logged-in user).
* **Security:** Use hashed passwords (bcrypt) and sessions or JWT.

**Frontend – To Change:**
* **`login.js`:**
    * On form submit: `fetch('/api/auth/login', { method: 'POST', body: ... })`.
    * Handle success: redirect to dashboard.
    * Handle error: show error in the UI (not alert).
    * Same pattern for signup page JS.

### 6.2 Dashboard Page
**Current:**
* Styled header, stat cards, activity feed, trending list; data is static.

**Backend – To Implement:**
* **Endpoint:** `GET /api/dashboard`
* **Returns:**
    * **Summary counts:** `moviesWatched`, `friendsCount`, `upcomingEvents`, `activityScore`, etc.
    * **Recent activity:** Items like “X rated Y”, “Z joined event”, “A commented on your post.”
* **DB queries:** Join across `Movies`, `Watchlist`, `Ratings`, `Friends`, `Events`, `Posts` tables.
* **Trending:** Could reuse `/api/movies?sort=trending` or a dedicated `GET /api/movies/trending`.

**Frontend – To Change:**
* **`dashboard.js`:**
    * On `DOMContentLoaded`, call `fetchJSON('/api/dashboard')`.
    * Use returned data to:
        * Fill stat cards numbers.
        * Populate the activity feed list.
        * Populate trending list.
    * Remove any static text that conflicts with real data.

### 6.3 Browse Movies Page
**Current:**
* HTML and CSS provide filters and a 4-column grid of movie cards with square posters. JS most likely uses hardcoded movies list / DOM markup.

**Backend – To Implement:**
* `GET /api/movies` with query params:
    * `?genre=`, `?search=`, `?year=`, `?sort=top-rated|az|latest`, `?page=`, `?limit=`.
* `GET /api/movies/:id` for detailed info.

**Frontend – To Change:**
* **`browse-movies.js`:**
    * On load, call `/api/movies` with default params.
    * Render cards into `.movies-grid` (empty in HTML).
    * On filter chip click: Rebuild query string and call `/api/movies?...`.
    * On sort change: Re-fetch with updated `sort`.
    * *Note:* This is almost identical in spirit to `rate-grid.js` from Cinemago, just adapted to 3movieCollectors’ design.

### 6.4 Watchlist Page
**Current:**
* Watchlist cards are hardcoded; filter chips just show/hide by `data-status`.

**Backend – To Implement:**
* `GET /api/watchlist` – returns all movies in the current user’s watchlist with their status.
* `POST /api/watchlist` – add a movie with a default status (e.g. “want to watch”).
* `PATCH /api/watchlist/:id` – change status (want → watching → completed).
* `DELETE /api/watchlist/:id` – remove from list.

**Frontend – To Change:**
* **`watchlist.js`:**
    * On load: fetch `/api/watchlist` → group by `status` and render cards into single `.watchlist-grid`.
    * **Filtering:** Either CSS/DOM filter on loaded data OR Query backend with `?status=`.
    * **Actions:** Calls `PATCH /api/watchlist/:id` and updates DOM (e.g., “Move to Watching”).

### 6.5 Movie Detail Page
**Current:**
* In 3movieCollectors, there will be a movie detail page design (similar to Cinemago’s `movie_template.html`). Containers identified by IDs.

**Backend – To Implement:**
* `GET /api/movies/:id` – returns detailed info (Title, year, genres, runtime, description, poster URL, community rating, etc.).
* Possibly `GET /api/movies/:id/reviews` for comments/reviews.

**Frontend – To Change/Implement:**
* **`movie.js`:**
    * Read `movie_id` from query string (`?id=`).
    * Call `/api/movies/:id`.
    * Fill the page’s template: title, poster, rating breakdown, etc.
    * Provide links to: Add to watchlist, Rate, Comment.

### 6.6 Friends Page
**Current:**
* Beautiful cards and tabs; all data is static. `friends.js` already handles tab switching and search filtering.

**Backend – To Implement:**
* **DB tables:** `Users`, `Friendships`, `FriendRequests`.
* **Routes:**
    * `GET /api/friends` – list current friends.
    * `GET /api/friends/requests` – incoming/outgoing requests.
    * `GET /api/friends/suggestions` – suggestions based on mutuals/tastes.
    * `POST /api/friends/requests` – send request.
    * `POST /api/friends/requests/:id/accept` (or decline).
    * `DELETE /api/friends/:id` – unfriend.

**Frontend – To Change:**
* **`friends.js`:**
    * On tab switch: Fetch corresponding endpoint.
    * Replace hard-coded cards with dynamic rendering from JSON.
    * Buttons call the relevant endpoints (Accept, Decline, Add, Message).

### 6.7 Events Page
**Current:**
* Tab structure present; cards are static; `events.js` just switches panels.

**Backend – To Implement:**
* **DB tables:** `Events`, `EventAttendees`, optionally `EventHosts`.
* **Routes:**
    * `GET /api/events?filter=upcoming|hosting|past`.
    * `POST /api/events` – host an event.
    * `POST /api/events/:id/join` (or leave).

**Frontend – To Change:**
* **`events.js`:**
    * On tab click, call `/api/events?filter=...`.
    * Render cards dynamically.
    * Join/Leave button calls API and updates attendee counts.

### 6.8 Messages Page
**Current:**
* UI + interactions fully implemented with `messages.js`, but using no backend.

**Backend – To Implement:**
* **DB tables:** `MessageThreads`, `Messages`, `ThreadParticipants`.
* **Routes:**
    * `GET /api/messages/threads` – list user’s threads.
    * `GET /api/messages/threads/:id` – get messages in a thread.
    * `POST /api/messages/threads/:id/messages` – send a new message.

**Frontend – To Change:**
* **`messages.js`:**
    * On load: fetch thread list; render `.thread-item` elements dynamically.
    * When a thread is clicked: Fetch conversation from `/api/messages/threads/:id`.
    * **sendMessage():** POST to API instead of only appending locally. Append the newly returned message to the DOM.

### 6.9 Notifications Page
**Current:**
* `notifications.js` handles counts and filters for static notifications.

**Backend – To Implement:**
* **DB table:** `Notifications`.
* **Routes:**
    * `GET /api/notifications?filter=all|unread`.
    * `POST /api/notifications/mark-all-read`.
    * `PATCH /api/notifications/:id` (mark single as read).

**Frontend – To Change:**
* **`notifications.js`:**
    * On load: fetch `/api/notifications`.
    * Mark-all-read button calls `/api/notifications/mark-all-read`.
    * Clicking a notification calls `PATCH /api/notifications/:id`.

### 6.10 Profile Page(s) – Own & Others’
**Current:**
* `profile.js` handles tab switching; info and stats are static. Missing: Viewing other profiles.

**Backend – To Implement:**
* **DB tables:** `Users`, `UserProfiles`, `Posts` (or Reviews), `Likes`, `Comments`.
* **Routes:**
    * `GET /api/profile/me` & `PATCH /api/profile/me`.
    * `GET /api/profile/:username` & `/posts`.
    * `POST /api/posts/:postId/like` & `/comment`.

**Frontend – To Change:**
* **`profile.js`:**
    * On load (self): Fetch `/api/profile/me` and `/posts`. Fill stats/watchlist/posts.
    * **Viewing Others:** Use `?user=username`. JS reads URL, calls `/api/profile/:username`.
    * **Interaction:** Like button triggers POST; Comment form sends POST. Update live counts.

### 6.11 Settings & Help Pages
* **Settings Backend:** `GET /api/settings`, `PATCH /api/settings`.
* **Settings Frontend:** Populate toggles with server data; save sends PATCH.
* **Help Backend:** `SupportTickets`, `SupportMessages`.
* **Help Frontend:** Replace mock conversation threads with API-driven tickets.

### 6.12 Admin Flows (TMDB Scraping, Moderation)
**Backend:**
* `POST /api/admin/scrape-movies` – triggers TMDB scrape + CSV + DB insert (Python script).
* `GET /api/admin/movies` & `GET /api/admin/users`.
* Auth middleware ensures only admins can access.

**Frontend:**
* Admin dashboard with buttons to run scrapes and tables to manage data.

---

# 7. JS Organisation: Per-Page Files + Root `app.js`

**Design Rule:**
> “Every JS implementation of every page needs to be in the same JS file of that page and 1 `app.js` needs to be in the root directory controlling them all...”

### Per-page JS (already mostly true):
* `js/dashboard.js`
* `js/browse-movies.js`
* `js/watchlist.js`
* ...etc.
* *These files should contain all logic specific to that page.*

### Global `app.js` (Front-end):
```javascript
// js/app.js
window.App = {
  async fetchJSON(url, options = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      credentials: 'include',
      ...options
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  },
  init() {
    const page = document.body.dataset.page;
    if (window.initPage && typeof window.initPage[page] === 'function') {
      window.initPage[page]();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});