// Script to add dummy data for admin dashboard testing
const db = require("../server/db");

async function addDummyData() {
  try {
    console.log("🔧 Adding dummy data for admin dashboard testing...\n");

    // 1. Add flagged content
    console.log("1. Adding flagged content...");
    await db.query(`
      INSERT INTO FlaggedContent (contentType, contentID, reportedBy, reason, status, flagDate)
      VALUES 
        ('post', 1, 1, 'Inappropriate content', 'pending', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
        ('post', 2, 2, 'Spam', 'pending', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
        ('comment', 3, 3, 'Offensive language', 'pending', DATE_SUB(NOW(), INTERVAL 1 DAY)),
        ('review', 4, 4, 'False information', 'reviewed', DATE_SUB(NOW(), INTERVAL 2 DAY)),
        ('post', 5, 5, 'Harassment', 'pending', DATE_SUB(NOW(), INTERVAL 3 HOUR))
      ON DUPLICATE KEY UPDATE flagDate = VALUES(flagDate)
    `);
    console.log("   ✓ Added 5 flagged items");

    // 2. Add admin notifications
    console.log("\n2. Adding admin notifications...");
    await db.query(`
      INSERT INTO AdminNotifications (type, title, message, severity, isRead, createdDate)
      VALUES 
        ('flag', 'New Content Flagged', 'A post has been flagged for inappropriate content', 'high', FALSE, DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
        ('user', 'Suspicious Activity', 'User account showing unusual login patterns', 'medium', FALSE, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
        ('system', 'Database Backup', 'Daily database backup completed successfully', 'low', FALSE, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
        ('security', 'Failed Login Attempts', '5 failed login attempts detected from IP 192.168.1.100', 'high', FALSE, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
        ('content', 'High Activity', 'Spike in user registrations detected (50 new users in last hour)', 'medium', FALSE, DATE_SUB(NOW(), INTERVAL 4 HOUR))
      ON DUPLICATE KEY UPDATE createdDate = VALUES(createdDate)
    `);
    console.log("   ✓ Added 5 notifications");

    // 3. Check total posts count
    console.log("\n3. Checking Post table...");
    const postCount = await db.query("SELECT COUNT(*) as count FROM Post");
    console.log(`   Current posts in database: ${postCount[0].count}`);

    if (postCount[0].count === 0) {
      console.log(
        "   No posts found. This might explain why total posts is 0."
      );
      console.log(
        "   You may need to add posts through the regular user interface."
      );
    }

    // 4. Check active users
    console.log("\n4. Checking active users...");
    const activeUsers = await db.query(`
      SELECT COUNT(DISTINCT userID) as count
      FROM (
        SELECT userID FROM Post WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        UNION
        SELECT userID FROM ReviewRatings WHERE reviewDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        UNION
        SELECT userID FROM Comments WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ) as active
    `);
    console.log(`   Active users (last 30 days): ${activeUsers[0].count}`);

    // 5. Check admin user details
    console.log("\n5. Admin user details:");
    const admin = await db.query(
      "SELECT userID, username, name, email, role FROM User WHERE email = ?",
      ["admin@3moviecollectors.com"]
    );
    if (admin.length > 0) {
      console.log(`   Username: ${admin[0].username}`);
      console.log(`   Name: ${admin[0].name}`);
      console.log(`   Email: ${admin[0].email}`);
      console.log(`   Role: ${admin[0].role}`);
    }

    console.log("\n✅ Dummy data added successfully!");
    console.log("\nRefresh your admin dashboard to see the changes.");
  } catch (error) {
    console.error("❌ Error adding dummy data:", error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

addDummyData();
