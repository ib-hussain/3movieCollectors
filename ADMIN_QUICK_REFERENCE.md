# Admin System Quick Reference Guide

**Version:** 1.0  
**Last Updated:** December 9, 2025

---

## 🚀 Quick Start

### 1. Start the Server

```bash
node server/server.js
```

Server runs on: `http://localhost:3000`

### 2. Login as Admin

Navigate to login page and use admin credentials:

- Default admin username: `admin`
- Check database for actual admin users

### 3. Access Admin Dashboard

Navigate to: `html/admin/admin-dashboard.html`

---

## 📍 API Endpoints Reference

### Authentication

- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/check-session` - Check session status

### Dashboard & Overview

- `GET /api/admin/dashboard/overview` - Main statistics (users, movies, flags, posts)
- `GET /api/admin/dashboard/notifications` - Admin notifications
- `PUT /api/admin/dashboard/notifications/:id/read` - Mark notification as read
- `PUT /api/admin/dashboard/notifications/read-all` - Mark all as read

### User Management

- `GET /api/admin/users` - List all users with filters
- `GET /api/admin/users/:id` - Get single user details
- `PUT /api/admin/users/:id/suspend` - Suspend user
- `PUT /api/admin/users/:id/unsuspend` - Unsuspend user
- `DELETE /api/admin/users/:id` - Delete user

### Movie Management

- `GET /api/admin/movies` - List all movies with filters
- `POST /api/admin/movies` - Add new movie
- `PUT /api/admin/movies/:id` - Update movie
- `DELETE /api/admin/movies/:id` - Delete movie
- `POST /api/admin/movies/bulk-import` - Bulk import from TMDB

### Genre Management

- `GET /api/admin/genres` - List all genres
- `POST /api/admin/genres` - Add new genre
- `PUT /api/admin/genres/:id` - Update genre
- `DELETE /api/admin/genres/:id` - Delete genre

### Content Moderation

- `GET /api/admin/moderation/flags` - Get flagged content with filters
- `GET /api/admin/moderation/flags/:id` - Get single flag details
- `PUT /api/admin/moderation/flags/:id/review` - Review flag (approve/dismiss)
- `DELETE /api/admin/moderation/content/:contentType/:contentId` - Delete content

### Restricted Words

- `GET /api/admin/moderation/restricted-words` - List restricted words
- `POST /api/admin/moderation/restricted-words` - Add restricted word
- `PUT /api/admin/moderation/restricted-words/:id` - Update restricted word
- `DELETE /api/admin/moderation/restricted-words/:id` - Delete restricted word
- `POST /api/admin/moderation/restricted-words/rescan` - Re-scan all content

### Private Messages Moderation

- `GET /api/admin/messages` - Get all private messages with filters
- `GET /api/admin/messages/conversations/:userId1/:userId2` - Get conversation
- `POST /api/admin/messages/scan` - Scan messages for restricted words
- `GET /api/admin/messages/statistics` - Message statistics
- `DELETE /api/admin/messages/:id` - Delete message

### Reports & Export

- `GET /api/admin/reports/audit-log/pdf` - Export audit log as PDF
- `GET /api/admin/reports/audit-log/csv` - Export audit log as CSV
- `GET /api/admin/reports/user-activity/pdf` - Export user activity as PDF
- `GET /api/admin/reports/user-activity/csv` - Export user activity as CSV
- `GET /api/admin/reports/flagged-content/pdf` - Export flagged content as PDF
- `GET /api/admin/reports/flagged-content/csv` - Export flagged content as CSV
- `GET /api/admin/reports/security-events/pdf` - Export security events as PDF
- `GET /api/admin/reports/security-events/csv` - Export security events as CSV

### Audit Log

- `GET /api/admin/dashboard/audit-log` - Get audit log with filters

### Security Events

- `GET /api/admin/security/events` - Get security events with filters

---

## 🎨 Frontend Pages

### Completed ✅

- **Admin Dashboard** (`html/admin/admin-dashboard.html`)
  - Overview statistics
  - Activity charts
  - Recent flags
  - Active users
  - Audit log
  - Notifications

### Pending 📋

- **Movie Management** (`html/admin/admin-movies.html`)
- **Moderation Interface** (`html/admin/admin-moderation.html`)
- **User Management** (`html/admin/admin-users.html`)
- **Reports & Audit** (`html/admin/admin-reports.html`)
- **Messages Moderation** (`html/admin/admin-messages.html`)
- **Security Dashboard** (`html/admin/admin-security.html`)

---

## 🔍 Common Query Parameters

### Filtering

- `status` - Filter by status (e.g., pending, reviewed, dismissed)
- `contentType` - Filter by type (post, comment, watchlist)
- `startDate` - Start date for date range
- `endDate` - End date for date range
- `userId` - Filter by user ID
- `movieId` - Filter by movie ID

### Pagination

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Sorting

- `sortBy` - Field to sort by
- `order` - Sort order (asc, desc)

### Example Queries

```javascript
// Get pending flags for posts
GET /api/admin/moderation/flags?status=pending&contentType=post

// Get recent audit logs
GET /api/admin/dashboard/audit-log?limit=20&sortBy=timestamp&order=desc

// Get users registered in last 7 days
GET /api/admin/users?startDate=2025-12-02

// Export flagged content from last month as PDF
GET /api/admin/reports/flagged-content/pdf?startDate=2025-11-09&endDate=2025-12-09
```

---

## 📊 Dashboard Features

### Real-time Stats

- Total users (with weekly change)
- Total movies (with weekly change)
- Pending flags (with weekly change)
- Total posts (with weekly change)

### Charts

- **Activity Chart:** Line chart showing daily user activity
- **Content Distribution:** Doughnut chart showing content types

### Data Tables

- **Recent Flags:** Last 5 flagged items with status
- **Active Users:** Top 5 most active users
- **Audit Log:** Last 5 admin actions

### Notifications

- Unread notifications with badges
- Mark as read functionality
- Auto-refresh every 30 seconds

---

## 🔐 Security Notes

### Authentication

- All admin routes require authentication
- Session-based authentication with cookies
- Admin role validation on all admin endpoints

### Audit Logging

- All admin actions are logged to `admin_audit_log` table
- Includes: timestamp, admin ID, action type, target type, target ID, details

### Security Events

- Failed login attempts logged
- Suspicious activity tracked
- Security events viewable in dashboard

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Individual Test Suites

```bash
node database/test-database.js        # Phase 1: 48 tests
node database/test-admin-core.js      # Phase 2: 22 tests
node database/test-admin-messages.js  # Phase 3: 5 tests
node database/test-reports.js         # Phase 4: 8 tests
```

### Interactive Dashboard Test

Open `test-dashboard.html` in browser for:

- Server status check
- Authentication test
- Dashboard API test
- Quick links to all pages

---

## 📁 File Structure

```
3movieCollectors/
├── server/
│   ├── server.js                          # Main server
│   ├── middleware/
│   │   └── adminAuth.js                   # Admin auth middleware
│   ├── routes/
│   │   └── admin/
│   │       ├── index.js                   # Admin route registry
│   │       ├── users.js                   # User management
│   │       ├── movies.js                  # Movie management
│   │       ├── moderation.js              # Content moderation
│   │       ├── messages.js                # Message moderation
│   │       ├── reports.js                 # Export routes
│   │       └── genres.js                  # Genre management
│   └── utils/
│       ├── pdfExport.js                   # PDF generation
│       └── csvExport.js                   # CSV generation
├── database/
│   ├── admin-*.sql                        # Admin schemas
│   ├── test-*.js                          # Test suites
│   └── SCHEMA_REFERENCE.md                # Schema docs
├── html/admin/
│   └── admin-dashboard.html               # Dashboard UI
├── js/admin/
│   └── admin-dashboard.js                 # Dashboard logic
├── css/admin/
│   └── admin-dashboard.css                # Dashboard styling
├── test-dashboard.html                    # Interactive test
├── ADMIN_IMPLEMENTATION_ROADMAP.md        # Full roadmap
└── PROGRESS_SUMMARY.md                    # Progress tracker
```

---

## 🛠️ Troubleshooting

### Server Won't Start

1. Check if port 3000 is in use: `netstat -ano | findstr :3000`
2. Kill process if needed
3. Check MySQL connection in server config

### Can't Access Admin Dashboard

1. Verify server is running
2. Check if logged in as admin
3. Open browser console for errors
4. Verify session cookies are enabled

### API Returns 401/403

1. Login again as admin
2. Check session hasn't expired
3. Verify admin role in database

### Dashboard Not Loading Data

1. Open browser console for errors
2. Check network tab for failed requests
3. Verify API endpoints are responding
4. Check CORS settings if needed

### Tests Failing

1. Ensure server is running
2. Check database connection
3. Verify test data exists
4. Run tests individually to isolate issues

---

## 📈 Performance Tips

### Backend

- Use pagination for large datasets
- Add database indexes on frequently queried fields
- Cache dashboard statistics for 1-5 minutes
- Use connection pooling for MySQL

### Frontend

- Adjust polling interval based on load (default: 30s)
- Implement virtual scrolling for large tables
- Lazy load charts until visible
- Optimize images and assets

---

## 🔄 Maintenance Tasks

### Regular

- Review audit logs weekly
- Clear old security events monthly
- Export reports for archival
- Monitor server logs for errors

### As Needed

- Update restricted words list
- Review and update admin users
- Clear expired notifications
- Optimize database queries

---

## 📞 Support

For issues or questions:

1. Check `ADMIN_IMPLEMENTATION_ROADMAP.md` for detailed implementation info
2. Review `database/SCHEMA_REFERENCE.md` for table structures
3. Run `test-dashboard.html` to validate system status
4. Check server logs for errors

---

**Pro Tip:** Bookmark `test-dashboard.html` for quick system health checks!
