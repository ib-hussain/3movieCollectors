// Script to create an admin user for testing
// Run: node database/create-admin-user.js

const bcrypt = require("bcrypt");
const db = require("../server/db");

async function createAdminUser() {
  try {
    console.log("🔍 Checking for existing admin user...");

    // Check if admin user already exists
    const existingAdmin = await db.query(
      "SELECT userID, username, email, role FROM User WHERE email = ? OR username = ?",
      ["admin@3moviecollectors.com", "admin"]
    );

    if (existingAdmin.length > 0) {
      console.log("✅ Admin user already exists:");
      console.log(JSON.stringify(existingAdmin[0], null, 2));
      console.log("\nYou can use these credentials:");
      console.log("  Email: admin@3moviecollectors.com");
      console.log("  Password: admin123");
      process.exit(0);
    }

    console.log("📝 Creating admin user...");

    // Hash password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Insert admin user
    const result = await db.query(
      `INSERT INTO User (username, name, email, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [
        "admin",
        "Administrator",
        "admin@3moviecollectors.com",
        hashedPassword,
        "admin",
      ]
    );

    console.log("✅ Admin user created successfully!");
    console.log("\nCredentials:");
    console.log("  Email: admin@3moviecollectors.com");
    console.log("  Password: admin123");
    console.log("  User ID:", result.insertId);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    process.exit(1);
  }
}

createAdminUser();
