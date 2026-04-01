const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leader",
      required: true,
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