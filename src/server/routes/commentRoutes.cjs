const express = require("express");
const mongoose = require("mongoose");
const Comment = require("../models/Comment.cjs");
const Leader = require("../models/Leader.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");
const adminMiddleware = require("../middleware/adminMiddleware.cjs");
const { recordAnalyticsEvent } = require("../utils/analyticsEventLogger.cjs");

const router = express.Router();

function cleanText(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function getSortOption(sort = "newest") {
  if (sort === "liked") return { isPinned: -1, likes: -1, createdAt: -1 };
  if (sort === "lowest-rated") return { isPinned: -1, rating: 1, createdAt: -1 };
  if (sort === "highest-rated") return { isPinned: -1, rating: -1, createdAt: -1 };
  return { isPinned: -1, createdAt: -1 };
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(Math.max(num, min), max);
}

async function ensureLeaderExists(leaderId) {
  if (!leaderId || typeof leaderId !== "string") return null;
  return Leader.findOne({ leaderId }).select("leaderId name");
}

async function syncCommentCounters(commentId) {
  const comment = await Comment.findById(commentId).select("replies");
  if (!comment) return null;

  const replyCount = Array.isArray(comment.replies)
    ? comment.replies.filter((reply) => !reply.isDeleted).length
    : 0;

  return Comment.findByIdAndUpdate(
    commentId,
    { $set: { replyCount } },
    { new: true }
  );
}

/* GET COMMENTS BY LEADER */
router.get("/:leaderId", async (req, res) => {
  try {
    const { leaderId } = req.params;
    const sort = typeof req.query.sort === "string" ? req.query.sort : "newest";
    const page = clampNumber(req.query.page, 1, 100000, 1);
    const limit = clampNumber(req.query.limit, 1, 100, 20);

    const leader = await ensureLeaderExists(leaderId);
    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    const filter = {
      leaderId,
      status: "visible",
      isDeleted: false,
    };

    const skip = (page - 1) * limit;
    const sortOption = getSortOption(sort);

    const [rows, total] = await Promise.all([
      Comment.find(filter).sort(sortOption).skip(skip).limit(limit),
      Comment.countDocuments(filter),
    ]);

    res.json({
      rows,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        sort,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch comments",
      error: error.message,
    });
  }
});

/* CREATE COMMENT */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { leaderId } = req.body;
    const text = cleanText(req.body?.text);
    const rating = clampNumber(req.body?.rating, 0, 5, 0);

    if (!leaderId || typeof leaderId !== "string") {
      return res.status(400).json({ message: "Leader ID is required" });
    }

    if (!text || text.length < 3) {
      return res.status(400).json({ message: "Comment text is too short" });
    }

    if (text.length > 2000) {
      return res.status(400).json({ message: "Comment text must be under 2000 characters" });
    }

    const leader = await ensureLeaderExists(leaderId);
    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    const comment = await Comment.create({
      leaderId,
      userId: req.user.id,
      userName: req.user.name || "User",
      text,
      rating,
      status: "visible",
    });

    await recordAnalyticsEvent({
      eventName: "leader_comment_submitted",
      userId: req.user.id,
      entityType: "leader",
      entityId: leaderId,
      entityName: leader.name,
      sourcePage:
        typeof req.body?.sourcePage === "string"
          ? req.body.sourcePage
          : "leader_profile",
      metadata: {
        hasRating: rating > 0,
        textLength: text.length,
      },
    });

    res.status(201).json({
      message: "Comment created successfully",
      comment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create comment",
      error: error.message,
    });
  }
});

/* LIKE COMMENT */
router.post("/:commentId/like", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const comment = await Comment.findOneAndUpdate(
      {
        _id: req.params.commentId,
        isDeleted: false,
        status: "visible",
      },
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
    res.status(500).json({
      message: "Failed to like comment",
      error: error.message,
    });
  }
});

/* REPLY TO COMMENT */
router.post("/:commentId/reply", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const text = cleanText(req.body?.text);

    if (!text || text.length < 3) {
      return res.status(400).json({ message: "Reply is too short" });
    }

    if (text.length > 1000) {
      return res.status(400).json({ message: "Reply must be under 1000 characters" });
    }

    const comment = await Comment.findOneAndUpdate(
      {
        _id: req.params.commentId,
        isDeleted: false,
      },
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

    const updatedComment = await syncCommentCounters(comment._id);

    res.json({
      message: "Reply added successfully",
      comment: updatedComment || comment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to reply",
      error: error.message,
    });
  }
});

/* EDIT OWN COMMENT */
router.put("/:commentId", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const text = cleanText(req.body?.text);

    if (!text || text.length < 3) {
      return res.status(400).json({ message: "Comment text is too short" });
    }

    if (text.length > 2000) {
      return res.status(400).json({ message: "Comment text must be under 2000 characters" });
    }

    const comment = await Comment.findOneAndUpdate(
      {
        _id: req.params.commentId,
        userId: req.user.id,
        isDeleted: false,
      },
      {
        $set: {
          text,
          isEdited: true,
          editedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: "Comment not found or not allowed" });
    }

    res.json({
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update comment",
      error: error.message,
    });
  }
});

/* SOFT DELETE OWN COMMENT */
router.delete("/:commentId", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const comment = await Comment.findOneAndUpdate(
      {
        _id: req.params.commentId,
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

    if (!comment) {
      return res.status(404).json({ message: "Comment not found or not allowed" });
    }

    res.json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete comment",
      error: error.message,
    });
  }
});

/* ADMIN: PIN / UNPIN */
router.patch("/:commentId/pin", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const isPinned = Boolean(req.body?.isPinned);

    const comment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      { $set: { isPinned } },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json({
      message: isPinned ? "Comment pinned successfully" : "Comment unpinned successfully",
      comment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update pin status",
      error: error.message,
    });
  }
});

/* ADMIN: MODERATE */
router.patch("/:commentId/moderate", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const allowedStatuses = ["visible", "hidden", "flagged"];
    const status = String(req.body?.status || "").trim();
    const moderationReason = cleanText(req.body?.moderationReason).slice(0, 300);

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid moderation status" });
    }

    const comment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      {
        $set: {
          status,
          moderationReason,
        },
      },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json({
      message: "Comment moderation updated successfully",
      comment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to moderate comment",
      error: error.message,
    });
  }
});

module.exports = router;