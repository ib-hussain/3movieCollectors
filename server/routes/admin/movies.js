// Admin Movie Management Routes
const express = require("express");
const router = express.Router();
const db = require("../../db");
const { importMoviesFromTMDB } = require("../../utils/tmdb-importer");

// ==================== MOVIE MANAGEMENT ====================

// GET /api/admin/movies/genres - Get all genres (must be before /:movieID route)
router.get("/genres", async (req, res) => {
  try {
    const genres = await db.query(`
      SELECT genreID, genreName 
      FROM genres 
      ORDER BY genreName ASC
    `);

    res.json({
      success: true,
      genres,
    });
  } catch (error) {
    console.error("Get genres error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve genres",
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
        COALESCE(SUM(viewCount), 0) as totalViews
      FROM movie
    `);

    const recentReviews = await db.query(`
      SELECT COUNT(*) as recentReviews
      FROM reviewratings
      WHERE reviewDate >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    res.json({
      success: true,
      totalMovies: stats[0].totalMovies || 0,
      totalViews: stats[0].totalViews || 0,
      recentReviews: recentReviews[0].recentReviews || 0,
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

// POST /api/admin/movies/bulk-add - Bulk add movies
// POST /api/admin/movies/bulk-add - Bulk add movies from TMDB
router.post("/bulk-add", async (req, res) => {
  try {
    const { numMovies } = req.body;
    const adminID = req.session.userId;

    if (!numMovies || numMovies < 1 || numMovies > 100) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid number of movies (1-100)",
      });
    }

    console.log(
      `\n${"=".repeat(
        60
      )}\n[BULK IMPORT] Starting import of ${numMovies} movies\n` +
        `Admin ID: ${adminID}\n` +
        `Timestamp: ${new Date().toISOString()}\n${"=".repeat(60)}`
    );

    // Import using the TMDB importer utility
    const result = await importMoviesFromTMDB(numMovies, adminID);

    console.log(
      `\n${"=".repeat(60)}\n[BULK IMPORT] Completed\n` +
        `✓ Imported: ${result.imported}\n` +
        `⊘ Skipped: ${result.skipped}\n` +
        `✗ Errors: ${result.errors.length}\n${"=".repeat(60)}\n`
    );

    res.json({
      success: true,
      message: `Import completed: ${result.imported} imported, ${result.skipped} skipped`,
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error(
      `\n${"=".repeat(60)}\n[BULK IMPORT ERROR]\n` +
        `Message: ${error.message}\n` +
        `Stack: ${error.stack}\n${"=".repeat(60)}\n`
    );

    res.status(500).json({
      success: false,
      message: "Failed to import movies: " + error.message,
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// GET /api/admin/movies - Get all movies with pagination and filters
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      genre = "",
      year = "",
      sortBy = "title",
      sortOrder = "ASC",
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];

    // Add search filter
    if (search) {
      whereConditions.push("(m.title LIKE ? OR m.director LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add year filter
    if (year) {
      whereConditions.push("m.releaseYear = ?");
      params.push(year);
    }

    // Add genre filter
    if (genre) {
      whereConditions.push("g.genreName = ?");
      params.push(genre);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Validate sort column
    const validSortColumns = {
      title: "m.title",
      year: "m.releaseYear",
      rating: "m.avgRating",
      views: "m.viewCount",
      director: "m.director",
    };

    const sortColumn = validSortColumns[sortBy] || "m.title";
    const order = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT m.movieID) as total
      FROM movie m
      LEFT JOIN moviegenres mg ON m.movieID = mg.movieID
      LEFT JOIN genres g ON mg.genreID = g.genreID
      ${whereClause}
    `;
    const totalResult = await db.query(countQuery, params);
    const total = totalResult[0].total;

    // Get movies with genres
    const moviesQuery = `
      SELECT 
        m.movieID,
        m.title,
        m.director,
        m.releaseYear,
        m.synopsis,
        m.posterImg,
        m.avgRating,
        m.viewCount,
        GROUP_CONCAT(DISTINCT g.genreName ORDER BY g.genreName SEPARATOR ', ') as genres
      FROM movie m
      LEFT JOIN moviegenres mg ON m.movieID = mg.movieID
      LEFT JOIN genres g ON mg.genreID = g.genreID
      ${whereClause}
      GROUP BY m.movieID, m.title, m.director, m.releaseYear, m.synopsis, m.posterImg, m.avgRating, m.viewCount
      ORDER BY ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;

    const movieParams = [...params, parseInt(limit), offset];
    const movies = await db.query(moviesQuery, movieParams);

    res.json({
      success: true,
      movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get movies error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve movies",
      error: error.message,
    });
  }
});

// POST /api/admin/movies - Add a new movie
router.post("/", async (req, res) => {
  try {
    const { title, releaseYear, director, synopsis, posterImg, genreIds } =
      req.body;
    const adminID = req.session.userId;

    // Validate required fields
    if (!title || !releaseYear || !director) {
      return res.status(400).json({
        success: false,
        message: "Title, release year, and director are required",
      });
    }

    // Validate at least one genre is selected
    if (!genreIds || !Array.isArray(genreIds) || genreIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one genre for the movie",
      });
    }

    // Check if movie already exists (same title and year)
    const existingMovie = await db.query(
      `SELECT movieID, title FROM movie WHERE title = ? AND releaseYear = ?`,
      [title, releaseYear]
    );

    if (existingMovie.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Movie "${title}" (${releaseYear}) already exists in the database`,
      });
    }

    // Insert movie
    const result = await db.query(
      `INSERT INTO movie (title, releaseYear, director, synopsis, posterImg) 
       VALUES (?, ?, ?, ?, ?)`,
      [title, releaseYear, director, synopsis || "", posterImg || null]
    );

    const movieID = result.insertId;

    // Insert genre associations if provided
    if (genreIds && Array.isArray(genreIds) && genreIds.length > 0) {
      const genreValues = genreIds.map((genreID) => [movieID, genreID]);
      await db.query(`INSERT INTO moviegenres (movieID, genreID) VALUES ?`, [
        genreValues,
      ]);
    }

    // Log audit trail (using correct column names)
    await db.query(
      `INSERT INTO auditlog (adminID, targetRecordID, targetTable, operationPerformed)
       VALUES (?, ?, 'movie', 'INSERT')`,
      [adminID, movieID]
    );

    res.status(201).json({
      success: true,
      message: "Movie added successfully",
      movieID,
    });
  } catch (error) {
    console.error("Add movie error:", error);

    // Handle duplicate entry error from database constraint
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This movie already exists in the database",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to add movie",
      error: error.message,
    });
  }
});

// GET /api/admin/movies/:movieID - Get a single movie by ID
router.get("/:movieID", async (req, res) => {
  try {
    const { movieID } = req.params;

    // Get movie details
    const movies = await db.query(
      `SELECT movieID, title, director, releaseYear, synopsis, posterImg, avgRating, viewCount
       FROM movie 
       WHERE movieID = ?`,
      [movieID]
    );

    if (movies.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    const movie = movies[0];

    // Get associated genres
    const genres = await db.query(
      `SELECT g.genreID, g.genreName
       FROM moviegenres mg
       JOIN genres g ON mg.genreID = g.genreID
       WHERE mg.movieID = ?`,
      [movieID]
    );

    // Return movie with genre IDs as comma-separated string
    movie.genreIds = genres.map((g) => g.genreID).join(",");
    movie.genres = genres.map((g) => g.genreName).join(", ");

    res.json(movie);
  } catch (error) {
    console.error("Get movie error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve movie",
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
    const movies = await db.query(`SELECT title FROM movie WHERE movieID = ?`, [
      movieID,
    ]);

    if (movies.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    // Delete movie (will cascade to related data)
    await db.query(`DELETE FROM movie WHERE movieID = ?`, [movieID]);

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
    const { title, synopsis, director, releaseYear, posterImg, genreIds } =
      req.body;
    const adminID = req.session.userId;

    // Check if movie exists
    const existingMovie = await db.query(
      `SELECT movieID FROM movie WHERE movieID = ?`,
      [movieID]
    );

    if (existingMovie.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

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

    if (updates.length === 0 && !genreIds) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    // If updating genres, require at least one
    if (
      genreIds !== undefined &&
      (!Array.isArray(genreIds) || genreIds.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one genre for the movie",
      });
    }

    // Update movie fields if any
    if (updates.length > 0) {
      params.push(movieID);
      const updateQuery = `UPDATE movie SET ${updates.join(
        ", "
      )} WHERE movieID = ?`;
      console.log(
        "Updating movie:",
        movieID,
        "Query:",
        updateQuery,
        "Params:",
        params
      );
      await db.query(updateQuery, params);
      console.log("Movie updated successfully in database");
    }

    // Update genres if provided
    if (genreIds !== undefined) {
      console.log(
        "Updating genres for movie:",
        movieID,
        "New genres:",
        genreIds
      );
      // Delete existing genre associations
      await db.query(`DELETE FROM moviegenres WHERE movieID = ?`, [movieID]);

      // Insert new genre associations
      if (Array.isArray(genreIds) && genreIds.length > 0) {
        const genreValues = genreIds.map((genreID) => [movieID, genreID]);
        await db.query(`INSERT INTO moviegenres (movieID, genreID) VALUES ?`, [
          genreValues,
        ]);
        console.log("Genres updated successfully");
      }
    }

    // Log audit trail
    await db.query(
      `INSERT INTO auditlog (adminID, targetRecordID, targetTable, operationPerformed)
       VALUES (?, ?, 'movie', 'UPDATE')`,
      [adminID, movieID]
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

module.exports = router;
