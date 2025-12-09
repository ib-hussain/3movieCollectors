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

async function checkDuplicates() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to database\n");

    // Check for duplicate movies by title
    console.log("=== Checking for duplicate movie titles ===");
    const [duplicateTitles] = await connection.execute(`
      SELECT title, COUNT(*) as count, GROUP_CONCAT(movieID) as movieIDs
      FROM movie
      GROUP BY title
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);

    if (duplicateTitles.length > 0) {
      console.log(`Found ${duplicateTitles.length} duplicate titles:\n`);
      duplicateTitles.forEach((dup) => {
        console.log(
          `  "${dup.title}" - ${dup.count} copies (IDs: ${dup.movieIDs})`
        );
      });
    } else {
      console.log("No duplicate titles found.\n");
    }

    // Check recently added movies
    console.log("\n=== Recently Added Movies ===");
    const [recentMovies] = await connection.execute(`
      SELECT movieID, title, director, releaseYear, posterImg
      FROM movie
      ORDER BY movieID DESC
      LIMIT 10
    `);

    console.log("Last 10 movies added:");
    recentMovies.forEach((movie) => {
      console.log(
        `  ID: ${movie.movieID} - "${movie.title}" (${movie.releaseYear}) by ${movie.director}`
      );
    });

    // Check the specific movie that was searched
    console.log("\n=== Search for specific movie ===");
    const searchTerm = process.argv[2] || "test"; // Default to 'test' or use command line arg
    const [searchResults] = await connection.execute(
      `
      SELECT m.movieID, m.title, m.director, m.releaseYear, 
             GROUP_CONCAT(g.genreName) as genres
      FROM movie m
      LEFT JOIN moviegenres mg ON m.movieID = mg.movieID
      LEFT JOIN genres g ON mg.genreID = g.genreID
      WHERE m.title LIKE ? OR m.director LIKE ?
      GROUP BY m.movieID
      ORDER BY m.movieID DESC
    `,
      [`%${searchTerm}%`, `%${searchTerm}%`]
    );

    console.log(`\nMovies matching "${searchTerm}":`);
    if (searchResults.length === 0) {
      console.log("  No matches found.");
    } else {
      searchResults.forEach((movie) => {
        console.log(
          `  ID: ${movie.movieID} - "${movie.title}" (${movie.releaseYear}) by ${movie.director}`
        );
        console.log(`      Genres: ${movie.genres || "None"}`);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\nDatabase connection closed");
    }
  }
}

checkDuplicates();
