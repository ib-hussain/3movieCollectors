/**
 * Movies API Routes
 * Provides movie browsing, search, and detail endpoints
 */

const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * GET /api/movies
 * Browse movies with filters, search, sort, and pagination
 * Query params:
 *   - genre: filter by genre name (optional)
 *   - search: search in movie titles (optional)
 *   - year: filter by release year (optional)
 *   - sort: top-rated | az | latest (default: top-rated)
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 20)
 */
router.get("/", async (req, res) => {
  try {
    let {
      genre,
      search,
      year,
      sort = "top-rated",
      page = 1,
      limit = 20,
    } = req.query;

    // Handle multiple genres (can be array or single value)
    const genres = Array.isArray(genre) ? genre : genre ? [genre] : [];

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build WHERE conditions
    const conditions = [];
    const params = [];

    // Genre filter (multiple genres with OR)
    if (genres.length > 0 && !genres.includes("all")) {
      const genrePlaceholders = genres
        .map(() => "g.genreName = ?")
        .join(" OR ");
      conditions.push(`(${genrePlaceholders})`);
      params.push(...genres);
    }

    // Search filter (title only)
    if (search && search.trim()) {
      conditions.push("m.title LIKE ?");
      params.push(`%${search.trim()}%`);
    }

    // Year filter
    if (year && year !== "all") {
      conditions.push("m.releaseYear = ?");
      params.push(parseInt(year));
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Build ORDER BY clause
    let orderBy;
    switch (sort) {
      case "az":
        orderBy = "m.title ASC";
        break;
      case "latest":
        orderBy = "m.releaseYear DESC, m.title ASC";
        break;
      case "top-rated":
      default:
        orderBy = "m.avgRating DESC, m.title ASC";
        break;
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT m.movieID) as total
      FROM Movie m
      LEFT JOIN MovieGenres mg ON m.movieID = mg.movieID
      LEFT JOIN Genres g ON mg.genreID = g.genreID
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = countResult && countResult[0] ? countResult[0].total : 0;

    // Get movies
    const moviesQuery = `
      SELECT DISTINCT m.movieID, m.title, m.synopsis, m.director, m.releaseYear, 
             m.posterImg, m.avgRating,
             GROUP_CONCAT(DISTINCT g.genreName SEPARATOR ', ') as genres
      FROM Movie m
      LEFT JOIN MovieGenres mg ON m.movieID = mg.movieID
      LEFT JOIN Genres g ON mg.genreID = g.genreID
      ${whereClause}
      GROUP BY m.movieID, m.title, m.synopsis, m.director, m.releaseYear, m.posterImg, m.avgRating
      ORDER BY ${orderBy}
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;

    const movies = await db.query(moviesQuery, params);

    res.json({
      success: true,
      movies: movies.map((m) => ({
        movieId: m.movieID,
        title: m.title,
        synopsis: m.synopsis,
        director: m.director,
        releaseYear: m.releaseYear,
        posterPath: m.posterImg ? `/pictures/${m.posterImg}` : null,
        genres: m.genres,
        avgRating: m.avgRating ? parseFloat(m.avgRating).toFixed(1) : "0.0",
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Movies browse error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load movies",
    });
  }
});

/**
 * GET /api/movies/genres
 * Get all available genres
 */
router.get("/genres", async (req, res) => {
  try {
    const genres = await db.query(
      "SELECT genreID, genreName FROM Genres ORDER BY genreName ASC"
    );

    res.json({
      success: true,
      genres: genres.map((g) => ({
        id: g.genreID,
        name: g.genreName,
      })),
    });
  } catch (error) {
    console.error("Genres fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load genres",
    });
  }
});

/**
 * GET /api/movies/years
 * Get all available release years
 */
router.get("/years", async (req, res) => {
  try {
    const years = await db.query(
      "SELECT DISTINCT releaseYear FROM Movie WHERE releaseYear > 0 ORDER BY releaseYear DESC"
    );

    res.json({
      success: true,
      years: years.map((y) => y.releaseYear),
    });
  } catch (error) {
    console.error("Years fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load years",
    });
  }
});

/**
 * GET /api/movies/:id
 * Get detailed information about a specific movie
 */
router.get("/:id", async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);

    // Get movie details
    const movieQuery = `
      SELECT m.movieID, m.title, m.synopsis, m.director, m.releaseYear, 
             m.posterImg, m.avgRating,
             GROUP_CONCAT(DISTINCT g.genreName SEPARATOR ', ') as genres
      FROM Movie m
      LEFT JOIN MovieGenres mg ON m.movieID = mg.movieID
      LEFT JOIN Genres g ON mg.genreID = g.genreID
      WHERE m.movieID = ?
      GROUP BY m.movieID, m.title, m.synopsis, m.director, m.releaseYear, m.posterImg, m.avgRating
    `;

    const movies = await db.query(movieQuery, [movieId]);

    if (!movies || movies.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    const movie = movies[0];

    // Get review count
    const reviewCount = await db.query(
      "SELECT COUNT(*) as count FROM ReviewRatings WHERE movieID = ?",
      [movieId]
    );

    res.json({
      success: true,
      movie: {
        movieId: movie.movieID,
        title: movie.title,
        synopsis: movie.synopsis,
        director: movie.director,
        releaseYear: movie.releaseYear,
        posterPath: movie.posterImg ? `/pictures/${movie.posterImg}` : null,
        genres: movie.genres,
        avgRating: movie.avgRating
          ? parseFloat(movie.avgRating).toFixed(1)
          : "0.0",
        reviewCount: reviewCount[0].count,
      },
    });
  } catch (error) {
    console.error("Movie detail error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load movie details",
    });
  }
});

/**
 * GET /api/movies/:id/similar
 * Get similar movies based on shared genres
 */
router.get("/:id/similar", async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 8;

    // Get genres of the current movie
    const genresQuery = `
      SELECT g.genreID, g.genreName
      FROM MovieGenres mg
      JOIN Genres g ON mg.genreID = g.genreID
      WHERE mg.movieID = ?
    `;

    const genres = await db.query(genresQuery, [movieId]);

    if (genres.length === 0) {
      return res.json({
        success: true,
        movies: [],
      });
    }

    const genreIds = genres.map((g) => g.genreID);
    const placeholders = genreIds.map(() => "?").join(",");

    // Find movies with shared genres, excluding the current movie
    const similarQuery = `
      SELECT DISTINCT m.movieID, m.title, m.posterImg, m.releaseYear, m.avgRating,
             GROUP_CONCAT(DISTINCT g.genreName SEPARATOR ', ') as genres,
             COUNT(DISTINCT mg.genreID) as sharedGenres
      FROM Movie m
      JOIN MovieGenres mg ON m.movieID = mg.movieID
      LEFT JOIN Genres g ON mg.genreID = g.genreID
      WHERE mg.genreID IN (${placeholders})
        AND m.movieID != ?
      GROUP BY m.movieID, m.title, m.posterImg, m.releaseYear, m.avgRating
      ORDER BY sharedGenres DESC, m.avgRating DESC
      LIMIT ?
    `;

    // Build params array properly: [genreId1, genreId2, ..., movieId, limit]
    const params = [...genreIds, parseInt(movieId), parseInt(limit)];
    const movies = await db.query(similarQuery, params);

    const formattedMovies = movies.map((m) => ({
      movieId: m.movieID,
      title: m.title,
      posterPath: m.posterImg ? `/pictures/${m.posterImg}` : null,
      releaseYear: m.releaseYear,
      genres: m.genres,
      avgRating: m.avgRating ? parseFloat(m.avgRating).toFixed(1) : "0.0",
    }));

    res.json({
      success: true,
      movies: formattedMovies,
    });
  } catch (error) {
    console.error("Similar movies error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load similar movies",
    });
  }
});

module.exports = router;
