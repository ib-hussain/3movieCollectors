// Admin Movie Management Routes
const express = require("express");
const router = express.Router();
const db = require("../../db");

// ==================== MOVIE MANAGEMENT ====================

// POST /api/admin/movies/bulk-add - Bulk add movies
router.post("/bulk-add", async (req, res) => {
  try {
    const { movies } = req.body; // Array of movie objects
    const adminID = req.session.userId;

    if (!movies || !Array.isArray(movies) || movies.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Movies array is required",
      });
    }

    // Validate movie format
    for (const movie of movies) {
      if (!movie.title || !movie.releaseYear) {
        return res.status(400).json({
          success: false,
          message: "Each movie must have title and releaseYear",
        });
      }
    }

    // Prepare movie data as JSON
    const moviesJSON = JSON.stringify(movies);

    // Call stored procedure to bulk add movies
    await db.query(`CALL sp_bulk_add_movies(?, ?, ?, ?)`, [
      adminID,
      moviesJSON,
      req.ip || req.connection.remoteAddress || "0.0.0.0",
      req.get("user-agent") || "Unknown",
    ]);

    res.json({
      success: true,
      message: `${movies.length} movies added successfully`,
      count: movies.length,
    });
  } catch (error) {
    console.error("Bulk add movies error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add movies",
      error: error.message,
    });
  }
});

// DELETE /api/admin/movies/:movieID - Delete a movie
router.delete("/:movieID", async (req, res) => {
  try {
    const { movieID } = req.params;
    const adminID = req.session.userId;

    // Check if movie exists
    const movies = await db.query(`SELECT title FROM Movie WHERE movieID = ?`, [
      movieID,
    ]);

    if (movies.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    // Delete movie (will cascade to related data)
    await db.query(`DELETE FROM Movie WHERE movieID = ?`, [movieID]);

    res.json({
      success: true,
      message: `Movie "${movies[0].title}" deleted successfully`,
    });
  } catch (error) {
    console.error("Delete movie error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete movie",
      error: error.message,
    });
  }
});

// PUT /api/admin/movies/:movieID - Update movie details
router.put("/:movieID", async (req, res) => {
  try {
    const { movieID } = req.params;
    const { title, synopsis, director, releaseYear, posterImg } = req.body;
    const adminID = req.session.userId;

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push("title = ?");
      params.push(title);
    }
    if (synopsis !== undefined) {
      updates.push("synopsis = ?");
      params.push(synopsis);
    }
    if (director !== undefined) {
      updates.push("director = ?");
      params.push(director);
    }
    if (releaseYear !== undefined) {
      updates.push("releaseYear = ?");
      params.push(releaseYear);
    }
    if (posterImg !== undefined) {
      updates.push("posterImg = ?");
      params.push(posterImg);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    params.push(movieID);

    await db.query(
      `UPDATE Movie SET ${updates.join(", ")} WHERE movieID = ?`,
      params
    );

    res.json({
      success: true,
      message: "Movie updated successfully",
    });
  } catch (error) {
    console.error("Update movie error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update movie",
      error: error.message,
    });
  }
});

// GET /api/admin/movies/stats - Get movie statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as totalMovies,
        COUNT(DISTINCT director) as totalDirectors,
        MIN(releaseYear) as oldestYear,
        MAX(releaseYear) as newestYear,
        AVG(avgRating) as averageRating,
        SUM(viewCount) as totalViews
      FROM Movie
    `);

    const topMovies = await db.query(`
      SELECT movieID, title, director, avgRating, viewCount
      FROM Movie
      ORDER BY avgRating DESC, viewCount DESC
      LIMIT 10
    `);

    const recentlyAdded = await db.query(`
      SELECT al.targetRecordID as movieID, al.actionDetails, al.timeStamp
      FROM AuditLog al
      WHERE al.targetTable = 'Movie' 
      AND al.operationPerformed = 'INSERT'
      ORDER BY al.timeStamp DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      stats: stats[0],
      topMovies,
      recentlyAdded,
    });
  } catch (error) {
    console.error("Get movie stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve movie statistics",
      error: error.message,
    });
  }
});

// GET /api/admin/movies/most-watched - Get most watched movies
router.get("/most-watched", async (req, res) => {
  try {
    const { limit = 20, days = 0 } = req.query;

    const movies = await db.query(`CALL sp_get_top_watched_movies(?, ?)`, [
      parseInt(limit),
      parseInt(days),
    ]);

    res.json({
      success: true,
      movies: movies[0],
    });
  } catch (error) {
    console.error("Get most watched movies error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve most watched movies",
      error: error.message,
    });
  }
});

// GET /api/admin/movies/highest-rated - Get highest rated movies
router.get("/highest-rated", async (req, res) => {
  try {
    const { limit = 20, minRatings = 5 } = req.query;

    const movies = await db.query(`CALL sp_get_highest_rated_movies(?, ?)`, [
      parseInt(limit),
      parseInt(minRatings),
    ]);

    res.json({
      success: true,
      movies: movies[0],
    });
  } catch (error) {
    console.error("Get highest rated movies error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve highest rated movies",
      error: error.message,
    });
  }
});

module.exports = router;
