const express = require("express");
const mongoose = require("mongoose");

const Leader = require("../models/Leader.cjs");
const District = require("../models/District.cjs");
const Rating = require("../models/Rating.cjs");
const Comment = require("../models/Comment.cjs");

const authMiddleware = require("../middleware/authMiddleware.cjs");
const adminMiddleware = require("../middleware/adminMiddleware.cjs");

const router = express.Router();

function normalizeText(v = "") {
  return v.toLowerCase().trim().replace(/\s+/g, " ");
}

function slugify(v = "") {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function buildLeaderId(name) {
  return slugify(name);
}

function parsePositions(raw = []) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((p) => ({
      title: String(p.title || "").trim(),
      type: String(p.type || "Other").trim(),
      institution: String(p.institution || "").trim(),
      ministry: String(p.ministry || "").trim(),
      portfolio: String(p.portfolio || "").trim(),
      status: p.status === "Former" ? "Former" : "Current",
      fromDate: p.fromDate || null,
      toDate: p.toDate || null,
      sourceUrl: String(p.sourceUrl || "").trim(),
    }))
    .filter((x) => x.title);
}

function getCommentSort(sort = "newest") {
  if (sort === "liked") return { likes: -1, createdAt: -1 };
  if (sort === "highest-rated") return { rating: -1, createdAt: -1 };
  if (sort === "lowest-rated") return { rating: 1, createdAt: -1 };
  return { createdAt: -1 };
}

function buildFilter(query) {
  const filter = {};

  if (query.role) filter.role = query.role;
  if (query.province) filter.province = query.province;
  if (query.currentStatus) filter.currentStatus = query.currentStatus;

  if (query.verified === "true") filter.verified = true;
  if (query.verified === "false") filter.verified = false;

  if (query.search) {
    const regex = new RegExp(query.search, "i");

    filter.$or = [
      { name: regex },
      { party: regex },
      { province: regex },
      { districtName: regex },
      { role: regex },
      { currentOffice: regex },
    ];
  }

  return filter;
}

function populateLeader(query) {
  return query.populate("district", "name province districtId localLevels");
}

async function syncDistrictLinks(leader, session) {
  await District.updateMany(
    {},
    {
      $pull: {
        mpLeaders: leader._id,
        ministerLeaders: leader._id,
        naLeaders: leader._id,
      },
    }
  ).session(session);

  if (!leader.district) return;

  let field = null;

  if (leader.role === "MP") field = "mpLeaders";
  if (leader.role === "Minister" || leader.role === "Prime Minister")
    field = "ministerLeaders";
  if (leader.role === "National Assembly Member")
    field = "naLeaders";

  if (field) {
    await District.updateOne(
      { _id: leader.district },
      { $addToSet: { [field]: leader._id } }
    ).session(session);
  }
}

async function getStatsMap(leaderIds) {
  if (!leaderIds.length) return {};

  const [ratings, comments] = await Promise.all([
    Rating.aggregate([
      { $match: { leaderId: { $in: leaderIds } } },
      {
        $group: {
          _id: "$leaderId",
          likes: {
            $sum: { $cond: [{ $eq: ["$reaction", "like"] }, 1, 0] },
          },
          dislikes: {
            $sum: { $cond: [{ $eq: ["$reaction", "dislike"] }, 1, 0] },
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
          likes: { $sum: { $ifNull: ["$likes", 0] } },
        },
      },
    ]),
  ]);

  const map = {};

  leaderIds.forEach((id) => {
    map[id] = {
      likes: 0,
      dislikes: 0,
      comments: 0,
      averageRating: 0,
      engagementScore: 0,
    };
  });

  ratings.forEach((r) => {
    map[r._id] = {
      ...map[r._id],
      likes: r.likes,
      dislikes: r.dislikes,
      averageRating:
        r.ratingCount > 0
          ? Number((r.ratingSum / r.ratingCount).toFixed(1))
          : 0,
    };
  });

  comments.forEach((c) => {
    map[c._id] = {
      ...map[c._id],
      comments: c.comments,
    };
  });

  Object.keys(map).forEach((id) => {
    const s = map[id];
    s.engagementScore =
      s.likes + s.comments + s.averageRating - s.dislikes;
  });

  return map;
}

/* DUPLICATE CHECK */
router.get("/check-duplicate", async (req, res) => {
  try {
    const name = String(req.query.name || "").trim();

    if (!name) {
      return res.status(400).json({ message: "Name required" });
    }

    const normalizedName = normalizeText(name);

    const rows = await Leader.find({
      normalizedName,
    })
      .limit(10)
      .select("name leaderId districtName role");

    res.json({
      exactMatch: rows.length > 0,
      matches: rows,
    });
  } catch {
    res.status(500).json({ message: "Duplicate check failed" });
  }
});

/* GET ALL */
router.get("/", async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const filter = buildFilter(req.query);
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      populateLeader(
        Leader.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
      ),
      Leader.countDocuments(filter),
    ]);

    res.json({
      rows,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch leaders" });
  }
});

/* RANKING */
router.get("/ranking-summary", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 300);

    const leaders = await populateLeader(
      Leader.find(buildFilter(req.query)).limit(limit)
    );

    const statsMap = await getStatsMap(
      leaders.map((x) => x.leaderId)
    );

    const ranked = leaders
      .map((leader) => ({
        ...leader.toObject(),
        stats: statsMap[leader.leaderId] || {},
      }))
      .sort(
        (a, b) =>
          (b.stats.engagementScore || 0) -
          (a.stats.engagementScore || 0)
      );

    res.json({
      leaders: ranked,
      total: ranked.length,
      generatedAt: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({ message: "Ranking failed" });
  }
});

/* PUBLIC PROFILE */
router.get("/:leaderId/public-profile", async (req, res) => {
  try {
    const leader = await populateLeader(
      Leader.findOne({ leaderId: req.params.leaderId })
    );

    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    const limit = Math.min(Number(req.query.limit) || 30, 100);

    const [statsMap, comments] = await Promise.all([
      getStatsMap([leader.leaderId]),
      Comment.find({ leaderId: leader.leaderId })
        .sort(getCommentSort(req.query.sort))
        .limit(limit),
    ]);

    res.json({
      leader,
      stats: statsMap[leader.leaderId],
      comments,
      generatedAt: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

/* GET ONE */
router.get("/:leaderId", async (req, res) => {
  try {
    const leader = await populateLeader(
      Leader.findOne({ leaderId: req.params.leaderId })
    );

    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    res.json(leader);
  } catch {
    res.status(500).json({ message: "Failed to fetch leader" });
  }
});

/* CREATE */
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const payload = { ...req.body };

    if (!payload.name?.trim()) {
      throw new Error("Leader name required");
    }

    if (!payload.role?.trim()) {
      throw new Error("Leader role required");
    }

    payload.name = payload.name.trim();
    payload.normalizedName = normalizeText(payload.name);
    payload.slug = slugify(payload.name);
    payload.leaderId =
      payload.leaderId?.trim() || buildLeaderId(payload.name);

    payload.positions = parsePositions(payload.positions);

    if (payload.district) {
      const district = await District.findOne({
        $or: [
          { districtId: payload.district },
          { _id: payload.district },
        ],
      }).session(session);

      if (!district) throw new Error("District not found");

      payload.district = district._id;
      payload.districtName = district.name;
      payload.province = district.province;
    } else {
      payload.district = null;
    }

    const duplicate = await Leader.findOne({
      normalizedName: payload.normalizedName,
      district: payload.district,
    }).session(session);

    if (duplicate) {
      return res.status(409).json({
        message: "Duplicate leader exists",
      });
    }

    const created = await Leader.create([payload], { session });
    const leader = created[0];

    await syncDistrictLinks(leader, session);

    await session.commitTransaction();

    const finalLeader = await populateLeader(
      Leader.findById(leader._id)
    );

    res.status(201).json({
      message: "Leader created",
      leader: finalLeader,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: error.message || "Create failed",
    });
  } finally {
    session.endSession();
  }
});

/* UPDATE */
router.put("/:leaderId", authMiddleware, adminMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existing = await Leader.findOne({
      leaderId: req.params.leaderId,
    }).session(session);

    if (!existing) {
      return res.status(404).json({ message: "Leader not found" });
    }

    const payload = { ...req.body };

    if (payload.name) {
      payload.normalizedName = normalizeText(payload.name);
      payload.slug = slugify(payload.name);
    }

    if (payload.positions) {
      payload.positions = parsePositions(payload.positions);
    }

    if (payload.district !== undefined) {
      if (!payload.district) {
        payload.district = null;
        payload.districtName = "";
      } else {
        const district = await District.findOne({
          $or: [
            { districtId: payload.district },
            { _id: payload.district },
          ],
        }).session(session);

        if (!district) throw new Error("District not found");

        payload.district = district._id;
        payload.districtName = district.name;
        payload.province = district.province;
      }
    }

    const updated = await Leader.findOneAndUpdate(
      { leaderId: req.params.leaderId },
      payload,
      {
        new: true,
        runValidators: true,
        session,
      }
    );

    await syncDistrictLinks(updated, session);

    await session.commitTransaction();

    const finalLeader = await populateLeader(
      Leader.findById(updated._id)
    );

    res.json({
      message: "Leader updated",
      leader: finalLeader,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: error.message || "Update failed",
    });
  } finally {
    session.endSession();
  }
});

/* DELETE */
router.delete("/:leaderId", authMiddleware, adminMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const leader = await Leader.findOneAndDelete({
      leaderId: req.params.leaderId,
    }).session(session);

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
    ).session(session);

    await session.commitTransaction();

    res.json({
      message: "Leader deleted",
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: "Delete failed",
    });
  } finally {
    session.endSession();
  }
});

module.exports = router;