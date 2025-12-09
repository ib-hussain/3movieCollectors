# Database Schema Reference Guide

**Generated: December 9, 2025**  
**Last Updated: December 9, 2025 - Phase 5**  
**Purpose: Single source of truth for all table column names to prevent mismatches**

## Implementation Status

✅ **Phase 1-4 Backend: COMPLETE** - 83/83 tests passing (100%)  
🎨 **Phase 5 Frontend: Admin Dashboard UI Complete**

**Files Created:** 60+ files including:

- Database: 8 SQL files, 5 test suites
- Backend: 7 route files, 2 export utilities
- Frontend: 1 HTML, 1 JS, 1 CSS (Dashboard)
- Documentation: Schema reference, roadmap

## Critical Tables and Their Actual Column Names

### User Table

```
userID (int) - PK
username (varchar)
name (varchar)
email (varchar)
password (varchar)
registrationDate (datetime) ❗ NOT joinedDate
role (enum: 'user','admin')
isSuspended (tinyint)
suspendedDate (datetime) ❗ NOT suspendedUntil
suspensionReason (varchar)
suspendedBy (int)
profilePicture (varchar)
isDeleted (tinyint)
```

### Movie Table

```
movieID (int) - PK
title (varchar)
synopsis (text)
director (varchar)
releaseYear (int) ❗ NOT year
posterImg (varchar) ❗ NOT poster
totalViews (int)
viewCount (int)
avgRating (decimal)
❗ NO tmdb_id column
```

### Post Table

```
postID (int) - PK
movieID (int)
userID (int)
postContent (varchar)
likeCount (int)
commentCount (int)
createdAt (datetime) ❗ NOT postDate or postedDate
```

### Comments Table

```
commentID (int) - PK
postID (int)
userID (int)
commentContent (varchar) ❗ NOT commentText
createdAt (datetime) ❗ NOT commentDate
```

### ReviewRatings Table (Composite PK)

```
movieID (int) - PK1 ❗ NO reviewID column
userID (int) - PK2
rating (decimal)
review (text) ❗ NOT reviewText
reviewDate (datetime)
lastUpdated (datetime)
```

### FlaggedContent Table

```
flagID (int) - PK
contentType (enum)
contentID (int)
flaggedBy (int)
flagReason (varchar) ❗ NOT reason
flaggedDate (datetime) ❗ NOT reportedDate
status (enum)
isHidden (tinyint)
reviewedBy (int)
reviewedDate (datetime)
adminNotes (varchar)
matchedWord (varchar)
❗ NO severityLevel column
```

### AuditLog Table

```
logID (int) - PK ❗ NOT recordID
adminID (int) ❗ NOT userID
targetRecordID (int) ❗ NOT recordID
targetTable (varchar) ❗ NOT tableName
timeStamp (datetime) ❗ NOT timestamp
operationPerformed (enum)
actionDetails (varchar) ❗ NOT changeDetails
ipAddress (varchar)
userAgent (varchar)
```

### UserViolations Table

```
violationID (int) - PK
userID (int)
violationType (varchar)
violationDate (datetime)
relatedFlagID (int) ❗ NOT flagID
actionTaken (varchar)
actionBy (int)
actionDate (datetime)
actionNotes (varchar)
```

### SecurityEvents Table

```
eventID (int) - PK
eventType (varchar)
userID (int)
username (varchar)
eventDate (datetime) ❗ NOT eventTime
ipAddress (varchar)
userAgent (varchar)
requestPath (varchar)
requestMethod (varchar)
description (varchar)
severity (enum)
isReviewed (tinyint)
reviewedBy (int)
reviewedDate (datetime)
reviewNotes (varchar)
```

### AdminNotifications Table

```
notificationID (int) - PK
notificationType (enum)
title (varchar)
message (varchar)
priority (enum)
relatedType (varchar)
relatedID (int)
createdDate (datetime) ❗ NOT createdAt
isSent (tinyint)
sentDate (datetime)
isRead (tinyint)
readBy (int)
readDate (datetime)
```

### Friends Table

```
user1 (int) - PK1 ❗ NOT userID1
user2 (int) - PK2 ❗ NOT userID2
friendshipDate (datetime)
```

### Message Table

```
messageID (int) - PK
friendID (int)
senderID (int)
receiverID (int)
content (text) ❗ NOT messageText
timeStamp (datetime) ❗ NOT sentDate
isRead (tinyint) ❗ NOT readStatus
```

### RestrictedWords Table

```
wordID (int) - PK
word (varchar)
severity (enum)
addedDate (datetime)
addedBy (int)
```

### WatchList Table

```
userID (int) - PK1
movieID (int) - PK2
addedDate (datetime)
```

## Common Mismatches to Avoid

### Datetime Columns

- ✅ `registrationDate` NOT `joinedDate`
- ✅ `createdAt` for Post and Comments
- ✅ `flaggedDate` NOT `reportedDate`
- ✅ `timeStamp` in AuditLog NOT `timestamp`
- ✅ `eventDate` NOT `eventTime`
- ✅ `createdDate` in AdminNotifications NOT `createdAt`

### ID Columns

- ✅ `logID` in AuditLog NOT `recordID`
- ✅ `adminID` in AuditLog NOT `userID`
- ✅ `targetRecordID` NOT `recordID`
- ✅ `relatedFlagID` in UserViolations NOT `flagID`

### Text Columns

- ✅ `actionDetails` NOT `changeDetails`
- ✅ `commentContent` NOT `commentText`
- ✅ `review` in ReviewRatings NOT `reviewText`
- ✅ `flagReason` NOT `reason`

### Table Reference Columns

- ✅ `targetTable` in AuditLog NOT `tableName`

### Special Cases

- ✅ ReviewRatings has NO `reviewID` - uses composite key (movieID, userID)
- ✅ FlaggedContent has NO `severityLevel` column
- ✅ Friends table uses `user1` and `user2` NOT `userID1` and `userID2`

## Stored Procedure Parameter Conventions

### sp_bulk_add_movies expects JSON with:

- `title` (required)
- `releaseYear` (required) ❗ NOT `year`
- `director` (optional)
- `synopsis` (optional)
- `posterImg` (optional) ❗ NOT `poster`
- `tmdb_id` (optional)

### sp_get_most_active_users parameters:

- `p_limit` (INT)
- `p_days` (INT) - 0 = all time

### sp_get_top_watched_movies parameters:

- `p_limit` (INT)
- `p_days` (INT) - 0 = all time

### sp_get_highest_rated_movies parameters:

- `p_limit` (INT)
- `p_minRatings` (INT)

## Best Practices

1. **Always reference this document** before writing queries
2. **Test queries** with actual table schemas using SHOW COLUMNS
3. **Document any new columns** added to this reference immediately
4. **Use consistent naming** in stored procedures and route code
5. **Avoid assumptions** - verify column names in database before coding
6. **Update this file** whenever schema changes are made

## Quick Verification Commands

```sql
-- Check any table structure
SHOW COLUMNS FROM TableName;

-- Verify stored procedure parameters
SHOW CREATE PROCEDURE procedure_name;

-- List all tables
SHOW TABLES;

-- Verify table exists (case-insensitive on Windows)
SHOW TABLES LIKE 'tablename';
```

## Export Routes Available

### PDF Exports

- `/api/admin/reports/audit-log/pdf` - Audit log PDF report
- `/api/admin/reports/user-activity/pdf` - User activity PDF report
- `/api/admin/reports/flagged-content/pdf` - Flagged content PDF report
- `/api/admin/reports/security-events/pdf` - Security events PDF report

### CSV Exports

- `/api/admin/reports/audit-log/csv` - Audit log CSV export
- `/api/admin/reports/user-activity/csv` - User activity CSV export
- `/api/admin/reports/flagged-content/csv` - Flagged content CSV export
- `/api/admin/reports/security-events/csv` - Security events CSV export

---

**Last Updated:** December 9, 2025  
**Maintainer:** Development Team  
**Note:** This is a living document - update whenever schema changes occur
