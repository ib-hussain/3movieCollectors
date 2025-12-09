-- ============================================================
-- ADMIN FEATURE - MYSQL FUNCTIONS
-- ============================================================
-- Purpose: Reusable utility functions for queries and logic
-- Created: December 9, 2025
-- Dependencies: Requires admin_schema.sql
-- ============================================================

USE 3movieCollectors;

-- ============================================================
-- SECTION 1: USER & PERMISSION FUNCTIONS
-- ============================================================

-- Drop existing functions if any
DROP FUNCTION IF EXISTS fn_is_admin;
DROP FUNCTION IF EXISTS fn_user_activity_score;
DROP FUNCTION IF EXISTS fn_user_violation_count;

-- FUNCTION: Check if user is admin
DELIMITER $$
CREATE FUNCTION fn_is_admin(p_userID INT)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_isAdmin BOOLEAN DEFAULT FALSE;
    
    SELECT (role = 'admin') INTO v_isAdmin
    FROM User
    WHERE userID = p_userID;
    
    RETURN IFNULL(v_isAdmin, FALSE);
END$$
DELIMITER ;

-- FUNCTION: Calculate user activity score
-- Score = (posts * 1) + (comments * 1) + (reviews * 2) + (watchlist * 0.5)
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
    DECLARE v_watchlist INT;
    
    -- Count posts
    SELECT COUNT(*) INTO v_posts
    FROM Post
    WHERE userID = p_userID;
    
    -- Count comments
    SELECT COUNT(*) INTO v_comments
    FROM Comments
    WHERE userID = p_userID;
    
    -- Count reviews
    SELECT COUNT(*) INTO v_reviews
    FROM ReviewRatings
    WHERE userID = p_userID;
    
    -- Count watchlist items
    SELECT COUNT(*) INTO v_watchlist
    FROM Watchlist
    WHERE userID = p_userID;
    
    -- Calculate weighted score
    SET v_score = (v_posts * 1) + (v_comments * 1) + (v_reviews * 2) + FLOOR(v_watchlist * 0.5);
    
    RETURN v_score;
END$$
DELIMITER ;

-- FUNCTION: Get user violation count
DELIMITER $$
CREATE FUNCTION fn_user_violation_count(p_userID INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_count
    FROM UserViolations
    WHERE userID = p_userID;
    
    RETURN v_count;
END$$
DELIMITER ;

-- ============================================================
-- SECTION 2: CONTENT FILTERING FUNCTIONS
-- ============================================================

DROP FUNCTION IF EXISTS fn_contains_restricted_word;

-- FUNCTION: Check if text contains restricted word (case-insensitive)
-- Returns the first matched restricted word, or NULL if none found
DELIMITER $$
CREATE FUNCTION fn_contains_restricted_word(p_text TEXT)
RETURNS VARCHAR(255)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_word VARCHAR(255) DEFAULT NULL;
    
    -- Find first matching restricted word (case-insensitive)
    SELECT word INTO v_word
    FROM RestrictedWords
    WHERE LOWER(p_text) LIKE CONCAT('%', LOWER(word), '%')
    LIMIT 1;
    
    RETURN v_word;
END$$
DELIMITER ;

-- ============================================================
-- SECTION 3: MOVIE & CONTENT SCORING FUNCTIONS
-- ============================================================

DROP FUNCTION IF EXISTS fn_movie_discussion_score;

-- FUNCTION: Calculate movie discussion score
-- Score = (posts * 3) + (comments * 1) + (unique posters * 5)
DELIMITER $$
CREATE FUNCTION fn_movie_discussion_score(p_movieID INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_score INT DEFAULT 0;
    DECLARE v_posts INT;
    DECLARE v_comments INT;
    DECLARE v_uniquePosters INT;
    
    -- Count posts for this movie
    SELECT COUNT(*) INTO v_posts
    FROM Post
    WHERE movieID = p_movieID;
    
    -- Count comments on posts about this movie
    SELECT COUNT(*) INTO v_comments
    FROM Comments c
    INNER JOIN Post p ON c.postID = p.postID
    WHERE p.movieID = p_movieID;
    
    -- Count unique users who posted
    SELECT COUNT(DISTINCT userID) INTO v_uniquePosters
    FROM Post
    WHERE movieID = p_movieID;
    
    -- Calculate weighted score
    SET v_score = (v_posts * 3) + (v_comments * 1) + (v_uniquePosters * 5);
    
    RETURN v_score;
END$$
DELIMITER ;

-- ============================================================
-- USAGE EXAMPLES
-- ============================================================

-- Example 1: Check if user is admin
-- SELECT fn_is_admin(1) as IsAdmin;

-- Example 2: Get user activity score
-- SELECT 
--     userID, 
--     username, 
--     fn_user_activity_score(userID) as ActivityScore
-- FROM User
-- ORDER BY ActivityScore DESC
-- LIMIT 10;

-- Example 3: Check if text contains restricted word
-- SELECT fn_contains_restricted_word('This is some sample text') as RestrictedWord;

-- Example 4: Get movie discussion scores
-- SELECT 
--     movieID,
--     title,
--     fn_movie_discussion_score(movieID) as DiscussionScore
-- FROM Movie
-- ORDER BY DiscussionScore DESC
-- LIMIT 10;

-- Example 5: Get user violation counts
-- SELECT 
--     u.userID,
--     u.username,
--     fn_user_violation_count(u.userID) as ViolationCount
-- FROM User u
-- WHERE u.role = 'user'
-- HAVING ViolationCount > 0
-- ORDER BY ViolationCount DESC;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'All MySQL functions created successfully!' as Status;

-- Show created functions
SHOW FUNCTION STATUS WHERE Db = '3movieCollectors' AND Name LIKE 'fn_%';
