const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../config/db.cjs");
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

function normalizeProvinceName(value = "") {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function detectLocalLevelType(name = "") {
  const lower = name.toLowerCase();

  if (
    lower.includes("metropolitan city") ||
    lower.includes("maha municipality") ||
    lower.includes("maha municipality") ||
    lower.includes("maha nagarpalika") ||
    lower.includes("metropolitian city")
  ) {
    return "Metropolitan City";
  }

  if (
    lower.includes("sub-metropolitan") ||
    lower.includes("upa maha") ||
    lower.includes("upamaha") ||
    lower.includes("upa municipality")
  ) {
    return "Sub-Metropolitan City";
  }

  if (
    lower.includes("rural municipality") ||
    lower.includes("gaun palika") ||
    lower.includes("ga. pa.") ||
    lower.includes("gaunpalika")
  ) {
    return "Rural Municipality";
  }

  return "Municipality";
}

function normalizeLocalLevels(municipalityList = []) {
  if (!Array.isArray(municipalityList)) return [];

  return municipalityList
    .map((item) => {
      const name = (item?.name || "").trim();
      if (!name) return null;

      return {
        name,
        type: detectLocalLevelType(name),
      };
    })
    .filter(Boolean);
}

async function run() {
  try {
    await connectDB();

    const filePath = path.join(__dirname, "../../data/nepalDistricts.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    if (!data?.provinceList || !Array.isArray(data.provinceList)) {
      throw new Error("JSON file must contain provinceList array");
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const provinceItem of data.provinceList) {
      const provinceName = normalizeProvinceName(provinceItem?.name || "");

      if (!provinceName || !Array.isArray(provinceItem?.districtList)) {
        continue;
      }

      for (const districtItem of provinceItem.districtList) {
        const districtName = (districtItem?.name || "").trim().toUpperCase();

        if (!districtName) {
          skipped++;
          continue;
        }

        const normalizedName = normalizeText(districtName);
        const slug = slugify(districtName);
        const districtId = slug;

        const localLevels = normalizeLocalLevels(districtItem?.municipalityList || []);

        const payload = {
          districtId,
          slug,
          name: districtName,
          normalizedName,
          province: provinceName,
          localLevels,
          satisfactionScore: 0,
        };

        const existing = await District.findOne({
          normalizedName,
          province: provinceName,
        });

        if (existing) {
          await District.updateOne(
            { _id: existing._id },
            {
              $set: {
                name: payload.name,
                normalizedName: payload.normalizedName,
                slug: payload.slug,
                districtId: payload.districtId,
                province: payload.province,
                localLevels: payload.localLevels,
              },
            }
          );
          updated++;
          console.log(`Updated district: ${districtName} (${provinceName})`);
        } else {
          await District.create(payload);
          created++;
          console.log(`Created district: ${districtName} (${provinceName})`);
        }
      }
    }

    console.log(`Seed complete. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

run();