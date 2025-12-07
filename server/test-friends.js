const db = require("./db");

async function testFriendsQuery() {
  try {
    const userId = 1;

    console.log("Testing friends query...");
    const query = `
            SELECT 
                u.userID,
                u.name as firstName,
                '' as lastName,
                u.email,
                f.friendshipDate
            FROM Friends f
            INNER JOIN User u ON (
                CASE 
                    WHEN f.user1 = ? THEN u.userID = f.user2
                    WHEN f.user2 = ? THEN u.userID = f.user1
                END
            )
            WHERE f.user1 = ? OR f.user2 = ?
            ORDER BY u.name
        `;

    const friends = await db.query(query, [userId, userId, userId, userId]);
    console.log("Friends result:", friends);
    console.log("Number of friends:", friends.length);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    console.error("SQL State:", error.sqlState);
    console.error("SQL Message:", error.sqlMessage);
    process.exit(1);
  }
}

testFriendsQuery();
