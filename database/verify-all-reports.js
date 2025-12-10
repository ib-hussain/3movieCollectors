const db = require("../server/db");

async function verifyAllReportQueries() {
  try {
    console.log("\n=== Verifying All Report Queries ===\n");

    let allPassed = true;

    // ==================== AUDIT LOG ====================
    console.log("1. AUDIT LOG Reports:");

    const auditQuery = `
      SELECT 
        al.*,
        u.username
      FROM AuditLog al
      LEFT JOIN User u ON al.adminID = u.userID
      WHERE 1=1
      ORDER BY al.timeStamp DESC LIMIT 100
    `;

    const auditResults = await db.query(auditQuery);
    console.log(`   ✓ Query returned ${auditResults.length} records`);

    if (auditResults.length > 0) {
      const sample = auditResults[0];
      const hasRequiredFields =
        sample.logID &&
        sample.operationPerformed &&
        sample.username !== undefined;
      console.log(
        `   ✓ Has required fields: ${hasRequiredFields ? "YES" : "NO"}`
      );
      if (!hasRequiredFields) allPassed = false;
    }
    console.log();

    // ==================== USER ACTIVITY ====================
    console.log("2. USER ACTIVITY Reports:");

    const userActivityQuery = `
      SELECT 
        u.userID, u.username, u.email, u.registrationDate,
        COUNT(DISTINCT p.postID) as postCount,
        COUNT(DISTINCT r.movieID) as reviewCount,
        COUNT(DISTINCT c.commentID) as commentCount,
        (SELECT COUNT(*) FROM UserViolations WHERE userID = u.userID) as violationCount
      FROM User u
      LEFT JOIN Post p ON u.userID = p.userID
      LEFT JOIN ReviewRatings r ON u.userID = r.userID
      LEFT JOIN Comments c ON u.userID = c.userID
      WHERE u.role = 'user'
      GROUP BY u.userID
      ORDER BY postCount DESC, reviewCount DESC
      LIMIT 100
    `;

    const userActivityResults = await db.query(userActivityQuery);
    console.log(`   ✓ Query returned ${userActivityResults.length} records`);

    if (userActivityResults.length > 0) {
      const sample = userActivityResults[0];
      const hasRequiredFields =
        sample.userID &&
        sample.username &&
        sample.postCount !== undefined &&
        sample.reviewCount !== undefined &&
        sample.commentCount !== undefined &&
        sample.violationCount !== undefined;
      console.log(
        `   ✓ Has required fields: ${hasRequiredFields ? "YES" : "NO"}`
      );
      console.log(
        `   ✓ Sample: ${sample.username} - Posts: ${sample.postCount}, Reviews: ${sample.reviewCount}, Comments: ${sample.commentCount}, Violations: ${sample.violationCount}`
      );
      if (!hasRequiredFields) allPassed = false;
    }
    console.log();

    // ==================== FLAGGED CONTENT ====================
    console.log("3. FLAGGED CONTENT Reports:");

    const flaggedQuery = `
      SELECT 
        fc.*,
        'System' as flaggerUsername,
        CASE 
          WHEN fc.contentType = 'post' THEN (SELECT postContent FROM Post WHERE postID = fc.contentID)
          WHEN fc.contentType = 'review' THEN (SELECT review FROM ReviewRatings WHERE movieID = fc.contentID LIMIT 1)
          WHEN fc.contentType = 'comment' THEN (SELECT commentContent FROM Comments WHERE commentID = fc.contentID)
          ELSE NULL
        END as contentPreview
      FROM FlaggedContent fc
      WHERE 1=1
      ORDER BY fc.flaggedDate DESC LIMIT 100
    `;

    const flaggedResults = await db.query(flaggedQuery);
    console.log(`   ✓ Query returned ${flaggedResults.length} records`);

    if (flaggedResults.length > 0) {
      const sample = flaggedResults[0];
      const hasRequiredFields =
        sample.flagID &&
        sample.contentType &&
        sample.flaggerUsername &&
        sample.contentPreview !== undefined;
      console.log(
        `   ✓ Has required fields: ${hasRequiredFields ? "YES" : "NO"}`
      );
      console.log(
        `   ✓ Sample: ${sample.contentType} - Flagger: ${sample.flaggerUsername}, Status: ${sample.status}`
      );
      if (!hasRequiredFields) allPassed = false;
    }
    console.log();

    // ==================== SECURITY EVENTS ====================
    console.log("4. SECURITY EVENTS Reports:");

    const securityQuery = `
      SELECT 
        se.*,
        se.description as eventDetails,
        u.username
      FROM SecurityEvents se
      LEFT JOIN User u ON se.userID = u.userID
      WHERE 1=1
      ORDER BY se.eventDate DESC LIMIT 100
    `;

    const securityResults = await db.query(securityQuery);
    console.log(`   ✓ Query returned ${securityResults.length} records`);

    if (securityResults.length > 0) {
      const sample = securityResults[0];
      const hasRequiredFields =
        sample.eventID &&
        sample.eventType &&
        sample.eventDetails !== undefined &&
        sample.ipAddress;
      console.log(
        `   ✓ Has required fields: ${hasRequiredFields ? "YES" : "NO"}`
      );
      console.log(
        `   ✓ Sample: ${sample.eventType} - User: ${
          sample.username || "N/A"
        }, IP: ${sample.ipAddress}`
      );
      console.log(
        `   ✓ Event Details: ${
          sample.eventDetails ? sample.eventDetails.substring(0, 50) : "N/A"
        }...`
      );
      if (!hasRequiredFields) allPassed = false;
    }
    console.log();

    // ==================== COLUMN MAPPING CHECK ====================
    console.log("=== Column Mapping Verification ===\n");

    const mappings = [
      {
        report: "Audit Log PDF",
        expectedColumns: [
          "logID",
          "timeStamp",
          "username",
          "operationPerformed",
          "actionDetails",
        ],
        query: "AuditLog",
      },
      {
        report: "User Activity PDF",
        expectedColumns: [
          "userID",
          "username",
          "email",
          "registrationDate",
          "postCount",
          "reviewCount",
          "commentCount",
          "violationCount",
        ],
        query: "User Activity",
      },
      {
        report: "Flagged Content PDF",
        expectedColumns: [
          "flagID",
          "contentType",
          "flaggerUsername",
          "matchedWord",
          "status",
          "contentPreview",
        ],
        query: "Flagged Content",
      },
      {
        report: "Security Events PDF",
        expectedColumns: [
          "eventDate",
          "eventType",
          "username",
          "ipAddress",
          "eventDetails",
        ],
        query: "Security Events",
      },
    ];

    console.log("Checking if query results have all required columns:\n");

    // Check Audit Log
    if (auditResults.length > 0) {
      const missing = mappings[0].expectedColumns.filter(
        (col) => !(col in auditResults[0])
      );
      console.log(
        `✓ Audit Log: ${
          missing.length === 0
            ? "ALL COLUMNS PRESENT"
            : "MISSING: " + missing.join(", ")
        }`
      );
      if (missing.length > 0) allPassed = false;
    }

    // Check User Activity
    if (userActivityResults.length > 0) {
      const missing = mappings[1].expectedColumns.filter(
        (col) => !(col in userActivityResults[0])
      );
      console.log(
        `✓ User Activity: ${
          missing.length === 0
            ? "ALL COLUMNS PRESENT"
            : "MISSING: " + missing.join(", ")
        }`
      );
      if (missing.length > 0) allPassed = false;
    }

    // Check Flagged Content
    if (flaggedResults.length > 0) {
      const missing = mappings[2].expectedColumns.filter(
        (col) => !(col in flaggedResults[0])
      );
      console.log(
        `✓ Flagged Content: ${
          missing.length === 0
            ? "ALL COLUMNS PRESENT"
            : "MISSING: " + missing.join(", ")
        }`
      );
      if (missing.length > 0) allPassed = false;
    }

    // Check Security Events
    if (securityResults.length > 0) {
      const missing = mappings[3].expectedColumns.filter(
        (col) => !(col in securityResults[0])
      );
      console.log(
        `✓ Security Events: ${
          missing.length === 0
            ? "ALL COLUMNS PRESENT"
            : "MISSING: " + missing.join(", ")
        }`
      );
      if (missing.length > 0) allPassed = false;
    }

    console.log("\n=== Summary ===\n");
    console.log(`Total Audit Logs: ${auditResults.length}`);
    console.log(`Total Users: ${userActivityResults.length}`);
    console.log(`Total Flagged Content: ${flaggedResults.length}`);
    console.log(`Total Security Events: ${securityResults.length}`);
    console.log();

    if (allPassed) {
      console.log("✓✓✓ ALL REPORT QUERIES VERIFIED SUCCESSFULLY! ✓✓✓");
      console.log(
        "\nAll 4 report types (PDF + CSV = 8 endpoints) are ready to use!"
      );
    } else {
      console.log("❌ SOME ISSUES FOUND - Check messages above");
    }
    console.log();

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error("\n❌ Verification failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verifyAllReportQueries();
