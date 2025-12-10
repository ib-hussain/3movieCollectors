-- ============================================================
-- ADMIN FEATURE - ENHANCED SCHEMA
-- ============================================================
-- Purpose: Additional tables and enhancements for admin functionality
-- Created: December 9, 2025
-- Dependencies: Requires base schema.sql to be executed first
-- ============================================================

USE 3movieCollectors;

-- ============================================================
-- TABLE: FlaggedContent
-- Purpose: Track content flagged for moderation (auto or manual)
-- Features: Auto-hide capability, violation tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS FlaggedContent(
    flagID INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Content identification
    contentType ENUM('Post', 'Comment', 'Review', 'Message') NOT NULL,
    contentID VARCHAR(50) NOT NULL, -- Can be INT or composite key like 'movieID-userID'
    
    -- Flagging details (system-triggered only)
    flaggedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Status tracking
    status ENUM('pending', 'reviewing', 'resolved', 'dismissed') DEFAULT 'pending',
    isHidden BOOLEAN DEFAULT FALSE, -- TRUE = content hidden from public view
    
    -- Admin review
    reviewedBy INT,
    FOREIGN KEY (reviewedBy) REFERENCES User(userID) ON DELETE SET NULL,
    reviewedDate DATETIME,
    adminNotes VARCHAR(2047),
    
    -- Auto-flagging metadata
    matchedWord VARCHAR(255), -- Restricted word that triggered flag
    
    -- Indexes for performance
    INDEX idx_status (status),
    INDEX idx_content (contentType, contentID),
    INDEX idx_flagged_date (flaggedDate),
    INDEX idx_is_hidden (isHidden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: AdminReports
-- Purpose: Store generated reports with metadata
-- Features: JSON data storage, PDF metadata, retention
-- ============================================================
CREATE TABLE IF NOT EXISTS AdminReports(
    reportID INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Report identification
    reportType ENUM(
        'top_watched_movies', 
        'highest_rated_movies', 
        'most_active_users', 
        'popular_forums',
        'user_growth',
        'content_statistics',
        'moderation_summary',
        'system_health'
    ) NOT NULL,
    
    -- Generation metadata
    generatedBy INT NOT NULL,
    FOREIGN KEY (generatedBy) REFERENCES User(userID) ON DELETE CASCADE,
    generatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Report data
    reportData JSON, -- Store report results as JSON
    reportPeriod VARCHAR(50), -- e.g., "Last 30 days", "All time", "2024-12"
    
    -- Parameters used
    reportParams JSON, -- Store limit, filters, etc.
    
    -- Export metadata
    pdfGenerated BOOLEAN DEFAULT FALSE,
    pdfPath VARCHAR(511),
    pdfGeneratedDate DATETIME,
    
    -- Indexes
    INDEX idx_report_type (reportType),
    INDEX idx_generated_date (generatedDate),
    INDEX idx_generated_by (generatedBy)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: UserViolations
-- Purpose: Track user violations for repeat offender detection
-- Features: Auto-tracking via triggers, suspension workflow
-- ============================================================
CREATE TABLE IF NOT EXISTS UserViolations(
    violationID INT AUTO_INCREMENT PRIMARY KEY,
    
    -- User identification
    userID INT NOT NULL,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE,
    
    -- Violation details
    violationType ENUM('restricted_word') NOT NULL DEFAULT 'restricted_word',
    violationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Related content
    relatedFlagID INT,
    FOREIGN KEY (relatedFlagID) REFERENCES FlaggedContent(flagID) ON DELETE SET NULL,
    
    -- Admin action
    actionTaken ENUM('warning', 'content_deleted', 'suspended', 'none') DEFAULT 'none',
    actionBy INT,
    FOREIGN KEY (actionBy) REFERENCES User(userID) ON DELETE SET NULL,
    actionDate DATETIME,
    actionNotes VARCHAR(1023),
    
    -- Indexes
    INDEX idx_user_id (userID),
    INDEX idx_violation_date (violationDate),
    INDEX idx_violation_type (violationType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: AdminNotifications
-- Purpose: Admin-specific notifications (separate from user notifications)
-- Features: Push notification queue, priority levels
-- ============================================================
CREATE TABLE IF NOT EXISTS AdminNotifications(
    notificationID INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Notification details
    notificationType ENUM(
        'new_flag',
        'repeat_offender',
        'system_alert',
        'high_activity',
        'security_event',
        'backup_status'
    ) NOT NULL,
    
    -- Content
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1023) NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    
    -- Related data
    relatedType VARCHAR(50), -- 'flag', 'user', 'report', etc.
    relatedID INT,
    
    -- Delivery tracking
    createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    isSent BOOLEAN DEFAULT FALSE,
    sentDate DATETIME,
    
    -- Read tracking (for in-app display)
    isRead BOOLEAN DEFAULT FALSE,
    readBy INT,
    FOREIGN KEY (readBy) REFERENCES User(userID) ON DELETE SET NULL,
    readDate DATETIME,
    
    -- Indexes
    INDEX idx_is_sent (isSent),
    INDEX idx_is_read (isRead),
    INDEX idx_priority (priority),
    INDEX idx_notification_type (notificationType),
    INDEX idx_created_date (createdDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: UserNotifications (Enhancement)
-- Purpose: User notifications for content moderation actions
-- Note: Extends existing Notifications table functionality
-- ============================================================
-- We'll use existing Notifications table but add new trigger event types
-- via ALTER if needed, or handle in application layer

-- ============================================================
-- TABLE ENHANCEMENTS: AuditLog
-- Purpose: Add IP address and user agent tracking + expand ENUM
-- ============================================================

-- Expand operationPerformed ENUM to include new admin operations
ALTER TABLE AuditLog 
MODIFY COLUMN operationPerformed ENUM(
    'INSERT', 'UPDATE', 'DELETE CONTENT', 'MODERATION', 'MANAGEMENT', 
    'REPORT CREATION', 'VIEW RESTRICTED CONTENT', 'DISMISS FLAG', 
    'RESCAN', 'BACKUP', 'CLEANUP', 'AUTOMATED CHECK', 'AUTOMATED BACKUP'
) NOT NULL;

-- Add columns to AuditLog (skip if they exist)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'AuditLog' AND COLUMN_NAME = 'actionDetails');
SET @sql_text = IF(@col_exists = 0, 
    'ALTER TABLE AuditLog ADD COLUMN actionDetails VARCHAR(1023) AFTER operationPerformed', 
    'SELECT ''Column actionDetails already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'AuditLog' AND COLUMN_NAME = 'ipAddress');
SET @sql_text = IF(@col_exists = 0, 
    'ALTER TABLE AuditLog ADD COLUMN ipAddress VARCHAR(45) AFTER actionDetails', 
    'SELECT ''Column ipAddress already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'AuditLog' AND COLUMN_NAME = 'userAgent');
SET @sql_text = IF(@col_exists = 0, 
    'ALTER TABLE AuditLog ADD COLUMN userAgent VARCHAR(511) AFTER ipAddress', 
    'SELECT ''Column userAgent already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for better query performance
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'AuditLog' AND INDEX_NAME = 'idx_admin_time');
SET @sql_text = IF(@index_exists = 0,
    'ALTER TABLE AuditLog ADD INDEX idx_admin_time (adminID, timeStamp)',
    'SELECT ''Index idx_admin_time already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'AuditLog' AND INDEX_NAME = 'idx_table_operation');
SET @sql_text = IF(@index_exists = 0,
    'ALTER TABLE AuditLog ADD INDEX idx_table_operation (targetTable, operationPerformed)',
    'SELECT ''Index idx_table_operation already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'AuditLog' AND INDEX_NAME = 'idx_timestamp');
SET @sql_text = IF(@index_exists = 0,
    'ALTER TABLE AuditLog ADD INDEX idx_timestamp (timeStamp)',
    'SELECT ''Index idx_timestamp already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- TABLE ENHANCEMENTS: RestrictedWords
-- Purpose: Add severity level, last scanned date tracking
-- ============================================================

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'RestrictedWords' AND COLUMN_NAME = 'severity');
SET @sql_text = IF(@col_exists = 0,
    'ALTER TABLE RestrictedWords ADD COLUMN severity ENUM(''low'', ''medium'', ''high'') DEFAULT ''medium'' AFTER word',
    'SELECT ''Column severity already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'RestrictedWords' AND COLUMN_NAME = 'lastScannedDate');
SET @sql_text = IF(@col_exists = 0,
    'ALTER TABLE RestrictedWords ADD COLUMN lastScannedDate DATETIME AFTER addedDate',
    'SELECT ''Column lastScannedDate already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'RestrictedWords' AND COLUMN_NAME = 'flagCount');
SET @sql_text = IF(@col_exists = 0,
    'ALTER TABLE RestrictedWords ADD COLUMN flagCount INT DEFAULT 0 AFTER lastScannedDate',
    'SELECT ''Column flagCount already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'RestrictedWords' AND INDEX_NAME = 'idx_word');
SET @sql_text = IF(@index_exists = 0,
    'ALTER TABLE RestrictedWords ADD INDEX idx_word (word)',
    'SELECT ''Index idx_word already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- TABLE ENHANCEMENTS: User
-- Purpose: Add suspension tracking
-- ============================================================

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'User' AND COLUMN_NAME = 'isSuspended');
SET @sql_text = IF(@col_exists = 0,
    'ALTER TABLE User ADD COLUMN isSuspended BOOLEAN DEFAULT FALSE AFTER role',
    'SELECT ''Column isSuspended already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'User' AND COLUMN_NAME = 'suspendedDate');
SET @sql_text = IF(@col_exists = 0,
    'ALTER TABLE User ADD COLUMN suspendedDate DATETIME AFTER isSuspended',
    'SELECT ''Column suspendedDate already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'User' AND COLUMN_NAME = 'suspensionReason');
SET @sql_text = IF(@col_exists = 0,
    'ALTER TABLE User ADD COLUMN suspensionReason VARCHAR(1023) AFTER suspendedDate',
    'SELECT ''Column suspensionReason already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'User' AND COLUMN_NAME = 'suspendedBy');
SET @sql_text = IF(@col_exists = 0,
    'ALTER TABLE User ADD COLUMN suspendedBy INT AFTER suspensionReason',
    'SELECT ''Column suspendedBy already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'User' AND CONSTRAINT_NAME = 'fk_suspended_by');
SET @sql_text = IF(@fk_exists = 0,
    'ALTER TABLE User ADD CONSTRAINT fk_suspended_by FOREIGN KEY (suspendedBy) REFERENCES User(userID) ON DELETE SET NULL',
    'SELECT ''Foreign key fk_suspended_by already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'User' AND INDEX_NAME = 'idx_is_suspended');
SET @sql_text = IF(@index_exists = 0,
    'ALTER TABLE User ADD INDEX idx_is_suspended (isSuspended)',
    'SELECT ''Index idx_is_suspended already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = '3movieCollectors' AND TABLE_NAME = 'User' AND INDEX_NAME = 'idx_role');
SET @sql_text = IF(@index_exists = 0,
    'ALTER TABLE User ADD INDEX idx_role (role)',
    'SELECT ''Index idx_role already exists'' AS Info');
PREPARE stmt FROM @sql_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- TABLE: SecurityEvents
-- Purpose: Track security-related events (failed logins, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS SecurityEvents(
    eventID INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Event identification
    eventType ENUM(
        'failed_login',
        'unauthorized_access',
        'suspicious_activity',
        'brute_force_attempt',
        'sql_injection_attempt',
        'xss_attempt'
    ) NOT NULL,
    
    -- User context
    userID INT,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE SET NULL,
    username VARCHAR(255), -- Store even if user doesn't exist
    
    -- Event details
    eventDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    ipAddress VARCHAR(45),
    userAgent VARCHAR(511),
    requestPath VARCHAR(511),
    requestMethod VARCHAR(10),
    
    -- Additional context
    description VARCHAR(1023),
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    
    -- Admin review
    isReviewed BOOLEAN DEFAULT FALSE,
    reviewedBy INT,
    FOREIGN KEY (reviewedBy) REFERENCES User(userID) ON DELETE SET NULL,
    reviewedDate DATETIME,
    reviewNotes VARCHAR(1023),
    
    -- Indexes
    INDEX idx_event_type (eventType),
    INDEX idx_event_date (eventDate),
    INDEX idx_severity (severity),
    INDEX idx_user_id (userID),
    INDEX idx_ip_address (ipAddress),
    INDEX idx_is_reviewed (isReviewed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VIEW: v_hidden_content_ids
-- Purpose: Quick lookup for hidden content (used in queries)
-- ============================================================
CREATE OR REPLACE VIEW v_hidden_content_ids AS
SELECT 
    contentType,
    contentID
FROM FlaggedContent
WHERE isHidden = TRUE AND status IN ('pending', 'reviewing');

-- ============================================================
-- VIEW: v_admin_dashboard_stats
-- Purpose: Pre-calculated stats for admin dashboard
-- ============================================================
CREATE OR REPLACE VIEW v_admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM User WHERE role = 'user') as totalUsers,
    (SELECT COUNT(*) FROM Movie) as totalMovies,
    (SELECT COUNT(*) FROM Post) as totalPosts,
    (SELECT COUNT(*) FROM FlaggedContent WHERE status = 'pending') as pendingFlags,
    (SELECT COUNT(DISTINCT userID) FROM User WHERE registrationDate >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as newUsersToday,
    (SELECT COUNT(*) FROM Post WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as postsToday,
    (SELECT COUNT(*) FROM ReviewRatings WHERE reviewDate >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as reviewsToday,
    (SELECT COUNT(*) FROM User WHERE isSuspended = TRUE) as suspendedUsers;

-- ============================================================
-- VIEW: v_repeat_offenders
-- Purpose: Identify users with multiple violations
-- ============================================================
CREATE OR REPLACE VIEW v_repeat_offenders AS
SELECT 
    u.userID,
    u.username,
    u.name,
    u.email,
    COUNT(v.violationID) as violationCount,
    MAX(v.violationDate) as lastViolationDate,
    GROUP_CONCAT(DISTINCT v.violationType SEPARATOR ', ') as violationTypes
FROM User u
JOIN UserViolations v ON u.userID = v.userID
WHERE u.isSuspended = FALSE
GROUP BY u.userID, u.username, u.name, u.email
HAVING violationCount >= 3
ORDER BY violationCount DESC, lastViolationDate DESC;

-- ============================================================
-- INITIALIZATION DATA
-- ============================================================

-- Add sample restricted words if not already present
INSERT IGNORE INTO RestrictedWords (word) VALUES
('spam'),
('scam'),
('fake'),
('phishing'),
('malware'),
('virus'),
('hack'),
('cheat'),
('steal'),
('illegal');

-- ============================================================
-- SCHEMA VERIFICATION
-- ============================================================
SELECT 'Admin schema enhancement completed successfully!' as Status;

-- Show created tables
SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = '3movieCollectors'
AND TABLE_NAME IN (
    'FlaggedContent',
    'AdminReports',
    'UserViolations',
    'AdminNotifications',
    'SecurityEvents'
)
ORDER BY TABLE_NAME;
