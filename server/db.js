const mysql = require("mysql2/promise");
require("dotenv").config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "3movieCollectors",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✓ Database connected successfully");
    connection.release();
    return true;
  } catch (error) {
    console.error("✗ Database connection failed:", error.message);
    return false;
  }
}

// Helper function to execute queries
async function query(sql, params = []) {
  try {
    // Use pool.query() instead of pool.execute() for better compatibility
    // with dynamic SQL (especially for IN clauses with variable parameters)
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Helper function for transactions
async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const result = await callback(connection);
    await connection.commit();
    connection.release();
    return result;
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
};
