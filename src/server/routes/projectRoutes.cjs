const express = require("express");
const Project = require("../models/Project.cjs");
const ProjectSource = require("../models/ProjectSource.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");
const adminMiddleware = require("../middleware/adminMiddleware.cjs");
const {
  scoreSourceAgainstKeywords,
  computeFinalStatus,
  getDaysText,
} = require("../utils/sourceMatcher.cjs");

const router = express.Router();

function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown-source";
  }
}

async function refreshProjectStatus(projectId) {
  const project = await Project.findOne({ projectId });
  if (!project) return null;

  const sourceCount = await ProjectSource.countDocuments({
    projectId,
    isApproved: true,
  });

  project.sourceCount = sourceCount;
  project.finalStatus = computeFinalStatus(project);
  await project.save();

  return project;
}

router.get("/", async (_req, res) => {
  try {
    const projects = await Project.find().sort({ projectId: 1 });

    const enriched = projects.map((project) => {
      const plain = project.toObject();
      return {
        ...plain,
        status: plain.finalStatus,
        daysText: getDaysText(plain.dueDate),
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
});

router.get("/:projectId", async (req, res) => {
  try {
    const project = await Project.findOne({ projectId: req.params.projectId });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const sources = await ProjectSource.find({
      projectId: req.params.projectId,
      isApproved: true,
    }).sort({
      publishedAt: -1,
      createdAt: -1,
    });

    res.json({
      project: {
        ...project.toObject(),
        status: project.finalStatus,
        daysText: getDaysText(project.dueDate),
      },
      sources,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch project",
      error: error.message,
    });
  }
});

router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const project = await Project.create({
      ...req.body,
      updatedAtManual: req.body.updatedAtManual || new Date(),
    });

    project.finalStatus = computeFinalStatus(project);
    await project.save();

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create project",
      error: error.message,
    });
  }
});

router.put("/:projectId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { projectId: req.params.projectId },
      {
        ...req.body,
        updatedAtManual: new Date(),
      },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.finalStatus = computeFinalStatus(project);
    await project.save();

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

router.post("/:projectId/source", authMiddleware, async (req, res) => {
  try {
    const { url, title, publishedAt, summary, note } = req.body;

    const project = await Project.findOne({ projectId: req.params.projectId });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const combinedText = [title, summary, note].filter(Boolean).join(" ");
    const { matchedKeywords, relevanceScore } = scoreSourceAgainstKeywords(
      combinedText,
      project.keywords || []
    );

    const source = await ProjectSource.findOneAndUpdate(
      { projectId: req.params.projectId, url },
      {
        projectId: req.params.projectId,
        url,
        title: title || "",
        sourceName: getDomainFromUrl(url),
        publishedAt: publishedAt || null,
        summary: summary || "",
        note: note || "",
        matchedKeywords,
        relevanceScore,
        isApproved: false,
        addedBy: req.user.id,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      message: "Source saved as candidate",
      source,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save source",
      error: error.message,
    });
  }
});

router.get("/:projectId/sources", async (req, res) => {
  try {
    const sources = await ProjectSource.find({
      projectId: req.params.projectId,
    }).sort({
      createdAt: -1,
    });

    res.json(sources);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch sources",
      error: error.message,
    });
  }
});

router.post("/sources/:sourceId/approve", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const source = await ProjectSource.findByIdAndUpdate(
      req.params.sourceId,
      { isApproved: true },
      { new: true }
    );

    if (!source) {
      return res.status(404).json({ message: "Source not found" });
    }

    const project = await refreshProjectStatus(source.projectId);

    res.json({
      message: "Source approved successfully",
      source,
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to approve source",
      error: error.message,
    });
  }
});

router.post("/:projectId/status-recompute", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const project = await refreshProjectStatus(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({
      message: "Project status recomputed",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to recompute status",
      error: error.message,
    });
  }
});

module.exports = router;
