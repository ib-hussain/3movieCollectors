const db = require("../server/db");

/**
 * Database Verification Script
 * Checks database connection and shows table info
 */

async function verifyDatabase() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("🔍  3movieCollectors Database Verification");
  console.log("═══════════════════════════════════════════════════════\n");

  try {
    // Test connection
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error("Database connection failed");
    }

    // Show current database
    const [dbResult] = await db.pool.query("SELECT DATABASE() as db");
    console.log(`Current Database: ${dbResult[0].db}\n`);

    // Show all tables
    const [tables] = await db.pool.query("SHOW TABLES");
    console.log(`Total Tables: ${tables.length}\n`);

    // Show row counts for each table
    console.log("Table Statistics:");
    console.log("─────────────────────────────────────────────────────");

    for (const tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      const [countResult] = await db.pool.query(
        `SELECT COUNT(*) as count FROM ${tableName}`
      );
      const count = countResult[0].count;
      console.log(`  ${tableName.padEnd(25)} ${count} rows`);
    }

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✓ Database verification complete!");
    console.log("═══════════════════════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("\n✗ Verification failed:", error.message);
    console.error("\nPlease run: node database/setup.js\n");
    process.exit(1);
  }
}

verifyDatabase();
