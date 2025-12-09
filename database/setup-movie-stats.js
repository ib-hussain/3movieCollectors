const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const path = require("path");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "8956",
  database: "3movieCollectors",
  multipleStatements: true,
};

async function setupMovieStatsTriggers() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("✓ Connected to database\n");

    // Read the SQL file
    const sqlFile = path.join(__dirname, "movie-stats-triggers.sql");
    const sql = await fs.readFile(sqlFile, "utf8");

    console.log("Creating triggers for automatic rating calculation...\n");

    // Execute the SQL
    await connection.query(sql);

    console.log("\n✓ All triggers created successfully!");
    console.log("\nWhat was set up:");
    console.log("  1. Trigger: Auto-calculate avgRating on INSERT rating");
    console.log("  2. Trigger: Auto-calculate avgRating on UPDATE rating");
    console.log("  3. Trigger: Auto-calculate avgRating on DELETE rating");
    console.log("  4. Calculated avgRating for all existing movies");
    console.log(
      "\n✓ Movie ratings will now be automatically calculated from reviewratings table!"
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.sql) {
      console.error("\nFailed SQL:", error.sql.substring(0, 200));
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log("\nDatabase connection closed");
    }
  }
}

setupMovieStatsTriggers();
