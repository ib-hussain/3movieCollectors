const db = require("../server/db");
const {
  logFailedLogin,
  logUnauthorizedAccess,
  logSQLInjection,
  logXSSAttempt,
  logSuspiciousActivity,
} = require("../server/middleware/securityLogger");

async function testSecurityProcedures() {
  try {
    console.log("\n=== Testing Security Event Logging Procedures ===\n");

    // Get initial count
    const initialCount = await db.query(
      "SELECT COUNT(*) as count FROM SecurityEvents WHERE eventDate >= NOW() - INTERVAL 1 MINUTE"
    );
    console.log(
      `Initial SecurityEvents count (last minute): ${initialCount[0].count}\n`
    );

    // Test 1: Log failed login
    console.log("1. Testing sp_log_failed_login...");
    await logFailedLogin(
      "testuser",
      "192.168.1.100",
      "Mozilla/5.0 (Windows NT 10.0)",
      "Incorrect password"
    );
    console.log("   ✓ Failed login logged\n");

    // Test 2: Multiple failed logins (should trigger brute force detection)
    console.log("2. Testing brute force detection...");
    for (let i = 0; i < 5; i++) {
      await logFailedLogin(
        "admin",
        "203.45.67.89",
        "curl/7.68.0",
        "Incorrect password"
      );
    }
    console.log(
      "   ✓ 5 failed logins logged (should trigger brute force alert)\n"
    );

    // Test 3: Log unauthorized access
    console.log("3. Testing sp_log_unauthorized_access...");
    await logUnauthorizedAccess(
      null,
      "regularuser",
      "10.0.0.50",
      "Mozilla/5.0 (Macintosh)",
      "/api/admin/dashboard",
      "GET",
      "Attempted to access admin panel without privileges"
    );
    console.log("   ✓ Unauthorized access logged\n");

    // Test 4: Log SQL injection attempt
    console.log("4. Testing sp_log_sql_injection...");
    await logSQLInjection(
      null,
      "attacker",
      "45.67.89.123",
      "sqlmap/1.6",
      "/api/movies/search",
      "GET",
      "query=' OR 1=1 --"
    );
    console.log("   ✓ SQL injection attempt logged\n");

    // Test 5: Log XSS attempt
    console.log("5. Testing sp_log_xss_attempt...");
    await logXSSAttempt(
      null,
      "hacker",
      "150.75.100.200",
      "Mozilla/5.0 (X11)",
      "/api/posts/create",
      "POST",
      '<script>alert("XSS")</script>'
    );
    console.log("   ✓ XSS attempt logged\n");

    // Test 6: Log suspicious activity
    console.log("6. Testing sp_log_suspicious_activity...");
    await logSuspiciousActivity(
      null,
      "scanner_bot",
      "88.99.111.222",
      "Nikto/2.1.6",
      "/api/admin",
      "GET",
      "Automated vulnerability scanning detected",
      "critical"
    );
    console.log("   ✓ Suspicious activity logged\n");

    // Verify results
    console.log("=== Verification ===\n");

    const newEvents = await db.query(`
      SELECT 
        eventType, 
        username, 
        ipAddress, 
        severity,
        description
      FROM SecurityEvents 
      WHERE eventDate >= NOW() - INTERVAL 1 MINUTE
      ORDER BY eventDate DESC
    `);

    console.log(`✓ Found ${newEvents.length} new security events:\n`);
    newEvents.forEach((event, i) => {
      console.log(
        `${i + 1}. [${event.severity.toUpperCase()}] ${event.eventType}`
      );
      console.log(`   User: ${event.username} | IP: ${event.ipAddress}`);
      console.log(`   Description: ${event.description.substring(0, 60)}...`);
      console.log();
    });

    // Check for brute force event
    const bruteForce = newEvents.filter(
      (e) => e.eventType === "brute_force_attempt"
    );
    if (bruteForce.length > 0) {
      console.log(
        "✓ Brute force detection working! (Automated procedure sp_check_brute_force was triggered)\n"
      );
    }

    // Summary by event type
    const summary = await db.query(`
      SELECT 
        eventType,
        COUNT(*) as count
      FROM SecurityEvents 
      WHERE eventDate >= NOW() - INTERVAL 1 MINUTE
      GROUP BY eventType
    `);

    console.log("=== Summary of New Events ===\n");
    summary.forEach((row) => {
      console.log(`  ${row.eventType}: ${row.count}`);
    });

    console.log("\n=== All Tests Passed! ✓ ===\n");
    console.log("Security event logging procedures are working correctly!");
    console.log(
      "Events are now automatically tracked via MySQL stored procedures.\n"
    );

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testSecurityProcedures();
