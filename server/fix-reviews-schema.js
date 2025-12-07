const db = require("./db");

async function fixReviewsSchema() {
  try {
    console.log("Fixing ReviewRatings table schema...");

    // Change rating column to support 10.0
    await db.query(`
            ALTER TABLE ReviewRatings 
            MODIFY COLUMN rating DECIMAL(4,1) NOT NULL DEFAULT 0.0
        `);

    console.log("✓ Rating column updated to DECIMAL(4,1)");

    // Verify the change
    const result = await db.query("SHOW CREATE TABLE ReviewRatings");
    console.log("\nUpdated table schema:");
    console.log(result[0]["Create Table"]);

    console.log("\n✓ Schema fix completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing schema:", error);
    process.exit(1);
  }
}

fixReviewsSchema();
