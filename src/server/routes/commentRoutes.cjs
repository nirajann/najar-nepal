const express = require("express");
const Comment = require("../models/Comment.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");

const router = express.Router();

// Get comments for a leader
router.get("/:leaderId", async (req, res) => {
  try {
    const { leaderId } = req.params;
    const { sort = "newest" } = req.query;

    let sortOption = { createdAt: -1 };

    if (sort === "liked") {
      sortOption = { likes: -1, createdAt: -1 };
    } else if (sort === "lowest-rated") {
      sortOption = { rating: 1, createdAt: -1 };
    } else if (sort === "highest-rated") {
      sortOption = { rating: -1, createdAt: -1 };
    }

    const comments = await Comment.find({ leaderId }).sort(sortOption);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch comments", error: error.message });
  }
});

// Create comment
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { leaderId, text, rating } = req.body;

    const comment = await Comment.create({
      leaderId,
      userId: req.user.id,
      userName: req.user.name || "User",
      text,
      rating: rating || 0,
    });

    res.status(201).json({
      message: "Comment created successfully",
      comment,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create comment", error: error.message });
  }
});

// Like comment
router.post("/:commentId/like", authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json({
      message: "Comment liked successfully",
      comment,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to like comment", error: error.message });
  }
});

// Reply to comment
router.post("/:commentId/reply", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    const comment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      {
        $push: {
          replies: {
            userId: req.user.id,
            userName: req.user.name || "User",
            text,
          },
        },
      },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json({
      message: "Reply added successfully",
      comment,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to reply", error: error.message });
  }
});

module.exports = router;