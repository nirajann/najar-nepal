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

function parseLocalLevels(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item) => ({
        name: String(item.name || item).trim(),
        type: String(item.type || "").trim(),
        slug: slugify(item.name || item),
      }))
      .filter((x) => x.name);
  }

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        type: "",
        slug: slugify(name),
      }));
  }

  return [];
}

async function validateLeaderIds(ids = [], allowedRoles = [], session = null) {
  if (!Array.isArray(ids)) return { validIds: [] };
  if (ids.length === 0) return { validIds: [] };

  const invalid = ids.find((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalid) {
    return { error: "Invalid leader id found" };
  }

  const leaders = await Leader.find({ _id: { $in: ids } })
    .session(session)
    .select("_id role");

  if (leaders.length !== ids.length) {
    return { error: "One or more linked leaders not found" };
  }

  for (const leader of leaders) {
    if (!allowedRoles.includes(leader.role)) {
      return {
        error: `Leader role must be one of: ${allowedRoles.join(", ")}`
      };
    }
  }

  return { validIds: leaders.map((x) => x._id) };
}

function getAllLinkedIds(payload) {
  return [
    ...(payload.mpLeaders || []),
    ...(payload.ministerLeaders || []),
    ...(payload.naLeaders || []),
  ];
}

async function syncLinkedLeaders(district, session) {
  const linkedIds = getAllLinkedIds(district);

  await Leader.updateMany(
    { _id: { $in: linkedIds } },
    {
      $set: {
        district: district._id,
        districtName: district.name,
        province: district.province,
      },
    }
  ).session(session);

  await Leader.updateMany(
    {
      district: district._id,
      _id: { $nin: linkedIds },
    },
    {
      $set: {
        district: null,
        districtName: "",
      },
    }
  ).session(session);
}

function populateDistrict(query) {
  return query
    .populate("mpLeaders", "leaderId name role party photo")
    .populate("ministerLeaders", "leaderId name role party photo")
    .populate("naLeaders", "leaderId name role party photo");
}

/* CHECK DUPLICATE */
router.get("/check-duplicate", async (req, res) => {
  try {
    const { name = "", province = "" } = req.query;

    if (!name.trim()) {
      return res.status(400).json({ message: "District name required" });
    }

    const normalized = normalizeText(name);

    const matches = await District.find({
      normalizedName: { $regex: normalized, $options: "i" },
      ...(province ? { province } : {}),
    })
      .select("name province districtId slug")
      .limit(10)
      .sort({ name: 1 });

    const exactMatch = matches.some(
      (d) =>
        d.normalizedName === normalized &&
        (!province || d.province === province)
    );

    res.json({ exactMatch, matches });
  } catch (error) {
    res.status(500).json({ message: "Duplicate check failed" });
  }
});

/* GET ALL */
router.get("/", async (req, res) => {
  try {
    const {
      province,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (province) filter.province = province;

    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { province: new RegExp(search, "i") },
        { districtId: new RegExp(search, "i") },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [rows, total] = await Promise.all([
      populateDistrict(
        District.find(filter)
          .sort({ name: 1 })
          .skip(skip)
          .limit(Number(limit))
      ),
      District.countDocuments(filter),
    ]);

    res.json({
      rows,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch districts" });
  }
});

/* GET ONE */
router.get("/:districtId", async (req, res) => {
  try {
    const district = await populateDistrict(
      District.findOne({ districtId: req.params.districtId })
    );

    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    res.json(district);
  } catch {
    res.status(500).json({ message: "Failed to fetch district" });
  }
});

/* CREATE */
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const payload = { ...req.body };

    if (!payload.name?.trim()) {
      throw new Error("District name required");
    }

    if (!payload.province?.trim()) {
      throw new Error("Province required");
    }

    payload.districtId = payload.districtId?.trim() || slugify(payload.name);
    payload.slug = slugify(payload.name);
    payload.provinceSlug = slugify(payload.province);
    payload.normalizedName = normalizeText(payload.name);
    payload.localLevels = parseLocalLevels(payload.localLevels);

    const duplicate = await District.findOne({
      normalizedName: payload.normalizedName,
      province: payload.province,
    }).session(session);

    if (duplicate) {
      return res.status(409).json({
        message: "District already exists",
      });
    }

    const mp = await validateLeaderIds(payload.mpLeaders, ["MP"], session);
    const ministers = await validateLeaderIds(
      payload.ministerLeaders,
      ["Minister", "Prime Minister"],
      session
    );
    const na = await validateLeaderIds(
      payload.naLeaders,
      ["National Assembly Member"],
      session
    );

    if (mp.error || ministers.error || na.error) {
      throw new Error(mp.error || ministers.error || na.error);
    }

    payload.mpLeaders = mp.validIds;
    payload.ministerLeaders = ministers.validIds;
    payload.naLeaders = na.validIds;

    const created = await District.create([payload], { session });
    const district = created[0];

    await syncLinkedLeaders(district, session);

    await session.commitTransaction();

    const finalDistrict = await populateDistrict(
      District.findById(district._id)
    );

    res.status(201).json({
      message: "District created",
      district: finalDistrict,
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
router.put("/:districtId", authMiddleware, adminMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existing = await District.findOne({
      districtId: req.params.districtId,
    }).session(session);

    if (!existing) {
      return res.status(404).json({ message: "District not found" });
    }

    const payload = { ...req.body };

    const nextName = payload.name || existing.name;
    const nextProvince = payload.province || existing.province;

    payload.normalizedName = normalizeText(nextName);

    if (payload.name) payload.slug = slugify(payload.name);
    if (payload.province) payload.provinceSlug = slugify(payload.province);
    if (payload.localLevels)
      payload.localLevels = parseLocalLevels(payload.localLevels);

    const duplicate = await District.findOne({
      _id: { $ne: existing._id },
      normalizedName: payload.normalizedName,
      province: nextProvince,
    }).session(session);

    if (duplicate) {
      return res.status(409).json({
        message: "Duplicate district exists",
      });
    }

    const updated = await District.findOneAndUpdate(
      { districtId: req.params.districtId },
      payload,
      { new: true, runValidators: true, session }
    );

    await syncLinkedLeaders(updated, session);

    await session.commitTransaction();

    const finalDistrict = await populateDistrict(
      District.findById(updated._id)
    );

    res.json({
      message: "District updated",
      district: finalDistrict,
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
router.delete("/:districtId", authMiddleware, adminMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const district = await District.findOneAndDelete({
      districtId: req.params.districtId,
    }).session(session);

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
    ).session(session);

    await session.commitTransaction();

    res.json({
      message: "District deleted",
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