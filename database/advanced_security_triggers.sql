-- ============================================================
-- ADVANCED SECURITY EVENT LOGGING - MySQL Triggers & Functions
-- Purpose: Automatic detection of SQL injection, XSS, and suspicious activity
-- Created: December 10, 2025
-- ============================================================

USE 3movieCollectors;

-- ============================================================
-- FUNCTION: Detect SQL Injection Patterns
-- Returns TRUE if SQL injection pattern detected
-- ============================================================
DROP FUNCTION IF EXISTS fn_detect_sql_injection;
DELIMITER $$
CREATE FUNCTION fn_detect_sql_injection(p_input TEXT)
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE v_has_sql BOOLEAN DEFAULT FALSE;
    
    -- Check for SQL keywords and patterns
    IF p_input IS NOT NULL AND (
        p_input REGEXP '(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|DECLARE)[[:space:]]' OR
        p_input REGEXP '(--|#|/\\*|\\*/|;)' OR
        p_input REGEXP '(["\']|\\\\)' OR
        p_input REGEXP '(1=1|1=0|OR[[:space:]]+[0-9]+=)' OR
        p_input REGEXP '(SLEEP|BENCHMARK|WAITFOR)[[:space:]]*\\(' OR
        p_input REGEXP '(xp_|sp_|sys\\.)' OR
        p_input REGEXP '(CAST|CONVERT)[[:space:]]*\\('
    ) THEN
        SET v_has_sql = TRUE;
    END IF;
    
    RETURN v_has_sql;
END$$
DELIMITER ;

-- ============================================================
-- FUNCTION: Detect XSS Patterns
-- Returns TRUE if XSS pattern detected
-- ============================================================
DROP FUNCTION IF EXISTS fn_detect_xss;
DELIMITER $$
CREATE FUNCTION fn_detect_xss(p_input TEXT)
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE v_has_xss BOOLEAN DEFAULT FALSE;
    
    -- Check for XSS patterns
    IF p_input IS NOT NULL AND (
        p_input REGEXP '<script[^>]*>' OR
        p_input REGEXP 'javascript:' OR
        p_input REGEXP 'on(load|error|click|mouse|focus)[[:space:]]*=' OR
        p_input REGEXP '<iframe' OR
        p_input REGEXP '<object' OR
        p_input REGEXP '<embed' OR
        p_input REGEXP 'eval[[:space:]]*\\(' OR
        p_input REGEXP 'expression[[:space:]]*\\(' OR
        p_input REGEXP 'vbscript:' OR
        p_input REGEXP '<img[^>]+src[[:space:]]*=[[:space:]]*["\']?javascript'
    ) THEN
        SET v_has_xss = TRUE;
    END IF;
    
    RETURN v_has_xss;
END$$
DELIMITER ;

-- ============================================================
-- FUNCTION: Calculate User Risk Score
-- Returns risk score (0-100) based on recent activities
-- ============================================================
DROP FUNCTION IF EXISTS fn_user_risk_score;
DELIMITER $$
CREATE FUNCTION fn_user_risk_score(p_userID INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_score INT DEFAULT 0;
    DECLARE v_violations INT;
    DECLARE v_recent_flags INT;
    DECLARE v_security_events INT;
    
    -- Check violations
    SELECT COUNT(*) INTO v_violations
    FROM UserViolations
    WHERE userID = p_userID;
    
    -- Check recent flagged content
    SELECT COUNT(*) INTO v_recent_flags
    FROM FlaggedContent fc
    LEFT JOIN Post p ON fc.contentType = 'Post' AND fc.contentID = p.postID
    LEFT JOIN Comments c ON fc.contentType = 'Comment' AND fc.contentID = c.commentID
    LEFT JOIN ReviewRatings r ON fc.contentType = 'Review' AND fc.contentID = CONCAT(r.movieID, '-', r.userID)
    WHERE (p.userID = p_userID OR c.userID = p_userID OR r.userID = p_userID)
      AND fc.flaggedDate >= DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    -- Check security events
    SELECT COUNT(*) INTO v_security_events
    FROM SecurityEvents
    WHERE userID = p_userID
      AND eventDate >= DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- Calculate score
    SET v_score = (v_violations * 20) + (v_recent_flags * 15) + (v_security_events * 10);
    
    -- Cap at 100
    IF v_score > 100 THEN
        SET v_score = 100;
    END IF;
    
    RETURN v_score;
END$$
DELIMITER ;

-- ============================================================
-- TRIGGER: Auto-detect SQL Injection in Posts
-- ============================================================
DROP TRIGGER IF EXISTS trg_post_sql_injection;
DELIMITER $$
CREATE TRIGGER trg_post_sql_injection
BEFORE INSERT ON Post
FOR EACH ROW
BEGIN
    DECLARE v_username VARCHAR(255);
    
    -- Check for SQL injection
    IF fn_detect_sql_injection(NEW.postContent) THEN
        -- Get username
        SELECT username INTO v_username FROM User WHERE userID = NEW.userID;
        
        -- Log security event
        INSERT INTO SecurityEvents (
            eventType,
            userID,
            username,
            ipAddress,
            requestPath,
            requestMethod,
            description,
            severity,
            isReviewed
        ) VALUES (
            'sql_injection_attempt',
            NEW.userID,
            v_username,
            '0.0.0.0', -- Will be updated by application if available
            '/api/posts/create',
            'POST',
            CONCAT('SQL injection pattern detected in post content: ', SUBSTRING(NEW.postContent, 1, 200)),
            'critical',
            FALSE
        );
        
        -- Block the insert
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Content contains potentially malicious code';
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- TRIGGER: Auto-detect XSS in Posts
-- ============================================================
DROP TRIGGER IF EXISTS trg_post_xss;
DELIMITER $$
CREATE TRIGGER trg_post_xss
BEFORE INSERT ON Post
FOR EACH ROW
BEGIN
    DECLARE v_username VARCHAR(255);
    
    -- Check for XSS
    IF fn_detect_xss(NEW.postContent) THEN
        -- Get username
        SELECT username INTO v_username FROM User WHERE userID = NEW.userID;
        
        -- Log security event
        INSERT INTO SecurityEvents (
            eventType,
            userID,
            username,
            ipAddress,
            requestPath,
            requestMethod,
            description,
            severity,
            isReviewed
        ) VALUES (
            'xss_attempt',
            NEW.userID,
            v_username,
            '0.0.0.0',
            '/api/posts/create',
            'POST',
            CONCAT('XSS payload detected in post content: ', SUBSTRING(NEW.postContent, 1, 200)),
            'high',
            FALSE
        );
        
        -- Block the insert
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Content contains potentially malicious code';
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- TRIGGER: Auto-detect SQL Injection in Comments
-- ============================================================
DROP TRIGGER IF EXISTS trg_comment_sql_injection;
DELIMITER $$
CREATE TRIGGER trg_comment_sql_injection
BEFORE INSERT ON Comments
FOR EACH ROW
BEGIN
    DECLARE v_username VARCHAR(255);
    
    IF fn_detect_sql_injection(NEW.commentContent) THEN
        SELECT username INTO v_username FROM User WHERE userID = NEW.userID;
        
        INSERT INTO SecurityEvents (
            eventType, userID, username, ipAddress, requestPath, requestMethod, description, severity, isReviewed
        ) VALUES (
            'sql_injection_attempt', NEW.userID, v_username, '0.0.0.0', '/api/comments/create', 'POST',
            CONCAT('SQL injection in comment: ', SUBSTRING(NEW.commentContent, 1, 200)), 'critical', FALSE
        );
        
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Content contains potentially malicious code';
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- TRIGGER: Auto-detect XSS in Comments
-- ============================================================
DROP TRIGGER IF EXISTS trg_comment_xss;
DELIMITER $$
CREATE TRIGGER trg_comment_xss
BEFORE INSERT ON Comments
FOR EACH ROW
BEGIN
    DECLARE v_username VARCHAR(255);
    
    IF fn_detect_xss(NEW.commentContent) THEN
        SELECT username INTO v_username FROM User WHERE userID = NEW.userID;
        
        INSERT INTO SecurityEvents (
            eventType, userID, username, ipAddress, requestPath, requestMethod, description, severity, isReviewed
        ) VALUES (
            'xss_attempt', NEW.userID, v_username, '0.0.0.0', '/api/comments/create', 'POST',
            CONCAT('XSS in comment: ', SUBSTRING(NEW.commentContent, 1, 200)), 'high', FALSE
        );
        
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Content contains potentially malicious code';
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- TRIGGER: Auto-detect SQL Injection in Reviews
-- ============================================================
DROP TRIGGER IF EXISTS trg_review_sql_injection;
DELIMITER $$
CREATE TRIGGER trg_review_sql_injection
BEFORE INSERT ON ReviewRatings
FOR EACH ROW
BEGIN
    DECLARE v_username VARCHAR(255);
    
    IF NEW.review IS NOT NULL AND fn_detect_sql_injection(NEW.review) THEN
        SELECT username INTO v_username FROM User WHERE userID = NEW.userID;
        
        INSERT INTO SecurityEvents (
            eventType, userID, username, ipAddress, requestPath, requestMethod, description, severity, isReviewed
        ) VALUES (
            'sql_injection_attempt', NEW.userID, v_username, '0.0.0.0', '/api/reviews/create', 'POST',
            CONCAT('SQL injection in review: ', SUBSTRING(NEW.review, 1, 200)), 'critical', FALSE
        );
        
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Content contains potentially malicious code';
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- TRIGGER: Auto-detect XSS in Reviews
-- ============================================================
DROP TRIGGER IF EXISTS trg_review_xss;
DELIMITER $$
CREATE TRIGGER trg_review_xss
BEFORE INSERT ON ReviewRatings
FOR EACH ROW
BEGIN
    DECLARE v_username VARCHAR(255);
    
    IF NEW.review IS NOT NULL AND fn_detect_xss(NEW.review) THEN
        SELECT username INTO v_username FROM User WHERE userID = NEW.userID;
        
        INSERT INTO SecurityEvents (
            eventType, userID, username, ipAddress, requestPath, requestMethod, description, severity, isReviewed
        ) VALUES (
            'xss_attempt', NEW.userID, v_username, '0.0.0.0', '/api/reviews/create', 'POST',
            CONCAT('XSS in review: ', SUBSTRING(NEW.review, 1, 200)), 'high', FALSE
        );
        
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Content contains potentially malicious code';
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- TRIGGER: Detect Suspicious Activity - Rapid Content Creation
-- ============================================================
DROP TRIGGER IF EXISTS trg_detect_spam;
DELIMITER $$
CREATE TRIGGER trg_detect_spam
AFTER INSERT ON Post
FOR EACH ROW
BEGIN
    DECLARE v_recent_posts INT;
    DECLARE v_username VARCHAR(255);
    DECLARE v_risk_score INT;
    
    -- Count posts in last 5 minutes
    SELECT COUNT(*) INTO v_recent_posts
    FROM Post
    WHERE userID = NEW.userID
      AND createdAt >= DATE_SUB(NOW(), INTERVAL 5 MINUTE);
    
    -- If more than 5 posts in 5 minutes, log suspicious activity
    IF v_recent_posts > 5 THEN
        SELECT username INTO v_username FROM User WHERE userID = NEW.userID;
        SET v_risk_score = fn_user_risk_score(NEW.userID);
        
        INSERT INTO SecurityEvents (
            eventType, userID, username, ipAddress, requestPath, requestMethod, description, severity, isReviewed
        ) VALUES (
            'suspicious_activity', NEW.userID, v_username, '0.0.0.0', '/api/posts/create', 'POST',
            CONCAT('Rapid posting detected: ', v_recent_posts, ' posts in 5 minutes. Risk score: ', v_risk_score),
            CASE WHEN v_risk_score >= 50 THEN 'high' ELSE 'medium' END,
            FALSE
        );
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- Grant permissions
-- ============================================================
GRANT EXECUTE ON FUNCTION 3movieCollectors.fn_detect_sql_injection TO 'root'@'localhost';
GRANT EXECUTE ON FUNCTION 3movieCollectors.fn_detect_xss TO 'root'@'localhost';
GRANT EXECUTE ON FUNCTION 3movieCollectors.fn_user_risk_score TO 'root'@'localhost';
