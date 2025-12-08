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

    // Get watchlist count (added status - not yet watched)
    const watchlistCount = await db.query(
      "SELECT COUNT(*) as count FROM WatchList WHERE userID = ? AND status = 'added'",
      [userId]
    );

    // Get watched count (completed status)
    const watchedCount = await db.query(
      "SELECT COUNT(*) as count FROM WatchList WHERE userID = ? AND status = 'completed'",
      [userId]
    );

    // Get friends count (Friends table has no status column - all are accepted)
    const friendsCount = await db.query(
      `SELECT COUNT(*) as count FROM Friends 
       WHERE user1 = ? OR user2 = ?`,
      [userId, userId]
    );

    // Get reviews count
    const reviewsCount = await db.query(
      "SELECT COUNT(*) as count FROM ReviewRatings WHERE userID = ?",
      [userId]
    );

    // Get upcoming events count (host or participant)
    const eventsCount = await db.query(
      `SELECT COUNT(DISTINCT we.eventID) as count
       FROM WatchEvent we
       LEFT JOIN EventParticipants ep ON we.eventID = ep.eventID
       WHERE (we.host = ? OR ep.userID = ?)
         AND we.eventDateTime >= NOW()`,
      [userId, userId]
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
 * GET /api/dashboard/trending
 * Get trending movies based on recent reviews and watchlist additions
 */
router.get("/trending", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const daysAgo = parseInt(req.query.days) || 30; // Default 30 days

    // Get movies with most recent activity (reviews + watchlist additions)
    const movies = await db.query(
      `SELECT m.movieID, m.title, m.synopsis, m.director, m.releaseYear, m.posterImg, m.avgRating,
       GROUP_CONCAT(DISTINCT g.genreName SEPARATOR ', ') as genres,
       COUNT(DISTINCT CONCAT(rr.movieID, '-', rr.userID)) as reviewCount,
       COUNT(DISTINCT wl.userID) as watchlistCount,
       MAX(GREATEST(COALESCE(rr.reviewDate, '1970-01-01'), COALESCE(wl.addedDate, '1970-01-01'))) as lastActivity
       FROM Movie m
       LEFT JOIN MovieGenres mg ON m.movieID = mg.movieID
       LEFT JOIN Genres g ON mg.genreID = g.genreID
       LEFT JOIN ReviewRatings rr ON m.movieID = rr.movieID AND rr.reviewDate >= DATE_SUB(NOW(), INTERVAL ? DAY)
       LEFT JOIN WatchList wl ON m.movieID = wl.movieID AND wl.addedDate >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY m.movieID, m.title, m.synopsis, m.director, m.releaseYear, m.posterImg, m.avgRating
       HAVING (reviewCount > 0 OR watchlistCount > 0)
       ORDER BY (reviewCount * 2 + watchlistCount) DESC, lastActivity DESC
       LIMIT ?`,
      [daysAgo, daysAgo, limit]
    );

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
        reviewCount: m.reviewCount || 0,
        watchlistCount: m.watchlistCount || 0,
      })),
    });
  } catch (error) {
    console.error("Trending movies error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load trending movies",
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
 * Optimized: Uses MySQL UNION and database-level pagination
 */
router.get("/recent-activity", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // Use a single optimized query with UNION ALL to combine all activities
    // MySQL handles sorting and pagination efficiently
    const activities = await db.query(
      `
      SELECT * FROM (
        -- Reviews from friends
        SELECT 
          'review' as type,
          rr.movieID as movieId,
          rr.userID as userId,
          u.username,
          u.name,
          u.profilePicture,
          m.title as movieTitle,
          rr.rating,
          rr.review as reviewText,
          NULL as postContent,
          NULL as likeCount,
          NULL as commentCount,
          NULL as commentContent,
          NULL as originalPost,
          NULL as postID,
          NULL as commentID,
          rr.reviewDate as activityDate
        FROM ReviewRatings rr
        JOIN User u ON rr.userID = u.userID
        JOIN Movie m ON rr.movieID = m.movieID
        WHERE rr.userID IN (
          SELECT CASE 
            WHEN user1 = ? THEN user2 
            ELSE user1 
          END as friendId
          FROM Friends 
          WHERE user1 = ? OR user2 = ?
        )
        
        UNION ALL
        
        -- Posts from friends
        SELECT 
          'post' as type,
          p.movieID as movieId,
          p.userID as userId,
          u.username,
          u.name,
          u.profilePicture,
          m.title as movieTitle,
          NULL as rating,
          NULL as reviewText,
          p.postContent,
          p.likeCount,
          p.commentCount,
          NULL as commentContent,
          NULL as originalPost,
          p.postID,
          NULL as commentID,
          p.createdAt as activityDate
        FROM Post p
        JOIN User u ON p.userID = u.userID
        JOIN Movie m ON p.movieID = m.movieID
        WHERE p.userID IN (
          SELECT CASE 
            WHEN user1 = ? THEN user2 
            ELSE user1 
          END as friendId
          FROM Friends 
          WHERE user1 = ? OR user2 = ?
        )
        
        UNION ALL
        
        -- Comments from friends on user's posts (exclude user's own comments)
        SELECT 
          'comment' as type,
          p.movieID as movieId,
          c.userID as userId,
          u.username,
          u.name,
          u.profilePicture,
          m.title as movieTitle,
          NULL as rating,
          NULL as reviewText,
          NULL as postContent,
          NULL as likeCount,
          NULL as commentCount,
          c.commentContent,
          p.postContent as originalPost,
          c.postID,
          c.commentID,
          c.createdAt as activityDate
        FROM Comments c
        JOIN Post p ON c.postID = p.postID
        JOIN User u ON c.userID = u.userID
        JOIN Movie m ON p.movieID = m.movieID
        WHERE p.userID = ? AND c.userID != ?
      ) AS combined_activities
      ORDER BY activityDate DESC
      LIMIT ? OFFSET ?
      `,
      [
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        limit + 1,
        offset,
      ]
    );

    // Check if there are more activities (we fetched limit + 1)
    const hasMore = activities.length > limit;
    const paginatedActivities = hasMore
      ? activities.slice(0, limit)
      : activities;

    res.json({
      success: true,
      activities: paginatedActivities,
      hasMore: hasMore,
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
