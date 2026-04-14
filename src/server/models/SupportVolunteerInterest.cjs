const mongoose = require("mongoose");

const supportVolunteerInterestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    interests: {
      type: String,
      required: true,
      trim: true,
    },
    availability: {
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

module.exports = mongoose.model("SupportVolunteerInterest", supportVolunteerInterestSchema);
