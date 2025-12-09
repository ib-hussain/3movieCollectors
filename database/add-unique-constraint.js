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

async function addUniqueConstraint() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to database\n");

    // Check if unique constraint already exists
    const [indexes] = await connection.execute(`
      SHOW INDEXES FROM movie WHERE Key_name = 'unique_movie'
    `);

    if (indexes.length > 0) {
      console.log("Unique constraint already exists on movie table");
      return;
    }

    // Add unique constraint on title + releaseYear combination
    console.log("Adding unique constraint to prevent duplicate movies...");
    await connection.execute(`
      ALTER TABLE movie 
      ADD CONSTRAINT unique_movie UNIQUE (title(255), releaseYear)
    `);

    console.log("✓ Unique constraint added successfully!");
    console.log(
      "  Movies with same title (first 255 chars) AND release year cannot be added twice."
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      console.error("\n❌ Error: Duplicate entries exist in the database.");
      console.error(
        "   Please remove duplicates first before adding constraint."
      );
      console.error("   Run: node database/delete-duplicates.js");
    } else {
      console.error("Error:", error.message);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log("\nDatabase connection closed");
    }
  }
}

addUniqueConstraint();
