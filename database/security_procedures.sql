-- ============================================================
-- SECURITY EVENT LOGGING PROCEDURES
-- Purpose: Automatically log security events using stored procedures
-- Created: December 10, 2025
-- ============================================================

USE 3movieCollectors;

-- Drop existing procedures if they exist
DROP PROCEDURE IF EXISTS sp_log_failed_login;
DROP PROCEDURE IF EXISTS sp_log_brute_force;
DROP PROCEDURE IF EXISTS sp_log_unauthorized_access;
DROP PROCEDURE IF EXISTS sp_log_suspicious_activity;
DROP PROCEDURE IF EXISTS sp_log_sql_injection;
DROP PROCEDURE IF EXISTS sp_log_xss_attempt;
DROP PROCEDURE IF EXISTS sp_check_brute_force;

-- ============================================================
-- PROCEDURE: Log Failed Login Attempt
-- Called when a login fails due to incorrect credentials
-- ============================================================
DELIMITER $$
CREATE PROCEDURE sp_log_failed_login(
    IN p_username VARCHAR(255),
    IN p_ipAddress VARCHAR(45),
    IN p_userAgent VARCHAR(511),
    IN p_reason VARCHAR(255)
)
BEGIN
    DECLARE v_userID INT DEFAULT NULL;
    DECLARE v_severity ENUM('low', 'medium', 'high', 'critical');
    
    -- Try to get userID if username exists
    SELECT userID INTO v_userID 
    FROM User 
    WHERE username = p_username 
    LIMIT 1;
    
    -- Determine severity based on reason
    SET v_severity = CASE 
        WHEN p_reason LIKE '%locked%' THEN 'medium'
        WHEN p_reason LIKE '%suspended%' THEN 'medium'
        ELSE 'low'
    END;
    
    -- Insert security event
    INSERT INTO SecurityEvents (
        eventType,
        userID,
        username,
        ipAddress,
        userAgent,
        requestPath,
        requestMethod,
        description,
        severity,
        isReviewed
    )
    VALUES (
        'failed_login',
        v_userID,
        p_username,
        p_ipAddress,
        p_userAgent,
        '/api/auth/login',
        'POST',
        p_reason,
        v_severity,
        FALSE
    );
    
    -- Check for brute force pattern
    CALL sp_check_brute_force(p_ipAddress, p_userAgent);
END$$
DELIMITER ;

-- ============================================================
-- PROCEDURE: Check for Brute Force Attempts
-- Analyzes recent failed logins to detect brute force patterns
-- ============================================================
DELIMITER $$
CREATE PROCEDURE sp_check_brute_force(
    IN p_ipAddress VARCHAR(45),
    IN p_userAgent VARCHAR(511)
)
BEGIN
    DECLARE v_recentFailures INT;
    DECLARE v_timeWindow INT DEFAULT 5; -- minutes
    
    -- Count failed logins from this IP in last N minutes
    SELECT COUNT(*) INTO v_recentFailures
    FROM SecurityEvents
    WHERE eventType = 'failed_login'
      AND ipAddress = p_ipAddress
      AND eventDate >= DATE_SUB(NOW(), INTERVAL v_timeWindow MINUTE);
    
    -- If threshold exceeded, log brute force attempt
    IF v_recentFailures >= 5 THEN
        INSERT INTO SecurityEvents (
            eventType,
            userID,
            username,
            ipAddress,
            userAgent,
            requestPath,
            requestMethod,
            description,
            severity,
            isReviewed
        )
        VALUES (
            'brute_force_attempt',
            NULL,
            'multiple_users',
            p_ipAddress,
            p_userAgent,
            '/api/auth/login',
            'POST',
            CONCAT(v_recentFailures, ' failed login attempts in ', v_timeWindow, ' minutes from same IP'),
            'critical',
            FALSE
        );
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- PROCEDURE: Log Unauthorized Access Attempt
-- Called when a user tries to access admin-only resources
-- ============================================================
DELIMITER $$
CREATE PROCEDURE sp_log_unauthorized_access(
    IN p_userID INT,
    IN p_username VARCHAR(255),
    IN p_ipAddress VARCHAR(45),
    IN p_userAgent VARCHAR(511),
    IN p_requestPath VARCHAR(511),
    IN p_requestMethod VARCHAR(10),
    IN p_attemptedAction VARCHAR(255)
)
BEGIN
    DECLARE v_severity ENUM('low', 'medium', 'high', 'critical');
    
    -- Determine severity based on attempted action
    SET v_severity = CASE 
        WHEN p_requestPath LIKE '%admin%' THEN 'high'
        WHEN p_requestPath LIKE '%delete%' THEN 'high'
        WHEN p_requestPath LIKE '%moderation%' THEN 'medium'
        ELSE 'medium'
    END;
    
    INSERT INTO SecurityEvents (
        eventType,
        userID,
        username,
        ipAddress,
        userAgent,
        requestPath,
        requestMethod,
        description,
        severity,
        isReviewed
    )
    VALUES (
        'unauthorized_access',
        p_userID,
        p_username,
        p_ipAddress,
        p_userAgent,
        p_requestPath,
        p_requestMethod,
        p_attemptedAction,
        v_severity,
        FALSE
    );
END$$
DELIMITER ;

-- ============================================================
-- PROCEDURE: Log Suspicious Activity
-- Called when unusual patterns or behaviors are detected
-- ============================================================
DELIMITER $$
CREATE PROCEDURE sp_log_suspicious_activity(
    IN p_userID INT,
    IN p_username VARCHAR(255),
    IN p_ipAddress VARCHAR(45),
    IN p_userAgent VARCHAR(511),
    IN p_requestPath VARCHAR(511),
    IN p_requestMethod VARCHAR(10),
    IN p_description VARCHAR(1023),
    IN p_severity ENUM('low', 'medium', 'high', 'critical')
)
BEGIN
    INSERT INTO SecurityEvents (
        eventType,
        userID,
        username,
        ipAddress,
        userAgent,
        requestPath,
        requestMethod,
        description,
        severity,
        isReviewed
    )
    VALUES (
        'suspicious_activity',
        p_userID,
        p_username,
        p_ipAddress,
        p_userAgent,
        p_requestPath,
        p_requestMethod,
        p_description,
        p_severity,
        FALSE
    );
END$$
DELIMITER ;

-- ============================================================
-- PROCEDURE: Log SQL Injection Attempt
-- Called when SQL injection patterns are detected in input
-- ============================================================
DELIMITER $$
CREATE PROCEDURE sp_log_sql_injection(
    IN p_userID INT,
    IN p_username VARCHAR(255),
    IN p_ipAddress VARCHAR(45),
    IN p_userAgent VARCHAR(511),
    IN p_requestPath VARCHAR(511),
    IN p_requestMethod VARCHAR(10),
    IN p_maliciousInput VARCHAR(1023)
)
BEGIN
    INSERT INTO SecurityEvents (
        eventType,
        userID,
        username,
        ipAddress,
        userAgent,
        requestPath,
        requestMethod,
        description,
        severity,
        isReviewed
    )
    VALUES (
        'sql_injection_attempt',
        p_userID,
        p_username,
        p_ipAddress,
        p_userAgent,
        p_requestPath,
        p_requestMethod,
        CONCAT('SQL injection pattern detected: ', SUBSTRING(p_maliciousInput, 1, 200)),
        'critical',
        FALSE
    );
END$$
DELIMITER ;

-- ============================================================
-- PROCEDURE: Log XSS Attempt
-- Called when XSS patterns are detected in user input
-- ============================================================
DELIMITER $$
CREATE PROCEDURE sp_log_xss_attempt(
    IN p_userID INT,
    IN p_username VARCHAR(255),
    IN p_ipAddress VARCHAR(45),
    IN p_userAgent VARCHAR(511),
    IN p_requestPath VARCHAR(511),
    IN p_requestMethod VARCHAR(10),
    IN p_maliciousInput VARCHAR(1023)
)
BEGIN
    INSERT INTO SecurityEvents (
        eventType,
        userID,
        username,
        ipAddress,
        userAgent,
        requestPath,
        requestMethod,
        description,
        severity,
        isReviewed
    )
    VALUES (
        'xss_attempt',
        p_userID,
        p_username,
        p_ipAddress,
        p_userAgent,
        p_requestPath,
        p_requestMethod,
        CONCAT('XSS payload detected: ', SUBSTRING(p_maliciousInput, 1, 200)),
        'high',
        FALSE
    );
END$$
DELIMITER ;

-- ============================================================
-- Grant execute permissions to web application user
-- ============================================================
GRANT EXECUTE ON PROCEDURE 3movieCollectors.sp_log_failed_login TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE 3movieCollectors.sp_log_brute_force TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE 3movieCollectors.sp_log_unauthorized_access TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE 3movieCollectors.sp_log_suspicious_activity TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE 3movieCollectors.sp_log_sql_injection TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE 3movieCollectors.sp_log_xss_attempt TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE 3movieCollectors.sp_check_brute_force TO 'root'@'localhost';
