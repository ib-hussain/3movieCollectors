/**
 * Verify All 6 Security Event Types
 * Checks that failed_login, brute_force, unauthorized_access, sql_injection, xss, suspicious_activity
 * are all being logged and appearing in security event reports
 */

const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function verifyAllSecurityEventTypes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: "3movieCollectors",
  });

  try {
    console.log("🔍 Verifying All 6 Security Event Types\n");

    // Check counts for each event type
    const [eventCounts] = await connection.query(`
      SELECT 
        eventType,
        COUNT(*) as count,
        MAX(eventDate) as lastOccurrence
      FROM SecurityEvents
      GROUP BY eventType
      ORDER BY count DESC
    `);

    console.log("📊 Security Event Type Breakdown:\n");

    const expectedTypes = [
      "failed_login",
      "brute_force_attempt",
      "unauthorized_access",
      "sql_injection_attempt",
      "xss_attempt",
      "suspicious_activity",
    ];

    const foundTypes = new Set();
    eventCounts.forEach((row) => {
      foundTypes.add(row.eventType);
      const status = expectedTypes.includes(row.eventType) ? "✅" : "⚠️";
      console.log(
        `${status} ${row.eventType.padEnd(25)} : ${row.count} events (Last: ${
          row.lastOccurrence
        })`
      );
    });

    // Check for missing types
    console.log("\n🔎 Coverage Check:\n");
    let allPresent = true;
    expectedTypes.forEach((type) => {
      if (foundTypes.has(type)) {
        console.log(`✅ ${type.padEnd(25)} : PRESENT`);
      } else {
        console.log(`❌ ${type.padEnd(25)} : MISSING`);
        allPresent = false;
      }
    });

    // Test the security events query that reports use
    console.log("\n🔍 Testing Security Events Report Query:\n");
    const [reportData] = await connection.query(`
      SELECT 
        se.eventID,
        se.eventType,
        se.userID,
        se.username,
        se.ipAddress,
        se.requestPath,
        se.requestMethod,
        se.description as eventDetails,
        se.severity,
        se.isReviewed,
        DATE_FORMAT(se.eventDate, '%Y-%m-%d %H:%i:%s') as eventDate
      FROM SecurityEvents se
      ORDER BY se.eventDate DESC
      LIMIT 5
    `);

    console.log(`Found ${reportData.length} recent events in report format:\n`);
    reportData.forEach((event, idx) => {
      console.log(
        `${idx + 1}. [${event.severity.toUpperCase()}] ${event.eventType}`
      );
      console.log(`   User: ${event.username || "N/A"}`);
      console.log(`   Path: ${event.requestPath || "N/A"}`);
      console.log(
        `   Details: ${
          event.eventDetails
            ? event.eventDetails.substring(0, 80) + "..."
            : "N/A"
        }`
      );
      console.log(`   Date: ${event.eventDate}`);
      console.log();
    });

    // Verify triggers are active
    console.log("\n🛡️  Verifying Active Security Triggers:\n");
    const [triggers] = await connection.query(`
      SELECT 
        TRIGGER_NAME,
        EVENT_MANIPULATION,
        EVENT_OBJECT_TABLE,
        ACTION_TIMING
      FROM information_schema.TRIGGERS
      WHERE TRIGGER_SCHEMA = '3movieCollectors'
        AND TRIGGER_NAME LIKE '%sql_injection%' 
         OR TRIGGER_NAME LIKE '%xss%'
         OR TRIGGER_NAME LIKE '%spam%'
      ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME
    `);

    triggers.forEach((trg) => {
      console.log(
        `✅ ${trg.TRIGGER_NAME} (${trg.ACTION_TIMING} ${trg.EVENT_MANIPULATION} on ${trg.EVENT_OBJECT_TABLE})`
      );
    });

    // Verify detection functions exist
    console.log("\n🔧 Verifying Detection Functions:\n");
    const [functions] = await connection.query(`
      SELECT ROUTINE_NAME
      FROM information_schema.ROUTINES
      WHERE ROUTINE_SCHEMA = '3movieCollectors'
        AND ROUTINE_TYPE = 'FUNCTION'
        AND ROUTINE_NAME IN ('fn_detect_sql_injection', 'fn_detect_xss', 'fn_user_risk_score')
      ORDER BY ROUTINE_NAME
    `);

    functions.forEach((fn) => {
      console.log(`✅ ${fn.ROUTINE_NAME}`);
    });

    // Test function calls
    console.log("\n🧪 Testing Detection Functions:\n");
    const [sqlTest] = await connection.query(
      "SELECT fn_detect_sql_injection('SELECT * FROM User WHERE 1=1') as detected"
    );
    console.log(
      `   fn_detect_sql_injection: ${
        sqlTest[0].detected ? "✅ WORKS" : "❌ FAILED"
      }`
    );

    const [xssTest] = await connection.query(
      "SELECT fn_detect_xss('<script>alert(1)</script>') as detected"
    );
    console.log(
      `   fn_detect_xss: ${xssTest[0].detected ? "✅ WORKS" : "❌ FAILED"}`
    );

    const [riskTest] = await connection.query(
      "SELECT fn_user_risk_score(1) as score"
    );
    console.log(
      `   fn_user_risk_score: ${
        riskTest[0].score >= 0
          ? `✅ WORKS (Score: ${riskTest[0].score})`
          : "❌ FAILED"
      }`
    );

    // Verify stored procedures for manual logging
    console.log("\n📞 Verifying Stored Procedures:\n");
    const [procedures] = await connection.query(`
      SELECT ROUTINE_NAME
      FROM information_schema.ROUTINES
      WHERE ROUTINE_SCHEMA = '3movieCollectors'
        AND ROUTINE_TYPE = 'PROCEDURE'
        AND ROUTINE_NAME LIKE 'sp_log_%'
      ORDER BY ROUTINE_NAME
    `);

    procedures.forEach((proc) => {
      console.log(`✅ ${proc.ROUTINE_NAME}`);
    });

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📋 INTEGRATION STATUS SUMMARY");
    console.log("=".repeat(60));

    const integrationStatus = {
      "Failed Login": {
        trigger: "N/A (handled in application)",
        procedure: "sp_log_failed_login",
        status: foundTypes.has("failed_login") ? "✅ ACTIVE" : "❌ INACTIVE",
      },
      "Brute Force": {
        trigger: "N/A (auto-triggered by sp_log_failed_login)",
        procedure: "sp_check_brute_force",
        status: foundTypes.has("brute_force_attempt")
          ? "✅ ACTIVE"
          : "❌ INACTIVE",
      },
      "Unauthorized Access": {
        trigger: "N/A (requireAdmin middleware)",
        procedure: "sp_log_unauthorized_access",
        status: foundTypes.has("unauthorized_access")
          ? "✅ ACTIVE"
          : "❌ INACTIVE",
      },
      "SQL Injection": {
        trigger:
          "trg_post_sql_injection, trg_comment_sql_injection, trg_review_sql_injection",
        procedure: "N/A (trigger-based)",
        status: foundTypes.has("sql_injection_attempt")
          ? "✅ ACTIVE"
          : "❌ INACTIVE",
      },
      "XSS Detection": {
        trigger: "trg_post_xss, trg_comment_xss, trg_review_xss",
        procedure: "N/A (trigger-based)",
        status: foundTypes.has("xss_attempt") ? "✅ ACTIVE" : "❌ INACTIVE",
      },
      "Suspicious Activity": {
        trigger: "trg_detect_spam",
        procedure: "sp_log_suspicious_activity",
        status: foundTypes.has("suspicious_activity")
          ? "✅ ACTIVE"
          : "❌ INACTIVE",
      },
    };

    console.log("\n");
    Object.entries(integrationStatus).forEach(([name, info]) => {
      console.log(`${info.status.padEnd(12)} ${name}`);
      console.log(`           Detection: ${info.trigger}`);
      console.log(`           Logging: ${info.procedure}`);
      console.log();
    });

    console.log("=".repeat(60));
    if (allPresent) {
      console.log("✅ ALL 6 SECURITY EVENT TYPES ARE ACTIVE AND LOGGING");
    } else {
      console.log("⚠️  SOME SECURITY EVENT TYPES ARE MISSING");
      console.log(
        "💡 Run test-security-procedures.js to populate missing event types"
      );
    }
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Verification failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run verification
verifyAllSecurityEventTypes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
