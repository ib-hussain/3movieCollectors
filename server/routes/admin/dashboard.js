// Admin Dashboard Statistics Routes
const express = require("express");
const router = express.Router();
const db = require("../../db");

// ==================== DASHBOARD STATISTICS ====================

// GET /api/admin/dashboard/overview - Get comprehensive dashboard stats
router.get("/overview", async (req, res) => {
  try {
    // Get stats from the view
    const dashboardStats = await db.query(`
      SELECT * FROM v_admin_dashboard_stats
    `);

    // Get recent activity
    const recentActivity = await db.query(`
      SELECT 
        operationPerformed,
        targetTable,
        targetRecordID,
        actionDetails,
        timeStamp,
        ipAddress
      FROM AuditLog
      ORDER BY timeStamp DESC
      LIMIT 20
    `);

    // Get pending flags count
    const flagStats = await db.query(`
      SELECT 
        COUNT(*) as pendingFlags,
        0 as highSeverity,
        0 as mediumSeverity,
        0 as lowSeverity
      FROM FlaggedContent
      WHERE status = 'pending'
    `);

    // Get user growth (last 30 days)
    const userGrowth = await db.query(`
      SELECT 
        DATE(registrationDate) as date,
        COUNT(*) as newUsers
      FROM User
      WHERE registrationDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(registrationDate)
      ORDER BY date DESC
    `);

    // Get active users (posted/reviewed/commented in last 7 days)
    const activeUsers = await db.query(`
      SELECT COUNT(DISTINCT userID) as activeUsers
      FROM (
        SELECT userID FROM Post WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        UNION
        SELECT userID FROM ReviewRatings WHERE reviewDate >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        UNION
        SELECT userID FROM Comments WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ) as active
    `);

    res.json({
      success: true,
      stats: dashboardStats[0] || {},
      recentActivity,
      flagStats: flagStats[0],
      userGrowth,
      activeUsers: activeUsers[0].activeUsers,
    });
  } catch (error) {
    console.error("Get dashboard overview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard overview",
      error: error.message,
    });
  }
});

// GET /api/admin/dashboard/audit-log - Get audit log entries
router.get("/audit-log", async (req, res) => {
  try {
    const {
      operation, // INSERT, UPDATE, DELETE, etc.
      tableName,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        al.*,
        u.username
      FROM AuditLog al
      LEFT JOIN User u ON al.adminID = u.userID
      WHERE 1=1
    `;

    const params = [];

    if (operation) {
      query += ` AND al.operationPerformed = ?`;
      params.push(operation);
    }

    if (tableName) {
      query += ` AND al.targetTable = ?`;
      params.push(tableName);
    }

    if (startDate) {
      query += ` AND al.timeStamp >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND al.timeStamp <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY al.timeStamp DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const logs = await db.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM AuditLog WHERE 1=1`;
    const countParams = [];
    if (operation) {
      countQuery += ` AND operationPerformed = ?`;
      countParams.push(operation);
    }
    if (tableName) {
      countQuery += ` AND targetTable = ?`;
      countParams.push(tableName);
    }
    if (startDate) {
      countQuery += ` AND timeStamp >= ?`;
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ` AND timeStamp <= ?`;
      countParams.push(endDate);
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Get audit log error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve audit log",
      error: error.message,
    });
  }
});

// GET /api/admin/dashboard/security-events - Get security events
router.get("/security-events", async (req, res) => {
  try {
    const { severity, page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        se.*,
        u.username
      FROM SecurityEvents se
      LEFT JOIN User u ON se.userID = u.userID
      WHERE 1=1
    `;

    const params = [];

    if (severity) {
      query += ` AND se.severity = ?`;
      params.push(severity);
    }

    query += ` ORDER BY se.eventDate DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const events = await db.query(query, params);

    // Get severity distribution
    const severityStats = await db.query(`
      SELECT 
        severity,
        COUNT(*) as count
      FROM SecurityEvents
      GROUP BY severity
    `);

    res.json({
      success: true,
      events,
      severityStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get security events error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve security events",
      error: error.message,
    });
  }
});

// GET /api/admin/dashboard/notifications - Get admin notifications
router.get("/notifications", async (req, res) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT *
      FROM AdminNotifications
      WHERE 1=1
    `;

    const params = [];

    if (isRead !== undefined) {
      query += ` AND isRead = ?`;
      params.push(isRead === "true" ? 1 : 0);
    }

    query += ` ORDER BY createdDate DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const notifications = await db.query(query, params);

    // Get unread count
    const unreadCount = await db.query(`
      SELECT COUNT(*) as count
      FROM AdminNotifications
      WHERE isRead = 0
    `);

    res.json({
      success: true,
      notifications,
      unreadCount: unreadCount[0].count,
    });
  } catch (error) {
    console.error("Get admin notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve notifications",
      error: error.message,
    });
  }
});

// GET /api/admin/notifications/unread-count - Get unread notification count
router.get("/notifications/unread-count", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT COUNT(*) as count
      FROM AdminNotifications
      WHERE isRead = 0
    `);

    res.json({
      success: true,
      count: result[0].count,
    });
  } catch (error) {
    console.error("Get unread notification count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread notification count",
      error: error.message,
    });
  }
});

// PUT /api/admin/dashboard/notifications/:notificationID/read - Mark notification as read
router.put("/notifications/:notificationID/read", async (req, res) => {
  try {
    const { notificationID } = req.params;

    await db.query(
      `
      UPDATE AdminNotifications
      SET isRead = 1
      WHERE notificationID = ?
    `,
      [notificationID]
    );

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
});

// PUT /api/admin/dashboard/notifications/mark-all-read - Mark all notifications as read
router.put("/notifications/mark-all-read", async (req, res) => {
  try {
    await db.query(`
      UPDATE AdminNotifications
      SET isRead = 1
      WHERE isRead = 0
    `);

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
});

// GET /api/admin/dashboard/reports/user-activity - Get user activity report
router.get("/reports/user-activity", async (req, res) => {
  try {
    const { limit = 20, days = 0 } = req.query;

    const activeUsers = await db.query(`CALL sp_get_most_active_users(?, ?)`, [
      parseInt(limit),
      parseInt(days),
    ]);

    res.json({
      success: true,
      users: activeUsers[0],
    });
  } catch (error) {
    console.error("Get user activity report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user activity report",
      error: error.message,
    });
  }
});

// GET /api/admin/dashboard/reports/content-stats - Get content statistics
router.get("/reports/content-stats", async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM Post) as totalPosts,
        (SELECT COUNT(*) FROM ReviewRatings) as totalReviews,
        (SELECT COUNT(*) FROM Comments) as totalComments,
        (SELECT COUNT(*) FROM Post WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as postsLast24h,
        (SELECT COUNT(*) FROM ReviewRatings WHERE reviewDate >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as reviewsLast24h,
        (SELECT COUNT(*) FROM Comments WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as commentsLast24h
    `);

    res.json({
      success: true,
      stats: stats[0],
    });
  } catch (error) {
    console.error("Get content stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve content statistics",
      error: error.message,
    });
  }
});

module.exports = router;
