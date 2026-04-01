const express = require("express");
const Leader = require("../models/Leader.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");

const router = express.Router();

// Get all leaders
router.get("/", async (req, res) => {
  try {
    const { role, district, province, search } = req.query;

    const filter = {};

    if (role) filter.role = role;
    if (district) filter.district = district;
    if (province) filter.province = province;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { party: { $regex: search, $options: "i" } },
        { district: { $regex: search, $options: "i" } },
        { province: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    const leaders = await Leader.find(filter).sort({ createdAt: -1 });
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
    const leader = await Leader.findOne({ leaderId: req.params.leaderId });

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
    console.log("Incoming leader payload:", req.body);
    console.log("Authenticated user:", req.user);

    const leader = await Leader.create(req.body);

    res.status(201).json({
      message: "Leader created successfully",
      leader,
    });
  } catch (error) {
    console.error("Create leader error:", error);

    res.status(500).json({
      message: error.message || "Failed to create leader",
      error: error.message,
    });
  }
});

// Update leader
router.put("/:leaderId", authMiddleware, async (req, res) => {
  try {
    const leader = await Leader.findOneAndUpdate(
      { leaderId: req.params.leaderId },
      req.body,
      { new: true }
    );

    if (!leader) {
      return res.status(404).json({ message: "Leader not found" });
    }

    res.json({
      message: "Leader updated successfully",
      leader,
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