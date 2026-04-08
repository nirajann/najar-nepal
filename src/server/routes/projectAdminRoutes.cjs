const express = require("express");
const Project = require("../models/Project.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");
const adminMiddleware = require("../middleware/adminMiddleware.cjs");

const router = express.Router();

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeManualStatus(value = "") {
  const normalized = String(value).trim().toUpperCase().replace(/\s+/g, "_");
  if (normalized === "IN_PROGRESS") return "IN_PROGRESS";
  if (normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "BROKEN") return "BROKEN";
  if (normalized === "STALLED") return "STALLED";
  return "NOT_STARTED";
}

router.get("/check-duplicate", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title = "", district = "", province = "" } = req.query;

    if (!String(title).trim()) {
      return res.status(400).json({ message: "Project title is required" });
    }

    const filter = {
      title: { $regex: `^${escapeRegex(String(title).trim())}$`, $options: "i" },
    };

    if (district) filter.district = { $regex: `^${escapeRegex(String(district).trim())}$`, $options: "i" };
    if (province) filter.province = { $regex: `^${escapeRegex(String(province).trim())}$`, $options: "i" };

    const matches = await Project.find(filter).sort({ createdAt: -1 }).limit(5);

    res.json({
      exists: matches.length > 0,
      matches,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to check duplicate project",
      error: error.message,
    });
  }
});

// Get all projects
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { search, status, district, province } = req.query;

    const filter = {};

    if (status) {
      filter.$or = [
        { status },
        { finalStatus: normalizeManualStatus(status) },
      ];
    }
    if (district) filter.district = district;
    if (province) filter.province = province;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { titleEn: { $regex: search, $options: "i" } },
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
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!req.body?.title?.trim()) {
      return res.status(400).json({ message: "Project title is required" });
    }

    const project = await Project.create({
      ...req.body,
      manualStatus: normalizeManualStatus(req.body.manualStatus || req.body.status),
      updatedAtManual: new Date(),
    });

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
router.put("/:projectId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { projectId: req.params.projectId },
      {
        ...req.body,
        manualStatus:
          req.body.manualStatus || req.body.status
            ? normalizeManualStatus(req.body.manualStatus || req.body.status)
            : undefined,
        updatedAtManual: new Date(),
      },
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
router.delete("/:projectId", authMiddleware, adminMiddleware, async (req, res) => {
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
