const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const db = require("../db");

// Validation middleware
const signupValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be 3-50 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be 2-100 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// ============================================================
// POST /api/auth/signup - Register new user
// ============================================================
router.post("/signup", signupValidation, async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { username, name, email, password } = req.body;

    // Check if username already exists
    const existingUsername = await db.query(
      "SELECT userID FROM User WHERE username = ?",
      [username]
    );

    if (existingUsername.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username already taken",
      });
    }

    // Check if email already exists
    const existingEmail = await db.query(
      "SELECT userID FROM User WHERE email = ?",
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await db.query(
      `INSERT INTO User (username, name, email, password, role)
             VALUES (?, ?, ?, ?, 'user')`,
      [username, name, email, hashedPassword]
    );

    const userID = result.insertId;

    // Create session
    req.session.userId = userID;
    req.session.username = username;
    req.session.email = email;
    req.session.isAdmin = false;

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        userID,
        username,
        name,
        email,
        role: "user",
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// POST /api/auth/login - User login
// ============================================================
router.post("/login", loginValidation, async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const users = await db.query(
      "SELECT userID, username, name, email, password, role FROM User WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Create session
    req.session.userId = user.userID;
    req.session.username = user.username;
    req.session.email = user.email;
    req.session.isAdmin = user.role === "admin";

    res.json({
      success: true,
      message: "Login successful",
      user: {
        userID: user.userID,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// POST /api/auth/logout - User logout
// ============================================================
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }

    res.clearCookie("connect.sid");
    res.json({
      success: true,
      message: "Logout successful",
    });
  });
});

// ============================================================
// GET /api/auth/me - Get current user
// ============================================================
router.get("/me", async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Fetch user details
    const users = await db.query(
      "SELECT userID, username, name, email, role, registrationDate FROM User WHERE userID = ?",
      [req.session.userId]
    );

    if (users.length === 0) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    res.json({
      success: true,
      user: {
        userID: user.userID,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        registrationDate: user.registrationDate,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET /api/auth/check - Quick auth check (no user details)
// ============================================================
router.get("/check", (req, res) => {
  res.json({
    success: true,
    authenticated: !!(req.session && req.session.userId),
  });
});

module.exports = router;
