const db = require("../server/db");
const fs = require("fs");

async function createStoredProcedure() {
  try {
    // Drop existing procedure
    await db.query("DROP PROCEDURE IF EXISTS sp_get_most_active_users");
    console.log("Dropped existing procedure");

    // Read SQL file
    const sql = fs.readFileSync("./database/fix-sp-active-users.sql", "utf8");

    // Extract the CREATE PROCEDURE statement
    const createSP = sql
      .split("DELIMITER $$")[1]
      .split("DELIMITER ;")[0]
      .replace(/\$\$/g, "");

    // Create procedure
    await db.query(createSP);
    console.log("✓ Stored procedure created successfully");

    // Test it
    const result = await db.query("CALL sp_get_most_active_users(5, 30)");
    console.log(`✓ Test successful. Found ${result[0].length} active users`);

    if (result[0].length > 0) {
      console.log("\nSample user:");
      const u = result[0][0];
      console.log(`  Username: ${u.username}`);
      console.log(`  Posts: ${u.postCount}`);
      console.log(`  Reviews: ${u.reviewCount}`);
      console.log(`  Comments: ${u.commentCount}`);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error(err);
    process.exit(1);
  }
}

createStoredProcedure();
