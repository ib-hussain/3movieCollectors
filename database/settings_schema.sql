-- Settings Feature Database Schema
-- Add profilePicture and isDeleted columns to User table
-- Create triggers for email/username uniqueness validation

USE 3moviecollectors;

-- Check and add columns
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = '3moviecollectors' AND TABLE_NAME = 'User' AND COLUMN_NAME = 'profilePicture';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE User ADD COLUMN profilePicture VARCHAR(255) DEFAULT NULL', 
    'SELECT "profilePicture column already exists" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = '3moviecollectors' AND TABLE_NAME = 'User' AND COLUMN_NAME = 'isDeleted';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE User ADD COLUMN isDeleted BOOLEAN DEFAULT FALSE', 
    'SELECT "isDeleted column already exists" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add index
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = '3moviecollectors' AND TABLE_NAME = 'User' AND INDEX_NAME = 'idx_isDeleted';

SET @query = IF(@index_exists = 0, 
    'CREATE INDEX idx_isDeleted ON User(isDeleted)', 
    'SELECT "idx_isDeleted index already exists" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===========================
-- TRIGGER 1: Validate Email Uniqueness on Update
-- ===========================
DROP TRIGGER IF EXISTS before_user_update_email;

DELIMITER $$
CREATE TRIGGER before_user_update_email
BEFORE UPDATE ON User
FOR EACH ROW
BEGIN
    -- Only check if email is being changed
    IF NEW.email != OLD.email THEN
        -- Check if new email already exists for another active user
        IF EXISTS (
            SELECT 1 FROM User 
            WHERE email = NEW.email 
            AND userID != NEW.userID 
            AND isDeleted = FALSE
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Email already exists';
        END IF;
    END IF;
END$$
DELIMITER ;

-- ===========================
-- TRIGGER 2: Validate Username Uniqueness on Update
-- ===========================
DROP TRIGGER IF EXISTS before_user_update_username;

DELIMITER $$
CREATE TRIGGER before_user_update_username
BEFORE UPDATE ON User
FOR EACH ROW
BEGIN
    -- Only check if username is being changed
    IF NEW.username != OLD.username THEN
        -- Check if new username already exists for another active user
        IF EXISTS (
            SELECT 1 FROM User 
            WHERE username = NEW.username 
            AND userID != NEW.userID 
            AND isDeleted = FALSE
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Username already exists';
        END IF;
    END IF;
END$$
DELIMITER ;

-- ===========================
-- STORED PROCEDURE: Soft Delete User Account
-- ===========================
DROP PROCEDURE IF EXISTS soft_delete_user_account;

DELIMITER $$
CREATE PROCEDURE soft_delete_user_account(
    IN p_userID INT,
    IN p_password VARCHAR(255)
)
BEGIN
    DECLARE v_storedPassword VARCHAR(255);
    DECLARE v_isDeleted BOOLEAN;
    
    -- Get user's current password and deletion status
    SELECT password, isDeleted INTO v_storedPassword, v_isDeleted
    FROM User
    WHERE userID = p_userID;
    
    -- Check if user exists
    IF v_storedPassword IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User not found';
    END IF;
    
    -- Check if already deleted
    IF v_isDeleted = TRUE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Account already deleted';
    END IF;
    
    -- Verify password (bcrypt comparison will be done in Node.js)
    -- This procedure assumes password is already verified
    
    -- Perform soft delete
    UPDATE User
    SET isDeleted = TRUE
    WHERE userID = p_userID;
    
    -- Return success
    SELECT 'Account deleted successfully' as message;
END$$
DELIMITER ;

-- ===========================
-- FUNCTION: Check Password Strength
-- ===========================
DROP FUNCTION IF EXISTS check_password_strength;

DELIMITER $$
CREATE FUNCTION check_password_strength(p_password VARCHAR(255))
RETURNS VARCHAR(100)
DETERMINISTIC
BEGIN
    -- Check length
    IF LENGTH(p_password) < 8 THEN
        RETURN 'Password must be at least 8 characters';
    END IF;
    
    -- Check for uppercase
    IF p_password NOT REGEXP '[A-Z]' THEN
        RETURN 'Password must contain at least one uppercase letter';
    END IF;
    
    -- Check for lowercase
    IF p_password NOT REGEXP '[a-z]' THEN
        RETURN 'Password must contain at least one lowercase letter';
    END IF;
    
    -- Check for number
    IF p_password NOT REGEXP '[0-9]' THEN
        RETURN 'Password must contain at least one number';
    END IF;
    
    RETURN 'OK';
END$$
DELIMITER ;

-- ===========================
-- VIEW: Active Users Only
-- ===========================
DROP VIEW IF EXISTS ActiveUsers;

CREATE VIEW ActiveUsers AS
SELECT 
    userID,
    username,
    name,
    email,
    profilePicture,
    registrationDate,
    role
FROM User
WHERE isDeleted = FALSE;

-- Verify changes
DESCRIBE User;
SHOW TRIGGERS LIKE 'User';
SHOW PROCEDURE STATUS WHERE Db = '3moviecollectors' AND Name LIKE '%user%';
SHOW FUNCTION STATUS WHERE Db = '3moviecollectors' AND Name LIKE '%password%';
