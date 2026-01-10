const express = require("express");
const router = express.Router();
const db = require("../db");

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, error: "Not authenticated" });
  }
  next();
};

/**
 * GET /api/messages/threads
 * Get all message threads for the current user
 * Returns list of friends with whom user has messages or can message
 */
router.get("/messages/threads", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Get all friends and their latest message
    const query = `
      SELECT 
        CASE 
          WHEN f.user1 = ? THEN f.user2
          ELSE f.user1 
        END as friendId,
        u.username as friendUsername,
        u.name as friendName,
        u.profilePicture as friendProfilePicture,
        (
          SELECT content 
          FROM Message 
          WHERE (senderID = ? AND receiverID = CASE WHEN f.user1 = ? THEN f.user2 ELSE f.user1 END) 
             OR (senderID = CASE WHEN f.user1 = ? THEN f.user2 ELSE f.user1 END AND receiverID = ?)
          ORDER BY timeStamp DESC 
          LIMIT 1
        ) as lastMessage,
        (
          SELECT timeStamp 
          FROM Message 
          WHERE (senderID = ? AND receiverID = CASE WHEN f.user1 = ? THEN f.user2 ELSE f.user1 END) 
             OR (senderID = CASE WHEN f.user1 = ? THEN f.user2 ELSE f.user1 END AND receiverID = ?)
          ORDER BY timeStamp DESC 
          LIMIT 1
        ) as lastMessageTime,
        (
          SELECT COUNT(*) 
          FROM Message 
          WHERE senderID = CASE WHEN f.user1 = ? THEN f.user2 ELSE f.user1 END
            AND receiverID = ? 
            AND isRead = FALSE
        ) as unreadCount
      FROM Friends f
      JOIN User u ON (
        CASE 
          WHEN f.user1 = ? THEN f.user2
          ELSE f.user1 
        END = u.userID
      )
      WHERE f.user1 = ? OR f.user2 = ?
      ORDER BY lastMessageTime IS NULL, lastMessageTime DESC
    `;

    const threads = await db.query(query, [
      userId, // friendId CASE
      userId, // lastMessage subquery senderID
      userId, // lastMessage CASE user1
      userId, // lastMessage CASE user1
      userId, // lastMessage receiverID
      userId, // lastMessageTime senderID
      userId, // lastMessageTime CASE user1
      userId, // lastMessageTime CASE user1
      userId, // lastMessageTime receiverID
      userId, // unreadCount CASE user1
      userId, // unreadCount receiverID
      userId, // JOIN CASE user1
      userId, // WHERE user1
      userId, // WHERE user2
    ]);

    res.json({
      success: true,
      threads,
    });
  } catch (error) {
    console.error("Error fetching message threads:", error);
    res.status(500).json({ success: false, error: "Failed to fetch threads" });
  }
});

/**
 * GET /api/messages/threads/:friendId
 * Get all messages in a conversation with a specific friend
 */
router.get("/messages/threads/:friendId", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const friendId = parseInt(req.params.friendId);

    // Verify they are friends
    const friendship = await db.query(
      `SELECT * FROM Friends 
       WHERE (user1 = ? AND user2 = ?) 
          OR (user1 = ? AND user2 = ?)`,
      [userId, friendId, friendId, userId]
    );

    if (friendship.length === 0) {
      return res
        .status(403)
        .json({ success: false, error: "Not friends with this user" });
    }

    // Get messages with pagination (fetch recent messages first, then load older)
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const messages = await db.query(
      `SELECT 
        m.messageID,
        m.senderID,
        m.receiverID,
        m.content,
        m.timeStamp,
        m.isRead,
        u.username as senderUsername,
        u.name as senderName,
        u.profilePicture as senderProfilePicture
      FROM Message m
      JOIN User u ON m.senderID = u.userID
      WHERE (m.senderID = ? AND m.receiverID = ?)
         OR (m.senderID = ? AND m.receiverID = ?)
      ORDER BY m.timeStamp DESC
      LIMIT ? OFFSET ?`,
      [userId, friendId, friendId, userId, limit + 1, offset]
    );

    // Check for more messages
    const hasMore = messages.length > limit;
    const paginatedMessages = hasMore ? messages.slice(0, limit) : messages;

    // Reverse to show oldest first in UI (since we fetched DESC)
    const orderedMessages = paginatedMessages.reverse();

    // Mark all messages from friend as read
    await db.query(
      `UPDATE Message 
       SET isRead = TRUE 
       WHERE senderID = ? AND receiverID = ? AND isRead = FALSE`,
      [friendId, userId]
    );

    res.json({
      success: true,
      messages: orderedMessages,
      hasMore,
      pagination: {
        limit,
        offset,
        nextOffset: hasMore ? offset + limit : null,
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, error: "Failed to fetch messages" });
  }
});

/**
 * POST /api/messages/threads/:friendId/messages
 * Send a new message to a friend
 */
router.post(
  "/messages/threads/:friendId/messages",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.session.userId;
      const friendId = parseInt(req.params.friendId);
      const { content } = req.body;

      if (!content || content.trim() === "") {
        return res
          .status(400)
          .json({ success: false, error: "Message content is required" });
      }

      // Verify they are friends
      const friendship = await db.query(
        `SELECT * FROM Friends 
         WHERE (user1 = ? AND user2 = ?) 
            OR (user1 = ? AND user2 = ?)`,
        [userId, friendId, friendId, userId]
      );

      if (friendship.length === 0) {
        return res
          .status(403)
          .json({ success: false, error: "Not friends with this user" });
      }

      // Insert the message (using user IDs to create a consistent friendID)
      // friendID is calculated as: smaller_userID * 10000 + larger_userID
      const friendID =
        Math.min(userId, friendId) * 10000 + Math.max(userId, friendId);

      const result = await db.query(
        `INSERT INTO Message (friendID, senderID, receiverID, content, timeStamp, isRead)
         VALUES (?, ?, ?, ?, NOW(), FALSE)`,
        [friendID, userId, friendId, content.trim()]
      );

      const messageId = result.insertId;

      // Get the newly created message with sender info
      const newMessage = await db.query(
        `SELECT 
          m.messageID,
          m.senderID,
          m.receiverID,
          m.content,
          m.timeStamp,
          m.isRead,
          u.username as senderUsername,
          u.name as senderName,
          u.profilePicture as senderProfilePicture
        FROM Message m
        JOIN User u ON m.senderID = u.userID
        WHERE m.messageID = ?`,
        [messageId]
      );

      res.json({
        success: true,
        message: newMessage[0],
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ success: false, error: "Failed to send message" });
    }
  }
);

/**
 * GET /api/messages/unread-count
 * Get count of unread messages for navbar badge
 */
router.get("/messages/unread-count", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    const result = await db.query(
      `SELECT COUNT(*) as count 
       FROM Message 
       WHERE receiverID = ? AND isRead = FALSE`,
      [userId]
    );

    res.json({
      success: true,
      count: result[0]?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ success: false, error: "Failed to fetch count" });
  }
});

module.exports = router;
