// Admin API Routes Testing Suite
// Tests all Phase 2 admin endpoints

const mysql = require("mysql2/promise");
const axios = require("axios");
const readline = require("readline");

class AdminAPITester {
  constructor() {
    this.baseURL = "http://localhost:3000/api";
    this.adminCookie = null;
    this.testResults = [];
    this.colors = {
      green: "\x1b[32m",
      red: "\x1b[31m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      cyan: "\x1b[36m",
      reset: "\x1b[0m",
      bold: "\x1b[1m",
    };
  }

  log(message, type = "info") {
    const timestamp = new Date().toLocaleTimeString();
    const types = {
      success: `${this.colors.green}✓${this.colors.reset}`,
      error: `${this.colors.red}✗${this.colors.reset}`,
      warning: `${this.colors.yellow}⚠${this.colors.reset}`,
      info: `${this.colors.cyan}ℹ${this.colors.reset}`,
      header: `${this.colors.bold}${this.colors.blue}►${this.colors.reset}`,
    };

    console.log(`[${timestamp}] ${types[type] || ""} ${message}`);
  }

  async recordTest(testName, passed, details = "") {
    this.testResults.push({
      name: testName,
      passed,
      details,
      timestamp: new Date(),
    });

    if (passed) {
      this.log(`${testName}: ${details}`, "success");
    } else {
      this.log(`${testName}: ${details}`, "error");
    }
  }

  // ==================== AUTHENTICATION ====================

  async loginAsAdmin() {
    try {
      this.log("\nLogging in as admin...", "header");

      const response = await axios.post(
        `${this.baseURL}/auth/login`,
        {
          email: "testadmin@test.com",
          password: "admin123",
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        // Extract session cookie
        this.adminCookie = response.headers["set-cookie"]?.[0] || "";
        await this.recordTest("Admin login", true, "Logged in successfully");
        return true;
      } else {
        await this.recordTest("Admin login", false, "Login failed");
        return false;
      }
    } catch (error) {
      await this.recordTest(
        "Admin login",
        false,
        error.response?.data?.message || error.message
      );
      return false;
    }
  }

  // ==================== MODERATION ROUTES ====================

  async testModerationRoutes() {
    this.log("\n" + "=".repeat(70), "info");
    this.log("  TESTING MODERATION ROUTES", "info");
    this.log("=".repeat(70), "info");

    try {
      // Test GET /api/admin/moderation/flags
      this.log("\nTest: GET /moderation/flags", "header");
      const flagsResponse = await axios.get(
        `${this.baseURL}/admin/moderation/flags`,
        {
          headers: { Cookie: this.adminCookie },
          params: { status: "pending", limit: 10 },
        }
      );
      await this.recordTest(
        "Get flagged content",
        flagsResponse.data.success,
        `Retrieved ${flagsResponse.data.flags?.length || 0} flags`
      );

      // Test GET /api/admin/moderation/stats
      this.log("\nTest: GET /moderation/stats", "header");
      const statsResponse = await axios.get(
        `${this.baseURL}/admin/moderation/stats`,
        {
          headers: { Cookie: this.adminCookie },
        }
      );
      await this.recordTest(
        "Get moderation stats",
        statsResponse.data.success,
        `Total flags: ${statsResponse.data.stats?.totalFlags || 0}`
      );

      // If there are pending flags, test dismiss
      if (flagsResponse.data.flags && flagsResponse.data.flags.length > 0) {
        const testFlag = flagsResponse.data.flags[0];
        this.log(
          `\nTest: PUT /moderation/flags/${testFlag.flagID}/dismiss`,
          "header"
        );
        const dismissResponse = await axios.put(
          `${this.baseURL}/admin/moderation/flags/${testFlag.flagID}/dismiss`,
          {
            reason: "Test dismissal from API test suite",
          },
          {
            headers: { Cookie: this.adminCookie },
          }
        );
        await this.recordTest(
          "Dismiss flag",
          dismissResponse.data.success,
          dismissResponse.data.message
        );
      } else {
        this.log("No flags available to test dismiss", "warning");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      const statusCode = error.response?.status || "N/A";
      await this.recordTest(
        "Moderation routes",
        false,
        `[${statusCode}] ${errorMsg}`
      );
      if (error.response?.data) {
        console.log(`     Error details:`, error.response.data);
      }
    }
  }

  // ==================== USER MANAGEMENT ROUTES ====================

  async testUserManagementRoutes() {
    this.log("\n" + "=".repeat(70), "info");
    this.log("  TESTING USER MANAGEMENT ROUTES", "info");
    this.log("=".repeat(70), "info");

    try {
      // Test GET /api/admin/users
      this.log("\nTest: GET /users", "header");
      const usersResponse = await axios.get(`${this.baseURL}/admin/users`, {
        headers: { Cookie: this.adminCookie },
        params: { role: "user", limit: 10 },
      });
      await this.recordTest(
        "Get users list",
        usersResponse.data.success,
        `Retrieved ${usersResponse.data.users?.length || 0} users`
      );

      // Test GET /api/admin/users/:userID
      if (usersResponse.data.users && usersResponse.data.users.length > 0) {
        const testUser = usersResponse.data.users[0];
        this.log(`\nTest: GET /users/${testUser.userID}`, "header");
        const userDetailsResponse = await axios.get(
          `${this.baseURL}/admin/users/${testUser.userID}`,
          {
            headers: { Cookie: this.adminCookie },
          }
        );
        await this.recordTest(
          "Get user details",
          userDetailsResponse.data.success,
          `User: ${userDetailsResponse.data.user?.username || "N/A"}`
        );

        // Test GET /api/admin/users/:userID/violations
        this.log(`\nTest: GET /users/${testUser.userID}/violations`, "header");
        const violationsResponse = await axios.get(
          `${this.baseURL}/admin/users/${testUser.userID}/violations`,
          {
            headers: { Cookie: this.adminCookie },
          }
        );
        await this.recordTest(
          "Get user violations",
          violationsResponse.data.success,
          `Found ${violationsResponse.data.violations?.length || 0} violations`
        );
      }

      // Test GET /api/admin/users/views/repeat-offenders
      this.log("\nTest: GET /users/views/repeat-offenders", "header");
      const offendersResponse = await axios.get(
        `${this.baseURL}/admin/users/views/repeat-offenders`,
        {
          headers: { Cookie: this.adminCookie },
        }
      );
      await this.recordTest(
        "Get repeat offenders",
        offendersResponse.data.success,
        `Found ${
          offendersResponse.data.offenders?.length || 0
        } repeat offenders`
      );
    } catch (error) {
      await this.recordTest(
        "User management routes",
        false,
        error.response?.data?.message || error.message
      );
    }
  }

  // ==================== MOVIE MANAGEMENT ROUTES ====================

  async testMovieManagementRoutes() {
    this.log("\n" + "=".repeat(70), "info");
    this.log("  TESTING MOVIE MANAGEMENT ROUTES", "info");
    this.log("=".repeat(70), "info");

    try {
      // Test GET /api/admin/movies/stats
      this.log("\nTest: GET /movies/stats", "header");
      const statsResponse = await axios.get(
        `${this.baseURL}/admin/movies/stats`,
        {
          headers: { Cookie: this.adminCookie },
        }
      );
      await this.recordTest(
        "Get movie stats",
        statsResponse.data.success,
        `Total movies: ${statsResponse.data.stats?.totalMovies || 0}`
      );

      // Test GET /api/admin/movies/most-watched
      this.log("\nTest: GET /movies/most-watched", "header");
      const watchedResponse = await axios.get(
        `${this.baseURL}/admin/movies/most-watched`,
        {
          headers: { Cookie: this.adminCookie },
          params: { limit: 5 },
        }
      );
      await this.recordTest(
        "Get most watched movies",
        watchedResponse.data.success,
        `Retrieved ${watchedResponse.data.movies?.length || 0} movies`
      );

      // Test GET /api/admin/movies/highest-rated
      this.log("\nTest: GET /movies/highest-rated", "header");
      const ratedResponse = await axios.get(
        `${this.baseURL}/admin/movies/highest-rated`,
        {
          headers: { Cookie: this.adminCookie },
          params: { limit: 5 },
        }
      );
      await this.recordTest(
        "Get highest rated movies",
        ratedResponse.data.success,
        `Retrieved ${ratedResponse.data.movies?.length || 0} movies`
      );

      // Test POST /api/admin/movies/bulk-add
      this.log("\nTest: POST /movies/bulk-add", "header");
      const bulkAddResponse = await axios.post(
        `${this.baseURL}/admin/movies/bulk-add`,
        {
          movies: [
            {
              title: "Test Movie from API",
              releaseYear: 2025,
              director: "Test Director",
              synopsis: "A test movie added via API",
            },
          ],
        },
        {
          headers: { Cookie: this.adminCookie },
        }
      );
      await this.recordTest(
        "Bulk add movies",
        bulkAddResponse.data.success,
        bulkAddResponse.data.message
      );
    } catch (error) {
      await this.recordTest(
        "Movie management routes",
        false,
        error.response?.data?.message || error.message
      );
    }
  }

  // ==================== DASHBOARD ROUTES ====================

  async testDashboardRoutes() {
    this.log("\n" + "=".repeat(70), "info");
    this.log("  TESTING DASHBOARD ROUTES", "info");
    this.log("=".repeat(70), "info");

    try {
      // Test GET /api/admin/dashboard/overview
      this.log("\nTest: GET /dashboard/overview", "header");
      const overviewResponse = await axios.get(
        `${this.baseURL}/admin/dashboard/overview`,
        {
          headers: { Cookie: this.adminCookie },
        }
      );
      await this.recordTest(
        "Get dashboard overview",
        overviewResponse.data.success,
        `Users: ${overviewResponse.data.stats?.totalUsers || 0}, Movies: ${
          overviewResponse.data.stats?.totalMovies || 0
        }`
      );

      // Test GET /api/admin/dashboard/audit-log
      this.log("\nTest: GET /dashboard/audit-log", "header");
      const auditResponse = await axios.get(
        `${this.baseURL}/admin/dashboard/audit-log`,
        {
          headers: { Cookie: this.adminCookie },
          params: { limit: 10 },
        }
      );
      await this.recordTest(
        "Get audit log",
        auditResponse.data.success,
        `Retrieved ${auditResponse.data.logs?.length || 0} log entries`
      );

      // Test GET /api/admin/dashboard/notifications
      this.log("\nTest: GET /dashboard/notifications", "header");
      const notificationsResponse = await axios.get(
        `${this.baseURL}/admin/dashboard/notifications`,
        {
          headers: { Cookie: this.adminCookie },
          params: { isRead: false },
        }
      );
      await this.recordTest(
        "Get admin notifications",
        notificationsResponse.data.success,
        `Unread: ${notificationsResponse.data.unreadCount || 0}`
      );

      // Test GET /api/admin/dashboard/security-events
      this.log("\nTest: GET /dashboard/security-events", "header");
      const securityResponse = await axios.get(
        `${this.baseURL}/admin/dashboard/security-events`,
        {
          headers: { Cookie: this.adminCookie },
          params: { limit: 10 },
        }
      );
      await this.recordTest(
        "Get security events",
        securityResponse.data.success,
        `Retrieved ${securityResponse.data.events?.length || 0} events`
      );

      // Test GET /api/admin/dashboard/reports/user-activity
      this.log("\nTest: GET /dashboard/reports/user-activity", "header");
      const activityResponse = await axios.get(
        `${this.baseURL}/admin/dashboard/reports/user-activity`,
        {
          headers: { Cookie: this.adminCookie },
          params: { limit: 10 },
        }
      );
      await this.recordTest(
        "Get user activity report",
        activityResponse.data.success,
        `Retrieved ${activityResponse.data.users?.length || 0} active users`
      );

      // Test GET /api/admin/dashboard/reports/content-stats
      this.log("\nTest: GET /dashboard/reports/content-stats", "header");
      const contentStatsResponse = await axios.get(
        `${this.baseURL}/admin/dashboard/reports/content-stats`,
        {
          headers: { Cookie: this.adminCookie },
        }
      );
      await this.recordTest(
        "Get content statistics",
        contentStatsResponse.data.success,
        `Posts: ${contentStatsResponse.data.stats?.totalPosts || 0}, Reviews: ${
          contentStatsResponse.data.stats?.totalReviews || 0
        }`
      );
    } catch (error) {
      await this.recordTest(
        "Dashboard routes",
        false,
        error.response?.data?.message || error.message
      );
    }
  }

  // ==================== RESTRICTED WORDS ROUTES ====================

  async testRestrictedWordsRoutes() {
    this.log("\n" + "=".repeat(70), "info");
    this.log("  TESTING RESTRICTED WORDS ROUTES", "info");
    this.log("=".repeat(70), "info");

    try {
      // Test GET /api/admin/restricted-words/stats
      this.log("\nTest: GET /restricted-words/stats", "header");
      const statsResponse = await axios.get(
        `${this.baseURL}/admin/restricted-words/stats`,
        {
          headers: { Cookie: this.adminCookie },
        }
      );
      await this.recordTest(
        "Get restricted words stats",
        statsResponse.data.success,
        `Total words: ${statsResponse.data.stats?.totalWords || 0}`
      );

      // Test GET /api/admin/restricted-words
      this.log("\nTest: GET /restricted-words", "header");
      const wordsResponse = await axios.get(
        `${this.baseURL}/admin/restricted-words`,
        {
          headers: { Cookie: this.adminCookie },
        }
      );
      await this.recordTest(
        "Get restricted words list",
        wordsResponse.data.success,
        `Retrieved ${wordsResponse.data.words?.length || 0} words`
      );

      // Test POST /api/admin/restricted-words
      this.log("\nTest: POST /restricted-words", "header");
      const testWord = `apitest${Date.now()}`;
      const addResponse = await axios.post(
        `${this.baseURL}/admin/restricted-words`,
        {
          word: testWord,
          severity: "low",
        },
        {
          headers: { Cookie: this.adminCookie },
        }
      );
      await this.recordTest(
        "Add restricted word",
        addResponse.data.success,
        addResponse.data.message
      );

      // If word was added, test update and delete
      if (addResponse.data.success) {
        // Get the word we just added
        const [words] = await this.db.query(
          `SELECT wordID FROM RestrictedWords WHERE word = ?`,
          [testWord]
        );

        if (words.length > 0) {
          const wordID = words[0].wordID;

          // Test PUT /api/admin/restricted-words/:wordID
          this.log(`\nTest: PUT /restricted-words/${wordID}`, "header");
          const updateResponse = await axios.put(
            `${this.baseURL}/admin/restricted-words/${wordID}`,
            {
              severity: "high",
            },
            {
              headers: { Cookie: this.adminCookie },
            }
          );
          await this.recordTest(
            "Update restricted word",
            updateResponse.data.success,
            updateResponse.data.message
          );

          // Test DELETE /api/admin/restricted-words/:wordID
          this.log(`\nTest: DELETE /restricted-words/${wordID}`, "header");
          const deleteResponse = await axios.delete(
            `${this.baseURL}/admin/restricted-words/${wordID}`,
            {
              headers: { Cookie: this.adminCookie },
            }
          );
          await this.recordTest(
            "Delete restricted word",
            deleteResponse.data.success,
            deleteResponse.data.message
          );
        }
      }
    } catch (error) {
      await this.recordTest(
        "Restricted words routes",
        false,
        error.response?.data?.message || error.message
      );
    }
  }

  // ==================== MAIN TEST RUNNER ====================

  async runAllTests() {
    console.log(
      `\n${"=".repeat(70)}\n` +
        `║${" ".repeat(68)}║\n` +
        `║     ${this.colors.bold}ADMIN API ROUTES - PHASE 2 TESTING SUITE${this.colors.reset}               ║\n` +
        `║     Testing all admin endpoints                                  ║\n` +
        `║${" ".repeat(68)}║\n` +
        `${"=".repeat(70)}\n`
    );

    // Connect to database
    try {
      this.db = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: process.env.DB_PASSWORD || "8956",
        database: "3movieCollectors",
      });
      this.log("Connected to database", "success");
    } catch (error) {
      this.log(`Failed to connect to database: ${error.message}`, "error");
      return;
    }

    // Check if server is running
    try {
      await axios.get(`${this.baseURL}/auth/check`);
      this.log("Server is running", "success");
    } catch (error) {
      this.log(
        "Server is not running! Please start the server first.",
        "error"
      );
      await this.db.end();
      return;
    }

    // Login as admin
    const loginSuccess = await this.loginAsAdmin();
    if (!loginSuccess) {
      this.log("Cannot proceed without admin authentication", "error");
      await this.db.end();
      return;
    }

    // Run all test suites
    await this.testModerationRoutes();
    await this.testUserManagementRoutes();
    await this.testMovieManagementRoutes();
    await this.testDashboardRoutes();
    await this.testRestrictedWordsRoutes();

    // Print summary
    await this.printSummary();

    // Close database connection
    await this.db.end();
  }

  async printSummary() {
    const passed = this.testResults.filter((t) => t.passed).length;
    const failed = this.testResults.filter((t) => !t.passed).length;
    const total = this.testResults.length;
    const passRate = ((passed / total) * 100).toFixed(2);

    console.log(`\n${"=".repeat(70)}`);
    console.log("  TEST SUMMARY REPORT");
    console.log("=".repeat(70));
    console.log(`\nTotal Tests: ${total}`);
    console.log(`${this.colors.green}Passed: ${passed}${this.colors.reset}`);
    console.log(`${this.colors.red}Failed: ${failed}${this.colors.reset}`);
    console.log(`Pass Rate: ${passRate}%\n`);

    if (failed > 0) {
      console.log("Failed Tests:");
      this.testResults
        .filter((t) => !t.passed)
        .forEach((t) => {
          console.log(
            `  ${this.colors.red}✗${this.colors.reset} ${t.name}: ${t.details}`
          );
        });
    }

    if (failed === 0) {
      console.log(
        `${this.colors.green}✓ ALL TESTS PASSED!${this.colors.reset}`
      );
      console.log("Phase 2 admin API routes are ready for production.\n");
    } else {
      console.log(
        `\n${this.colors.red}✗ SOME TESTS FAILED${this.colors.reset}`
      );
      console.log("Please review the failed tests and fix issues.\n");
    }

    console.log(
      `${this.colors.cyan}Testing completed at ${new Date().toLocaleString()}${
        this.colors.reset
      }\n`
    );
  }
}

// Run tests
const tester = new AdminAPITester();
tester.runAllTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
