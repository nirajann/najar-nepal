const mongoose = require("mongoose");

function cleanText(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

const replySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000,
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
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { _id: true }
);

const commentSchema = new mongoose.Schema(
  {
    leaderId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },

    likes: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    replies: {
      type: [replySchema],
      default: [],
    },

    replyCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    status: {
      type: String,
      enum: ["visible", "hidden", "flagged"],
      default: "visible",
      index: true,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    isPinned: {
      type: Boolean,
      default: false,
      index: true,
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

    moderationReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },
  },
  { timestamps: true }
);

commentSchema.pre("validate", function () {
  this.userName = cleanText(this.userName);
  this.text = cleanText(this.text);

  if (!Array.isArray(this.replies)) {
    this.replies = [];
  }

  this.replies = this.replies
    .map((reply) => ({
      ...reply,
      userName: cleanText(reply?.userName),
      text: cleanText(reply?.text),
    }))
    .filter((reply) => reply.userName && reply.text);

  this.replyCount = this.replies.filter((reply) => !reply.isDeleted).length;

  if (!Number.isFinite(this.likes) || this.likes < 0) {
    this.likes = 0;
  }

  if (!Number.isFinite(this.rating) || this.rating < 0) {
    this.rating = 0;
  }
});

/* Hide soft-deleted comments by default */
commentSchema.pre(/^find/, function () {
  if (!this.getQuery().includeDeleted) {
    this.where({ isDeleted: false });
  }
});

/* Common public/admin indexes */
commentSchema.index({ leaderId: 1, createdAt: -1 });
commentSchema.index({ leaderId: 1, likes: -1, createdAt: -1 });
commentSchema.index({ leaderId: 1, rating: -1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });
commentSchema.index({ status: 1, createdAt: -1 });
commentSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model("Comment", commentSchema);