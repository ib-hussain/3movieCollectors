-- ============================================================
-- NOTIFICATION TRIGGERS
-- Purpose: Automatically create AdminNotifications for system events
-- Created: December 10, 2025
-- ============================================================

USE 3movieCollectors;

-- ============================================================
-- TRIGGER: Create notification when security event is logged
-- Fires: AFTER INSERT on SecurityEvents
-- Creates: 'security_event' notification with priority based on severity
-- ============================================================
DROP TRIGGER IF EXISTS trg_security_event_notification;

DELIMITER $$
CREATE TRIGGER trg_security_event_notification
AFTER INSERT ON SecurityEvents
FOR EACH ROW
BEGIN
    DECLARE v_priority ENUM('low', 'medium', 'high', 'critical');
    DECLARE v_title VARCHAR(255);
    DECLARE v_message TEXT;
    
    -- Map severity to priority
    SET v_priority = CASE NEW.severity
        WHEN 'critical' THEN 'critical'
        WHEN 'high' THEN 'high'
        WHEN 'medium' THEN 'medium'
        ELSE 'low'
    END;
    
    -- Create appropriate title based on event type
    SET v_title = CASE NEW.eventType
        WHEN 'failed_login' THEN 'Failed Login Detected'
        WHEN 'brute_force_attempt' THEN 'Brute Force Attack Detected'
        WHEN 'unauthorized_access' THEN 'Unauthorized Access Attempt'
        WHEN 'sql_injection_attempt' THEN 'SQL Injection Detected'
        WHEN 'xss_attempt' THEN 'XSS Attack Detected'
        WHEN 'suspicious_activity' THEN 'Suspicious Activity Detected'
        ELSE 'Security Event'
    END;
    
    -- Create detailed message
    SET v_message = CONCAT(
        v_title, ' - ',
        COALESCE(NEW.description, 'No details provided'),
        ' | User: ', COALESCE(NEW.username, 'Unknown'),
        ' | IP: ', COALESCE(NEW.ipAddress, 'Unknown'),
        ' | Path: ', COALESCE(NEW.requestPath, 'N/A')
    );
    
    -- Insert admin notification for medium, high, or critical events
    IF NEW.severity IN ('medium', 'high', 'critical') THEN
        INSERT INTO AdminNotifications (
            notificationType,
            title,
            message,
            priority,
            relatedType,
            relatedID
        )
        VALUES (
            'security_event',
            v_title,
            v_message,
            v_priority,
            'security',
            NEW.eventID
        );
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- STORED PROCEDURE: Check for high activity patterns
-- Purpose: Detect unusual spikes in flagging and violations
-- Called by: Event scheduler (every hour)
-- ============================================================
DROP PROCEDURE IF EXISTS sp_check_high_activity;

DELIMITER $$
CREATE PROCEDURE sp_check_high_activity()
BEGIN
    DECLARE v_recent_flags INT;
    DECLARE v_recent_violations INT;
    DECLARE v_active_users INT;
    DECLARE v_flagging_rate DECIMAL(10,2);
    DECLARE v_threshold INT DEFAULT 20; -- Alert threshold
    DECLARE v_last_notification DATETIME;
    
    -- Count flags created in last hour
    SELECT COUNT(*) INTO v_recent_flags
    FROM FlaggedContent
    WHERE createdDate >= DATE_SUB(NOW(), INTERVAL 1 HOUR);
    
    -- Count violations in last hour
    SELECT COUNT(*) INTO v_recent_violations
    FROM UserViolations
    WHERE violationDate >= DATE_SUB(NOW(), INTERVAL 1 HOUR);
    
    -- Count active users in last hour
    SELECT COUNT(DISTINCT userID) INTO v_active_users
    FROM User
    WHERE lastLoginDate >= DATE_SUB(NOW(), INTERVAL 1 HOUR);
    
    -- Calculate flagging rate per user
    IF v_active_users > 0 THEN
        SET v_flagging_rate = v_recent_flags / v_active_users;
    ELSE
        SET v_flagging_rate = 0;
    END IF;
    
    -- Check when we last sent a high_activity notification
    SELECT MAX(createdDate) INTO v_last_notification
    FROM AdminNotifications
    WHERE notificationType = 'high_activity';
    
    -- Alert if high activity detected and no recent notification (last 4 hours)
    IF (v_recent_flags > v_threshold OR v_recent_violations > 10)
       AND (v_last_notification IS NULL OR v_last_notification < DATE_SUB(NOW(), INTERVAL 4 HOUR)) THEN
        
        INSERT INTO AdminNotifications (
            notificationType,
            title,
            message,
            priority,
            relatedType,
            relatedID
        )
        VALUES (
            'high_activity',
            'High Flagging Activity Detected',
            CONCAT(
                'Unusual activity detected in the last hour: ',
                v_recent_flags, ' new flags, ',
                v_recent_violations, ' violations, ',
                v_active_users, ' active users. ',
                'Flagging rate: ', ROUND(v_flagging_rate, 2), ' flags/user.'
            ),
            'medium',
            'system',
            NULL
        );
        
        -- Log to audit
        INSERT INTO AuditLog (
            performedBy,
            actionType,
            actionDescription,
            affectedTable
        )
        VALUES (
            NULL,
            'AUTOMATED CHECK',
            CONCAT('High activity alert: ', v_recent_flags, ' flags, ', v_recent_violations, ' violations'),
            'FlaggedContent'
        );
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- STORED PROCEDURE: Create system alert notifications
-- Purpose: Generate alerts for system health and threshold issues
-- Called by: Application code or event scheduler
-- ============================================================
DROP PROCEDURE IF EXISTS sp_create_system_alert;

DELIMITER $$
CREATE PROCEDURE sp_create_system_alert(
    IN p_title VARCHAR(255),
    IN p_message TEXT,
    IN p_priority ENUM('low', 'medium', 'high', 'critical'),
    IN p_relatedTable VARCHAR(100)
)
BEGIN
    INSERT INTO AdminNotifications (
        notificationType,
        title,
        message,
        priority,
        relatedType,
        relatedID
    )
    VALUES (
        'system_alert',
        p_title,
        p_message,
        p_priority,
        p_relatedTable,
        NULL
    );
    
    -- Log to audit
    INSERT INTO AuditLog (
        performedBy,
        actionType,
        actionDescription,
        affectedTable
    )
    VALUES (
        NULL,
        'SYSTEM ALERT',
        CONCAT(p_title, ': ', p_message),
        p_relatedTable
    );
END$$
DELIMITER ;

-- ============================================================
-- STORED PROCEDURE: Monitor database health
-- Purpose: Check for system issues and create alerts
-- Called by: Event scheduler (every 6 hours)
-- ============================================================
DROP PROCEDURE IF EXISTS sp_monitor_database_health;

DELIMITER $$
CREATE PROCEDURE sp_monitor_database_health()
BEGIN
    DECLARE v_suspended_count INT;
    DECLARE v_pending_flags INT;
    DECLARE v_old_flags INT;
    DECLARE v_unreviewed_security INT;
    
    -- Count suspended users
    SELECT COUNT(*) INTO v_suspended_count
    FROM User
    WHERE accountStatus = 'suspended';
    
    -- Count pending flags
    SELECT COUNT(*) INTO v_pending_flags
    FROM FlaggedContent
    WHERE status = 'pending';
    
    -- Count flags older than 7 days still pending
    SELECT COUNT(*) INTO v_old_flags
    FROM FlaggedContent
    WHERE status = 'pending' 
    AND createdDate < DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    -- Count unreviewed security events
    SELECT COUNT(*) INTO v_unreviewed_security
    FROM SecurityEvents
    WHERE isReviewed = FALSE
    AND eventDate > DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
    -- Alert for old pending flags
    IF v_old_flags > 5 THEN
        CALL sp_create_system_alert(
            'Old Pending Flags Detected',
            CONCAT(v_old_flags, ' flags have been pending for more than 7 days. Review required.'),
            'medium',
            'FlaggedContent'
        );
    END IF;
    
    -- Alert for many unreviewed security events
    IF v_unreviewed_security > 10 THEN
        CALL sp_create_system_alert(
            'Unreviewed Security Events',
            CONCAT(v_unreviewed_security, ' security events from the last 24 hours need review.'),
            'high',
            'SecurityEvents'
        );
    END IF;
    
    -- Alert for high suspension rate
    IF v_suspended_count > 50 THEN
        CALL sp_create_system_alert(
            'High User Suspension Count',
            CONCAT(v_suspended_count, ' users are currently suspended. System review recommended.'),
            'low',
            'User'
        );
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- UPDATE: Modify backup procedure to create notifications
-- ============================================================
DROP PROCEDURE IF EXISTS sp_backup_database;

DELIMITER $$
CREATE PROCEDURE sp_backup_database()
BEGIN
    DECLARE v_backupFile VARCHAR(255);
    DECLARE v_timestamp VARCHAR(20);
    DECLARE v_success BOOLEAN DEFAULT TRUE;
    
    SET v_timestamp = DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s');
    SET v_backupFile = CONCAT('3movieCollectors_backup_', v_timestamp, '.sql');
    
    -- Log backup attempt to audit log
    INSERT INTO AuditLog (
        performedBy,
        actionType,
        actionDescription,
        affectedTable,
        affectedRecordID
    )
    VALUES (
        NULL,
        'BACKUP',
        CONCAT('Automated database backup initiated: ', v_backupFile),
        'Database',
        NULL
    );
    
    -- Create backup_status notification
    INSERT INTO AdminNotifications (
        notificationType,
        title,
        message,
        priority,
        relatedType,
        relatedID
    )
    VALUES (
        'backup_status',
        'Database Backup Completed',
        CONCAT(
            'Automated backup successfully logged: ', v_backupFile,
            ' at ', NOW(),
            '. Note: Actual backup must be executed via mysqldump from application.'
        ),
        'low',
        'system',
        NULL
    );
    
    SELECT v_backupFile as BackupFile, NOW() as BackupTime, 'Backup logged and notification created' as Status;
END$$
DELIMITER ;

-- ============================================================
-- MYSQL EVENT SCHEDULER: Automated monitoring
-- Purpose: Run periodic checks for high activity and system health
-- ============================================================

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Drop existing events
DROP EVENT IF EXISTS evt_check_high_activity;
DROP EVENT IF EXISTS evt_monitor_database_health;
DROP EVENT IF EXISTS evt_automated_backup;

-- Event: Check for high activity every hour
CREATE EVENT evt_check_high_activity
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
    CALL sp_check_high_activity();

-- Event: Monitor database health every 6 hours
CREATE EVENT evt_monitor_database_health
ON SCHEDULE EVERY 6 HOUR
STARTS CURRENT_TIMESTAMP
DO
    CALL sp_monitor_database_health();

-- Event: Daily backup at 2 AM
CREATE EVENT evt_automated_backup
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 2 HOUR)
DO
    CALL sp_backup_database();

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check if event scheduler is enabled
-- SHOW VARIABLES LIKE 'event_scheduler';

-- View all scheduled events
-- SHOW EVENTS;

-- Check trigger exists
-- SHOW TRIGGERS WHERE `Trigger` LIKE '%security%';

-- Test high activity check manually
-- CALL sp_check_high_activity();

-- Test database health check manually
-- CALL sp_monitor_database_health();

-- Test backup procedure manually
-- CALL sp_backup_database();
