const mongoose = require("mongoose");

function normalizeText(value = "") {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function slugify(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

const localLevelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const districtSchema = new mongoose.Schema(
  {
    districtId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    normalizedName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    province: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    mpLeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leader",
      default: null,
    },

    ministerLeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leader",
      default: null,
    },

    naLeaders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Leader",
      },
    ],

    localLevels: {
      type: [localLevelSchema],
      default: [],
    },

    satisfactionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

districtSchema.pre("validate", function () {
  this.name = (this.name || "").trim();
  this.province = (this.province || "").trim();
  this.normalizedName = normalizeText(this.name);

  if (!this.slug) {
    this.slug = slugify(this.name);
  }

  if (!this.districtId) {
    this.districtId = slugify(this.name);
  }
});

districtSchema.index(
  { normalizedName: 1, province: 1 },
  { unique: true }
);

module.exports = mongoose.model("District", districtSchema);