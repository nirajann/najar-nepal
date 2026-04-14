const express = require("express");
const Comment = require("../models/Comment.cjs");
const Leader = require("../models/Leader.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");
const { recordAnalyticsEvent } = require("../utils/analyticsEventLogger.cjs");

const router = express.Router();

router.get("/:leaderId", async (req, res) => {
  try {
    const { leaderId } = req.params;
    const { sort = "newest", limit = "50" } = req.query;
    const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

    const leader = await Leader.findOne({ leaderId });
    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    let sortOption = { createdAt: -1 };

    if (sort === "liked") {
      sortOption = { likes: -1, createdAt: -1 };
    } else if (sort === "lowest-rated") {
      sortOption = { rating: 1, createdAt: -1 };
    } else if (sort === "highest-rated") {
      sortOption = { rating: -1, createdAt: -1 };
    }

    const comments = await Comment.find({ leaderId }).sort(sortOption).limit(parsedLimit);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch comments", error: error.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { leaderId, text, rating } = req.body;
    const normalizedText = typeof text === "string" ? text.trim() : "";

    if (!leaderId || typeof leaderId !== "string") {
      return res.status(400).json({ message: "Leader ID is required" });
    }

    if (!normalizedText || normalizedText.length < 3) {
      return res.status(400).json({ message: "Comment text is too short" });
    }

    if (normalizedText.length > 300) {
      return res.status(400).json({ message: "Comment text must be under 300 characters" });
    }

    const leader = await Leader.findOne({ leaderId });
    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    const comment = await Comment.create({
      leaderId,
      userId: req.user.id,
      userName: req.user.name || "User",
      text: normalizedText,
      rating: Number(rating || 0),
    });

    await recordAnalyticsEvent({
      eventName: "leader_comment_submitted",
      userId: req.user.id,
      entityType: "leader",
      entityId: leaderId,
      entityName: leader.name,
      sourcePage: typeof req.body?.sourcePage === "string" ? req.body.sourcePage : "leader_profile",
      metadata: {
        hasRating: Number(rating || 0) > 0,
        textLength: typeof text === "string" ? text.length : 0,
      },
    });

    res.status(201).json({
      message: "Comment created successfully",
      comment,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create comment", error: error.message });
  }
});

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

router.post("/:commentId/reply", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const normalizedText = typeof text === "string" ? text.trim() : "";

    if (!normalizedText || normalizedText.length < 3) {
      return res.status(400).json({ message: "Reply is too short" });
    }

    if (normalizedText.length > 220) {
      return res.status(400).json({ message: "Reply must be under 220 characters" });
    }

    const comment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      {
        $push: {
          replies: {
            userId: req.user.id,
            userName: req.user.name || "User",
            text: normalizedText,
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
