# Phase 1 Testing Guide

## Quick Start: Test Admin Database Setup

### Prerequisites

1. MySQL 8.0+ installed and running
2. Node.js installed (for automated tests)
3. All 6 SQL files executed in order

---

## Option 1: Automated Setup & Testing (Recommended)

### Windows:

```batch
# From 3movieCollectors directory
database\setup-admin.bat
```

This script will:

1. ✅ Backup current database
2. ✅ Execute all 6 SQL files in correct order
3. ✅ Run comprehensive test suite
4. ✅ Generate test report

---

## Option 2: Manual Testing

### Step 1: Install Dependencies

```bash
npm install mysql2
```

### Step 2: Execute SQL Files

```bash
# Navigate to database directory
cd database

# Execute files in order (enter MySQL password when prompted)
mysql -u root -p MovieCommunity < admin_schema.sql
mysql -u root -p MovieCommunity < admin_triggers.sql
mysql -u root -p MovieCommunity < admin_procedures.sql
mysql -u root -p MovieCommunity < admin_functions.sql
mysql -u root -p MovieCommunity < admin_privileges.sql
mysql -u root -p MovieCommunity < admin_events.sql
```

### Step 3: Run Test Suite

```bash
# From 3movieCollectors directory
node database/test-admin-db.js
```

---

## What Gets Tested

### ✓ Database Components (10 test categories)

1. **Connection Tests**

   - Admin user connection
   - App user connection

2. **Table & View Verification**

   - 5 new tables (FlaggedContent, AdminReports, etc.)
   - 3 views (v_hidden_content_ids, v_admin_dashboard_stats, v_repeat_offenders)
   - Enhanced columns (AuditLog, User, RestrictedWords)

3. **Trigger Verification**

   - Count verification (16+ triggers)
   - Trigger listing

4. **Trigger Functionality Tests**

   - Movie INSERT audit logging
   - Auto-flagging with restricted words
   - Admin notification creation
   - User violation tracking
   - Content auto-hiding

5. **Stored Procedure Verification**

   - 10 procedures exist
   - Execution test (sp_get_top_watched_movies)

6. **MySQL Function Tests**

   - 5 functions exist
   - fn_is_admin execution
   - fn_contains_restricted_word execution

7. **User Privilege Tests**

   - Admin user grants
   - App user grants
   - App user DELETE restriction (security test)
   - Admin user DELETE privilege

8. **Scheduled Event Tests**

   - Event scheduler status
   - 3 events exist (daily backup, cleanup, repeat offender check)

9. **View Functionality Tests**

   - v_admin_dashboard_stats query
   - v_hidden_content_ids query
   - v_repeat_offenders query

10. **Procedure Functionality Tests**
    - sp_dismiss_flag full workflow
    - sp_rescan_content_for_word execution

---

## Expected Test Results

### ✅ All Passing (Target)

```
╔════════════════════════════════════════════════════════════════════╗
║     ADMIN FEATURE - PHASE 1 DATABASE TESTING SUITE               ║
║     Testing all triggers, procedures, functions & events          ║
╚════════════════════════════════════════════════════════════════════╝

Total Tests: 40+
Passed: 40+
Failed: 0
Pass Rate: 100%

✓ ALL TESTS PASSED!
Phase 1 database foundation is ready for production.
```

---

## Troubleshooting

### Issue: Connection Failed

```
Error: Access denied for user 'admin_user'@'localhost'
```

**Solution:**

1. Execute `admin_privileges.sql` first
2. Check passwords: Default is `AdminPass123!@#`
3. Change passwords if needed:
   ```sql
   ALTER USER 'admin_user'@'localhost' IDENTIFIED BY 'YourPassword';
   ```

### Issue: Triggers Not Found

```
✗ Trigger count: Found 0 triggers (expected 16+)
```

**Solution:**
Execute `admin_triggers.sql`:

```bash
mysql -u root -p MovieCommunity < database/admin_triggers.sql
```

### Issue: Event Scheduler OFF

```
⚠ Event scheduler status: OFF
```

**Solution:**

```sql
SET GLOBAL event_scheduler = ON;

-- Make permanent in my.ini or my.cnf:
[mysqld]
event_scheduler = ON
```

### Issue: Test Data Not Cleaned

```
Error: Duplicate entry for key 'PRIMARY'
```

**Solution:**
Clean test data manually:

```sql
DELETE FROM Post WHERE postContent LIKE '%testbadword123%';
DELETE FROM FlaggedContent WHERE matchedWord LIKE '%test%';
DELETE FROM Movie WHERE title LIKE '%Test Movie for Audit%';
DELETE FROM RestrictedWords WHERE word LIKE '%test%';
```

---

## Manual Verification Queries

If automated tests fail, verify manually:

### 1. Check Tables

```sql
USE MovieCommunity;
SHOW TABLES;
-- Should show: FlaggedContent, AdminReports, UserViolations, AdminNotifications, SecurityEvents
```

### 2. Check Triggers

```sql
SELECT COUNT(*) as TriggerCount
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'MovieCommunity';
-- Should return: 16+
```

### 3. Test View

```sql
SELECT * FROM v_admin_dashboard_stats;
-- Should return: Dashboard statistics
```

### 4. Test Function

```sql
SELECT fn_is_admin(1) as IsAdmin;
-- Should return: 1 (if user 1 is admin)
```

### 5. Test Procedure

```sql
CALL sp_get_top_watched_movies(5, 0);
-- Should return: Top 5 watched movies
```

### 6. Test Trigger

```sql
-- Add test restricted word
INSERT INTO RestrictedWords (word, severity) VALUES ('testword', 'high');

-- Create post with restricted word
INSERT INTO Post (userID, movieID, postContent, postedDate)
VALUES (1, 1, 'This has testword in it', NOW());

-- Check if flagged
SELECT * FROM FlaggedContent WHERE matchedWord = 'testword';
-- Should show: 1 row with isHidden = TRUE

-- Cleanup
DELETE FROM Post WHERE postContent LIKE '%testword%';
DELETE FROM FlaggedContent WHERE matchedWord = 'testword';
DELETE FROM RestrictedWords WHERE word = 'testword';
```

---

## Test Output Files

After running tests, check:

1. **database/test-results.json**

   - Complete test results in JSON format
   - Details for each test case
   - Timestamps and error messages

2. **Console Output**
   - Real-time test progress
   - Colored output (✓ green, ✗ red)
   - Summary report

---

## Next Steps After Testing

### If All Tests Pass ✅

1. Review test results
2. Change default passwords:
   ```sql
   ALTER USER 'admin_user'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';
   ALTER USER 'app_user'@'localhost' IDENTIFIED BY 'YourSecurePassword456!';
   ```
3. Proceed to **Phase 2: Backend API Routes**
4. Start implementing admin routes in `server/routes/admin/`

### If Tests Fail ❌

1. Review failed test details in output
2. Check SQL file execution order
3. Verify MySQL version (8.0+ required)
4. Check MySQL error log
5. Re-run individual SQL files if needed
6. Consult ADMIN_SETUP_GUIDE.md

---

## Performance Benchmarks

Expected test execution times:

- Connection setup: < 1 second
- Table/View verification: < 2 seconds
- Trigger tests: < 5 seconds (includes data creation/cleanup)
- Procedure tests: < 3 seconds
- Function tests: < 1 second
- Privilege tests: < 2 seconds
- **Total runtime: ~15-20 seconds**

---

## Security Notes

⚠️ **IMPORTANT**: The test suite uses default passwords:

- admin_user: `AdminPass123!@#`
- app_user: `AppPass123!@#`

**Change these immediately in production!**

---

## Contact & Support

For issues or questions:

1. Check ADMIN_SETUP_GUIDE.md for detailed troubleshooting
2. Review test output for specific error messages
3. Check MySQL error log location:
   - Windows: `C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err`
   - Linux: `/var/log/mysql/error.log`

---

_Last Updated: December 9, 2025_
