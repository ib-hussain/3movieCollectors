// Create Dummy Users for Testing
// This script creates sample users with various roles and statuses for testing the User Management page

const mysql = require("mysql2/promise");

async function createDummyUsers() {
  let connection;

  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "8956",
      database: "3movieCollectors",
    });

    console.log("✓ Connected to database");

    // Dummy users data
    const dummyUsers = [
      {
        username: "john_doe",
        name: "John Doe",
        email: "john.doe@example.com",
        password: "$2a$10$dummyhashpassword1234567890", // hashed password
        role: "user",
        isSuspended: 0,
      },
      {
        username: "jane_smith",
        name: "Jane Smith",
        email: "jane.smith@example.com",
        password: "$2a$10$dummyhashpassword1234567890",
        role: "user",
        isSuspended: 0,
      },
      {
        username: "bob_wilson",
        name: "Bob Wilson",
        email: "bob.wilson@example.com",
        password: "$2a$10$dummyhashpassword1234567890",
        role: "user",
        isSuspended: 1,
        suspensionReason: "Violated community guidelines",
        suspendedBy: 105, // Admin user ID
        suspendedDate: new Date(),
      },
      {
        username: "alice_johnson",
        name: "Alice Johnson",
        email: "alice.johnson@example.com",
        password: "$2a$10$dummyhashpassword1234567890",
        role: "user",
        isSuspended: 0,
      },
      {
        username: "charlie_brown",
        name: "Charlie Brown",
        email: "charlie.brown@example.com",
        password: "$2a$10$dummyhashpassword1234567890",
        role: "user",
        isSuspended: 0,
      },
      {
        username: "diana_prince",
        name: "Diana Prince",
        email: "diana.prince@example.com",
        password: "$2a$10$dummyhashpassword1234567890",
        role: "user",
        isSuspended: 0,
      },
      {
        username: "edward_stark",
        name: "Edward Stark",
        email: "edward.stark@example.com",
        password: "$2a$10$dummyhashpassword1234567890",
        role: "user",
        isSuspended: 1,
        suspensionReason: "Spam posting",
        suspendedBy: 105,
        suspendedDate: new Date(),
      },
      {
        username: "fiona_green",
        name: "Fiona Green",
        email: "fiona.green@example.com",
        password: "$2a$10$dummyhashpassword1234567890",
        role: "user",
        isSuspended: 0,
      },
      {
        username: "george_martin",
        name: "George Martin",
        email: "george.martin@example.com",
        password: "$2a$10$dummyhashpassword1234567890",
        role: "user",
        isSuspended: 0,
      },
      {
        username: "helen_parker",
        name: "Helen Parker",
        email: "helen.parker@example.com",
        password: "$2a$10$dummyhashpassword1234567890",
        role: "user",
        isSuspended: 0,
      },
      {
        username: "ian_drake",
        name: "Ian Drake",
        email: "ian.drake@example.com",
        password: "$2a$10$dummyhashpassword1234567890",
        role: "user",
        isSuspended: 0,
      },
      {
        username: "julia_roberts",
        name: "Julia Roberts",
        email: "julia.roberts@example.com",
        password: "$2a$10$dummyhashpassword1234567890",
        role: "user",
        isSuspended: 0,
      },
      {
        username: "kevin_hart",
        name: "Kevin Hart",
        email: "kevin.hart@example.com",
        password: "$2a$10$dummyhashpassword1234567890",
        role: "user",
        isSuspended: 0,
      },
      {
        username: "lisa_anderson",
        name: "Lisa Anderson",
        email: "lisa.anderson@example.com",
        password: "$2a$10$dummyhashpassword1234567890",
        role: "user",
        isSuspended: 0,
      },
      {
        username: "mike_tyson",
        name: "Mike Tyson",
        email: "mike.tyson@example.com",
        password: "$2a$10$dummyhashpassword1234567890",
        role: "user",
        isSuspended: 0,
      },
    ];

    console.log("\n📊 Creating dummy users...\n");

    let created = 0;
    let skipped = 0;

    for (const user of dummyUsers) {
      try {
        // Check if user already exists
        const [existing] = await connection.query(
          "SELECT userID FROM User WHERE email = ? OR username = ?",
          [user.email, user.username]
        );

        if (existing.length > 0) {
          console.log(`⊘ Skipped: ${user.username} (already exists)`);
          skipped++;
          continue;
        }

        // Insert user
        const [result] = await connection.query(
          `INSERT INTO User (
            username, name, email, password, role, 
            isSuspended, suspensionReason, suspendedBy, suspendedDate
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.username,
            user.name,
            user.email,
            user.password,
            user.role,
            user.isSuspended,
            user.suspensionReason || null,
            user.suspendedBy || null,
            user.suspendedDate || null,
          ]
        );

        console.log(
          `✓ Created: ${user.username} (${
            user.name
          }) - ${user.role.toUpperCase()}${
            user.isSuspended ? " [SUSPENDED]" : ""
          }`
        );
        created++;
      } catch (error) {
        console.error(`✗ Error creating ${user.username}:`, error.message);
      }
    }

    // Get current stats
    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as regularUsers,
        SUM(CASE WHEN isSuspended = 1 THEN 1 ELSE 0 END) as suspended,
        SUM(CASE WHEN isSuspended = 0 THEN 1 ELSE 0 END) as active
      FROM User
      WHERE isDeleted = 0
    `);

    console.log("\n═══════════════════════════════════════");
    console.log("📊 SUMMARY");
    console.log("═══════════════════════════════════════");
    console.log(`✓ Created: ${created} users`);
    console.log(`⊘ Skipped: ${skipped} users (already exist)`);
    console.log("\n📈 CURRENT DATABASE STATS:");
    console.log(`   Total Users: ${stats[0].totalUsers}`);
    console.log(`   - Admins: ${stats[0].admins}`);
    console.log(`   - Regular Users: ${stats[0].regularUsers}`);
    console.log(`   - Active: ${stats[0].active}`);
    console.log(`   - Suspended: ${stats[0].suspended}`);
    console.log("═══════════════════════════════════════\n");

    console.log("✅ TEST 1 READY:");
    console.log(
      "   Navigate to: http://localhost:3000/html/admin/admin-users.html"
    );
    console.log("   Expected stats:");
    console.log(`   - Total Users: ${stats[0].totalUsers}`);
    console.log(`   - Active Users: ${stats[0].active}`);
    console.log(`   - Suspended Users: ${stats[0].suspended}`);
    console.log(`   - Admins: ${stats[0].admins}\n`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log("✓ Database connection closed");
    }
  }
}

// Run the script
createDummyUsers();
