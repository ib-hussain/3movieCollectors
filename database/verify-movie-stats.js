const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "8956",
  database: "3movieCollectors",
};

async function verifyStats() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to database\n");

    // Check movies with ratings
    const [moviesWithRatings] = await connection.execute(`
      SELECT 
        m.movieID,
        m.title,
        m.avgRating,
        m.viewCount,
        COUNT(r.movieID) as reviewCount
      FROM movie m
      LEFT JOIN reviewratings r ON m.movieID = r.movieID
      GROUP BY m.movieID, m.title, m.avgRating, m.viewCount
      HAVING reviewCount > 0
      ORDER BY m.avgRating DESC
      LIMIT 10
    `);

    console.log(
      "=== Top 10 Rated Movies (Calculated from reviewratings) ===\n"
    );
    moviesWithRatings.forEach((movie) => {
      console.log(
        `${movie.title.padEnd(40)} | Rating: ${movie.avgRating} (${
          movie.reviewCount
        } reviews) | Views: ${movie.viewCount}`
      );
    });

    // Check total stats
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as totalMovies,
        SUM(viewCount) as totalViews,
        AVG(avgRating) as overallAvgRating,
        (SELECT COUNT(*) FROM reviewratings) as totalReviews
      FROM movie
    `);

    console.log("\n=== Overall Statistics ===\n");
    console.log(`Total Movies: ${stats[0].totalMovies}`);
    console.log(`Total Views: ${stats[0].totalViews}`);
    console.log(`Total Reviews: ${stats[0].totalReviews}`);
    console.log(
      `Overall Avg Rating: ${
        stats[0].overallAvgRating ? stats[0].overallAvgRating.toFixed(2) : "N/A"
      }`
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\nDatabase connection closed");
    }
  }
}

verifyStats();
