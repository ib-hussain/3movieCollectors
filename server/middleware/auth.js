// Authentication middleware
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }
  next();
}

// Optional authentication (doesn't fail if not logged in)
function optionalAuth(req, res, next) {
  // Just sets req.userId if logged in, doesn't block
  req.userId = req.session?.userId || null;
  next();
}

// Admin check middleware
function requireAdmin(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!req.session.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin,
};
