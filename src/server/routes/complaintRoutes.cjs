const express = require("express");
const Complaint = require("../models/Complaint.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");
const adminMiddleware = require("../middleware/adminMiddleware.cjs");

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { search = "", status, complaintType } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (complaintType) {
      query.complaintType = complaintType;
    }

    if (search.trim()) {
      query.$or = [
        { text: { $regex: search, $options: "i" } },
        { complaintType: { $regex: search, $options: "i" } },
      ];
    }

    const complaints = await Complaint.find(query)
      .populate("leaderId", "leaderId name role district province photo")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    const formatted = complaints.map((item) => ({
      _id: item._id,
      complaintId: item.complaintId || String(item._id),
      text: item.text,
      complaintType: item.complaintType,
      complaintPhoto: item.complaintPhoto,
      status: item.status || "Pending",
      createdAt: item.createdAt,
      leaderId: item.leaderId?._id || item.leaderId,
      leader: item.leaderId
        ? {
            _id: item.leaderId._id,
            leaderId: item.leaderId.leaderId,
            name: item.leaderId.name,
            role: item.leaderId.role,
            district: item.leaderId.district,
            province: item.leaderId.province,
            photo: item.leaderId.photo,
          }
        : null,
      user: item.userId
        ? {
            _id: item.userId._id,
            name: item.userId.name,
            email: item.userId.email,
          }
        : null,
    }));

    res.json({ complaints: formatted });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch complaints",
      error: error.message,
    });
  }
});

router.put("/:complaintId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.complaintId,
      {
        ...(status !== undefined ? { status } : {}),
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

router.delete("/:complaintId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.complaintId);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({
      message: "Complaint deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete complaint",
      error: error.message,
    });
  }
});

module.exports = router;