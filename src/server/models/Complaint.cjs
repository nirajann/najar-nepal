const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
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
    complaintType: {
      type: String,
      default: "",
      trim: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    complaintPhoto: {
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

complaintSchema.pre("validate", function () {
  if (!this.text && this.message) {
    this.text = this.message;
  }

  if (!this.message && this.text) {
    this.message = this.text;
  }

  if (!this.complaintType && this.type) {
    this.complaintType = this.type;
  }

  if (!this.type && this.complaintType) {
    this.type = this.complaintType;
  }

  if (!this.complaintPhoto && this.photo) {
    this.complaintPhoto = this.photo;
  }

  if (!this.photo && this.complaintPhoto) {
    this.photo = this.complaintPhoto;
  }
});

module.exports = mongoose.model("Complaint", complaintSchema);
