// Migration script to update WatchList status ENUM
const db = require("./db");

async function updateWatchlistEnum() {
  try {
    console.log("Starting WatchList status ENUM update...");

    // Step 1: Update existing data to new statuses
    console.log("Step 1: Updating existing data...");

    // Map old statuses to new ones
    await db.query(
      "UPDATE WatchList SET status = 'added' WHERE status IN ('to-watch', 'watching', 'not seen')"
    );

    console.log("✓ Existing data updated");

    // Step 2: Alter the ENUM column
    console.log("Step 2: Altering ENUM column...");

    await db.query(
      "ALTER TABLE WatchList MODIFY COLUMN status ENUM('added', 'completed') DEFAULT 'added'"
    );

    console.log("✓ ENUM column updated");

    // Verify the changes
    const result = await db.query("SELECT COUNT(*) as count FROM WatchList");
    console.log(
      `✓ Migration complete! Total watchlist entries: ${result[0].count}`
    );

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

updateWatchlistEnum();
