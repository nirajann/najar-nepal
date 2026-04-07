const express = require("express");
const mongoose = require("mongoose");
const District = require("../models/District.cjs");
const Leader = require("../models/Leader.cjs");
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

function parseLocalLevels(rawValue) {
  if (!rawValue) return [];

  if (Array.isArray(rawValue)) {
    return rawValue
      .map((item) =>
        typeof item === "string"
          ? { name: item.trim(), type: "" }
          : { name: item.name?.trim() || "", type: item.type?.trim() || "" }
      )
      .filter((item) => item.name);
  }

  if (typeof rawValue === "string") {
    return rawValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((name) => ({ name, type: "" }));
  }

  return [];
}

async function validateLeaderRole(leaderId, allowedRoles) {
  if (!leaderId) return null;
  if (!mongoose.Types.ObjectId.isValid(leaderId)) return { error: "Invalid leader id" };

  const leader = await Leader.findById(leaderId);
  if (!leader) return { error: "Linked leader not found" };
  if (!allowedRoles.includes(leader.role)) {
    return { error: `Leader role must be one of: ${allowedRoles.join(", ")}` };
  }

  return { leader };
}

// Duplicate check
router.get("/check-duplicate", async (req, res) => {
  try {
    const { name = "", province = "" } = req.query;

    if (!name.trim()) {
      return res.status(400).json({ message: "District name is required" });
    }

    const matches = await District.find({
      normalizedName: { $regex: normalizeText(name), $options: "i" },
      ...(province ? { province } : {}),
    })
      .sort({ name: 1 })
      .limit(10);

    const exactMatch = matches.some(
      (district) =>
        district.normalizedName === normalizeText(name) &&
        (!province || district.province === province)
    );

    res.json({ exactMatch, matches });
  } catch (error) {
    res.status(500).json({
      message: "Failed to check duplicate district",
      error: error.message,
    });
  }
});

// Get all districts
router.get("/", async (req, res) => {
  try {
    const { province, search } = req.query;
    const filter = {};

    if (province) filter.province = province;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { province: { $regex: search, $options: "i" } },
        { districtId: { $regex: search, $options: "i" } },
      ];
    }

    const districts = await District.find(filter)
      .populate("mpLeader", "leaderId name role")
      .populate("ministerLeader", "leaderId name role")
      .populate("naLeaders", "leaderId name role")
      .sort({ name: 1 });

    res.json(districts);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch districts",
      error: error.message,
    });
  }
});

// Get one district
router.get("/:districtId", async (req, res) => {
  try {
    const district = await District.findOne({ districtId: req.params.districtId })
      .populate("mpLeader", "leaderId name role")
      .populate("ministerLeader", "leaderId name role")
      .populate("naLeaders", "leaderId name role");

    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    res.json(district);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch district",
      error: error.message,
    });
  }
});

// Create district
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const payload = { ...req.body };

    if (!payload.name?.trim()) {
      return res.status(400).json({ message: "District name is required" });
    }

    if (!payload.province?.trim()) {
      return res.status(400).json({ message: "Province is required" });
    }

    payload.districtId = payload.districtId?.trim() || slugify(payload.name);
    payload.slug = slugify(payload.name);
    payload.localLevels = parseLocalLevels(payload.localLevels || payload.localLevelsText);

    const duplicate = await District.findOne({
      normalizedName: normalizeText(payload.name),
      province: payload.province,
    });

    if (duplicate) {
      return res.status(409).json({
        message: "District with similar name already exists in this province",
        existingDistrict: duplicate,
      });
    }

    const mpValidation = await validateLeaderRole(payload.mpLeader, ["MP"]);
    if (mpValidation?.error) {
      return res.status(400).json({ message: mpValidation.error });
    }

    const ministerValidation = await validateLeaderRole(payload.ministerLeader, [
      "Minister",
      "Prime Minister",
    ]);
    if (ministerValidation?.error) {
      return res.status(400).json({ message: ministerValidation.error });
    }

    if (Array.isArray(payload.naLeaders)) {
      for (const leaderId of payload.naLeaders) {
        const naValidation = await validateLeaderRole(leaderId, ["National Assembly Member"]);
        if (naValidation?.error) {
          return res.status(400).json({ message: naValidation.error });
        }
      }
    }

    const district = await District.create(payload);

    const populatedDistrict = await District.findById(district._id)
      .populate("mpLeader", "leaderId name role")
      .populate("ministerLeader", "leaderId name role")
      .populate("naLeaders", "leaderId name role");

    res.status(201).json({
      message: "District created successfully",
      district: populatedDistrict,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "District ID, slug, or district name already exists",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to create district",
      error: error.message,
    });
  }
});

// Update district
router.put("/:districtId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const existing = await District.findOne({ districtId: req.params.districtId });

    if (!existing) {
      return res.status(404).json({ message: "District not found" });
    }

    const payload = { ...req.body };

    if (payload.localLevels || payload.localLevelsText) {
      payload.localLevels = parseLocalLevels(payload.localLevels || payload.localLevelsText);
    }

    const nextName = payload.name ?? existing.name;
    const nextProvince = payload.province ?? existing.province;

    const duplicate = await District.findOne({
      _id: { $ne: existing._id },
      normalizedName: normalizeText(nextName),
      province: nextProvince,
    });

    if (duplicate) {
      return res.status(409).json({
        message: "Another district with same name already exists in this province",
        existingDistrict: duplicate,
      });
    }

    if (payload.mpLeader !== undefined) {
      const mpValidation = await validateLeaderRole(payload.mpLeader, ["MP"]);
      if (mpValidation?.error) {
        return res.status(400).json({ message: mpValidation.error });
      }
    }

    if (payload.ministerLeader !== undefined) {
      const ministerValidation = await validateLeaderRole(payload.ministerLeader, [
        "Minister",
        "Prime Minister",
      ]);
      if (ministerValidation?.error) {
        return res.status(400).json({ message: ministerValidation.error });
      }
    }

    if (Array.isArray(payload.naLeaders)) {
      for (const leaderId of payload.naLeaders) {
        const naValidation = await validateLeaderRole(leaderId, ["National Assembly Member"]);
        if (naValidation?.error) {
          return res.status(400).json({ message: naValidation.error });
        }
      }
    }

    const updated = await District.findOneAndUpdate(
      { districtId: req.params.districtId },
      payload,
      { new: true, runValidators: true }
    )
      .populate("mpLeader", "leaderId name role party photo")
      .populate("ministerLeader", "leaderId name role party photo")
      .populate("naLeaders", "leaderId name role party photo");

    res.json({
      message: "District updated successfully",
      district: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update district",
      error: error.message,
    });
  }
});
// Delete district
router.delete("/:districtId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const district = await District.findOneAndDelete({ districtId: req.params.districtId });

    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    await Leader.updateMany(
      { district: district._id },
      { $set: { district: null, province: "" } }
    );

    res.json({
      message: "District deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete district",
      error: error.message,
    });
  }
});

module.exports = router;
