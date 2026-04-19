const express = require("express");
const Rating = require("../models/Rating.cjs");
const Leader = require("../models/Leader.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");
const adminMiddleware = require("../middleware/adminMiddleware.cjs");
const { recordAnalyticsEvent } = require("../utils/analyticsEventLogger.cjs");

const router = express.Router();

function cleanText(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function clampRating(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 1;
  return Math.min(Math.max(num, 1), 5);
}

function normalizeReaction(value = "") {
  const reaction = String(value || "").trim();
  if (reaction === "like" || reaction === "dislike") return reaction;
  return "";
}

async function ensureLeaderExists(leaderId) {
  if (!leaderId || typeof leaderId !== "string") return null;
  return Leader.findOne({ leaderId }).select("leaderId name");
}

/* CREATE OR UPDATE RATING */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const leaderId = typeof req.body?.leaderId === "string" ? req.body.leaderId.trim() : "";
    const value = clampRating(req.body?.value);
    const reaction = normalizeReaction(req.body?.reaction);
    const comment = cleanText(req.body?.comment).slice(0, 1000);

    if (!leaderId) {
      return res.status(400).json({ message: "Leader ID is required" });
    }

    const leader = await ensureLeaderExists(leaderId);
    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    const existing = await Rating.findOne({
      userId: req.user.id,
      leaderId,
      isDeleted: false,
    });

    const rating = await Rating.findOneAndUpdate(
      { userId: req.user.id, leaderId },
      {
        $set: {
          userId: req.user.id,
          leaderId,
          value,
          reaction,
          comment,
          status: "visible",
          isDeleted: false,
          deletedAt: null,
          isEdited: Boolean(existing),
          editedAt: existing ? new Date() : null,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    await recordAnalyticsEvent({
      eventName: "leader_rating_submitted",
      userId: req.user.id,
      entityType: "leader",
      entityId: leaderId,
      entityName: leader.name,
      sourcePage:
        typeof req.body?.sourcePage === "string"
          ? req.body.sourcePage
          : "leader_profile",
      metadata: {
        ratingValue: value,
        reaction,
        hasComment: Boolean(comment),
        commentLength: comment.length,
        isEdit: Boolean(existing),
      },
    });

    res.status(existing ? 200 : 201).json({
      message: existing ? "Rating updated successfully" : "Rating saved successfully",
      rating,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit rating",
      error: error.message,
    });
  }
});

/* GET MY RATING FOR A LEADER */
router.get("/:leaderId/my-rating", authMiddleware, async (req, res) => {
  try {
    const { leaderId } = req.params;

    const leader = await ensureLeaderExists(leaderId);
    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    const rating = await Rating.findOne({
      leaderId,
      userId: req.user.id,
      isDeleted: false,
    });

    res.json({
      rating: rating || null,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch your rating",
      error: error.message,
    });
  }
});

/* GET LEADER RATING STATS */
router.get("/:leaderId/stats", async (req, res) => {
  try {
    const { leaderId } = req.params;

    const leader = await ensureLeaderExists(leaderId);
    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    const stats = await Rating.aggregate([
      {
        $match: {
          leaderId,
          isDeleted: false,
          status: "visible",
        },
      },
      {
        $group: {
          _id: "$leaderId",
          likes: {
            $sum: {
              $cond: [{ $eq: ["$reaction", "like"] }, 1, 0],
            },
          },
          dislikes: {
            $sum: {
              $cond: [{ $eq: ["$reaction", "dislike"] }, 1, 0],
            },
          },
          ratingSum: { $sum: "$value" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    const result = stats[0] || {
      likes: 0,
      dislikes: 0,
      ratingSum: 0,
      ratingCount: 0,
    };

    const totalReactions = result.likes + result.dislikes;
    const averageRating =
      result.ratingCount > 0 ? result.ratingSum / result.ratingCount : 0;

    res.json({
      likes: result.likes,
      dislikes: result.dislikes,
      totalReactions,
      averageRating: Number(averageRating.toFixed(1)),
      likePercentage:
        totalReactions > 0 ? ((result.likes / totalReactions) * 100).toFixed(1) : "0.0",
      dislikePercentage:
        totalReactions > 0 ? ((result.dislikes / totalReactions) * 100).toFixed(1) : "0.0",
      ratingCount: result.ratingCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch stats",
      error: error.message,
    });
  }
});

/* SOFT DELETE OWN RATING */
router.delete("/:leaderId", authMiddleware, async (req, res) => {
  try {
    const { leaderId } = req.params;

    const leader = await ensureLeaderExists(leaderId);
    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    const rating = await Rating.findOneAndUpdate(
      {
        leaderId,
        userId: req.user.id,
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          status: "hidden",
        },
      },
      { new: true }
    );

    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    res.json({
      message: "Rating deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete rating",
      error: error.message,
    });
  }
});

/* ADMIN MODERATION */
router.patch("/:ratingId/moderate", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const allowedStatuses = ["visible", "hidden", "flagged"];
    const status = String(req.body?.status || "").trim();
    const moderationReason = cleanText(req.body?.moderationReason).slice(0, 300);

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid moderation status" });
    }

    const rating = await Rating.findByIdAndUpdate(
      req.params.ratingId,
      {
        $set: {
          status,
          moderationReason,
        },
      },
      { new: true }
    );

    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    res.json({
      message: "Rating moderation updated successfully",
      rating,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to moderate rating",
      error: error.message,
    });
  }
});

module.exports = router;