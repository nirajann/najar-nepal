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

function cleanUrl(value = "") {
  const url = String(value || "").trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return "";
}

const localLevelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    type: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },

    slug: {
      type: String,
      default: "",
      trim: true,
      maxlength: 140,
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
      maxlength: 120,
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
      maxlength: 120,
      index: true,
    },

    provinceSlug: {
      type: String,
      default: "",
      trim: true,
      maxlength: 140,
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
      set: cleanUrl,
    },

    lastVerifiedAt: {
      type: Date,
      default: null,
    },

    /* Cached metrics for fast public UI */
    totalLeaderCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalProjectsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalFeedbackCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    engagementScore: {
      type: Number,
      default: 0,
    },

    /* Safety */
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

districtSchema.pre("validate", function () {
  this.name = String(this.name || "").trim();
  this.province = String(this.province || "").trim();

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

  this.sourceUrl = cleanUrl(this.sourceUrl);

  if (Array.isArray(this.localLevels)) {
    const seen = new Set();

    this.localLevels = this.localLevels
      .map((item) => {
        const name = String(item?.name || "").trim();
        const type = String(item?.type || "").trim();
        const slug = String(item?.slug || slugify(name)).trim();

        return { name, type, slug };
      })
      .filter((item) => item.name)
      .filter((item) => {
        const key = normalizeText(item.name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  this.totalWards = Number.isFinite(this.totalWards) ? this.totalWards : 0;
  this.satisfactionScore = Number.isFinite(this.satisfactionScore)
    ? this.satisfactionScore
    : 0;
});

/* Hide soft-deleted records by default */
districtSchema.pre(/^find/, function () {
  if (!this.getQuery().includeDeleted) {
    this.where({
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } },
      ],
    });
  }
});

/* Duplicate protection */
districtSchema.index({ normalizedName: 1, province: 1 }, { unique: true });

/* Common filters */
districtSchema.index({ province: 1, name: 1 });
districtSchema.index({ provinceSlug: 1, slug: 1 });
districtSchema.index({ verified: 1, province: 1 });
districtSchema.index({ engagementScore: -1 });
districtSchema.index({ satisfactionScore: -1 });

/* Text search */
districtSchema.index({
  name: "text",
  province: "text",
  districtId: "text",
  "localLevels.name": "text",
  "localLevels.type": "text",
});

module.exports = mongoose.model("District", districtSchema);
