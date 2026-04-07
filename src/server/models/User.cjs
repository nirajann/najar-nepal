const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phone: {
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
    birthplace: {
      type: String,
      default: "",
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: "",
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "reviewer"],
      default: "user",
    },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    citizenshipNumber: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    badges: {
      type: [String],
      default: [],
    },
    citizenshipFrontPhoto: {
      type: String,
      default: "",
      trim: true,
    },
    citizenshipBackPhoto: {
      type: String,
      default: "",
      trim: true,
    },
    verificationSelfiePhoto: {
      type: String,
      default: "",
      trim: true,
    },
    verificationSubmittedAt: {
      type: Date,
      default: null,
    },
    verificationReviewedAt: {
      type: Date,
      default: null,
    },
    verificationNotes: {
      type: String,
      default: "",
      trim: true,
    },
    verificationReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
