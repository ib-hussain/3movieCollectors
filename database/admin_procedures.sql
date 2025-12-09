-- ============================================================
-- ADMIN FEATURE - STORED PROCEDURES
-- ============================================================
-- Purpose: Reusable procedures for reports and operations
-- Created: December 9, 2025
-- Dependencies: Requires admin_schema.sql and admin_triggers.sql
-- ============================================================

USE 3movieCollectors;

-- ============================================================
-- SECTION 1: REPORTING PROCEDURES
-- Purpose: Generate reports for admin dashboard
-- ============================================================

-- Drop existing procedures if any
DROP PROCEDURE IF EXISTS sp_get_top_watched_movies;
DROP PROCEDURE IF EXISTS sp_get_highest_rated_movies;
DROP PROCEDURE IF EXISTS sp_get_most_active_users;
DROP PROCEDURE IF EXISTS sp_get_popular_forums;

-- PROCEDURE: Get Top Watched Movies
DELIMITER $$
CREATE PROCEDURE sp_get_top_watched_movies(
    IN p_limit INT,
    IN p_days INT  -- 0 = all time, 7 = last week, 30 = last month
)
BEGIN
    IF p_days = 0 THEN
        -- All time
        SELECT 
            m.movieID,
            m.title,
            m.releaseYear,
            m.director,
            m.posterImg,
            COUNT(DISTINCT w.userID) as watchCount,
            AVG(rr.rating) as avgRating,
            COUNT(DISTINCT rr.userID) as ratingCount
        FROM Movie m
        LEFT JOIN Watchlist w ON m.movieID = w.movieID
        LEFT JOIN ReviewRatings rr ON m.movieID = rr.movieID
        GROUP BY m.movieID, m.title, m.releaseYear, m.director, m.posterImg
        ORDER BY watchCount DESC, avgRating DESC
        LIMIT p_limit;
    ELSE
        -- Time-limited
        SELECT 
            m.movieID,
            m.title,
            m.releaseYear,
            m.director,
            m.posterImg,
            COUNT(DISTINCT w.userID) as watchCount,
            AVG(rr.rating) as avgRating,
            COUNT(DISTINCT rr.userID) as ratingCount
        FROM Movie m
        LEFT JOIN Watchlist w ON m.movieID = w.movieID 
            AND w.addedDate >= DATE_SUB(NOW(), INTERVAL p_days DAY)
        LEFT JOIN ReviewRatings rr ON m.movieID = rr.movieID
        GROUP BY m.movieID, m.title, m.releaseYear, m.director, m.posterImg
        HAVING watchCount > 0
        ORDER BY watchCount DESC, avgRating DESC
        LIMIT p_limit;
    END IF;
END$$
DELIMITER ;

-- PROCEDURE: Get Highest Rated Movies
DELIMITER $$
CREATE PROCEDURE sp_get_highest_rated_movies(
    IN p_limit INT,
    IN p_minRatings INT  -- Minimum number of ratings required
)
BEGIN
    SELECT 
        m.movieID,
        m.title,
        m.releaseYear,
        m.director,
        m.posterImg,
        AVG(rr.rating) as avgRating,
        COUNT(rr.userID) as ratingCount,
        COUNT(DISTINCT w.userID) as watchlistCount
    FROM Movie m
    INNER JOIN ReviewRatings rr ON m.movieID = rr.movieID
    LEFT JOIN Watchlist w ON m.movieID = w.movieID
    GROUP BY m.movieID, m.title, m.releaseYear, m.director, m.posterImg
    HAVING ratingCount >= p_minRatings
    ORDER BY avgRating DESC, ratingCount DESC
    LIMIT p_limit;
END$$
DELIMITER ;

-- PROCEDURE: Get Most Active Users
DELIMITER $$
CREATE PROCEDURE sp_get_most_active_users(
    IN p_limit INT,
    IN p_days INT  -- 0 = all time, 7 = last week, 30 = last month
)
BEGIN
    DECLARE v_date_filter DATE;
    
    IF p_days > 0 THEN
        SET v_date_filter = DATE_SUB(NOW(), INTERVAL p_days DAY);
    END IF;
    
    SELECT 
        u.userID,
        u.username,
        u.email,
        u.joinedDate,
        u.profilePicture,
        COUNT(DISTINCT p.postID) as postCount,
        COUNT(DISTINCT c.commentID) as commentCount,
        COUNT(DISTINCT rr.movieID) as reviewCount,
        COUNT(DISTINCT w.movieID) as watchlistCount,
        (COUNT(DISTINCT p.postID) + 
         COUNT(DISTINCT c.commentID) + 
         COUNT(DISTINCT rr.movieID) * 2) as activityScore
    FROM User u
    LEFT JOIN Post p ON u.userID = p.userID 
        AND (p_days = 0 OR p.postedDate >= v_date_filter)
    LEFT JOIN Comments c ON u.userID = c.userID 
        AND (p_days = 0 OR c.commentDate >= v_date_filter)
    LEFT JOIN ReviewRatings rr ON u.userID = rr.userID 
        AND (p_days = 0 OR rr.ratingDate >= v_date_filter)
    LEFT JOIN Watchlist w ON u.userID = w.userID
    WHERE u.role = 'user' AND u.isSuspended = FALSE
    GROUP BY u.userID, u.username, u.email, u.joinedDate, u.profilePicture
    ORDER BY activityScore DESC
    LIMIT p_limit;
END$$
DELIMITER ;

-- PROCEDURE: Get Popular Forums (Movies with most discussion)
DELIMITER $$
CREATE PROCEDURE sp_get_popular_forums(
    IN p_limit INT,
    IN p_days INT
)
BEGIN
    DECLARE v_date_filter DATE;
    
    IF p_days > 0 THEN
        SET v_date_filter = DATE_SUB(NOW(), INTERVAL p_days DAY);
    END IF;
    
    SELECT 
        m.movieID,
        m.title,
        m.releaseYear,
        m.director,
        m.posterImg,
        COUNT(DISTINCT p.postID) as postCount,
        COUNT(DISTINCT c.commentID) as commentCount,
        COUNT(DISTINCT p.userID) as uniquePosters,
        (COUNT(DISTINCT p.postID) * 3 + COUNT(DISTINCT c.commentID)) as discussionScore
    FROM Movie m
    LEFT JOIN Post p ON m.movieID = p.movieID 
        AND (p_days = 0 OR p.postedDate >= v_date_filter)
    LEFT JOIN Comments c ON p.postID = c.postID 
        AND (p_days = 0 OR c.commentDate >= v_date_filter)
    GROUP BY m.movieID, m.title, m.releaseYear, m.director, m.posterImg
    HAVING postCount > 0
    ORDER BY discussionScore DESC, postCount DESC
    LIMIT p_limit;
END$$
DELIMITER ;

-- ============================================================
-- SECTION 2: CONTENT MODERATION PROCEDURES
-- ============================================================

DROP PROCEDURE IF EXISTS sp_delete_flagged_content;
DROP PROCEDURE IF EXISTS sp_dismiss_flag;
DROP PROCEDURE IF EXISTS sp_rescan_content_for_word;

-- PROCEDURE: Delete Flagged Content
DELIMITER $$
CREATE PROCEDURE sp_delete_flagged_content(
    IN p_flagID INT,
    IN p_adminID INT,
    IN p_deleteReason VARCHAR(1024),
    IN p_notifyUser BOOLEAN,
    IN p_ipAddress VARCHAR(45),
    IN p_userAgent VARCHAR(511)
)
BEGIN
    DECLARE v_contentType VARCHAR(50);
    DECLARE v_contentID VARCHAR(50);
    DECLARE v_userID INT;
    DECLARE v_movieID INT;
    DECLARE v_postID INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: Failed to delete content' as Status;
    END;
    
    START TRANSACTION;
    
    -- Get flag details
    SELECT contentType, contentID 
    INTO v_contentType, v_contentID
    FROM FlaggedContent
    WHERE flagID = p_flagID;
    
    -- Set admin context for audit triggers
    SET @current_admin_id = p_adminID;
    SET @current_ip_address = p_ipAddress;
    SET @current_user_agent = p_userAgent;
    
    -- Delete based on content type
    IF v_contentType = 'Post' THEN
        -- Get post details
        SELECT userID, movieID INTO v_userID, v_movieID
        FROM Post WHERE postID = v_contentID;
        
        -- Delete post (cascade deletes comments)
        DELETE FROM Post WHERE postID = v_contentID;
        
    ELSEIF v_contentType = 'Comment' THEN
        -- Get comment details
        SELECT userID, postID INTO v_userID, v_postID
        FROM Comments WHERE commentID = v_contentID;
        
        -- Delete comment
        DELETE FROM Comments WHERE commentID = v_contentID;
        
    ELSEIF v_contentType = 'Review' THEN
        -- Parse composite key 'movieID-userID'
        SET v_movieID = CAST(SUBSTRING_INDEX(v_contentID, '-', 1) AS UNSIGNED);
        SET v_userID = CAST(SUBSTRING_INDEX(v_contentID, '-', -1) AS UNSIGNED);
        
        -- Delete review
        DELETE FROM ReviewRatings 
        WHERE movieID = v_movieID AND userID = v_userID;
    END IF;
    
    -- Update flag status
    UPDATE FlaggedContent
    SET status = 'removed',
        reviewedBy = p_adminID,
        reviewedDate = NOW(),
        adminNotes = p_deleteReason
    WHERE flagID = p_flagID;
    
    -- Notify user if requested
    IF p_notifyUser = TRUE AND v_userID IS NOT NULL THEN
        INSERT INTO Notifications (
            receivedFROMuserID,
            triggerUserID,
            triggerEvent,
            content,
            relatedID,
            isSeen
        )
        VALUES (
            v_userID,
            p_adminID,
            'admin_action',
            CONCAT('Your content has been removed by an admin. Reason: ', p_deleteReason),
            p_flagID,
            FALSE
        );
    END IF;
    
    -- Clear admin context
    SET @current_admin_id = NULL;
    SET @current_ip_address = NULL;
    SET @current_user_agent = NULL;
    
    COMMIT;
    SELECT 'Content deleted successfully' as Status, v_contentType as ContentType, v_contentID as ContentID;
END$$
DELIMITER ;

-- PROCEDURE: Dismiss Flag (mark as false positive)
DELIMITER $$
CREATE PROCEDURE sp_dismiss_flag(
    IN p_flagID INT,
    IN p_adminID INT,
    IN p_dismissReason VARCHAR(1024),
    IN p_ipAddress VARCHAR(45),
    IN p_userAgent VARCHAR(511)
)
BEGIN
    DECLARE v_contentType VARCHAR(50);
    DECLARE v_contentID VARCHAR(50);
    DECLARE v_userID INT;
    
    -- Set admin context
    SET @current_admin_id = p_adminID;
    SET @current_ip_address = p_ipAddress;
    SET @current_user_agent = p_userAgent;
    
    -- Get flag details
    SELECT contentType, contentID INTO v_contentType, v_contentID
    FROM FlaggedContent WHERE flagID = p_flagID;
    
    -- Update flag status and unhide content
    UPDATE FlaggedContent
    SET status = 'dismissed',
        reviewedBy = p_adminID,
        reviewedDate = NOW(),
        adminNotes = p_dismissReason,
        isHidden = FALSE
    WHERE flagID = p_flagID;
    
    -- Get userID to notify
    IF v_contentType = 'Post' THEN
        SELECT userID INTO v_userID FROM Post WHERE postID = v_contentID;
    ELSEIF v_contentType = 'Comment' THEN
        SELECT userID INTO v_userID FROM Comments WHERE commentID = v_contentID;
    ELSEIF v_contentType = 'Review' THEN
        SET v_userID = CAST(SUBSTRING_INDEX(v_contentID, '-', -1) AS UNSIGNED);
    END IF;
    
    -- Notify user that content is restored
    IF v_userID IS NOT NULL THEN
        INSERT INTO Notifications (
            receivedFROMuserID,
            triggerUserID,
            triggerEvent,
            content,
            relatedID,
            isSeen
        )
        VALUES (
            v_userID,
            p_adminID,
            'admin_action',
            'Your content has been reviewed and restored. Thank you for your patience.',
            p_flagID,
            FALSE
        );
    END IF;
    
    -- Log dismissal in audit log
    INSERT INTO AuditLog (
        adminID,
        targetRecordID,
        targetTable,
        operationPerformed,
        actionDetails,
        ipAddress,
        userAgent
    )
    VALUES (
        p_adminID,
        p_flagID,
        'FlaggedContent',
        'DISMISS FLAG',
        CONCAT('Dismissed flag for ', v_contentType, ' #', v_contentID, '. Reason: ', p_dismissReason),
        p_ipAddress,
        p_userAgent
    );
    
    -- Clear admin context
    SET @current_admin_id = NULL;
    SET @current_ip_address = NULL;
    SET @current_user_agent = NULL;
    
    SELECT 'Flag dismissed successfully' as Status;
END$$
DELIMITER ;

-- PROCEDURE: Rescan Content for Specific Restricted Word
DELIMITER $$
CREATE PROCEDURE sp_rescan_content_for_word(
    IN p_word VARCHAR(255),
    IN p_adminID INT
)
BEGIN
    DECLARE v_flagCount INT DEFAULT 0;
    
    -- Scan Posts
    INSERT INTO FlaggedContent (contentType, contentID, flaggedBy, flagReason, status, matchedWord, isHidden)
    SELECT 
        'Post',
        p.postID,
        NULL,
        CONCAT('Manual rescan: Contains restricted word "', p_word, '"'),
        'pending',
        p_word,
        TRUE
    FROM Post p
    WHERE LOWER(p.postContent) LIKE CONCAT('%', LOWER(p_word), '%')
    AND NOT EXISTS (
        SELECT 1 FROM FlaggedContent fc
        WHERE fc.contentType = 'Post' 
        AND fc.contentID = p.postID
        AND fc.status IN ('pending', 'reviewing')
    );
    
    SET v_flagCount = v_flagCount + ROW_COUNT();
    
    -- Scan Comments
    INSERT INTO FlaggedContent (contentType, contentID, flaggedBy, flagReason, status, matchedWord, isHidden)
    SELECT 
        'Comment',
        c.commentID,
        NULL,
        CONCAT('Manual rescan: Contains restricted word "', p_word, '"'),
        'pending',
        p_word,
        TRUE
    FROM Comments c
    WHERE LOWER(c.commentContent) LIKE CONCAT('%', LOWER(p_word), '%')
    AND NOT EXISTS (
        SELECT 1 FROM FlaggedContent fc
        WHERE fc.contentType = 'Comment' 
        AND fc.contentID = c.commentID
        AND fc.status IN ('pending', 'reviewing')
    );
    
    SET v_flagCount = v_flagCount + ROW_COUNT();
    
    -- Scan Reviews
    INSERT INTO FlaggedContent (contentType, contentID, flaggedBy, flagReason, status, matchedWord, isHidden)
    SELECT 
        'Review',
        CONCAT(rr.movieID, '-', rr.userID),
        NULL,
        CONCAT('Manual rescan: Contains restricted word "', p_word, '"'),
        'pending',
        p_word,
        TRUE
    FROM ReviewRatings rr
    WHERE LOWER(rr.review) LIKE CONCAT('%', LOWER(p_word), '%')
    AND NOT EXISTS (
        SELECT 1 FROM FlaggedContent fc
        WHERE fc.contentType = 'Review' 
        AND fc.contentID = CONCAT(rr.movieID, '-', rr.userID)
        AND fc.status IN ('pending', 'reviewing')
    );
    
    SET v_flagCount = v_flagCount + ROW_COUNT();
    
    -- Update restricted word scan date and flag count
    UPDATE RestrictedWords
    SET lastScannedDate = NOW(),
        flagCount = flagCount + v_flagCount
    WHERE word = p_word;
    
    -- Log the rescan
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
        'RestrictedWords',
        'RESCAN',
        CONCAT('Manual content rescan for word "', p_word, '". Flagged ', v_flagCount, ' items.')
    );
    
    SELECT v_flagCount as ItemsFlagged, 'Rescan completed' as Status;
END$$
DELIMITER ;

-- ============================================================
-- SECTION 3: MANAGEMENT PROCEDURES
-- ============================================================

DROP PROCEDURE IF EXISTS sp_bulk_add_movies;
DROP PROCEDURE IF EXISTS sp_suspend_user;
DROP PROCEDURE IF EXISTS sp_backup_database;

-- PROCEDURE: Bulk Add Movies from TMDB Import
DELIMITER $$
CREATE PROCEDURE sp_bulk_add_movies(
    IN p_adminID INT,
    IN p_moviesJSON JSON,
    IN p_ipAddress VARCHAR(45),
    IN p_userAgent VARCHAR(511)
)
BEGIN
    DECLARE v_index INT DEFAULT 0;
    DECLARE v_count INT;
    DECLARE v_title VARCHAR(511);
    DECLARE v_year INT;
    DECLARE v_director VARCHAR(255);
    DECLARE v_synopsis TEXT;
    DECLARE v_poster VARCHAR(1023);
    DECLARE v_tmdbID INT;
    DECLARE v_added INT DEFAULT 0;
    DECLARE v_skipped INT DEFAULT 0;
    
    -- Set admin context
    SET @current_admin_id = p_adminID;
    SET @current_ip_address = p_ipAddress;
    SET @current_user_agent = p_userAgent;
    
    -- Get array length
    SET v_count = JSON_LENGTH(p_moviesJSON);
    
    -- Loop through movies
    WHILE v_index < v_count DO
        -- Extract movie data
        SET v_title = JSON_UNQUOTE(JSON_EXTRACT(p_moviesJSON, CONCAT('$[', v_index, '].title')));
        SET v_year = JSON_EXTRACT(p_moviesJSON, CONCAT('$[', v_index, '].year'));
        SET v_director = JSON_UNQUOTE(JSON_EXTRACT(p_moviesJSON, CONCAT('$[', v_index, '].director')));
        SET v_synopsis = JSON_UNQUOTE(JSON_EXTRACT(p_moviesJSON, CONCAT('$[', v_index, '].synopsis')));
        SET v_poster = JSON_UNQUOTE(JSON_EXTRACT(p_moviesJSON, CONCAT('$[', v_index, '].poster')));
        SET v_tmdbID = JSON_EXTRACT(p_moviesJSON, CONCAT('$[', v_index, '].tmdb_id'));
        
        -- Check if movie already exists (by title and year)
        IF NOT EXISTS (SELECT 1 FROM Movie WHERE title = v_title AND releaseYear = v_year) THEN
            INSERT INTO Movie (title, releaseYear, director, synopsis, posterImg)
            VALUES (v_title, v_year, v_director, v_synopsis, v_poster);
            
            SET v_added = v_added + 1;
        ELSE
            SET v_skipped = v_skipped + 1;
        END IF;
        
        SET v_index = v_index + 1;
    END WHILE;
    
    -- Clear admin context
    SET @current_admin_id = NULL;
    SET @current_ip_address = NULL;
    SET @current_user_agent = NULL;
    
    SELECT v_added as MoviesAdded, v_skipped as MoviesSkipped, 'Bulk import completed' as Status;
END$$
DELIMITER ;

-- PROCEDURE: Suspend User
DELIMITER $$
CREATE PROCEDURE sp_suspend_user(
    IN p_userID INT,
    IN p_adminID INT,
    IN p_reason VARCHAR(1024),
    IN p_ipAddress VARCHAR(45),
    IN p_userAgent VARCHAR(511)
)
BEGIN
    -- Set admin context
    SET @current_admin_id = p_adminID;
    SET @current_ip_address = p_ipAddress;
    SET @current_user_agent = p_userAgent;
    
    -- Suspend the user
    UPDATE User
    SET isSuspended = TRUE,
        suspendedDate = NOW(),
        suspensionReason = p_reason,
        suspendedBy = p_adminID
    WHERE userID = p_userID;
    
    -- Notify the user
    INSERT INTO Notifications (
        receivedFROMuserID,
        triggerUserID,
        triggerEvent,
        content,
        relatedID,
        isSeen
    )
    VALUES (
        p_userID,
        p_adminID,
        'admin_action',
        CONCAT('Your account has been suspended. Reason: ', p_reason),
        p_userID,
        FALSE
    );
    
    -- Create security event
    INSERT INTO SecurityEvents (
        eventType,
        userID,
        ipAddress,
        userAgent,
        severity,
        details
    )
    VALUES (
        'account_suspended',
        p_userID,
        p_ipAddress,
        p_userAgent,
        'high',
        CONCAT('Account suspended by admin ', p_adminID, '. Reason: ', p_reason)
    );
    
    -- Clear admin context
    SET @current_admin_id = NULL;
    SET @current_ip_address = NULL;
    SET @current_user_agent = NULL;
    
    SELECT 'User suspended successfully' as Status;
END$$
DELIMITER ;

-- PROCEDURE: Backup Database (called by event scheduler)
DELIMITER $$
CREATE PROCEDURE sp_backup_database()
BEGIN
    DECLARE v_backupFile VARCHAR(255);
    DECLARE v_timestamp VARCHAR(50);
    
    SET v_timestamp = DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s');
    SET v_backupFile = CONCAT('3movieCollectors_backup_', v_timestamp, '.sql');
    
    -- Log backup attempt
    INSERT INTO AuditLog (
        adminID,
        targetRecordID,
        targetTable,
        operationPerformed,
        actionDetails
    )
    VALUES (
        NULL,
        0,
        'Database',
        'BACKUP',
        CONCAT('Automated database backup initiated: ', v_backupFile)
    );
    
    -- Note: Actual backup command must be executed via mysqldump from application
    -- This procedure logs the backup event
    
    SELECT v_backupFile as BackupFile, NOW() as BackupTime, 'Backup logged' as Status;
END$$
DELIMITER ;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'All stored procedures created successfully!' as Status;

-- Show created procedures
SHOW PROCEDURE STATUS WHERE Db = '3movieCollectors' AND Name LIKE 'sp_%';
