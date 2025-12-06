// Global error handler middleware
function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Database errors
  if (err.code === "ER_DUP_ENTRY") {
    statusCode = 409;
    message = "Duplicate entry. This record already exists.";
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    statusCode = 400;
    message = "Invalid reference. Related record does not exist.";
  }

  // Validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

// 404 handler
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
