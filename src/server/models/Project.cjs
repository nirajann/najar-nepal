const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleEn: {
      type: String,
      default: "",
      trim: true,
    },
    titleNp: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "",
      trim: true,
    },
    district: {
      type: String,
      default: "",
      trim: true,
    },
    province: {
      type: String,
      default: "",
      trim: true,
    },
    leaderId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed", "Broken", "Stalled"],
      default: "Not Started",
      index: true,
    },
    manualStatus: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BROKEN", "STALLED"],
      default: "NOT_STARTED",
      index: true,
    },
    finalStatus: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BROKEN", "STALLED"],
      default: "NOT_STARTED",
      index: true,
    },
    allowAutoStatus: {
      type: Boolean,
      default: true,
    },
    sourceCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    deadline: {
      type: String,
      default: "",
      trim: true,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    lastUpdated: {
      type: String,
      default: "",
      trim: true,
    },
    updatedAtManual: {
      type: Date,
      default: null,
    },
    summary: {
      type: String,
      default: "",
      trim: true,
    },
    progressSummary: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    evidenceText: {
      type: String,
      default: "",
      trim: true,
    },
    whatIsThis: {
      type: String,
      default: "",
      trim: true,
    },
    impactOnPeople: {
      type: String,
      default: "",
      trim: true,
    },
    whyNeeded: {
      type: String,
      default: "",
      trim: true,
    },
    sourceName: {
      type: String,
      default: "",
      trim: true,
    },
    sourceUrl: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      default: "",
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", ""],
      default: "",
      trim: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

function toManualStatus(value = "") {
  const normalized = String(value).trim().toUpperCase().replace(/\s+/g, "_");
  if (normalized === "NOT_STARTED") return "NOT_STARTED";
  if (normalized === "IN_PROGRESS") return "IN_PROGRESS";
  if (normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "BROKEN") return "BROKEN";
  if (normalized === "STALLED") return "STALLED";
  return "NOT_STARTED";
}

function toDisplayStatus(value = "") {
  if (value === "IN_PROGRESS") return "In Progress";
  if (value === "COMPLETED") return "Completed";
  if (value === "BROKEN") return "Broken";
  if (value === "STALLED") return "Stalled";
  return "Not Started";
}

projectSchema.pre("validate", function normalizeProject(next) {
  this.title = (this.title || "").trim();
  this.titleEn = (this.titleEn || this.title || "").trim();
  this.titleNp = (this.titleNp || "").trim();
  this.description = (this.description || "").trim();
  this.summary = (this.summary || this.summary || "").trim();
  this.progressSummary = (this.progressSummary || this.summary || this.description || "").trim();
  this.source = (this.source || this.sourceName || "").trim();
  this.sourceName = (this.sourceName || this.source || "").trim();

  if (!this.projectId) {
    this.projectId = `${Date.now()}`;
  }

  this.manualStatus = toManualStatus(this.manualStatus || this.status);
  this.finalStatus = toManualStatus(this.finalStatus || this.manualStatus);
  this.status = toDisplayStatus(this.manualStatus);

  if (!this.lastUpdated) {
    this.lastUpdated = this.updatedAtManual
      ? new Date(this.updatedAtManual).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
  }

  next();
});

projectSchema.index({ category: 1, finalStatus: 1 });
projectSchema.index({ district: 1, province: 1 });

module.exports = mongoose.model("Project", projectSchema);
