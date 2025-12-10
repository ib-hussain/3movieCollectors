const express = require("express");
const router = express.Router();
const db = require("../../db");

// GET /api/admin/messages - Get all private messages (for moderation)
router.get("/", async (req, res) => {
  try {
    const {
      search, // Search in message content
      fromUser, // Filter by sender userID
      toUser, // Filter by recipient userID
      flagged, // Filter by flagged status
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        m.messageID,
        m.senderID,
        m.receiverID,
        m.content,
        m.timeStamp as sentDate,
        m.isRead,
        sender.username as senderUsername,
        sender.email as senderEmail,
        receiver.username as receiverUsername,
        receiver.email as receiverEmail,
        fc.flagID,
        fc.flaggedDate,
        fc.status as flagStatus
      FROM Message m
      INNER JOIN User sender ON m.senderID = sender.userID
      INNER JOIN User receiver ON m.receiverID = receiver.userID
      LEFT JOIN FlaggedContent fc ON fc.contentType = 'message' 
        AND fc.contentID = m.messageID
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ` AND m.content LIKE ?`;
      params.push(`%${search}%`);
    }

    if (fromUser) {
      query += ` AND m.senderID = ?`;
      params.push(fromUser);
    }

    if (toUser) {
      query += ` AND m.receiverID = ?`;
      params.push(toUser);
    }

    if (flagged === "true") {
      query += ` AND fc.flagID IS NOT NULL`;
    } else if (flagged === "false") {
      query += ` AND fc.flagID IS NULL`;
    }

    if (startDate) {
      query += ` AND m.timeStamp >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND m.timeStamp <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY m.timeStamp DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const messages = await db.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM Message m
      LEFT JOIN FlaggedContent fc ON fc.contentType = 'message' 
        AND fc.contentID = m.messageID
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countQuery += ` AND m.content LIKE ?`;
      countParams.push(`%${search}%`);
    }
    if (fromUser) {
      countQuery += ` AND m.senderID = ?`;
      countParams.push(fromUser);
    }
    if (toUser) {
      countQuery += ` AND m.receiverID = ?`;
      countParams.push(toUser);
    }
    if (flagged === "true") {
      countQuery += ` AND fc.flagID IS NOT NULL`;
    } else if (flagged === "false") {
      countQuery += ` AND fc.flagID IS NULL`;
    }
    if (startDate) {
      countQuery += ` AND m.timeStamp >= ?`;
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ` AND m.timeStamp <= ?`;
      countParams.push(endDate);
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve messages",
      error: error.message,
    });
  }
});

// GET /api/admin/messages/:messageID - Get specific message details
router.get("/:messageID", async (req, res) => {
  try {
    const { messageID } = req.params;

    const messages = await db.query(
      `
      SELECT 
        m.*,
        sender.username as senderUsername,
        sender.email as senderEmail,
        receiver.username as receiverUsername,
        receiver.email as receiverEmail,
        fc.flagID,
        fc.flaggedDate,
        fc.flaggedBy,
        flagger.username as flaggerUsername
      FROM Message m
      INNER JOIN User sender ON m.senderID = sender.userID
      INNER JOIN User receiver ON m.receiverID = receiver.userID
      LEFT JOIN FlaggedContent fc ON fc.contentType = 'message' 
        AND fc.contentID = m.messageID
      LEFT JOIN User flagger ON fc.flaggedBy = flagger.userID
      WHERE m.messageID = ?
    `,
      [messageID]
    );

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.json({
      success: true,
      message: messages[0],
    });
  } catch (error) {
    console.error("Get message details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve message details",
      error: error.message,
    });
  }
});

// GET /api/admin/messages/conversation/:userID1/:userID2 - Get conversation between two users
router.get("/conversation/:userID1/:userID2", async (req, res) => {
  try {
    const { userID1, userID2 } = req.params;
    const { limit = 100 } = req.query;

    const messages = await db.query(
      `
      SELECT 
        m.*,
        sender.username as senderUsername,
        receiver.username as receiverUsername,
        fc.flagID
      FROM Message m
      INNER JOIN User sender ON m.senderID = sender.userID
      INNER JOIN User receiver ON m.receiverID = receiver.userID
      LEFT JOIN FlaggedContent fc ON fc.contentType = 'message' 
        AND fc.contentID = m.messageID
      WHERE (m.senderID = ? AND m.receiverID = ?)
         OR (m.senderID = ? AND m.receiverID = ?)
      ORDER BY m.timeStamp DESC
      LIMIT ?
    `,
      [userID1, userID2, userID2, userID1, parseInt(limit)]
    );

    res.json({
      success: true,
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve conversation",
      error: error.message,
    });
  }
});

// DELETE /api/admin/messages/:messageID - Delete a message
router.delete("/:messageID", async (req, res) => {
  try {
    const { messageID } = req.params;
    const adminID = req.session.userId;

    // Get message details before deletion
    const messages = await db.query(
      `SELECT senderID, receiverID, content FROM Message WHERE messageID = ?`,
      [messageID]
    );

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const message = messages[0];

    // Delete the message
    await db.query(`DELETE FROM Message WHERE messageID = ?`, [messageID]);

    // Log action in AuditLog
    await db.query(
      `
      INSERT INTO AuditLog (
        adminID,
        targetTable,
        targetRecordID,
        operationPerformed,
        actionDetails,
        timeStamp,
        ipAddress,
        userAgent
      ) VALUES (?, 'Messages', ?, 'DELETE CONTENT', ?, NOW(), ?, ?)
    `,
      [
        adminID,
        messageID,
        `Deleted message from user ${message.senderID} to ${message.receiverID}`,
        req.ip || req.connection.remoteAddress || "0.0.0.0",
        req.get("user-agent") || "Unknown",
      ]
    );

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
});

// GET /api/admin/messages/stats - Get message statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as totalMessages,
        COUNT(CASE WHEN isRead = 1 THEN 1 END) as readMessages,
        COUNT(CASE WHEN isRead = 0 THEN 1 END) as unreadMessages,
        COUNT(CASE WHEN timeStamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as last24Hours,
        COUNT(CASE WHEN timeStamp >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last7Days
      FROM Message
    `);

    const flaggedCount = await db.query(`
      SELECT COUNT(*) as flaggedMessages
      FROM FlaggedContent
      WHERE contentType = 'message'
    `);

    res.json({
      success: true,
      stats: {
        ...stats[0],
        flaggedMessages: flaggedCount[0].flaggedMessages,
      },
    });
  } catch (error) {
    console.error("Get message stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve message statistics",
      error: error.message,
    });
  }
});

module.exports = router;
