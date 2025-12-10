const db = require("../server/db");

async function seedSecurityEvents() {
  try {
    console.log("\n=== Seeding Security Events ===\n");

    // Check existing count
    const existing = await db.query(
      "SELECT COUNT(*) as count FROM SecurityEvents"
    );
    console.log(`Current SecurityEvents count: ${existing[0].count}`);

    // Get some user IDs for realistic data
    const users = await db.query("SELECT userID, username FROM User LIMIT 5");

    const securityEvents = [
      // Failed login attempts
      {
        eventType: "failed_login",
        userID: users[0]?.userID || null,
        username: users[0]?.username || "unknown_user",
        eventDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        ipAddress: "192.168.1.100",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        requestPath: "/api/auth/login",
        requestMethod: "POST",
        description: "Failed login attempt - incorrect password",
        severity: "low",
        isReviewed: false,
      },
      {
        eventType: "failed_login",
        userID: users[1]?.userID || null,
        username: users[1]?.username || "test_user",
        eventDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        ipAddress: "10.0.0.50",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        requestPath: "/api/auth/login",
        requestMethod: "POST",
        description: "Failed login attempt - account locked",
        severity: "medium",
        isReviewed: true,
      },

      // Brute force attempts
      {
        eventType: "brute_force_attempt",
        userID: null,
        username: "admin",
        eventDate: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        ipAddress: "203.45.67.89",
        userAgent: "python-requests/2.28.0",
        requestPath: "/api/auth/login",
        requestMethod: "POST",
        description: "15 failed login attempts in 2 minutes from same IP",
        severity: "high",
        isReviewed: false,
      },
      {
        eventType: "brute_force_attempt",
        userID: null,
        username: "root",
        eventDate: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        ipAddress: "45.67.89.123",
        userAgent: "curl/7.68.0",
        requestPath: "/api/auth/login",
        requestMethod: "POST",
        description: "Multiple rapid login attempts detected",
        severity: "critical",
        isReviewed: true,
      },

      // Suspicious activities
      {
        eventType: "suspicious_activity",
        userID: users[2]?.userID || null,
        username: users[2]?.username || "suspicious_user",
        eventDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        ipAddress: "123.45.67.89",
        userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
        requestPath: "/api/admin/users",
        requestMethod: "GET",
        description: "Unauthorized access attempt to admin panel",
        severity: "high",
        isReviewed: false,
      },
      {
        eventType: "suspicious_activity",
        userID: users[3]?.userID || null,
        username: users[3]?.username || "scanner_bot",
        eventDate: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        ipAddress: "88.99.111.222",
        userAgent: "Nikto/2.1.6",
        requestPath: "/api/admin/dashboard",
        requestMethod: "GET",
        description: "Automated vulnerability scanning detected",
        severity: "critical",
        isReviewed: false,
      },

      // Unauthorized access attempts
      {
        eventType: "unauthorized_access",
        userID: users[4]?.userID || null,
        username: users[4]?.username || "regular_user",
        eventDate: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        ipAddress: "172.16.0.100",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)",
        requestPath: "/api/admin/moderation",
        requestMethod: "POST",
        description: "User attempted to access admin-only endpoint",
        severity: "medium",
        isReviewed: true,
      },

      // SQL injection attempts
      {
        eventType: "sql_injection_attempt",
        userID: null,
        username: "attacker",
        eventDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        ipAddress: "200.100.50.25",
        userAgent: "sqlmap/1.6",
        requestPath: "/api/movies/search",
        requestMethod: "GET",
        description: "SQL injection pattern detected in query parameters",
        severity: "critical",
        isReviewed: false,
      },

      // XSS attempts
      {
        eventType: "xss_attempt",
        userID: users[1]?.userID || null,
        username: users[1]?.username || "test_user",
        eventDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        ipAddress: "150.75.100.200",
        userAgent: "Mozilla/5.0 (Windows NT 10.0)",
        requestPath: "/api/posts/create",
        requestMethod: "POST",
        description: "XSS payload detected in post content",
        severity: "high",
        isReviewed: false,
      },

      // Additional recent events
      {
        eventType: "failed_login",
        userID: null,
        username: "nonexistent_user",
        eventDate: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        ipAddress: "192.168.1.150",
        userAgent: "Mozilla/5.0 (Android 12)",
        requestPath: "/api/auth/login",
        requestMethod: "POST",
        description: "Login attempt with non-existent username",
        severity: "low",
        isReviewed: false,
      },
    ];

    console.log(`\nInserting ${securityEvents.length} security events...\n`);

    for (let i = 0; i < securityEvents.length; i++) {
      const event = securityEvents[i];

      await db.query(
        `INSERT INTO SecurityEvents 
        (eventType, userID, username, eventDate, ipAddress, userAgent, requestPath, requestMethod, description, severity, isReviewed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.eventType,
          event.userID,
          event.username,
          event.eventDate,
          event.ipAddress,
          event.userAgent,
          event.requestPath,
          event.requestMethod,
          event.description,
          event.severity,
          event.isReviewed,
        ]
      );

      console.log(
        `${i + 1}. Added ${
          event.eventType
        } event - ${event.description.substring(0, 50)}...`
      );
    }

    // Show final count
    const final = await db.query(
      "SELECT COUNT(*) as count FROM SecurityEvents"
    );
    console.log(
      `\n✓ Seeding complete! Total SecurityEvents: ${final[0].count}`
    );

    // Show summary by event type
    const summary = await db.query(`
      SELECT 
        eventType, 
        COUNT(*) as count,
        SUM(CASE WHEN isReviewed = 1 THEN 1 ELSE 0 END) as reviewed
      FROM SecurityEvents 
      GROUP BY eventType
    `);

    console.log("\n=== Event Type Summary ===");
    summary.forEach((row) => {
      console.log(
        `${row.eventType}: ${row.count} total (${row.reviewed} reviewed)`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding security events:", error.message);
    process.exit(1);
  }
}

seedSecurityEvents();
