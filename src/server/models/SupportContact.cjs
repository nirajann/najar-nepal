const mongoose = require("mongoose");

const supportContactSchema = new mongoose.Schema(
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
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
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

module.exports = mongoose.model("SupportContact", supportContactSchema);
