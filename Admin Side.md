# Admin Side API Documentation

This document lists all API endpoints used by the admin panel of the 3movieCollectors web application.

---

## 📋 Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Dashboard APIs](#dashboard-apis)
3. [User Management APIs](#user-management-apis)
4. [Movie Management APIs](#movie-management-apis)
5. [Moderation APIs](#moderation-apis)
6. [Restricted Words APIs](#restricted-words-apis)
7. [Audit Log APIs](#audit-log-apis)
8. [Reports & Analytics APIs](#reports--analytics-apis)
9. [Notification APIs](#notification-apis)

---

## Authentication APIs

### `GET /api/auth/me`

Verify admin authentication and retrieve admin user information (used on all admin pages).

### `POST /api/auth/logout`

End admin session and redirect to login page.

---

## Dashboard APIs

### `GET /api/admin/dashboard/overview`

Fetch dashboard overview statistics (total users, total movies, pending flags, posts today).

### `GET /api/admin/dashboard/audit-log`

Retrieve recent audit log entries with optional filters and pagination (limit parameter supported).

### `GET /api/admin/dashboard/notifications/unread-count`

Get count of unread admin notifications for the notification bell badge.

### `GET /api/admin/dashboard/reports/content-stats`

Fetch content statistics for dashboard charts (posts, reviews, comments over time).

---

## User Management APIs

### `GET /api/admin/users`

Browse all users with pagination and filters (search, role, status, page, limit).

### `GET /api/admin/users?role=admin&limit=1`

Check if any admin users exist in the system.

### `GET /api/admin/users/:userId/details`

Retrieve detailed information about a specific user including activity history.

### `POST /api/admin/users/:userId/suspend`

Suspend a user account with a reason (requires suspension reason in request body).

### `POST /api/admin/users/:userId/unsuspend`

Reactivate a previously suspended user account.

### `PATCH /api/admin/users/:userId/role`

Update user's role (admin/user) - must have at least one admin in system.

### `DELETE /api/admin/users/:userId`

Permanently delete a user account and all associated data.

---

## Movie Management APIs

### `GET /api/admin/movies/stats`

Get movie database statistics (total movies, genres distribution, average ratings).

### `GET /api/admin/movies/genres`

Fetch list of all available movie genres for filtering.

### `GET /api/admin/movies`

Browse movies with advanced filters (search, genre, year, sortBy, page, limit).

### `GET /api/admin/movies/:movieId`

Retrieve detailed information about a specific movie for editing.

### `POST /api/admin/movies`

Add a new movie to the database (title, year, genres, cast, poster, plot, etc.).

### `PATCH /api/admin/movies/:movieId`

Update existing movie information.

### `DELETE /api/admin/movies/:movieId`

Remove a movie from the database (also removes associated reviews, posts, watchlist entries).

### `POST /api/admin/movies/bulk-add`

Bulk import movies from TMDB API (provide comma-separated movie IDs).

---

## Moderation APIs

### `GET /api/admin/moderation/stats`

Fetch moderation statistics (pending flags, dismissed flags today, deleted content today).

### `GET /api/admin/moderation/flags`

Retrieve flagged content with filters (status, type, page, limit).

### `GET /api/admin/moderation/flags/:flagId`

Get detailed information about a specific flagged content item.

### `POST /api/admin/moderation/flags/:flagId/dismiss`

Dismiss a flag as false positive (content remains, flag marked as dismissed).

### `POST /api/admin/moderation/flags/:flagId/delete`

Delete the flagged content and mark flag as resolved.

### `POST /api/admin/moderation/rescan`

Re-scan all user-generated content (posts, reviews, comments) for restricted words.

---

## Restricted Words APIs

### `GET /api/admin/restricted-words/stats`

Get restricted words statistics (total words count).

### `GET /api/admin/restricted-words`

Retrieve list of all restricted words with pagination.

### `POST /api/admin/restricted-words`

Add a single new restricted word to the moderation system.

### `POST /api/admin/restricted-words/bulk-add`

Add multiple restricted words at once (comma-separated or newline-separated).

### `DELETE /api/admin/restricted-words/:wordId`

Remove a restricted word from the moderation system.

---

## Audit Log APIs

### `GET /api/admin/dashboard/audit-log`

Fetch audit log entries with advanced filters (operation, tableName, startDate, endDate, page, limit).

### `GET /api/admin/audit-log/export`

Export audit log data in CSV or PDF format with applied filters.

---

## Reports & Analytics APIs

### `GET /api/admin/dashboard/audit-log?operation=REPORT%20CREATION`

Retrieve report generation history for the reports page.

### `POST /api/admin/reports/generate`

Generate custom report (audit-log, user-activity, flagged-content, security-events) in PDF or CSV format.

### `GET /api/admin/reports/user-activity`

Export user activity report with filters (startDate, endDate, minPosts, minReviews).

### `GET /api/admin/reports/flagged-content`

Export flagged content report with filters (status, contentType, startDate, endDate).

### `GET /api/admin/reports/security-events`

Export security events report (failed logins, suspicious activities, date range).

---

## Notification APIs

### `GET /api/admin/notifications/unread-count`

Get count of unread admin notifications for notification badge.

### `GET /api/admin/notifications`

Retrieve all admin notifications with optional filters (unread, priority, type).

### `PATCH /api/admin/notifications/:notificationId/read`

Mark a specific admin notification as read.

### `POST /api/admin/notifications/mark-all-read`

Mark all admin notifications as read at once.

---

## Analytics APIs

### `GET /api/admin/dashboard/reports/content-stats`

Get content creation trends over time for dashboard charts (posts, reviews, comments by date).

### `GET /api/admin/dashboard/active-users`

Fetch list of most active users in a specified time period (day, week, month).

---

## Summary

**Total Admin-Side API Endpoints: 42**

- **Authentication**: 2 endpoints
- **Dashboard**: 5 endpoints
- **User Management**: 7 endpoints
- **Movie Management**: 8 endpoints
- **Moderation**: 6 endpoints
- **Restricted Words**: 5 endpoints
- **Audit Log**: 2 endpoints
- **Reports & Analytics**: 7 endpoints
- **Notifications**: 4 endpoints

---

## API Endpoint Patterns

All admin API endpoints follow these patterns:

- **Base URL**: `/api/admin` (except authentication endpoints)
- **Authentication Required**: All endpoints require admin role verification
- **Response Format**: JSON with structure `{ success: boolean, data: any, message: string }`
- **Error Handling**: Returns appropriate HTTP status codes (401 Unauthorized, 403 Forbidden, 404 Not Found, etc.)
- **Pagination**: Standard format with `page`, `limit`, `totalPages`, `totalItems` in response
- **Filtering**: Query parameters for filtering (e.g., `?status=pending&type=post&page=1&limit=20`)

---

## Security Features

- **Role-Based Access Control (RBAC)**: All admin endpoints check for `role='admin'` before allowing access
- **Session Management**: Admin sessions are tracked and can be terminated
- **Audit Logging**: All admin actions are logged to the AuditLog table
- **Input Validation**: All user input is validated and sanitized server-side
- **SQL Injection Prevention**: Parameterized queries used throughout
- **XSS Protection**: Output escaping implemented for all user-generated content
- **CSRF Protection**: Session-based authentication with secure cookies

---

## Notes

- Admin must be authenticated before accessing any admin panel features
- At least one admin must exist in the system (cannot delete or demote last admin)
- Bulk operations (movies, restricted words) process data asynchronously
- Report generation may take time for large datasets
- Real-time updates via polling every 30 seconds on dashboard and moderation pages
- Export formats supported: CSV and PDF for audit logs and reports
