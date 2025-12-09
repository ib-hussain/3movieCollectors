# Admin Feature Implementation - Comprehensive Analysis & Plan

**Project:** 3movieCollectors  
**Feature:** Complete Admin Dashboard & Management System  
**Date:** December 9, 2025  
**Status:** 📋 Planning Phase

---

## 📊 EXECUTIVE SUMMARY

This document outlines the complete implementation plan for the admin feature - the largest and most complex feature of 3movieCollectors. The admin system will be **heavily MySQL-centric**, utilizing triggers, stored procedures, functions, events, and advanced SQL features to maintain data integrity, audit trails, and automated operations.

### Key Requirements:

- ✅ Separate admin login with role-based authentication
- ✅ Comprehensive admin dashboard with analytics
- ✅ Movie & genre catalog management (CRUD operations)
- ✅ Content moderation with restricted word detection
- ✅ Automated report generation (top movies, users, activity)
- ✅ Complete audit trail with MySQL triggers
- ✅ User role management with MySQL GRANT/REVOKE
- ✅ All admin operations logged automatically

---

## 🏗️ CURRENT SYSTEM STATE

### ✅ Already Implemented

**Database Schema:**

- ✅ `User` table with `role ENUM('user', 'admin')`
- ✅ `AuditLog` table structure defined
- ✅ `RestrictedWords` table exists
- ✅ Sample data includes 3 admin users (userID 1, 2, 3)

**Authentication Infrastructure:**

- ✅ Auth middleware with `requireAdmin()` function
- ✅ Session management with `req.session.isAdmin`
- ✅ Login route sets admin flag based on user role

**Frontend UI:**

- ✅ `admin-panel.html` with dashboard layout
- ✅ Stats cards, quick actions, flagged content table
- ✅ Recent users list, moderation interface
- ✅ Basic styling in `admin-panel.css`

**Backend Structure:**

- ✅ Express app with modular route structure
- ✅ MySQL connection pool in `server/db.js`
- ✅ Middleware for auth, error handling
- ✅ Admin routes placeholder (commented out in `app.js`)

### ❌ Missing/Incomplete

**MySQL Advanced Features:**

- ❌ No triggers for audit logging
- ❌ No stored procedures for complex operations
- ❌ No functions for reusable logic
- ❌ No user privileges (GRANT/REVOKE) implementation
- ❌ No automated content moderation triggers

**Backend Routes:**

- ❌ Admin API endpoints not created
- ❌ Movie management routes missing
- ❌ Content moderation endpoints missing
- ❌ Report generation not implemented
- ❌ Restricted word management not implemented

**Frontend Integration:**

- ❌ Admin panel JS only has placeholder code
- ❌ No dynamic data loading
- ❌ No API integration
- ❌ No real-time updates or actions

**Additional Tables Needed:**

- ❌ `FlaggedContent` table for moderation queue
- ❌ `AdminReports` table for generated reports
- ❌ Extended logging for specific operations

---

## 📐 DATABASE DESIGN & MYSQL FEATURES

### 1. Enhanced Schema Requirements

#### New Table: FlaggedContent

```sql
CREATE TABLE FlaggedContent(
    flagID INT AUTO_INCREMENT PRIMARY KEY,
    contentType ENUM('Post', 'Comment', 'Review', 'Message') NOT NULL,
    contentID INT NOT NULL,
    flaggedBy INT, -- NULL for system-triggered flags
    FOREIGN KEY (flaggedBy) REFERENCES User(userID) ON DELETE SET NULL,
    flagReason VARCHAR(1023) NOT NULL DEFAULT "",
    flaggedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'reviewing', 'resolved', 'dismissed') DEFAULT 'pending',
    reviewedBy INT,
    FOREIGN KEY (reviewedBy) REFERENCES User(userID) ON DELETE SET NULL,
    reviewedDate DATETIME,
    adminNotes VARCHAR(2047),
    matchedWord VARCHAR(255), -- For auto-flagging
    INDEX idx_status (status),
    INDEX idx_content (contentType, contentID),
    INDEX idx_flagged_date (flaggedDate)
);
```

#### New Table: AdminReports

```sql
CREATE TABLE AdminReports(
    reportID INT AUTO_INCREMENT PRIMARY KEY,
    reportType ENUM(
        'top_watched_movies',
        'highest_rated_movies',
        'most_active_users',
        'popular_forums',
        'user_growth',
        'content_statistics'
    ) NOT NULL,
    generatedBy INT NOT NULL,
    FOREIGN KEY (generatedBy) REFERENCES User(userID) ON DELETE CASCADE,
    generatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    reportData JSON, -- Store report results as JSON
    reportPeriod VARCHAR(50), -- e.g., "Last 30 days", "All time"
    INDEX idx_report_type (reportType),
    INDEX idx_generated_date (generatedDate)
);
```

#### Enhanced AuditLog

```sql
-- Add more detailed operation types and metadata
ALTER TABLE AuditLog
ADD COLUMN actionDetails VARCHAR(1023) AFTER operationPerformed,
ADD COLUMN ipAddress VARCHAR(45),
ADD COLUMN userAgent VARCHAR(255),
ADD INDEX idx_admin_time (adminID, timeStamp),
ADD INDEX idx_table_operation (targetTable, operationPerformed);
```

---

### 2. MySQL TRIGGERS (Audit Trail Automation)

#### Trigger 1: Movie INSERT Audit

```sql
DELIMITER $$
CREATE TRIGGER trg_movie_insert_audit
AFTER INSERT ON Movie
FOR EACH ROW
BEGIN
    -- Get the admin ID from session (passed via application variable)
    DECLARE v_adminID INT;
    SET v_adminID = @current_admin_id;

    IF v_adminID IS NOT NULL THEN
        INSERT INTO AuditLog (
            adminID,
            targetRecordID,
            targetTable,
            operationPerformed,
            actionDetails
        )
        VALUES (
            v_adminID,
            NEW.movieID,
            'Movie',
            'INSERT',
            CONCAT('Added movie: ', NEW.title)
        );
    END IF;
END$$
DELIMITER ;
```

#### Trigger 2: Movie UPDATE Audit

```sql
DELIMITER $$
CREATE TRIGGER trg_movie_update_audit
AFTER UPDATE ON Movie
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    DECLARE v_changes VARCHAR(1023);
    SET v_adminID = @current_admin_id;

    -- Build change description
    SET v_changes = '';
    IF OLD.title != NEW.title THEN
        SET v_changes = CONCAT(v_changes, 'Title: "', OLD.title, '" → "', NEW.title, '"; ');
    END IF;
    IF OLD.releaseYear != NEW.releaseYear THEN
        SET v_changes = CONCAT(v_changes, 'Year: ', OLD.releaseYear, ' → ', NEW.releaseYear, '; ');
    END IF;
    IF OLD.director != NEW.director THEN
        SET v_changes = CONCAT(v_changes, 'Director changed; ');
    END IF;

    IF v_adminID IS NOT NULL AND v_changes != '' THEN
        INSERT INTO AuditLog (
            adminID,
            targetRecordID,
            targetTable,
            operationPerformed,
            actionDetails
        )
        VALUES (
            v_adminID,
            NEW.movieID,
            'Movie',
            'UPDATE',
            v_changes
        );
    END IF;
END$$
DELIMITER ;
```

#### Trigger 3: Movie DELETE Audit

```sql
DELIMITER $$
CREATE TRIGGER trg_movie_delete_audit
BEFORE DELETE ON Movie
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    SET v_adminID = @current_admin_id;

    IF v_adminID IS NOT NULL THEN
        INSERT INTO AuditLog (
            adminID,
            targetRecordID,
            targetTable,
            operationPerformed,
            actionDetails
        )
        VALUES (
            v_adminID,
            OLD.movieID,
            'Movie',
            'DELETE CONTENT',
            CONCAT('Deleted movie: ', OLD.title, ' (', OLD.releaseYear, ')')
        );
    END IF;
END$$
DELIMITER ;
```

#### Trigger 4: Genre Management Audit

```sql
DELIMITER $$
CREATE TRIGGER trg_genre_insert_audit
AFTER INSERT ON Genres
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    SET v_adminID = @current_admin_id;

    IF v_adminID IS NOT NULL THEN
        INSERT INTO AuditLog (
            adminID,
            targetRecordID,
            targetTable,
            operationPerformed,
            actionDetails
        )
        VALUES (
            v_adminID,
            NEW.genreID,
            'Genres',
            'INSERT',
            CONCAT('Added genre: ', NEW.genreName)
        );
    END IF;
END$$

CREATE TRIGGER trg_genre_delete_audit
BEFORE DELETE ON Genres
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    SET v_adminID = @current_admin_id;

    IF v_adminID IS NOT NULL THEN
        INSERT INTO AuditLog (
            adminID,
            targetRecordID,
            targetTable,
            operationPerformed,
            actionDetails
        )
        VALUES (
            v_adminID,
            OLD.genreID,
            'Genres',
            'DELETE CONTENT',
            CONCAT('Deleted genre: ', OLD.genreName)
        );
    END IF;
END$$
DELIMITER ;
```

#### Trigger 5: Content Moderation Audit

```sql
DELIMITER $$
CREATE TRIGGER trg_post_delete_audit
BEFORE DELETE ON Post
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    SET v_adminID = @current_admin_id;

    IF v_adminID IS NOT NULL THEN
        INSERT INTO AuditLog (
            adminID,
            targetRecordID,
            targetTable,
            operationPerformed,
            actionDetails
        )
        VALUES (
            v_adminID,
            OLD.postID,
            'Post',
            'DELETE CONTENT',
            CONCAT('Deleted post by user ', OLD.userID, ' on movie ', OLD.movieID)
        );
    END IF;
END$$

-- Similar triggers for Comments and ReviewRatings
CREATE TRIGGER trg_comment_delete_audit
BEFORE DELETE ON Comments
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    SET v_adminID = @current_admin_id;

    IF v_adminID IS NOT NULL THEN
        INSERT INTO AuditLog (
            adminID,
            targetRecordID,
            targetTable,
            operationPerformed,
            actionDetails
        )
        VALUES (
            v_adminID,
            OLD.commentID,
            'Comments',
            'DELETE CONTENT',
            CONCAT('Deleted comment by user ', OLD.userID, ' on post ', OLD.postID)
        );
    END IF;
END$$

CREATE TRIGGER trg_review_delete_audit
BEFORE DELETE ON ReviewRatings
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    SET v_adminID = @current_admin_id;

    IF v_adminID IS NOT NULL THEN
        INSERT INTO AuditLog (
            adminID,
            targetRecordID,
            targetTable,
            operationPerformed,
            actionDetails
        )
        VALUES (
            v_adminID,
            OLD.userID,
            'ReviewRatings',
            'DELETE CONTENT',
            CONCAT('Deleted review by user ', OLD.userID, ' for movie ', OLD.movieID)
        );
    END IF;
END$$
DELIMITER ;
```

#### Trigger 6: Auto-Flag Restricted Content (INSERT)

```sql
DELIMITER $$
CREATE TRIGGER trg_post_check_restricted_words
AFTER INSERT ON Post
FOR EACH ROW
BEGIN
    DECLARE v_restricted VARCHAR(255);

    -- Check if post contains restricted words
    SELECT word INTO v_restricted
    FROM RestrictedWords
    WHERE NEW.postContent LIKE CONCAT('%', word, '%')
    LIMIT 1;

    IF v_restricted IS NOT NULL THEN
        INSERT INTO FlaggedContent (
            contentType,
            contentID,
            flaggedBy,
            flagReason,
            status,
            matchedWord
        )
        VALUES (
            'Post',
            NEW.postID,
            NULL, -- System-triggered
            CONCAT('Auto-flagged: Contains restricted word "', v_restricted, '"'),
            'pending',
            v_restricted
        );
    END IF;
END$$

-- Similar triggers for Comments and ReviewRatings
CREATE TRIGGER trg_comment_check_restricted_words
AFTER INSERT ON Comments
FOR EACH ROW
BEGIN
    DECLARE v_restricted VARCHAR(255);

    SELECT word INTO v_restricted
    FROM RestrictedWords
    WHERE NEW.commentContent LIKE CONCAT('%', word, '%')
    LIMIT 1;

    IF v_restricted IS NOT NULL THEN
        INSERT INTO FlaggedContent (
            contentType,
            contentID,
            flaggedBy,
            flagReason,
            status,
            matchedWord
        )
        VALUES (
            'Comment',
            NEW.commentID,
            NULL,
            CONCAT('Auto-flagged: Contains restricted word "', v_restricted, '"'),
            'pending',
            v_restricted
        );
    END IF;
END$$

CREATE TRIGGER trg_review_check_restricted_words
AFTER INSERT ON ReviewRatings
FOR EACH ROW
BEGIN
    DECLARE v_restricted VARCHAR(255);

    SELECT word INTO v_restricted
    FROM RestrictedWords
    WHERE NEW.review LIKE CONCAT('%', word, '%')
    LIMIT 1;

    IF v_restricted IS NOT NULL THEN
        INSERT INTO FlaggedContent (
            contentType,
            contentID,
            flaggedBy,
            flagReason,
            status,
            matchedWord
        )
        VALUES (
            'Review',
            CONCAT(NEW.movieID, '-', NEW.userID), -- Composite key
            NULL,
            CONCAT('Auto-flagged: Contains restricted word "', v_restricted, '"'),
            'pending',
            v_restricted
        );
    END IF;
END$$
DELIMITER ;
```

#### Trigger 7: User Suspension Audit

```sql
DELIMITER $$
CREATE TRIGGER trg_user_update_audit
AFTER UPDATE ON User
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    SET v_adminID = @current_admin_id;

    -- Log role changes
    IF OLD.role != NEW.role AND v_adminID IS NOT NULL THEN
        INSERT INTO AuditLog (
            adminID,
            targetRecordID,
            targetTable,
            operationPerformed,
            actionDetails
        )
        VALUES (
            v_adminID,
            NEW.userID,
            'User',
            'MANAGEMENT',
            CONCAT('Changed role from "', OLD.role, '" to "', NEW.role, '" for user: ', NEW.username)
        );
    END IF;
END$$
DELIMITER ;
```

---

### 3. MySQL STORED PROCEDURES

#### Procedure 1: Get Top Watched Movies

```sql
DELIMITER $$
CREATE PROCEDURE sp_get_top_watched_movies(
    IN p_limit INT,
    IN p_adminID INT
)
BEGIN
    -- Log report generation
    INSERT INTO AuditLog (
        adminID,
        targetRecordID,
        targetTable,
        operationPerformed,
        actionDetails
    )
    VALUES (
        p_adminID,
        0,
        'AdminReports',
        'REPORT CREATION',
        CONCAT('Generated Top ', p_limit, ' Watched Movies report')
    );

    -- Return results
    SELECT
        m.movieID,
        m.title,
        m.director,
        m.releaseYear,
        m.posterImg,
        COUNT(wl.userID) as completionCount,
        m.avgRating
    FROM Movie m
    LEFT JOIN WatchList wl ON m.movieID = wl.movieID AND wl.status = 'completed'
    GROUP BY m.movieID, m.title, m.director, m.releaseYear, m.posterImg, m.avgRating
    ORDER BY completionCount DESC, m.avgRating DESC
    LIMIT p_limit;
END$$
DELIMITER ;
```

#### Procedure 2: Get Highest Rated Movies

```sql
DELIMITER $$
CREATE PROCEDURE sp_get_highest_rated_movies(
    IN p_limit INT,
    IN p_min_reviews INT,
    IN p_adminID INT
)
BEGIN
    -- Log report generation
    INSERT INTO AuditLog (
        adminID,
        targetRecordID,
        targetTable,
        operationPerformed,
        actionDetails
    )
    VALUES (
        p_adminID,
        0,
        'AdminReports',
        'REPORT CREATION',
        CONCAT('Generated Highest Rated Movies report (min ', p_min_reviews, ' reviews)')
    );

    -- Return results
    SELECT
        m.movieID,
        m.title,
        m.director,
        m.releaseYear,
        m.avgRating,
        COUNT(DISTINCT CONCAT(rr.movieID, '-', rr.userID)) as reviewCount,
        GROUP_CONCAT(DISTINCT g.genreName SEPARATOR ', ') as genres
    FROM Movie m
    LEFT JOIN ReviewRatings rr ON m.movieID = rr.movieID
    LEFT JOIN MovieGenres mg ON m.movieID = mg.movieID
    LEFT JOIN Genres g ON mg.genreID = g.genreID
    GROUP BY m.movieID, m.title, m.director, m.releaseYear, m.avgRating
    HAVING reviewCount >= p_min_reviews
    ORDER BY m.avgRating DESC, reviewCount DESC
    LIMIT p_limit;
END$$
DELIMITER ;
```

#### Procedure 3: Get Most Active Users

```sql
DELIMITER $$
CREATE PROCEDURE sp_get_most_active_users(
    IN p_limit INT,
    IN p_adminID INT
)
BEGIN
    -- Log report generation
    INSERT INTO AuditLog (
        adminID,
        targetRecordID,
        targetTable,
        operationPerformed,
        actionDetails
    )
    VALUES (
        p_adminID,
        0,
        'AdminReports',
        'REPORT CREATION',
        CONCAT('Generated Most Active Users report (top ', p_limit, ')')
    );

    -- Return results with combined activity score
    SELECT
        u.userID,
        u.username,
        u.name,
        u.email,
        u.registrationDate,
        COUNT(DISTINCT p.postID) as postCount,
        COUNT(DISTINCT c.commentID) as commentCount,
        COUNT(DISTINCT CONCAT(rr.movieID, '-', rr.userID)) as reviewCount,
        (
            COUNT(DISTINCT p.postID) * 3 +
            COUNT(DISTINCT c.commentID) * 2 +
            COUNT(DISTINCT CONCAT(rr.movieID, '-', rr.userID)) * 5
        ) as activityScore
    FROM User u
    LEFT JOIN Post p ON u.userID = p.userID
    LEFT JOIN Comments c ON u.userID = c.userID
    LEFT JOIN ReviewRatings rr ON u.userID = rr.userID
    WHERE u.role = 'user'
    GROUP BY u.userID, u.username, u.name, u.email, u.registrationDate
    ORDER BY activityScore DESC
    LIMIT p_limit;
END$$
DELIMITER ;
```

#### Procedure 4: Get Popular Forums (Most Discussed Movies)

```sql
DELIMITER $$
CREATE PROCEDURE sp_get_popular_forums(
    IN p_limit INT,
    IN p_adminID INT
)
BEGIN
    -- Log report generation
    INSERT INTO AuditLog (
        adminID,
        targetRecordID,
        targetTable,
        operationPerformed,
        actionDetails
    )
    VALUES (
        p_adminID,
        0,
        'AdminReports',
        'REPORT CREATION',
        CONCAT('Generated Popular Forums report (top ', p_limit, ')')
    );

    -- Return movies with most discussion activity
    SELECT
        m.movieID,
        m.title,
        m.releaseYear,
        m.posterImg,
        COUNT(DISTINCT p.postID) as postCount,
        SUM(p.commentCount) as totalComments,
        SUM(p.likeCount) as totalLikes,
        (
            COUNT(DISTINCT p.postID) * 10 +
            SUM(p.commentCount) * 3 +
            SUM(p.likeCount) * 1
        ) as engagementScore
    FROM Movie m
    LEFT JOIN Post p ON m.movieID = p.movieID
    GROUP BY m.movieID, m.title, m.releaseYear, m.posterImg
    HAVING postCount > 0
    ORDER BY engagementScore DESC
    LIMIT p_limit;
END$$
DELIMITER ;
```

#### Procedure 5: Delete Flagged Content (with logging)

```sql
DELIMITER $$
CREATE PROCEDURE sp_delete_flagged_content(
    IN p_contentType ENUM('Post', 'Comment', 'Review', 'Message'),
    IN p_contentID INT,
    IN p_flagID INT,
    IN p_adminID INT,
    IN p_adminNotes VARCHAR(2047)
)
BEGIN
    -- Set admin context for triggers
    SET @current_admin_id = p_adminID;

    -- Update flag status
    UPDATE FlaggedContent
    SET
        status = 'resolved',
        reviewedBy = p_adminID,
        reviewedDate = NOW(),
        adminNotes = p_adminNotes
    WHERE flagID = p_flagID;

    -- Delete the actual content based on type
    IF p_contentType = 'Post' THEN
        DELETE FROM Post WHERE postID = p_contentID;
    ELSEIF p_contentType = 'Comment' THEN
        DELETE FROM Comments WHERE commentID = p_contentID;
    ELSEIF p_contentType = 'Review' THEN
        -- Parse composite key (movieID-userID)
        DELETE FROM ReviewRatings
        WHERE CONCAT(movieID, '-', userID) = p_contentID;
    ELSEIF p_contentType = 'Message' THEN
        DELETE FROM Message WHERE messageID = p_contentID;
    END IF;

    -- Clear admin context
    SET @current_admin_id = NULL;

    SELECT 'Content deleted successfully' as message;
END$$
DELIMITER ;
```

#### Procedure 6: Dismiss Flag (without deleting content)

```sql
DELIMITER $$
CREATE PROCEDURE sp_dismiss_flag(
    IN p_flagID INT,
    IN p_adminID INT,
    IN p_adminNotes VARCHAR(2047)
)
BEGIN
    -- Log the dismissal
    INSERT INTO AuditLog (
        adminID,
        targetRecordID,
        targetTable,
        operationPerformed,
        actionDetails
    )
    VALUES (
        p_adminID,
        p_flagID,
        'FlaggedContent',
        'MODERATION',
        CONCAT('Dismissed flag #', p_flagID, ': ', p_adminNotes)
    );

    -- Update flag status
    UPDATE FlaggedContent
    SET
        status = 'dismissed',
        reviewedBy = p_adminID,
        reviewedDate = NOW(),
        adminNotes = p_adminNotes
    WHERE flagID = p_flagID;

    SELECT 'Flag dismissed successfully' as message;
END$$
DELIMITER ;
```

#### Procedure 7: Bulk Add Movies (for TMDB import)

```sql
DELIMITER $$
CREATE PROCEDURE sp_bulk_add_movies(
    IN p_adminID INT
)
BEGIN
    -- This would be called after CSV import
    -- Set admin context for triggers
    SET @current_admin_id = p_adminID;

    -- Log bulk operation
    INSERT INTO AuditLog (
        adminID,
        targetRecordID,
        targetTable,
        operationPerformed,
        actionDetails
    )
    VALUES (
        p_adminID,
        0,
        'Movie',
        'MANAGEMENT',
        'Bulk movie import from TMDB completed'
    );

    -- Clear admin context
    SET @current_admin_id = NULL;
END$$
DELIMITER ;
```

---

### 4. MySQL FUNCTIONS

#### Function 1: Check if User is Admin

```sql
DELIMITER $$
CREATE FUNCTION fn_is_admin(p_userID INT)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_role VARCHAR(10);

    SELECT role INTO v_role
    FROM User
    WHERE userID = p_userID;

    RETURN v_role = 'admin';
END$$
DELIMITER ;
```

#### Function 2: Count User's Total Activity

```sql
DELIMITER $$
CREATE FUNCTION fn_user_activity_score(p_userID INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_score INT DEFAULT 0;
    DECLARE v_posts INT;
    DECLARE v_comments INT;
    DECLARE v_reviews INT;

    SELECT COUNT(*) INTO v_posts FROM Post WHERE userID = p_userID;
    SELECT COUNT(*) INTO v_comments FROM Comments WHERE userID = p_userID;
    SELECT COUNT(*) INTO v_reviews FROM ReviewRatings WHERE userID = p_userID;

    SET v_score = (v_posts * 3) + (v_comments * 2) + (v_reviews * 5);

    RETURN v_score;
END$$
DELIMITER ;
```

#### Function 3: Check Content for Restricted Words

```sql
DELIMITER $$
CREATE FUNCTION fn_contains_restricted_word(p_content TEXT)
RETURNS VARCHAR(255)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_word VARCHAR(255);

    SELECT word INTO v_word
    FROM RestrictedWords
    WHERE p_content LIKE CONCAT('%', word, '%')
    LIMIT 1;

    RETURN v_word;
END$$
DELIMITER ;
```

#### Function 4: Get Movie Discussion Activity

```sql
DELIMITER $$
CREATE FUNCTION fn_movie_discussion_score(p_movieID INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_score INT DEFAULT 0;
    DECLARE v_posts INT;
    DECLARE v_comments INT;
    DECLARE v_likes INT;

    SELECT
        COUNT(DISTINCT postID),
        SUM(commentCount),
        SUM(likeCount)
    INTO v_posts, v_comments, v_likes
    FROM Post
    WHERE movieID = p_movieID;

    SET v_score = (v_posts * 10) + (COALESCE(v_comments, 0) * 3) + (COALESCE(v_likes, 0) * 1);

    RETURN v_score;
END$$
DELIMITER ;
```

---

### 5. MySQL USER PRIVILEGES (GRANT/REVOKE)

#### Create Admin User

```sql
-- Create dedicated admin database user
CREATE USER IF NOT EXISTS 'admin_user'@'localhost'
IDENTIFIED BY 'secure_admin_password';

-- Grant full privileges to admins
GRANT ALL PRIVILEGES ON MovieCommunity.* TO 'admin_user'@'localhost';

-- Allow admin to manage users
GRANT CREATE USER, RELOAD ON *.* TO 'admin_user'@'localhost';

FLUSH PRIVILEGES;
```

#### Create Regular User

```sql
-- Create regular user
CREATE USER IF NOT EXISTS 'app_user'@'localhost'
IDENTIFIED BY 'secure_user_password';

-- Grant limited privileges
GRANT SELECT ON MovieCommunity.Movie TO 'app_user'@'localhost';
GRANT SELECT ON MovieCommunity.Genres TO 'app_user'@'localhost';
GRANT SELECT ON MovieCommunity.MovieGenres TO 'app_user'@'localhost';

-- Allow users to modify their own data
GRANT SELECT, INSERT, UPDATE, DELETE ON MovieCommunity.ReviewRatings TO 'app_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON MovieCommunity.WatchList TO 'app_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON MovieCommunity.Post TO 'app_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON MovieCommunity.Comments TO 'app_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON MovieCommunity.Message TO 'app_user'@'localhost';

-- Friend management
GRANT SELECT, INSERT, DELETE ON MovieCommunity.Friends TO 'app_user'@'localhost';
GRANT SELECT, INSERT, UPDATE ON MovieCommunity.FriendRequest TO 'app_user'@'localhost';

-- Notifications and events
GRANT SELECT, UPDATE ON MovieCommunity.Notifications TO 'app_user'@'localhost';
GRANT SELECT, INSERT ON MovieCommunity.WatchEvent TO 'app_user'@'localhost';
GRANT SELECT, INSERT, DELETE ON MovieCommunity.EventParticipants TO 'app_user'@'localhost';

-- NO access to admin tables
-- REVOKE ALL ON MovieCommunity.AuditLog FROM 'app_user'@'localhost';
-- REVOKE ALL ON MovieCommunity.RestrictedWords FROM 'app_user'@'localhost';
-- REVOKE ALL ON MovieCommunity.FlaggedContent FROM 'app_user'@'localhost';

FLUSH PRIVILEGES;
```

#### Row-Level Security (Application-Enforced)

```sql
-- Users can only delete their own posts
-- Enforced in application layer with WHERE userID = ? check

-- Example query in Node.js:
-- DELETE FROM Post WHERE postID = ? AND userID = ?
-- This ensures users can't delete others' content
```

---

## 🎯 BACKEND IMPLEMENTATION PLAN

### 1. Admin Routes Structure

```
server/routes/admin/
├── index.js              # Main admin router
├── dashboard.js          # Dashboard stats and overview
├── movies.js             # Movie CRUD operations
├── genres.js             # Genre management
├── moderation.js         # Content moderation
├── reports.js            # Report generation
├── restricted-words.js   # Restricted word management
├── users.js              # User management
└── audit.js              # Audit log viewing
```

### 2. Key Endpoints

#### Dashboard (`/api/admin/dashboard`)

```javascript
GET /api/admin/dashboard/stats
- Total users, movies, pending flags, active sessions
- Growth percentages
- System health metrics

GET /api/admin/dashboard/recent-activity
- Recent admin actions from audit log
- Recent user registrations
- Recent content flags
```

#### Movie Management (`/api/admin/movies`)

```javascript
GET /api/admin/movies
- List all movies with pagination
- Filter by genre, year, rating
- Search by title

POST /api/admin/movies
- Add new movie
- Validate required fields
- Set @current_admin_id for trigger
- Return created movie

PUT /api/admin/movies/:id
- Update movie details
- Set @current_admin_id for trigger
- Validate changes

DELETE /api/admin/movies/:id
- Delete movie (CASCADE to related data)
- Set @current_admin_id for trigger
- Return confirmation

POST /api/admin/movies/bulk-import
- Trigger TMDB scraping
- Import from CSV
- Call sp_bulk_add_movies()
```

#### Genre Management (`/api/admin/genres`)

```javascript
GET /api/admin/genres
- List all genres
- Include movie count per genre

POST /api/admin/genres
- Add new genre
- Set @current_admin_id for trigger

PUT /api/admin/genres/:id
- Update genre name
- Set @current_admin_id for trigger

DELETE /api/admin/genres/:id
- Delete genre
- Check for dependencies
- Set @current_admin_id for trigger
```

#### Content Moderation (`/api/admin/moderation`)

```javascript
GET /api/admin/moderation/flagged
- Get flagged content
- Filter by status, type, date
- Pagination support
- Include content preview and context

GET /api/admin/moderation/flagged/:id
- Get full details of flagged item
- Include user info, full content
- Moderation history

POST /api/admin/moderation/flagged/:id/delete
- Call sp_delete_flagged_content()
- Provide admin notes
- Return success message

POST /api/admin/moderation/flagged/:id/dismiss
- Call sp_dismiss_flag()
- Provide reason
- Keep content but resolve flag

PUT /api/admin/moderation/flagged/:id/status
- Update flag status to 'reviewing'
- Assign to admin
```

#### Restricted Words (`/api/admin/restricted-words`)

```javascript
GET /api/admin/restricted-words
- List all restricted words
- Pagination support
- Show usage count (how many flags)

POST /api/admin/restricted-words
- Add new restricted word
- Trigger re-scan of existing content
- Log action

DELETE /api/admin/restricted-words/:id
- Remove restricted word
- Log action
```

#### Reports (`/api/admin/reports`)

```javascript
POST /api/admin/reports/top-watched
- Call sp_get_top_watched_movies(limit, adminID)
- Return results as JSON
- Store in AdminReports table

POST /api/admin/reports/highest-rated
- Call sp_get_highest_rated_movies(limit, min_reviews, adminID)
- Return results as JSON
- Store in AdminReports table

POST /api/admin/reports/most-active-users
- Call sp_get_most_active_users(limit, adminID)
- Return results as JSON
- Store in AdminReports table

POST /api/admin/reports/popular-forums
- Call sp_get_popular_forums(limit, adminID)
- Return results as JSON
- Store in AdminReports table

GET /api/admin/reports/history
- Get previously generated reports
- Filter by type, date range
- Pagination support

GET /api/admin/reports/:id
- Get specific report details
- Return stored JSON data

POST /api/admin/reports/:id/export
- Export report as CSV/PDF
- Return file download
```

#### User Management (`/api/admin/users`)

```javascript
GET /api/admin/users
- List all users
- Filter by role, registration date
- Search by name, email, username
- Pagination support

GET /api/admin/users/:id
- Get user details
- Include activity stats
- Show moderation history

PUT /api/admin/users/:id/role
- Change user role (user ↔ admin)
- Set @current_admin_id for trigger
- Log action

DELETE /api/admin/users/:id
- Delete user account
- Set @current_admin_id for trigger
- CASCADE delete all user data
```

#### Audit Log (`/api/admin/audit`)

```javascript
GET /api/admin/audit
- View audit log entries
- Filter by admin, table, operation, date
- Pagination support
- Search by action details

GET /api/admin/audit/admin/:adminId
- Get all actions by specific admin
- Date range filter

GET /api/admin/audit/export
- Export audit log as CSV
- Date range filter
```

---

### 3. Middleware Implementation

#### Admin Auth Middleware Enhancement

```javascript
// server/middleware/auth.js
function requireAdmin(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!req.session.isAdmin) {
    // Log unauthorized access attempt
    db.query(
      `INSERT INTO AuditLog (adminID, targetRecordID, targetTable, operationPerformed, actionDetails) 
       VALUES (?, 0, 'System', 'MANAGEMENT', 'Unauthorized admin access attempt')`,
      [req.session.userId]
    ).catch(console.error);

    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
}

// Set admin context before admin operations
async function setAdminContext(req, res, next) {
  if (req.session.isAdmin) {
    await db.query("SET @current_admin_id = ?", [req.session.userId]);
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin,
  setAdminContext,
};
```

---

## 🎨 FRONTEND IMPLEMENTATION PLAN

### 1. Admin Panel Pages Structure

```
html/admin/
├── dashboard.html       # Main dashboard (already exists as admin-panel.html)
├── movies.html          # Movie management CRUD
├── genres.html          # Genre management
├── moderation.html      # Content moderation queue
├── reports.html         # Report generation and viewing
├── restricted.html      # Restricted words management
├── users.html           # User management
└── audit.html           # Audit log viewer
```

### 2. JavaScript Files

```
js/admin/
├── admin-dashboard.js   # Dashboard stats and overview
├── admin-movies.js      # Movie CRUD operations
├── admin-genres.js      # Genre management
├── admin-moderation.js  # Moderation interface
├── admin-reports.js     # Report generation UI
├── admin-restricted.js  # Restricted words UI
├── admin-users.js       # User management
└── admin-audit.js       # Audit log viewer
```

### 3. Key UI Components

#### Dashboard Enhancements

- Real-time stats (auto-refresh every 30s)
- Quick action buttons (functional)
- Recent activity feed from audit log
- Flagged content preview table (clickable)
- System health indicators

#### Movie Management Interface

- DataTable with server-side pagination
- Inline editing for quick updates
- Bulk actions (delete selected, bulk import)
- Movie preview modal
- Genre assignment interface
- TMDB import button with progress indicator

#### Moderation Queue

- Filter tabs (Pending, Reviewing, Resolved, Dismissed)
- Content preview with expand/collapse
- Action buttons (Delete, Dismiss, Review)
- Admin notes textarea
- Batch actions (review multiple items)
- User context (see user's history)

#### Report Generation

- Report type selector
- Parameter inputs (limit, min reviews, date range)
- Generate button with loading state
- Results table with export options
- Chart visualizations (optional: Chart.js)
- Save report functionality

#### Restricted Words Management

- Add/Remove words interface
- Bulk import from file
- Usage statistics per word
- Re-scan button (check existing content)

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Database Foundation ✅ (Week 1)

- [ ] Create FlaggedContent table
- [ ] Create AdminReports table
- [ ] Enhance AuditLog table with additional columns
- [ ] Create all 7 audit triggers (movie/genre/content/user)
- [ ] Create auto-flagging triggers (post/comment/review)
- [ ] Create all 7 stored procedures
- [ ] Create all 4 functions
- [ ] Set up MySQL user privileges (GRANT/REVOKE)
- [ ] Test all triggers with sample operations
- [ ] Test all procedures with sample calls

### Phase 2: Backend Routes (Week 2)

- [ ] Create admin route structure
- [ ] Implement dashboard endpoints
- [ ] Implement movie management routes
- [ ] Implement genre management routes
- [ ] Implement moderation endpoints
- [ ] Implement restricted words routes
- [ ] Implement report generation routes
- [ ] Implement user management routes
- [ ] Implement audit log viewing routes
- [ ] Add setAdminContext middleware to all admin routes
- [ ] Test all endpoints with Postman/Thunder Client

### Phase 3: Frontend Pages (Week 3)

- [ ] Refactor admin-panel.html as dashboard
- [ ] Create movies.html with CRUD interface
- [ ] Create genres.html management page
- [ ] Create moderation.html queue interface
- [ ] Create reports.html generation page
- [ ] Create restricted.html words manager
- [ ] Create users.html management page
- [ ] Create audit.html log viewer
- [ ] Implement shared admin navigation component
- [ ] Style all pages consistently

### Phase 4: Frontend JavaScript (Week 4)

- [ ] Implement admin-dashboard.js with real-time updates
- [ ] Implement admin-movies.js with CRUD operations
- [ ] Implement admin-genres.js management logic
- [ ] Implement admin-moderation.js queue interface
- [ ] Implement admin-reports.js generation logic
- [ ] Implement admin-restricted.js words manager
- [ ] Implement admin-users.js management interface
- [ ] Implement admin-audit.js log viewer
- [ ] Add error handling and loading states
- [ ] Add confirmation dialogs for destructive actions

### Phase 5: Integration & Testing (Week 5)

- [ ] End-to-end testing of all admin workflows
- [ ] Test trigger execution in real scenarios
- [ ] Verify audit log entries for all operations
- [ ] Test auto-flagging with restricted words
- [ ] Test report generation and export
- [ ] Test user privilege enforcement
- [ ] Performance testing with large datasets
- [ ] Security testing (SQL injection, XSS, CSRF)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing

### Phase 6: Documentation & Deployment (Week 6)

- [ ] Write API documentation
- [ ] Create admin user guide
- [ ] Document MySQL procedures/functions
- [ ] Create deployment guide
- [ ] Set up production environment variables
- [ ] Configure production MySQL users
- [ ] Deploy to production server
- [ ] Monitor for issues
- [ ] Gather admin feedback
- [ ] Iterate and improve

---

## ❓ CLARIFICATION QUESTIONS

### 1. Content Moderation Strategy

**Q1:** When restricted words are detected, should the content be:

- a) Automatically hidden from public view until admin reviews?
- b) Remain visible but flagged for review?
- c) Blocked from submission entirely?

**Q2:** Should users be notified when their content is flagged/deleted?

- a) Yes, with reason
- b) Yes, generic message
- c) No notification

**Q3:** Should repeat offenders face automatic consequences?

- a) Yes, auto-suspend after X violations
- b) Yes, admin review required for suspension
- c) No automatic actions

### 2. Report Generation & Storage

**Q4:** How long should generated reports be stored?

- a) Forever (all reports kept)
- b) 90 days (automatic cleanup)
- c) Until manually deleted

**Q5:** Should reports be exportable in formats other than CSV?

- a) Yes, add PDF export
- b) Yes, add Excel export
- c) CSV only is sufficient

### 3. Movie Catalog Management

**Q6:** When deleting a movie, should associated user data be preserved?

- a) Yes, keep watchlist entries/reviews but mark movie as deleted
- b) No, CASCADE delete everything (current behavior)
- c) Ask admin to choose per deletion

**Q7:** Should there be approval workflow for TMDB imports?

- a) Yes, admin reviews before adding to live catalog
- b) No, direct import (current plan)
- c) Hybrid: Auto-import but admin can review/reject

### 4. User Management Powers

**Q8:** Should admins be able to:

- a) View users' private messages? (for moderation)
- b) View only flagged messages
- c) Never view messages (privacy priority)

**Q9:** Can admins edit user reviews/posts?

- a) Yes, admins can edit any content
- b) No, only delete (current plan)
- c) Edit only to remove offensive portions

### 5. Audit Trail Detail Level

**Q10:** Should audit log track:

- a) Every single database operation (verbose)
- b) Only admin actions (current plan)
- c) Admin actions + failed auth attempts + security events

**Q11:** Should audit log include:

- a) IP addresses and user agents
- b) Session IDs
- c) Both
- d) Neither (minimal tracking)

### 6. Restricted Words Management

**Q12:** When a word is added to restricted list, should:

- a) All existing content be re-scanned immediately
- b) Re-scan triggered manually by admin
- c) Only new content checked (current trigger behavior)

**Q13:** Should restricted word matching be:

- a) Exact word match
- b) Case-insensitive (current implementation)
- c) Include variations/stems (e.g., "spam" matches "spamming")

### 7. Performance & Scalability

**Q14:** For large datasets (10,000+ movies, 100,000+ users):

- a) Are triggers acceptable? (may slow down operations)
- b) Should we use event-based logging instead?
- c) Keep triggers but optimize queries

**Q15:** Should pagination limits be configurable per admin?

- a) Yes, admins choose page size
- b) No, fixed limits (20/50/100)
- c) Fixed but higher limits for admins

### 8. Admin Roles & Permissions

**Q16:** Should there be multiple admin levels?

- a) Yes: Super Admin, Moderator, Content Manager
- b) No, single admin role (current plan)
- c) Let me decide later

**Q17:** Should admin actions require confirmation/approval?

- a) Yes, critical actions need second admin approval
- b) No, single admin can do everything
- c) Optional: configurable approval workflow

### 9. Real-time Features

**Q18:** Should admin dashboard have real-time updates?

- a) Yes, WebSocket-based live updates
- b) Yes, polling every 30 seconds
- c) No, manual refresh only

**Q19:** Should admins receive notifications for:

- a) New flags (instant push notification)
- b) High-priority events only
- c) Daily digest email
- d) No notifications

### 10. Export & Backup

**Q20:** Should there be automated database backups?

- a) Yes, implement in MySQL Events
- b) Yes, but external tool (cron job)
- c) Manual backups only

**Q21:** Should audit log be exportable with filters?

- a) Yes, filtered CSV export
- b) Yes, full database export
- c) Both

---

## 🔐 SECURITY CONSIDERATIONS

### 1. SQL Injection Prevention

- ✅ Use parameterized queries everywhere
- ✅ Validate all input data
- ✅ Sanitize user input in triggers
- ✅ Escape special characters in dynamic SQL

### 2. Authentication & Authorization

- ✅ Verify admin role on every request
- ✅ Use secure session management
- ✅ Implement CSRF protection
- ✅ Log all authentication failures

### 3. Audit Trail Integrity

- ✅ Triggers run in transaction context
- ✅ Audit entries cannot be deleted by admins
- ✅ Timestamp precision for forensics
- ✅ IP address logging for accountability

### 4. Content Moderation Security

- ✅ Prevent admins from bypassing flags
- ✅ Require reason for dismissing flags
- ✅ Two-admin approval for sensitive deletions
- ✅ Retain deleted content for legal purposes (soft delete option)

### 5. Database User Privileges

- ✅ Separate MySQL users for admin/app
- ✅ Principle of least privilege
- ✅ Row-level security in application
- ✅ Audit privilege escalations

---

## 📊 SUCCESS METRICS

### Functional Metrics

- ✅ All 10 admin workflows completed successfully
- ✅ All triggers fire correctly with accurate logs
- ✅ All procedures return correct results
- ✅ Zero manual SQL needed for admin tasks
- ✅ Reports generate in < 2 seconds

### Performance Metrics

- ✅ Trigger overhead < 50ms per operation
- ✅ Dashboard loads in < 1 second
- ✅ Moderation queue handles 1000+ flags
- ✅ Audit log queries with 100k+ entries fast

### Security Metrics

- ✅ Zero SQL injection vulnerabilities
- ✅ Zero unauthorized access attempts succeed
- ✅ All admin actions logged with 100% accuracy
- ✅ User privileges enforced correctly

---

## 📝 NOTES

- All MySQL features (triggers, procedures, functions) should be created in a separate file: `admin_features.sql`
- Consider creating a migration system for database changes
- Test with realistic data volumes (10k movies, 50k users)
- Consider adding rate limiting for report generation
- Implement caching for frequently accessed reports
- Consider adding data visualization (charts) in Phase 7
- Plan for internationalization if needed
- Consider adding activity heatmaps for admins

---

**END OF DOCUMENT**

This document will be updated as implementation progresses and questions are answered.
