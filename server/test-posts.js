const mysql = require("mysql2/promise");

async function checkPosts() {
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "8956",
    database: "3moviecollectors",
  });

  console.log("\n=== Posts ===");
  const [posts] = await db.query("SELECT * FROM Post LIMIT 5");
  console.table(posts);

  console.log("\n=== Comments ===");
  const [comments] = await db.query("SELECT * FROM Comments LIMIT 5");
  console.table(comments);

  await db.end();
}

checkPosts().catch(console.error);
