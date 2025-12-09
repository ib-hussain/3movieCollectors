# Admin API Routes Documentation - Phase 2

## Overview

Complete documentation for all admin API endpoints implemented in Phase 2.

**Base URL:** `/api/admin`

**Authentication:** All routes require admin authentication via `requireAdmin` middleware. Admin session must be established first via `/api/auth/login`.

---

## Authentication

### Login as Admin

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin_username",
  "password": "admin_password"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "userID": 1,
    "username": "admin_username",
    "role": "admin"
  }
}
```

---

## Content Moderation Routes

### Get Flagged Content

```http
GET /api/admin/moderation/flags?status=pending&contentType=post&page=1&limit=20
```

**Query Parameters:**

- `status` (string): Filter by status - `pending`, `dismissed`, `deleted` (default: `pending`)
- `contentType` (string): Filter by type - `post`, `review`, `comment`
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "flags": [
    {
      "flagID": 1,
      "contentType": "post",
      "contentID": 123,
      "reason": "Auto-flagged: Contains restricted word",
      "reportedDate": "2025-12-09T21:00:00.000Z",
      "status": "pending",
      "isHidden": 1,
      "severityLevel": "high",
      "userID": 5,
      "username": "user123",
      "contentText": "The flagged content text..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Get Single Flag Details

```http
GET /api/admin/moderation/flags/:flagID
```

**Response:**

```json
{
  "success": true,
  "flag": {
    "flagID": 1,
    "contentType": "post",
    "contentID": 123,
    "reason": "Auto-flagged: Contains restricted word",
    "reportedDate": "2025-12-09T21:00:00.000Z",
    "status": "pending",
    "isHidden": 1,
    "severityLevel": "high",
    "userID": 5,
    "username": "user123",
    "email": "user@example.com",
    "contentText": "The flagged content text..."
  }
}
```

### Dismiss a Flag

```http
PUT /api/admin/moderation/flags/:flagID/dismiss
Content-Type: application/json

{
  "reason": "False positive - content is acceptable"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Flag dismissed successfully"
}
```

### Delete Flagged Content

```http
DELETE /api/admin/moderation/flags/:flagID/content
Content-Type: application/json

{
  "reason": "Violates community guidelines"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Content deleted successfully"
}
```

### Rescan Content for Restricted Word

```http
POST /api/admin/moderation/rescan
Content-Type: application/json

{
  "word": "badword"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Rescan completed for word: badword",
  "result": {
    "flaggedCount": 5
  }
}
```

### Get Moderation Statistics

```http
GET /api/admin/moderation/stats
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalFlags": 150,
    "pendingFlags": 45,
    "dismissedFlags": 80,
    "deletedFlags": 25,
    "hiddenContent": 30
  },
  "recentActivity": [
    {
      "flagID": 150,
      "contentType": "post",
      "reason": "Auto-flagged",
      "reportedDate": "2025-12-09T21:30:00.000Z",
      "status": "pending"
    }
  ]
}
```

---

## User Management Routes

### Get All Users

```http
GET /api/admin/users?role=user&isSuspended=false&search=john&page=1&limit=20
```

**Query Parameters:**

- `role` (string): Filter by role - `user`, `admin`
- `isSuspended` (boolean): Filter by suspension status
- `search` (string): Search in username, email, or name
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "users": [
    {
      "userID": 5,
      "username": "john_doe",
      "name": "John Doe",
      "email": "john@example.com",
      "registrationDate": "2025-11-01T10:00:00.000Z",
      "role": "user",
      "isSuspended": 0,
      "suspendedUntil": null,
      "postCount": 25,
      "reviewCount": 12,
      "violationCount": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Get User Details

```http
GET /api/admin/users/:userID
```

**Response:**

```json
{
  "success": true,
  "user": {
    "userID": 5,
    "username": "john_doe",
    "name": "John Doe",
    "email": "john@example.com",
    "registrationDate": "2025-11-01T10:00:00.000Z",
    "role": "user",
    "isSuspended": 0,
    "suspendedUntil": null
  },
  "activity": {
    "postCount": 25,
    "reviewCount": 12,
    "commentCount": 48,
    "watchlistCount": 35,
    "friendCount": 10
  },
  "violations": [
    {
      "violationID": 1,
      "flagID": 23,
      "violationDate": "2025-12-05T14:20:00.000Z",
      "action": "content_deleted"
    }
  ]
}
```

### Suspend User

```http
PUT /api/admin/users/:userID/suspend
Content-Type: application/json

{
  "duration": 7,
  "reason": "Multiple community guideline violations"
}
```

**Request Body:**

- `duration` (number): Suspension duration in days (required)
- `reason` (string): Reason for suspension (required)

**Response:**

```json
{
  "success": true,
  "message": "User suspended for 7 days"
}
```

### Unsuspend User

```http
PUT /api/admin/users/:userID/unsuspend
```

**Response:**

```json
{
  "success": true,
  "message": "User unsuspended successfully"
}
```

### Get User Violations

```http
GET /api/admin/users/:userID/violations
```

**Response:**

```json
{
  "success": true,
  "violations": [
    {
      "violationID": 1,
      "userID": 5,
      "flagID": 23,
      "violationDate": "2025-12-05T14:20:00.000Z",
      "action": "content_deleted",
      "contentType": "post",
      "flagReason": "Contains restricted word"
    }
  ]
}
```

### Get Repeat Offenders

```http
GET /api/admin/users/views/repeat-offenders
```

**Response:**

```json
{
  "success": true,
  "offenders": [
    {
      "userID": 8,
      "username": "problem_user",
      "violationCount": 5,
      "lastViolation": "2025-12-09T18:00:00.000Z"
    }
  ]
}
```

### Update User Role

```http
PUT /api/admin/users/:userID/role
Content-Type: application/json

{
  "role": "admin"
}
```

**Request Body:**

- `role` (string): New role - `user` or `admin` (required)

**Response:**

```json
{
  "success": true,
  "message": "User role updated to admin"
}
```

---

## Movie Management Routes

### Bulk Add Movies

```http
POST /api/admin/movies/bulk-add
Content-Type: application/json

{
  "movies": [
    {
      "title": "The Matrix",
      "releaseYear": 1999,
      "director": "Wachowskis",
      "synopsis": "A computer hacker learns about the true nature of reality...",
      "posterImg": "matrix.jpg"
    },
    {
      "title": "Inception",
      "releaseYear": 2010,
      "director": "Christopher Nolan"
    }
  ]
}
```

**Request Body:**

- `movies` (array): Array of movie objects (required)
  - `title` (string): Movie title (required)
  - `releaseYear` (number): Release year (required)
  - `director` (string): Director name (optional)
  - `synopsis` (string): Movie synopsis (optional)
  - `posterImg` (string): Poster image filename (optional)

**Response:**

```json
{
  "success": true,
  "message": "2 movies added successfully",
  "count": 2
}
```

### Delete Movie

```http
DELETE /api/admin/movies/:movieID
```

**Response:**

```json
{
  "success": true,
  "message": "Movie \"The Matrix\" deleted successfully"
}
```

### Update Movie

```http
PUT /api/admin/movies/:movieID
Content-Type: application/json

{
  "title": "The Matrix Reloaded",
  "releaseYear": 2003,
  "director": "Wachowskis",
  "synopsis": "Updated synopsis...",
  "posterImg": "matrix_reloaded.jpg"
}
```

**Request Body:** (All fields optional, only provided fields will be updated)

- `title` (string): Movie title
- `releaseYear` (number): Release year
- `director` (string): Director name
- `synopsis` (string): Movie synopsis
- `posterImg` (string): Poster image filename

**Response:**

```json
{
  "success": true,
  "message": "Movie updated successfully"
}
```

### Get Movie Statistics

```http
GET /api/admin/movies/stats
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalMovies": 1247,
    "totalDirectors": 458,
    "oldestYear": 1920,
    "newestYear": 2025,
    "averageRating": 7.2,
    "totalViews": 52450
  },
  "topMovies": [
    {
      "movieID": 42,
      "title": "The Shawshank Redemption",
      "director": "Frank Darabont",
      "avgRating": 9.3,
      "viewCount": 15420
    }
  ],
  "recentlyAdded": [
    {
      "movieID": 1247,
      "changeDetails": "Added movie: \"Inception\" (2010)",
      "timestamp": "2025-12-09T20:00:00.000Z"
    }
  ]
}
```

### Get Most Watched Movies

```http
GET /api/admin/movies/most-watched?limit=20
```

**Response:**

```json
{
  "success": true,
  "movies": [
    {
      "movieID": 42,
      "title": "The Shawshank Redemption",
      "viewCount": 15420,
      "avgRating": 9.3
    }
  ]
}
```

### Get Highest Rated Movies

```http
GET /api/admin/movies/highest-rated?limit=20
```

**Response:**

```json
{
  "success": true,
  "movies": [
    {
      "movieID": 42,
      "title": "The Shawshank Redemption",
      "avgRating": 9.3,
      "reviewCount": 2450
    }
  ]
}
```

---

## Dashboard Routes

### Get Dashboard Overview

```http
GET /api/admin/dashboard/overview
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalUsers": 1520,
    "totalMovies": 1247,
    "totalPosts": 8945,
    "totalReviews": 12340,
    "totalGenres": 25,
    "totalEvents": 156
  },
  "recentActivity": [
    {
      "operationPerformed": "INSERT",
      "tableName": "Movie",
      "recordID": 1247,
      "changeDetails": "Added movie: \"Inception\" (2010)",
      "timestamp": "2025-12-09T20:00:00.000Z",
      "ipAddress": "192.168.1.100"
    }
  ],
  "flagStats": {
    "pendingFlags": 45,
    "highSeverity": 12,
    "mediumSeverity": 28,
    "lowSeverity": 5
  },
  "userGrowth": [
    {
      "date": "2025-12-09",
      "newUsers": 15
    }
  ],
  "activeUsers": 342
}
```

### Get Audit Log

```http
GET /api/admin/dashboard/audit-log?operation=INSERT&tableName=Movie&startDate=2025-12-01&endDate=2025-12-09&page=1&limit=50
```

**Query Parameters:**

- `operation` (string): Filter by operation - `INSERT`, `UPDATE`, `DELETE`, etc.
- `tableName` (string): Filter by table name
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**

```json
{
  "success": true,
  "logs": [
    {
      "logID": 1234,
      "userID": 1,
      "username": "admin_user",
      "operationPerformed": "INSERT",
      "tableName": "Movie",
      "recordID": 1247,
      "changeDetails": "Added movie: \"Inception\" (2010)",
      "timestamp": "2025-12-09T20:00:00.000Z",
      "ipAddress": "192.168.1.100"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2345,
    "totalPages": 47
  }
}
```

### Get Security Events

```http
GET /api/admin/dashboard/security-events?severity=high&page=1&limit=50
```

**Response:**

```json
{
  "success": true,
  "events": [
    {
      "eventID": 45,
      "userID": 23,
      "username": "suspicious_user",
      "eventType": "failed_login_attempt",
      "severity": "medium",
      "details": "Failed login attempt from IP 192.168.1.200",
      "eventTime": "2025-12-09T19:45:00.000Z",
      "ipAddress": "192.168.1.200"
    }
  ],
  "severityStats": [
    { "severity": "low", "count": 120 },
    { "severity": "medium", "count": 45 },
    { "severity": "high", "count": 8 }
  ]
}
```

### Get Admin Notifications

```http
GET /api/admin/dashboard/notifications?isRead=false&page=1&limit=20
```

**Response:**

```json
{
  "success": true,
  "notifications": [
    {
      "notificationID": 78,
      "message": "New content flagged: Post #1234 contains restricted word",
      "severity": "high",
      "isRead": 0,
      "createdAt": "2025-12-09T21:00:00.000Z"
    }
  ],
  "unreadCount": 12
}
```

### Mark Notification as Read

```http
PUT /api/admin/dashboard/notifications/:notificationID/read
```

**Response:**

```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Get User Activity Report

```http
GET /api/admin/dashboard/reports/user-activity?limit=20
```

**Response:**

```json
{
  "success": true,
  "users": [
    {
      "userID": 42,
      "username": "active_user",
      "activityScore": 8.5,
      "postCount": 45,
      "reviewCount": 28,
      "commentCount": 120
    }
  ]
}
```

### Get Content Statistics

```http
GET /api/admin/dashboard/reports/content-stats
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalPosts": 8945,
    "totalReviews": 12340,
    "totalComments": 45620,
    "postsLast24h": 125,
    "reviewsLast24h": 89,
    "commentsLast24h": 340
  }
}
```

---

## Restricted Words Routes

### Get All Restricted Words

```http
GET /api/admin/restricted-words?severity=high
```

**Query Parameters:**

- `severity` (string): Filter by severity - `low`, `medium`, `high`

**Response:**

```json
{
  "success": true,
  "words": [
    {
      "wordID": 5,
      "word": "badword",
      "severity": "high",
      "addedDate": "2025-11-15T10:00:00.000Z",
      "lastScannedDate": "2025-12-09T20:00:00.000Z"
    }
  ],
  "total": 45
}
```

### Add Restricted Word

```http
POST /api/admin/restricted-words
Content-Type: application/json

{
  "word": "newbadword",
  "severity": "medium"
}
```

**Request Body:**

- `word` (string): The restricted word (required)
- `severity` (string): Severity level - `low`, `medium`, `high` (default: `medium`)

**Response:**

```json
{
  "success": true,
  "message": "Restricted word \"newbadword\" added successfully"
}
```

### Update Restricted Word

```http
PUT /api/admin/restricted-words/:wordID
Content-Type: application/json

{
  "word": "updatedbadword",
  "severity": "high"
}
```

**Request Body:** (All fields optional)

- `word` (string): Updated word
- `severity` (string): Updated severity

**Response:**

```json
{
  "success": true,
  "message": "Restricted word updated successfully"
}
```

### Delete Restricted Word

```http
DELETE /api/admin/restricted-words/:wordID
```

**Response:**

```json
{
  "success": true,
  "message": "Restricted word \"badword\" deleted successfully"
}
```

### Bulk Add Restricted Words

```http
POST /api/admin/restricted-words/bulk-add
Content-Type: application/json

{
  "words": [
    {"word": "badword1", "severity": "high"},
    {"word": "badword2", "severity": "medium"},
    {"word": "badword3", "severity": "low"}
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Bulk add completed: 3 added, 0 skipped (duplicates)",
  "added": 3,
  "skipped": 0
}
```

### Get Restricted Words Statistics

```http
GET /api/admin/restricted-words/stats
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalWords": 45,
    "highSeverity": 12,
    "mediumSeverity": 28,
    "lowSeverity": 5,
    "oldestWord": "2025-10-01T10:00:00.000Z",
    "newestWord": "2025-12-09T21:00:00.000Z"
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Admin access required"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid request parameters",
  "error": "Detailed error message"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message"
}
```

---

## Testing

To test all admin API endpoints, run:

```bash
# Start the server first
npm start

# In another terminal, run the API test suite
node database/test-admin-api.js
```

The test suite will:

1. Authenticate as admin
2. Test all moderation endpoints
3. Test all user management endpoints
4. Test all movie management endpoints
5. Test all dashboard endpoints
6. Test all restricted words endpoints
7. Generate a comprehensive test report

---

## Security Notes

1. **Authentication Required:** All admin routes check for valid admin session
2. **Audit Logging:** All admin actions are logged in AuditLog table with IP address
3. **Context Variables:** Admin actions set MySQL session variables for trigger context
4. **Rate Limiting:** Consider implementing rate limiting for production
5. **Input Validation:** All inputs are validated before processing
6. **SQL Injection Prevention:** All queries use parameterized statements

---

## Database Triggers Context

Admin routes set context variables before database operations:

```javascript
await db.query(
  `
  SET @current_admin_id = ?;
  SET @current_ip_address = ?;
  SET @current_user_agent = ?;
`,
  [adminID, ipAddress, userAgent]
);
```

These variables are used by database triggers for audit logging.
