const db = require("../server/db");
const fs = require("fs");
const path = require("path");

async function installSecurityProcedures() {
  try {
    console.log("\n=== Installing Security Event Logging Procedures ===\n");

    // Read the SQL file
    const sqlFile = path.join(__dirname, "security_procedures.sql");
    const sql = fs.readFileSync(sqlFile, "utf8");

    // Split by delimiter changes and statements
    const statements = sql
      .split(/DELIMITER \$\$|DELIMITER ;/)
      .filter(
        (stmt) =>
          stmt.trim() &&
          !stmt.trim().startsWith("--") &&
          !stmt.trim().startsWith("USE")
      );

    console.log(`Found ${statements.length} SQL blocks to execute\n`);

    // First, drop all existing procedures
    console.log("=== Dropping Existing Procedures ===\n");
    const proceduresToDrop = [
      "sp_log_failed_login",
      "sp_check_brute_force",
      "sp_log_unauthorized_access",
      "sp_log_suspicious_activity",
      "sp_log_sql_injection",
      "sp_log_xss_attempt",
    ];

    for (const procName of proceduresToDrop) {
      console.log(`  Dropping: ${procName}`);
      try {
        await db.query(`DROP PROCEDURE IF EXISTS ${procName}`);
      } catch (err) {
        // Ignore errors
      }
    }

    console.log("\n=== Creating New Procedures ===\n");

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;

      // Clean up the statement
      const cleanStmt = stmt.replace(/\$\$/g, "");

      if (cleanStmt.includes("DROP PROCEDURE")) {
        const procName = cleanStmt.match(/DROP PROCEDURE IF EXISTS (\w+)/)?.[1];
        if (procName) {
          console.log(`${i + 1}. Dropping existing procedure: ${procName}`);
          try {
            await db.query(`DROP PROCEDURE IF EXISTS ${procName}`);
          } catch (err) {
            // Ignore if doesn't exist
          }
        }
      } else if (cleanStmt.includes("CREATE PROCEDURE")) {
        const procName = cleanStmt.match(/CREATE PROCEDURE (\w+)/)?.[1];
        if (procName) {
          console.log(`${i + 1}. Creating procedure: ${procName}`);
          await db.query(cleanStmt);
        }
      } else if (cleanStmt.includes("GRANT EXECUTE")) {
        const procName = cleanStmt.match(/PROCEDURE \w+\.(\w+)/)?.[1];
        if (procName) {
          console.log(`${i + 1}. Granting permissions for: ${procName}`);
          try {
            await db.query(cleanStmt);
          } catch (err) {
            console.log(`   ⚠ Warning: ${err.message} (continuing...)`);
          }
        }
      }
    }

    // Verify procedures were created
    console.log("\n=== Verifying Installed Procedures ===\n");
    const procedures = await db.query(`
      SELECT ROUTINE_NAME 
      FROM information_schema.ROUTINES 
      WHERE ROUTINE_SCHEMA = '3movieCollectors' 
        AND ROUTINE_TYPE = 'PROCEDURE'
        AND ROUTINE_NAME LIKE 'sp_log%'
      ORDER BY ROUTINE_NAME
    `);

    console.log(`✓ Found ${procedures.length} security procedures:\n`);
    procedures.forEach((proc, i) => {
      console.log(`   ${i + 1}. ${proc.ROUTINE_NAME}`);
    });

    console.log("\n=== Installation Complete! ===\n");
    console.log("Available procedures:");
    console.log("  - sp_log_failed_login(username, ip, userAgent, reason)");
    console.log(
      "  - sp_log_unauthorized_access(userID, username, ip, userAgent, path, method, action)"
    );
    console.log(
      "  - sp_log_suspicious_activity(userID, username, ip, userAgent, path, method, desc, severity)"
    );
    console.log(
      "  - sp_log_sql_injection(userID, username, ip, userAgent, path, method, input)"
    );
    console.log(
      "  - sp_log_xss_attempt(userID, username, ip, userAgent, path, method, input)"
    );
    console.log("  - sp_check_brute_force(ip, userAgent)");
    console.log("\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Installation failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

installSecurityProcedures();
