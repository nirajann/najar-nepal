const express = require("express");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware.cjs");
const {
  ANALYTICS_EVENTS,
} = require("../models/AnalyticsEvent.cjs");
const {
  recordAnalyticsEvent,
  sanitizeMetadata,
  sanitizeString,
} = require("../utils/analyticsEventLogger.cjs");

const router = express.Router();

router.post("/events", optionalAuthMiddleware, async (req, res) => {
  try {
    const eventName = sanitizeString(req.body?.eventName, 60);

    if (!ANALYTICS_EVENTS.includes(eventName)) {
      return res.status(400).json({ message: "Unsupported analytics event" });
    }

    const event = await recordAnalyticsEvent({
      eventName,
      entityType: req.body?.entityType,
      entityId: req.body?.entityId,
      entityName: req.body?.entityName,
      sourcePage: req.body?.sourcePage,
      visitorKey: req.body?.visitorKey,
      sessionId: req.body?.sessionId,
      userId: req.user?.id || req.body?.userId,
      metadata: sanitizeMetadata(req.body?.metadata),
      occurredAt: req.body?.occurredAt,
    });

    res.status(201).json({
      message: "Analytics event stored",
      eventId: event._id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to store analytics event",
      error: error.message,
    });
  }
});

module.exports = router;
