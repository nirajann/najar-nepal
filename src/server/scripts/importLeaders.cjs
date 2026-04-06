require("dotenv").config();
const mongoose = require("mongoose");
const Leader = require("../models/Leader.cjs");
const District = require("../models/District.cjs");




 const leadersData = [
  {
    name: "Indira Rana",
    role: "MP",
    chamber: "House of Representatives",
    portfolio: "",
    party: "Rastriya Swatantra Party",
    districtName: "Jhapa",
    province: "Koshi",
    localLevel: "",
    ward: "",
    currentStatus: "Current",
    age: 55,
    birthPlace: "",
    permanentAddress: "",
    gender: "",
    photo: "",
    officialSourceUrl: "https://hr.parliament.gov.np/en/members/3355",
    electionSourceUrl: "",
    badge: "",
    verified: true,
    startYear: "2022",
    endYear: "Present",
  },
  {
    name: "Rabi Lamichhane",
    role: "MP",
    chamber: "House of Representatives",
    portfolio: "",
    party: "Rastriya Swatantra Party",
    districtName: "Chitwan",
    province: "Bagmati",
    localLevel: "",
    ward: "",
    currentStatus: "Current",
    age: null,
    birthPlace: "",
    permanentAddress: "",
    gender: "",
    photo: "",
    officialSourceUrl: "https://hr.parliament.gov.np/en/members",
    electionSourceUrl: "https://english.ratopati.com/story/52652/mps-could-not-become-chairmen-of-5-parties-that-received-national-party-recognition-in-2079-bs",
    badge: "",
    verified: true,
    startYear: "2026",
    endYear: "Present",
  },
  {
    name: "Bharat Prasad Parajuli",
    role: "MP",
    chamber: "House of Representatives",
    portfolio: "",
    party: "Rastriya Swatantra Party",
    districtName: "Sindhupalchok",
    province: "Bagmati",
    localLevel: "",
    ward: "",
    currentStatus: "Current",
    age: null,
    birthPlace: "",
    permanentAddress: "",
    gender: "",
    photo: "",
    officialSourceUrl: "https://hr.parliament.gov.np/en/members",
    electionSourceUrl: "https://english.ratopati.com/story/52667/bharat-parajuli-from-drinking-water-engineer-to-mp",
    badge: "",
    verified: true,
    startYear: "2026",
    endYear: "Present",
  },
  {
    name: "Sushil Khadka",
    role: "MP",
    chamber: "House of Representatives",
    portfolio: "",
    party: "Rastriya Swatantra Party",
    districtName: "Baglung",
    province: "Gandaki",
    localLevel: "",
    ward: "",
    currentStatus: "Current",
    age: null,
    birthPlace: "",
    permanentAddress: "",
    gender: "",
    photo: "",
    officialSourceUrl: "https://hr.parliament.gov.np/en/members",
    electionSourceUrl: "https://english.ratopati.com/story/52858/janamorchas-bail-seized-in-chitra-bahadurs-home-district",
    badge: "",
    verified: true,
    startYear: "2026",
    endYear: "Present",
  },
  {
    name: "Harka Raj Rai",
    role: "MP",
    chamber: "House of Representatives",
    portfolio: "",
    party: "Rastriya Swatantra Party",
    districtName: "Sunsari",
    province: "Koshi",
    localLevel: "",
    ward: "",
    currentStatus: "Current",
    age: null,
    birthPlace: "",
    permanentAddress: "",
    gender: "",
    photo: "",
    officialSourceUrl: "https://hr.parliament.gov.np/en/members",
    electionSourceUrl: "https://english.ratopati.com/story/52718/hark-sampang-wins-from-sunsari-1",
    badge: "",
    verified: true,
    startYear: "2026",
    endYear: "Present",
  },
];

function slugify(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function normalizeText(value = "") {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

async function importLeaders() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of leadersData) {
      if (!item.name || !item.role) {
        skipped++;
        console.log("Skipped invalid item:", item);
        continue;
      }

      let districtId = null;

      if (item.districtName) {
        const districtDoc = await District.findOne({
          name: { $regex: new RegExp(`^${item.districtName}$`, "i") },
        });

        if (districtDoc) {
          districtId = districtDoc._id;
        }
      }

      const leaderId = `${slugify(item.name)}-${slugify(item.role)}`;
      const normalizedName = normalizeText(item.name);

      const payload = {
        leaderId,
        slug: slugify(item.name),
        name: item.name.trim(),
        normalizedName,
        role: item.role,
        chamber: item.chamber || "",
        portfolio: item.portfolio || "",
        party: item.party || "",
        district: districtId,
        province: item.province || "",
        localLevel: item.localLevel || "",
        ward: item.ward || "",
        currentStatus: item.currentStatus || "Current",
        age: item.age ?? null,
        birthPlace: item.birthPlace || "",
        permanentAddress: item.permanentAddress || "",
        gender: item.gender || "",
        photo: item.photo || "",
        officialSourceUrl: item.officialSourceUrl || "",
        electionSourceUrl: item.electionSourceUrl || "",
        badge: item.badge || "",
        verified: item.verified ?? false,
        startYear: item.startYear || "",
        endYear: item.endYear || "Present",
      };

      const existing = await Leader.findOne({
        $or: [
          { leaderId },
          { slug: payload.slug },
          {
            normalizedName: payload.normalizedName,
            role: payload.role,
            district: payload.district,
          },
        ],
      });

      if (existing) {
        await Leader.updateOne({ _id: existing._id }, { $set: payload });
        updated++;
        console.log(`Updated: ${payload.name}`);
      } else {
        await Leader.create(payload);
        created++;
        console.log(`Created: ${payload.name}`);
      }
    }

    console.log("\nDone");
    console.log("Created:", created);
    console.log("Updated:", updated);
    console.log("Skipped:", skipped);

    process.exit(0);
  } catch (error) {
    console.error("Import failed:", error);
    process.exit(1);
  }
}

importLeaders();