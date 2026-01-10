# Database Schema Documentation

Complete reference for the 3movieCollectors MySQL database covering all tables, relationships, functions, procedures, triggers, events, and views.

---

## 📋 Table of Contents

1. [Database Overview](#database-overview)
2. [Core User Tables](#core-user-tables)
3. [Movie & Content Tables](#movie--content-tables)
4. [Social Features Tables](#social-features-tables)
5. [Admin & Moderation Tables](#admin--moderation-tables)
6. [Security & Audit Tables](#security--audit-tables)
7. [Stored Procedures](#stored-procedures)
8. [Functions](#functions)
9. [Triggers](#triggers)
10. [Scheduled Events](#scheduled-events)
11. [Views](#views)
12. [Relationships & Foreign Keys](#relationships--foreign-keys)

---

## Database Overview

**Database Name:** `3movieCollectors`  
**Character Set:** `utf8mb4`  
**Collation:** `utf8mb4_unicode_ci`  
**Total Tables:** 22 (11 core + 11 admin/security)  
**Total Procedures:** 15+  
**Total Functions:** 6  
**Total Triggers:** 20+  
**Total Events:** 7  
**Total Views:** 1

---

## Core User Tables

### `User`

Stores user account information including authentication credentials and profile data.
Primary table for both regular users and administrators with role-based access control.

**Columns:**

- `userID` (PK) - Auto-increment primary key
- `username` - Unique username for login
- `name` - User's display name
- `email` - Unique email address
- `password` - Bcrypt hashed password
- `registrationDate` - Account creation timestamp
- `role` - ENUM('user', 'admin') for access control
- `profilePicture` - Path to profile image file
- `isDeleted` - Soft delete flag (default FALSE)
- `isSuspended` - Admin suspension flag (default FALSE)
- `suspensionReason` - Reason for suspension if applicable
- `suspensionDate` - Timestamp of suspension

**Indexes:** `idx_email`, `idx_username`, `idx_isDeleted`

---

### `UserGenres`

Junction table linking users to their favorite movie genres for personalized recommendations.
Many-to-many relationship between User and Genres tables.

**Columns:**

- `userID` (FK) - References User table
- `genreID` (FK) - References Genres table

**Primary Key:** Composite (userID, genreID)

---

## Movie & Content Tables

### `Movie`

Central table storing all movie information including metadata, ratings, and view statistics.
Supports full-text search on title and filtered browsing by year, genre, and rating.

**Columns:**

- `movieID` (PK) - Auto-increment primary key
- `title` - Movie title (max 1023 chars)
- `synopsis` - Plot summary (TEXT)
- `director` - Director name
- `releaseYear` - Year of release
- `posterImg` - Poster image filename (default 'default.png')
- `totalViews` - Total view count across all users
- `viewCount` - Legacy view counter
- `avgRating` - Average rating from ReviewRatings (auto-calculated)

**Indexes:** `idx_title`, `idx_releaseYear`, `idx_avgRating`

---

### `Genres`

Master table of all available movie genres used for filtering and categorization.
System table with predefined genre data loaded during initial setup.

**Columns:**

- `genreID` (PK) - Auto-increment primary key
- `genreName` - Unique genre name (e.g., 'Action', 'Drama')

**Index:** `idx_genreName`

---

### `MovieGenres`

Junction table linking movies to their associated genres (supports multiple genres per movie).
Many-to-many relationship enabling genre-based filtering and recommendations.

**Columns:**

- `movieID` (FK) - References Movie table
- `genreID` (FK) - References Genres table

**Primary Key:** Composite (movieID, genreID)

---

### `MovieCast`

Stores cast member names for each movie (one row per cast member).
Supports multiple cast entries per movie without fixed schema limitations.

**Columns:**

- `movieID` (FK) - References Movie table
- `castMember` - Actor/actress name

**Note:** No primary key (allows duplicate names across different movies)

---

### `ReviewRatings`

User reviews and ratings for movies with update tracking and timestamp management.
Composite primary key prevents duplicate reviews from same user for same movie.

**Columns:**

- `movieID` (FK) - References Movie table
- `userID` (FK) - References User table
- `rating` - Decimal rating (0.0-5.0 scale)
- `review` - Optional text review (TEXT)
- `reviewDate` - Initial review timestamp
- `lastUpdated` - Auto-updated on modification

**Primary Key:** Composite (movieID, userID)

---

### `Post`

Discussion posts on movie pages with like/comment counters for engagement tracking.
Supports community discussion with real-time engagement metrics.

**Columns:**

- `postID` (PK) - Auto-increment primary key
- `movieID` (FK) - References Movie table
- `userID` (FK) - References User table
- `postContent` - Post text content (TEXT)
- `likeCount` - Total likes (updated by triggers)
- `commentCount` - Total comments (updated by triggers)
- `createdAt` - Post creation timestamp

**Indexes:** `idx_userID`, `idx_createdAt`

---

### `Comments`

Comments on posts with nested discussion support and user attribution.
Enables threaded conversations on movie discussion posts.

**Columns:**

- `commentID` (PK) - Auto-increment primary key
- `postID` (FK) - References Post table
- `userID` (FK) - References User table
- `commentContent` - Comment text (TEXT)
- `createdAt` - Comment timestamp

**Index:** `idx_postID`

---

### `Likes`

Junction table tracking post likes with timestamp for activity analysis.
Composite key prevents duplicate likes from same user on same post.

**Columns:**

- `postID` (FK) - References Post table
- `userID` (FK) - References User table
- `createdAt` - Like timestamp

**Primary Key:** Composite (postID, userID)

---

## Social Features Tables

### `Friends`

Bidirectional friendship relationships between users with friendship date tracking.
Composite key ensures unique friendships and prevents duplicate entries.

**Columns:**

- `user1` (FK) - References User table (lower userID)
- `user2` (FK) - References User table (higher userID)
- `friendshipDate` - When friendship was established

**Primary Key:** Composite (user1, user2)

---

### `FriendRequest`

Pending, accepted, and rejected friend requests with status tracking and timestamps.
Supports friend request workflow with response date tracking.

**Columns:**

- `reqID` (PK) - Auto-increment primary key
- `senderID` (FK) - User who sent request
- `receiverID` (FK) - User who received request
- `status` - ENUM('pending', 'accepted', 'rejected')
- `reqDate` - Request sent timestamp
- `responseDate` - Request answered timestamp (NULL if pending)

**Index:** `idx_receiverID_status`

---

### `Message`

Direct messages between friends with read status tracking and conversation threading.
Supports real-time messaging with unread message counters.

**Columns:**

- `messageID` (PK) - Auto-increment primary key
- `friendID` - Legacy field (not actively used)
- `senderID` (FK) - User who sent message
- `receiverID` (FK) - User who receives message
- `content` - Message text content (TEXT)
- `timeStamp` - Message sent timestamp
- `isRead` - Read status flag (default FALSE)

**Index:** `idx_receiverID_isRead`

---

### `Notifications`

User notifications for social events (friend requests, likes, comments, posts).
Auto-generated by triggers for real-time user engagement notifications.

**Columns:**

- `notificationID` (PK) - Auto-increment primary key
- `receivedFROMuserID` (FK) - User receiving notification
- `content` - Notification message text
- `triggerEvent` - ENUM('friend_request', 'friend_accept', 'new_post', 'post_like', 'post_comment')
- `isSeen` - Read status (default FALSE)
- `timeStamp` - Notification creation timestamp

**Index:** `idx_receivedFROMuserID_isSeen`

---

### `WatchList`

User movie watchlists with status tracking (to-watch, watching, completed).
Tracks user movie preferences and viewing progress with timestamps.

**Columns:**

- `movieID` (FK) - References Movie table
- `userID` (FK) - References User table
- `status` - ENUM('to-watch', 'watching', 'completed', 'not seen')
- `lastUpdated` - Auto-updated on status change
- `addedDate` - Initial addition timestamp

**Primary Key:** Composite (movieID, userID)  
**Index:** `idx_userID_status`

---

### `WatchEvent`

Watch party events where users can schedule group movie viewings with capacity limits.
Supports social viewing experiences with host management and participant tracking.

**Columns:**

- `eventID` (PK) - Auto-increment primary key
- `eventTitle` - Event name/title
- `associatedMovieID` (FK) - Movie being watched
- `host` (FK) - User hosting the event
- `description` - Event details (TEXT)
- `eventDateTime` - Scheduled date and time
- `capacity` - Maximum participants
- `currentCapacity` - Current participant count

**Indexes:** `idx_host`, `idx_eventDateTime`

---

### `EventParticipants`

Junction table linking users to watch events they've joined with capacity tracking.
Many-to-many relationship between WatchEvent and User tables.

**Columns:**

- `eventID` (FK) - References WatchEvent table
- `userID` (FK) - References User table

**Primary Key:** Composite (eventID, userID)

---

## Admin & Moderation Tables

### `FlaggedContent`

Auto-flagged content detected by restricted word scanning with admin review workflow.
Supports content moderation pipeline with hide/review/resolve status tracking.

**Columns:**

- `flagID` (PK) - Auto-increment primary key
- `contentType` - ENUM('Post', 'Comment', 'Review', 'Message')
- `contentID` - ID of flagged content (VARCHAR for composite keys)
- `flaggedDate` - Auto-detection timestamp
- `status` - ENUM('pending', 'reviewing', 'resolved', 'dismissed')
- `isHidden` - Whether content is hidden from public view
- `reviewedBy` (FK) - Admin who reviewed (NULL if pending)
- `reviewedDate` - Review completion timestamp
- `adminNotes` - Admin review notes (max 2047 chars)
- `matchedWord` - Restricted word that triggered flag

**Indexes:** `idx_status`, `idx_content`, `idx_flagged_date`, `idx_is_hidden`

---

### `RestrictedWords`

Dictionary of prohibited words for auto-flagging with severity levels and statistics.
Supports automatic content scanning and moderation triggers.

**Columns:**

- `wordID` (PK) - Auto-increment primary key
- `word` - Restricted word (unique, case-insensitive matching)
- `severity` - ENUM('low', 'medium', 'high') for prioritization
- `addedDate` - Word addition timestamp
- `lastScannedDate` - Last content rescan timestamp
- `flagCount` - Times this word triggered a flag

**Index:** `idx_word`

---

### `UserViolations`

Historical record of user policy violations for repeat offender detection.
Tracks violation patterns and admin actions taken against users.

**Columns:**

- `violationID` (PK) - Auto-increment primary key
- `userID` (FK) - User who violated policy
- `violationType` - ENUM('restricted_word') [extensible]
- `violationDate` - Violation timestamp
- `relatedFlagID` (FK) - Related FlaggedContent entry (NULL if N/A)
- `actionTaken` - ENUM('warning', 'content_deleted', 'suspended', 'none')
- `actionBy` (FK) - Admin who took action
- `actionDate` - Action timestamp
- `actionNotes` - Admin notes (max 1023 chars)

**Indexes:** `idx_user_id`, `idx_violation_date`, `idx_violation_type`

---

### `AdminNotifications`

Admin-specific notification system separate from user notifications with priority levels.
Alerts admins to flags, violations, security events, and system status.

**Columns:**

- `notificationID` (PK) - Auto-increment primary key
- `notificationType` - ENUM('new_flag', 'repeat_offender', 'system_alert', 'high_activity', 'security_event', 'backup_status')
- `title` - Notification title (max 255 chars)
- `message` - Detailed message (max 1023 chars)
- `priority` - ENUM('low', 'medium', 'high', 'critical')
- `relatedType` - Type of related entity ('flag', 'user', 'report', etc.)
- `relatedID` - ID of related entity
- `createdDate` - Notification creation timestamp
- `isSent` - Delivery status flag
- `sentDate` - Delivery timestamp
- `isRead` - Read status flag
- `readBy` (FK) - Admin who read notification
- `readDate` - Read timestamp

**Indexes:** `idx_is_sent`, `idx_is_read`, `idx_priority`, `idx_notification_type`, `idx_created_date`

---

### `AdminReports`

Generated admin reports stored as JSON with metadata for historical analysis.
Supports scheduled reporting and data export with PDF generation tracking.

**Columns:**

- `reportID` (PK) - Auto-increment primary key
- `reportType` - ENUM('top_watched_movies', 'highest_rated_movies', 'most_active_users', 'popular_forums', 'user_growth', 'content_statistics', 'moderation_summary', 'system_health')
- `generatedBy` (FK) - Admin who generated report
- `generatedDate` - Report creation timestamp
- `reportData` - Report results (JSON format)
- `reportPeriod` - Time range covered (e.g., 'Last 30 days')
- `reportParams` - Generation parameters (JSON format)
- `pdfGenerated` - Whether PDF was created
- `pdfPath` - Path to generated PDF file
- `pdfGeneratedDate` - PDF creation timestamp

**Indexes:** `idx_report_type`, `idx_generated_date`, `idx_generated_by`

---

## Security & Audit Tables

### `AuditLog`

Complete audit trail of all admin actions with IP tracking and detailed operation logs.
Critical for compliance, security analysis, and admin action accountability.

**Columns:**

- `logID` (PK) - Auto-increment primary key
- `adminID` (FK) - Admin who performed action (NULL for automated)
- `targetRecordID` - ID of affected record
- `targetTable` - Table where action occurred
- `timeStamp` - Action timestamp
- `operationPerformed` - ENUM('INSERT', 'UPDATE', 'DELETE CONTENT', 'MODERATION', 'MANAGEMENT', 'REPORT CREATION', 'VIEW RESTRICTED CONTENT', 'DISMISS FLAG', 'RESCAN', 'BACKUP', 'CLEANUP', 'AUTOMATED CHECK', 'AUTOMATED BACKUP')
- `actionDetails` - Detailed description (max 1023 chars)
- `ipAddress` - Admin's IP address (IPv4/IPv6 support)
- `userAgent` - Browser/client information

**Indexes:** `idx_admin_time`, `idx_table_operation`, `idx_timestamp`

---

### `SecurityEvents`

Security incident logging including failed logins, brute force attempts, and injection attacks.
Real-time security monitoring with severity-based alerting and investigation tracking.

**Columns:**

- `eventID` (PK) - Auto-increment primary key
- `eventType` - ENUM('failed_login', 'brute_force_attempt', 'unauthorized_access', 'sql_injection_attempt', 'xss_attempt', 'suspicious_activity')
- `userID` (FK) - User involved (NULL if anonymous)
- `username` - Username attempted (may not exist)
- `ipAddress` - Source IP address
- `userAgent` - Browser/client information
- `requestPath` - Requested URL path
- `requestMethod` - HTTP method (GET, POST, etc.)
- `description` - Event details (TEXT)
- `eventDate` - Incident timestamp
- `severity` - ENUM('low', 'medium', 'high', 'critical')
- `isReviewed` - Whether admin has reviewed
- `reviewedBy` (FK) - Admin who reviewed
- `reviewedDate` - Review timestamp
- `reviewNotes` - Investigation notes (TEXT)

**Indexes:** `idx_event_type`, `idx_severity`, `idx_event_date`, `idx_ip_address`, `idx_is_reviewed`

---

## Stored Procedures

### User & Settings Procedures

#### `soft_delete_user_account(p_userID, p_password)`

Performs soft deletion of user account by setting isDeleted flag instead of removing data.
Preserves referential integrity while marking account as inactive for GDPR compliance.

#### `check_password_strength(p_password) RETURNS VARCHAR(100)`

Validates password meets security requirements (8+ chars, uppercase, lowercase, number).
Returns 'OK' if valid or specific error message describing requirement failure.

---

### Reporting Procedures

#### `sp_get_top_watched_movies(p_limit, p_days)`

Generates report of most-watched movies with rating statistics and watchlist counts.
Supports all-time or time-limited queries with configurable result limit.

#### `sp_get_highest_rated_movies(p_limit, p_minRatings)`

Returns highest-rated movies filtered by minimum rating count threshold.
Prevents outliers from small sample sizes by requiring minimum rating threshold.

#### `sp_get_most_active_users(p_limit, p_days)`

Calculates user activity scores based on posts, comments, reviews, and watchlist.
Weighted scoring system prioritizes quality contributions (reviews worth 2x posts).

#### `sp_get_popular_forums(p_limit, p_days)`

Identifies movies with highest discussion activity based on posts and comments.
Discussion score formula: (posts × 3) + (comments × 1) for engagement measurement.

---

### Moderation Procedures

#### `sp_delete_flagged_content(p_flagID, p_adminID, p_deleteReason, p_notifyUser, p_ipAddress, p_userAgent)`

Handles flagged content deletion with audit logging, notification, and violation recording.
Transactional operation ensuring data consistency across multiple table updates.

#### `sp_dismiss_flag(p_flagID, p_adminID, p_dismissReason, p_ipAddress, p_userAgent)`

Marks flag as false positive without deleting content with detailed audit trail.
Updates flag status to 'dismissed' and logs admin decision for accountability.

#### `sp_rescan_content_for_word(p_restrictedWord)`

Rescans all existing content for newly added restricted word and creates flags.
Batch processing of Post, Comment, Review, and Message tables for compliance.

---

### Security Procedures

#### `sp_log_failed_login(p_username, p_ipAddress, p_userAgent, p_reason)`

Records failed login attempts with automatic brute force pattern detection.
Triggers critical alert if 5+ failures from same IP within 5-minute window.

#### `sp_check_brute_force(p_ipAddress, p_userAgent)`

Analyzes recent login failures to detect coordinated brute force attacks.
Creates critical-severity security event when threshold exceeded for immediate admin attention.

#### `sp_log_unauthorized_access(p_userID, p_username, p_ipAddress, p_userAgent, p_requestPath, p_requestMethod, p_attemptedAction)`

Logs attempts to access admin-only resources by unauthorized users.
Severity automatically escalated for sensitive endpoints (admin, delete, moderation paths).

#### `sp_log_suspicious_activity(p_userID, p_username, p_ipAddress, p_userAgent, p_requestPath, p_requestMethod, p_description, p_severity)`

Generic security event logger for unusual patterns detected by application logic.
Flexible severity parameter allows application to set priority based on context.

---

### Notification Procedures

#### `sp_check_high_activity()`

Automated monitoring for unusual spikes in content flagging or violations.
Called hourly by event scheduler; creates medium-priority alert if thresholds exceeded.

#### `sp_create_system_alert(p_title, p_message, p_priority, p_relatedTable)`

Generic admin notification creator for system-level alerts and status messages.
Used for backup confirmations, cleanup reports, and threshold warnings.

---

## Functions

### User & Permission Functions

#### `fn_is_admin(p_userID) RETURNS BOOLEAN`

Quick role check returning TRUE if user has admin role, FALSE otherwise.
Used in authorization queries and access control logic throughout application.

#### `fn_user_activity_score(p_userID) RETURNS INT`

Calculates weighted activity score: (posts × 1) + (comments × 1) + (reviews × 2) + (watchlist × 0.5).
Used for leaderboards, user ranking, and active user identification.

#### `fn_user_violation_count(p_userID) RETURNS INT`

Returns total number of policy violations for specified user.
Used in repeat offender detection and admin dashboards for user management.

---

### Content Filtering Functions

#### `fn_contains_restricted_word(p_text) RETURNS VARCHAR(255)`

Scans text for restricted words using case-insensitive LIKE matching.
Returns first matched word or NULL if clean; used in triggers for auto-flagging.

---

### Scoring Functions

#### `fn_movie_discussion_score(p_movieID) RETURNS INT`

Calculates engagement score: (posts × 3) + (comments × 1) + (unique posters × 5).
Higher weight for original posts and participant diversity encourages quality discussion.

---

## Triggers

### Audit Triggers (Admin Actions)

#### `trg_movie_insert_audit`, `trg_movie_update_audit`, `trg_movie_delete_audit`

Log all movie CRUD operations to AuditLog with detailed change descriptions and IP tracking.
Captures title changes, year updates, director modifications, and poster replacements.

#### `trg_genre_insert_audit`, `trg_genre_delete_audit`

Track genre additions and deletions for system data integrity monitoring.
Ensures accountability for master data changes affecting entire movie catalog.

#### `trg_post_delete_audit`, `trg_comment_delete_audit`, `trg_review_delete_audit`

Log content moderation actions when posts, comments, or reviews are deleted by admins.
Distinguishes admin deletions from user deletions using session variable checks.

#### `trg_user_suspend_audit`, `trg_user_unsuspend_audit`

Record user suspension and reactivation events with reason and admin identification.
Critical for user management accountability and appeals process documentation.

#### `trg_restricted_word_audit`

Track additions to restricted word dictionary for content policy audit trail.
Logs word additions with admin ID for policy change history.

---

### Content Moderation Triggers

#### `trg_post_auto_flag`, `trg_comment_auto_flag`, `trg_review_auto_flag`

Automatically scan content on INSERT using fn_contains_restricted_word() function.
Creates FlaggedContent entry with matched word and hides content if severity warrants.

#### `trg_flag_resolution_audit`

Log flag review outcomes (dismissed or content deleted) to AuditLog with admin notes.
Tracks moderation decisions for quality assurance and policy consistency review.

---

### Engagement Counter Triggers

#### `trg_like_increment`, `trg_like_decrement`

Update Post.likeCount when likes added or removed for real-time engagement display.
Maintains denormalized counter for performance optimization on high-traffic pages.

#### `trg_comment_increment`, `trg_comment_decrement`

Update Post.commentCount when comments added or deleted for activity indicators.
Keeps comment counts synchronized without expensive COUNT queries.

---

### User Notification Triggers

#### `trg_friend_request_notification`

Create notification when friend request received with sender's name and action link.
Immediate notification delivery for time-sensitive social interactions.

#### `trg_friend_accept_notification`

Notify requester when their friend request is accepted for positive feedback loop.
Bidirectional notification system enhances user engagement and retention.

#### `trg_post_notification`

Alert friends when user creates new post on movie page they might be interested in.
Activity feed population trigger for social discovery features.

#### `trg_like_notification`, `trg_comment_notification`

Notify post author when their content receives likes or comments for engagement tracking.
Real-time feedback loop encourages continued user participation.

---

### Settings & Validation Triggers

#### `before_user_update_email`

Enforce email uniqueness across active (non-deleted) users on profile updates.
Prevents duplicate emails while allowing deleted accounts' emails to be reused.

#### `before_user_update_username`

Validate username uniqueness during account settings changes with collision detection.
Case-insensitive uniqueness check prevents confusingly similar usernames.

---

### Security Triggers

#### `trg_security_event_notification`

Create AdminNotification automatically when SecurityEvent logged with medium+ severity.
Maps event types to appropriate notification titles and escalates critical events.

---

## Scheduled Events

### `evt_daily_backup`

Executes full database backup every day at 2:00 AM with timestamped filename.
Creates low-priority admin notification on completion and logs to AuditLog.

**Schedule:** Daily at 2:00 AM  
**Action:** Call sp_backup_database() and notify admins

---

### `evt_cleanup_old_notifications`

Removes read AdminNotifications older than 30 days to prevent table bloat.
Preserves unread notifications indefinitely and logs cleanup statistics.

**Schedule:** Weekly on Sunday at 3:00 AM  
**Action:** Delete old read notifications, log count if >100 deleted

---

### `evt_check_repeat_offenders`

Identifies users with 3+ violations who aren't suspended and alerts admins.
Creates high-priority notification for each repeat offender requiring review.

**Schedule:** Daily at 10:00 AM  
**Action:** Query UserViolations, create notifications for users with ≥3 violations

---

### `evt_update_movie_stats`

Recalculates avgRating and viewCount for all movies from ReviewRatings and Watchlist.
Keeps denormalized statistics synchronized for fast movie browsing queries.

**Schedule:** Every hour  
**Action:** Batch UPDATE Movie table with aggregated statistics

---

### `evt_cleanup_expired_sessions`

Removes expired session data from session store to maintain performance.
Deletes sessions inactive for 7+ days to reduce storage overhead.

**Schedule:** Daily at 4:00 AM  
**Action:** Delete expired sessions from session table

---

### `evt_generate_daily_report`

Auto-generates daily activity report with user growth, content stats, and flags.
Creates report in AdminReports table and notifies admins of completion.

**Schedule:** Daily at 11:59 PM  
**Action:** Call multiple report procedures, store JSON results

---

### `evt_check_high_activity`

Monitors for unusual spikes in content flagging or policy violations.
Triggers medium-priority alert if flags or violations exceed normal thresholds.

**Schedule:** Every hour  
**Action:** Call sp_check_high_activity() procedure

---

## Views

### `ActiveUsers`

Filtered view of User table excluding soft-deleted accounts (isDeleted = FALSE).
Simplifies queries requiring only active users without repeated WHERE clauses.

**Columns:** userID, username, name, email, profilePicture, registrationDate, role  
**Filter:** isDeleted = FALSE

---

## Relationships & Foreign Keys

### User Relationships

- **User → UserGenres** (1:N) - User's favorite genres
- **User → ReviewRatings** (1:N) - User's movie reviews
- **User → Post** (1:N) - User's discussion posts
- **User → Comments** (1:N) - User's comments
- **User → Likes** (1:N) - User's post likes
- **User → WatchList** (1:N) - User's watchlist entries
- **User → Friends** (1:N) - User's friendships (both user1 and user2)
- **User → FriendRequest** (1:N) - Friend requests sent/received
- **User → Message** (1:N) - Messages sent/received
- **User → Notifications** (1:N) - User's notifications
- **User → WatchEvent** (1:N) - Events hosted by user
- **User → EventParticipants** (1:N) - Events user joined
- **User → UserViolations** (1:N) - User's policy violations
- **User → AuditLog** (1:N) - Admin actions performed

---

### Movie Relationships

- **Movie → MovieGenres** (1:N) - Movie's genre classifications
- **Movie → MovieCast** (1:N) - Movie's cast members
- **Movie → ReviewRatings** (1:N) - Reviews for movie
- **Movie → Post** (1:N) - Discussion posts about movie
- **Movie → WatchList** (1:N) - Watchlist entries for movie
- **Movie → WatchEvent** (1:N) - Watch parties for movie

---

### Social Relationships

- **Post → Comments** (1:N) - Comments on post
- **Post → Likes** (1:N) - Likes on post
- **WatchEvent → EventParticipants** (1:N) - Event participants
- **FriendRequest → User** (N:1) - Sender and receiver

---

### Admin Relationships

- **FlaggedContent → User** (N:1) - Admin reviewer
- **UserViolations → User** (N:1) - Violating user and reviewing admin
- **UserViolations → FlaggedContent** (N:1) - Related flag
- **AdminNotifications → User** (N:1) - Admin who read notification
- **AdminReports → User** (N:1) - Admin who generated report
- **AuditLog → User** (N:1) - Admin who performed action
- **SecurityEvents → User** (N:1) - User involved and reviewing admin

---

## Cascade Behavior

**ON DELETE CASCADE:**

- Deleting User removes all their content, relationships, and activity
- Deleting Movie removes all reviews, posts, watchlist entries, and events
- Deleting Post removes all comments and likes
- Deleting WatchEvent removes all participants

**ON DELETE SET NULL:**

- Deleting admin doesn't remove their audit log entries (adminID becomes NULL)
- Deleting reviewer doesn't remove flags (reviewedBy becomes NULL)

---

## Performance Optimization

**Indexed Columns:**

- User: email, username, isDeleted
- Movie: title, releaseYear, avgRating
- Post: userID, createdAt
- WatchList: userID + status composite
- Notifications: receivedFROMuserID + isSeen composite
- Message: receiverID + isRead composite
- FriendRequest: receiverID + status composite
- FlaggedContent: status, flaggedDate, isHidden
- AuditLog: adminID + timestamp, targetTable + operation, timestamp
- SecurityEvents: eventType, severity, eventDate, ipAddress

**Denormalized Counters:**

- Movie.avgRating (calculated from ReviewRatings)
- Movie.totalViews (aggregated from WatchList)
- Post.likeCount (updated by triggers)
- Post.commentCount (updated by triggers)

---

## Security Features

1. **Password Hashing:** Bcrypt with salt (handled in application layer)
2. **SQL Injection Prevention:** Parameterized queries throughout
3. **Audit Logging:** All admin actions logged with IP/user agent
4. **Soft Deletes:** User accounts marked deleted, not removed
5. **Session Management:** Secure session storage with expiration
6. **Rate Limiting:** Brute force detection via sp_check_brute_force()
7. **Content Moderation:** Auto-flagging with restricted word scanning
8. **Role-Based Access:** Admin role enforcement on sensitive operations

---

## Summary Statistics

- **Total Tables:** 22
- **Junction Tables:** 6 (UserGenres, MovieGenres, Friends, Likes, EventParticipants, MovieCast)
- **Stored Procedures:** 15+
- **Functions:** 6
- **Triggers:** 20+
- **Scheduled Events:** 7
- **Views:** 1
- **Foreign Keys:** 40+
- **Indexes:** 35+
- **ENUM Types:** 15 (for status fields, severity levels, role types)

---

**Last Updated:** December 10, 2025  
**Database Version:** 1.0 (Production Ready)  
**MySQL Version Required:** 8.0+
