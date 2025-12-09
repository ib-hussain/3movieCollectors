// Admin User Management Routes
const express = require("express");
const router = express.Router();
const db = require("../../db");

// ==================== USER MANAGEMENT ====================

// GET /api/admin/users - Get all users with filters
router.get("/", async (req, res) => {
  try {
    const {
      role, // user, admin
      status, // active, suspended
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        userID,
        username,
        name,
        email,
        registrationDate,
        role,
        isSuspended,
        suspendedDate,
        (SELECT COUNT(*) FROM Post WHERE userID = User.userID) as postCount,
        (SELECT COUNT(*) FROM ReviewRatings WHERE userID = User.userID) as reviewCount,
        (SELECT COUNT(*) FROM UserViolations WHERE userID = User.userID) as violationCount
      FROM User
      WHERE isDeleted = 0
    `;

    const params = [];

    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }

    if (status === "active") {
      query += ` AND isSuspended = 0`;
    } else if (status === "suspended") {
      query += ` AND isSuspended = 1`;
    }

    if (search) {
      query += ` AND (username LIKE ? OR email LIKE ? OR name LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY registrationDate DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const users = await db.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM User WHERE isDeleted = 0`;
    const countParams = [];
    if (role) {
      countQuery += ` AND role = ?`;
      countParams.push(role);
    }
    if (status === "active") {
      countQuery += ` AND isSuspended = 0`;
    } else if (status === "suspended") {
      countQuery += ` AND isSuspended = 1`;
    }
    if (search) {
      countQuery += ` AND (username LIKE ? OR email LIKE ? OR name LIKE ?)`;
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      users,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult[0].total / limit),
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
      error: error.message,
    });
  }
});

// GET /api/admin/users/:userID - Get user details
router.get("/:userID", async (req, res) => {
  try {
    const { userID } = req.params;

    const users = await db.query(
      `
      SELECT 
        userID,
        username,
        name,
        email,
        registrationDate,
        role,
        isSuspended,
        suspendedDate
      FROM User
      WHERE userID = ?
    `,
      [userID]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user activity stats
    const activityStats = await db.query(
      `
      SELECT 
        (SELECT COUNT(*) FROM Post WHERE userID = ?) as postCount,
        (SELECT COUNT(*) FROM ReviewRatings WHERE userID = ?) as reviewCount,
        (SELECT COUNT(*) FROM Comments WHERE userID = ?) as commentCount,
        (SELECT COUNT(*) FROM WatchList WHERE userID = ?) as watchlistCount,
        (SELECT COUNT(*) FROM Friends WHERE user1 = ? OR user2 = ?) as friendCount
    `,
      [userID, userID, userID, userID, userID, userID]
    );

    // Get user violations
    const violations = await db.query(
      `
      SELECT * FROM UserViolations
      WHERE userID = ?
      ORDER BY violationDate DESC
      LIMIT 10
    `,
      [userID]
    );

    res.json({
      success: true,
      user: users[0],
      activity: activityStats[0],
      violations,
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user details",
      error: error.message,
    });
  }
});

// PUT /api/admin/users/:userID/suspend - Suspend a user
router.put("/:userID/suspend", async (req, res) => {
  try {
    const { userID } = req.params;
    const { reason } = req.body;
    const adminID = req.session.userId;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Suspension reason is required",
      });
    }

    if (!adminID) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - no admin session",
      });
    }

    // Prevent self-suspension
    if (parseInt(userID) === adminID) {
      return res.status(400).json({
        success: false,
        message: "Cannot suspend yourself",
      });
    }

    // Suspend user
    await db.query(
      `
      UPDATE User 
      SET isSuspended = 1, 
          suspendedDate = NOW(),
          suspensionReason = ?,
          suspendedBy = ?
      WHERE userID = ?
    `,
      [reason, adminID, userID]
    );

    // Log action in AuditLog
    await db.query(
      `
      INSERT INTO AuditLog (
        adminID, 
        operationPerformed, 
        targetTable, 
        targetRecordID, 
        actionDetails,
        ipAddress
      ) VALUES (?, 'MANAGEMENT', 'User', ?, ?, ?)
    `,
      [
        adminID,
        userID,
        `Suspended: ${reason}`,
        req.ip || req.connection.remoteAddress,
      ]
    );

    res.json({
      success: true,
      message: "User suspended successfully",
    });
  } catch (error) {
    console.error("Suspend user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to suspend user",
      error: error.message,
    });
  }
});

// PUT /api/admin/users/:userID/unsuspend - Unsuspend a user
router.put("/:userID/unsuspend", async (req, res) => {
  try {
    const { userID } = req.params;
    const adminID = req.session.userId;

    // Unsuspend user
    await db.query(
      `
      UPDATE User 
      SET isSuspended = 0, 
          suspendedDate = NULL,
          suspensionReason = NULL,
          suspendedBy = NULL
      WHERE userID = ?
    `,
      [userID]
    );

    // Log action in AuditLog
    await db.query(
      `
      INSERT INTO AuditLog (
        adminID, 
        operationPerformed, 
        targetTable, 
        targetRecordID, 
        actionDetails,
        ipAddress
      ) VALUES (?, 'MANAGEMENT', 'User', ?, 'User unsuspended by admin', ?)
    `,
      [adminID, userID, req.ip || req.connection.remoteAddress]
    );

    res.json({
      success: true,
      message: "User unsuspended successfully",
    });
  } catch (error) {
    console.error("Unsuspend user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unsuspend user",
      error: error.message,
    });
  }
});

// GET /api/admin/users/:userID/violations - Get user violations
router.get("/:userID/violations", async (req, res) => {
  try {
    const { userID } = req.params;

    const violations = await db.query(
      `
      SELECT 
        v.*,
        fc.contentType,
        fc.flagReason
      FROM UserViolations v
      LEFT JOIN FlaggedContent fc ON v.relatedFlagID = fc.flagID
      WHERE v.userID = ?
      ORDER BY v.violationDate DESC
    `,
      [userID]
    );

    res.json({
      success: true,
      violations,
    });
  } catch (error) {
    console.error("Get user violations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve violations",
      error: error.message,
    });
  }
});

// GET /api/admin/users/repeat-offenders - Get repeat offenders view
router.get("/views/repeat-offenders", async (req, res) => {
  try {
    const offenders = await db.query(`
      SELECT * FROM v_repeat_offenders
      ORDER BY violationCount DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      offenders,
    });
  } catch (error) {
    console.error("Get repeat offenders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve repeat offenders",
      error: error.message,
    });
  }
});

// PUT /api/admin/users/:userID/role - Update user role
router.put("/:userID/role", async (req, res) => {
  try {
    const { userID } = req.params;
    const { role } = req.body; // user or admin
    const adminID = req.session.userId;

    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Valid role (user or admin) is required",
      });
    }

    // Prevent self-demotion
    if (parseInt(userID) === adminID && role === "user") {
      return res.status(400).json({
        success: false,
        message: "Cannot demote yourself from admin",
      });
    }

    // Update user role
    await db.query(
      `
      UPDATE User 
      SET role = ?
      WHERE userID = ?
    `,
      [role, userID]
    );

    // Log action in AuditLog
    await db.query(
      `
      INSERT INTO AuditLog (
        adminID, 
        operationPerformed, 
        targetTable, 
        targetRecordID, 
        actionDetails,
        ipAddress
      ) VALUES (?, 'MANAGEMENT', 'User', ?, ?, ?)
    `,
      [
        adminID,
        userID,
        `Role changed to ${role}`,
        req.ip || req.connection.remoteAddress,
      ]
    );

    res.json({
      success: true,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message,
    });
  }
});

module.exports = router;
