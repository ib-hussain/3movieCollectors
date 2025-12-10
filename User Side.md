# User Side API Documentation

This document lists all API endpoints used by the user-facing side of the 3movieCollectors web application.

---

## 📋 Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [User Profile APIs](#user-profile-apis)
3. [Movie Browsing APIs](#movie-browsing-apis)
4. [Dashboard APIs](#dashboard-apis)
5. [Watchlist APIs](#watchlist-apis)
6. [Social Features APIs](#social-features-apis)
7. [Review & Rating APIs](#review--rating-apis)
8. [Post & Comment APIs](#post--comment-apis)
9. [Events APIs](#events-apis)
10. [Messages APIs](#messages-apis)
11. [Notifications APIs](#notifications-apis)
12. [Settings APIs](#settings-apis)

---

## Authentication APIs

### `POST /api/auth/signup`

Register a new user account with username, name, email, and password.

### `POST /api/auth/login`

Authenticate user with username/email and password, creates session.

### `POST /api/auth/logout`

End current user session and clear authentication cookies.

### `GET /api/auth/me`

Retrieve currently authenticated user's basic information (id, username, email, role).

---

## User Profile APIs

### `GET /api/profile/me`

Fetch the logged-in user's complete profile including stats, reviews, and favorite genres.

### `GET /api/profile/:username`

Retrieve another user's public profile information by their username.

---

## Movie Browsing APIs

### `GET /api/movies`

Browse movies with optional filters: `genre`, `year`, `search`, `sort`, `page`, `limit`.

### `GET /api/movies/genres`

Get a list of all available movie genres for filtering.

### `GET /api/movies/years`

Get a list of all available release years for filtering.

### `GET /api/movies/popular`

Fetch popular movies for the landing page (limit: 4).

### `GET /api/movies/:id`

Get detailed information about a specific movie including cast, genres, and ratings.

### `GET /api/movies/:id/similar`

Find movies similar to the specified movie based on shared genres (limit: 8).

---

## Dashboard APIs

### `GET /api/dashboard/stats`

Retrieve user's personal statistics (watchlist count, friends count, movies watched, reviews).

### `GET /api/dashboard/recommended`

Get personalized movie recommendations based on user's rating history and genre preferences.

### `GET /api/dashboard/trending`

Fetch currently trending movies based on recent activity (reviews, posts, ratings).

### `GET /api/dashboard/recent-activity`

Display recent activity feed from user's friends (reviews, posts, ratings).

---

## Watchlist APIs

### `GET /api/watchlist`

Retrieve the user's complete watchlist with movie details and status.

### `POST /api/watchlist`

Add a movie to the user's watchlist with optional status (want-to-watch, watching, watched).

### `GET /api/watchlist/:movieId`

Check if a specific movie is in the user's watchlist and get its status.

### `PATCH /api/watchlist/:movieId`

Update the status of a movie in the watchlist (want-to-watch → watching → watched).

### `DELETE /api/watchlist/:movieId`

Remove a movie from the user's watchlist.

---

## Social Features APIs

### `GET /api/friends`

Get a list of the user's current friends with their profile information.

### `GET /api/friends/requests`

Retrieve all pending friend requests sent to the user.

### `GET /api/friends/suggestions`

Get friend suggestions based on mutual friends and common interests.

### `POST /api/friends/requests`

Send a friend request to another user by their user ID.

### `POST /api/friends/requests/:requestId/accept`

Accept an incoming friend request.

### `POST /api/friends/requests/:requestId/decline`

Decline an incoming friend request.

### `DELETE /api/friends/:userId`

Remove a user from the friends list (unfriend).

---

## Review & Rating APIs

### `GET /api/movies/:id/reviews`

Fetch all user reviews for a specific movie.

### `GET /api/movies/:id/reviews/me`

Get the current user's review/rating for a specific movie (if exists).

### `POST /api/movies/:id/reviews`

Submit a new review and rating for a movie (1-5 stars).

### `PATCH /api/reviews/:movieId`

Update an existing review/rating for a movie.

### `DELETE /api/reviews/:movieId`

Delete the user's review/rating for a specific movie.

---

## Post & Comment APIs

### `GET /api/movies/:id/posts`

Retrieve all discussion posts for a specific movie page.

### `POST /api/movies/:id/posts`

Create a new discussion post on a movie's page.

### `POST /api/posts/:postId/like`

Like or unlike a post (toggle).

### `DELETE /api/posts/:postId`

Delete a post (only by post author).

### `GET /api/posts/:postId/comments`

Fetch all comments on a specific post.

### `POST /api/posts/:postId/comments`

Add a comment to a post.

---

## Events APIs

### `GET /api/events`

Get all watch party events with optional filter (all, upcoming, hosting, joined).

### `POST /api/events`

Create a new watch party event with movie, date/time, capacity, and description.

### `POST /api/events/:eventId/join`

Join an existing watch party event as a participant.

### `POST /api/events/:eventId/leave`

Leave a watch party event the user has joined.

### `DELETE /api/events/:eventId`

Delete a watch party event (only by host).

### `GET /api/movies/search`

Search for movies by title when creating an event.

---

## Messages APIs

### `GET /api/messages/threads`

Get all message conversation threads with friends.

### `GET /api/messages/threads/:friendId`

Retrieve message history with a specific friend.

### `POST /api/messages/send`

Send a new message to a friend.

### `GET /api/messages/unread-count`

Get the count of unread messages for notification badge.

---

## Notifications APIs

### `GET /api/notifications`

Fetch user's notifications with optional filter (all, unread, read).

### `GET /api/notifications/unread-count`

Get the count of unread notifications for notification badge.

### `PATCH /api/notifications/:notificationId/read`

Mark a specific notification as read.

### `POST /api/notifications/mark-all-read`

Mark all notifications as read at once.

---

## Settings APIs

### `GET /api/settings`

Retrieve user's current account settings and preferences.

### `PATCH /api/settings/account`

Update account information (name, email, username).

### `PATCH /api/settings/password`

Change user's password (requires current password verification).

### `DELETE /api/settings/account`

Delete user account permanently (requires password confirmation).

---

## Search API

### `GET /api/movies?search=:query`

Real-time search for movies by title in the top navigation search bar.

---

## Summary

**Total User-Side API Endpoints: 49**

- **Authentication**: 4 endpoints
- **User Profile**: 2 endpoints
- **Movie Browsing**: 6 endpoints
- **Dashboard**: 4 endpoints
- **Watchlist**: 5 endpoints
- **Social Features**: 7 endpoints
- **Reviews & Ratings**: 5 endpoints
- **Posts & Comments**: 6 endpoints
- **Events**: 6 endpoints
- **Messages**: 4 endpoints
- **Notifications**: 4 endpoints
- **Settings**: 4 endpoints

---

**Note**: All API endpoints are prefixed with `/api` and require authentication (except signup, login, and public movie browsing). Responses are in JSON format with standard structure: `{ success: boolean, data: any, message: string }`.
