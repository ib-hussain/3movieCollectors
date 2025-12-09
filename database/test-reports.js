const axios = require("axios");
const fs = require("fs");
const path = require("path");

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

async function testReportsEndpoints() {
  const results = { total: 0, passed: 0, failed: 0 };
  const outputDir = path.join(__dirname, "test-exports");

  // Create output directory for test files
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("\n" + "=".repeat(70));
  log("info", "  TESTING REPORTS & EXPORT ROUTES");
  console.log("=".repeat(70));

  // Test 1: Audit Log PDF Export
  try {
    results.total++;
    log("test", "Test: GET /reports/audit-log/pdf");
    const response = await axios.get(
      `${API_BASE}/reports/audit-log/pdf?limit=10`,
      {
        headers: { Cookie: authCookie },
        responseType: "arraybuffer",
      }
    );

    if (response.headers["content-type"] === "application/pdf") {
      const filename = path.join(outputDir, "audit-log-test.pdf");
      fs.writeFileSync(filename, response.data);
      log(
        "success",
        `Audit log PDF: Generated successfully (${response.data.length} bytes)`
      );
      results.passed++;
    } else {
      throw new Error("Invalid content type");
    }
  } catch (error) {
    log(
      "error",
      `Audit log PDF failed: ${error.response?.data?.message || error.message}`
    );
    results.failed++;
  }

  // Test 2: Audit Log CSV Export
  try {
    results.total++;
    log("test", "Test: GET /reports/audit-log/csv");
    const response = await axios.get(
      `${API_BASE}/reports/audit-log/csv?limit=10`,
      {
        headers: { Cookie: authCookie },
      }
    );

    if (response.headers["content-type"].includes("text/csv")) {
      const filename = path.join(outputDir, "audit-log-test.csv");
      fs.writeFileSync(filename, response.data);
      const lines = response.data.split("\n").length;
      log("success", `Audit log CSV: Generated successfully (${lines} lines)`);
      results.passed++;
    } else {
      throw new Error("Invalid content type");
    }
  } catch (error) {
    log(
      "error",
      `Audit log CSV failed: ${error.response?.data?.message || error.message}`
    );
    results.failed++;
  }

  // Test 3: User Activity PDF Export
  try {
    results.total++;
    log("test", "Test: GET /reports/user-activity/pdf");
    const response = await axios.get(`${API_BASE}/reports/user-activity/pdf`, {
      headers: { Cookie: authCookie },
      responseType: "arraybuffer",
    });

    if (response.headers["content-type"] === "application/pdf") {
      const filename = path.join(outputDir, "user-activity-test.pdf");
      fs.writeFileSync(filename, response.data);
      log(
        "success",
        `User activity PDF: Generated successfully (${response.data.length} bytes)`
      );
      results.passed++;
    } else {
      throw new Error("Invalid content type");
    }
  } catch (error) {
    log(
      "error",
      `User activity PDF failed: ${
        error.response?.data?.message || error.message
      }`
    );
    results.failed++;
  }

  // Test 4: User Activity CSV Export
  try {
    results.total++;
    log("test", "Test: GET /reports/user-activity/csv");
    const response = await axios.get(`${API_BASE}/reports/user-activity/csv`, {
      headers: { Cookie: authCookie },
    });

    if (response.headers["content-type"].includes("text/csv")) {
      const filename = path.join(outputDir, "user-activity-test.csv");
      fs.writeFileSync(filename, response.data);
      const lines = response.data.split("\n").length;
      log(
        "success",
        `User activity CSV: Generated successfully (${lines} lines)`
      );
      results.passed++;
    } else {
      throw new Error("Invalid content type");
    }
  } catch (error) {
    log(
      "error",
      `User activity CSV failed: ${
        error.response?.data?.message || error.message
      }`
    );
    results.failed++;
  }

  // Test 5: Flagged Content PDF Export
  try {
    results.total++;
    log("test", "Test: GET /reports/flagged-content/pdf");
    const response = await axios.get(
      `${API_BASE}/reports/flagged-content/pdf?status=all`,
      {
        headers: { Cookie: authCookie },
        responseType: "arraybuffer",
      }
    );

    if (response.headers["content-type"] === "application/pdf") {
      const filename = path.join(outputDir, "flagged-content-test.pdf");
      fs.writeFileSync(filename, response.data);
      log(
        "success",
        `Flagged content PDF: Generated successfully (${response.data.length} bytes)`
      );
      results.passed++;
    } else {
      throw new Error("Invalid content type");
    }
  } catch (error) {
    log(
      "error",
      `Flagged content PDF failed: ${
        error.response?.data?.message || error.message
      }`
    );
    results.failed++;
  }

  // Test 6: Flagged Content CSV Export
  try {
    results.total++;
    log("test", "Test: GET /reports/flagged-content/csv");
    const response = await axios.get(
      `${API_BASE}/reports/flagged-content/csv?status=all`,
      {
        headers: { Cookie: authCookie },
      }
    );

    if (response.headers["content-type"].includes("text/csv")) {
      const filename = path.join(outputDir, "flagged-content-test.csv");
      fs.writeFileSync(filename, response.data);
      const lines = response.data.split("\n").length;
      log(
        "success",
        `Flagged content CSV: Generated successfully (${lines} lines)`
      );
      results.passed++;
    } else {
      throw new Error("Invalid content type");
    }
  } catch (error) {
    log(
      "error",
      `Flagged content CSV failed: ${
        error.response?.data?.message || error.message
      }`
    );
    results.failed++;
  }

  // Test 7: Security Events PDF Export
  try {
    results.total++;
    log("test", "Test: GET /reports/security-events/pdf");
    const response = await axios.get(
      `${API_BASE}/reports/security-events/pdf`,
      {
        headers: { Cookie: authCookie },
        responseType: "arraybuffer",
      }
    );

    if (response.headers["content-type"] === "application/pdf") {
      const filename = path.join(outputDir, "security-events-test.pdf");
      fs.writeFileSync(filename, response.data);
      log(
        "success",
        `Security events PDF: Generated successfully (${response.data.length} bytes)`
      );
      results.passed++;
    } else {
      throw new Error("Invalid content type");
    }
  } catch (error) {
    log(
      "error",
      `Security events PDF failed: ${
        error.response?.data?.message || error.message
      }`
    );
    results.failed++;
  }

  // Test 8: Security Events CSV Export
  try {
    results.total++;
    log("test", "Test: GET /reports/security-events/csv");
    const response = await axios.get(
      `${API_BASE}/reports/security-events/csv`,
      {
        headers: { Cookie: authCookie },
      }
    );

    if (response.headers["content-type"].includes("text/csv")) {
      const filename = path.join(outputDir, "security-events-test.csv");
      fs.writeFileSync(filename, response.data);
      const lines = response.data.split("\n").length;
      log(
        "success",
        `Security events CSV: Generated successfully (${lines} lines)`
      );
      results.passed++;
    } else {
      throw new Error("Invalid content type");
    }
  } catch (error) {
    log(
      "error",
      `Security events CSV failed: ${
        error.response?.data?.message || error.message
      }`
    );
    results.failed++;
  }

  log("info", `Test exports saved to: ${outputDir}`);

  return results;
}

async function runTests() {
  console.log("\n" + "╔" + "═".repeat(68) + "╗");
  console.log("║" + " ".repeat(68) + "║");
  console.log(
    "║" + "     ADMIN REPORTS & EXPORT - TESTING SUITE".padEnd(69) + "║"
  );
  console.log(
    "║" + "     Testing PDF and CSV export endpoints".padEnd(69) + "║"
  );
  console.log("║" + " ".repeat(68) + "║");
  console.log("╚" + "═".repeat(68) + "╝\n");

  try {
    // Check if server is running
    try {
      await axios.get("http://localhost:3000/api/health");
      log("success", "Server is running");
    } catch (error) {
      log("error", "Server is not running. Please start the server first.");
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
    const results = await testReportsEndpoints();

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
      console.log("Phase 4 reports & export functionality is ready.\n");
    } else {
      log("error", `${results.failed} TEST(S) FAILED!`);
      process.exit(1);
    }

    console.log(`Testing completed at ${new Date().toLocaleString()}\n`);
  } catch (error) {
    log("error", `Fatal error: ${error.message}`);
    process.exit(1);
  }
}

runTests();
