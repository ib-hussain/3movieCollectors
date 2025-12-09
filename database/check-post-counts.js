const db = require("../server/db");

async function checkPostCounts() {
  try {
    console.log("Checking post counts...\n");

    // Total posts
    const total = await db.query("SELECT COUNT(*) as count FROM Post");
    console.log("Total Posts in database:", total[0].count);

    // Posts today
    const today = await db.query(
      "SELECT COUNT(*) as count FROM Post WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    );
    console.log("Posts created today (last 24h):", today[0].count);

    // From view
    const view = await db.query(
      "SELECT totalPosts, postsToday FROM v_admin_dashboard_stats"
    );
    console.log("\nFrom v_admin_dashboard_stats view:");
    console.log("  totalPosts:", view[0].totalPosts);
    console.log("  postsToday:", view[0].postsToday);

    // Check some recent posts
    const recent = await db.query(
      "SELECT postID, userID, createdAt FROM Post ORDER BY createdAt DESC LIMIT 5"
    );
    console.log("\nMost recent posts:");
    recent.forEach((post) => {
      console.log(`  Post ID ${post.postID}: Created at ${post.createdAt}`);
    });

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

checkPostCounts();
