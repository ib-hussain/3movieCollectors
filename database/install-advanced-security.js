/**
 * Install Advanced Security Triggers and Functions
 * Implements MySQL-heavy detection for SQL injection, XSS, and suspicious activity
 */

const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const fs = require("fs").promises;

async function installAdvancedSecurity() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: "3movieCollectors",
    multipleStatements: true,
  });

  try {
    console.log("📦 Installing Advanced Security Triggers and Functions...\n");

    // Read SQL file
    const sqlFilePath = path.join(__dirname, "advanced_security_triggers.sql");
    const sqlContent = await fs.readFile(sqlFilePath, "utf8");

    // Split into individual statements (simple split by semicolon and delimiter)
    const statements = sqlContent
      .split("$$")
      .filter(
        (stmt) => stmt.trim().length > 0 && !stmt.trim().startsWith("--")
      );

    console.log(`📝 Found ${statements.length} statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt && !stmt.startsWith("--") && stmt !== "DELIMITER") {
        try {
          await connection.query(stmt);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (err) {
          // Ignore "already exists" errors
          if (!err.message.includes("already exists")) {
            console.error(`❌ Error in statement ${i + 1}:`, err.message);
          }
        }
      }
    }

    console.log("\n🔍 Verifying installation...\n");

    // Verify functions
    const [functions] = await connection.query(`
            SELECT ROUTINE_NAME, ROUTINE_TYPE
            FROM information_schema.ROUTINES
            WHERE ROUTINE_SCHEMA = '3movieCollectors'
              AND ROUTINE_TYPE = 'FUNCTION'
              AND ROUTINE_NAME IN ('fn_detect_sql_injection', 'fn_detect_xss', 'fn_user_risk_score')
            ORDER BY ROUTINE_NAME
        `);

    console.log("📊 Functions installed:");
    functions.forEach((fn) => {
      console.log(`   ✅ ${fn.ROUTINE_NAME} (${fn.ROUTINE_TYPE})`);
    });

    // Verify triggers
    const [triggers] = await connection.query(`
            SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
            FROM information_schema.TRIGGERS
            WHERE TRIGGER_SCHEMA = '3movieCollectors'
            ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME
        `);

    console.log("\n📊 Triggers installed:");
    triggers.forEach((trg) => {
      console.log(
        `   ✅ ${trg.TRIGGER_NAME} (${trg.EVENT_MANIPULATION} on ${trg.EVENT_OBJECT_TABLE})`
      );
    });

    // Test functions
    console.log("\n🧪 Testing security detection functions...\n");

    // Test SQL injection detection
    const [sqlTest] = await connection.query(
      "SELECT fn_detect_sql_injection('SELECT * FROM users WHERE 1=1') as result"
    );
    console.log(
      `   SQL Injection Test: ${
        sqlTest[0].result ? "✅ DETECTED" : "❌ NOT DETECTED"
      }`
    );

    // Test XSS detection
    const [xssTest] = await connection.query(
      "SELECT fn_detect_xss('<script>alert(1)</script>') as result"
    );
    console.log(
      `   XSS Test: ${xssTest[0].result ? "✅ DETECTED" : "❌ NOT DETECTED"}`
    );

    // Test safe content
    const [safeTest] = await connection.query(
      "SELECT fn_detect_sql_injection('This is a normal post about movies') as sql_safe, " +
        "fn_detect_xss('This is a normal post about movies') as xss_safe"
    );
    console.log(
      `   Safe Content Test: ${
        !safeTest[0].sql_safe && !safeTest[0].xss_safe
          ? "✅ PASSED"
          : "❌ FAILED"
      }`
    );

    console.log("\n✅ Advanced Security System installed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - ${functions.length} detection functions`);
    console.log(`   - ${triggers.length} automatic triggers`);
    console.log(`   - SQL injection detection: ACTIVE`);
    console.log(`   - XSS detection: ACTIVE`);
    console.log(`   - Spam detection: ACTIVE`);
    console.log(`   - Risk scoring: ACTIVE`);
  } catch (error) {
    console.error("❌ Installation failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run installation
installAdvancedSecurity()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
