const express = require("express");
const mongoose = require("mongoose");
const Leader = require("../models/Leader.cjs");
const District = require("../models/District.cjs");
const Rating = require("../models/Rating.cjs");
const Comment = require("../models/Comment.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");
const adminMiddleware = require("../middleware/adminMiddleware.cjs");

const router = express.Router();

function normalizeText(value = "") {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function slugify(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function buildLeaderId(name) {
  return slugify(name);
}

function parsePositions(rawValue) {
  if (!rawValue) return [];

  if (Array.isArray(rawValue)) {
    return rawValue
      .map((item) => ({
        title: item?.title?.trim() || "",
        type: item?.type?.trim() || "Other",
        institution: item?.institution?.trim() || "",
        ministry: item?.ministry?.trim() || "",
        portfolio: item?.portfolio?.trim() || "",
        status: item?.status === "Former" ? "Former" : "Current",
        fromDate: item?.fromDate || null,
        toDate: item?.toDate || null,
        sourceUrl: item?.sourceUrl?.trim() || "",
      }))
      .filter((item) => item.title);
  }

  return [];
}

function buildLeaderFilter(query) {
  const { role, districtId, province, search, currentStatus, verified } = query;
  const filter = {};

  if (role) filter.role = role;
  if (province) filter.province = province;
  if (currentStatus) filter.currentStatus = currentStatus;

  if (verified === "true") filter.verified = true;
  if (verified === "false") filter.verified = false;

  if (districtId) {
    if (mongoose.Types.ObjectId.isValid(districtId)) {
      filter.district = districtId;
    } else {
      filter.districtName = { $regex: districtId, $options: "i" };
    }
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { party: { $regex: search, $options: "i" } },
      { province: { $regex: search, $options: "i" } },
      { districtName: { $regex: search, $options: "i" } },
      { role: { $regex: search, $options: "i" } },
      { badge: { $regex: search, $options: "i" } },
      { currentOffice: { $regex: search, $options: "i" } },
      { portfolio: { $regex: search, $options: "i" } },
      { constituency: { $regex: search, $options: "i" } },
      { electionProcess: { $regex: search, $options: "i" } },
    ];
  }

  return filter;
}

function getCommentSort(sort = "newest") {
  if (sort === "liked") return { likes: -1, createdAt: -1 };
  if (sort === "lowest-rated") return { rating: 1, createdAt: -1 };
  if (sort === "highest-rated") return { rating: -1, createdAt: -1 };
  return { createdAt: -1 };
}

async function getLeaderStatsMap(leaderIds) {
  if (!Array.isArray(leaderIds) || leaderIds.length === 0) return {};

  const [ratingStats, commentStats] = await Promise.all([
    Rating.aggregate([
      { $match: { leaderId: { $in: leaderIds } } },
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
          ratingSum: { $sum: { $ifNull: ["$value", 0] } },
          ratingCount: { $sum: 1 },
        },
      },
    ]),
    Comment.aggregate([
      { $match: { leaderId: { $in: leaderIds } } },
      {
        $group: {
          _id: "$leaderId",
          comments: { $sum: 1 },
          replyCount: {
            $sum: {
              $size: { $ifNull: ["$replies", []] },
            },
          },
          commentLikes: { $sum: { $ifNull: ["$likes", 0] } },
          lastCommentAt: { $max: "$createdAt" },
        },
      },
    ]),
  ]);

  const statsMap = {};

  leaderIds.forEach((leaderId) => {
    statsMap[leaderId] = {
      likes: 0,
      dislikes: 0,
      totalReactions: 0,
      averageRating: 0,
      likePercentage: "0.0",
      dislikePercentage: "0.0",
      ratingCount: 0,
      comments: 0,
      replyCount: 0,
      commentLikes: 0,
      engagementScore: 0,
      lastCommentAt: null,
    };
  });

  ratingStats.forEach((item) => {
    const likes = item.likes || 0;
    const dislikes = item.dislikes || 0;
    const totalReactions = likes + dislikes;
    const ratingCount = item.ratingCount || 0;
    const averageRating =
      ratingCount > 0 ? Number((item.ratingSum / ratingCount).toFixed(1)) : 0;

    statsMap[item._id] = {
      ...(statsMap[item._id] || {}),
      likes,
      dislikes,
      totalReactions,
      averageRating,
      likePercentage:
        totalReactions > 0 ? ((likes / totalReactions) * 100).toFixed(1) : "0.0",
      dislikePercentage:
        totalReactions > 0 ? ((dislikes / totalReactions) * 100).toFixed(1) : "0.0",
      ratingCount,
    };
  });

  commentStats.forEach((item) => {
    const existing = statsMap[item._id] || {};
    const comments = item.comments || 0;
    const replyCount = item.replyCount || 0;
    const commentLikes = item.commentLikes || 0;

    statsMap[item._id] = {
      ...existing,
      comments,
      replyCount,
      commentLikes,
      lastCommentAt: item.lastCommentAt || null,
      engagementScore:
        (existing.likes || 0) +
        (existing.ratingCount || 0) +
        comments +
        replyCount +
        commentLikes -
        (existing.dislikes || 0),
    };
  });

  Object.keys(statsMap).forEach((leaderId) => {
    const stats = statsMap[leaderId];
    if (stats.engagementScore) return;

    statsMap[leaderId] = {
      ...stats,
      engagementScore:
        (stats.likes || 0) +
        (stats.ratingCount || 0) +
        (stats.comments || 0) +
        (stats.replyCount || 0) +
        (stats.commentLikes || 0) -
        (stats.dislikes || 0),
    };
  });

  return statsMap;
}

function buildRankingSummaryItem(leader, statsMap) {
  return {
    ...leader.toObject(),
    stats: statsMap[leader.leaderId] || {
      likes: 0,
      dislikes: 0,
      totalReactions: 0,
      averageRating: 0,
      likePercentage: "0.0",
      dislikePercentage: "0.0",
      ratingCount: 0,
      comments: 0,
      replyCount: 0,
      commentLikes: 0,
      engagementScore: 0,
      lastCommentAt: null,
    },
  };
}

async function syncDistrictLeaderLinks(leaderDoc, previousLeader = null) {
  if (!leaderDoc) return;

  const previousId = previousLeader?._id ? String(previousLeader._id) : null;
  const currentId = String(leaderDoc._id);

  if (previousLeader?.district && String(previousLeader.district) !== String(leaderDoc.district || "")) {
    await District.updateMany(
      { _id: previousLeader.district },
      {
        $pull: {
          mpLeaders: previousLeader._id,
          ministerLeaders: previousLeader._id,
          naLeaders: previousLeader._id,
        },
      }
    );
  }

  if (!leaderDoc.district) return;

  const update = {
    $pull: {
      mpLeaders: leaderDoc._id,
      ministerLeaders: leaderDoc._id,
      naLeaders: leaderDoc._id,
    },
  };

  await District.updateOne({ _id: leaderDoc.district }, update);

  const addUpdate = {};

  if (leaderDoc.role === "MP") {
    addUpdate.$addToSet = { ...(addUpdate.$addToSet || {}), mpLeaders: leaderDoc._id };
  }

  if (leaderDoc.role === "Minister" || leaderDoc.role === "Prime Minister") {
    addUpdate.$addToSet = {
      ...(addUpdate.$addToSet || {}),
      ministerLeaders: leaderDoc._id,
    };
  }

  if (leaderDoc.role === "National Assembly Member") {
    addUpdate.$addToSet = {
      ...(addUpdate.$addToSet || {}),
      naLeaders: leaderDoc._id,
    };
  }

  if (Object.keys(addUpdate).length > 0) {
    await District.updateOne({ _id: leaderDoc.district }, addUpdate);
  }

  if (previousId && previousId !== currentId) {
    await District.updateMany(
      {},
      {
        $pull: {
          mpLeaders: previousLeader._id,
          ministerLeaders: previousLeader._id,
          naLeaders: previousLeader._id,
        },
      }
    );
  }
}

// Duplicate check
router.get("/check-duplicate", async (req, res) => {
  try {
    const { name = "", districtId = "" } = req.query;

    if (!name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const normalizedName = normalizeText(name);
    const filter = {
      normalizedName: { $regex: normalizedName, $options: "i" },
    };

    if (districtId && mongoose.Types.ObjectId.isValid(districtId)) {
      filter.district = districtId;
    }

    const matches = await Leader.find(filter)
      .populate("district", "name province districtId")
      .sort({ name: 1 })
      .limit(10);

    const exactMatch = matches.some(
      (leader) =>
        leader.normalizedName === normalizedName &&
        (!districtId || String(leader.district?._id || "") === String(districtId))
    );

    res.json({ exactMatch, matches });
  } catch (error) {
    res.status(500).json({
      message: "Failed to check duplicate leader",
      error: error.message,
    });
  }
});

// Get all leaders
router.get("/", async (req, res) => {
  try {
    const filter = buildLeaderFilter(req.query);

    const leaders = await Leader.find(filter)
      .populate("district", "name province districtId")
      .sort({ createdAt: -1 });

    res.json(leaders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch leaders",
      error: error.message,
    });
  }
});

// Get ranking summary
router.get("/ranking-summary", async (req, res) => {
  try {
    const filter = buildLeaderFilter(req.query);
    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);

    const leaders = await Leader.find(filter)
      .populate("district", "name province districtId")
      .limit(limit);

    const statsMap = await getLeaderStatsMap(leaders.map((leader) => leader.leaderId));

    const rankedLeaders = leaders
      .map((leader) => buildRankingSummaryItem(leader, statsMap))
      .sort((a, b) => b.stats.engagementScore - a.stats.engagementScore);

    res.json({
      leaders: rankedLeaders,
      total: rankedLeaders.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load ranking summary",
      error: error.message,
    });
  }
});

// Get one leader public profile bundle
router.get("/:leaderId/public-profile", async (req, res) => {
  try {
    const { leaderId } = req.params;
    const commentSort = typeof req.query.sort === "string" ? req.query.sort : "newest";
    const commentLimit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

    const leader = await Leader.findOne({ leaderId }).populate(
      "district",
      "name province districtId localLevels"
    );

    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    const [statsMap, comments] = await Promise.all([
      getLeaderStatsMap([leader.leaderId]),
      Comment.find({ leaderId }).sort(getCommentSort(commentSort)).limit(commentLimit),
    ]);

    res.json({
      leader,
      stats: statsMap[leader.leaderId] || null,
      comments,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch leader profile",
      error: error.message,
    });
  }
});

// Get one leader
router.get("/:leaderId", async (req, res) => {
  try {
    const leader = await Leader.findOne({ leaderId: req.params.leaderId }).populate(
      "district",
      "name province districtId localLevels"
    );

    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    res.json(leader);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch leader",
      error: error.message,
    });
  }
});

// Create leader
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const payload = { ...req.body };

    if (!payload.name?.trim()) {
      return res.status(400).json({ message: "Leader name is required" });
    }

    if (!payload.role?.trim()) {
      return res.status(400).json({ message: "Leader role is required" });
    }

    let districtDoc = null;

    if (payload.district) {
      districtDoc = await District.findOne({
        $or: [
          { districtId: payload.district },
          {
            _id: mongoose.Types.ObjectId.isValid(payload.district)
              ? payload.district
              : null,
          },
        ],
      });

      if (!districtDoc) {
        return res.status(400).json({ message: "Selected district does not exist" });
      }

      payload.district = districtDoc._id;
      payload.districtName = districtDoc.name;
      payload.province = districtDoc.province;
    } else {
      payload.district = null;
      payload.districtName = payload.districtName?.trim() || "";
    }

    payload.positions = parsePositions(payload.positions);
    payload.leaderId = payload.leaderId?.trim() || buildLeaderId(payload.name);
    payload.slug = payload.slug?.trim() || slugify(payload.name);

    const duplicate = await Leader.findOne({
      normalizedName: normalizeText(payload.name),
      district: payload.district || null,
    });

    if (duplicate) {
      return res.status(409).json({
        message: "A similar leader already exists for this district",
        existingLeader: duplicate,
      });
    }

    const leader = await Leader.create(payload);
    await syncDistrictLeaderLinks(leader);

    const populatedLeader = await Leader.findById(leader._id).populate(
      "district",
      "name province districtId"
    );

    res.status(201).json({
      message: "Leader created successfully",
      leader: populatedLeader,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Leader ID, slug, or duplicate combination already exists",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to create leader",
      error: error.message,
    });
  }
});

// Update leader
router.put("/:leaderId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const existing = await Leader.findOne({ leaderId: req.params.leaderId });

    if (!existing) {
      return res.status(404).json({ message: "Leader not found" });
    }

    const payload = { ...req.body };

    if (payload.name !== undefined && !payload.name.trim()) {
      return res.status(400).json({ message: "Leader name cannot be empty" });
    }

    if (payload.district) {
      const districtDoc = await District.findOne({
        $or: [
          { districtId: payload.district },
          {
            _id: mongoose.Types.ObjectId.isValid(payload.district)
              ? payload.district
              : null,
          },
        ],
      });

      if (!districtDoc) {
        return res.status(400).json({ message: "Selected district does not exist" });
      }

      payload.district = districtDoc._id;
      payload.districtName = districtDoc.name;
      payload.province = districtDoc.province;
    } else if (payload.district === null || payload.district === "") {
      payload.district = null;
      payload.districtName = "";
    }

    if (payload.positions !== undefined) {
      payload.positions = parsePositions(payload.positions);
    }

    const nextName = payload.name ?? existing.name;
    const nextDistrict = payload.district ?? existing.district;

    const duplicate = await Leader.findOne({
      _id: { $ne: existing._id },
      normalizedName: normalizeText(nextName),
      district: nextDistrict || null,
    });

    if (duplicate) {
      return res.status(409).json({
        message: "Another leader with similar name and district already exists",
        existingLeader: duplicate,
      });
    }

    const updated = await Leader.findOneAndUpdate(
      { leaderId: req.params.leaderId },
      payload,
      { new: true, runValidators: true }
    ).populate("district", "name province districtId");

    await syncDistrictLeaderLinks(updated, existing);

    res.json({
      message: "Leader updated successfully",
      leader: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update leader",
      error: error.message,
    });
  }
});

// Delete leader
router.delete("/:leaderId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const leader = await Leader.findOneAndDelete({ leaderId: req.params.leaderId });

    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    await District.updateMany(
      {},
      {
        $pull: {
          mpLeaders: leader._id,
          ministerLeaders: leader._id,
          naLeaders: leader._id,
        },
      }
    );

    res.json({
      message: "Leader deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete leader",
      error: error.message,
    });
  }
});

module.exports = router;