const {
  AnalyticsEvent,
  ANALYTICS_EVENTS,
} = require("../models/AnalyticsEvent.cjs");

function sanitizeString(value, maxLength = 120) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function sanitizeMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const entries = Object.entries(value).slice(0, 12);
  const sanitized = {};

  entries.forEach(([key, raw]) => {
    const safeKey = sanitizeString(key, 40);
    if (!safeKey) return;

    if (typeof raw === "string") {
      sanitized[safeKey] = raw.slice(0, 240);
      return;
    }

    if (typeof raw === "number" || typeof raw === "boolean") {
      sanitized[safeKey] = raw;
      return;
    }

    if (raw === null) {
      sanitized[safeKey] = null;
    }
  });

  return sanitized;
}

async function recordAnalyticsEvent(payload) {
  const eventName = sanitizeString(payload?.eventName, 60);
  if (!ANALYTICS_EVENTS.includes(eventName)) {
    throw new Error("Unsupported analytics event");
  }

  const event = await AnalyticsEvent.create({
    eventName,
    entityType: sanitizeString(payload?.entityType, 40),
    entityId: sanitizeString(payload?.entityId, 120),
    entityName: sanitizeString(payload?.entityName, 160),
    sourcePage: sanitizeString(payload?.sourcePage, 80),
    visitorKey: sanitizeString(payload?.visitorKey, 120),
    sessionId: sanitizeString(payload?.sessionId, 120),
    userId: sanitizeString(payload?.userId, 120),
    metadata: sanitizeMetadata(payload?.metadata),
    occurredAt: payload?.occurredAt ? new Date(payload.occurredAt) : new Date(),
  });

  return event;
}

module.exports = {
  recordAnalyticsEvent,
  sanitizeMetadata,
  sanitizeString,
};
