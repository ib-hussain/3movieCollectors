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

async function fixTestMoviePoster() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to database");

    // Update test movie to remove poster or set to null
    const [result] = await connection.execute(
      `UPDATE movie SET posterImg = NULL WHERE posterImg = 'test.jpg'`
    );

    console.log(
      `✓ Updated ${result.affectedRows} movie(s) - removed test.jpg poster`
    );

    // Verify the change
    const [movies] = await connection.execute(
      `SELECT movieID, title, posterImg FROM movie WHERE title LIKE '%Test%'`
    );

    console.log("\nTest movies in database:");
    movies.forEach((movie) => {
      console.log(
        `  - ${movie.title} (ID: ${movie.movieID}): ${
          movie.posterImg || "NULL"
        }`
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

fixTestMoviePoster();
