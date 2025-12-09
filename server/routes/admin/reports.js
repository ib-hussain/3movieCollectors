// Admin Reports and Export Routes
const express = require("express");
const router = express.Router();
const db = require("../../db");
const {
  generateAuditLogPDF,
  generateUserActivityPDF,
  generateFlaggedContentPDF,
  generateSecurityEventsPDF,
} = require("../../utils/pdfExport");
const {
  generateAuditLogCSV,
  generateUserActivityCSV,
  generateFlaggedContentCSV,
  generateSecurityEventsCSV,
} = require("../../utils/csvExport");

// ==================== AUDIT LOG EXPORTS ====================

// GET /api/admin/reports/audit-log/pdf - Export audit log as PDF
router.get("/audit-log/pdf", async (req, res) => {
  try {
    const {
      operation,
      tableName,
      startDate,
      endDate,
      limit = 1000,
    } = req.query;

    let query = `
      SELECT 
        al.*,
        u.username
      FROM AuditLog al
      LEFT JOIN User u ON al.adminID = u.userID
      WHERE 1=1
    `;

    const params = [];
    const filters = {};

    if (operation) {
      query += ` AND al.operationPerformed = ?`;
      params.push(operation);
      filters.operation = operation;
    }

    if (tableName) {
      query += ` AND al.targetTable = ?`;
      params.push(tableName);
      filters.tableName = tableName;
    }

    if (startDate) {
      query += ` AND al.timeStamp >= ?`;
      params.push(startDate);
      filters.startDate = startDate;
    }

    if (endDate) {
      query += ` AND al.timeStamp <= ?`;
      params.push(endDate);
      filters.endDate = endDate;
    }

    query += ` ORDER BY al.timeStamp DESC LIMIT ?`;
    params.push(parseInt(limit));

    const auditLogs = await db.query(query, params);

    // Generate PDF
    const doc = generateAuditLogPDF(auditLogs, filters);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=audit-log-${Date.now()}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("Error generating audit log PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF report",
      error: error.message,
    });
  }
});

// GET /api/admin/reports/audit-log/csv - Export audit log as CSV
router.get("/audit-log/csv", async (req, res) => {
  try {
    const {
      operation,
      tableName,
      startDate,
      endDate,
      limit = 10000,
    } = req.query;

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

    query += ` ORDER BY al.timeStamp DESC LIMIT ?`;
    params.push(parseInt(limit));

    const auditLogs = await db.query(query, params);

    // Generate CSV
    const csv = generateAuditLogCSV(auditLogs);

    // Set response headers
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=audit-log-${Date.now()}.csv`
    );

    res.send(csv);
  } catch (error) {
    console.error("Error generating audit log CSV:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate CSV report",
      error: error.message,
    });
  }
});

// ==================== USER ACTIVITY EXPORTS ====================

// GET /api/admin/reports/user-activity/pdf - Export user activity as PDF
router.get("/user-activity/pdf", async (req, res) => {
  try {
    const users = await db.query(`
      SELECT 
        u.userID,
        u.username,
        u.email,
        u.registrationDate,
        COUNT(DISTINCT p.postID) as postCount,
        COUNT(DISTINCT r.movieID) as reviewCount,
        COUNT(DISTINCT c.commentID) as commentCount,
        fn_user_activity_score(u.userID) as activityScore,
        (SELECT COUNT(*) FROM UserViolations WHERE userID = u.userID) as violationCount
      FROM User u
      LEFT JOIN Post p ON u.userID = p.userID
      LEFT JOIN ReviewRatings r ON u.userID = r.userID
      LEFT JOIN Comments c ON u.userID = c.userID
      WHERE u.role = 'user'
      GROUP BY u.userID
      ORDER BY activityScore DESC
      LIMIT 100
    `);

    const doc = generateUserActivityPDF(users);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=user-activity-${Date.now()}.pdf`
    );

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("Error generating user activity PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF report",
      error: error.message,
    });
  }
});

// GET /api/admin/reports/user-activity/csv - Export user activity as CSV
router.get("/user-activity/csv", async (req, res) => {
  try {
    const users = await db.query(`
      SELECT 
        u.userID,
        u.username,
        u.email,
        u.registrationDate,
        COUNT(DISTINCT p.postID) as postCount,
        COUNT(DISTINCT r.movieID) as reviewCount,
        COUNT(DISTINCT c.commentID) as commentCount,
        fn_user_activity_score(u.userID) as activityScore,
        (SELECT COUNT(*) FROM UserViolations WHERE userID = u.userID) as violationCount
      FROM User u
      LEFT JOIN Post p ON u.userID = p.userID
      LEFT JOIN ReviewRatings r ON u.userID = r.userID
      LEFT JOIN Comments c ON u.userID = c.userID
      WHERE u.role = 'user'
      GROUP BY u.userID
      ORDER BY activityScore DESC
      LIMIT 1000
    `);

    const csv = generateUserActivityCSV(users);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=user-activity-${Date.now()}.csv`
    );

    res.send(csv);
  } catch (error) {
    console.error("Error generating user activity CSV:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate CSV report",
      error: error.message,
    });
  }
});

// ==================== FLAGGED CONTENT EXPORTS ====================

// GET /api/admin/reports/flagged-content/pdf - Export flagged content as PDF
router.get("/flagged-content/pdf", async (req, res) => {
  try {
    const { status = "pending" } = req.query;

    let query = `
      SELECT 
        fc.*,
        flagger.username as flaggerUsername,
        CASE 
          WHEN fc.contentType = 'post' THEN (SELECT postContent FROM Post WHERE postID = fc.contentID)
          WHEN fc.contentType = 'review' THEN (SELECT review FROM ReviewRatings WHERE movieID = fc.contentID LIMIT 1)
          WHEN fc.contentType = 'comment' THEN (SELECT commentContent FROM Comments WHERE commentID = fc.contentID)
          ELSE NULL
        END as contentPreview
      FROM FlaggedContent fc
      LEFT JOIN User flagger ON fc.flaggedBy = flagger.userID
      WHERE 1=1
    `;

    const params = [];

    if (status !== "all") {
      query += ` AND fc.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY fc.flaggedDate DESC LIMIT 500`;

    const flags = await db.query(query, params);

    const doc = generateFlaggedContentPDF(flags);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=flagged-content-${Date.now()}.pdf`
    );

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("Error generating flagged content PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF report",
      error: error.message,
    });
  }
});

// GET /api/admin/reports/flagged-content/csv - Export flagged content as CSV
router.get("/flagged-content/csv", async (req, res) => {
  try {
    const { status = "pending" } = req.query;

    let query = `
      SELECT 
        fc.*,
        flagger.username as flaggerUsername,
        CASE 
          WHEN fc.contentType = 'post' THEN (SELECT postContent FROM Post WHERE postID = fc.contentID)
          WHEN fc.contentType = 'review' THEN (SELECT review FROM ReviewRatings WHERE movieID = fc.contentID LIMIT 1)
          WHEN fc.contentType = 'comment' THEN (SELECT commentContent FROM Comments WHERE commentID = fc.contentID)
          ELSE NULL
        END as contentPreview
      FROM FlaggedContent fc
      LEFT JOIN User flagger ON fc.flaggedBy = flagger.userID
      WHERE 1=1
    `;

    const params = [];

    if (status !== "all") {
      query += ` AND fc.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY fc.flaggedDate DESC LIMIT 5000`;

    const flags = await db.query(query, params);

    const csv = generateFlaggedContentCSV(flags);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=flagged-content-${Date.now()}.csv`
    );

    res.send(csv);
  } catch (error) {
    console.error("Error generating flagged content CSV:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate CSV report",
      error: error.message,
    });
  }
});

// ==================== SECURITY EVENTS EXPORTS ====================

// GET /api/admin/reports/security-events/pdf - Export security events as PDF
router.get("/security-events/pdf", async (req, res) => {
  try {
    const { eventType, startDate, endDate } = req.query;

    let query = `
      SELECT 
        se.*,
        u.username
      FROM SecurityEvents se
      LEFT JOIN User u ON se.userID = u.userID
      WHERE 1=1
    `;

    const params = [];

    if (eventType) {
      query += ` AND se.eventType = ?`;
      params.push(eventType);
    }

    if (startDate) {
      query += ` AND se.eventDate >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND se.eventDate <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY se.eventDate DESC LIMIT 500`;

    const events = await db.query(query, params);

    const doc = generateSecurityEventsPDF(events);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=security-events-${Date.now()}.pdf`
    );

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("Error generating security events PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF report",
      error: error.message,
    });
  }
});

// GET /api/admin/reports/security-events/csv - Export security events as CSV
router.get("/security-events/csv", async (req, res) => {
  try {
    const { eventType, startDate, endDate } = req.query;

    let query = `
      SELECT 
        se.*,
        u.username
      FROM SecurityEvents se
      LEFT JOIN User u ON se.userID = u.userID
      WHERE 1=1
    `;

    const params = [];

    if (eventType) {
      query += ` AND se.eventType = ?`;
      params.push(eventType);
    }

    if (startDate) {
      query += ` AND se.eventDate >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND se.eventDate <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY se.eventDate DESC LIMIT 5000`;

    const events = await db.query(query, params);

    const csv = generateSecurityEventsCSV(events);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=security-events-${Date.now()}.csv`
    );

    res.send(csv);
  } catch (error) {
    console.error("Error generating security events CSV:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate CSV report",
      error: error.message,
    });
  }
});

module.exports = router;
