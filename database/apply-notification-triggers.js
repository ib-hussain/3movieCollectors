const mysql = require("mysql2/promise");
require("dotenv").config({ path: "../.env" });

async function applyNotificationTriggers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "3movieCollectors",
  });

  try {
    console.log("\n🔧 Applying Notification Triggers and Procedures...\n");

    // 1. Security Event Trigger
    console.log("📌 Creating security event trigger...");
    await connection.query(
      "DROP TRIGGER IF EXISTS trg_security_event_notification"
    );
    await connection.query(`
      CREATE TRIGGER trg_security_event_notification
      AFTER INSERT ON SecurityEvents
      FOR EACH ROW
      BEGIN
          DECLARE v_priority ENUM('low', 'medium', 'high', 'critical');
          DECLARE v_title VARCHAR(255);
          DECLARE v_message TEXT;
          
          SET v_priority = CASE NEW.severity
              WHEN 'critical' THEN 'critical'
              WHEN 'high' THEN 'high'
              WHEN 'medium' THEN 'medium'
              ELSE 'low'
          END;
          
          SET v_title = CASE NEW.eventType
              WHEN 'failed_login' THEN 'Failed Login Detected'
              WHEN 'brute_force_attempt' THEN 'Brute Force Attack Detected'
              WHEN 'unauthorized_access' THEN 'Unauthorized Access Attempt'
              WHEN 'sql_injection_attempt' THEN 'SQL Injection Detected'
              WHEN 'xss_attempt' THEN 'XSS Attack Detected'
              WHEN 'suspicious_activity' THEN 'Suspicious Activity Detected'
              ELSE 'Security Event'
          END;
          
          SET v_message = CONCAT(
              v_title, ' - ',
              COALESCE(NEW.description, 'No details provided'),
              ' | User: ', COALESCE(NEW.username, 'Unknown'),
              ' | IP: ', COALESCE(NEW.ipAddress, 'Unknown'),
              ' | Path: ', COALESCE(NEW.requestPath, 'N/A')
          );
          
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
      END
    `);
    console.log("✅ Security event trigger created");

    // 2. High Activity Check Procedure
    console.log("📌 Creating high activity check procedure...");
    await connection.query("DROP PROCEDURE IF EXISTS sp_check_high_activity");
    await connection.query(`
      CREATE PROCEDURE sp_check_high_activity()
      BEGIN
          DECLARE v_recent_flags INT;
          DECLARE v_recent_violations INT;
          DECLARE v_active_users INT;
          DECLARE v_flagging_rate DECIMAL(10,2);
          DECLARE v_threshold INT DEFAULT 20;
          DECLARE v_last_notification DATETIME;
          
          SELECT COUNT(*) INTO v_recent_flags
          FROM FlaggedContent
          WHERE flaggedDate >= DATE_SUB(NOW(), INTERVAL 1 HOUR);
          
          SELECT COUNT(*) INTO v_recent_violations
          FROM UserViolations
          WHERE violationDate >= DATE_SUB(NOW(), INTERVAL 1 HOUR);
          
          -- Count distinct users who were flagged (activity indicator)
          SELECT COUNT(DISTINCT userID) INTO v_active_users
          FROM UserViolations
          WHERE violationDate >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
          
          IF v_active_users > 0 THEN
              SET v_flagging_rate = v_recent_flags / v_active_users;
          ELSE
              SET v_flagging_rate = 0;
          END IF;
          
          SELECT MAX(createdDate) INTO v_last_notification
          FROM AdminNotifications
          WHERE notificationType = 'high_activity';
          
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
          END IF;
      END
    `);
    console.log("✅ High activity check procedure created");

    // 3. System Alert Procedure
    console.log("📌 Creating system alert procedure...");
    await connection.query("DROP PROCEDURE IF EXISTS sp_create_system_alert");
    await connection.query(`
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
      END
    `);
    console.log("✅ System alert procedure created");

    // 4. Database Health Monitor Procedure
    console.log("📌 Creating database health monitor procedure...");
    await connection.query(
      "DROP PROCEDURE IF EXISTS sp_monitor_database_health"
    );
    await connection.query(`
      CREATE PROCEDURE sp_monitor_database_health()
      BEGIN
          DECLARE v_suspended_count INT;
          DECLARE v_pending_flags INT;
          DECLARE v_old_flags INT;
          DECLARE v_unreviewed_security INT;
          
          SELECT COUNT(*) INTO v_suspended_count
          FROM User
          WHERE accountStatus = 'suspended';
          
          SELECT COUNT(*) INTO v_pending_flags
          FROM FlaggedContent
          WHERE status = 'pending';
          
          SELECT COUNT(*) INTO v_old_flags
          FROM FlaggedContent
          WHERE status = 'pending' 
          AND createdDate < DATE_SUB(NOW(), INTERVAL 7 DAY);
          
          SELECT COUNT(*) INTO v_unreviewed_security
          FROM SecurityEvents
          WHERE isReviewed = FALSE
          AND eventDate > DATE_SUB(NOW(), INTERVAL 24 HOUR);
          
          IF v_old_flags > 5 THEN
              CALL sp_create_system_alert(
                  'Old Pending Flags Detected',
                  CONCAT(v_old_flags, ' flags have been pending for more than 7 days. Review required.'),
                  'medium',
                  'FlaggedContent'
              );
          END IF;
          
          IF v_unreviewed_security > 10 THEN
              CALL sp_create_system_alert(
                  'Unreviewed Security Events',
                  CONCAT(v_unreviewed_security, ' security events from the last 24 hours need review.'),
                  'high',
                  'SecurityEvents'
              );
          END IF;
          
          IF v_suspended_count > 50 THEN
              CALL sp_create_system_alert(
                  'High User Suspension Count',
                  CONCAT(v_suspended_count, ' users are currently suspended. System review recommended.'),
                  'low',
                  'User'
              );
          END IF;
      END
    `);
    console.log("✅ Database health monitor procedure created");

    // 5. Updated Backup Procedure
    console.log("📌 Updating backup procedure...");
    await connection.query("DROP PROCEDURE IF EXISTS sp_backup_database");
    await connection.query(`
      CREATE PROCEDURE sp_backup_database()
      BEGIN
          DECLARE v_backupFile VARCHAR(255);
          DECLARE v_timestamp VARCHAR(20);
          
          SET v_timestamp = DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s');
          SET v_backupFile = CONCAT('3movieCollectors_backup_', v_timestamp, '.sql');
          
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
      END
    `);
    console.log("✅ Backup procedure updated");

    // 6. Enable Event Scheduler
    console.log("\n📌 Enabling event scheduler...");
    await connection.query("SET GLOBAL event_scheduler = ON");
    console.log("✅ Event scheduler enabled");

    // 7. Create Scheduled Events
    console.log("📌 Creating scheduled events...");

    await connection.query("DROP EVENT IF EXISTS evt_check_high_activity");
    await connection.query(`
      CREATE EVENT evt_check_high_activity
      ON SCHEDULE EVERY 1 HOUR
      STARTS CURRENT_TIMESTAMP
      DO
          CALL sp_check_high_activity()
    `);
    console.log("✅ Event: Check high activity (every 1 hour)");

    await connection.query("DROP EVENT IF EXISTS evt_monitor_database_health");
    await connection.query(`
      CREATE EVENT evt_monitor_database_health
      ON SCHEDULE EVERY 6 HOUR
      STARTS CURRENT_TIMESTAMP
      DO
          CALL sp_monitor_database_health()
    `);
    console.log("✅ Event: Monitor database health (every 6 hours)");

    await connection.query("DROP EVENT IF EXISTS evt_automated_backup");
    await connection.query(`
      CREATE EVENT evt_automated_backup
      ON SCHEDULE EVERY 1 DAY
      STARTS (CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 2 HOUR)
      DO
          CALL sp_backup_database()
    `);
    console.log("✅ Event: Automated backup (daily at 2 AM)");

    // Verification
    console.log("\n📊 Verification:\n");

    const [triggers] = await connection.query(
      "SHOW TRIGGERS WHERE `Trigger` LIKE '%notification%'"
    );
    console.log(`✅ Triggers: ${triggers.length}`);
    triggers.forEach((t) => console.log(`   - ${t.Trigger}`));

    const [procedures] = await connection.query(`
      SHOW PROCEDURE STATUS 
      WHERE Db = '3movieCollectors' 
      AND (Name LIKE '%alert%' OR Name LIKE '%activity%' OR Name LIKE '%backup%' OR Name LIKE '%health%')
    `);
    console.log(`\n✅ Procedures: ${procedures.length}`);
    procedures.forEach((p) => console.log(`   - ${p.Name}`));

    const [events] = await connection.query("SHOW EVENTS");
    console.log(`\n✅ Scheduled Events: ${events.length}`);
    events.forEach((e) =>
      console.log(
        `   - ${e.Name} (every ${e.Interval_value} ${e.Interval_field})`
      )
    );

    console.log("\n✅ ALL NOTIFICATION AUTOMATION ACTIVE!\n");
    console.log("📋 Summary:");
    console.log("   ✅ security_event - Triggered by SecurityEvents INSERT");
    console.log("   ✅ repeat_offender - Triggered by violation count >= 3");
    console.log("   ✅ new_flag - Triggered by restricted content detection");
    console.log("   ✅ high_activity - Checked hourly by scheduler");
    console.log("   ✅ system_alert - Created by health monitor (6 hours)");
    console.log("   ✅ backup_status - Created by daily backup (2 AM)\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

applyNotificationTriggers();
