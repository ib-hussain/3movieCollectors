const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "8956",
  database: "3movieCollectors",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

async function deleteDuplicates() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to database\n");

    // Delete specific duplicate movie IDs (keeping the lower ID)
    console.log("Deleting duplicate movies...\n");

    // Delete movie ID 59 (duplicate of 58)
    await connection.execute(`DELETE FROM movie WHERE movieID = 59`);
    console.log("✓ Deleted movie ID 59 (duplicate 'test movie by admin')");

    // Delete movie ID 47 (duplicate of 46)
    await connection.execute(`DELETE FROM movie WHERE movieID = 47`);
    console.log("✓ Deleted movie ID 47 (duplicate 'Test Movie for Audit')");

    console.log("\n✓ Duplicates removed successfully");

    // Show remaining test movies
    const [remaining] = await connection.execute(`
      SELECT movieID, title, director, releaseYear
      FROM movie
      WHERE title LIKE '%test%'
      ORDER BY movieID DESC
    `);

    console.log("\nRemaining test movies:");
    remaining.forEach((movie) => {
      console.log(
        `  ID: ${movie.movieID} - "${movie.title}" (${movie.releaseYear})`
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\nDatabase connection closed");
    }
  }
}

deleteDuplicates();
