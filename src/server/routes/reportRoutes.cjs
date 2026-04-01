const express = require("express");
const Report = require("../models/Report.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { leaderId, details } = req.body;

    const report = await Report.create({
      userId: req.user.id,
      leaderId,
      details,
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: "Failed to submit report", error: error.message });
  }
});

module.exports = router;