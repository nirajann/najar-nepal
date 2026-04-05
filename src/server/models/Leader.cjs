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

const leaderSchema = new mongoose.Schema(
  {
    leaderId: {
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

    role: {
      type: String,
      enum: [
        "Prime Minister",
        "Minister",
        "MP",
        "National Assembly Member",
        "Mayor",
        "Chairperson",
      ],
      required: true,
      index: true,
    },

    chamber: {
      type: String,
      enum: ["House of Representatives", "National Assembly", ""],
      default: "",
      trim: true,
    },

    portfolio: {
      type: String,
      default: "",
      trim: true,
    },

    party: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      default: null,
      index: true,
    },

    province: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    localLevel: {
      type: String,
      default: "",
      trim: true,
    },

    ward: {
      type: String,
      default: "",
      trim: true,
    },

    currentStatus: {
      type: String,
      enum: ["Current", "Former"],
      default: "Current",
      index: true,
    },

    age: {
      type: Number,
      default: null,
      min: 0,
    },

    birthPlace: {
      type: String,
      default: "",
      trim: true,
    },

    permanentAddress: {
      type: String,
      default: "",
      trim: true,
    },

    gender: {
      type: String,
      default: "",
      trim: true,
    },

    photo: {
      type: String,
      default: "",
      trim: true,
    },

    officialSourceUrl: {
      type: String,
      default: "",
      trim: true,
    },

    electionSourceUrl: {
      type: String,
      default: "",
      trim: true,
    },

    badge: {
      type: String,
      default: "",
      trim: true,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    startYear: {
      type: String,
      default: "",
      trim: true,
    },

    endYear: {
      type: String,
      default: "Present",
      trim: true,
    },
  },
  { timestamps: true }
);
leaderSchema.pre("validate", function () {
  this.name = (this.name || "").trim();
  this.normalizedName = normalizeText(this.name);

  if (!this.slug) {
    this.slug = slugify(this.name);
  }

  if (!this.leaderId) {
    const roleSlug = slugify(this.role || "leader");
    this.leaderId = `${slugify(this.name)}-${roleSlug}`;
  }
});

leaderSchema.index(
  { normalizedName: 1, role: 1, district: 1 },
  { unique: true }
);

module.exports = mongoose.model("Leader", leaderSchema);