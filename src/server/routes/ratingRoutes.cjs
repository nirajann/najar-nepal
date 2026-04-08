const express = require("express");
const Rating = require("../models/Rating.cjs");
const Leader = require("../models/Leader.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");
const { recordAnalyticsEvent } = require("../utils/analyticsEventLogger.cjs");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { leaderId, value, reaction, comment } = req.body;
    const numericValue = Number(value || 0);

    if (!leaderId || typeof leaderId !== "string") {
      return res.status(400).json({ message: "Leader ID is required" });
    }

    if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > 5) {
      return res.status(400).json({ message: "Rating value must be between 0 and 5" });
    }

    if (reaction && reaction !== "like" && reaction !== "dislike") {
      return res.status(400).json({ message: "Invalid reaction value" });
    }

    if (comment && typeof comment === "string" && comment.length > 300) {
      return res.status(400).json({ message: "Rating comment must be under 300 characters" });
    }

    const leader = await Leader.findOne({ leaderId });
    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    const rating = await Rating.findOneAndUpdate(
      { userId: req.user.id, leaderId },
      {
        userId: req.user.id,
        leaderId,
        value: numericValue,
        reaction,
        comment,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await recordAnalyticsEvent({
      eventName: "leader_rating_submitted",
      userId: req.user.id,
      entityType: "leader",
      entityId: leaderId,
      entityName: leader.name,
      sourcePage: typeof req.body?.sourcePage === "string" ? req.body.sourcePage : "leader_profile",
      metadata: {
        ratingValue: Number(value || 0),
        reaction: typeof reaction === "string" ? reaction : "",
      },
    });

    res.status(201).json({
      message: "Rating saved successfully",
      rating,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit rating", error: error.message });
  }
});

router.get("/:leaderId/stats", async (req, res) => {
  try {
    const { leaderId } = req.params;

    const leader = await Leader.findOne({ leaderId });
    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    const ratings = await Rating.find({ leaderId });

    const likes = ratings.filter((r) => r.reaction === "like").length;
    const dislikes = ratings.filter((r) => r.reaction === "dislike").length;
    const totalReactions = likes + dislikes;

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + (r.value || 0), 0) / ratings.length
        : 0;

    const likePercentage =
      totalReactions > 0 ? ((likes / totalReactions) * 100).toFixed(1) : "0.0";

    const dislikePercentage =
      totalReactions > 0 ? ((dislikes / totalReactions) * 100).toFixed(1) : "0.0";

    res.json({
      likes,
      dislikes,
      totalReactions,
      averageRating: Number(averageRating.toFixed(1)),
      likePercentage,
      dislikePercentage,
      ratingCount: ratings.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
});

module.exports = router;
