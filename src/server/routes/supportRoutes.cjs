const express = require("express");
const SupportIssue = require("../models/SupportIssue.cjs");
const SupportCorrection = require("../models/SupportCorrection.cjs");
const SupportContact = require("../models/SupportContact.cjs");
const SupportVolunteerInterest = require("../models/SupportVolunteerInterest.cjs");

const router = express.Router();

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/issues", async (req, res) => {
  try {
    const issueCategory = normalizeText(req.body?.issueCategory);
    const pageSection = normalizeText(req.body?.pageSection);
    const description = normalizeText(req.body?.description);
    const screenshotUrl = normalizeText(req.body?.screenshotUrl);
    const name = normalizeText(req.body?.name);
    const email = normalizeText(req.body?.email);

    if (!issueCategory) {
      return res.status(400).json({ message: "Issue category is required" });
    }
    if (!pageSection) {
      return res.status(400).json({ message: "Page or section is required" });
    }
    if (!description || description.length < 10) {
      return res.status(400).json({ message: "Description must be at least 10 characters" });
    }
    if (description.length > 2000) {
      return res.status(400).json({ message: "Description is too long" });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "Email address is invalid" });
    }

    const issue = await SupportIssue.create({
      issueCategory,
      pageSection,
      description,
      screenshotUrl,
      name,
      email,
    });

    res.status(201).json({
      message: "Issue submitted successfully",
      issueId: issue._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit issue", error: error.message });
  }
});

router.post("/corrections", async (req, res) => {
  try {
    const affectedEntity = normalizeText(req.body?.affectedEntity);
    const incorrectInfo = normalizeText(req.body?.incorrectInfo);
    const suggestedCorrection = normalizeText(req.body?.suggestedCorrection);
    const sourceLink = normalizeText(req.body?.sourceLink);
    const notes = normalizeText(req.body?.notes);

    if (!affectedEntity) {
      return res.status(400).json({ message: "Affected page or profile is required" });
    }
    if (!incorrectInfo || incorrectInfo.length < 6) {
      return res.status(400).json({ message: "Incorrect information is too short" });
    }
    if (!suggestedCorrection || suggestedCorrection.length < 6) {
      return res.status(400).json({ message: "Suggested correction is too short" });
    }
    if (sourceLink && sourceLink.length > 500) {
      return res.status(400).json({ message: "Source link is too long" });
    }

    const correction = await SupportCorrection.create({
      affectedEntity,
      incorrectInfo,
      suggestedCorrection,
      sourceLink,
      notes,
    });

    res.status(201).json({
      message: "Correction request submitted",
      correctionId: correction._id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit correction request",
      error: error.message,
    });
  }
});

router.post("/contact", async (req, res) => {
  try {
    const name = normalizeText(req.body?.name);
    const email = normalizeText(req.body?.email);
    const subject = normalizeText(req.body?.subject);
    const message = normalizeText(req.body?.message);

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    if (!subject) {
      return res.status(400).json({ message: "Subject is required" });
    }
    if (!message || message.length < 10) {
      return res.status(400).json({ message: "Message must be at least 10 characters" });
    }
    if (message.length > 2000) {
      return res.status(400).json({ message: "Message is too long" });
    }

    const contact = await SupportContact.create({
      name,
      email,
      subject,
      message,
    });

    res.status(201).json({
      message: "Support request sent",
      contactId: contact._id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to send support request",
      error: error.message,
    });
  }
});

router.post("/volunteer", async (req, res) => {
  try {
    const name = normalizeText(req.body?.name);
    const email = normalizeText(req.body?.email);
    const interests = normalizeText(req.body?.interests);
    const availability = normalizeText(req.body?.availability);
    const notes = normalizeText(req.body?.notes);

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    if (!interests || interests.length < 6) {
      return res.status(400).json({ message: "Interests are too short" });
    }

    const interest = await SupportVolunteerInterest.create({
      name,
      email,
      interests,
      availability,
      notes,
    });

    res.status(201).json({
      message: "Volunteer interest received",
      volunteerId: interest._id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit volunteer interest",
      error: error.message,
    });
  }
});

module.exports = router;
