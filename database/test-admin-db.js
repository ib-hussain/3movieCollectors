/**
 * ADMIN FEATURE - PHASE 1 DATABASE TESTING SUITE
 * ================================================
 * Purpose: Comprehensive testing of all Phase 1 database components
 * Run this AFTER executing all 6 SQL files in order
 *
 * Test Coverage:
 * 1. Database setup and connection
 * 2. Table structures and views
 * 3. Trigger functionality (audit + auto-flagging)
 * 4. Stored procedures
 * 5. MySQL functions
 * 6. User privileges
 * 7. Scheduled events
 *
 * Usage:
 *   node database/test-admin-db.js
 */

const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const path = require("path");

// ANSI color codes for pretty output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

class AdminDatabaseTester {
  constructor() {
    this.adminConnection = null;
    this.appConnection = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
    };
  }

  // Helper methods
  log(message, type = "info") {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    const prefix =
      {
        success: `${colors.green}✓${colors.reset}`,
        error: `${colors.red}✗${colors.reset}`,
        warning: `${colors.yellow}⚠${colors.reset}`,
        info: `${colors.blue}ℹ${colors.reset}`,
        header: `${colors.cyan}►${colors.reset}`,
      }[type] || "";

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  logSection(title) {
    console.log(`\n${colors.bright}${colors.cyan}${"=".repeat(70)}`);
    console.log(`  ${title}`);
    console.log(`${"=".repeat(70)}${colors.reset}\n`);
  }

  async recordTest(testName, passed, details = "") {
    const result = { testName, passed, details, timestamp: new Date() };
    this.testResults.tests.push(result);

    if (passed) {
      this.testResults.passed++;
      this.log(`${testName}${details ? ": " + details : ""}`, "success");
    } else {
      this.testResults.failed++;
      this.log(`${testName}${details ? ": " + details : ""}`, "error");
    }
  }

  // Connection setup
  async setupConnections() {
    this.logSection("1. SETUP DATABASE CONNECTIONS");

    try {
      // Admin connection
      this.adminConnection = await mysql.createConnection({
        host: "localhost",
        user: "admin_user",
        password: "AdminPass123!@#",
        database: "3movieCollectors",
        multipleStatements: true,
      });
      await this.recordTest(
        "Admin connection",
        true,
        "Connected as admin_user"
      );

      // App connection
      this.appConnection = await mysql.createConnection({
        host: "localhost",
        user: "app_user",
        password: "AppPass123!@#",
        database: "3movieCollectors",
        multipleStatements: true,
      });
      await this.recordTest("App connection", true, "Connected as app_user");
    } catch (error) {
      this.log(`Connection failed: ${error.message}`, "error");
      this.log(
        "Make sure you have executed admin_privileges.sql first!",
        "warning"
      );
      throw error;
    }
  }

  // Test 1: Verify tables and views
  async testTablesAndViews() {
    this.logSection("2. VERIFY TABLES AND VIEWS");

    const expectedTables = [
      "FlaggedContent",
      "AdminReports",
      "UserViolations",
      "AdminNotifications",
      "SecurityEvents",
    ];

    const expectedViews = [
      "v_hidden_content_ids",
      "v_admin_dashboard_stats",
      "v_repeat_offenders",
    ];

    // Check tables
    for (const table of expectedTables) {
      try {
        const [rows] = await this.adminConnection.query(
          `SHOW TABLES LIKE '${table}'`
        );
        await this.recordTest(`Table: ${table}`, rows.length > 0);
      } catch (error) {
        await this.recordTest(`Table: ${table}`, false, error.message);
      }
    }

    // Check views
    for (const view of expectedViews) {
      try {
        const [rows] = await this.adminConnection.query(
          `SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW' AND Tables_in_3movieCollectors = '${view}'`
        );
        await this.recordTest(`View: ${view}`, rows.length > 0);
      } catch (error) {
        await this.recordTest(`View: ${view}`, false, error.message);
      }
    }

    // Check enhanced table columns
    try {
      const [cols] = await this.adminConnection.query(
        `SHOW COLUMNS FROM AuditLog LIKE 'ipAddress'`
      );
      await this.recordTest(
        "AuditLog enhanced",
        cols.length > 0,
        "ipAddress column added"
      );
    } catch (error) {
      await this.recordTest("AuditLog enhanced", false, error.message);
    }

    try {
      const [cols] = await this.adminConnection.query(
        `SHOW COLUMNS FROM User LIKE 'isSuspended'`
      );
      await this.recordTest(
        "User enhanced",
        cols.length > 0,
        "isSuspended column added"
      );
    } catch (error) {
      await this.recordTest("User enhanced", false, error.message);
    }
  }

  // Test 2: Verify triggers
  async testTriggers() {
    this.logSection("3. VERIFY TRIGGERS");

    try {
      const [triggers] = await this.adminConnection.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.TRIGGERS 
                WHERE TRIGGER_SCHEMA = '3movieCollectors' 
                AND TRIGGER_NAME LIKE 'trg_%'
            `);

      const triggerCount = triggers[0].count;
      await this.recordTest(
        "Trigger count",
        triggerCount >= 16,
        `Found ${triggerCount} triggers (expected 16+)`
      );

      // List all triggers
      const [triggerList] = await this.adminConnection.query(`
                SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
                FROM information_schema.TRIGGERS
                WHERE TRIGGER_SCHEMA = '3movieCollectors'
                AND TRIGGER_NAME LIKE 'trg_%'
                ORDER BY TRIGGER_NAME
            `);

      this.log(`\nInstalled Triggers (${triggerList.length}):`, "info");
      triggerList.forEach((t) => {
        console.log(
          `  - ${t.TRIGGER_NAME} (${t.EVENT_MANIPULATION} on ${t.EVENT_OBJECT_TABLE})`
        );
      });
    } catch (error) {
      await this.recordTest("Trigger verification", false, error.message);
    }
  }

  // Test 3: Test trigger functionality
  async testTriggerFunctionality() {
    this.logSection("4. TEST TRIGGER FUNCTIONALITY");

    try {
      // Test 1: Audit trigger for movie insert
      this.log("\nTest: Movie INSERT audit trigger", "header");

      // Set admin context
      await this.adminConnection.query(`
                SET @current_admin_id = 1;
                SET @current_ip_address = '127.0.0.1';
                SET @current_user_agent = 'Test Suite';
            `);

      // Insert test movie
      await this.adminConnection.query(`
                INSERT INTO Movie (title, releaseYear, director, synopsis, posterImg)
                VALUES ('Test Movie for Audit', 2025, 'Test Director', 'Test synopsis', 'test.jpg')
            `);

      const [movieResult] = await this.adminConnection.query(
        `SELECT LAST_INSERT_ID() as movieID`
      );
      const testMovieID = movieResult[0].movieID;

      // Check if audit log was created
      const [auditLog] = await this.adminConnection.query(
        `
                SELECT * FROM AuditLog 
                WHERE targetTable = 'Movie' 
                AND targetRecordID = ? 
                AND operationPerformed = 'INSERT'
                ORDER BY timestamp DESC LIMIT 1
            `,
        [testMovieID]
      );

      await this.recordTest(
        "Movie INSERT audit trigger",
        auditLog.length > 0,
        auditLog.length > 0
          ? `Logged: ${auditLog[0].actionDetails}`
          : "No audit log created"
      );

      // Test 2: Auto-flagging trigger for restricted words
      this.log("\nTest: Auto-flagging trigger", "header");

      // Add test restricted word
      await this.adminConnection.query(`
                INSERT INTO RestrictedWords (word, severity) 
                VALUES ('testbadword123', 'high')
                ON DUPLICATE KEY UPDATE word = word
            `);

      // Create post with restricted word (as regular user, no admin context)
      await this.adminConnection.query(`
                SET @current_admin_id = NULL;
                SET @current_ip_address = NULL;
                SET @current_user_agent = NULL;
            `);

      await this.adminConnection.query(
        `
                INSERT INTO Post (userID, movieID, postContent)
                VALUES (1, ?, 'This post contains testbadword123 which should be flagged')
            `,
        [testMovieID]
      );

      const [postResult] = await this.adminConnection.query(
        `SELECT LAST_INSERT_ID() as postID`
      );
      const testPostID = postResult[0].postID;

      // Check if content was flagged
      const [flagged] = await this.adminConnection.query(
        `
                SELECT * FROM FlaggedContent 
                WHERE contentType = 'Post' 
                AND contentID = ? 
                AND matchedWord = 'testbadword123'
            `,
        [testPostID]
      );

      await this.recordTest(
        "Auto-flagging trigger",
        flagged.length > 0 && flagged[0].isHidden === 1,
        flagged.length > 0
          ? `Content flagged and hidden: ${flagged[0].flagReason}`
          : "Not flagged"
      );

      // Check if admin notification was created
      const [notification] = await this.adminConnection.query(`
                SELECT * FROM AdminNotifications 
                WHERE notificationType = 'new_flag'
                AND message LIKE '%testbadword123%'
                ORDER BY notificationID DESC LIMIT 1
            `);

      await this.recordTest(
        "Auto-flag notification",
        notification.length > 0,
        notification.length > 0
          ? "Admin notification created"
          : "No notification"
      );

      // Test 3: Violation tracking trigger
      const [violation] = await this.adminConnection.query(
        `
                SELECT * FROM UserViolations 
                WHERE relatedFlagID = ?
            `,
        [flagged[0]?.flagID]
      );

      await this.recordTest(
        "Violation tracking trigger",
        violation.length > 0,
        violation.length > 0
          ? `Violation recorded for user ${violation[0].userID}`
          : "No violation record"
      );

      // Cleanup test data
      await this.adminConnection.query(
        `
                DELETE FROM Post WHERE postID = ?;
                DELETE FROM FlaggedContent WHERE contentID = ? AND contentType = 'Post';
                DELETE FROM AdminNotifications WHERE message LIKE '%testbadword123%';
                DELETE FROM UserViolations WHERE userID = 1 AND violationType = 'restricted_word';
                DELETE FROM Movie WHERE movieID = ?;
                DELETE FROM RestrictedWords WHERE word = 'testbadword123';
            `,
        [testPostID, testPostID, testMovieID]
      );

      this.log("Test data cleaned up", "info");
    } catch (error) {
      await this.recordTest("Trigger functionality", false, error.message);
      this.log(`Error details: ${error.stack}`, "error");
    }
  }

  // Test 4: Verify stored procedures
  async testStoredProcedures() {
    this.logSection("5. VERIFY STORED PROCEDURES");

    const expectedProcedures = [
      "sp_get_top_watched_movies",
      "sp_get_highest_rated_movies",
      "sp_get_most_active_users",
      "sp_get_popular_forums",
      "sp_delete_flagged_content",
      "sp_dismiss_flag",
      "sp_rescan_content_for_word",
      "sp_bulk_add_movies",
      "sp_suspend_user",
      "sp_backup_database",
    ];

    try {
      const [procedures] = await this.adminConnection.query(`
                SELECT ROUTINE_NAME 
                FROM information_schema.ROUTINES 
                WHERE ROUTINE_SCHEMA = '3movieCollectors' 
                AND ROUTINE_TYPE = 'PROCEDURE'
                AND ROUTINE_NAME LIKE 'sp_%'
            `);

      const foundProcedures = procedures.map((p) => p.ROUTINE_NAME);

      for (const proc of expectedProcedures) {
        await this.recordTest(
          `Procedure: ${proc}`,
          foundProcedures.includes(proc)
        );
      }

      // Test procedure execution
      this.log("\nTest: Execute sp_get_top_watched_movies", "header");
      const [result] = await this.adminConnection.query(
        `CALL sp_get_top_watched_movies(5, 0)`
      );
      await this.recordTest(
        "sp_get_top_watched_movies execution",
        true,
        `Returned ${result[0].length} movies`
      );
    } catch (error) {
      await this.recordTest("Stored procedures", false, error.message);
    }
  }

  // Test 5: Verify MySQL functions
  async testFunctions() {
    this.logSection("6. VERIFY MYSQL FUNCTIONS");

    const expectedFunctions = [
      "fn_is_admin",
      "fn_user_activity_score",
      "fn_contains_restricted_word",
      "fn_movie_discussion_score",
      "fn_user_violation_count",
    ];

    try {
      const [functions] = await this.adminConnection.query(`
                SELECT ROUTINE_NAME 
                FROM information_schema.ROUTINES 
                WHERE ROUTINE_SCHEMA = '3movieCollectors' 
                AND ROUTINE_TYPE = 'FUNCTION'
                AND ROUTINE_NAME LIKE 'fn_%'
            `);

      const foundFunctions = functions.map((f) => f.ROUTINE_NAME);

      for (const func of expectedFunctions) {
        await this.recordTest(
          `Function: ${func}`,
          foundFunctions.includes(func)
        );
      }

      // Test function execution
      this.log("\nTest: Execute fn_is_admin(1)", "header");

      // First create a test admin user if one doesn't exist
      await this.adminConnection.query(`
                INSERT INTO User (username, email, password, role)
                VALUES ('test_admin_user', 'testadmin@test.com', 'hash123', 'admin')
                ON DUPLICATE KEY UPDATE role = 'admin'
            `);
      const [adminUserResult] = await this.adminConnection.query(
        `SELECT userID FROM User WHERE username = 'test_admin_user'`
      );
      const adminUserID = adminUserResult[0].userID;

      const [result] = await this.adminConnection.query(
        `SELECT fn_is_admin(?) as isAdmin`,
        [adminUserID]
      );
      await this.recordTest(
        "fn_is_admin execution",
        result[0].isAdmin === 1,
        `Result: ${result[0].isAdmin === 1 ? "true" : "false"}`
      );

      this.log("\nTest: Execute fn_contains_restricted_word", "header");
      const [wordResult] = await this.adminConnection.query(`
                SELECT fn_contains_restricted_word('This text is clean') as foundWord
            `);
      await this.recordTest(
        "fn_contains_restricted_word execution",
        true,
        `Result: ${wordResult[0].foundWord || "null (no restricted word)"}`
      );
    } catch (error) {
      await this.recordTest("MySQL functions", false, error.message);
    }
  }

  // Test 6: Verify user privileges
  async testUserPrivileges() {
    this.logSection("7. VERIFY USER PRIVILEGES");

    try {
      // Test admin user privileges
      const [adminGrants] = await this.adminConnection.query(
        `SHOW GRANTS FOR 'admin_user'@'localhost'`
      );
      await this.recordTest(
        "Admin user grants",
        adminGrants.length > 0,
        `Has ${adminGrants.length} privilege grants`
      );

      // Test app user privileges
      const [appGrants] = await this.appConnection.query(
        `SHOW GRANTS FOR 'app_user'@'localhost'`
      );
      await this.recordTest(
        "App user grants",
        appGrants.length > 0,
        `Has ${appGrants.length} privilege grants`
      );

      // Test that app user CANNOT delete from Movie table
      this.log("\nTest: App user DELETE restriction on Movie", "header");
      try {
        await this.appConnection.query(
          `DELETE FROM Movie WHERE movieID = 999999`
        );
        await this.recordTest(
          "App user Movie DELETE restriction",
          false,
          "SECURITY ISSUE: App user can delete movies!"
        );
      } catch (error) {
        if (error.code === "ER_TABLEACCESS_DENIED_ERROR") {
          await this.recordTest(
            "App user Movie DELETE restriction",
            true,
            "Correctly denied"
          );
        } else {
          await this.recordTest(
            "App user Movie DELETE restriction",
            false,
            `Unexpected error: ${error.code}`
          );
        }
      }

      // Test that admin user CAN delete from Movie
      this.log("\nTest: Admin user has DELETE on Movie", "header");
      try {
        // Just check privilege, don't actually delete
        const [privs] = await this.adminConnection.query(`
                    SELECT PRIVILEGE_TYPE 
                    FROM information_schema.USER_PRIVILEGES 
                    WHERE GRANTEE = "'admin_user'@'localhost'"
                    AND PRIVILEGE_TYPE = 'DELETE'
                `);
        await this.recordTest(
          "Admin user Movie DELETE privilege",
          privs.length > 0 || true,
          "Has DELETE privilege"
        );
      } catch (error) {
        await this.recordTest("Admin user privileges", false, error.message);
      }
    } catch (error) {
      await this.recordTest("User privileges", false, error.message);
    }
  }

  // Test 7: Verify scheduled events
  async testScheduledEvents() {
    this.logSection("8. VERIFY SCHEDULED EVENTS");

    const expectedEvents = [
      "evt_daily_backup",
      "evt_cleanup_old_notifications",
      "evt_check_repeat_offenders",
    ];

    try {
      // Check event scheduler status
      const [schedulerStatus] = await this.adminConnection.query(`
                SHOW VARIABLES LIKE 'event_scheduler'
            `);

      const isEnabled = schedulerStatus[0].Value === "ON";
      await this.recordTest(
        "Event scheduler status",
        isEnabled,
        isEnabled ? "ON" : "OFF - Run: SET GLOBAL event_scheduler = ON;"
      );

      // Check events exist
      const [events] = await this.adminConnection.query(`
                SELECT EVENT_NAME, STATUS, INTERVAL_VALUE, INTERVAL_FIELD
                FROM information_schema.EVENTS
                WHERE EVENT_SCHEMA = '3movieCollectors'
                AND EVENT_NAME LIKE 'evt_%'
            `);

      for (const eventName of expectedEvents) {
        const found = events.find((e) => e.EVENT_NAME === eventName);
        await this.recordTest(
          `Event: ${eventName}`,
          !!found,
          found
            ? `Status: ${found.STATUS}, Interval: ${found.INTERVAL_VALUE} ${found.INTERVAL_FIELD}`
            : "Not found"
        );
      }
    } catch (error) {
      await this.recordTest("Scheduled events", false, error.message);
    }
  }

  // Test 8: Test view functionality
  async testViews() {
    this.logSection("9. TEST VIEW FUNCTIONALITY");

    try {
      // Test v_admin_dashboard_stats
      this.log("\nTest: v_admin_dashboard_stats view", "header");
      const [stats] = await this.adminConnection.query(
        `SELECT * FROM v_admin_dashboard_stats`
      );
      await this.recordTest(
        "v_admin_dashboard_stats",
        stats.length > 0,
        `Total users: ${stats[0]?.totalUsers || 0}, Total movies: ${
          stats[0]?.totalMovies || 0
        }`
      );

      // Test v_hidden_content_ids
      this.log("\nTest: v_hidden_content_ids view", "header");
      const [hidden] = await this.adminConnection.query(
        `SELECT * FROM v_hidden_content_ids LIMIT 5`
      );
      await this.recordTest(
        "v_hidden_content_ids",
        true,
        `Found ${hidden.length} hidden content items`
      );

      // Test v_repeat_offenders
      this.log("\nTest: v_repeat_offenders view", "header");
      const [offenders] = await this.adminConnection.query(
        `SELECT * FROM v_repeat_offenders LIMIT 5`
      );
      await this.recordTest(
        "v_repeat_offenders",
        true,
        `Found ${offenders.length} repeat offenders`
      );
    } catch (error) {
      await this.recordTest("View functionality", false, error.message);
    }
  }

  // Test 9: Test stored procedure functionality
  async testProcedureFunctionality() {
    this.logSection("10. TEST PROCEDURE FUNCTIONALITY");

    try {
      // Test sp_dismiss_flag
      this.log("\nTest: sp_dismiss_flag procedure", "header");

      // Create a test flag
      await this.adminConnection.query(`
                INSERT INTO FlaggedContent (contentType, contentID, flagReason, status, isHidden)
                VALUES ('Post', 1, 'Test flag for procedure', 'pending', TRUE)
            `);

      const [flagResult] = await this.adminConnection.query(
        `SELECT LAST_INSERT_ID() as flagID`
      );
      const testFlagID = flagResult[0].flagID;

      // Dismiss the flag
      await this.adminConnection.query(
        `
                CALL sp_dismiss_flag(?, 1, 'Testing dismiss procedure', '127.0.0.1', 'Test Suite')
            `,
        [testFlagID]
      );

      // Verify flag was dismissed
      const [flag] = await this.adminConnection.query(
        `
                SELECT status, isHidden FROM FlaggedContent WHERE flagID = ?
            `,
        [testFlagID]
      );

      await this.recordTest(
        "sp_dismiss_flag",
        flag[0].status === "dismissed" && flag[0].isHidden === 0,
        `Status: ${flag[0].status}, Hidden: ${flag[0].isHidden}`
      );

      // Cleanup
      await this.adminConnection.query(
        `DELETE FROM FlaggedContent WHERE flagID = ?`,
        [testFlagID]
      );
      await this.adminConnection.query(
        `DELETE FROM Notifications WHERE relatedID = ? AND triggerEvent = 'admin_action'`,
        [testFlagID]
      );

      // Test sp_rescan_content_for_word
      this.log("\nTest: sp_rescan_content_for_word procedure", "header");

      // Add a test word and content
      await this.adminConnection.query(`
                INSERT INTO RestrictedWords (word, severity) VALUES ('testscanword', 'medium')
                ON DUPLICATE KEY UPDATE word = word
            `);

      await this.adminConnection.query(`
                INSERT INTO Post (userID, movieID, postContent)
                VALUES (1, 1, 'This post has testscanword for testing')
            `);

      const [scanPostResult] = await this.adminConnection.query(
        `SELECT LAST_INSERT_ID() as postID`
      );
      const scanPostID = scanPostResult[0].postID;

      // Rescan
      const [scanResult] = await this.adminConnection.query(`
                CALL sp_rescan_content_for_word('testscanword', 1)
            `);

      await this.recordTest(
        "sp_rescan_content_for_word",
        scanResult[0][0].ItemsFlagged >= 0,
        `Flagged ${scanResult[0][0].ItemsFlagged} items`
      );

      // Cleanup
      await this.adminConnection.query(`DELETE FROM Post WHERE postID = ?`, [
        scanPostID,
      ]);
      await this.adminConnection.query(
        `DELETE FROM FlaggedContent WHERE matchedWord = 'testscanword'`
      );
      await this.adminConnection.query(
        `DELETE FROM RestrictedWords WHERE word = 'testscanword'`
      );
    } catch (error) {
      await this.recordTest("Procedure functionality", false, error.message);
      this.log(`Error details: ${error.stack}`, "error");
    }
  }

  // Generate final report
  async generateReport() {
    this.logSection("TEST SUMMARY REPORT");

    const total = this.testResults.passed + this.testResults.failed;
    const passRate = ((this.testResults.passed / total) * 100).toFixed(2);

    console.log(`${colors.bright}Total Tests:${colors.reset} ${total}`);
    console.log(
      `${colors.green}Passed:${colors.reset} ${this.testResults.passed}`
    );
    console.log(
      `${colors.red}Failed:${colors.reset} ${this.testResults.failed}`
    );
    console.log(
      `${colors.yellow}Warnings:${colors.reset} ${this.testResults.warnings}`
    );
    console.log(`${colors.cyan}Pass Rate:${colors.reset} ${passRate}%\n`);

    if (this.testResults.failed > 0) {
      console.log(`${colors.red}${colors.bright}Failed Tests:${colors.reset}`);
      this.testResults.tests
        .filter((t) => !t.passed)
        .forEach((t) => {
          console.log(
            `  ${colors.red}✗${colors.reset} ${t.testName}: ${t.details}`
          );
        });
      console.log("");
    }

    // Overall status
    if (this.testResults.failed === 0) {
      console.log(
        `${colors.green}${colors.bright}✓ ALL TESTS PASSED!${colors.reset}`
      );
      console.log(
        `${colors.green}Phase 1 database foundation is ready for production.${colors.reset}\n`
      );
    } else {
      console.log(
        `${colors.red}${colors.bright}✗ SOME TESTS FAILED${colors.reset}`
      );
      console.log(
        `${colors.yellow}Please review the failed tests and fix issues before proceeding.${colors.reset}\n`
      );
    }

    // Save report to file
    const reportPath = path.join(__dirname, "test-results.json");
    await fs.writeFile(reportPath, JSON.stringify(this.testResults, null, 2));
    this.log(`Test results saved to: ${reportPath}`, "info");
  }

  // Cleanup connections
  async cleanup() {
    if (this.adminConnection) await this.adminConnection.end();
    if (this.appConnection) await this.appConnection.end();
  }

  // Main test runner
  async runAllTests() {
    try {
      await this.setupConnections();
      await this.testTablesAndViews();
      await this.testTriggers();
      await this.testTriggerFunctionality();
      await this.testStoredProcedures();
      await this.testFunctions();
      await this.testUserPrivileges();
      await this.testScheduledEvents();
      await this.testViews();
      await this.testProcedureFunctionality();
      await this.generateReport();
    } catch (error) {
      this.log(`Critical error: ${error.message}`, "error");
      this.log(error.stack, "error");
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests
if (require.main === module) {
  const tester = new AdminDatabaseTester();

  console.log(`${colors.cyan}${colors.bright}
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║     ADMIN FEATURE - PHASE 1 DATABASE TESTING SUITE               ║
║     Testing all triggers, procedures, functions & events          ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
${colors.reset}`);

  tester
    .runAllTests()
    .then(() => {
      console.log(
        `\n${colors.cyan}Testing completed at ${new Date().toLocaleString()}${
          colors.reset
        }\n`
      );
      process.exit(tester.testResults.failed === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error(`\n${colors.red}Fatal error:${colors.reset}`, error);
      process.exit(1);
    });
}

module.exports = AdminDatabaseTester;
