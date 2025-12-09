const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

async function setupAdminUser() {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "8956",
    database: "3movieCollectors",
  });

  // Check for existing admin users
  const [admins] = await conn.query(
    'SELECT userID, username, email, role FROM User WHERE role="admin"'
  );

  console.log("\nExisting admin users:");
  console.table(admins);

  if (admins.length === 0) {
    console.log("\nNo admin users found. Creating test admin user...");

    // Hash the password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Create admin user
    await conn.query(
      `INSERT INTO User (username, name, email, password, role) 
       VALUES ('admin', 'Admin User', 'admin@test.com', ?, 'admin')`,
      [hashedPassword]
    );

    console.log("✓ Admin user created successfully");
    console.log("  Email: admin@test.com");
    console.log("  Password: admin123");
  } else {
    console.log(`\n✓ Found ${admins.length} admin user(s)`);
  }

  await conn.end();
}

setupAdminUser().catch(console.error);
