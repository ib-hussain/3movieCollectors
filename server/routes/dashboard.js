/**
 * Dashboard API Routes
 * Provides data for user dashboard: stats, recommendations, recent activity
 */

const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

/**
 * GET /api/dashboard/stats
 * Get user's dashboard statistics
 */
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Get watchlist count (to-watch status)
    const [watchlistCount] = await db.query(
      "SELECT COUNT(*) as count FROM WatchList WHERE userId = ? AND status = 'to-watch'",
      [userId]
    );

    // Get watched count (completed status)
    const [watchedCount] = await db.query(
      "SELECT COUNT(*) as count FROM WatchList WHERE userId = ? AND status = 'completed'",
      [userId]
    );

    // Get friends count (Friends table has no status column - all are accepted)
    const [friendsCount] = await db.query(
      `SELECT COUNT(*) as count FROM Friends 
       WHERE user1 = ? OR user2 = ?`,
      [userId, userId]
    );

    // Get reviews count
    const [reviewsCount] = await db.query(
      "SELECT COUNT(*) as count FROM ReviewRatings WHERE userId = ?",
      [userId]
    );

    // Get upcoming events count
    const [eventsCount] = await db.query(
      `SELECT COUNT(DISTINCT we.eventID) as count 
       FROM WatchEvent we 
       WHERE we.host = ? AND we.eventDateTime >= NOW()`,
      [userId]
    );

    res.json({
      success: true,
      stats: {
        watchlist:
          watchlistCount && watchlistCount[0] ? watchlistCount[0].count : 0,
        watched: watchedCount && watchedCount[0] ? watchedCount[0].count : 0,
        friends: friendsCount && friendsCount[0] ? friendsCount[0].count : 0,
        reviews: reviewsCount && reviewsCount[0] ? reviewsCount[0].count : 0,
        upcomingEvents:
          eventsCount && eventsCount[0] ? eventsCount[0].count : 0,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics",
    });
  }
});

/**
 * GET /api/dashboard/recommended
 * Get recommended movies based on user's favorite genres and ratings
 */
router.get("/recommended", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const limit = parseInt(req.query.limit) || 6;

    // Get user's favorite genres from their rated movies
    let [favoriteGenres] = await db.query(
      `SELECT g.genreName, COUNT(*) as count
       FROM ReviewRatings rr
       JOIN MovieGenres mg ON rr.movieId = mg.movieId
       JOIN Genres g ON mg.genreId = g.genreId
       WHERE rr.userId = ? AND rr.rating >= 4
       GROUP BY g.genreId, g.genreName
       ORDER BY count DESC
       LIMIT 3`,
      [userId]
    );

    // Ensure favoriteGenres is an array
    if (!Array.isArray(favoriteGenres)) {
      favoriteGenres = [];
    }

    let movies;
    if (favoriteGenres && favoriteGenres.length > 0) {
      // Recommend movies from favorite genres that user hasn't watched
      const [genreIds] = await db.query(
        `SELECT genreId FROM Genres WHERE genreName IN (?)`,
        [favoriteGenres.map((g) => g.genreName)]
      );

      const genreIdList =
        genreIds && genreIds.length > 0 ? genreIds.map((g) => g.genreId) : [];

      if (genreIdList.length > 0) {
        movies = await db.query(
          `SELECT m.movieID, m.title, m.synopsis, m.director, m.releaseYear, m.posterImg, m.avgRating as tmdbRating,
           GROUP_CONCAT(DISTINCT g.genreName SEPARATOR ', ') as genres,
           AVG(rr.rating) as avgRating,
           COUNT(rr.rating) as reviewCount
           FROM Movie m
           LEFT JOIN MovieGenres mg ON m.movieID = mg.movieID
           LEFT JOIN Genres g ON mg.genreID = g.genreID
           LEFT JOIN ReviewRatings rr ON m.movieID = rr.movieID
           WHERE mg.genreID IN (?)
           GROUP BY m.movieID, m.title, m.synopsis, m.director, m.releaseYear, m.posterImg, m.avgRating
           ORDER BY COALESCE(avgRating, 0) DESC, reviewCount DESC
           LIMIT ${limit}`,
          [genreIdList]
        );
      } else {
        movies = [];
      }
    } else {
      // No preference yet - show popular movies
      const result = await db.query(
        `SELECT m.movieID, m.title, m.synopsis, m.director, m.releaseYear, m.posterImg, m.avgRating as tmdbRating,
         GROUP_CONCAT(DISTINCT g.genreName SEPARATOR ', ') as genres,
         AVG(rr.rating) as avgRating,
         COUNT(rr.rating) as reviewCount
         FROM Movie m
         LEFT JOIN MovieGenres mg ON m.movieID = mg.movieID
         LEFT JOIN Genres g ON mg.genreID = g.genreID
         LEFT JOIN ReviewRatings rr ON m.movieID = rr.movieID
         GROUP BY m.movieID, m.title, m.synopsis, m.director, m.releaseYear, m.posterImg, m.avgRating
         ORDER BY COALESCE(avgRating, 0) DESC, reviewCount DESC, m.title ASC
         LIMIT ${limit}`,
        []
      );

      // db.query already returns rows directly (not [rows, fields])
      movies = Array.isArray(result) ? result : [];
    }

    // Ensure movies is an array
    if (!Array.isArray(movies)) {
      movies = [];
    }

    res.json({
      success: true,
      movies: movies.map((m) => ({
        movieId: m.movieID, // Map movieID to movieId for frontend
        title: m.title,
        synopsis: m.synopsis,
        director: m.director,
        releaseYear: m.releaseYear,
        posterPath: m.posterImg ? `/pictures/${m.posterImg}` : null,
        genres: m.genres,
        avgRating: m.avgRating ? parseFloat(m.avgRating).toFixed(1) : null,
        reviewCount: m.reviewCount || 0,
      })),
      basedOn:
        favoriteGenres.length > 0
          ? favoriteGenres.map((g) => g.genreName)
          : ["Popular movies"],
    });
  } catch (error) {
    console.error("Recommended movies error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load recommended movies",
    });
  }
});

/**
 * GET /api/dashboard/recent-watchlist
 * Get user's recently added watchlist items
 */
router.get("/recent-watchlist", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const limit = parseInt(req.query.limit) || 5;

    const [items] = await db.query(
      `SELECT wl.*, m.title, m.releaseYear, m.posterPath,
       GROUP_CONCAT(DISTINCT g.genreName SEPARATOR ', ') as genres
       FROM WatchList wl
       JOIN Movie m ON wl.movieId = m.movieId
       LEFT JOIN MovieGenres mg ON m.movieId = mg.movieId
       LEFT JOIN Genres g ON mg.genreId = g.genreId
       WHERE wl.userId = ?
       GROUP BY wl.listId
       ORDER BY wl.addedDate DESC
       LIMIT ?`,
      [userId, limit]
    );

    res.json({
      success: true,
      items: items,
    });
  } catch (error) {
    console.error("Recent watchlist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load recent watchlist",
    });
  }
});

/**
 * GET /api/dashboard/recent-activity
 * Get recent activity from friends (reviews, watchlist additions, events)
 */
router.get("/recent-activity", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const limit = parseInt(req.query.limit) || 10;

    // Get friend IDs (Friends table has no status column)
    const [friends] = await db.query(
      `SELECT CASE 
         WHEN user1 = ? THEN user2 
         ELSE user1 
       END as friendId
       FROM Friends 
       WHERE user1 = ? OR user2 = ?`,
      [userId, userId, userId]
    );

    if (!friends || friends.length === 0) {
      return res.json({
        success: true,
        activities: [],
      });
    }

    const friendIds = friends.map((f) => f.friendId);

    // Get recent reviews from friends
    const [reviews] = await db.query(
      `SELECT 'review' as type, rr.reviewId as id, rr.userId, u.username, u.name,
       rr.movieId, m.title as movieTitle, rr.rating, rr.reviewText,
       rr.reviewDate as activityDate
       FROM ReviewRatings rr
       JOIN User u ON rr.userId = u.userId
       JOIN Movie m ON rr.movieId = m.movieId
       WHERE rr.userId IN (?)
       ORDER BY rr.reviewDate DESC
       LIMIT ?`,
      [friendIds, limit]
    );

    res.json({
      success: true,
      activities: reviews,
    });
  } catch (error) {
    console.error("Recent activity error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load recent activity",
    });
  }
});

module.exports = router;
