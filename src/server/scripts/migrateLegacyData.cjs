const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../config/db.cjs");
const Leader = require("../models/Leader.cjs");
const District = require("../models/District.cjs");

dotenv.config();

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

async function migrateDistricts() {
  const districts = await District.find({});
  console.log(`Found ${districts.length} districts`);

  for (const district of districts) {
    let changed = false;

    const nextName = (district.name || "").trim();
    const nextProvince = (district.province || "").trim();
    const nextNormalizedName = normalizeText(nextName);
    const nextSlug = slugify(nextName);
    const nextDistrictId = district.districtId?.trim() || nextSlug;

    if (district.name !== nextName) {
      district.name = nextName;
      changed = true;
    }

    if (district.province !== nextProvince) {
      district.province = nextProvince;
      changed = true;
    }

    if (district.normalizedName !== nextNormalizedName) {
      district.normalizedName = nextNormalizedName;
      changed = true;
    }

    if (district.slug !== nextSlug) {
      district.slug = nextSlug;
      changed = true;
    }

    if (district.districtId !== nextDistrictId) {
      district.districtId = nextDistrictId;
      changed = true;
    }

    if (
      (!district.localLevels || district.localLevels.length === 0) &&
      district.localLevelsText
    ) {
      district.localLevels = parseLocalLevels(district.localLevelsText);
      changed = true;
    }

    if (district.mpLeaderId && !district.mpLeader) {
      const mp = await Leader.findOne({ leaderId: district.mpLeaderId }).select("_id");
      if (mp) {
        district.mpLeader = mp._id;
        changed = true;
      }
    }

    if (district.ministerLeaderId && !district.ministerLeader) {
      const minister = await Leader.findOne({ leaderId: district.ministerLeaderId }).select("_id");
      if (minister) {
        district.ministerLeader = minister._id;
        changed = true;
      }
    }

    if (
      Array.isArray(district.naLeaderIds) &&
      district.naLeaderIds.length > 0 &&
      (!Array.isArray(district.naLeaders) || district.naLeaders.length === 0)
    ) {
      const leaders = await Leader.find({
        leaderId: { $in: district.naLeaderIds },
      }).select("_id");

      district.naLeaders = leaders.map((leader) => leader._id);
      changed = true;
    }

    if (!Array.isArray(district.naLeaders)) {
      district.naLeaders = [];
      changed = true;
    }

    if (changed) {
      await district.save();
      console.log(`Migrated district: ${district.name}`);
    }
  }
}

async function migrateLeaders() {
  const leaders = await Leader.collection.find({}).toArray();
  console.log(`Found ${leaders.length} leaders`);

  for (const leader of leaders) {
    let changed = false;

    const nextName = (leader.name || "").trim();
    const nextNormalizedName = normalizeText(nextName);
    const nextSlug = slugify(nextName);
    const nextLeaderId =
      (leader.leaderId || "").trim() || buildLeaderId(nextName, leader.role);

    const updateFields = {};

    if (leader.name !== nextName) {
      updateFields.name = nextName;
      changed = true;
    }

    if (leader.normalizedName !== nextNormalizedName) {
      updateFields.normalizedName = nextNormalizedName;
      changed = true;
    }

    if (leader.slug !== nextSlug) {
      updateFields.slug = nextSlug;
      changed = true;
    }

    if (leader.leaderId !== nextLeaderId) {
      updateFields.leaderId = nextLeaderId;
      changed = true;
    }

    if (leader.district && typeof leader.district === "string") {
      const districtDoc = await District.findOne({
        $or: [{ districtId: leader.district }, { name: leader.district }],
      })
        .select("_id province name")
        .lean();

      if (districtDoc) {
        updateFields.district = districtDoc._id;
        updateFields.province = districtDoc.province || leader.province || "";
        changed = true;
      } else {
        console.log(
          `No matching district found for leader "${nextName}" with legacy district "${leader.district}". Setting district to null.`
        );
        updateFields.district = null;
        changed = true;
      }
    }

    if (
      leader.district &&
      typeof leader.district !== "string" &&
      mongoose.Types.ObjectId.isValid(String(leader.district))
    ) {
      const districtDoc = await District.findById(leader.district)
        .select("_id province")
        .lean();

      if (districtDoc && leader.province !== districtDoc.province) {
        updateFields.province = districtDoc.province;
        changed = true;
      }
    }

    if (changed) {
      await Leader.collection.updateOne(
        { _id: leader._id },
        { $set: updateFields }
      );
      console.log(`Migrated leader: ${nextName}`);
    }
  }
}

async function cleanupLegacyFields() {
  await mongoose.connection.collection("districts").updateMany(
    {},
    {
      $unset: {
        mpLeaderId: "",
        ministerLeaderId: "",
        naLeaderIds: "",
        localLevelsText: "",
      },
    }
  );

  console.log("Removed legacy district fields where present");
}

async function run() {
  try {
    await connectDB();

    console.log("Starting migration...");
    await migrateDistricts();
    await migrateLeaders();
    await cleanupLegacyFields();

    console.log("Migration completed successfully");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

run();