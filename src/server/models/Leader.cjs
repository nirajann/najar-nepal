const mongoose = require("mongoose");

const leaderSchema = new mongoose.Schema(
  {
    leaderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: [
        "Prime Minister",
        "Minister",
        "MP",
        "National Assembly Member",
        "Mayor",
        "Chairperson",
      ],
      required: true,
    },
    chamber: {
      type: String,
      enum: ["House of Representatives", "National Assembly",""],
      default: "",
    },
    portfolio: {
      type: String,
      default: "",
      trim: true,
    },
    party: {
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
    localLevel: {
      type: String,
      default: "",
      trim: true,
    },
    ward: {
      type: String,
      default: "",
      trim: true,
    },
    currentStatus: {
      type: String,
      enum: ["Current", "Former"],
      default: "Current",
    },
    age: {
      type: Number,
      default: null,
    },
    birthPlace: {
      type: String,
      default: "",
      trim: true,
    },
    permanentAddress: {
      type: String,
      default: "",
      trim: true,
    },
    gender: {
      type: String,
      default: "",
      trim: true,
    },
    photo: {
      type: String,
      default: "",
      trim: true,
    },
    officialSourceUrl: {
      type: String,
      default: "",
      trim: true,
    },
    electionSourceUrl: {
      type: String,
      default: "",
      trim: true,
    },
    badge: {
      type: String,
      default: "",
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    startYear: {
      type: String,
      default: "",
      trim: true,
    },
    endYear: {
      type: String,
      default: "Present",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leader", leaderSchema);