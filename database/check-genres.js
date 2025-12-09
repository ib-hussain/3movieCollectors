// Check if Genre table exists and has data
const db = require("../server/db");

async function checkGenres() {
  try {
    console.log("Checking Genre table...\n");

    // Check if table exists
    const tables = await db.query(`
      SHOW TABLES LIKE 'Genre'
    `);
    console.log("Genre table exists:", tables.length > 0);

    if (tables.length > 0) {
      // Get genre count
      const count = await db.query(`SELECT COUNT(*) as count FROM Genre`);
      console.log("Total genres:", count[0].count);

      // Get all genres
      const genres = await db.query(`
        SELECT genreID, genreName 
        FROM Genre 
        ORDER BY genreName ASC
      `);
      console.log("\nGenres:");
      genres.forEach((g) => console.log(`  ${g.genreID}: ${g.genreName}`));
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

checkGenres();
