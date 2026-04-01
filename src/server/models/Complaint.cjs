const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    leaderId: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      default: "",
      trim: true,
    },
    userEmail: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "Corruption",
        "Road",
        "Water",
        "Electricity",
        "Health",
        "Education",
        "Abuse of Power",
        "Delay",
        "Other",
      ],
      default: "Other",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewing", "resolved", "rejected"],
      default: "pending",
    },
    adminNote: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);