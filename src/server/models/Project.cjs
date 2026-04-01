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
    },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed", "Broken", "Stalled"],
      default: "Not Started",
    },
    progress: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: String,
      default: "",
      trim: true,
    },
    lastUpdated: {
      type: String,
      default: "",
      trim: true,
    },
    summary: {
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);