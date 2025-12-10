// Admin Restricted Words Management Routes
const express = require("express");
const router = express.Router();
const db = require("../../db");

// ==================== RESTRICTED WORDS MANAGEMENT ====================

// GET /api/admin/restricted-words - Get all restricted words
router.get("/", async (req, res) => {
  try {
    const { severity, page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        wordID,
        word,
        severity,
        addedDate,
        lastScannedDate,
        flagCount
      FROM RestrictedWords
    `;

    const params = [];
    const countParams = [];

    if (severity) {
      query += ` WHERE severity = ?`;
      params.push(severity);
      countParams.push(severity);
    }

    query += ` ORDER BY addedDate DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const words = await db.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM RestrictedWords`;
    if (severity) {
      countQuery += ` WHERE severity = ?`;
    }
    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      words,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Get restricted words error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve restricted words",
      error: error.message,
    });
  }
});

// POST /api/admin/restricted-words - Add a new restricted word
router.post("/", async (req, res) => {
  try {
    const { word, severity = "medium" } = req.body;
    const adminID = req.session.userId;

    if (!word) {
      return res.status(400).json({
        success: false,
        message: "Word is required",
      });
    }

    if (!["low", "medium", "high"].includes(severity)) {
      return res.status(400).json({
        success: false,
        message: "Severity must be low, medium, or high",
      });
    }

    // Set admin context
    // Check if word already exists
    const existing = await db.query(
      `SELECT wordID FROM RestrictedWords WHERE word = ?`,
      [word.toLowerCase()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Word already exists in restricted list",
      });
    }

    // Add restricted word
    await db.query(
      `
      INSERT INTO RestrictedWords (word, severity)
      VALUES (?, ?)
    `,
      [word.toLowerCase(), severity]
    );

    res.json({
      success: true,
      message: `Restricted word "${word}" added successfully`,
    });
  } catch (error) {
    console.error("Add restricted word error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add restricted word",
      error: error.message,
    });
  }
});

// PUT /api/admin/restricted-words/:wordID - Update restricted word
router.put("/:wordID", async (req, res) => {
  try {
    const { wordID } = req.params;
    const { word, severity } = req.body;
    const adminID = req.session.userId;

    // Build update query
    const updates = [];
    const params = [];

    if (word !== undefined) {
      updates.push("word = ?");
      params.push(word.toLowerCase());
    }

    if (severity !== undefined) {
      if (!["low", "medium", "high"].includes(severity)) {
        return res.status(400).json({
          success: false,
          message: "Severity must be low, medium, or high",
        });
      }
      updates.push("severity = ?");
      params.push(severity);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    params.push(wordID);

    await db.query(
      `UPDATE RestrictedWords SET ${updates.join(", ")} WHERE wordID = ?`,
      params
    );

    res.json({
      success: true,
      message: "Restricted word updated successfully",
    });
  } catch (error) {
    console.error("Update restricted word error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update restricted word",
      error: error.message,
    });
  }
});

// DELETE /api/admin/restricted-words/:wordID - Delete restricted word
router.delete("/:wordID", async (req, res) => {
  try {
    const { wordID } = req.params;
    const adminID = req.session.userId;

    // Get word before deletion
    const words = await db.query(
      `SELECT word FROM RestrictedWords WHERE wordID = ?`,
      [wordID]
    );

    if (words.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Restricted word not found",
      });
    }

    // Delete word
    await db.query(`DELETE FROM RestrictedWords WHERE wordID = ?`, [wordID]);

    res.json({
      success: true,
      message: `Restricted word "${words[0].word}" deleted successfully`,
    });
  } catch (error) {
    console.error("Delete restricted word error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete restricted word",
      error: error.message,
    });
  }
});

// POST /api/admin/restricted-words/bulk-add - Bulk add restricted words
router.post("/bulk-add", async (req, res) => {
  try {
    const { words } = req.body; // Array of {word, severity}
    const adminID = req.session.userId;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Words array is required",
      });
    }

    let added = 0;
    let skipped = 0;

    for (const item of words) {
      // Handle both string and object formats
      const word =
        typeof item === "string"
          ? item.toLowerCase()
          : item.word?.toLowerCase();
      const severity =
        typeof item === "string" ? "medium" : item.severity || "medium";

      if (!word) continue;

      // Check if exists
      const existing = await db.query(
        `SELECT wordID FROM RestrictedWords WHERE word = ?`,
        [word]
      );

      if (existing.length === 0) {
        await db.query(
          `INSERT INTO RestrictedWords (word, severity) VALUES (?, ?)`,
          [word, severity]
        );
        added++;
      } else {
        skipped++;
      }
    }

    res.json({
      success: true,
      message: `Bulk add completed: ${added} added, ${skipped} skipped (duplicates)`,
      added,
      duplicates: skipped,
    });
  } catch (error) {
    console.error("Bulk add restricted words error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk add restricted words",
      error: error.message,
    });
  }
});

// GET /api/admin/restricted-words/stats - Get restricted words statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as totalWords,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as highSeverity,
        SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as mediumSeverity,
        SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as lowSeverity,
        MIN(addedDate) as oldestWord,
        MAX(addedDate) as newestWord
      FROM RestrictedWords
    `);

    res.json({
      success: true,
      stats: stats[0],
    });
  } catch (error) {
    console.error("Get restricted words stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve statistics",
      error: error.message,
    });
  }
});

module.exports = router;
