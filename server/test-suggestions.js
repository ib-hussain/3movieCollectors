const db = require("./db");

async function testSuggestions() {
  try {
    // Test with user ID 1 (admin)
    const userId = 1;

    console.log(
      "\n=== Testing Friend Suggestions for User ID:",
      userId,
      "===\n"
    );

    // First, check all users
    const allUsers = await db.query("SELECT userID, name, email FROM User");
    console.log("All users in database:");
    console.log(allUsers);
    console.log("\n");

    // Check friends
    const friends = await db.query(
      "SELECT * FROM Friends WHERE user1 = ? OR user2 = ?",
      [userId, userId]
    );
    console.log("Friends of user", userId + ":");
    console.log(friends);
    console.log("\n");

    // Check friend requests
    const requests = await db.query(
      "SELECT * FROM FriendRequest WHERE (senderID = ? OR receiverID = ?) AND status = 'pending'",
      [userId, userId]
    );
    console.log("Pending requests for user", userId + ":");
    console.log(requests);
    console.log("\n");

    // Now test the actual suggestions query
    const query = `
            SELECT DISTINCT
                u.userID,
                u.name as firstName,
                '' as lastName,
                u.email,
                COALESCE(
                    (SELECT COUNT(DISTINCT CASE 
                        WHEN f2.user1 = u.userID THEN f2.user2 
                        WHEN f2.user2 = u.userID THEN f2.user1 
                    END)
                    FROM Friends f2
                    WHERE (f2.user1 = u.userID OR f2.user2 = u.userID)
                    AND (
                        f2.user1 IN (SELECT user2 FROM Friends WHERE user1 = ? UNION SELECT user1 FROM Friends WHERE user2 = ?)
                        OR
                        f2.user2 IN (SELECT user2 FROM Friends WHERE user1 = ? UNION SELECT user1 FROM Friends WHERE user2 = ?)
                    )),
                    0
                ) as mutualFriendsCount
            FROM User u
            WHERE u.userID != ?
            AND u.userID NOT IN (
                SELECT user2 FROM Friends WHERE user1 = ?
                UNION
                SELECT user1 FROM Friends WHERE user2 = ?
            )
            AND u.userID NOT IN (
                SELECT receiverID FROM FriendRequest WHERE senderID = ? AND status = 'pending'
                UNION
                SELECT senderID FROM FriendRequest WHERE receiverID = ? AND status = 'pending'
            )
            ORDER BY mutualFriendsCount DESC, u.name
            LIMIT 20
        `;

    const suggestions = await db.query(query, [
      userId,
      userId,
      userId,
      userId,
      userId,
      userId,
      userId,
      userId,
      userId,
    ]);

    console.log("Suggestions result:");
    console.log(suggestions);
    console.log("\nNumber of suggestions:", suggestions.length);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testSuggestions();
