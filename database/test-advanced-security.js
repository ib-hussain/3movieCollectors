/**
 * Test Advanced Security Event Detection
 * Tests SQL injection, XSS, unauthorized access, and spam detection
 */

const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function testSecurityEvents() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: "3movieCollectors",
  });

  try {
    console.log("🧪 Testing Advanced Security Event Detection\n");

    // Get a test user
    const [users] = await connection.query(
      "SELECT userID, username FROM User WHERE role = 'user' LIMIT 1"
    );
    if (users.length === 0) {
      console.log("❌ No test user found");
      return;
    }
    const testUser = users[0];
    console.log(
      `✅ Using test user: ${testUser.username} (ID: ${testUser.userID})\n`
    );

    // Count security events before tests
    const [beforeCount] = await connection.query(
      "SELECT COUNT(*) as count FROM SecurityEvents"
    );
    const initialCount = beforeCount[0].count;
    console.log(`📊 Initial SecurityEvents count: ${initialCount}\n`);

    // TEST 1: SQL Injection in Post
    console.log("TEST 1: SQL Injection Detection in Post");
    try {
      await connection.query(
        "INSERT INTO Post (userID, movieID, postContent, createdAt) VALUES (?, ?, ?, NOW())",
        [testUser.userID, 1, "SELECT * FROM User WHERE 1=1 --"]
      );
      console.log("   ❌ FAILED - SQL injection was not blocked\n");
    } catch (err) {
      if (err.message.includes("malicious code")) {
        console.log("   ✅ PASSED - SQL injection blocked by trigger");
        console.log(`   📝 Error: ${err.message}\n`);
      } else {
        console.log(`   ⚠️  UNEXPECTED ERROR: ${err.message}\n`);
      }
    }

    // TEST 2: XSS in Post
    console.log("TEST 2: XSS Detection in Post");
    try {
      await connection.query(
        "INSERT INTO Post (userID, movieID, postContent, createdAt) VALUES (?, ?, ?, NOW())",
        [testUser.userID, 1, "<script>alert('XSS')</script>"]
      );
      console.log("   ❌ FAILED - XSS was not blocked\n");
    } catch (err) {
      if (err.message.includes("malicious code")) {
        console.log("   ✅ PASSED - XSS blocked by trigger");
        console.log(`   📝 Error: ${err.message}\n`);
      } else {
        console.log(`   ⚠️  UNEXPECTED ERROR: ${err.message}\n`);
      }
    }

    // TEST 3: SQL Injection in Comment
    console.log("TEST 3: SQL Injection Detection in Comment");
    try {
      await connection.query(
        "INSERT INTO Comments (postID, userID, commentContent, createdAt) VALUES (?, ?, ?, NOW())",
        [1, testUser.userID, "DROP TABLE User; --"]
      );
      console.log("   ❌ FAILED - SQL injection was not blocked\n");
    } catch (err) {
      if (err.message.includes("malicious code")) {
        console.log("   ✅ PASSED - SQL injection blocked by trigger");
        console.log(`   📝 Error: ${err.message}\n`);
      } else {
        console.log(`   ⚠️  UNEXPECTED ERROR: ${err.message}\n`);
      }
    }

    // TEST 4: XSS in Comment
    console.log("TEST 4: XSS Detection in Comment");
    try {
      await connection.query(
        "INSERT INTO Comments (postID, userID, commentContent, createdAt) VALUES (?, ?, ?, NOW())",
        [1, testUser.userID, "<img src=x onerror='alert(1)'>"]
      );
      console.log("   ❌ FAILED - XSS was not blocked\n");
    } catch (err) {
      if (err.message.includes("malicious code")) {
        console.log("   ✅ PASSED - XSS blocked by trigger");
        console.log(`   📝 Error: ${err.message}\n`);
      } else {
        console.log(`   ⚠️  UNEXPECTED ERROR: ${err.message}\n`);
      }
    }

    // TEST 5: SQL Injection in Review
    console.log("TEST 5: SQL Injection Detection in Review");
    const [movies] = await connection.query(
      "SELECT movieID FROM movie LIMIT 1"
    );
    if (movies.length > 0) {
      try {
        await connection.query(
          "INSERT INTO ReviewRatings (userID, movieID, rating, review, reviewDate) VALUES (?, ?, ?, ?, NOW())",
          [
            testUser.userID,
            movies[0].movieID,
            5,
            "UNION SELECT password FROM User",
          ]
        );
        console.log("   ❌ FAILED - SQL injection was not blocked\n");
      } catch (err) {
        if (err.message.includes("malicious code")) {
          console.log("   ✅ PASSED - SQL injection blocked by trigger");
          console.log(`   📝 Error: ${err.message}\n`);
        } else {
          console.log(`   ⚠️  UNEXPECTED ERROR: ${err.message}\n`);
        }
      }
    } else {
      console.log("   ⚠️  SKIPPED - No movies found\n");
    }

    // TEST 6: XSS in Review
    console.log("TEST 6: XSS Detection in Review");
    if (movies.length > 0) {
      try {
        await connection.query(
          "INSERT INTO ReviewRatings (userID, movieID, rating, review, reviewDate) VALUES (?, ?, ?, ?, NOW())",
          [
            testUser.userID,
            movies[0].movieID,
            5,
            "<iframe src='evil.com'></iframe>",
          ]
        );
        console.log("   ❌ FAILED - XSS was not blocked\n");
      } catch (err) {
        if (err.message.includes("malicious code")) {
          console.log("   ✅ PASSED - XSS blocked by trigger");
          console.log(`   📝 Error: ${err.message}\n`);
        } else {
          console.log(`   ⚠️  UNEXPECTED ERROR: ${err.message}\n`);
        }
      }
    } else {
      console.log("   ⚠️  SKIPPED - No movies found\n");
    }

    // TEST 7: Safe Content Should Pass
    console.log("TEST 7: Safe Content (Should Pass)");
    try {
      await connection.query(
        "INSERT INTO Post (userID, movieID, postContent, createdAt) VALUES (?, ?, ?, NOW())",
        [
          testUser.userID,
          1,
          "This is a normal post about movies. I love cinema!",
        ]
      );
      console.log("   ✅ PASSED - Safe content allowed\n");

      // Clean up the safe post
      await connection.query(
        "DELETE FROM Post WHERE userID = ? AND postContent = ?",
        [testUser.userID, "This is a normal post about movies. I love cinema!"]
      );
    } catch (err) {
      console.log(`   ❌ FAILED - Safe content blocked: ${err.message}\n`);
    }

    // TEST 8: Rapid Posting (Spam Detection)
    console.log("TEST 8: Spam Detection (Rapid Posting)");
    console.log("   Creating 6 posts rapidly...");
    for (let i = 0; i < 6; i++) {
      try {
        await connection.query(
          "INSERT INTO Post (userID, movieID, postContent, createdAt) VALUES (?, ?, ?, NOW())",
          [testUser.userID, 1, `Test spam post ${i + 1}`]
        );
      } catch (err) {
        // Ignore errors from restricted word checks
      }
    } // Wait a moment for trigger to process
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if spam was detected
    const [spamEvents] = await connection.query(
      "SELECT * FROM SecurityEvents WHERE userID = ? AND eventType = 'suspicious_activity' ORDER BY eventDate DESC LIMIT 1",
      [testUser.userID]
    );

    if (spamEvents.length > 0) {
      console.log("   ✅ PASSED - Spam detected and logged");
      console.log(`   📝 Event: ${spamEvents[0].description}\n`);
    } else {
      console.log("   ⚠️  No spam detection (may need more posts or time)\n");
    }

    // Clean up test posts
    await connection.query(
      "DELETE FROM Post WHERE userID = ? AND postContent LIKE 'Test spam post%'",
      [testUser.userID]
    );

    // Count security events after tests
    const [afterCount] = await connection.query(
      "SELECT COUNT(*) as count FROM SecurityEvents"
    );
    const finalCount = afterCount[0].count;
    const newEvents = finalCount - initialCount;

    console.log(`\n📊 Final SecurityEvents count: ${finalCount}`);
    console.log(`📈 New events logged: ${newEvents}\n`);

    // Show recent security events
    console.log("📋 Recent Security Events (last 10):\n");
    const [recentEvents] = await connection.query(`
      SELECT 
        eventType,
        username,
        description,
        severity,
        DATE_FORMAT(eventDate, '%Y-%m-%d %H:%i:%s') as eventDate
      FROM SecurityEvents
      ORDER BY eventDate DESC
      LIMIT 10
    `);

    recentEvents.forEach((event, idx) => {
      console.log(
        `${idx + 1}. [${event.severity.toUpperCase()}] ${event.eventType}`
      );
      console.log(`   User: ${event.username}`);
      console.log(`   Date: ${event.eventDate}`);
      console.log(`   Desc: ${event.description.substring(0, 100)}...`);
      console.log();
    });

    console.log("✅ All security tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run tests
testSecurityEvents()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
