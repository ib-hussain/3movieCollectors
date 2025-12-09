// Check database tables
const db = require("../server/db");

async function checkTables() {
  try {
    console.log("Checking database tables...\n");

    const tables = await db.query(`SHOW TABLES`);
    console.log(`Found ${tables.length} tables:\n`);
    tables.forEach((table) => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

checkTables();
