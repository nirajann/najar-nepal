const express = require("express");
const Project = require("../models/Project.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");

const router = express.Router();

// Get all projects
router.get("/", async (req, res) => {
  try {
    const { search, status, district, province } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (district) filter.district = district;
    if (province) filter.province = province;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { titleNp: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { district: { $regex: search, $options: "i" } },
        { province: { $regex: search, $options: "i" } },
      ];
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
});

// Create
router.post("/", authMiddleware, async (req, res) => {
  try {
    const project = await Project.create(req.body);

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Project ID already exists",
        error: error.message,
      });
    }

    res.status(500).json({
      message: error.message || "Failed to create project",
      error: error.message,
    });
  }
});

// Update
router.put("/:projectId", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { projectId: req.params.projectId },
      req.body,
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update project",
      error: error.message,
    });
  }
});

// Delete
router.delete("/:projectId", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      projectId: req.params.projectId,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete project",
      error: error.message,
    });
  }
});

module.exports = router;