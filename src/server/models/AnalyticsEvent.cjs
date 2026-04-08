const mongoose = require("mongoose");

const ANALYTICS_EVENTS = [
  "leader_profile_viewed",
  "district_selected",
  "leader_rating_submitted",
  "leader_comment_submitted",
  "project_viewed",
  "ranking_filter_used",
  "search_used",
  "language_changed",
];

function getUtcDayBucket(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getUtcWeekBucket(date) {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

const analyticsEventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      enum: ANALYTICS_EVENTS,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    entityId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    entityName: {
      type: String,
      default: "",
      trim: true,
    },
    sourcePage: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    visitorKey: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    sessionId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    dayBucket: {
      type: String,
      default: "",
      index: true,
    },
    weekBucket: {
      type: String,
      default: "",
      index: true,
    },
  },
  { timestamps: true }
);

analyticsEventSchema.pre("validate", function setBuckets(next) {
  const occurredAt = this.occurredAt instanceof Date ? this.occurredAt : new Date(this.occurredAt || Date.now());
  this.occurredAt = occurredAt;
  this.dayBucket = getUtcDayBucket(occurredAt);
  this.weekBucket = getUtcWeekBucket(occurredAt);
  next();
});

analyticsEventSchema.index({ eventName: 1, occurredAt: -1 });
analyticsEventSchema.index({ eventName: 1, entityType: 1, entityId: 1, occurredAt: -1 });
analyticsEventSchema.index({ eventName: 1, dayBucket: 1, visitorKey: 1 });
analyticsEventSchema.index({ eventName: 1, weekBucket: 1, visitorKey: 1 });

module.exports = {
  AnalyticsEvent: mongoose.model("AnalyticsEvent", analyticsEventSchema),
  ANALYTICS_EVENTS,
  getUtcDayBucket,
  getUtcWeekBucket,
};
