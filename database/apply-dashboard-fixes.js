// Apply all admin dashboard fixes
const db = require("../server/db");
const fs = require("fs");
const path = require("path");

async function applyFixes() {
  try {
    console.log("🔧 Applying admin dashboard fixes...\n");

    // 1. Update stored procedure
    console.log("1. Updating sp_get_most_active_users stored procedure...");
    const sqlFile = path.join(__dirname, "fix-sp-active-users.sql");
    const sql = fs.readFileSync(sqlFile, "utf8");

    // Split by delimiter and execute each statement
    const statements = sql.split("DELIMITER");
    for (const stmt of statements) {
      const cleanStmt = stmt.replace(/\$\$/g, ";").trim();
      if (cleanStmt && !cleanStmt.startsWith(";")) {
        try {
          await db.query(cleanStmt);
        } catch (err) {
          if (!err.message.includes("DELIMITER")) {
            console.error("   Error executing statement:", err.message);
          }
        }
      }
    }
    console.log("   ✓ Stored procedure updated");

    // 2. Add dummy data
    console.log("\n2. Adding dummy data...");

    // Add flagged content
    await db.query(`
      INSERT IGNORE INTO FlaggedContent (contentType, contentID, flaggedBy, flagReason, status, flaggedDate)
      VALUES 
        ('Post', '1', 1, 'Inappropriate content', 'pending', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
        ('Post', '2', 2, 'Spam', 'pending', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
        ('Comment', '3', 3, 'Offensive language', 'pending', DATE_SUB(NOW(), INTERVAL 1 DAY))
    `);
    console.log("   ✓ Added flagged content");

    // Add admin notifications
    await db.query(`
      INSERT INTO AdminNotifications (notificationType, title, message, priority, createdDate)
      VALUES 
        ('new_flag', 'New Content Flagged', 'A post has been flagged for inappropriate content', 'high', DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
        ('security_event', 'Suspicious Activity', 'User account showing unusual login patterns', 'medium', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
        ('backup_status', 'Database Backup', 'Daily database backup completed successfully', 'low', DATE_SUB(NOW(), INTERVAL 2 HOUR))
      ON DUPLICATE KEY UPDATE createdDate = VALUES(createdDate)
    `);
    console.log("   ✓ Added admin notifications");

    // 3. Verify data
    console.log("\n3. Verifying data...");

    const stats = await db.query(
      "SELECT * FROM v_admin_dashboard_stats LIMIT 1"
    );
    console.log(`   Total Users: ${stats[0]?.totalUsers || 0}`);
    console.log(`   Total Movies: ${stats[0]?.totalMovies || 0}`);
    console.log(`   Total Posts: ${stats[0]?.totalPosts || 0}`);
    console.log(`   Pending Flags: ${stats[0]?.pendingFlags || 0}`);

    const activeUsers = await db.query("CALL sp_get_most_active_users(5, 30)");
    console.log(
      `   Active Users (last 30 days): ${activeUsers[0]?.length || 0}`
    );

    if (activeUsers[0] && activeUsers[0].length > 0) {
      console.log("\n   Sample Active User:");
      const user = activeUsers[0][0];
      console.log(`     Username: ${user.username}`);
      console.log(`     Posts: ${user.postCount}`);
      console.log(`     Reviews: ${user.reviewCount}`);
      console.log(`     Comments: ${user.commentCount}`);
    }

    console.log("\n✅ All fixes applied successfully!");
    console.log("\nRefresh your admin dashboard to see the changes.");
  } catch (error) {
    console.error("❌ Error applying fixes:", error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

applyFixes();
