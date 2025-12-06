const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

/**
 * Database Setup Script
 * Run this to create the database schema
 */

async function setupDatabase() {
  console.log("Starting database setup...\n");

  // Create connection WITHOUT database specified (so we can create it)
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    port: process.env.DB_PORT || 3306,
    multipleStatements: true,
  });

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Remove comments and split SQL statements
    const cleanedSchema = schema
      .split("\n")
      .filter((line) => !line.trim().startsWith("--") && line.trim().length > 0)
      .join("\n");

    const statements = cleanedSchema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip SELECT statements (they're just for display)
      if (statement.toUpperCase().startsWith("SELECT")) {
        continue;
      }

      try {
        // Use query() instead of execute() because USE, DROP DATABASE, CREATE DATABASE
        // don't support prepared statements
        await connection.query(statement);

        // Log progress for CREATE statements
        if (statement.toUpperCase().includes("DROP DATABASE")) {
          console.log("✓ Dropped existing database (if any)");
        } else if (statement.toUpperCase().includes("CREATE DATABASE")) {
          console.log("✓ Database created");
        } else if (statement.toUpperCase().includes("USE ")) {
          console.log("✓ Using database");
        } else if (statement.toUpperCase().includes("CREATE TABLE")) {
          const tableName = statement.match(/CREATE TABLE\s+(\w+)/i);
          if (tableName) {
            console.log(`✓ Created table: ${tableName[1]}`);
          }
        }
      } catch (err) {
        // Ignore specific errors that are OK
        if (
          err.code === "ER_DB_DROP_EXISTS" ||
          err.code === "ER_TABLE_EXISTS_ERROR" ||
          err.code === "ER_DB_CREATE_EXISTS"
        ) {
          continue;
        }
        console.error(
          `Error executing statement: ${statement.substring(0, 50)}...`
        );
        throw err;
      }
    }

    console.log("\n✓ Schema setup completed successfully!\n");

    // Now insert sample data
    console.log("Inserting sample data...\n");
    const sampleDataPath = path.join(__dirname, "sample-data.sql");
    const sampleData = fs.readFileSync(sampleDataPath, "utf8");

    const dataStatements = sampleData
      .split(";")
      .map((s) => s.trim())
      .filter(
        (s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("SELECT")
      );

    for (const statement of dataStatements) {
      if (statement && statement.toUpperCase().includes("INSERT")) {
        await connection.query(statement);
      } else if (statement && statement.toUpperCase().includes("USE")) {
        await connection.query(statement);
      }
    }

    console.log("✓ Sample data inserted successfully!\n");

    // Verify tables
    const [tables] = await connection.query("SHOW TABLES");
    console.log(`\n✓ Database ready with ${tables.length} tables:\n`);
    tables.forEach((table) => {
      console.log(`  - ${Object.values(table)[0]}`);
    });

    console.log("\n✓ Database setup complete!\n");

    // Close connection
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("\n✗ Database setup failed:", error.message);
    console.error("\nMake sure:");
    console.error("  1. MySQL server is running");
    console.error("  2. Credentials in .env file are correct");
    console.error("  3. MySQL user has permission to CREATE DATABASE\n");

    try {
      await connection.end();
    } catch (e) {
      // Ignore connection close errors
    }

    process.exit(1);
  }
}

// Run setup
setupDatabase();
