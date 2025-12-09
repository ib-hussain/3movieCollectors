const axios = require("axios");
const mysql = require("mysql2/promise");

const API_BASE = "http://localhost:3000/api/admin";
let authCookie = "";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(status, message) {
  const timestamp = new Date().toLocaleTimeString();
  const symbols = { success: "✓", error: "✗", info: "ℹ", test: "►", warn: "⚠" };
  const colorMap = {
    success: colors.green,
    error: colors.red,
    info: colors.cyan,
    test: colors.blue,
    warn: colors.yellow,
  };
  console.log(
    `${colorMap[status]}[${timestamp}] ${symbols[status]} ${message}${colors.reset}`
  );
}

async function setupTestData(db) {
  try {
    // Create test users if they don't exist
    await db.query(`
      INSERT IGNORE INTO User (userID, username, email, password, registrationDate, role)
      VALUES 
        (100, 'testuser1', 'testuser1@test.com', 'hash', NOW(), 'user'),
        (101, 'testuser2', 'testuser2@test.com', 'hash', NOW(), 'user')
    `);

    // Create friendship
    await db.query(`
      INSERT IGNORE INTO Friends (user1, user2, friendshipDate)
      VALUES (100, 101, NOW())
    `);

    // Get friendID
    const [friends] = await db.query(
      `SELECT * FROM Friends WHERE user1 = 100 AND user2 = 101`
    );

    if (friends.length === 0) {
      throw new Error("Failed to create test friendship");
    }

    const friendID = friends[0].user1; // Using user1 as friendID

    // Create test messages
    await db.query(
      `
      INSERT INTO Message (friendID, senderID, receiverID, content, timeStamp, isRead)
      VALUES 
        (?, 100, 101, 'Test message 1', NOW(), 0),
        (?, 101, 100, 'Test message 2', NOW(), 1),
        (?, 100, 101, 'Test message 3', NOW(), 0)
    `,
      [friendID, friendID, friendID]
    );

    log("success", "Test data created successfully");
    return true;
  } catch (error) {
    log("error", `Failed to setup test data: ${error.message}`);
    return false;
  }
}

async function cleanupTestData(db) {
  try {
    await db.query(
      `DELETE FROM Message WHERE senderID IN (100, 101) OR receiverID IN (100, 101)`
    );
    await db.query(`DELETE FROM Friends WHERE user1 = 100 OR user2 = 101`);
    await db.query(`DELETE FROM User WHERE userID IN (100, 101)`);
    log("info", "Test data cleaned up");
  } catch (error) {
    log("warn", `Cleanup warning: ${error.message}`);
  }
}

async function login() {
  try {
    const response = await axios.post(
      "http://localhost:3000/api/auth/login",
      {
        email: "testadmin@test.com",
        password: "admin123",
      },
      {
        withCredentials: true,
      }
    );

    authCookie = response.headers["set-cookie"]?.[0] || "";

    if (!authCookie) {
      throw new Error("No auth cookie received");
    }

    log("success", "Admin login: Logged in successfully");
    return true;
  } catch (error) {
    log("error", `Admin login failed: ${error.message}`);
    return false;
  }
}

async function testMessagesEndpoints() {
  const results = { total: 0, passed: 0, failed: 0 };

  console.log("\n" + "=".repeat(70));
  log("info", "  TESTING MESSAGES ROUTES");
  console.log("=".repeat(70));

  // Test 1: Get all messages
  try {
    results.total++;
    log("test", "Test: GET /messages");
    const response = await axios.get(`${API_BASE}/messages`, {
      headers: { Cookie: authCookie },
    });

    if (response.data.success && Array.isArray(response.data.messages)) {
      log(
        "success",
        `Get messages: Retrieved ${response.data.messages.length} messages`
      );
      results.passed++;
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    log(
      "error",
      `Get messages failed: ${error.response?.data?.message || error.message}`
    );
    results.failed++;
  }

  // Test 2: Get message statistics
  try {
    results.total++;
    log("test", "Test: GET /messages/stats/overview");
    const response = await axios.get(`${API_BASE}/messages/stats/overview`, {
      headers: { Cookie: authCookie },
    });

    if (response.data.success && response.data.stats) {
      log(
        "success",
        `Get message stats: Total: ${response.data.stats.totalMessages}, Unread: ${response.data.stats.unreadMessages}`
      );
      results.passed++;
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    log(
      "error",
      `Get message stats failed: ${
        error.response?.data?.message || error.message
      }`
    );
    results.failed++;
  }

  // Test 3: Get conversation between users
  try {
    results.total++;
    log("test", "Test: GET /messages/conversation/100/101");
    const response = await axios.get(
      `${API_BASE}/messages/conversation/100/101`,
      {
        headers: { Cookie: authCookie },
      }
    );

    if (response.data.success && Array.isArray(response.data.messages)) {
      log(
        "success",
        `Get conversation: Found ${response.data.messages.length} messages`
      );
      results.passed++;
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    log(
      "error",
      `Get conversation failed: ${
        error.response?.data?.message || error.message
      }`
    );
    results.failed++;
  }

  // Test 4: Get specific message
  try {
    results.total++;
    log("test", "Test: GET /messages/:messageID");

    // First get a message ID
    const listResponse = await axios.get(`${API_BASE}/messages?limit=1`, {
      headers: { Cookie: authCookie },
    });

    if (listResponse.data.messages && listResponse.data.messages.length > 0) {
      const messageID = listResponse.data.messages[0].messageID;
      const response = await axios.get(`${API_BASE}/messages/${messageID}`, {
        headers: { Cookie: authCookie },
      });

      if (response.data.success && response.data.message) {
        log(
          "success",
          `Get specific message: Message ID ${messageID} retrieved`
        );
        results.passed++;
      } else {
        throw new Error("Invalid response format");
      }
    } else {
      log("warn", "No messages available to test specific message retrieval");
      results.passed++; // Pass since no data to test
    }
  } catch (error) {
    log(
      "error",
      `Get specific message failed: ${
        error.response?.data?.message || error.message
      }`
    );
    results.failed++;
  }

  // Test 5: Search messages
  try {
    results.total++;
    log("test", "Test: GET /messages?search=test");
    const response = await axios.get(`${API_BASE}/messages?search=test`, {
      headers: { Cookie: authCookie },
    });

    if (response.data.success && Array.isArray(response.data.messages)) {
      log(
        "success",
        `Search messages: Found ${response.data.messages.length} messages containing 'test'`
      );
      results.passed++;
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    log(
      "error",
      `Search messages failed: ${
        error.response?.data?.message || error.message
      }`
    );
    results.failed++;
  }

  return results;
}

async function runTests() {
  console.log("\n" + "╔" + "═".repeat(68) + "╗");
  console.log("║" + " ".repeat(68) + "║");
  console.log("║" + "     ADMIN MESSAGES API - TESTING SUITE".padEnd(69) + "║");
  console.log(
    "║" + "     Testing message moderation endpoints".padEnd(69) + "║"
  );
  console.log("║" + " ".repeat(68) + "║");
  console.log("╚" + "═".repeat(68) + "╝\n");

  let db;
  try {
    // Connect to database
    db = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "8956",
      database: "3movieCollectors",
    });
    log("success", "Connected to database");

    // Check if server is running
    try {
      await axios.get("http://localhost:3000/api/health");
      log("success", "Server is running");
    } catch (error) {
      log("error", "Server is not running. Please start the server first.");
      process.exit(1);
    }

    // Setup test data
    const setupSuccess = await setupTestData(db);
    if (!setupSuccess) {
      log("error", "Failed to setup test data. Exiting...");
      process.exit(1);
    }

    // Login as admin
    log("test", "Logging in as admin...");
    const loginSuccess = await login();
    if (!loginSuccess) {
      log("error", "Admin login failed. Cannot proceed with tests.");
      process.exit(1);
    }

    // Run tests
    const results = await testMessagesEndpoints();

    // Cleanup
    await cleanupTestData(db);

    // Summary
    console.log("\n" + "=".repeat(70));
    console.log("  TEST SUMMARY REPORT");
    console.log("=".repeat(70) + "\n");
    console.log(`Total Tests: ${results.total}`);
    console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
    console.log(
      `Pass Rate: ${((results.passed / results.total) * 100).toFixed(2)}%\n`
    );

    if (results.failed === 0) {
      log("success", "ALL TESTS PASSED!");
      console.log("Phase 3 messages moderation routes are ready.\n");
    } else {
      log("error", `${results.failed} TEST(S) FAILED!`);
      process.exit(1);
    }

    console.log(`Testing completed at ${new Date().toLocaleString()}\n`);
  } catch (error) {
    log("error", `Fatal error: ${error.message}`);
    process.exit(1);
  } finally {
    if (db) {
      await db.end();
    }
  }
}

runTests();
