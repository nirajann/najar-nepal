const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaderId: {
      type: String,
      required: true,
      trim: true,
    },
    leaderName: {
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
    details: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "pending",
    },
    
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
