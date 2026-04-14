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

    slug: {
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

    provinceSlug: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    mpLeaders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Leader",
      },
    ],

    ministerLeaders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Leader",
      },
    ],

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

    totalWards: {
      type: Number,
      default: 0,
      min: 0,
    },

    satisfactionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    verified: {
      type: Boolean,
      default: false,
      index: true,
    },

    sourceUrl: {
      type: String,
      default: "",
      trim: true,
    },

    lastVerifiedAt: {
      type: Date,
      default: null,
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

  if (!this.provinceSlug) {
    this.provinceSlug = slugify(this.province);
  }

  if (Array.isArray(this.localLevels)) {
    this.localLevels = this.localLevels.map((item) => ({
      ...item,
      name: (item.name || "").trim(),
      type: (item.type || "").trim(),
      slug: item.slug || slugify(item.name || ""),
    }));
  }
});

districtSchema.index({ normalizedName: 1, province: 1 }, { unique: true });
districtSchema.index({ province: 1, name: 1 });
districtSchema.index({ provinceSlug: 1, slug: 1 });

module.exports = mongoose.model("District", districtSchema);
