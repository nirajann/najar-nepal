const express = require("express");
const Report = require("../models/Report.cjs");
const Leader = require("../models/Leader.cjs");
const District = require("../models/District.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const leaderId = typeof req.body?.leaderId === "string" ? req.body.leaderId.trim() : "";
    const details = typeof req.body?.details === "string" ? req.body.details.trim() : "";

    if (!leaderId) {
      return res.status(400).json({ message: "Leader ID is required" });
    }

    if (!details || details.length < 6) {
      return res.status(400).json({ message: "Report details are too short" });
    }

    if (details.length > 1500) {
      return res.status(400).json({ message: "Report details are too long" });
    }

    const leader = await Leader.findOne({ leaderId });
    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    let districtName = "";
    let province = leader.province || "";

    if (leader.district) {
      const districtDoc = await District.findById(leader.district);
      if (districtDoc) {
        districtName = districtDoc.name || "";
        province = districtDoc.province || province;
      }
    }

    const report = await Report.create({
      userId: req.user.id,
      leaderId,
      details,
      leaderName: leader.name || "",
      district: districtName,
      province,
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: "Failed to submit report", error: error.message });
  }
});

module.exports = router;
