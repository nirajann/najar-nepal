const mongoose = require("mongoose");

const supportIssueSchema = new mongoose.Schema(
  {
    issueCategory: {
      type: String,
      required: true,
      trim: true,
    },
    pageSection: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    screenshotUrl: {
      type: String,
      default: "",
      trim: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      default: "new",
      trim: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportIssue", supportIssueSchema);
