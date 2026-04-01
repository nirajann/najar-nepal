const mongoose = require("mongoose");

const districtSchema = new mongoose.Schema(
  {
    districtId: {
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
    province: {
      type: String,
      required: true,
      trim: true,
    },
    mpLeaderId: {
      type: String,
      default: "",
      trim: true,
    },
    ministerLeaderId: {
      type: String,
      default: "",
      trim: true,
    },
    naLeaderIds: {
      type: [String],
      default: [],
    },
    localLevelsText: {
      type: String,
      default: "",
      trim: true,
    },
    satisfactionScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("District", districtSchema);