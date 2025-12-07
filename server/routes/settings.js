// server/routes/settings.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../db");

// Middleware to require authentication
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
};

// GET /api/settings - Get user settings/account info
router.get("/settings", requireAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const users = await db.query(
      `SELECT userID, username, name, email, profilePicture, registrationDate, role
       FROM User 
       WHERE userID = ? AND isDeleted = FALSE`,
      [userId]
    );

    if (!users || users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const user = users[0];

    res.json({
      success: true,
      user: {
        userID: user.userID,
        username: user.username,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        registrationDate: user.registrationDate,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load settings" });
  }
});

// PATCH /api/settings/account - Update account information
router.patch("/settings/account", requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const { name, email, username, profilePicture } = req.body;

  try {
    // Validate input
    if (!name || !email || !username) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and username are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    // Validate username format (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        message:
          "Username must be 3-20 characters (letters, numbers, underscores only)",
      });
    }

    // Update user - triggers will validate uniqueness
    try {
      await db.query(
        `UPDATE User 
         SET name = ?, email = ?, username = ?, profilePicture = ?
         WHERE userID = ? AND isDeleted = FALSE`,
        [name, email, username, profilePicture || null, userId]
      );

      // Get updated user data
      const [users] = await db.query(
        `SELECT userID, username, name, email, profilePicture, registrationDate, role
         FROM User 
         WHERE userID = ? AND isDeleted = FALSE`,
        [userId]
      );

      res.json({
        success: true,
        message: "Account updated successfully",
        user: users[0],
      });
    } catch (dbError) {
      // Check if error is from our trigger
      if (
        dbError.message.includes("Email already exists") ||
        dbError.message.includes("Username already exists")
      ) {
        return res.status(400).json({
          success: false,
          message: dbError.message,
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Error updating account:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update account" });
  }
});

// PATCH /api/settings/password - Change password
router.patch("/settings/password", requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  try {
    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    // Validate password strength (at least 8 chars, uppercase, lowercase, number)
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one uppercase letter",
      });
    }

    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one lowercase letter",
      });
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one number",
      });
    }

    // Get current password from database
    const users = await db.query(
      "SELECT password FROM User WHERE userID = ? AND isDeleted = FALSE",
      [userId]
    );

    if (!users || users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query("UPDATE User SET password = ? WHERE userID = ?", [
      hashedPassword,
      userId,
    ]);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to change password" });
  }
});

// DELETE /api/settings/account - Soft delete account
router.delete("/settings/account", requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const { password } = req.body;

  try {
    // Validate password is provided
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to delete account",
      });
    }

    // Get current password from database
    const users = await db.query(
      "SELECT password, isDeleted FROM User WHERE userID = ?",
      [userId]
    );

    if (!users || users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if already deleted
    if (users[0].isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Account is already deleted",
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, users[0].password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // Perform soft delete
    await db.query("UPDATE User SET isDeleted = TRUE WHERE userID = ?", [
      userId,
    ]);

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
    });

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete account" });
  }
});

module.exports = router;
