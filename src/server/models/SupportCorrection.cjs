const mongoose = require("mongoose");

const supportCorrectionSchema = new mongoose.Schema(
  {
    affectedEntity: {
      type: String,
      required: true,
      trim: true,
    },
    incorrectInfo: {
      type: String,
      required: true,
      trim: true,
    },
    suggestedCorrection: {
      type: String,
      required: true,
      trim: true,
    },
    sourceLink: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
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

module.exports = mongoose.model("SupportCorrection", supportCorrectionSchema);
