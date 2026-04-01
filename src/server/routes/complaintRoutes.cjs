const express = require("express");
const Complaint = require("../models/Complaint.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");
const adminMiddleware = require("../middleware/adminMiddleware.cjs");

const router = express.Router();

// submit complaint
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { leaderId, type, message, photo } = req.body;

    if (!leaderId || !message?.trim()) {
      return res.status(400).json({
        message: "Leader and complaint message are required",
      });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({
        message: "Complaint must be at least 10 characters",
      });
    }

    const complaint = await Complaint.create({
      leaderId,
      userId: req.user.id,
      userName: req.user.name || "User",
      userEmail: req.user.email || "",
      type: type || "Other",
      message: message.trim(),
      photo: photo || "",
      status: "pending",
    });

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit complaint",
      error: error.message,
    });
  }
});

// current user's complaint history for one leader
router.get("/mine/:leaderId", authMiddleware, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      leaderId: req.params.leaderId,
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch complaint history",
      error: error.message,
    });
  }
});

// admin sees all complaints
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch complaints",
      error: error.message,
    });
  }
});

// admin updates complaint
router.put("/:complaintId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.complaintId,
      {
        ...(status ? { status } : {}),
        ...(adminNote !== undefined ? { adminNote } : {}),
      },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({
      message: "Complaint updated successfully",
      complaint,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update complaint",
      error: error.message,
    });
  }
});

module.exports = router;