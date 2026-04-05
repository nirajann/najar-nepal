const express = require("express");
const mongoose = require("mongoose");
const Leader = require("../models/Leader.cjs");
const District = require("../models/District.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");

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

function buildLeaderId(name, role) {
  return `${slugify(name)}-${slugify(role || "leader")}`;
}

// Duplicate check
router.get("/check-duplicate", async (req, res) => {
  try {
    const { name = "", role = "", districtId = "" } = req.query;

    if (!name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const normalizedName = normalizeText(name);

    const filter = {
      normalizedName: { $regex: normalizedName, $options: "i" },
    };

    if (role) {
      filter.role = role;
    }

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
        (!role || leader.role === role) &&
        (!districtId || String(leader.district?._id || "") === String(districtId))
    );

    res.json({
      exactMatch,
      matches,
    });
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
    const { role, districtId, province, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (districtId) filter.district = districtId;
    if (province) filter.province = province;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { party: { $regex: search, $options: "i" } },
        { province: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
        { badge: { $regex: search, $options: "i" } },
      ];
    }

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
router.post("/", authMiddleware, async (req, res) => {
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
          { _id: mongoose.Types.ObjectId.isValid(payload.district) ? payload.district : null },
        ],
      });

      if (!districtDoc) {
        return res.status(400).json({ message: "Selected district does not exist" });
      }

      payload.district = districtDoc._id;
      payload.province = districtDoc.province;
    } else {
      payload.district = null;
    }

    payload.leaderId = payload.leaderId?.trim() || buildLeaderId(payload.name, payload.role);
    payload.slug = slugify(payload.name);

    const duplicate = await Leader.findOne({
      normalizedName: normalizeText(payload.name),
      role: payload.role,
      district: payload.district || null,
    });

    if (duplicate) {
      return res.status(409).json({
        message: "A similar leader already exists for this role and district",
        existingLeader: duplicate,
      });
    }

    const leader = await Leader.create(payload);

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
router.put("/:leaderId", authMiddleware, async (req, res) => {
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
          { _id: mongoose.Types.ObjectId.isValid(payload.district) ? payload.district : null },
        ],
      });

      if (!districtDoc) {
        return res.status(400).json({ message: "Selected district does not exist" });
      }

      payload.district = districtDoc._id;
      payload.province = districtDoc.province;
    }

    const nextName = payload.name ?? existing.name;
    const nextRole = payload.role ?? existing.role;
    const nextDistrict = payload.district ?? existing.district;

    const duplicate = await Leader.findOne({
      _id: { $ne: existing._id },
      normalizedName: normalizeText(nextName),
      role: nextRole,
      district: nextDistrict || null,
    });

    if (duplicate) {
      return res.status(409).json({
        message: "Another leader with similar name, role, and district already exists",
        existingLeader: duplicate,
      });
    }

    const updated = await Leader.findOneAndUpdate(
      { leaderId: req.params.leaderId },
      payload,
      { new: true, runValidators: true }
    ).populate("district", "name province districtId");

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
router.delete("/:leaderId", authMiddleware, async (req, res) => {
  try {
    const leader = await Leader.findOneAndDelete({ leaderId: req.params.leaderId });

    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    await District.updateMany(
      {},
      {
        $unset: {
          mpLeader: leader._id,
          ministerLeader: leader._id,
        },
        $pull: {
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