const mongoose = require("mongoose");

function cleanText(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

const ratingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    leaderId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    value: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 1,
      index: true,
    },

    reaction: {
      type: String,
      enum: ["like", "dislike", ""],
      default: "",
      index: true,
    },

    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["visible", "hidden", "flagged"],
      default: "visible",
      index: true,
    },

    moderationReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ratingSchema.pre("validate", function () {
  this.leaderId = String(this.leaderId || "").trim();
  this.comment = cleanText(this.comment);

  if (!Number.isFinite(this.value)) {
    this.value = 1;
  }

  if (!["like", "dislike", ""].includes(this.reaction)) {
    this.reaction = "";
  }
});

/* Hide soft-deleted ratings by default */
ratingSchema.pre(/^find/, function () {
  if (!this.getQuery().includeDeleted) {
    this.where({ isDeleted: false });
  }
});

/* One rating per user per leader */
ratingSchema.index({ userId: 1, leaderId: 1 }, { unique: true });

/* Common read patterns */
ratingSchema.index({ leaderId: 1, createdAt: -1 });
ratingSchema.index({ leaderId: 1, value: -1, createdAt: -1 });
ratingSchema.index({ leaderId: 1, reaction: 1, createdAt: -1 });
ratingSchema.index({ status: 1, createdAt: -1 });
ratingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Rating", ratingSchema);