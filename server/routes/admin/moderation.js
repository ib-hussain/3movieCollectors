// Admin Content Moderation Routes
const express = require("express");
const router = express.Router();
const db = require("../../db");

// ==================== FLAGGED CONTENT MANAGEMENT ====================

// GET /api/admin/moderation/flags - Get all flagged content with filters
router.get("/flags", async (req, res) => {
  try {
    const {
      status = "pending", // pending, dismissed, deleted
      contentType, // post, review, comment
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        fc.flagID,
        fc.contentType,
        fc.contentID,
        fc.flagReason,
        fc.flaggedDate,
        fc.status,
        fc.isHidden,
        fc.matchedWord,
        u.userID,
        u.username
      FROM FlaggedContent fc
      LEFT JOIN User u ON u.userID = fc.flaggedBy
      WHERE fc.status = ?
    `;

    const params = [status];

    if (contentType) {
      query += ` AND fc.contentType = ?`;
      params.push(contentType);
    }

    query += ` ORDER BY fc.flaggedDate DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const flags = await db.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM FlaggedContent WHERE status = ?`;
    const countParams = [status];
    if (contentType) {
      countQuery += ` AND contentType = ?`;
      countParams.push(contentType);
    }
    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      flags,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Get flagged content error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve flagged content",
      error: error.message,
    });
  }
});

// GET /api/admin/moderation/flags/:flagID - Get single flag details
router.get("/flags/:flagID", async (req, res) => {
  try {
    const { flagID } = req.params;

    const flags = await db.query(
      `
      SELECT 
        fc.*,
        u.userID,
        u.username,
        u.email
      FROM FlaggedContent fc
      LEFT JOIN User u ON u.userID = fc.flaggedBy
      WHERE fc.flagID = ?
    `,
      [flagID]
    );

    if (flags.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Flag not found",
      });
    }

    res.json({
      success: true,
      flag: flags[0],
    });
  } catch (error) {
    console.error("Get flag details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve flag details",
      error: error.message,
    });
  }
});

// PUT /api/admin/moderation/flags/:flagID/dismiss - Dismiss a flag
router.put("/flags/:flagID/dismiss", async (req, res) => {
  try {
    const { flagID } = req.params;
    const { reason } = req.body;
    const adminID = req.session.userId;

    // Set admin context for triggers/procedures
    await db.query(
      `
      SET @current_admin_id = ?;
      SET @current_ip_address = ?;
      SET @current_user_agent = ?;
    `,
      [
        adminID,
        req.ip || req.connection.remoteAddress,
        req.get("user-agent") || "Unknown",
      ]
    );

    // Call stored procedure to dismiss flag
    await db.query(`CALL sp_dismiss_flag(?, ?, ?)`, [
      flagID,
      adminID,
      reason || "Dismissed by admin",
    ]);

    res.json({
      success: true,
      message: "Flag dismissed successfully",
    });
  } catch (error) {
    console.error("Dismiss flag error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to dismiss flag",
      error: error.message,
    });
  }
});

// DELETE /api/admin/moderation/flags/:flagID/content - Delete flagged content
router.delete("/flags/:flagID/content", async (req, res) => {
  try {
    const { flagID } = req.params;
    const { reason } = req.body;
    const adminID = req.session.userId;

    // Set admin context for triggers/procedures
    await db.query(
      `
      SET @current_admin_id = ?;
      SET @current_ip_address = ?;
      SET @current_user_agent = ?;
    `,
      [
        adminID,
        req.ip || req.connection.remoteAddress,
        req.get("user-agent") || "Unknown",
      ]
    );

    // Call stored procedure to delete flagged content
    await db.query(`CALL sp_delete_flagged_content(?, ?, ?)`, [
      flagID,
      adminID,
      reason || "Content violation",
    ]);

    res.json({
      success: true,
      message: "Content deleted successfully",
    });
  } catch (error) {
    console.error("Delete flagged content error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete content",
      error: error.message,
    });
  }
});

// POST /api/admin/moderation/rescan - Rescan content for restricted word
router.post("/rescan", async (req, res) => {
  try {
    const { word } = req.body;
    const adminID = req.session.userId;

    if (!word) {
      return res.status(400).json({
        success: false,
        message: "Restricted word is required",
      });
    }

    // Set admin context
    await db.query(
      `
      SET @current_admin_id = ?;
      SET @current_ip_address = ?;
      SET @current_user_agent = ?;
    `,
      [
        adminID,
        req.ip || req.connection.remoteAddress,
        req.get("user-agent") || "Unknown",
      ]
    );

    // Call stored procedure to rescan content
    const result = await db.query(`CALL sp_rescan_content_for_word(?, ?)`, [
      word,
      adminID,
    ]);

    res.json({
      success: true,
      message: `Rescan completed for word: ${word}`,
      result: result[0],
    });
  } catch (error) {
    console.error("Rescan content error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to rescan content",
      error: error.message,
    });
  }
});

// GET /api/admin/moderation/stats - Get moderation statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as totalFlags,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingFlags,
        SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissedFlags,
        SUM(CASE WHEN status = 'deleted' THEN 1 ELSE 0 END) as deletedFlags,
        SUM(CASE WHEN isHidden = 1 THEN 1 ELSE 0 END) as hiddenContent
      FROM FlaggedContent
    `);

    const recentActivity = await db.query(
      `
      SELECT 
        flagID,
        contentType,
        flagReason,
        flaggedDate,
        status
      FROM FlaggedContent
      ORDER BY flaggedDate DESC
      LIMIT 10
    `
    );

    res.json({
      success: true,
      stats: stats[0],
      recentActivity,
    });
  } catch (error) {
    console.error("Get moderation stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve statistics",
      error: error.message,
    });
  }
});

module.exports = router;
