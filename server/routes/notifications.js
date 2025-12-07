const express = require("express");
const router = express.Router();
const db = require("../db");

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

/**
 * GET /api/notifications
 * Get user's notifications with optional filter
 */
router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const filter = req.query.filter || "all"; // 'all' or 'unread'

    let query = `
      SELECT 
        n.notificationID,
        n.content,
        n.triggerEvent,
        n.isSeen,
        n.timeStamp,
        n.triggerUserID,
        n.relatedID,
        u.username as triggerUsername,
        u.name as triggerName,
        u.profilePicture as triggerProfilePicture,
        p.movieId as movieId
      FROM Notifications n
      LEFT JOIN User u ON n.triggerUserID = u.userID
      LEFT JOIN Post p ON n.relatedID = p.postID AND n.triggerEvent IN ('post_like', 'post_comment', 'new_post')
      WHERE n.receivedFROMuserID = ?
    `;

    const params = [userId];

    if (filter === "unread") {
      query += " AND n.isSeen = FALSE";
    }

    query += " ORDER BY n.timeStamp DESC LIMIT 50";

    const notifications = await db.query(query, params);

    // Get unread count
    const unreadCount = await db.query(
      "SELECT COUNT(*) as count FROM Notifications WHERE receivedFROMuserID = ? AND isSeen = FALSE",
      [userId]
    );

    res.json({
      success: true,
      notifications,
      unreadCount: unreadCount[0]?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    // Verify notification belongs to user
    const notification = await db.query(
      "SELECT notificationID FROM Notifications WHERE notificationID = ? AND receivedFROMuserID = ?",
      [id, userId]
    );

    if (!notification || notification.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await db.query(
      "UPDATE Notifications SET isSeen = TRUE WHERE notificationID = ?",
      [id]
    );

    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for current user
 */
router.post("/notifications/mark-all-read", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    await db.query(
      "UPDATE Notifications SET isSeen = TRUE WHERE receivedFROMuserID = ? AND isSeen = FALSE",
      [userId]
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications (for navbar badge)
 */
router.get("/notifications/unread-count", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    const result = await db.query(
      "SELECT COUNT(*) as count FROM Notifications WHERE receivedFROMuserID = ? AND isSeen = FALSE",
      [userId]
    );

    res.json({
      success: true,
      count: result[0]?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

/**
 * Helper function to create a notification
 * This is called from other routes when events happen
 */
async function createNotification(
  recipientUserId,
  triggerUserId,
  triggerEvent,
  content,
  relatedId = null
) {
  try {
    await db.query(
      `INSERT INTO Notifications 
       (receivedFROMuserID, triggerUserID, triggerEvent, content, relatedID, isSeen) 
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [recipientUserId, triggerUserId, triggerEvent, content, relatedId]
    );
    return true;
  } catch (error) {
    console.error("Error creating notification:", error);
    return false;
  }
}

// Export both router and helper function
module.exports = router;
module.exports.createNotification = createNotification;
