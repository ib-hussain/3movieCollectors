const express = require("express");
const router = express.Router();
const db = require("../db");

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}; // Get current user's profile
router.get("/profile/me", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Get user basic info
    const userResult = await db.query(
      `
            SELECT userID, username, name, email, registrationDate, profilePicture
            FROM User
            WHERE userID = ?
        `,
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult[0];

    // Get stats
    const stats = await getProfileStats(userId);

    // Get favorite genres (from most-watched movie genres)
    const favoriteGenres = await getFavoriteGenres(userId);

    // Get user's reviews with movie details
    const reviews = await getUserReviews(userId);

    res.json({
      success: true,
      profile: {
        ...user,
        stats,
        favoriteGenres,
        reviews,
      },
    });
  } catch (error) {
    console.error("Error fetching own profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Get another user's profile by username
router.get("/profile/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Get user basic info
    const userResult = await db.query(
      `
            SELECT userID, username, name, registrationDate, profilePicture
            FROM User
            WHERE username = ?
        `,
      [username]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult[0];

    // Get stats
    const stats = await getProfileStats(user.userID);

    // Get favorite genres
    const favoriteGenres = await getFavoriteGenres(user.userID);

    // Get user's reviews with movie details
    const reviews = await getUserReviews(user.userID);

    res.json({
      success: true,
      profile: {
        ...user,
        stats,
        favoriteGenres,
        reviews,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update profile picture
router.patch("/profile/picture", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { profilePicture } = req.body;

    if (!profilePicture || typeof profilePicture !== "string") {
      return res
        .status(400)
        .json({ error: "Valid profile picture URL required" });
    }

    // Validate URL format (basic check)
    const urlPattern = /^(https?:\/\/)|(\/pictures\/)/;
    if (!urlPattern.test(profilePicture)) {
      return res
        .status(400)
        .json({ error: "Invalid profile picture URL format" });
    }

    await db.query(
      `
            UPDATE User
            SET profilePicture = ?
            WHERE userID = ?
        `,
      [profilePicture, userId]
    );

    res.json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicture,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ error: "Failed to update profile picture" });
  }
});

// Helper function to get profile stats
async function getProfileStats(userId) {
  // Movies Watched (completed watchlist items)
  const moviesWatched = await db.query(
    `
        SELECT COUNT(*) as count
        FROM WatchList
        WHERE userID = ? AND status = 'completed'
    `,
    [userId]
  );

  // Reviews count
  const reviewsCount = await db.query(
    `
        SELECT COUNT(*) as count
        FROM ReviewRatings
        WHERE userID = ?
    `,
    [userId]
  );

  // Friends count (bidirectional friendship)
  const friendsCount = await db.query(
    `
        SELECT COUNT(*) as count
        FROM Friends
        WHERE user1 = ? OR user2 = ?
    `,
    [userId, userId]
  );

  // Watchlist count (all entries)
  const watchlistCount = await db.query(
    `
        SELECT COUNT(*) as count
        FROM WatchList
        WHERE userID = ?
    `,
    [userId]
  );

  return {
    moviesWatched: moviesWatched[0].count,
    reviews: reviewsCount[0].count,
    friends: friendsCount[0].count,
    watchlist: watchlistCount[0].count,
  };
}

// Helper function to get favorite genres (top 4 most-watched genres)
async function getFavoriteGenres(userId) {
  const genres = await db.query(
    `
        SELECT g.genreName, COUNT(*) as count
        FROM WatchList w
        INNER JOIN Movie m ON w.movieID = m.movieID
        INNER JOIN MovieGenres mg ON m.movieID = mg.movieID
        INNER JOIN Genres g ON mg.genreID = g.genreID
        WHERE w.userID = ? AND w.status = 'completed'
        GROUP BY g.genreID, g.genreName
        ORDER BY count DESC
        LIMIT 4
    `,
    [userId]
  );

  return genres.map((g) => g.genreName);
}

// Helper function to get user's reviews with movie details
async function getUserReviews(userId) {
  const reviews = await db.query(
    `
        SELECT 
            rr.movieID,
            rr.rating,
            rr.review,
            rr.reviewDate,
            rr.lastUpdated,
            m.title as movieTitle,
            m.releaseYear,
            m.posterImg as posterPath
        FROM ReviewRatings rr
        INNER JOIN Movie m ON rr.movieID = m.movieID
        WHERE rr.userID = ?
        ORDER BY rr.reviewDate DESC
        LIMIT 20
    `,
    [userId]
  );

  return reviews;
}

module.exports = router;
