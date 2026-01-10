-- ============================================================
-- ADMIN FEATURE - MYSQL SCHEDULED EVENTS
-- ============================================================
-- Purpose: Automated maintenance and monitoring tasks
-- Created: December 9, 2025
-- Dependencies: Requires admin_schema.sql and admin_procedures.sql
-- Note: MySQL Event Scheduler must be enabled
-- ============================================================

USE 3movieCollectors;

-- ============================================================
-- ENABLE EVENT SCHEDULER
-- ============================================================

-- Check if event scheduler is enabled
SHOW VARIABLES LIKE 'event_scheduler';

-- Enable event scheduler (if not already enabled)
SET GLOBAL event_scheduler = ON;

-- ============================================================
-- SECTION 1: AUTOMATED DATABASE BACKUP
-- Purpose: Daily backup of entire database
-- Schedule: Every day at 2:00 AM
-- ============================================================

DROP EVENT IF EXISTS evt_daily_backup;

DELIMITER $$
CREATE EVENT evt_daily_backup
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 2 HOUR)
DO
BEGIN
    DECLARE v_backupFile VARCHAR(255);
    DECLARE v_timestamp VARCHAR(50);
    
    SET v_timestamp = DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s');
    SET v_backupFile = CONCAT('3movieCollectors_backup_', v_timestamp, '.sql');
    
    -- Call backup procedure
    CALL sp_backup_database();
    
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
        'system',
        'Daily Backup Completed',
        CONCAT('Automated database backup completed: ', v_backupFile),
        'low',
        'system',
        NULL
    );
    
    -- Log to audit
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
        'AUTOMATED BACKUP',
        CONCAT('Daily backup event triggered: ', v_backupFile)
    );
END$$
DELIMITER ;

-- ============================================================
-- SECTION 2: CLEANUP OLD ADMIN NOTIFICATIONS
-- Purpose: Remove read notifications older than 30 days
-- Schedule: Every week on Sunday at 3:00 AM
-- ============================================================

DROP EVENT IF EXISTS evt_cleanup_old_notifications;

DELIMITER $$
CREATE EVENT evt_cleanup_old_notifications
ON SCHEDULE EVERY 1 WEEK
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 3 HOUR)
DO
BEGIN
    DECLARE v_deleted INT DEFAULT 0;
    
    -- Delete read notifications older than 30 days
    DELETE FROM AdminNotifications
    WHERE isRead = TRUE
    AND createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    SET v_deleted = ROW_COUNT();
    
    -- Keep unread notifications indefinitely (admin might not have seen them yet)
    
    -- Log cleanup
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
        'AdminNotifications',
        'CLEANUP',
        CONCAT('Automated cleanup: Removed ', v_deleted, ' old read notifications')
    );
    
    -- Create notification if many items were deleted
    IF v_deleted > 100 THEN
        INSERT INTO AdminNotifications (
            notificationType,
            title,
            message,
            priority,
            relatedType,
            relatedID
        )
        VALUES (
            'system',
            'Notification Cleanup',
            CONCAT('Cleaned up ', v_deleted, ' old notifications'),
            'low',
            'system',
            NULL
        );
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- SECTION 3: CHECK FOR REPEAT OFFENDERS
-- Purpose: Alert admins about users with multiple violations
-- Schedule: Every day at 10:00 AM
-- ============================================================

DROP EVENT IF EXISTS evt_check_repeat_offenders;

DELIMITER $$
CREATE EVENT evt_check_repeat_offenders
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 10 HOUR)
DO
BEGIN
    DECLARE v_offenderCount INT DEFAULT 0;
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_userID INT;
    DECLARE v_username VARCHAR(255);
    DECLARE v_violationCount INT;
    
    -- Cursor to iterate through repeat offenders
    DECLARE offender_cursor CURSOR FOR
        SELECT 
            u.userID,
            u.username,
            COUNT(uv.violationID) as violationCount
        FROM User u
        INNER JOIN UserViolations uv ON u.userID = uv.userID
        WHERE u.isSuspended = FALSE
        GROUP BY u.userID, u.username
        HAVING violationCount >= 3;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN offender_cursor;
    
    read_loop: LOOP
        FETCH offender_cursor INTO v_userID, v_username, v_violationCount;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Create high-priority notification for each repeat offender
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
            'Repeat Offender Alert',
            CONCAT('User "', v_username, '" (ID:', v_userID, ') has ', v_violationCount, ' violations. Review required.'),
            'high',
            'user',
            v_userID
        );
        
        SET v_offenderCount = v_offenderCount + 1;
    END LOOP;
    
    CLOSE offender_cursor;
    
    -- Log the check
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
        'UserViolations',
        'AUTOMATED CHECK',
        CONCAT('Repeat offender check completed. Found ', v_offenderCount, ' users requiring review.')
    );
END$$
DELIMITER ;

-- ============================================================
-- SECTION 4: OPTIONAL EVENTS (Disabled by default)
-- ============================================================

-- OPTIONAL EVENT: Cleanup old audit logs (keep only last 6 months)
-- Uncomment to enable
/*
DROP EVENT IF EXISTS evt_cleanup_old_audit_logs;

DELIMITER $$
CREATE EVENT evt_cleanup_old_audit_logs
ON SCHEDULE EVERY 1 MONTH
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 MONTH + INTERVAL 4 HOUR)
DO
BEGIN
    DECLARE v_deleted INT DEFAULT 0;
    
    -- Archive or delete audit logs older than 6 months
    DELETE FROM AuditLog
    WHERE timestamp < DATE_SUB(NOW(), INTERVAL 6 MONTH);
    
    SET v_deleted = ROW_COUNT();
    
    -- Log cleanup
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
        'AuditLog',
        'CLEANUP',
        CONCAT('Removed ', v_deleted, ' audit logs older than 6 months')
    );
END$$
DELIMITER ;
*/

-- OPTIONAL EVENT: Update restricted word last scanned date
-- Useful if you want to track when words were last checked
/*
DROP EVENT IF EXISTS evt_update_word_scan_dates;

DELIMITER $$
CREATE EVENT evt_update_word_scan_dates
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 1 HOUR)
DO
BEGIN
    -- Update last scanned date for all restricted words
    UPDATE RestrictedWords
    SET lastScannedDate = NOW()
    WHERE lastScannedDate IS NULL 
    OR lastScannedDate < DATE_SUB(NOW(), INTERVAL 7 DAY);
END$$
DELIMITER ;
*/

-- ============================================================
-- SECTION 5: EVENT MANAGEMENT COMMANDS
-- ============================================================

/*
USEFUL COMMANDS:
----------------

1. View all events:
SHOW EVENTS FROM 3movieCollectors;

2. View specific event definition:
SHOW CREATE EVENT evt_daily_backup;

3. Disable an event temporarily:
ALTER EVENT evt_daily_backup DISABLE;

4. Enable an event:
ALTER EVENT evt_daily_backup ENABLE;

5. Drop an event:
DROP EVENT evt_daily_backup;

6. Check event scheduler status:
SHOW VARIABLES LIKE 'event_scheduler';

7. Enable event scheduler (requires SUPER privilege):
SET GLOBAL event_scheduler = ON;

8. View event execution history (from information_schema):
SELECT * FROM information_schema.EVENTS 
WHERE EVENT_SCHEMA = '3movieCollectors';

9. Check if events are running:
SHOW PROCESSLIST;

10. View event errors (check MySQL error log):
-- Linux: /var/log/mysql/error.log
-- Windows: C:\ProgramData\MySQL\MySQL Server X.X\Data\*.err
*/

-- ============================================================
-- SECTION 6: PRODUCTION NOTES
-- ============================================================

/*
IMPORTANT PRODUCTION CONSIDERATIONS:
------------------------------------

1. BACKUP EVENT (evt_daily_backup):
   - This event only LOGS the backup request
   - Actual mysqldump must be executed by application or cron job
   - Example cron command (Linux):
     0 2 * * * mysqldump -u admin_user -p'AdminPass123!@#' 3movieCollectors > /backups/backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql

   - Example scheduled task (Windows PowerShell):
     $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
     mysqldump -u admin_user -p"AdminPass123!@#" 3movieCollectors | Out-File "C:\Backups\backup_$timestamp.sql"

2. EVENT SCHEDULER:
   - Must be enabled in MySQL configuration (my.ini or my.cnf)
   - Add: event_scheduler = ON
   - Restart MySQL service after configuration change

3. PERFORMANCE:
   - Events run on scheduler thread, minimal performance impact
   - Cleanup events free up disk space and improve query performance
   - Monitor event execution times in slow query log if needed

4. MONITORING:
   - Check AdminNotifications table for event execution status
   - Check AuditLog for automated task history
   - Set up alerts if critical events fail

5. TIMEZONE:
   - Events use server timezone
   - Ensure MySQL timezone matches your deployment timezone
   - Check: SELECT @@global.time_zone, @@session.time_zone;
*/

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'MySQL events created successfully!' as Status;
SELECT 'Event Scheduler Status:' as Info, @@global.event_scheduler as EventScheduler;

-- Show all created events
SHOW EVENTS FROM 3movieCollectors WHERE Name LIKE 'evt_%';

-- Display event schedule summary
SELECT 
    EVENT_NAME as EventName,
    EVENT_TYPE as Type,
    EXECUTE_AT as ExecuteAt,
    INTERVAL_VALUE as IntervalValue,
    INTERVAL_FIELD as IntervalUnit,
    STATUS as Status,
    LAST_EXECUTED as LastExecuted
FROM information_schema.EVENTS
WHERE EVENT_SCHEMA = '3movieCollectors'
AND EVENT_NAME LIKE 'evt_%';
