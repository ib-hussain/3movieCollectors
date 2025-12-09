// Add dummy view counts to movies for testing
const db = require("../server/db");

async function addViewCounts() {
  try {
    console.log("Adding view counts to movies...\n");

    // Update movies with random view counts
    await db.query(`
      UPDATE movie
      SET viewCount = FLOOR(100 + RAND() * 9900)
      WHERE viewCount = 0 OR viewCount IS NULL
    `);

    // Verify
    const result = await db.query(`
      SELECT 
        COUNT(*) as total,
        MIN(viewCount) as minViews,
        MAX(viewCount) as maxViews,
        AVG(viewCount) as avgViews
      FROM movie
    `);

    console.log("View counts updated:");
    console.log(`  Total movies: ${result[0].total}`);
    console.log(`  Min views: ${result[0].minViews}`);
    console.log(`  Max views: ${result[0].maxViews}`);
    console.log(`  Avg views: ${Math.round(result[0].avgViews)}`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

addViewCounts();
