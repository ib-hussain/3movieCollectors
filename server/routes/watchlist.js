const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * GET /api/watchlist
 * Get all movies in the current user's watchlist
 */
router.get("/", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view your watchlist",
      });
    }

    const query = `
      SELECT m.movieID, m.title, m.posterImg, m.releaseYear, m.avgRating,
             w.status, w.addedDate,
             GROUP_CONCAT(DISTINCT g.genreName SEPARATOR ', ') as genres
      FROM WatchList w
      JOIN Movie m ON w.movieID = m.movieID
      LEFT JOIN MovieGenres mg ON m.movieID = mg.movieID
      LEFT JOIN Genres g ON mg.genreID = g.genreID
      WHERE w.userID = ?
      GROUP BY m.movieID, m.title, m.posterImg, m.releaseYear, m.avgRating, w.status, w.addedDate
      ORDER BY w.addedDate DESC
    `;

    const movies = await db.query(query, [req.session.userId]);

    const formattedMovies = movies.map((m) => ({
      movieId: m.movieID,
      title: m.title,
      posterPath: m.posterImg ? `/pictures/${m.posterImg}` : null,
      releaseYear: m.releaseYear,
      genres: m.genres,
      avgRating: m.avgRating ? parseFloat(m.avgRating).toFixed(1) : "0.0",
      status: m.status,
      addedDate: m.addedDate,
    }));

    res.json({
      success: true,
      movies: formattedMovies,
    });
  } catch (error) {
    console.error("Watchlist fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load watchlist",
    });
  }
});

/**
 * GET /api/watchlist/:movieId
 * Check if a movie is in the user's watchlist
 */
router.get("/:movieId", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({
        success: true,
        inWatchlist: false,
      });
    }

    const movieId = parseInt(req.params.movieId);

    const result = await db.query(
      "SELECT status FROM WatchList WHERE movieID = ? AND userID = ?",
      [movieId, req.session.userId]
    );

    res.json({
      success: true,
      inWatchlist: result.length > 0,
      status: result.length > 0 ? result[0].status : null,
    });
  } catch (error) {
    console.error("Watchlist check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check watchlist status",
    });
  }
});

/**
 * POST /api/watchlist
 * Add a movie to the user's watchlist
 */
router.post("/", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to add to watchlist",
      });
    }

    const { movieId, status = "added" } = req.body;

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: "Movie ID is required",
      });
    }

    // Check if movie exists
    const movieCheck = await db.query(
      "SELECT movieID FROM Movie WHERE movieID = ?",
      [movieId]
    );

    if (movieCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    // Check if already in watchlist
    const existingEntry = await db.query(
      "SELECT status FROM WatchList WHERE movieID = ? AND userID = ?",
      [movieId, req.session.userId]
    );

    if (existingEntry.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Movie is already in your watchlist",
      });
    }

    // Add to watchlist
    await db.query(
      "INSERT INTO WatchList (movieID, userID, status, addedDate) VALUES (?, ?, ?, NOW())",
      [movieId, req.session.userId, status]
    );

    res.json({
      success: true,
      message: "Movie added to watchlist",
    });
  } catch (error) {
    console.error("Add to watchlist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add movie to watchlist",
    });
  }
});

/**
 * PATCH /api/watchlist/:movieId
 * Update the status of a movie in the watchlist
 */
router.patch("/:movieId", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in",
      });
    }

    const movieId = parseInt(req.params.movieId);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses = ["added", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'added' or 'completed'",
      });
    }

    // Update status
    await db.query(
      "UPDATE WatchList SET status = ?, lastUpdated = NOW() WHERE movieID = ? AND userID = ?",
      [status, movieId, req.session.userId]
    );

    res.json({
      success: true,
      message: "Watchlist status updated",
    });
  } catch (error) {
    console.error("Update watchlist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update watchlist",
    });
  }
});

/**
 * DELETE /api/watchlist/:movieId
 * Remove a movie from the user's watchlist
 */
router.delete("/:movieId", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in",
      });
    }

    const movieId = parseInt(req.params.movieId);

    await db.query("DELETE FROM WatchList WHERE movieID = ? AND userID = ?", [
      movieId,
      req.session.userId,
    ]);

    res.json({
      success: true,
      message: "Movie removed from watchlist",
    });
  } catch (error) {
    console.error("Remove from watchlist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove movie from watchlist",
    });
  }
});

module.exports = router;
