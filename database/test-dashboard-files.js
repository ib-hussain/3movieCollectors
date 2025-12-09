/**
 * ADMIN FRONTEND - PHASE 5 TESTING SUITE
 * Tests dashboard file structure and basic validation
 */

const fs = require("fs");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function log(type, message) {
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    info: `${colors.cyan}ℹ${colors.reset}`,
    test: `${colors.blue}►${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
  };
  console.log(`[${timestamp}] ${prefix[type]} ${message}`);
}

function test(name, fn) {
  totalTests++;
  log("test", `Test: ${name}`);
  try {
    fn();
    passedTests++;
    log("success", `${name}: Passed`);
  } catch (error) {
    failedTests++;
    log("error", `${name}: ${error.message}`);
  }
}

function fileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return true;
}

function fileContains(filePath, searchString) {
  const content = fs.readFileSync(filePath, "utf-8");
  if (!content.includes(searchString)) {
    throw new Error(`File does not contain: "${searchString}"`);
  }
  return true;
}

function fileSize(filePath, minSize) {
  const stats = fs.statSync(filePath);
  if (stats.size < minSize) {
    throw new Error(
      `File too small: ${stats.size} bytes (expected at least ${minSize})`
    );
  }
  return stats.size;
}

console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║     ADMIN FRONTEND - PHASE 5 TESTING SUITE                         ║
║     Testing dashboard files and structure                          ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
`);

console.log(
  "======================================================================\n" +
    colors.cyan +
    "  FILE EXISTENCE TESTS\n" +
    colors.reset +
    "======================================================================"
);

// Test HTML file
test("Admin Dashboard HTML exists", () => {
  fileExists("html/admin/admin-dashboard.html");
});

test("Admin Dashboard HTML has content", () => {
  const size = fileSize("html/admin/admin-dashboard.html", 5000);
  log("info", `  File size: ${size} bytes`);
});

// Test JavaScript file
test("Admin Dashboard JS exists", () => {
  fileExists("js/admin/admin-dashboard.js");
});

test("Admin Dashboard JS has content", () => {
  const size = fileSize("js/admin/admin-dashboard.js", 10000);
  log("info", `  File size: ${size} bytes`);
});

// Test CSS file
test("Admin Dashboard CSS exists", () => {
  fileExists("css/admin/admin-dashboard.css");
});

test("Admin Dashboard CSS has content", () => {
  const size = fileSize("css/admin/admin-dashboard.css", 10000);
  log("info", `  File size: ${size} bytes`);
});

// Test dashboard test file
test("Dashboard test file exists", () => {
  fileExists("test-dashboard.html");
});

console.log(
  "\n======================================================================\n" +
    colors.cyan +
    "  HTML STRUCTURE TESTS\n" +
    colors.reset +
    "======================================================================"
);

test("HTML contains sidebar navigation", () => {
  fileContains("html/admin/admin-dashboard.html", "sidebar");
});

test("HTML contains Chart.js import", () => {
  fileContains(
    "html/admin/admin-dashboard.html",
    "cdn.jsdelivr.net/npm/chart.js"
  );
});

test("HTML contains Font Awesome", () => {
  fileContains("html/admin/admin-dashboard.html", "font-awesome");
});

test("HTML links to dashboard JS", () => {
  fileContains("html/admin/admin-dashboard.html", "admin-dashboard.js");
});

test("HTML links to dashboard CSS", () => {
  fileContains("html/admin/admin-dashboard.html", "admin-dashboard.css");
});

test("HTML has stats cards", () => {
  fileContains("html/admin/admin-dashboard.html", "stat-card");
});

test("HTML has charts section", () => {
  fileContains("html/admin/admin-dashboard.html", "canvas");
});

test("HTML has data tables", () => {
  fileContains("html/admin/admin-dashboard.html", "data-table");
});

test("HTML has notifications section", () => {
  fileContains("html/admin/admin-dashboard.html", "notifications");
});

console.log(
  "\n======================================================================\n" +
    colors.cyan +
    "  JAVASCRIPT FUNCTIONALITY TESTS\n" +
    colors.reset +
    "======================================================================"
);

test("JS contains checkAuth function", () => {
  fileContains("js/admin/admin-dashboard.js", "checkAuth");
});

test("JS contains initializeDashboard function", () => {
  fileContains("js/admin/admin-dashboard.js", "initializeDashboard");
});

test("JS contains loadDashboardStats function", () => {
  fileContains("js/admin/admin-dashboard.js", "loadDashboardStats");
});

test("JS contains polling mechanism", () => {
  fileContains("js/admin/admin-dashboard.js", "startPolling");
});

test("JS contains Chart.js initialization", () => {
  fileContains("js/admin/admin-dashboard.js", "new Chart");
});

test("JS contains API endpoint calls", () => {
  fileContains("js/admin/admin-dashboard.js", "/api/admin");
});

test("JS contains error handling", () => {
  fileContains("js/admin/admin-dashboard.js", "catch");
});

test("JS contains notification functions", () => {
  fileContains("js/admin/admin-dashboard.js", "markNotificationRead");
});

console.log(
  "\n======================================================================\n" +
    colors.cyan +
    "  CSS STYLING TESTS\n" +
    colors.reset +
    "======================================================================"
);

test("CSS contains root variables", () => {
  fileContains("css/admin/admin-dashboard.css", ":root");
});

test("CSS contains sidebar styles", () => {
  fileContains("css/admin/admin-dashboard.css", ".sidebar");
});

test("CSS contains stat card styles", () => {
  fileContains("css/admin/admin-dashboard.css", ".stat-card");
});

test("CSS contains chart styles", () => {
  fileContains("css/admin/admin-dashboard.css", ".chart-card");
});

test("CSS contains responsive design", () => {
  fileContains("css/admin/admin-dashboard.css", "@media");
});

test("CSS contains dark theme colors", () => {
  fileContains("css/admin/admin-dashboard.css", "#0f172a");
});

console.log(
  "\n======================================================================\n" +
    colors.cyan +
    "  DOCUMENTATION TESTS\n" +
    colors.reset +
    "======================================================================"
);

test("Progress Summary exists", () => {
  fileExists("PROGRESS_SUMMARY.md");
});

test("Quick Reference exists", () => {
  fileExists("ADMIN_QUICK_REFERENCE.md");
});

test("Implementation Roadmap exists", () => {
  fileExists("ADMIN_IMPLEMENTATION_ROADMAP.md");
});

test("Schema Reference exists", () => {
  fileExists("database/SCHEMA_REFERENCE.md");
});

console.log(
  "\n======================================================================\n" +
    colors.bright +
    "  TEST SUMMARY REPORT\n" +
    colors.reset +
    "======================================================================"
);

console.log(`
Total Tests: ${totalTests}
Passed: ${colors.green}${passedTests}${colors.reset}
Failed: ${colors.red}${failedTests}${colors.reset}
Pass Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%
`);

if (failedTests === 0) {
  console.log(
    `${colors.green}✓ ALL TESTS PASSED!${colors.reset}\nPhase 5 admin dashboard files are complete and properly structured.\n`
  );
} else {
  console.log(
    `${colors.red}✗ SOME TESTS FAILED${colors.reset}\nPlease review the errors above.\n`
  );
  process.exit(1);
}

console.log(
  `${colors.cyan}ℹ${colors.reset} Next step: Test dashboard in browser using test-dashboard.html`
);
console.log(`Testing completed at ${new Date().toLocaleString()}\n`);
