const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * GET /api/movies/:movieId/posts
 * Get all posts (discussions) for a specific movie
 */
router.get("/movies/:movieId/posts", async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);

    const query = `
      SELECT p.postID, p.postContent, p.likeCount, p.commentCount, p.createdAt,
             u.userID, u.username, u.name
      FROM Post p
      JOIN User u ON p.userID = u.userID
      WHERE p.movieID = ?
      ORDER BY p.createdAt DESC
    `;

    const posts = await db.query(query, [movieId]);

    const formattedPosts = posts.map((post) => ({
      postId: post.postID,
      content: post.postContent,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      author: {
        userId: post.userID,
        username: post.username,
        name: post.name,
      },
      isLikedByCurrentUser: false, // Will be updated below
      isAuthor: req.session.userId === post.userID,
    }));

    // Check which posts are liked by current user
    if (req.session.userId && formattedPosts.length > 0) {
      const postIds = formattedPosts.map((p) => p.postId);
      const placeholders = postIds.map(() => "?").join(",");

      const likes = await db.query(
        `SELECT postID FROM Likes WHERE userID = ? AND postID IN (${placeholders})`,
        [req.session.userId, ...postIds]
      );

      const likedPostIds = new Set(likes.map((l) => l.postID));
      formattedPosts.forEach((post) => {
        post.isLikedByCurrentUser = likedPostIds.has(post.postId);
      });
    }

    res.json({
      success: true,
      posts: formattedPosts,
    });
  } catch (error) {
    console.error("Fetch posts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load posts",
    });
  }
});

/**
 * POST /api/movies/:movieId/posts
 * Create a new post for a movie
 */
router.post("/movies/:movieId/posts", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to post",
      });
    }

    const movieId = parseInt(req.params.movieId);
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Post content is required",
      });
    }

    if (content.length > 8095) {
      return res.status(400).json({
        success: false,
        message: "Post content is too long",
      });
    }

    // Verify movie exists
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

    // Insert post
    const result = await db.query(
      "INSERT INTO Post (movieID, userID, postContent, createdAt) VALUES (?, ?, ?, NOW())",
      [movieId, req.session.userId, content.trim()]
    );

    // Get the created post with user info
    const newPost = await db.query(
      `SELECT p.postID, p.postContent, p.likeCount, p.commentCount, p.createdAt,
              u.userID, u.username, u.name
       FROM Post p
       JOIN User u ON p.userID = u.userID
       WHERE p.postID = ?`,
      [result.insertId]
    );

    res.json({
      success: true,
      message: "Post created successfully",
      post: {
        postId: newPost[0].postID,
        content: newPost[0].postContent,
        likeCount: newPost[0].likeCount,
        commentCount: newPost[0].commentCount,
        createdAt: newPost[0].createdAt,
        author: {
          userId: newPost[0].userID,
          username: newPost[0].username,
          name: newPost[0].name,
        },
        isLikedByCurrentUser: false,
        isAuthor: true,
      },
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create post",
    });
  }
});

/**
 * DELETE /api/posts/:postId
 * Delete a post (only by author)
 */
router.delete("/posts/:postId", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in",
      });
    }

    const postId = parseInt(req.params.postId);

    // Check if post exists and user is author
    const post = await db.query("SELECT userID FROM Post WHERE postID = ?", [
      postId,
    ]);

    if (post.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post[0].userID !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own posts",
      });
    }

    // Delete post (comments will be deleted via CASCADE)
    await db.query("DELETE FROM Post WHERE postID = ?", [postId]);

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete post",
    });
  }
});

/**
 * POST /api/posts/:postId/like
 * Toggle like on a post
 */
router.post("/posts/:postId/like", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to like posts",
      });
    }

    const postId = parseInt(req.params.postId);

    // Check if post exists
    const post = await db.query(
      "SELECT postID, userID FROM Post WHERE postID = ?",
      [postId]
    );

    if (post.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Prevent self-likes
    if (post[0].userID === req.session.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot like your own post",
      });
    }

    // Check if already liked
    const existingLike = await db.query(
      "SELECT postID FROM Likes WHERE postID = ? AND userID = ?",
      [postId, req.session.userId]
    );

    let action = "";

    if (existingLike.length > 0) {
      // Unlike
      await db.query("DELETE FROM Likes WHERE postID = ? AND userID = ?", [
        postId,
        req.session.userId,
      ]);
      await db.query(
        "UPDATE Post SET likeCount = likeCount - 1 WHERE postID = ?",
        [postId]
      );
      action = "unliked";
    } else {
      // Like
      await db.query(
        "INSERT INTO Likes (postID, userID, createdAt) VALUES (?, ?, NOW())",
        [postId, req.session.userId]
      );
      await db.query(
        "UPDATE Post SET likeCount = likeCount + 1 WHERE postID = ?",
        [postId]
      );
      action = "liked";
    }

    // Get updated like count
    const updatedPost = await db.query(
      "SELECT likeCount FROM Post WHERE postID = ?",
      [postId]
    );

    res.json({
      success: true,
      action: action,
      likeCount: updatedPost[0].likeCount,
    });
  } catch (error) {
    console.error("Toggle like error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update like",
    });
  }
});

/**
 * GET /api/posts/:postId/comments
 * Get all comments for a specific post
 */
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);

    const query = `
      SELECT c.commentID, c.commentContent, c.createdAt,
             u.userID, u.username, u.name
      FROM Comments c
      JOIN User u ON c.userID = u.userID
      WHERE c.postID = ?
      ORDER BY c.createdAt ASC
    `;

    const comments = await db.query(query, [postId]);

    const formattedComments = comments.map((c) => ({
      commentId: c.commentID,
      content: c.commentContent,
      createdAt: c.createdAt,
      author: {
        userId: c.userID,
        username: c.username,
        name: c.name,
      },
      isAuthor: req.session.userId === c.userID,
    }));

    res.json({
      success: true,
      comments: formattedComments,
    });
  } catch (error) {
    console.error("Fetch comments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load comments",
    });
  }
});

/**
 * POST /api/posts/:postId/comments
 * Add a comment to a post
 */
router.post("/posts/:postId/comments", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to comment",
      });
    }

    const postId = parseInt(req.params.postId);
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    if (content.length > 8095) {
      return res.status(400).json({
        success: false,
        message: "Comment is too long",
      });
    }

    // Check if post exists
    const postCheck = await db.query(
      "SELECT postID FROM Post WHERE postID = ?",
      [postId]
    );

    if (postCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Insert comment
    const result = await db.query(
      "INSERT INTO Comments (postID, userID, commentContent, createdAt) VALUES (?, ?, ?, NOW())",
      [postId, req.session.userId, content.trim()]
    );

    // Update comment count
    await db.query(
      "UPDATE Post SET commentCount = commentCount + 1 WHERE postID = ?",
      [postId]
    );

    // Get the created comment with user info
    const newComment = await db.query(
      `SELECT c.commentID, c.commentContent, c.createdAt,
              u.userID, u.username, u.name
       FROM Comments c
       JOIN User u ON c.userID = u.userID
       WHERE c.commentID = ?`,
      [result.insertId]
    );

    res.json({
      success: true,
      message: "Comment added successfully",
      comment: {
        commentId: newComment[0].commentID,
        content: newComment[0].commentContent,
        createdAt: newComment[0].createdAt,
        author: {
          userId: newComment[0].userID,
          username: newComment[0].username,
          name: newComment[0].name,
        },
        isAuthor: true,
      },
    });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
    });
  }
});

module.exports = router;
