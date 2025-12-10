# Database Schema Documentation

## 3movieCollectors MySQL Database Structure

**Last Updated:** December 9, 2025  
**Database Name:** `3movieCollectors`  
**Character Set:** `utf8mb4`  
**Collation:** `utf8mb4_unicode_ci`  
**Total Tables:** 24 (19 Core + 5 Admin)

---

## Table of Contents

1. [Core Schema Tables](#core-schema-tables)
2. [Admin Schema Tables](#admin-schema-tables)
3. [Relationships & Foreign Keys](#relationships--foreign-keys)
4. [Indexes & Performance](#indexes--performance)
5. [Stored Procedures & Functions](#stored-procedures--functions)
6. [Triggers](#triggers)
7. [Events & Scheduled Tasks](#events--scheduled-tasks)

---

## Core Schema Tables

_Defined in: `database/schema.sql`_

### 1. User

**Purpose:** Central user authentication and profile management  
**File Location:** `database/schema.sql` (Lines 12-22)

```sql
CREATE TABLE User(
    userID INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL DEFAULT "",
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    registrationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role ENUM('user', 'admin') DEFAULT 'user',
    INDEX idx_email (email),
    INDEX idx_username (username)
);
```

**Key Fields:**

- `userID`: Auto-incrementing primary key
- `username`: Unique identifier for login (indexed for fast lookup)
- `email`: Unique email (indexed for authentication)
- `password`: Bcrypt hashed password (10 salt rounds)
- `role`: User type - 'user' (default) or 'admin'

**MySQL Features Used:**

- `AUTO_INCREMENT` for primary key
- `UNIQUE` constraint on username and email
- `ENUM` for role restriction
- `DEFAULT CURRENT_TIMESTAMP` for automatic registration date
- Composite indexes for fast authentication queries

**Admin Extensions (admin_schema.sql):**

- `isSuspended` (BOOLEAN): Suspension flag
- `suspendedDate` (DATETIME): When user was suspended
- `suspensionReason` (VARCHAR 1023): Admin-provided reason
- `suspendedBy` (INT FK): Admin who performed suspension
- `isDeleted` (BOOLEAN): Soft delete flag

---

### 2. Genres

**Purpose:** Movie genre taxonomy  
**File Location:** `database/schema.sql` (Lines 27-32)

```sql
CREATE TABLE Genres (
    genreID INT AUTO_INCREMENT PRIMARY KEY,
    genreName VARCHAR(100) NOT NULL UNIQUE,
    INDEX idx_genreName (genreName)
);
```

**Key Fields:**

- `genreID`: Primary key
- `genreName`: Unique genre name (e.g., 'Action', 'Drama', 'Sci-Fi')

**MySQL Features:**

- `UNIQUE` constraint prevents duplicate genres
- Index on genreName for fast filtering

**Populated With:** 20 genres including Action, Adventure, Comedy, Crime, Documentary, Drama, Fantasy, History, Horror, Music, Mystery, Romance, Sci-Fi, Thriller, War, Western, Animation, Family, Biography, TV Movie

---

### 3. UserGenres

**Purpose:** Many-to-many relationship for user favorite genres  
**File Location:** `database/schema.sql` (Lines 36-43)

```sql
CREATE TABLE UserGenres (
    userID INT NOT NULL,
    genreID INT NOT NULL,
    PRIMARY KEY (userID, genreID),
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (genreID) REFERENCES Genres(genreID) ON DELETE CASCADE ON UPDATE CASCADE
);
```

**MySQL Features:**

- Composite primary key (userID, genreID) ensures no duplicates
- `ON DELETE CASCADE`: Removes entries when user or genre is deleted
- `ON UPDATE CASCADE`: Updates references if IDs change
- Junction table pattern for many-to-many relationships

---

### 4. Movie

**Purpose:** Core movie catalog  
**File Location:** `database/schema.sql` (Lines 47-61)

```sql
CREATE TABLE Movie(
    movieID INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(1023) NOT NULL,
    synopsis TEXT,
    director VARCHAR(255) DEFAULT "",
    releaseYear INT NOT NULL,
    posterImg VARCHAR(255) DEFAULT 'default.png',
    totalViews INT DEFAULT 0,
    viewCount INT DEFAULT 0,
    avgRating DECIMAL(3, 1) DEFAULT 0.0,
    INDEX idx_title (title(255)),
    INDEX idx_releaseYear (releaseYear),
    INDEX idx_avgRating (avgRating)
);
```

**Key Fields:**

- `movieID`: Auto-increment primary key
- `title`: Movie title (up to 1023 chars for long titles)
- `synopsis`: Full description stored as TEXT
- `director`: Director name
- `releaseYear`: Year of release (INT for math operations)
- `posterImg`: Filename in `/pictures/movie_posters/`
- `totalViews` & `viewCount`: Tracking metrics (updated via triggers)
- `avgRating`: Calculated average from ReviewRatings (DECIMAL 3,1 = X.X format)

**MySQL Features:**

- `TEXT` type for large synopsis content
- `DECIMAL(3,1)` for precise rating calculations (e.g., 8.5)
- Partial index on title (first 255 chars) for performance
- Indexes on releaseYear and avgRating for sorting/filtering

**Admin Features:**

- Bulk import via TMDB API (`scrape_tmdb.py` + `server/utils/tmdb-importer.js`)
- Duplicate prevention: UNIQUE constraint on (title, releaseYear) combination
- Poster validation and default handling

---

### 5. MovieCast

**Purpose:** Store cast members for each movie  
**File Location:** `database/schema.sql` (Lines 65-70)

```sql
CREATE TABLE MovieCast (
    movieID INT NOT NULL,
    castMember VARCHAR(255) NOT NULL,
    FOREIGN KEY (movieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE
);
```

**MySQL Features:**

- No primary key (allows duplicate actor names across movies)
- `ON DELETE CASCADE`: Removes cast when movie is deleted
- Simple one-to-many relationship

---

### 6. MovieGenres

**Purpose:** Many-to-many relationship between movies and genres  
**File Location:** `database/schema.sql` (Lines 74-81)

```sql
CREATE TABLE MovieGenres (
    movieID INT NOT NULL,
    genreID INT NOT NULL,
    PRIMARY KEY (movieID, genreID),
    FOREIGN KEY (movieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (genreID) REFERENCES Genres(genreID) ON DELETE CASCADE ON UPDATE CASCADE
);
```

**MySQL Features:**

- Composite primary key prevents duplicate genre assignments
- CASCADE deletes maintain referential integrity
- Junction table for many-to-many

**Business Rule:** Movies must have at least one genre (validated in application layer)

---

### 7. WatchList

**Purpose:** User's movie watchlist with status tracking  
**File Location:** `database/schema.sql` (Lines 85-97)

```sql
CREATE TABLE WatchList(
    movieID INT NOT NULL,
    userID INT NOT NULL,
    status ENUM('to-watch', 'watching', 'completed', 'not seen') DEFAULT 'to-watch',
    lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    addedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (movieID, userID),
    FOREIGN KEY (movieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_userID_status (userID, status)
);
```

**Key Fields:**

- Composite PK: One entry per user-movie combination
- `status`: ENUM with 4 states for tracking watch progress
- `lastUpdated`: Auto-updates on any change (`ON UPDATE CURRENT_TIMESTAMP`)
- `addedDate`: Original addition date

**MySQL Features:**

- `ON UPDATE CURRENT_TIMESTAMP`: Automatic timestamp updates
- Composite index (userID, status) for fast user-specific queries
- ENUM for status validation at database level

---

### 8. FriendRequest

**Purpose:** Friend request workflow  
**File Location:** `database/schema.sql` (Lines 100-112)

```sql
CREATE TABLE FriendRequest(
    reqID INT AUTO_INCREMENT PRIMARY KEY,
    senderID INT NOT NULL,
    receiverID INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    reqDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responseDate DATETIME DEFAULT NULL,
    FOREIGN KEY (senderID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (receiverID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_receiverID_status (receiverID, status)
);
```

**MySQL Features:**

- ENUM for status workflow (pending → accepted/rejected)
- NULL for responseDate until request is processed
- Index on (receiverID, status) for fast pending request queries

**Workflow:**

1. User A sends request: `INSERT` with status='pending'
2. User B views: `SELECT WHERE receiverID=B AND status='pending'`
3. Accept/Reject: `UPDATE status, SET responseDate=NOW()`
4. Accepted → Insert into Friends table

---

### 9. Friends

**Purpose:** Bidirectional friendship relationships  
**File Location:** `database/schema.sql` (Lines 115-124)

```sql
CREATE TABLE Friends(
    user1 INT NOT NULL,
    user2 INT NOT NULL,
    friendshipDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user1, user2),
    FOREIGN KEY (user1) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user2) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE
);
```

**MySQL Features:**

- Composite PK ensures unique friendships
- Bidirectional: (user1=A, user2=B) OR (user1=B, user2=A)
- CASCADE deletes maintain consistency

**Query Pattern:**

```sql
-- Get all friends of userID=1
SELECT * FROM Friends
WHERE user1=1 OR user2=1;
```

---

### 10. ReviewRatings

**Purpose:** Movie reviews and ratings  
**File Location:** `database/schema.sql` (Lines 127-139)

```sql
CREATE TABLE ReviewRatings(
    movieID INT NOT NULL,
    userID INT NOT NULL,
    rating DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
    review TEXT,
    reviewDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (movieID, userID),
    FOREIGN KEY (movieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE
);
```

**Key Fields:**

- Composite PK: One review per user per movie
- `rating`: DECIMAL(2,1) allows 0.0 to 10.0 (e.g., 8.5)
- `review`: TEXT for long-form reviews (optional)

**MySQL Features:**

- DECIMAL for precise rating calculations
- `ON UPDATE CURRENT_TIMESTAMP` tracks edit history
- Triggers update Movie.avgRating when reviews change

---

### 11. Post

**Purpose:** User posts/discussions about movies  
**File Location:** `database/schema.sql` (Lines 142-156)

```sql
CREATE TABLE Post(
    postID INT AUTO_INCREMENT PRIMARY KEY,
    movieID INT NOT NULL,
    userID INT NOT NULL,
    postContent TEXT,
    likeCount INT DEFAULT 0,
    commentCount INT DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_userID (userID),
    INDEX idx_createdAt (createdAt)
);
```

**Key Fields:**

- `likeCount` & `commentCount`: Denormalized counters (updated via triggers)
- `createdAt`: Timestamp for chronological sorting

**MySQL Features:**

- Indexes on userID and createdAt for feed queries
- Counters maintained by triggers on Likes/Comments tables

---

### 12. Comments

**Purpose:** Comments on posts  
**File Location:** `database/schema.sql` (Lines 159-170)

```sql
CREATE TABLE Comments(
    commentID INT AUTO_INCREMENT PRIMARY KEY,
    postID INT NOT NULL,
    userID INT NOT NULL,
    commentContent TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (postID) REFERENCES Post(postID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_postID (postID)
);
```

**MySQL Features:**

- CASCADE delete: Comments removed when post is deleted
- Index on postID for fast comment retrieval

**Trigger:** Increments Post.commentCount on INSERT

---

### 13. Likes

**Purpose:** Track post likes  
**File Location:** `database/schema.sql` (Lines 173-182)

```sql
CREATE TABLE Likes(
    postID INT NOT NULL,
    userID INT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (postID, userID),
    FOREIGN KEY (postID) REFERENCES Post(postID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE
);
```

**MySQL Features:**

- Composite PK prevents duplicate likes
- Simple many-to-many relationship

**Trigger:** Increments Post.likeCount on INSERT, decrements on DELETE

---

### 14. Notifications

**Purpose:** User notifications for various events  
**File Location:** `database/schema.sql` (Lines 185-196)

```sql
CREATE TABLE Notifications(
    notificationID INT AUTO_INCREMENT PRIMARY KEY,
    receivedFROMuserID INT NOT NULL,
    content VARCHAR(255) NOT NULL,
    triggerEvent ENUM('friend_request', 'friend_accept', 'new_post', 'post_like', 'post_comment') NOT NULL,
    isSeen BOOLEAN DEFAULT FALSE,
    timeStamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receivedFROMuserID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_receivedFROMuserID_isSeen (receivedFROMuserID, isSeen)
);
```

**MySQL Features:**

- ENUM defines allowed notification types
- BOOLEAN for read/unread status
- Composite index (receivedFROMuserID, isSeen) for unread counts

**Usage:**

```sql
-- Get unread notifications
SELECT * FROM Notifications
WHERE receivedFROMuserID=? AND isSeen=FALSE
ORDER BY timeStamp DESC;
```

---

### 15. WatchEvent

**Purpose:** Watch party events  
**File Location:** `database/schema.sql` (Lines 199-214)

```sql
CREATE TABLE WatchEvent(
    eventID INT AUTO_INCREMENT PRIMARY KEY,
    eventTitle VARCHAR(255) NOT NULL,
    associatedMovieID INT NOT NULL,
    host INT NOT NULL,
    description TEXT,
    eventDateTime DATETIME NOT NULL,
    capacity INT NOT NULL DEFAULT 0,
    currentCapacity INT DEFAULT 0,
    FOREIGN KEY (associatedMovieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (host) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_host (host),
    INDEX idx_eventDateTime (eventDateTime)
);
```

**Key Fields:**

- `capacity`: Maximum participants
- `currentCapacity`: Current count (updated via triggers)
- `eventDateTime`: Scheduled time

**MySQL Features:**

- Index on eventDateTime for upcoming events queries
- Capacity management with triggers

---

### 16. EventParticipants

**Purpose:** Many-to-many for event RSVPs  
**File Location:** `database/schema.sql` (Lines 217-225)

```sql
CREATE TABLE EventParticipants(
    eventID INT NOT NULL,
    userID INT NOT NULL,
    PRIMARY KEY (eventID, userID),
    FOREIGN KEY (eventID) REFERENCES WatchEvent(eventID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE
);
```

**Trigger:** Updates WatchEvent.currentCapacity on INSERT/DELETE

---

### 17. Message

**Purpose:** Private messages between friends  
**File Location:** `database/schema.sql` (Lines 228-241)

```sql
CREATE TABLE Message(
    messageID INT AUTO_INCREMENT PRIMARY KEY,
    friendID INT NOT NULL,
    senderID INT NOT NULL,
    receiverID INT NOT NULL,
    content TEXT,
    timeStamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    isRead BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (senderID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (receiverID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_receiverID_isRead (receiverID, isRead)
);
```

**MySQL Features:**

- Index on (receiverID, isRead) for unread message counts
- BOOLEAN for read/unread tracking

**Admin Feature:** Messages can be scanned for RestrictedWords and flagged for moderation

---

### 18. RestrictedWords

**Purpose:** Content moderation word blacklist  
**File Location:** `database/schema.sql` (Lines 244-249)

```sql
CREATE TABLE RestrictedWords(
    wordID INT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(255) NOT NULL UNIQUE,
    addedDate DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Admin Usage:**

- Admins add words via admin panel
- Scanned against Messages, Posts, Comments, Reviews
- Auto-flags content containing restricted words

---

### 19. AuditLog

**Purpose:** Track all admin actions  
**File Location:** `database/schema.sql` (Lines 253-263)

```sql
CREATE TABLE AuditLog(
    logID INT AUTO_INCREMENT PRIMARY KEY,
    adminID INT NOT NULL,
    targetRecordID INT NOT NULL,
    targetTable VARCHAR(100) NOT NULL,
    timeStamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    operationPerformed ENUM('INSERT', 'UPDATE', 'DELETE CONTENT', 'MODERATION', 'MANAGEMENT', 'REPORT CREATION', 'VIEW RESTRICTED CONTENT') NOT NULL,
    FOREIGN KEY (adminID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE
);
```

**Admin Extensions (admin_schema.sql):**

- `actionDetails` (VARCHAR 1023): Description of action
- `ipAddress` (VARCHAR 45): IPv4/IPv6 address
- Expanded ENUM with more operation types

**MySQL Features:**

- ENUM restricts operation types
- Every admin action logged automatically

---

## Admin Schema Tables

_Defined in: `database/admin_schema.sql`_

### 20. FlaggedContent

**Purpose:** Content moderation queue  
**File Location:** `database/admin_schema.sql` (Lines 16-51)

```sql
CREATE TABLE IF NOT EXISTS FlaggedContent(
    flagID INT AUTO_INCREMENT PRIMARY KEY,
    contentType ENUM('Post', 'Comment', 'Review', 'Message') NOT NULL,
    contentID VARCHAR(50) NOT NULL,
    flaggedBy INT, -- NULL for system flags
    FOREIGN KEY (flaggedBy) REFERENCES User(userID) ON DELETE SET NULL,
    flagReason VARCHAR(1023) NOT NULL DEFAULT "",
    flaggedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'reviewing', 'resolved', 'dismissed') DEFAULT 'pending',
    isHidden BOOLEAN DEFAULT FALSE,
    reviewedBy INT,
    FOREIGN KEY (reviewedBy) REFERENCES User(userID) ON DELETE SET NULL,
    reviewedDate DATETIME,
    adminNotes VARCHAR(2047),
    matchedWord VARCHAR(255), -- Restricted word that triggered flag
    INDEX idx_status (status),
    INDEX idx_content (contentType, contentID),
    INDEX idx_flagged_date (flaggedDate),
    INDEX idx_is_hidden (isHidden),
    INDEX idx_flagged_by (flaggedBy)
);
```

**Key Fields:**

- `contentType`: ENUM defines what type of content is flagged
- `contentID`: Flexible VARCHAR (e.g., "postID", "movieID-userID")
- `flaggedBy`: NULL for auto-flagged (system), INT for user reports
- `status`: Workflow states (pending → reviewing → resolved/dismissed)
- `isHidden`: Boolean to hide content from public view
- `matchedWord`: Stores restricted word that triggered auto-flag

**MySQL Features:**

- `ON DELETE SET NULL`: Preserves flags even if user is deleted
- Multiple indexes for admin dashboard queries
- ENUM-based workflow management

**Triggers:**

- Auto-flagging on INSERT/UPDATE in Post, Comment, Review, Message tables
- Checks content against RestrictedWords table

---

### 21. AdminReports

**Purpose:** Store generated reports with metadata  
**File Location:** `database/admin_schema.sql` (Lines 55-95)

```sql
CREATE TABLE IF NOT EXISTS AdminReports(
    reportID INT AUTO_INCREMENT PRIMARY KEY,
    reportType ENUM('top_watched_movies', 'highest_rated_movies',
                    'most_active_users', 'popular_forums', 'user_growth',
                    'content_statistics', 'moderation_summary', 'system_health') NOT NULL,
    generatedBy INT NOT NULL,
    FOREIGN KEY (generatedBy) REFERENCES User(userID) ON DELETE CASCADE,
    generatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    reportData JSON,
    reportPeriod VARCHAR(50),
    reportParams JSON,
    pdfGenerated BOOLEAN DEFAULT FALSE,
    pdfPath VARCHAR(511),
    pdfGeneratedDate DATETIME,
    INDEX idx_report_type (reportType),
    INDEX idx_generated_date (generatedDate),
    INDEX idx_generated_by (generatedBy)
);
```

**Key Fields:**

- `reportType`: ENUM with 8 predefined report types
- `reportData`: JSON column stores full report results
- `reportParams`: JSON stores filters/limits used
- `pdfPath`: File system path to generated PDF

**MySQL Features:**

- **JSON data type**: Native JSON storage and querying
- JSON allows flexible report structures
- Example JSON storage:

```json
{
  "movies": [
    { "title": "Inception", "views": 15000 },
    { "title": "Interstellar", "views": 12000 }
  ],
  "totalMovies": 150,
  "dateRange": "2025-01-01 to 2025-12-31"
}
```

**Usage:**

```sql
-- Query JSON data
SELECT reportData->>'$.totalMovies' AS total
FROM AdminReports
WHERE reportType='top_watched_movies';
```

---

### 22. UserViolations

**Purpose:** Track user violations for repeat offender detection  
**File Location:** `database/admin_schema.sql` (Lines 98-128)

```sql
CREATE TABLE IF NOT EXISTS UserViolations(
    violationID INT AUTO_INCREMENT PRIMARY KEY,
    userID INT NOT NULL,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE,
    violationType ENUM('restricted_word', 'spam', 'harassment',
                       'inappropriate_content', 'other') NOT NULL,
    violationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    relatedFlagID INT,
    FOREIGN KEY (relatedFlagID) REFERENCES FlaggedContent(flagID) ON DELETE SET NULL,
    actionTaken ENUM('warning', 'content_deleted', 'suspended', 'none') DEFAULT 'none',
    actionBy INT,
    FOREIGN KEY (actionBy) REFERENCES User(userID) ON DELETE SET NULL,
    actionDate DATETIME,
    actionNotes VARCHAR(1023),
    INDEX idx_user_id (userID),
    INDEX idx_violation_date (violationDate),
    INDEX idx_violation_type (violationType)
);
```

**MySQL Features:**

- Links to FlaggedContent via relatedFlagID
- Tracks admin actions per violation
- Enables queries like "users with 3+ violations in 30 days"

**Query Example:**

```sql
-- Find repeat offenders (3+ violations in last 30 days)
SELECT userID, COUNT(*) as violations
FROM UserViolations
WHERE violationDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY userID
HAVING COUNT(*) >= 3;
```

---

### 23. AdminNotifications

**Purpose:** Admin-specific notifications separate from user notifications  
**File Location:** `database/admin_schema.sql` (Lines 131-174)

```sql
CREATE TABLE IF NOT EXISTS AdminNotifications(
    notificationID INT AUTO_INCREMENT PRIMARY KEY,
    notificationType ENUM('new_flag', 'repeat_offender', 'system_alert',
                         'high_activity', 'security_event', 'backup_status') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1023) NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    relatedType VARCHAR(50),
    relatedID INT,
    createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    isSent BOOLEAN DEFAULT FALSE,
    sentDate DATETIME,
    isRead BOOLEAN DEFAULT FALSE,
    readBy INT,
    FOREIGN KEY (readBy) REFERENCES User(userID) ON DELETE SET NULL,
    readDate DATETIME,
    INDEX idx_is_sent (isSent),
    INDEX idx_is_read (isRead),
    INDEX idx_priority (priority),
    INDEX idx_notification_type (notificationType),
    INDEX idx_created_date (createdDate)
);
```

**MySQL Features:**

- Priority-based notifications (low → critical)
- Delivery tracking (isSent, sentDate)
- Read tracking per admin
- Flexible linking via relatedType/relatedID

---

### 24. SecurityEvents

**Purpose:** Security monitoring and logging  
**File Location:** `database/admin_schema.sql` (Lines 362-410)

```sql
CREATE TABLE IF NOT EXISTS SecurityEvents(
    eventID INT AUTO_INCREMENT PRIMARY KEY,
    eventType ENUM('failed_login', 'suspicious_activity', 'unauthorized_access',
                   'data_breach_attempt', 'unusual_pattern') NOT NULL,
    userID INT,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE SET NULL,
    ipAddress VARCHAR(45),
    userAgent VARCHAR(511),
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    eventDetails JSON,
    detectedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolvedBy INT,
    FOREIGN KEY (resolvedBy) REFERENCES User(userID) ON DELETE SET NULL,
    resolvedDate DATETIME,
    resolutionNotes VARCHAR(1023),
    INDEX idx_event_type (eventType),
    INDEX idx_detected_date (detectedDate),
    INDEX idx_severity (severity),
    INDEX idx_resolved (resolved)
);
```

**MySQL Features:**

- JSON for flexible event details
- IP address and user agent tracking
- Severity-based filtering
- Resolution workflow tracking

---

## Relationships & Foreign Keys

### User-Centric Relationships

1. **User → UserGenres** (1:N): User has favorite genres
2. **User → WatchList** (1:N): User's watchlist
3. **User → ReviewRatings** (1:N): User's reviews
4. **User → Post** (1:N): User's posts
5. **User → Comments** (1:N): User's comments
6. **User → Likes** (1:N): User's likes
7. **User → FriendRequest** (1:N as sender/receiver)
8. **User → Friends** (N:N): Bidirectional friendships
9. **User → Message** (1:N as sender/receiver)
10. **User → WatchEvent** (1:N as host)
11. **User → EventParticipants** (1:N): Event RSVPs

### Movie-Centric Relationships

1. **Movie → MovieGenres** (N:N via genres)
2. **Movie → MovieCast** (1:N): Cast members
3. **Movie → WatchList** (1:N): On user watchlists
4. **Movie → ReviewRatings** (1:N): Reviews/ratings
5. **Movie → Post** (1:N): Discussion posts
6. **Movie → WatchEvent** (1:N): Associated events

### Admin-Centric Relationships

1. **User (Admin) → AuditLog** (1:N): Admin actions
2. **User (Admin) → FlaggedContent** (1:N as reviewer)
3. **User (Admin) → AdminReports** (1:N): Generated reports
4. **User (Admin) → UserViolations** (1:N as actionBy)
5. **User → UserViolations** (1:N as violator)
6. **FlaggedContent → UserViolations** (1:N): Related violations

### Cascade Behaviors

**ON DELETE CASCADE:**

- User deleted → All their content, friendships, watchlists deleted
- Movie deleted → All reviews, posts, watchlist entries deleted
- Post deleted → All comments and likes deleted
- Event deleted → All participants removed

**ON DELETE SET NULL:**

- User deleted → Flags/violations preserved with NULL references
- Admin deleted → Audit logs preserved with NULL adminID

---

## Indexes & Performance

### Composite Indexes

1. **WatchList**: `(userID, status)` - Fast user-specific watchlist queries
2. **FriendRequest**: `(receiverID, status)` - Pending requests
3. **Notifications**: `(receivedFROMuserID, isSeen)` - Unread counts
4. **Message**: `(receiverID, isRead)` - Unread messages

### Single Column Indexes

1. **User**: `email`, `username` - Authentication
2. **Movie**: `title`, `releaseYear`, `avgRating` - Filtering/sorting
3. **Post**: `userID`, `createdAt` - Feed queries
4. **FlaggedContent**: `status`, `flaggedDate` - Admin dashboard

### Partial Indexes

- **Movie.title(255)**: Index first 255 chars of VARCHAR(1023)

### Index Strategy

- **Primary Keys**: Auto-indexed (all tables)
- **Foreign Keys**: Not auto-indexed in MySQL InnoDB (manually added where needed)
- **ENUM columns**: Not indexed (small cardinality)
- **Timestamp columns**: Indexed for chronological queries

---

## Stored Procedures & Functions

_Defined in: `database/admin_procedures.sql`_

### 1. sp_GetActiveUsersCount

**Purpose:** Count active users in time range  
**File Location:** `database/admin_procedures.sql`

```sql
CREATE PROCEDURE sp_GetActiveUsersCount(
    IN timeRange VARCHAR(20)
)
BEGIN
    -- Logic to count users based on recent activity
END;
```

**Usage:**

```sql
CALL sp_GetActiveUsersCount('7days');
```

### 2. sp_BulkAddMovieGenres

**Purpose:** Efficiently assign multiple genres to a movie  
**MySQL Feature:** Reduces round-trips with bulk INSERT

```sql
CREATE PROCEDURE sp_BulkAddMovieGenres(
    IN movieID INT,
    IN genreIDs VARCHAR(255) -- Comma-separated
)
BEGIN
    -- Parse CSV and INSERT multiple rows
END;
```

---

## Triggers

_Defined in: `database/admin_triggers.sql`_

### Content Moderation Triggers

1. **trg_ScanPostForRestrictedWords** - After INSERT/UPDATE on Post
2. **trg_ScanCommentForRestrictedWords** - After INSERT/UPDATE on Comments
3. **trg_ScanReviewForRestrictedWords** - After INSERT/UPDATE on ReviewRatings
4. **trg_ScanMessageForRestrictedWords** - After INSERT/UPDATE on Message

**Logic:**

```sql
CREATE TRIGGER trg_ScanPostForRestrictedWords
AFTER INSERT ON Post
FOR EACH ROW
BEGIN
    DECLARE restricted_found INT;
    SELECT COUNT(*) INTO restricted_found
    FROM RestrictedWords
    WHERE NEW.postContent LIKE CONCAT('%', word, '%');

    IF restricted_found > 0 THEN
        INSERT INTO FlaggedContent (contentType, contentID, flagReason, matchedWord)
        VALUES ('Post', NEW.postID, 'Restricted word detected',
                (SELECT word FROM RestrictedWords
                 WHERE NEW.postContent LIKE CONCAT('%', word, '%') LIMIT 1));
    END IF;
END;
```

### Counter Maintenance Triggers

1. **trg_UpdateLikeCount** - After INSERT/DELETE on Likes
2. **trg_UpdateCommentCount** - After INSERT/DELETE on Comments
3. **trg_UpdateEventCapacity** - After INSERT/DELETE on EventParticipants
4. **trg_UpdateMovieRating** - After INSERT/UPDATE/DELETE on ReviewRatings

**Example:**

```sql
CREATE TRIGGER trg_UpdateLikeCount
AFTER INSERT ON Likes
FOR EACH ROW
BEGIN
    UPDATE Post
    SET likeCount = likeCount + 1
    WHERE postID = NEW.postID;
END;
```

### User Suspension Trigger

**trg_CheckUserSuspension** - After UPDATE on User

- Logs suspension events to AuditLog
- Creates admin notification

---

## Events & Scheduled Tasks

_Defined in: `database/admin_events.sql`_

### 1. evt_CleanupOldNotifications

**Schedule:** Daily at 2:00 AM  
**Purpose:** Delete notifications older than 90 days

```sql
CREATE EVENT evt_CleanupOldNotifications
ON SCHEDULE EVERY 1 DAY
STARTS '2025-01-01 02:00:00'
DO
DELETE FROM Notifications
WHERE timeStamp < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### 2. evt_CleanupResolvedFlags

**Schedule:** Weekly (Sunday 3:00 AM)  
**Purpose:** Archive resolved flags older than 6 months

### 3. evt_UpdateMovieStats

**Schedule:** Hourly  
**Purpose:** Recalculate movie view counts and ratings

**MySQL Feature:** Event Scheduler must be enabled:

```sql
SET GLOBAL event_scheduler = ON;
```

---

## Database Configuration

### Character Set & Collation

```sql
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
```

- **utf8mb4**: Supports full Unicode (including emojis)
- **unicode_ci**: Case-insensitive comparisons

### Storage Engine

- **InnoDB** (default): ACID compliance, foreign keys, row-level locking

### Connection Pool

_Configured in: `server/db.js`_

```javascript
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "8956",
  database: "3movieCollectors",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

---

## Query Patterns & Best Practices

### 1. Pagination

```sql
SELECT * FROM Movie
ORDER BY releaseYear DESC
LIMIT 10 OFFSET 20; -- Page 3 (10 per page)
```

### 2. Full-Text Search

```sql
SELECT * FROM Movie
WHERE title LIKE CONCAT('%', ?, '%')
   OR synopsis LIKE CONCAT('%', ?, '%');
```

### 3. Aggregation with GROUP BY

```sql
SELECT genreID, COUNT(*) as movieCount
FROM MovieGenres
GROUP BY genreID
ORDER BY movieCount DESC;
```

### 4. Subqueries for Filtering

```sql
-- Movies rated above average
SELECT * FROM Movie
WHERE avgRating > (SELECT AVG(avgRating) FROM Movie);
```

### 5. JSON Queries

```sql
-- Extract from JSON column
SELECT
    reportID,
    reportData->>'$.totalMovies' AS total,
    JSON_EXTRACT(reportData, '$.movies[0].title') AS topMovie
FROM AdminReports;
```

---

## Security Features

### 1. Password Hashing

- **Bcrypt** with 10 salt rounds (application layer)
- Stored in User.password as VARCHAR(255)

### 2. SQL Injection Prevention

- Parameterized queries via mysql2 prepared statements
- Example:

```javascript
db.query("SELECT * FROM User WHERE email = ?", [userEmail]);
```

### 3. Role-Based Access Control

- User.role ENUM ('user', 'admin')
- Middleware checks: `server/middleware/adminAuth.js`

### 4. Audit Trail

- Every admin action logged to AuditLog
- IP address and timestamp recorded

### 5. Soft Deletes

- User.isDeleted flag instead of DELETE queries
- Preserves referential integrity

---

## Backup & Maintenance

### Backup Strategy

```bash
# Full backup
mysqldump -u root -p 3movieCollectors > backup_$(date +%Y%m%d).sql

# Schema only
mysqldump -u root -p --no-data 3movieCollectors > schema_backup.sql
```

### Restore

```bash
mysql -u root -p 3movieCollectors < backup_20251209.sql
```

### Optimization

```sql
-- Analyze tables for query optimization
ANALYZE TABLE Movie, User, Post;

-- Check table integrity
CHECK TABLE Movie;

-- Optimize fragmented tables
OPTIMIZE TABLE ReviewRatings;
```

---

## File Locations Summary

| Component       | File Path                       |
| --------------- | ------------------------------- |
| Core Schema     | `database/schema.sql`           |
| Admin Schema    | `database/admin_schema.sql`     |
| Triggers        | `database/admin_triggers.sql`   |
| Procedures      | `database/admin_procedures.sql` |
| Events          | `database/admin_events.sql`     |
| Sample Data     | `database/sample-data.sql`      |
| Connection Pool | `server/db.js`                  |
| Schema Docs     | `database/SCHEMA_REFERENCE.md`  |

---

**End of Database Schema Documentation**
