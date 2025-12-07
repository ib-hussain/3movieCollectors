const express = require("express");
const router = express.Router();
const db = require("../db");
const { createNotification } = require("./notifications");

// Get all friends for the logged-in user
router.get("/", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.session.userId;

    // Get all friendships where user is either user1 or user2
    const query = `
            SELECT 
                u.userID,
                u.username,
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
    res.json(friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

// Get all pending friend requests for the logged-in user
router.get("/requests", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.session.userId;

    // Get incoming requests (where user is the receiver)
    const incomingQuery = `
            SELECT 
                fr.reqID as requestID,
                fr.senderID,
                fr.reqDate as requestDate,
                u.name as firstName,
                '' as lastName,
                u.email,
                'incoming' as requestType
            FROM FriendRequest fr
            INNER JOIN User u ON fr.senderID = u.userID
            WHERE fr.receiverID = ? AND fr.status = 'pending'
            ORDER BY fr.reqDate DESC
        `;

    // Get outgoing requests (where user is the sender)
    const outgoingQuery = `
            SELECT 
                fr.reqID as requestID,
                fr.receiverID,
                fr.reqDate as requestDate,
                u.name as firstName,
                '' as lastName,
                u.email,
                'outgoing' as requestType
            FROM FriendRequest fr
            INNER JOIN User u ON fr.receiverID = u.userID
            WHERE fr.senderID = ? AND fr.status = 'pending'
            ORDER BY fr.reqDate DESC
        `;

    const incoming = await db.query(incomingQuery, [userId]);
    const outgoing = await db.query(outgoingQuery, [userId]);

    res.json({
      incoming,
      outgoing,
    });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    res.status(500).json({ error: "Failed to fetch friend requests" });
  }
});

// Get friend suggestions based on mutual friends
router.get("/suggestions", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.session.userId;

    // Algorithm: Find users who are friends with my friends, but not friends with me
    // If no mutual friends exist, show all other users
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

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching friend suggestions:", error);
    res.status(500).json({ error: "Failed to fetch friend suggestions" });
  }
});

// Send a friend request
router.post("/requests", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { receiverId } = req.body;
    const senderId = req.session.userId;

    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ error: "Cannot send friend request to yourself" });
    }

    // Check if already friends
    const friendCheckQuery = `
            SELECT * FROM Friends 
            WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)
        `;
    const existingFriendship = await db.query(friendCheckQuery, [
      senderId,
      receiverId,
      receiverId,
      senderId,
    ]);

    if (existingFriendship.length > 0) {
      return res.status(400).json({ error: "Already friends with this user" });
    }

    // Check if request already exists
    const requestCheckQuery = `
            SELECT * FROM FriendRequest 
            WHERE ((senderID = ? AND receiverID = ?) OR (senderID = ? AND receiverID = ?))
            AND status = 'pending'
        `;
    const existingRequest = await db.query(requestCheckQuery, [
      senderId,
      receiverId,
      receiverId,
      senderId,
    ]);

    if (existingRequest.length > 0) {
      return res.status(400).json({ error: "Friend request already exists" });
    }

    // Insert friend request
    const insertQuery = `
            INSERT INTO FriendRequest (senderID, receiverID, status, reqDate)
            VALUES (?, ?, 'pending', NOW())
        `;
    const result = await db.query(insertQuery, [senderId, receiverId]);

    // Create notification for the receiver
    await createNotification(
      receiverId,
      senderId,
      "friend_request",
      "sent you a friend request",
      null
    );

    res.status(201).json({
      message: "Friend request sent successfully",
      requestId: result.insertId,
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ error: "Failed to send friend request" });
  }
});

// Accept a friend request (one-way acceptance)
router.post("/requests/:id/accept", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const requestId = req.params.id;
    const userId = req.session.userId;

    // Get the friend request
    const getRequestQuery = `
            SELECT * FROM FriendRequest 
            WHERE reqID = ? AND receiverID = ? AND status = 'pending'
        `;
    const requests = await db.query(getRequestQuery, [requestId, userId]);

    if (requests.length === 0) {
      return res
        .status(404)
        .json({ error: "Friend request not found or already processed" });
    }

    const request = requests[0];

    // Start transaction
    await db.query("START TRANSACTION");

    try {
      // Create friendship (one-way acceptance - no need for both to accept)
      const createFriendshipQuery = `
                INSERT INTO Friends (user1, user2, friendshipDate)
                VALUES (?, ?, NOW())
            `;
      await db.query(createFriendshipQuery, [
        request.senderID,
        request.receiverID,
      ]);

      // Update request status to accepted
      const updateRequestQuery = `
                UPDATE FriendRequest 
                SET status = 'accepted'
                WHERE reqID = ?
            `;
      await db.query(updateRequestQuery, [requestId]);

      // Commit transaction
      await db.query("COMMIT");

      // Create notification for the original sender
      await createNotification(
        request.senderID,
        userId,
        "friend_accept",
        "accepted your friend request",
        null
      );

      res.json({ message: "Friend request accepted successfully" });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({ error: "Failed to accept friend request" });
  }
});

// Decline a friend request
router.post("/requests/:id/decline", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const requestId = req.params.id;
    const userId = req.session.userId;

    // Update request status to declined (only receiver can decline)
    const updateQuery = `
            UPDATE FriendRequest 
            SET status = 'rejected'
            WHERE reqID = ? AND receiverID = ? AND status = 'pending'
        `;
    const result = await db.query(updateQuery, [requestId, userId]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Friend request not found or already processed" });
    }

    res.json({ message: "Friend request declined successfully" });
  } catch (error) {
    console.error("Error declining friend request:", error);
    res.status(500).json({ error: "Failed to decline friend request" });
  }
});

// Unfriend a user (instant, no confirmation)
router.delete("/:userId", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const friendId = req.params.userId;
    const userId = req.session.userId;

    // Delete friendship (works regardless of who is user1 or user2)
    const deleteQuery = `
            DELETE FROM Friends 
            WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)
        `;
    const result = await db.query(deleteQuery, [
      userId,
      friendId,
      friendId,
      userId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Friendship not found" });
    }

    res.json({ message: "Unfriended successfully" });
  } catch (error) {
    console.error("Error unfriending user:", error);
    res.status(500).json({ error: "Failed to unfriend user" });
  }
});

module.exports = router;
