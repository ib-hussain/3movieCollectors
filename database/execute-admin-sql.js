/**
 * ADMIN FEATURE - PHASE 1 SQL EXECUTOR
 * =====================================
 * Purpose: Execute all Phase 1 SQL files in correct order
 * Usage: node database/execute-admin-sql.js
 */

const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

class SQLExecutor {
  constructor() {
    this.connection = null;
  }

  log(message, type = "info") {
    const prefix =
      {
        success: `${colors.green}✓${colors.reset}`,
        error: `${colors.red}✗${colors.reset}`,
        warning: `${colors.yellow}⚠${colors.reset}`,
        info: `${colors.cyan}ℹ${colors.reset}`,
      }[type] || "";
    console.log(`${prefix} ${message}`);
  }

  logSection(title) {
    console.log(`\n${colors.bright}${colors.cyan}${"=".repeat(70)}`);
    console.log(`  ${title}`);
    console.log(`${"=".repeat(70)}${colors.reset}\n`);
  }

  async promptPassword(prompt) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  async connect(password) {
    try {
      this.connection = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: password,
        database: "3movieCollectors",
        multipleStatements: true,
      });
      this.log("Connected to MySQL as root", "success");
      return true;
    } catch (error) {
      this.log(`Connection failed: ${error.message}`, "error");
      return false;
    }
  }

  async executeFile(filename) {
    const filePath = path.join(__dirname, filename);

    try {
      this.log(`Reading ${filename}...`, "info");
      let sql = await fs.readFile(filePath, "utf8");

      // Remove DELIMITER statements and $$ delimiters for mysql2 compatibility
      sql = sql.replace(/DELIMITER\s+\$\$/gi, "");
      sql = sql.replace(/\$\$/g, ";");
      sql = sql.replace(/DELIMITER\s+;/gi, "");

      this.log(`Executing ${filename}...`, "info");
      await this.connection.query(sql);

      this.log(`${filename} executed successfully!`, "success");
      return true;
    } catch (error) {
      this.log(`Failed to execute ${filename}: ${error.message}`, "error");
      if (error.sql) {
        console.log(`\n${colors.red}SQL Error near:${colors.reset}`);
        const lines = error.sql.split("\n");
        const errorLine = error.sqlMessage?.match(/line (\d+)/)?.[1];
        if (errorLine) {
          const lineNum = parseInt(errorLine);
          console.log(
            lines.slice(Math.max(0, lineNum - 3), lineNum + 2).join("\n")
          );
        }
      }
      return false;
    }
  }

  async executAllFiles() {
    const files = [
      "admin_schema.sql",
      "admin_triggers.sql",
      "admin_procedures.sql",
      "admin_functions.sql",
      "admin_privileges.sql",
      "admin_events.sql",
    ];

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      this.logSection(`[${i + 1}/${files.length}] ${files[i]}`);

      const success = await this.executeFile(files[i]);
      if (success) {
        successCount++;
      } else {
        failCount++;
        this.log(`\nStopping execution due to error in ${files[i]}`, "error");
        break;
      }
    }

    return { successCount, failCount };
  }

  async verify() {
    this.logSection("VERIFICATION");

    try {
      // Check tables
      const [tables] = await this.connection.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = '3movieCollectors' 
                AND TABLE_NAME IN ('FlaggedContent', 'AdminReports', 'UserViolations', 'AdminNotifications', 'SecurityEvents')
            `);
      this.log(
        `New tables created: ${tables[0].count}/5`,
        tables[0].count === 5 ? "success" : "warning"
      );

      // Check triggers
      const [triggers] = await this.connection.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.TRIGGERS 
                WHERE TRIGGER_SCHEMA = '3movieCollectors'
            `);
      this.log(
        `Triggers created: ${triggers[0].count}`,
        triggers[0].count >= 16 ? "success" : "warning"
      );

      // Check procedures
      const [procedures] = await this.connection.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.ROUTINES 
                WHERE ROUTINE_SCHEMA = '3movieCollectors' 
                AND ROUTINE_TYPE = 'PROCEDURE'
            `);
      this.log(
        `Procedures created: ${procedures[0].count}`,
        procedures[0].count >= 10 ? "success" : "warning"
      );

      // Check functions
      const [functions] = await this.connection.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.ROUTINES 
                WHERE ROUTINE_SCHEMA = '3movieCollectors' 
                AND ROUTINE_TYPE = 'FUNCTION'
            `);
      this.log(
        `Functions created: ${functions[0].count}`,
        functions[0].count >= 5 ? "success" : "warning"
      );

      // Check users
      const [users] = await this.connection.query(`
                SELECT COUNT(*) as count 
                FROM mysql.user 
                WHERE User IN ('admin_user', 'app_user')
            `);
      this.log(
        `MySQL users created: ${users[0].count}/2`,
        users[0].count === 2 ? "success" : "warning"
      );

      // Check events
      const [events] = await this.connection.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.EVENTS 
                WHERE EVENT_SCHEMA = '3movieCollectors'
            `);
      this.log(
        `Scheduled events created: ${events[0].count}`,
        events[0].count >= 3 ? "success" : "warning"
      );
    } catch (error) {
      this.log(`Verification failed: ${error.message}`, "error");
    }
  }

  async cleanup() {
    if (this.connection) {
      await this.connection.end();
    }
  }
}

// Main execution
(async () => {
  console.log(`${colors.cyan}${colors.bright}
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║     ADMIN FEATURE - PHASE 1 SQL FILE EXECUTOR                     ║
║     Execute all database setup files in correct order            ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
${colors.reset}`);

  const executor = new SQLExecutor();

  try {
    // Prompt for MySQL root password
    const password = await executor.promptPassword(
      "\nEnter MySQL root password: "
    );

    // Connect to database
    executor.logSection("CONNECTING TO DATABASE");
    const connected = await executor.connect(password);

    if (!connected) {
      console.log(
        `\n${colors.red}Cannot proceed without database connection.${colors.reset}`
      );
      process.exit(1);
    }

    // Execute all files
    executor.logSection("EXECUTING SQL FILES");
    const { successCount, failCount } = await executor.executAllFiles();

    // Verify setup
    await executor.verify();

    // Summary
    console.log(`\n${colors.bright}${"=".repeat(70)}`);
    console.log(`  EXECUTION SUMMARY`);
    console.log(`${"=".repeat(70)}${colors.reset}`);
    console.log(
      `Files executed successfully: ${colors.green}${successCount}${colors.reset}`
    );
    console.log(
      `Files failed: ${failCount > 0 ? colors.red : colors.green}${failCount}${
        colors.reset
      }`
    );

    if (failCount === 0) {
      console.log(
        `\n${colors.green}${colors.bright}✓ ALL SQL FILES EXECUTED SUCCESSFULLY!${colors.reset}`
      );
      console.log(
        `${colors.cyan}Next step: Run tests with: node database/test-admin-db.js${colors.reset}\n`
      );
    } else {
      console.log(
        `\n${colors.red}${colors.bright}✗ SOME FILES FAILED${colors.reset}`
      );
      console.log(
        `${colors.yellow}Please fix errors and try again.${colors.reset}\n`
      );
    }
  } catch (error) {
    console.error(`\n${colors.red}Fatal error:${colors.reset}`, error.message);
    process.exit(1);
  } finally {
    await executor.cleanup();
  }
})();
