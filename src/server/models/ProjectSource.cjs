const mongoose = require("mongoose");

const projectSourceSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    sourceName: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },

    summary: {
      type: String,
      default: "",
    },
    note: {
      type: String,
      default: "",
    },

    matchedKeywords: {
      type: [String],
      default: [],
    },
    relevanceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

projectSourceSchema.index({ projectId: 1, url: 1 }, { unique: true });

module.exports = mongoose.model("ProjectSource", projectSourceSchema);