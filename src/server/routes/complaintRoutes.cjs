const express = require("express");
const Complaint = require("../models/Complaint.cjs");
const Leader = require("../models/Leader.cjs");
const District = require("../models/District.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");
const adminMiddleware = require("../middleware/adminMiddleware.cjs");

const router = express.Router();

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeComplaintPayload(body = {}) {
  const text = normalizeText(body.text || body.message || "");
  const complaintType = normalizeText(body.complaintType || body.type || "Other") || "Other";
  const complaintPhoto = normalizeText(body.complaintPhoto || body.photo || "");

  return { text, complaintType, complaintPhoto };
}

function formatComplaint(item) {
  return {
    _id: item._id,
    leaderId: item.leaderId,
    leaderName: item.leaderName || "",
    district: item.district || "",
    province: item.province || "",
    userId: item.userId,
    userName: item.userName || "",
    text: item.text || item.message || "",
    complaintType: item.complaintType || item.type || "Other",
    complaintPhoto: item.complaintPhoto || item.photo || "",
    status: item.status || "pending",
    adminNote: item.adminNote || "",
    createdAt: item.createdAt,
  };
}

router.post("/", authMiddleware, async (req, res) => {
  try {
    const leaderId = normalizeText(req.body?.leaderId);
    const { text, complaintType, complaintPhoto } = normalizeComplaintPayload(req.body);

    if (!leaderId) {
      return res.status(400).json({ message: "Leader ID is required" });
    }

    if (!text || text.length < 10) {
      return res
        .status(400)
        .json({ message: "Complaint must be at least 10 characters." });
    }

    if (text.length > 1200) {
      return res
        .status(400)
        .json({ message: "Complaint must be under 1200 characters." });
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

    const complaint = await Complaint.create({
      leaderId,
      userId: req.user.id,
      userName: req.user.name || "",
      userEmail: req.user.email || "",
      leaderName: leader.name || "",
      district: districtName,
      province,
      text,
      message: text,
      complaintType: complaintType || "Other",
      type: complaintType || "Other",
      complaintPhoto: complaintPhoto || "",
      photo: complaintPhoto || "",
      status: "pending",
    });

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint: formatComplaint(complaint),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit complaint",
      error: error.message,
    });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const leaderId = normalizeText(req.query?.leaderId);
    const query = {
      userId: req.user.id,
      ...(leaderId ? { leaderId } : {}),
    };

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });
    res.json(complaints.map(formatComplaint));
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch complaints",
      error: error.message,
    });
  }
});

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
        { message: { $regex: search, $options: "i" } },
        { complaintType: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
      ];
    }

    const complaints = await Complaint.find(query)
      .populate("leaderId", "leaderId name role district province photo")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    const formatted = complaints.map((item) => ({
      _id: item._id,
      complaintId: item.complaintId || String(item._id),
      text: item.text || item.message || "",
      complaintType: item.complaintType || item.type || "Other",
      complaintPhoto: item.complaintPhoto || item.photo || "",
      status: item.status || "Pending",
      createdAt: item.createdAt,
      district: item.district || "",
      province: item.province || "",
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
