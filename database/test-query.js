const mysql = require("mysql2/promise");

(async () => {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "8956",
    database: "3movieCollectors",
  });

  try {
    console.log("Testing Message table query...");

    const [result] = await conn.query(`
      SELECT 
        m.messageID,
        m.senderID,
        m.receiverID,
        m.content,
        m.timeStamp as sentDate,
        m.isRead,
        sender.username as senderUsername
      FROM message m
      INNER JOIN user sender ON m.senderID = sender.userID
      LIMIT 5
    `);

    console.log("✓ Query succeeded!");
    console.log("Found", result.length, "messages");
  } catch (e) {
    console.log("✗ Query failed:", e.message);
  }

  await conn.end();
})();
