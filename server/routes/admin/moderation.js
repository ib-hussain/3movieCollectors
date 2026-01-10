// Admin Content Moderation Routes
const express = require("express");
const router = express.Router();
const db = require("../../db");

// ==================== FLAGGED CONTENT MANAGEMENT ====================

// GET /api/admin/moderation/flags - Get all flagged content with filters
router.get("/flags", async (req, res) => {
  try {
    const {
      status = "pending", // pending, dismissed, deleted
      contentType, // post, review, comment
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        fc.flagID,
        fc.contentType,
        fc.contentID,
        fc.flaggedDate,
        fc.status,
        fc.isHidden,
        fc.matchedWord,
        CASE 
          WHEN fc.contentType = 'Post' THEN (SELECT SUBSTRING(p.postContent, 1, 200) FROM Post p WHERE p.postID = fc.contentID)
          WHEN fc.contentType = 'Comment' THEN (SELECT SUBSTRING(c.commentContent, 1, 200) FROM Comments c WHERE c.commentID = fc.contentID)
          WHEN fc.contentType = 'Review' THEN (
            SELECT SUBSTRING(rr.review, 1, 200) 
            FROM ReviewRatings rr 
            WHERE CONCAT(rr.movieID, '-', rr.userID) = fc.contentID
          )
          ELSE 'No preview available'
        END as contentPreview
      FROM FlaggedContent fc
      WHERE fc.status = ?
    `;

    const params = [status];

    if (contentType) {
      query += ` AND fc.contentType = ?`;
      params.push(contentType);
    }

    query += ` ORDER BY fc.flaggedDate DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const flags = await db.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM FlaggedContent WHERE status = ?`;
    const countParams = [status];
    if (contentType) {
      countQuery += ` AND contentType = ?`;
      countParams.push(contentType);
    }
    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      flags,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Get flagged content error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve flagged content",
      error: error.message,
    });
  }
});

// GET /api/admin/moderation/flags/:flagID - Get single flag details
router.get("/flags/:flagID", async (req, res) => {
  try {
    const { flagID } = req.params;
    const adminID = req.session.userId;

    const flags = await db.query(
      `
      SELECT 
        fc.*,
        u.userID,
        u.username,
        u.email
      FROM FlaggedContent fc
      LEFT JOIN User u ON u.userID = fc.flaggedBy
      WHERE fc.flagID = ?
    `,
      [flagID]
    );

    if (flags.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Flag not found",
      });
    }

    const flag = flags[0];

    // Fetch the actual content based on content type
    let contentData = null;
    try {
      console.log(
        `Fetching content for flag ${flagID}, type: ${flag.contentType}, contentID: ${flag.contentID}`
      );

      if (flag.contentType === "Post") {
        const posts = await db.query(
          `SELECT p.postID, p.postContent, p.createdAt, u.username as authorUsername, u.userID as authorID
           FROM Post p
           LEFT JOIN User u ON p.userID = u.userID
           WHERE p.postID = ?`,
          [flag.contentID]
        );
        contentData = posts.length > 0 ? posts[0] : null;
        console.log(`Post content found:`, contentData ? "Yes" : "No");
      } else if (flag.contentType === "Comment") {
        const comments = await db.query(
          `SELECT c.commentID, c.commentContent, c.createdAt, u.username as authorUsername, u.userID as authorID
           FROM Comments c
           LEFT JOIN User u ON c.userID = u.userID
           WHERE c.commentID = ?`,
          [flag.contentID]
        );
        contentData = comments.length > 0 ? comments[0] : null;
        console.log(`Comment content found:`, contentData ? "Yes" : "No");
      } else if (flag.contentType === "Review") {
        // Review contentID is in format "movieID-userID"
        const [movieID, userID] = flag.contentID.split("-");
        const reviews = await db.query(
          `SELECT rr.rating, rr.review, rr.reviewDate, u.username as authorUsername, u.userID as authorID, m.title as movieTitle
           FROM ReviewRatings rr
           LEFT JOIN User u ON rr.userID = u.userID
           LEFT JOIN Movie m ON rr.movieID = m.movieID
           WHERE rr.movieID = ? AND rr.userID = ?`,
          [movieID, userID]
        );
        contentData = reviews.length > 0 ? reviews[0] : null;
        console.log(`Review content found:`, contentData ? "Yes" : "No");
      }

      if (contentData) {
        console.log("Content data keys:", Object.keys(contentData));
      }
    } catch (contentError) {
      console.error("Error fetching content:", contentError);
      // Continue even if content fetch fails
    }

    // Add content to flag object
    flag.fullContent = contentData;
    console.log(
      "Flag response includes fullContent:",
      flag.fullContent ? "Yes" : "No"
    );

    // Log view of restricted content to AuditLog
    await db.query(
      `
      INSERT INTO AuditLog (
        adminID, 
        operationPerformed, 
        targetTable, 
        targetRecordID, 
        actionDetails
      ) VALUES (?, 'VIEW RESTRICTED CONTENT', 'FlaggedContent', ?, ?)
    `,
      [
        adminID,
        flagID,
        `Viewed ${flag.contentType} (ID: ${flag.contentID}) - Matched word: ${
          flag.matchedWord || "N/A"
        }`,
      ]
    );

    res.json({
      success: true,
      flag: flag,
    });
  } catch (error) {
    console.error("Get flag details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve flag details",
      error: error.message,
    });
  }
});

// PUT /api/admin/moderation/flags/:flagID/dismiss - Dismiss a flag
router.put("/flags/:flagID/dismiss", async (req, res) => {
  try {
    const { flagID } = req.params;
    const { reason } = req.body;
    const adminID = req.session.userId;

    // Call stored procedure to dismiss flag
    await db.query(`CALL sp_dismiss_flag(?, ?, ?, ?, ?)`, [
      flagID,
      adminID,
      reason || "Dismissed by admin",
      req.ip || req.connection.remoteAddress,
      req.get("user-agent") || "Unknown",
    ]);

    res.json({
      success: true,
      message: "Flag dismissed successfully",
    });
  } catch (error) {
    console.error("Dismiss flag error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to dismiss flag",
      error: error.message,
    });
  }
});

// DELETE /api/admin/moderation/flags/:flagID/content - Delete flagged content
router.delete("/flags/:flagID/content", async (req, res) => {
  try {
    const { flagID } = req.params;
    const { reason } = req.body;
    const adminID = req.session.userId;

    // Call stored procedure to delete flagged content
    await db.query(`CALL sp_delete_flagged_content(?, ?, ?, ?, ?, ?)`, [
      flagID,
      adminID,
      reason || "Content violation",
      true, // notifyUser
      req.ip || req.connection.remoteAddress,
      req.get("user-agent") || "Unknown",
    ]);

    res.json({
      success: true,
      message: "Content deleted successfully",
    });
  } catch (error) {
    console.error("Delete flagged content error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete content",
      error: error.message,
    });
  }
});

// POST /api/admin/moderation/rescan - Rescan all content for all restricted words
router.post("/rescan", async (req, res) => {
  try {
    const adminID = req.session.userId;

    // Get all restricted words
    const restrictedWords = await db.query(
      `SELECT word FROM RestrictedWords ORDER BY word`
    );

    if (restrictedWords.length === 0) {
      return res.json({
        success: true,
        message: "No restricted words to scan for",
        newFlags: 0,
        scannedContent: 0,
      });
    }

    let totalNewFlags = 0;
    let totalScanned = 0;

    // Scan Posts
    for (const { word } of restrictedWords) {
      const posts = await db.query(
        `
        SELECT p.postID, p.postContent, p.userID
        FROM Post p
        LEFT JOIN FlaggedContent fc ON fc.contentType = 'Post' AND fc.contentID = p.postID
        WHERE LOWER(p.postContent) LIKE CONCAT('%', LOWER(?), '%')
          AND fc.flagID IS NULL
      `,
        [word]
      );

      for (const post of posts) {
        await db.query(
          `
          INSERT INTO FlaggedContent (contentType, contentID, status, matchedWord, isHidden)
          VALUES ('Post', ?, 'pending', ?, TRUE)
        `,
          [post.postID, word]
        );
        totalNewFlags++;
      }
      totalScanned += posts.length;
    }

    // Scan Comments
    for (const { word } of restrictedWords) {
      const comments = await db.query(
        `
        SELECT c.commentID, c.commentContent, c.userID
        FROM Comments c
        LEFT JOIN FlaggedContent fc ON fc.contentType = 'Comment' AND fc.contentID = c.commentID
        WHERE LOWER(c.commentContent) LIKE CONCAT('%', LOWER(?), '%')
          AND fc.flagID IS NULL
      `,
        [word]
      );

      for (const comment of comments) {
        await db.query(
          `
          INSERT INTO FlaggedContent (contentType, contentID, status, matchedWord, isHidden)
          VALUES ('Comment', ?, 'pending', ?, TRUE)
        `,
          [comment.commentID, word]
        );
        totalNewFlags++;
      }
      totalScanned += comments.length;
    }

    // Scan Reviews
    for (const { word } of restrictedWords) {
      const reviews = await db.query(
        `
        SELECT r.movieID, r.userID, r.review
        FROM ReviewRatings r
        LEFT JOIN FlaggedContent fc ON fc.contentType = 'Review' 
          AND fc.contentID = CONCAT(r.movieID, '-', r.userID)
        WHERE LOWER(r.review) LIKE CONCAT('%', LOWER(?), '%')
          AND fc.flagID IS NULL
      `,
        [word]
      );

      for (const review of reviews) {
        await db.query(
          `
          INSERT INTO FlaggedContent (contentType, contentID, status, matchedWord, isHidden)
          VALUES ('Review', ?, 'pending', ?, TRUE)
        `,
          [`${review.movieID}-${review.userID}`, word]
        );
        totalNewFlags++;
      }
      totalScanned += reviews.length;
    }

    res.json({
      success: true,
      message: `Rescan completed. Scanned ${totalScanned} items, created ${totalNewFlags} new flags.`,
      newFlags: totalNewFlags,
      scannedContent: totalScanned,
    });
  } catch (error) {
    console.error("Rescan content error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to rescan content",
      error: error.message,
    });
  }
});

// GET /api/admin/moderation/stats - Get moderation statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as totalFlags,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingFlags,
        SUM(CASE WHEN status = 'dismissed' AND DATE(reviewedDate) = CURDATE() THEN 1 ELSE 0 END) as dismissedToday,
        SUM(CASE WHEN status = 'resolved' AND DATE(reviewedDate) = CURDATE() THEN 1 ELSE 0 END) as deletedToday,
        SUM(CASE WHEN isHidden = 1 THEN 1 ELSE 0 END) as hiddenContent
      FROM FlaggedContent
    `);

    const recentActivity = await db.query(
      `
      SELECT 
        flagID,
        contentType,
        flaggedDate,
        status
      FROM FlaggedContent
      ORDER BY flaggedDate DESC
      LIMIT 10
    `
    );

    res.json({
      success: true,
      stats: stats[0],
      recentActivity,
    });
  } catch (error) {
    console.error("Get moderation stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve statistics",
      error: error.message,
    });
  }
});

module.exports = router;
