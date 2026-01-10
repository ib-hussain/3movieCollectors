const express = require("express");
const router = express.Router();
const db = require("../db");

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Get all reviews for a movie
router.get("/movies/:movieId/reviews", async (req, res) => {
  try {
    const { movieId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const query = `
            SELECT 
                rr.movieID,
                rr.userID,
                rr.rating,
                rr.review,
                rr.reviewDate,
                rr.lastUpdated,
                u.name as userName,
                u.username
            FROM ReviewRatings rr
            INNER JOIN User u ON rr.userID = u.userID
            WHERE rr.movieID = ?
            ORDER BY rr.reviewDate DESC
            LIMIT ? OFFSET ?
        `;

    const reviews = await db.query(query, [movieId, limit + 1, offset]);

    // Calculate rating statistics
    const stats = {
      totalReviews: reviews.length,
      averageRating: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
      },
    };

    // Check if there are more reviews
    const hasMore = reviews.length > limit;
    const paginatedReviews = hasMore ? reviews.slice(0, limit) : reviews;

    if (paginatedReviews.length > 0) {
      const sum = paginatedReviews.reduce(
        (acc, r) => acc + parseFloat(r.rating),
        0
      );
      stats.averageRating = (sum / paginatedReviews.length).toFixed(1);

      // Calculate distribution
      paginatedReviews.forEach((r) => {
        const rating = Math.floor(parseFloat(r.rating));
        if (rating >= 1 && rating <= 10) {
          stats.ratingDistribution[rating]++;
        }
      });
    }

    res.json({
      success: true,
      reviews: paginatedReviews,
      stats,
      hasMore,
      pagination: {
        limit,
        offset,
        nextOffset: hasMore ? offset + limit : null,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Get user's review for a specific movie
router.get("/movies/:movieId/reviews/me", requireAuth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.session.userId;

    const query = `
                SELECT 
                    movieID,
                    userID,
                    rating,
                    review,
                    reviewDate,
                    lastUpdated
                FROM ReviewRatings
                WHERE movieID = ? AND userID = ?
            `;

    const reviews = await db.query(query, [movieId, userId]);

    if (reviews.length === 0) {
      return res.json({ success: true, review: null });
    }

    res.json({ success: true, review: reviews[0] });
  } catch (error) {
    console.error("Error fetching user review:", error);
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

// Create a new review
router.post("/movies/:movieId/reviews", requireAuth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.session.userId;
    const { rating, review } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 10) {
      return res.status(400).json({ error: "Rating must be between 1 and 10" });
    }

    // Validate review text
    if (!review || review.trim().length === 0) {
      return res.status(400).json({ error: "Review text is required" });
    }

    if (review.length > 8000) {
      return res
        .status(400)
        .json({ error: "Review text is too long (max 8000 characters)" });
    }

    // Check if user already reviewed this movie
    const existingQuery = `
            SELECT * FROM ReviewRatings 
            WHERE movieID = ? AND userID = ?
        `;
    const existing = await db.query(existingQuery, [movieId, userId]);

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ error: "You have already reviewed this movie" });
    }

    // Insert review
    const insertQuery = `
            INSERT INTO ReviewRatings (movieID, userID, rating, review, reviewDate, lastUpdated)
            VALUES (?, ?, ?, ?, NOW(), NOW())
        `;

    await db.query(insertQuery, [movieId, userId, rating, review.trim()]);

    // Update movie's average rating
    await updateMovieAverageRating(movieId);

    res.status(201).json({
      success: true,
      message: "Review posted successfully",
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to post review" });
  }
});

// Update an existing review
router.patch("/reviews/:movieId", requireAuth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.session.userId;
    const { rating, review } = req.body;

    // Validate rating
    if (rating && (rating < 1 || rating > 10)) {
      return res.status(400).json({ error: "Rating must be between 1 and 10" });
    }

    // Validate review text
    if (review !== undefined) {
      if (review.trim().length === 0) {
        return res.status(400).json({ error: "Review text cannot be empty" });
      }
      if (review.length > 8000) {
        return res
          .status(400)
          .json({ error: "Review text is too long (max 8000 characters)" });
      }
    }

    // Check if review exists and belongs to user
    const checkQuery = `
            SELECT * FROM ReviewRatings 
            WHERE movieID = ? AND userID = ?
        `;
    const existing = await db.query(checkQuery, [movieId, userId]);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (rating !== undefined) {
      updates.push("rating = ?");
      values.push(rating);
    }

    if (review !== undefined) {
      updates.push("review = ?");
      values.push(review.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    updates.push("lastUpdated = NOW()");
    values.push(movieId, userId);

    const updateQuery = `
            UPDATE ReviewRatings 
            SET ${updates.join(", ")}
            WHERE movieID = ? AND userID = ?
        `;

    await db.query(updateQuery, values);

    // Update movie's average rating
    await updateMovieAverageRating(movieId);

    res.json({
      success: true,
      message: "Review updated successfully",
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
});

// Delete a review
router.delete("/reviews/:movieId", requireAuth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.session.userId;

    // Check if review exists and belongs to user
    const checkQuery = `
            SELECT * FROM ReviewRatings 
            WHERE movieID = ? AND userID = ?
        `;
    const existing = await db.query(checkQuery, [movieId, userId]);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Delete review
    const deleteQuery = `
            DELETE FROM ReviewRatings 
            WHERE movieID = ? AND userID = ?
        `;

    await db.query(deleteQuery, [movieId, userId]);

    // Update movie's average rating
    await updateMovieAverageRating(movieId);

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// Get all reviews by a specific user
router.get("/users/:userId/reviews", async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
            SELECT 
                rr.movieID,
                rr.userID,
                rr.rating,
                rr.review,
                rr.reviewDate,
                rr.lastUpdated,
                m.title as movieTitle,
                m.posterImg,
                m.releaseYear
            FROM ReviewRatings rr
            INNER JOIN Movie m ON rr.movieID = m.movieID
            WHERE rr.userID = ?
            ORDER BY rr.reviewDate DESC
        `;

    const reviews = await db.query(query, [userId]);

    res.json({
      success: true,
      reviews,
      count: reviews.length,
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ error: "Failed to fetch user reviews" });
  }
});

// Helper function to update movie's average rating
async function updateMovieAverageRating(movieId) {
  try {
    const query = `
            SELECT AVG(rating) as avgRating, COUNT(*) as reviewCount
            FROM ReviewRatings
            WHERE movieID = ?
        `;

    const result = await db.query(query, [movieId]);

    const avgRating = result[0].avgRating
      ? parseFloat(result[0].avgRating).toFixed(1)
      : 0.0;

    const updateQuery = `
            UPDATE Movie 
            SET avgRating = ?
            WHERE movieID = ?
        `;

    await db.query(updateQuery, [avgRating, movieId]);
  } catch (error) {
    console.error("Error updating movie average rating:", error);
    throw error;
  }
}

module.exports = router;
