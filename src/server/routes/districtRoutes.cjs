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
          ? { name: item.trim(), type: "", slug: slugify(item.trim()) }
          : {
              name: item.name?.trim() || "",
              type: item.type?.trim() || "",
              slug: item.slug?.trim() || slugify(item.name || ""),
            }
      )
      .filter((item) => item.name);
  }

  if (typeof rawValue === "string") {
    return rawValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((name) => ({ name, type: "", slug: slugify(name) }));
  }

  return [];
}

async function validateLeaderIds(leaderIds, allowedRoles) {
  if (!Array.isArray(leaderIds)) return { validIds: [] };

  const validIds = [];

  for (const leaderId of leaderIds) {
    if (!mongoose.Types.ObjectId.isValid(leaderId)) {
      return { error: "Invalid leader id found in list" };
    }

    const leader = await Leader.findById(leaderId);
    if (!leader) {
      return { error: "Linked leader not found" };
    }

    if (!allowedRoles.includes(leader.role)) {
      return { error: `Leader role must be one of: ${allowedRoles.join(", ")}` };
    }

    validIds.push(leader._id);
  }

  return { validIds };
}

async function syncLeadersToDistrict(districtId, province, districtName) {
  await Leader.updateMany(
    { district: districtId },
    { $set: { province, districtName } }
  );
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
    console.log("[route] GET /api/districts", {
      districtFindType: typeof District?.find,
      leaderFindType: typeof Leader?.find,
    });

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
      .populate("mpLeaders", "leaderId name role")
      .populate("ministerLeaders", "leaderId name role")
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
      .populate("mpLeaders", "leaderId name role")
      .populate("ministerLeaders", "leaderId name role")
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
    payload.provinceSlug = slugify(payload.province);
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

    const mpValidation = await validateLeaderIds(payload.mpLeaders, ["MP"]);
    if (mpValidation?.error) {
      return res.status(400).json({ message: mpValidation.error });
    }

    const ministerValidation = await validateLeaderIds(payload.ministerLeaders, [
      "Minister",
      "Prime Minister",
    ]);
    if (ministerValidation?.error) {
      return res.status(400).json({ message: ministerValidation.error });
    }

    const naValidation = await validateLeaderIds(payload.naLeaders, [
      "National Assembly Member",
    ]);
    if (naValidation?.error) {
      return res.status(400).json({ message: naValidation.error });
    }

    payload.mpLeaders = mpValidation.validIds;
    payload.ministerLeaders = ministerValidation.validIds;
    payload.naLeaders = naValidation.validIds;

    const district = await District.create(payload);

    await syncLeadersToDistrict(district._id, district.province, district.name);

    const populatedDistrict = await District.findById(district._id)
      .populate("mpLeaders", "leaderId name role")
      .populate("ministerLeaders", "leaderId name role")
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

    if (payload.mpLeaders !== undefined) {
      const mpValidation = await validateLeaderIds(payload.mpLeaders, ["MP"]);
      if (mpValidation?.error) {
        return res.status(400).json({ message: mpValidation.error });
      }
      payload.mpLeaders = mpValidation.validIds;
    }

    if (payload.ministerLeaders !== undefined) {
      const ministerValidation = await validateLeaderIds(payload.ministerLeaders, [
        "Minister",
        "Prime Minister",
      ]);
      if (ministerValidation?.error) {
        return res.status(400).json({ message: ministerValidation.error });
      }
      payload.ministerLeaders = ministerValidation.validIds;
    }

    if (payload.naLeaders !== undefined) {
      const naValidation = await validateLeaderIds(payload.naLeaders, [
        "National Assembly Member",
      ]);
      if (naValidation?.error) {
        return res.status(400).json({ message: naValidation.error });
      }
      payload.naLeaders = naValidation.validIds;
    }

    if (payload.province) {
      payload.provinceSlug = slugify(payload.province);
    }

    const updated = await District.findOneAndUpdate(
      { districtId: req.params.districtId },
      payload,
      { new: true, runValidators: true }
    )
      .populate("mpLeaders", "leaderId name role party photo")
      .populate("ministerLeaders", "leaderId name role party photo")
      .populate("naLeaders", "leaderId name role party photo");

    await syncLeadersToDistrict(updated._id, updated.province, updated.name);

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
      {
        $set: {
          district: null,
          districtName: "",
          province: "",
        },
      }
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