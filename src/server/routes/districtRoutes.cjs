const express = require("express");
const District = require("../models/District.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");

const router = express.Router();

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

    const districts = await District.find(filter).sort({ name: 1 });
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
    const district = await District.findOne({ districtId: req.params.districtId });

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
router.post("/", authMiddleware, async (req, res) => {
  try {
    const district = await District.create(req.body);

    res.status(201).json({
      message: "District created successfully",
      district,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "District ID already exists",
        error: error.message,
      });
    }

    res.status(500).json({
      message: error.message || "Failed to create district",
      error: error.message,
    });
  }
});

// Update district
router.put("/:districtId", authMiddleware, async (req, res) => {
  try {
    const district = await District.findOneAndUpdate(
      { districtId: req.params.districtId },
      req.body,
      { new: true }
    );

    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    res.json({
      message: "District updated successfully",
      district,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update district",
      error: error.message,
    });
  }
});

// Delete district
router.delete("/:districtId", authMiddleware, async (req, res) => {
  try {
    const district = await District.findOneAndDelete({ districtId: req.params.districtId });

    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

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