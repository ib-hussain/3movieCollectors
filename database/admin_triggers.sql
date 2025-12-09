-- ============================================================
-- ADMIN FEATURE - AUDIT & AUTO-FLAGGING TRIGGERS
-- ============================================================
-- Purpose: Automatic audit logging and content moderation
-- Created: December 9, 2025
-- Dependencies: Requires admin_schema.sql to be executed first
-- ============================================================

USE 3movieCollectors;

-- ============================================================
-- SECTION 1: MOVIE MANAGEMENT AUDIT TRIGGERS
-- Purpose: Log all movie CRUD operations
-- ============================================================

-- Drop existing triggers if any (for re-execution)
DROP TRIGGER IF EXISTS trg_movie_insert_audit;
DROP TRIGGER IF EXISTS trg_movie_update_audit;
DROP TRIGGER IF EXISTS trg_movie_delete_audit;

-- TRIGGER: Movie INSERT
DELIMITER $$
CREATE TRIGGER trg_movie_insert_audit
AFTER INSERT ON Movie
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    DECLARE v_ipAddress VARCHAR(45);
    DECLARE v_userAgent VARCHAR(511);
    
    -- Get admin context (set by application)
    SET v_adminID = @current_admin_id;
    SET v_ipAddress = @current_ip_address;
    SET v_userAgent = @current_user_agent;
    
    IF v_adminID IS NOT NULL THEN
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
            v_adminID,
            NEW.movieID,
            'Movie',
            'INSERT',
            CONCAT('Added movie: "', NEW.title, '" (', NEW.releaseYear, ')'),
            v_ipAddress,
            v_userAgent
        );
    END IF;
END$$
DELIMITER ;

-- TRIGGER: Movie UPDATE
DELIMITER $$
CREATE TRIGGER trg_movie_update_audit
AFTER UPDATE ON Movie
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    DECLARE v_changes TEXT;
    DECLARE v_ipAddress VARCHAR(45);
    DECLARE v_userAgent VARCHAR(511);
    
    SET v_adminID = @current_admin_id;
    SET v_ipAddress = @current_ip_address;
    SET v_userAgent = @current_user_agent;
    SET v_changes = '';
    
    -- Build change description
    IF OLD.title != NEW.title THEN
        SET v_changes = CONCAT(v_changes, 'Title: "', OLD.title, '" → "', NEW.title, '"; ');
    END IF;
    
    IF OLD.releaseYear != NEW.releaseYear THEN
        SET v_changes = CONCAT(v_changes, 'Year: ', OLD.releaseYear, ' → ', NEW.releaseYear, '; ');
    END IF;
    
    IF OLD.director != NEW.director THEN
        SET v_changes = CONCAT(v_changes, 'Director: "', OLD.director, '" → "', NEW.director, '"; ');
    END IF;
    
    IF OLD.synopsis != NEW.synopsis THEN
        SET v_changes = CONCAT(v_changes, 'Synopsis updated; ');
    END IF;
    
    IF OLD.posterImg != NEW.posterImg THEN
        SET v_changes = CONCAT(v_changes, 'Poster updated; ');
    END IF;
    
    IF v_adminID IS NOT NULL AND v_changes != '' THEN
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
            v_adminID,
            NEW.movieID,
            'Movie',
            'UPDATE',
            SUBSTRING(v_changes, 1, 1023),
            v_ipAddress,
            v_userAgent
        );
    END IF;
END$$
DELIMITER ;

-- TRIGGER: Movie DELETE
DELIMITER $$
CREATE TRIGGER trg_movie_delete_audit
BEFORE DELETE ON Movie
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    DECLARE v_ipAddress VARCHAR(45);
    DECLARE v_userAgent VARCHAR(511);
    
    SET v_adminID = @current_admin_id;
    SET v_ipAddress = @current_ip_address;
    SET v_userAgent = @current_user_agent;
    
    IF v_adminID IS NOT NULL THEN
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
            v_adminID,
            OLD.movieID,
            'Movie',
            'DELETE CONTENT',
            CONCAT('Deleted movie: "', OLD.title, '" (', OLD.releaseYear, ') by ', OLD.director),
            v_ipAddress,
            v_userAgent
        );
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- SECTION 2: GENRE MANAGEMENT AUDIT TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS trg_genre_insert_audit;
DROP TRIGGER IF EXISTS trg_genre_delete_audit;

-- TRIGGER: Genre INSERT
DELIMITER $$
CREATE TRIGGER trg_genre_insert_audit
AFTER INSERT ON Genres
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    DECLARE v_ipAddress VARCHAR(45);
    DECLARE v_userAgent VARCHAR(511);
    
    SET v_adminID = @current_admin_id;
    SET v_ipAddress = @current_ip_address;
    SET v_userAgent = @current_user_agent;
    
    IF v_adminID IS NOT NULL THEN
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
            v_adminID,
            NEW.genreID,
            'Genres',
            'INSERT',
            CONCAT('Added genre: "', NEW.genreName, '"'),
            v_ipAddress,
            v_userAgent
        );
    END IF;
END$$
DELIMITER ;

-- TRIGGER: Genre DELETE
DELIMITER $$
CREATE TRIGGER trg_genre_delete_audit
BEFORE DELETE ON Genres
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    DECLARE v_ipAddress VARCHAR(45);
    DECLARE v_userAgent VARCHAR(511);
    
    SET v_adminID = @current_admin_id;
    SET v_ipAddress = @current_ip_address;
    SET v_userAgent = @current_user_agent;
    
    IF v_adminID IS NOT NULL THEN
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
            v_adminID,
            OLD.genreID,
            'Genres',
            'DELETE CONTENT',
            CONCAT('Deleted genre: "', OLD.genreName, '"'),
            v_ipAddress,
            v_userAgent
        );
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- SECTION 3: CONTENT MODERATION AUDIT TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS trg_post_delete_audit;
DROP TRIGGER IF EXISTS trg_comment_delete_audit;
DROP TRIGGER IF EXISTS trg_review_delete_audit;

-- TRIGGER: Post DELETE
DELIMITER $$
CREATE TRIGGER trg_post_delete_audit
BEFORE DELETE ON Post
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    DECLARE v_ipAddress VARCHAR(45);
    DECLARE v_userAgent VARCHAR(511);
    
    SET v_adminID = @current_admin_id;
    SET v_ipAddress = @current_ip_address;
    SET v_userAgent = @current_user_agent;
    
    IF v_adminID IS NOT NULL THEN
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
            v_adminID,
            OLD.postID,
            'Post',
            'DELETE CONTENT',
            CONCAT('Deleted post (ID:', OLD.postID, ') by user ', OLD.userID, ' on movie ', OLD.movieID),
            v_ipAddress,
            v_userAgent
        );
    END IF;
END$$
DELIMITER ;

-- TRIGGER: Comment DELETE
DELIMITER $$
CREATE TRIGGER trg_comment_delete_audit
BEFORE DELETE ON Comments
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    DECLARE v_ipAddress VARCHAR(45);
    DECLARE v_userAgent VARCHAR(511);
    
    SET v_adminID = @current_admin_id;
    SET v_ipAddress = @current_ip_address;
    SET v_userAgent = @current_user_agent;
    
    IF v_adminID IS NOT NULL THEN
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
            v_adminID,
            OLD.commentID,
            'Comments',
            'DELETE CONTENT',
            CONCAT('Deleted comment (ID:', OLD.commentID, ') by user ', OLD.userID, ' on post ', OLD.postID),
            v_ipAddress,
            v_userAgent
        );
    END IF;
END$$
DELIMITER ;

-- TRIGGER: Review DELETE
DELIMITER $$
CREATE TRIGGER trg_review_delete_audit
BEFORE DELETE ON ReviewRatings
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    DECLARE v_ipAddress VARCHAR(45);
    DECLARE v_userAgent VARCHAR(511);
    
    SET v_adminID = @current_admin_id;
    SET v_ipAddress = @current_ip_address;
    SET v_userAgent = @current_user_agent;
    
    IF v_adminID IS NOT NULL THEN
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
            v_adminID,
            OLD.userID,
            'ReviewRatings',
            'DELETE CONTENT',
            CONCAT('Deleted review by user ', OLD.userID, ' for movie ', OLD.movieID, ' (rating: ', OLD.rating, ')'),
            v_ipAddress,
            v_userAgent
        );
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- SECTION 4: USER MANAGEMENT AUDIT TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS trg_user_update_audit;

-- TRIGGER: User UPDATE (role changes, suspensions)
DELIMITER $$
CREATE TRIGGER trg_user_update_audit
AFTER UPDATE ON User
FOR EACH ROW
BEGIN
    DECLARE v_adminID INT;
    DECLARE v_changes TEXT;
    DECLARE v_ipAddress VARCHAR(45);
    DECLARE v_userAgent VARCHAR(511);
    
    SET v_adminID = @current_admin_id;
    SET v_ipAddress = @current_ip_address;
    SET v_userAgent = @current_user_agent;
    SET v_changes = '';
    
    -- Log role changes
    IF OLD.role != NEW.role THEN
        SET v_changes = CONCAT('Role changed from "', OLD.role, '" to "', NEW.role, '" for user: ', NEW.username);
    END IF;
    
    -- Log suspension status changes
    IF OLD.isSuspended != NEW.isSuspended THEN
        IF NEW.isSuspended = TRUE THEN
            SET v_changes = CONCAT(v_changes, IF(v_changes != '', '; ', ''), 
                'User suspended: ', NEW.username, ' - Reason: ', IFNULL(NEW.suspensionReason, 'Not specified'));
        ELSE
            SET v_changes = CONCAT(v_changes, IF(v_changes != '', '; ', ''), 
                'User unsuspended: ', NEW.username);
        END IF;
    END IF;
    
    IF v_adminID IS NOT NULL AND v_changes != '' THEN
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
            v_adminID,
            NEW.userID,
            'User',
            'MANAGEMENT',
            SUBSTRING(v_changes, 1, 1023),
            v_ipAddress,
            v_userAgent
        );
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- SECTION 5: AUTO-FLAGGING TRIGGERS (Restricted Words)
-- Purpose: Automatically flag and hide content with restricted words
-- ============================================================

DROP TRIGGER IF EXISTS trg_post_check_restricted_insert;
DROP TRIGGER IF EXISTS trg_post_check_restricted_update;
DROP TRIGGER IF EXISTS trg_comment_check_restricted_insert;
DROP TRIGGER IF EXISTS trg_comment_check_restricted_update;
DROP TRIGGER IF EXISTS trg_review_check_restricted_insert;
DROP TRIGGER IF EXISTS trg_review_check_restricted_update;

-- TRIGGER: Post INSERT - Check for restricted words
DELIMITER $$
CREATE TRIGGER trg_post_check_restricted_insert
AFTER INSERT ON Post
FOR EACH ROW
BEGIN
    DECLARE v_restricted VARCHAR(255);
    
    -- Check if post contains restricted words (case-insensitive)
    SELECT word INTO v_restricted
    FROM RestrictedWords
    WHERE LOWER(NEW.postContent) LIKE CONCAT('%', LOWER(word), '%')
    LIMIT 1;
    
    IF v_restricted IS NOT NULL THEN
        -- Flag the content and hide it
        INSERT INTO FlaggedContent (
            contentType,
            contentID,
            flaggedBy,
            flagReason,
            status,
            matchedWord,
            isHidden
        )
        VALUES (
            'Post',
            NEW.postID,
            NULL, -- System-triggered
            CONCAT('Auto-flagged: Contains restricted word "', v_restricted, '"'),
            'pending',
            v_restricted,
            TRUE -- Hide content immediately
        );
        
        -- Update restricted word flag count
        UPDATE RestrictedWords 
        SET flagCount = flagCount + 1 
        WHERE word = v_restricted;
        
        -- Create admin notification
        INSERT INTO AdminNotifications (
            notificationType,
            title,
            message,
            priority,
            relatedType,
            relatedID
        )
        VALUES (
            'new_flag',
            'Content Auto-Flagged',
            CONCAT('Post #', NEW.postID, ' by user ', NEW.userID, ' contains restricted word: ', v_restricted),
            'medium',
            'flag',
            LAST_INSERT_ID()
        );
        
        -- Notify user that their content is under review
        INSERT INTO Notifications (
            receivedFROMuserID,
            triggerUserID,
            triggerEvent,
            content,
            relatedID,
            isSeen
        )
        VALUES (
            NEW.userID,
            NEW.userID,
            'new_post',
            CONCAT('Your post is under review due to potential policy violation. Reason: Contains restricted content.'),
            NEW.postID,
            FALSE
        );
    END IF;
END$$
DELIMITER ;

-- TRIGGER: Post UPDATE - Check for restricted words
DELIMITER $$
CREATE TRIGGER trg_post_check_restricted_update
AFTER UPDATE ON Post
FOR EACH ROW
BEGIN
    DECLARE v_restricted VARCHAR(255);
    
    -- Only check if content changed
    IF OLD.postContent != NEW.postContent THEN
        SELECT word INTO v_restricted
        FROM RestrictedWords
        WHERE LOWER(NEW.postContent) LIKE CONCAT('%', LOWER(word), '%')
        LIMIT 1;
        
        IF v_restricted IS NOT NULL THEN
            -- Check if not already flagged
            IF NOT EXISTS (
                SELECT 1 FROM FlaggedContent 
                WHERE contentType = 'Post' 
                AND contentID = NEW.postID 
                AND status IN ('pending', 'reviewing')
            ) THEN
                INSERT INTO FlaggedContent (
                    contentType,
                    contentID,
                    flaggedBy,
                    flagReason,
                    status,
                    matchedWord,
                    isHidden
                )
                VALUES (
                    'Post',
                    NEW.postID,
                    NULL,
                    CONCAT('Auto-flagged after edit: Contains restricted word "', v_restricted, '"'),
                    'pending',
                    v_restricted,
                    TRUE
                );
                
                UPDATE RestrictedWords 
                SET flagCount = flagCount + 1 
                WHERE word = v_restricted;
                
                INSERT INTO AdminNotifications (
                    notificationType,
                    title,
                    message,
                    priority,
                    relatedType,
                    relatedID
                )
                VALUES (
                    'new_flag',
                    'Edited Content Flagged',
                    CONCAT('Post #', NEW.postID, ' edited with restricted word: ', v_restricted),
                    'medium',
                    'flag',
                    LAST_INSERT_ID()
                );
            END IF;
        END IF;
    END IF;
END$$
DELIMITER ;

-- TRIGGER: Comment INSERT - Check for restricted words
DELIMITER $$
CREATE TRIGGER trg_comment_check_restricted_insert
AFTER INSERT ON Comments
FOR EACH ROW
BEGIN
    DECLARE v_restricted VARCHAR(255);
    
    SELECT word INTO v_restricted
    FROM RestrictedWords
    WHERE LOWER(NEW.commentContent) LIKE CONCAT('%', LOWER(word), '%')
    LIMIT 1;
    
    IF v_restricted IS NOT NULL THEN
        INSERT INTO FlaggedContent (
            contentType,
            contentID,
            flaggedBy,
            flagReason,
            status,
            matchedWord,
            isHidden
        )
        VALUES (
            'Comment',
            NEW.commentID,
            NULL,
            CONCAT('Auto-flagged: Contains restricted word "', v_restricted, '"'),
            'pending',
            v_restricted,
            TRUE
        );
        
        UPDATE RestrictedWords 
        SET flagCount = flagCount + 1 
        WHERE word = v_restricted;
        
        INSERT INTO AdminNotifications (
            notificationType,
            title,
            message,
            priority,
            relatedType,
            relatedID
        )
        VALUES (
            'new_flag',
            'Comment Auto-Flagged',
            CONCAT('Comment #', NEW.commentID, ' by user ', NEW.userID, ' contains: ', v_restricted),
            'medium',
            'flag',
            LAST_INSERT_ID()
        );
        
        INSERT INTO Notifications (
            receivedFROMuserID,
            triggerUserID,
            triggerEvent,
            content,
            relatedID,
            isSeen
        )
        VALUES (
            NEW.userID,
            NEW.userID,
            'post_comment',
            'Your comment is under review due to potential policy violation.',
            NEW.commentID,
            FALSE
        );
    END IF;
END$$
DELIMITER ;

-- TRIGGER: Comment UPDATE
DELIMITER $$
CREATE TRIGGER trg_comment_check_restricted_update
AFTER UPDATE ON Comments
FOR EACH ROW
BEGIN
    DECLARE v_restricted VARCHAR(255);
    
    IF OLD.commentContent != NEW.commentContent THEN
        SELECT word INTO v_restricted
        FROM RestrictedWords
        WHERE LOWER(NEW.commentContent) LIKE CONCAT('%', LOWER(word), '%')
        LIMIT 1;
        
        IF v_restricted IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1 FROM FlaggedContent 
                WHERE contentType = 'Comment' 
                AND contentID = NEW.commentID 
                AND status IN ('pending', 'reviewing')
            ) THEN
                INSERT INTO FlaggedContent (
                    contentType,
                    contentID,
                    flaggedBy,
                    flagReason,
                    status,
                    matchedWord,
                    isHidden
                )
                VALUES (
                    'Comment',
                    NEW.commentID,
                    NULL,
                    CONCAT('Auto-flagged after edit: Contains "', v_restricted, '"'),
                    'pending',
                    v_restricted,
                    TRUE
                );
                
                UPDATE RestrictedWords 
                SET flagCount = flagCount + 1 
                WHERE word = v_restricted;
            END IF;
        END IF;
    END IF;
END$$
DELIMITER ;

-- TRIGGER: Review INSERT - Check for restricted words
DELIMITER $$
CREATE TRIGGER trg_review_check_restricted_insert
AFTER INSERT ON ReviewRatings
FOR EACH ROW
BEGIN
    DECLARE v_restricted VARCHAR(255);
    
    SELECT word INTO v_restricted
    FROM RestrictedWords
    WHERE LOWER(NEW.review) LIKE CONCAT('%', LOWER(word), '%')
    LIMIT 1;
    
    IF v_restricted IS NOT NULL THEN
        INSERT INTO FlaggedContent (
            contentType,
            contentID,
            flaggedBy,
            flagReason,
            status,
            matchedWord,
            isHidden
        )
        VALUES (
            'Review',
            CONCAT(NEW.movieID, '-', NEW.userID), -- Composite key
            NULL,
            CONCAT('Auto-flagged: Contains restricted word "', v_restricted, '"'),
            'pending',
            v_restricted,
            TRUE
        );
        
        UPDATE RestrictedWords 
        SET flagCount = flagCount + 1 
        WHERE word = v_restricted;
        
        INSERT INTO AdminNotifications (
            notificationType,
            title,
            message,
            priority,
            relatedType,
            relatedID
        )
        VALUES (
            'new_flag',
            'Review Auto-Flagged',
            CONCAT('Review by user ', NEW.userID, ' for movie ', NEW.movieID, ' contains: ', v_restricted),
            'medium',
            'flag',
            LAST_INSERT_ID()
        );
        
        INSERT INTO Notifications (
            receivedFROMuserID,
            triggerUserID,
            triggerEvent,
            content,
            relatedID,
            isSeen
        )
        VALUES (
            NEW.userID,
            NEW.userID,
            'new_post',
            'Your review is under review due to potential policy violation.',
            NEW.movieID,
            FALSE
        );
    END IF;
END$$
DELIMITER ;

-- TRIGGER: Review UPDATE
DELIMITER $$
CREATE TRIGGER trg_review_check_restricted_update
AFTER UPDATE ON ReviewRatings
FOR EACH ROW
BEGIN
    DECLARE v_restricted VARCHAR(255);
    DECLARE v_contentID VARCHAR(50);
    
    IF OLD.review != NEW.review THEN
        SET v_contentID = CONCAT(NEW.movieID, '-', NEW.userID);
        
        SELECT word INTO v_restricted
        FROM RestrictedWords
        WHERE LOWER(NEW.review) LIKE CONCAT('%', LOWER(word), '%')
        LIMIT 1;
        
        IF v_restricted IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1 FROM FlaggedContent 
                WHERE contentType = 'Review' 
                AND contentID = v_contentID 
                AND status IN ('pending', 'reviewing')
            ) THEN
                INSERT INTO FlaggedContent (
                    contentType,
                    contentID,
                    flaggedBy,
                    flagReason,
                    status,
                    matchedWord,
                    isHidden
                )
                VALUES (
                    'Review',
                    v_contentID,
                    NULL,
                    CONCAT('Auto-flagged after edit: Contains "', v_restricted, '"'),
                    'pending',
                    v_restricted,
                    TRUE
                );
                
                UPDATE RestrictedWords 
                SET flagCount = flagCount + 1 
                WHERE word = v_restricted;
            END IF;
        END IF;
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- SECTION 6: VIOLATION TRACKING TRIGGER
-- Purpose: Track user violations when content is flagged
-- ============================================================

DROP TRIGGER IF EXISTS trg_flagged_content_track_violation;

DELIMITER $$
CREATE TRIGGER trg_flagged_content_track_violation
AFTER INSERT ON FlaggedContent
FOR EACH ROW
BEGIN
    DECLARE v_userID INT;
    DECLARE v_violationType VARCHAR(50);
    
    -- Get userID based on content type
    IF NEW.contentType = 'Post' THEN
        SELECT userID INTO v_userID FROM Post WHERE postID = NEW.contentID;
        SET v_violationType = 'restricted_word';
    ELSEIF NEW.contentType = 'Comment' THEN
        SELECT userID INTO v_userID FROM Comments WHERE commentID = NEW.contentID;
        SET v_violationType = 'restricted_word';
    ELSEIF NEW.contentType = 'Review' THEN
        -- Parse composite key 'movieID-userID'
        SET v_userID = CAST(SUBSTRING_INDEX(NEW.contentID, '-', -1) AS UNSIGNED);
        SET v_violationType = 'restricted_word';
    END IF;
    
    -- Create violation record
    IF v_userID IS NOT NULL THEN
        INSERT INTO UserViolations (
            userID,
            violationType,
            relatedFlagID
        )
        VALUES (
            v_userID,
            v_violationType,
            NEW.flagID
        );
        
        -- Check if user has multiple violations (repeat offender)
        IF (SELECT COUNT(*) FROM UserViolations WHERE userID = v_userID) >= 3 THEN
            -- Create high-priority admin notification for repeat offender
            INSERT INTO AdminNotifications (
                notificationType,
                title,
                message,
                priority,
                relatedType,
                relatedID
            )
            VALUES (
                'repeat_offender',
                'Repeat Offender Detected',
                CONCAT('User #', v_userID, ' has 3+ violations. Review required for potential suspension.'),
                'high',
                'user',
                v_userID
            );
        END IF;
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'Audit and auto-flagging triggers created successfully!' as Status;

-- Show created triggers
SHOW TRIGGERS WHERE `Trigger` LIKE 'trg_%';
