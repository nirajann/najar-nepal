const mongoose = require("mongoose");

const districtFeedbackSchema = new mongoose.Schema(
  {
    districtId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    isVerifiedSnapshot: {
      type: Boolean,
      default: false,
      index: true,
    },

    transportation: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    roads: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    safety: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    cleanliness: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    publicServices: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    scenery: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

districtFeedbackSchema.index({ districtId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("DistrictFeedback", districtFeedbackSchema);