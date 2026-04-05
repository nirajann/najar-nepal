const express = require("express");
const Rating = require("../models/Rating.cjs");
const Leader = require("../models/Leader.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { leaderId, value, reaction, comment } = req.body;

    const leader = await Leader.findOne({ leaderId });
    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    const rating = await Rating.findOneAndUpdate(
      { userId: req.user.id, leaderId },
      {
        userId: req.user.id,
        leaderId,
        value,
        reaction,
        comment,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

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