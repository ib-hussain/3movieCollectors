// 3movieCollectors - Main Server Application
// Authors: Ibrahim Hussain, Izhan Nasir, Saneed Khan

const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const db = require("./server/db");
const {
  errorHandler,
  notFoundHandler,
} = require("./server/middleware/errorHandler");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : true,
    credentials: true,
  })
);

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// Request logging (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ==================== STATIC FILES ====================

// Serve static files
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/pictures", express.static(path.join(__dirname, "pictures")));
app.use("/components", express.static(path.join(__dirname, "components")));

// Serve HTML files
app.use(express.static(path.join(__dirname, "html")));

// ==================== API ROUTES ====================

// Mount API routes
const apiRoutes = require("./server/routes/index");
app.use("/api", apiRoutes);

// Auth routes
const authRoutes = require("./server/routes/auth");
app.use("/api/auth", authRoutes);

// Dashboard routes
const dashboardRoutes = require("./server/routes/dashboard");
app.use("/api/dashboard", dashboardRoutes);

// Movies routes
const moviesRoutes = require("./server/routes/movies");
app.use("/api/movies", moviesRoutes);

// Watchlist routes
const watchlistRoutes = require("./server/routes/watchlist");
app.use("/api/watchlist", watchlistRoutes);

// Posts routes (movie discussions, likes, comments)
const postsRoutes = require("./server/routes/posts");
app.use("/api", postsRoutes);

// Future route imports (will be added as we implement features)
// const friendsRoutes = require('./server/routes/friends');
// const eventsRoutes = require('./server/routes/events');
// const messagesRoutes = require('./server/routes/messages');
// const notificationsRoutes = require('./server/routes/notifications');
// const profileRoutes = require('./server/routes/profile');
// const postsRoutes = require('./server/routes/posts');
// const adminRoutes = require('./server/routes/admin');

// app.use('/api/auth', authRoutes);
// app.use('/api/movies', moviesRoutes);
// app.use('/api/watchlist', watchlistRoutes);
// app.use('/api/friends', friendsRoutes);
// app.use('/api/events', eventsRoutes);
// app.use('/api/messages', messagesRoutes);
// app.use('/api/notifications', notificationsRoutes);
// app.use('/api/profile', profileRoutes);
// app.use('/api/posts', postsRoutes);
// app.use('/api/admin', adminRoutes);

// ==================== DEFAULT ROUTES ====================

// Root redirect to dashboard or login
app.get("/", (req, res) => {
  if (req.session && req.session.userId) {
    res.redirect("/dashboard.html");
  } else {
    res.redirect("/index.html");
  }
});

// ==================== ERROR HANDLING ====================

// 404 handler - must be after all other routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// ==================== SERVER START ====================

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await db.testConnection();

    if (!dbConnected) {
      console.error(
        "⚠ Warning: Database connection failed. Server starting anyway..."
      );
      console.error(
        "   Make sure MySQL is running and credentials are correct in .env file"
      );
    }

    // Start server
    app.listen(PORT, () => {
      console.log("");
      console.log("═══════════════════════════════════════════════════════");
      console.log("🎬  3movieCollectors Server");
      console.log("═══════════════════════════════════════════════════════");
      console.log(`   Server running on: http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `   Database: ${dbConnected ? "✓ Connected" : "✗ Not Connected"}`
      );
      console.log("═══════════════════════════════════════════════════════");
      console.log("");
      console.log("   Available endpoints:");
      console.log(`   - http://localhost:${PORT}/api/test`);
      console.log(`   - http://localhost:${PORT}/api/health`);
      console.log(`   - http://localhost:${PORT}/index.html`);
      console.log("");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
