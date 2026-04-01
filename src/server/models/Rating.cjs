const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaderId: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 1,
    },
    reaction: {
      type: String,
      enum: ["like", "dislike", ""],
      default: "",
    },
    comment: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

ratingSchema.index({ userId: 1, leaderId: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);