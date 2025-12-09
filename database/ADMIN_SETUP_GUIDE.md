# Admin Feature - Database Setup Guide

**Phase 1: Database Foundation - Complete Implementation Guide**

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [File Execution Order](#file-execution-order)
4. [Detailed Setup Instructions](#detailed-setup-instructions)
5. [Verification & Testing](#verification--testing)
6. [Troubleshooting](#troubleshooting)
7. [Security Considerations](#security-considerations)
8. [Next Steps](#next-steps)

---

## Overview

This guide walks you through setting up the complete MySQL database foundation for the admin feature. Phase 1 creates:

- **5 new tables**: FlaggedContent, AdminReports, UserViolations, AdminNotifications, SecurityEvents
- **3 table enhancements**: AuditLog, RestrictedWords, User
- **3 views**: v_hidden_content_ids, v_admin_dashboard_stats, v_repeat_offenders
- **16 triggers**: Audit logging + auto-flagging for restricted words
- **10 stored procedures**: Reports, moderation, management operations
- **5 MySQL functions**: Utility functions for queries
- **2 MySQL users**: admin_user (full privileges), app_user (limited)
- **3 scheduled events**: Automated backup, cleanup, monitoring

**Total Implementation**: 7 SQL files, ~2,500+ lines of MySQL code

---

## Prerequisites

### 1. System Requirements

- **MySQL Version**: 8.0+ (required for JSON support and enhanced trigger features)
- **MySQL User**: Root or user with SUPER privilege (for creating users and events)
- **Disk Space**: 50MB+ for database growth
- **Backup Location**: Designated folder for automated backups

### 2. Verify MySQL Version

```sql
SELECT VERSION();
-- Must be 8.0 or higher
```

### 3. Check Existing Database

```sql
SHOW DATABASES LIKE 'MovieCommunity';
USE MovieCommunity;
SHOW TABLES;
```

**Required Base Tables** (must exist before running admin SQL files):

- User
- Movie
- Post
- Comments
- ReviewRatings
- Watchlist
- WatchedMovies
- Notifications
- Messages
- Friendships
- Events
- Genres
- MovieGenres

### 4. Backup Current Database

```bash
# Linux/Mac
mysqldump -u root -p MovieCommunity > MovieCommunity_backup_before_admin.sql

# Windows PowerShell
mysqldump -u root -p MovieCommunity | Out-File "MovieCommunity_backup_before_admin.sql"
```

---

## File Execution Order

**CRITICAL**: Execute SQL files in this exact order to avoid dependency errors.

| Order | File                   | Purpose                           | Duration    |
| ----- | ---------------------- | --------------------------------- | ----------- |
| 1     | `admin_schema.sql`     | Create tables, views, indexes     | ~5 seconds  |
| 2     | `admin_triggers.sql`   | Create audit & auto-flag triggers | ~10 seconds |
| 3     | `admin_procedures.sql` | Create stored procedures          | ~5 seconds  |
| 4     | `admin_functions.sql`  | Create utility functions          | ~3 seconds  |
| 5     | `admin_privileges.sql` | Create MySQL users & grants       | ~2 seconds  |
| 6     | `admin_events.sql`     | Create scheduled events           | ~3 seconds  |

**Total Setup Time**: ~30 seconds

---

## Detailed Setup Instructions

### Method 1: MySQL Workbench (Recommended for Beginners)

1. **Open MySQL Workbench**
2. **Connect to your MySQL server**
3. **For each file in order:**
   - Click `File` → `Open SQL Script`
   - Navigate to `database/admin_schema.sql`
   - Click `Execute` (⚡ lightning icon) or press `Ctrl+Shift+Enter`
   - **Wait for "Success" message**
   - Check "Output" tab for verification queries
   - Repeat for remaining files in order

### Method 2: MySQL Command Line

```bash
# Navigate to database folder
cd "d:\University Semesters\5th Semester\DB Lab\Project\3movieCollectors\database"

# Execute files in order (Windows)
mysql -u root -p MovieCommunity < admin_schema.sql
mysql -u root -p MovieCommunity < admin_triggers.sql
mysql -u root -p MovieCommunity < admin_procedures.sql
mysql -u root -p MovieCommunity < admin_functions.sql
mysql -u root -p MovieCommunity < admin_privileges.sql
mysql -u root -p MovieCommunity < admin_events.sql

# Linux/Mac (same commands work)
```

### Method 3: MySQL Shell (Alternative)

```bash
mysqlsh --uri root@localhost:3306/MovieCommunity

# Inside MySQL Shell:
\source admin_schema.sql
\source admin_triggers.sql
\source admin_procedures.sql
\source admin_functions.sql
\source admin_privileges.sql
\source admin_events.sql
```

### Method 4: Node.js Script (Automated)

Create `database/setup.js`:

```javascript
const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const path = require("path");

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "your_password", // CHANGE THIS
    database: "MovieCommunity",
    multipleStatements: true,
  });

  const files = [
    "admin_schema.sql",
    "admin_triggers.sql",
    "admin_procedures.sql",
    "admin_functions.sql",
    "admin_privileges.sql",
    "admin_events.sql",
  ];

  for (const file of files) {
    console.log(`\nExecuting ${file}...`);
    const sql = await fs.readFile(path.join(__dirname, file), "utf8");
    await connection.query(sql);
    console.log(`✓ ${file} completed`);
  }

  await connection.end();
  console.log("\n✓ All files executed successfully!");
}

setupDatabase().catch(console.error);
```

Run with:

```bash
node database/setup.js
```

---

## Verification & Testing

### Step 1: Verify Tables Created

```sql
USE MovieCommunity;

-- Check all tables exist
SHOW TABLES;

-- Should show:
-- FlaggedContent
-- AdminReports
-- UserViolations
-- AdminNotifications
-- SecurityEvents
-- (plus existing tables with modifications)

-- Verify table structures
DESCRIBE FlaggedContent;
DESCRIBE AdminReports;
DESCRIBE UserViolations;
DESCRIBE AdminNotifications;
DESCRIBE SecurityEvents;

-- Check enhanced tables
SHOW COLUMNS FROM AuditLog LIKE '%ipAddress%';
SHOW COLUMNS FROM RestrictedWords LIKE '%lastScannedDate%';
SHOW COLUMNS FROM User LIKE '%isSuspended%';
```

### Step 2: Verify Views

```sql
-- List all views
SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW';

-- Test views
SELECT * FROM v_hidden_content_ids LIMIT 5;
SELECT * FROM v_admin_dashboard_stats;
SELECT * FROM v_repeat_offenders LIMIT 10;
```

### Step 3: Verify Triggers

```sql
-- Show all triggers
SHOW TRIGGERS WHERE `Trigger` LIKE 'trg_%';

-- Count triggers (should be 16+)
SELECT COUNT(*) as TriggerCount
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'MovieCommunity';
```

### Step 4: Verify Stored Procedures

```sql
-- Show procedures
SHOW PROCEDURE STATUS WHERE Db = 'MovieCommunity';

-- Test a procedure (get top watched movies)
CALL sp_get_top_watched_movies(5, 0);
```

### Step 5: Verify Functions

```sql
-- Show functions
SHOW FUNCTION STATUS WHERE Db = 'MovieCommunity';

-- Test functions
SELECT fn_is_admin(1) as IsAdmin;
SELECT fn_user_activity_score(1) as ActivityScore;
SELECT fn_contains_restricted_word('This is a test') as RestrictedWord;
```

### Step 6: Verify MySQL Users

```sql
-- Check users created
SELECT User, Host FROM mysql.user WHERE User IN ('admin_user', 'app_user');

-- Verify admin_user privileges
SHOW GRANTS FOR 'admin_user'@'localhost';

-- Verify app_user privileges
SHOW GRANTS FOR 'app_user'@'localhost';

-- Test admin_user connection (in new terminal)
mysql -u admin_user -p'AdminPass123!@#' MovieCommunity -e "SELECT DATABASE(), USER();"
```

### Step 7: Verify Events

```sql
-- Check event scheduler enabled
SHOW VARIABLES LIKE 'event_scheduler';
-- Should return: ON

-- Show all events
SHOW EVENTS FROM MovieCommunity;

-- Detailed event info
SELECT
    EVENT_NAME,
    EVENT_TYPE,
    STATUS,
    INTERVAL_VALUE,
    INTERVAL_FIELD,
    LAST_EXECUTED
FROM information_schema.EVENTS
WHERE EVENT_SCHEMA = 'MovieCommunity';
```

### Step 8: Test Trigger Functionality

```sql
-- Test auto-flagging trigger with restricted word
-- First, ensure there's a restricted word
INSERT INTO RestrictedWords (word, severity) VALUES ('test_badword', 'high');

-- Create a test post with the restricted word
SET @current_admin_id = NULL; -- Ensure it's a user action
INSERT INTO Post (userID, movieID, postContent, postedDate)
VALUES (1, 1, 'This post contains test_badword which should be flagged', NOW());

-- Check if content was flagged
SELECT * FROM FlaggedContent ORDER BY flagID DESC LIMIT 1;
-- Should show the flagged post with isHidden = TRUE

-- Check if notification was created
SELECT * FROM AdminNotifications ORDER BY notificationID DESC LIMIT 1;

-- Clean up test data
DELETE FROM Post WHERE postContent LIKE '%test_badword%';
DELETE FROM FlaggedContent WHERE matchedWord = 'test_badword';
DELETE FROM AdminNotifications WHERE message LIKE '%test_badword%';
DELETE FROM RestrictedWords WHERE word = 'test_badword';
```

### Step 9: Test Stored Procedure

```sql
-- Test reporting procedure
CALL sp_get_highest_rated_movies(10, 1);

-- Test moderation procedure (create flag first)
INSERT INTO FlaggedContent (contentType, contentID, flagReason, status)
VALUES ('Post', 1, 'Test flag', 'pending');

SET @last_flag_id = LAST_INSERT_ID();

-- Test dismiss flag
CALL sp_dismiss_flag(@last_flag_id, 1, 'False positive - test', '127.0.0.1', 'Test');

-- Verify flag was dismissed
SELECT * FROM FlaggedContent WHERE flagID = @last_flag_id;
```

### Step 10: Comprehensive Health Check

```sql
-- Run complete health check
SELECT 'Database Setup Health Check' as Status;

SELECT
    'Tables' as Component,
    COUNT(*) as Count,
    'Expected: 13+ base + 5 new = 18+' as Expected
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'MovieCommunity'
AND TABLE_TYPE = 'BASE TABLE';

SELECT
    'Views' as Component,
    COUNT(*) as Count,
    'Expected: 3' as Expected
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = 'MovieCommunity';

SELECT
    'Triggers' as Component,
    COUNT(*) as Count,
    'Expected: 16+' as Expected
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'MovieCommunity';

SELECT
    'Procedures' as Component,
    COUNT(*) as Count,
    'Expected: 10' as Expected
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'MovieCommunity'
AND ROUTINE_TYPE = 'PROCEDURE';

SELECT
    'Functions' as Component,
    COUNT(*) as Count,
    'Expected: 5' as Expected
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'MovieCommunity'
AND ROUTINE_TYPE = 'FUNCTION';

SELECT
    'Events' as Component,
    COUNT(*) as Count,
    'Expected: 3' as Expected
FROM information_schema.EVENTS
WHERE EVENT_SCHEMA = 'MovieCommunity';

SELECT
    'MySQL Users' as Component,
    COUNT(*) as Count,
    'Expected: 2 (admin_user, app_user)' as Expected
FROM mysql.user
WHERE User IN ('admin_user', 'app_user');

SELECT '✓ Health check complete!' as Status;
```

---

## Troubleshooting

### Issue 1: "Table already exists" Error

**Problem**: Re-running SQL files without dropping tables first.

**Solution**:

```sql
-- Option A: Drop specific table
DROP TABLE IF EXISTS FlaggedContent;

-- Option B: Drop all admin tables (CAREFUL!)
DROP TABLE IF EXISTS SecurityEvents;
DROP TABLE IF EXISTS AdminNotifications;
DROP TABLE IF EXISTS UserViolations;
DROP TABLE IF EXISTS AdminReports;
DROP TABLE IF EXISTS FlaggedContent;

-- Then re-run admin_schema.sql
```

### Issue 2: "Trigger already exists" Error

**Solution**:

```sql
-- Triggers are dropped automatically in the SQL files with:
DROP TRIGGER IF EXISTS trigger_name;

-- If still getting errors, manually drop all triggers:
SELECT CONCAT('DROP TRIGGER IF EXISTS ', TRIGGER_NAME, ';')
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'MovieCommunity'
AND TRIGGER_NAME LIKE 'trg_%';

-- Copy output and execute
```

### Issue 3: "Event Scheduler is OFF" Error

**Solution**:

```sql
-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Make persistent (add to my.ini or my.cnf):
-- [mysqld]
-- event_scheduler = ON

-- Restart MySQL service
```

### Issue 4: Permission Denied Creating Users

**Problem**: Current MySQL user doesn't have CREATE USER privilege.

**Solution**:

```sql
-- Connect as root
mysql -u root -p

-- Grant necessary privileges to your user
GRANT CREATE USER ON *.* TO 'your_user'@'localhost';
GRANT RELOAD ON *.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Issue 5: Procedure/Function Syntax Error

**Problem**: MySQL version < 8.0 may not support some features.

**Solution**:

```sql
-- Check MySQL version
SELECT VERSION();

-- If < 8.0, upgrade MySQL or modify JSON functions
-- Replace JSON_EXTRACT with manual parsing
```

### Issue 6: Triggers Not Firing

**Problem**: Admin context variables not set.

**Solution**:

```sql
-- Set admin context before admin operations
SET @current_admin_id = 1;
SET @current_ip_address = '127.0.0.1';
SET @current_user_agent = 'Admin Panel';

-- Perform operation
UPDATE Movie SET title = 'New Title' WHERE movieID = 1;

-- Clear context
SET @current_admin_id = NULL;
SET @current_ip_address = NULL;
SET @current_user_agent = NULL;
```

### Issue 7: Foreign Key Constraint Errors

**Problem**: Tables not created in correct order.

**Solution**:

- Execute `admin_schema.sql` AFTER base schema
- Verify base tables exist first
- Check foreign key relationships:

```sql
SELECT
    CONSTRAINT_NAME,
    TABLE_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'MovieCommunity'
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

---

## Security Considerations

### 1. Change Default Passwords IMMEDIATELY

```sql
-- Change admin password
ALTER USER 'admin_user'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';

-- Change app password
ALTER USER 'app_user'@'localhost' IDENTIFIED BY 'YourSecurePassword456!';

-- Verify changes
SELECT User, Host, authentication_string FROM mysql.user WHERE User IN ('admin_user', 'app_user');
```

### 2. Use Environment Variables in Application

**Never hardcode passwords!**

```javascript
// .env file (NEVER commit to Git)
DB_ADMIN_USER=admin_user
DB_ADMIN_PASSWORD=YourSecurePassword123!
DB_APP_USER=app_user
DB_APP_PASSWORD=YourSecurePassword456!

// Node.js config
require('dotenv').config();

const adminConnection = mysql.createPool({
    host: 'localhost',
    user: process.env.DB_ADMIN_USER,
    password: process.env.DB_ADMIN_PASSWORD,
    database: 'MovieCommunity'
});
```

### 3. Restrict MySQL User Hosts

```sql
-- For production, restrict to application server IP only
CREATE USER 'admin_user'@'192.168.1.100' IDENTIFIED BY 'password';
-- Instead of 'admin_user'@'localhost' or '%'
```

### 4. Enable SSL for Database Connections

```javascript
const connection = mysql.createConnection({
  host: "localhost",
  user: "admin_user",
  password: process.env.DB_ADMIN_PASSWORD,
  database: "MovieCommunity",
  ssl: {
    ca: fs.readFileSync("/path/to/ca.pem"),
    key: fs.readFileSync("/path/to/client-key.pem"),
    cert: fs.readFileSync("/path/to/client-cert.pem"),
  },
});
```

### 5. Regular Privilege Audits

```sql
-- Review all user privileges monthly
SHOW GRANTS FOR 'admin_user'@'localhost';
SHOW GRANTS FOR 'app_user'@'localhost';

-- Revoke unnecessary privileges
REVOKE DELETE ON MovieCommunity.AuditLog FROM 'admin_user'@'localhost';
```

### 6. Monitor Failed Login Attempts

```sql
-- Check security events
SELECT * FROM SecurityEvents
WHERE eventType = 'failed_login'
AND eventDate >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY eventDate DESC;
```

---

## Next Steps

### Phase 1 Complete! ✓

You have successfully set up:

- ✅ Complete database schema
- ✅ Automated audit logging
- ✅ Content moderation system
- ✅ User violation tracking
- ✅ Admin notification system
- ✅ Reporting infrastructure
- ✅ Scheduled maintenance tasks

### Proceed to Phase 2: Backend API Routes

**Next Implementation Steps** (see ADMIN_IMPLEMENTATION_ROADMAP.md):

1. **Phase 2: Authentication Routes** (Week 1)

   - Create `server/routes/admin/auth.js`
   - Implement admin login endpoint
   - Add admin session management
   - Create admin middleware enhancements

2. **Phase 3: Content Moderation Routes** (Week 1-2)

   - Create `server/routes/admin/moderation.js`
   - GET /api/admin/flags (paginated list)
   - POST /api/admin/flags/:id/review
   - DELETE /api/admin/flags/:id/delete

3. **Phase 4: Movie Management Routes** (Week 2)

   - Create `server/routes/admin/movies.js`
   - CRUD operations for movies
   - TMDB import integration
   - Bulk operations

4. **Phase 5-10**: Dashboard, Reports, Users, System Settings, Frontend UI, Testing

### Testing the Database Layer

Before moving to Phase 2, test database operations:

```javascript
// test-admin-db.js
const mysql = require("mysql2/promise");

async function testDatabase() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "admin_user",
    password: "AdminPass123!@#", // CHANGE THIS
    database: "MovieCommunity",
  });

  // Test 1: Get dashboard stats
  const [stats] = await connection.query(
    "SELECT * FROM v_admin_dashboard_stats"
  );
  console.log("Dashboard Stats:", stats[0]);

  // Test 2: Call stored procedure
  const [movies] = await connection.query(
    "CALL sp_get_top_watched_movies(5, 0)"
  );
  console.log("Top Movies:", movies[0]);

  // Test 3: Test function
  const [result] = await connection.query("SELECT fn_is_admin(1) as isAdmin");
  console.log("Is Admin:", result[0].isAdmin);

  await connection.end();
  console.log("✓ Database tests passed!");
}

testDatabase().catch(console.error);
```

### Backup Strategy

Set up automated backups:

**Linux Cron Job** (daily at 2 AM):

```bash
crontab -e

# Add line:
0 2 * * * mysqldump -u admin_user -p'AdminPass123!@#' MovieCommunity | gzip > /backups/moviedb_$(date +\%Y\%m\%d).sql.gz
```

**Windows Task Scheduler**:

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 2:00 AM
4. Action: Start a program
5. Program: `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe`
6. Arguments: `-u admin_user -p"AdminPass123!@#" MovieCommunity`
7. Add: `> C:\Backups\backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql`

---

## Support & Resources

### Useful Commands Reference

```sql
-- View all admin tables
SHOW TABLES LIKE '%Admin%' OR SHOW TABLES LIKE '%Flagged%' OR SHOW TABLES LIKE '%Security%';

-- View database size
SELECT
    table_schema as 'Database',
    SUM(data_length + index_length) / 1024 / 1024 as 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'MovieCommunity'
GROUP BY table_schema;

-- View largest tables
SELECT
    table_name as 'Table',
    ROUND((data_length + index_length) / 1024 / 1024, 2) as 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'MovieCommunity'
ORDER BY (data_length + index_length) DESC;

-- Analyze table performance
ANALYZE TABLE FlaggedContent, AdminReports, UserViolations;

-- Optimize tables
OPTIMIZE TABLE FlaggedContent, AdminReports, UserViolations;
```

### Documentation Links

- **MySQL 8.0 Reference Manual**: https://dev.mysql.com/doc/refman/8.0/en/
- **MySQL Triggers**: https://dev.mysql.com/doc/refman/8.0/en/triggers.html
- **MySQL Events**: https://dev.mysql.com/doc/refman/8.0/en/events.html
- **MySQL JSON Functions**: https://dev.mysql.com/doc/refman/8.0/en/json-functions.html

---

## Completion Checklist

Before proceeding to Phase 2, verify:

- [ ] All 6 SQL files executed successfully without errors
- [ ] Health check query shows correct counts for all components
- [ ] Triggers fire correctly (tested with sample data)
- [ ] Stored procedures execute without errors
- [ ] Functions return expected results
- [ ] MySQL users created with correct privileges
- [ ] Event scheduler enabled and events scheduled
- [ ] Default passwords changed
- [ ] Database backup created
- [ ] Test script validates all functionality
- [ ] Documentation reviewed and understood

**Once all items are checked, you are ready for Phase 2!**

---

_Document Version: 1.0_  
_Last Updated: December 9, 2025_  
_Created for: MovieCommunity Admin Feature - Phase 1_
