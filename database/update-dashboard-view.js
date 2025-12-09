const db = require("../server/db");

async function updateDashboardView() {
  try {
    console.log("Updating v_admin_dashboard_stats view...");

    await db.query(`
      CREATE OR REPLACE VIEW v_admin_dashboard_stats AS
      SELECT 
          (SELECT COUNT(*) FROM User WHERE role = 'user') as totalUsers,
          (SELECT COUNT(*) FROM Movie) as totalMovies,
          (SELECT COUNT(*) FROM Post) as totalPosts,
          (SELECT COUNT(*) FROM FlaggedContent WHERE status = 'pending') as pendingFlags,
          (SELECT COUNT(DISTINCT userID) FROM User WHERE registrationDate >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as newUsersToday,
          (SELECT COUNT(*) FROM Post WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as postsToday,
          (SELECT COUNT(*) FROM ReviewRatings WHERE reviewDate >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as reviewsToday,
          (SELECT COUNT(*) FROM User WHERE isSuspended = TRUE) as suspendedUsers
    `);

    console.log("✓ View updated successfully");

    // Test it
    const result = await db.query("SELECT * FROM v_admin_dashboard_stats");
    console.log("\nDashboard Stats:");
    console.log(`  Total Users: ${result[0].totalUsers}`);
    console.log(`  Total Movies: ${result[0].totalMovies}`);
    console.log(`  Total Posts: ${result[0].totalPosts}`);
    console.log(`  Pending Flags: ${result[0].pendingFlags}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

updateDashboardView();
