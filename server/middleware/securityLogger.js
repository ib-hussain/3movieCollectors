// Security Event Logging Middleware
// Integrates with MySQL stored procedures for security event tracking

const db = require("../db");

/**
 * Log failed login attempt
 */
async function logFailedLogin(username, ipAddress, userAgent, reason) {
  try {
    await db.query("CALL sp_log_failed_login(?, ?, ?, ?)", [
      username,
      ipAddress,
      userAgent,
      reason,
    ]);
  } catch (error) {
    console.error("Error logging failed login:", error);
  }
}

/**
 * Log unauthorized access attempt
 */
async function logUnauthorizedAccess(
  userID,
  username,
  ipAddress,
  userAgent,
  requestPath,
  requestMethod,
  attemptedAction
) {
  try {
    await db.query("CALL sp_log_unauthorized_access(?, ?, ?, ?, ?, ?, ?)", [
      userID,
      username,
      ipAddress,
      userAgent,
      requestPath,
      requestMethod,
      attemptedAction,
    ]);
  } catch (error) {
    console.error("Error logging unauthorized access:", error);
  }
}

/**
 * Log suspicious activity
 */
async function logSuspiciousActivity(
  userID,
  username,
  ipAddress,
  userAgent,
  requestPath,
  requestMethod,
  description,
  severity = "medium"
) {
  try {
    await db.query("CALL sp_log_suspicious_activity(?, ?, ?, ?, ?, ?, ?, ?)", [
      userID,
      username,
      ipAddress,
      userAgent,
      requestPath,
      requestMethod,
      description,
      severity,
    ]);
  } catch (error) {
    console.error("Error logging suspicious activity:", error);
  }
}

/**
 * Log SQL injection attempt
 */
async function logSQLInjection(
  userID,
  username,
  ipAddress,
  userAgent,
  requestPath,
  requestMethod,
  maliciousInput
) {
  try {
    await db.query("CALL sp_log_sql_injection(?, ?, ?, ?, ?, ?, ?)", [
      userID,
      username,
      ipAddress,
      userAgent,
      requestPath,
      requestMethod,
      maliciousInput,
    ]);
  } catch (error) {
    console.error("Error logging SQL injection attempt:", error);
  }
}

/**
 * Log XSS attempt
 */
async function logXSSAttempt(
  userID,
  username,
  ipAddress,
  userAgent,
  requestPath,
  requestMethod,
  maliciousInput
) {
  try {
    await db.query("CALL sp_log_xss_attempt(?, ?, ?, ?, ?, ?, ?)", [
      userID,
      username,
      ipAddress,
      userAgent,
      requestPath,
      requestMethod,
      maliciousInput,
    ]);
  } catch (error) {
    console.error("Error logging XSS attempt:", error);
  }
}

/**
 * Middleware to detect and log SQL injection attempts
 */
function detectSQLInjection(req, res, next) {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|DECLARE)\b)/i,
    /(--|\#|\/\*|\*\/)/,
    /('|"|;|\\|<|>|\||&)/,
    /(\bOR\b|\bAND\b).*?=.*?/i,
    /(1=1|1=0)/,
    /(\bSLEEP\b|\bBENCHMARK\b)/i,
  ];

  const checkValue = (value) => {
    if (typeof value === "string") {
      return sqlPatterns.some((pattern) => pattern.test(value));
    }
    return false;
  };

  // Check query params
  for (const [key, value] of Object.entries(req.query || {})) {
    if (checkValue(value)) {
      logSQLInjection(
        req.session?.userId || null,
        req.session?.username || "anonymous",
        req.ip,
        req.headers["user-agent"],
        req.path,
        req.method,
        `${key}=${value}`
      );
      return res.status(400).json({
        success: false,
        message: "Invalid input detected",
      });
    }
  }

  // Check body params
  for (const [key, value] of Object.entries(req.body || {})) {
    if (checkValue(value)) {
      logSQLInjection(
        req.session?.userId || null,
        req.session?.username || "anonymous",
        req.ip,
        req.headers["user-agent"],
        req.path,
        req.method,
        `${key}=${value}`
      );
      return res.status(400).json({
        success: false,
        message: "Invalid input detected",
      });
    }
  }

  next();
}

/**
 * Middleware to detect and log XSS attempts
 */
function detectXSS(req, res, next) {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\(/gi,
    /expression\(/gi,
  ];

  const checkValue = (value) => {
    if (typeof value === "string") {
      return xssPatterns.some((pattern) => pattern.test(value));
    }
    return false;
  };

  // Check body params (XSS typically in user-generated content)
  for (const [key, value] of Object.entries(req.body || {})) {
    if (checkValue(value)) {
      logXSSAttempt(
        req.session?.userId || null,
        req.session?.username || "anonymous",
        req.ip,
        req.headers["user-agent"],
        req.path,
        req.method,
        `${key}=${value.substring(0, 200)}`
      );
      return res.status(400).json({
        success: false,
        message: "Invalid content detected",
      });
    }
  }

  next();
}

/**
 * Middleware to check admin authorization and log unauthorized attempts
 */
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    logUnauthorizedAccess(
      null,
      "anonymous",
      req.ip,
      req.headers["user-agent"],
      req.path,
      req.method,
      "Attempted to access admin endpoint without authentication"
    );
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  // Check if user is admin (this should query the database)
  db.query("SELECT role FROM User WHERE userID = ?", [req.session.userId])
    .then((users) => {
      if (!users || users.length === 0 || users[0].role !== "admin") {
        logUnauthorizedAccess(
          req.session.userId,
          req.session.username || "unknown",
          req.ip,
          req.headers["user-agent"],
          req.path,
          req.method,
          "Non-admin user attempted to access admin endpoint"
        );
        return res.status(403).json({
          success: false,
          message: "Admin privileges required",
        });
      }
      next();
    })
    .catch((error) => {
      console.error("Error checking admin status:", error);
      res.status(500).json({
        success: false,
        message: "Authorization check failed",
      });
    });
}

module.exports = {
  logFailedLogin,
  logUnauthorizedAccess,
  logSuspiciousActivity,
  logSQLInjection,
  logXSSAttempt,
  detectSQLInjection,
  detectXSS,
  requireAdmin,
};
