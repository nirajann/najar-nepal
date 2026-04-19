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

const positionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },

    type: {
      type: String,
      enum: [
        "Prime Minister",
        "Deputy Prime Minister",
        "Minister",
        "Speaker",
        "Deputy Speaker",
        "MP",
        "National Assembly Member",
        "Mayor",
        "Chairperson",
        "Ward Chairperson",
        "Chief Minister",
        "Provincial Minister",
        "Committee Role",
        "Other",
      ],
      default: "Other",
    },

    institution: { type: String, default: "", trim: true, maxlength: 150 },
    ministry: { type: String, default: "", trim: true, maxlength: 150 },
    portfolio: { type: String, default: "", trim: true, maxlength: 150 },

    status: {
      type: String,
      enum: ["Current", "Former"],
      default: "Current",
    },

    fromDate: { type: Date, default: null },
    toDate: { type: Date, default: null },

    sourceUrl: {
      type: String,
      default: "",
      set: cleanUrl,
    },
  },
  { _id: false }
);

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
      maxlength: 150,
    },

    normalizedName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    aliases: {
      type: [String],
      default: [],
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
        "Ward Chairperson",
      ],
      required: true,
      index: true,
    },

    chamber: {
      type: String,
      enum: ["House of Representatives", "National Assembly", ""],
      default: "",
    },

    currentOffice: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
      index: true,
    },

    portfolio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
    },

    positions: {
      type: [positionSchema],
      default: [],
    },

    party: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
      index: true,
    },

    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      default: null,
      index: true,
    },

    districtName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    constituency: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    electionProcess: {
      type: String,
      default: "",
      trim: true,
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
      min: 18,
      max: 120,
    },

    birthPlace: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
    },

    permanentAddress: {
      type: String,
      default: "",
      trim: true,
      maxlength: 250,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: "",
    },

    photo: {
      type: String,
      default: "",
      set: cleanUrl,
    },

    officialSourceUrl: {
      type: String,
      default: "",
      set: cleanUrl,
    },

    electionSourceUrl: {
      type: String,
      default: "",
      set: cleanUrl,
    },

    shortBio: {
      type: String,
      default: "",
      maxlength: 500,
    },

    badge: {
      type: String,
      default: "",
      trim: true,
    },

    verified: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastVerifiedAt: {
      type: Date,
      default: null,
    },

    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },

    startYear: { type: String, default: "" },
    endYear: { type: String, default: "Present" },

    /* Cached metrics */
    totalLikes: { type: Number, default: 0 },
    totalDislikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 },

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
  {
    timestamps: true,
  }
);

/* AUTO CLEANUP */
leaderSchema.pre("validate", function () {
  this.name = String(this.name || "").trim();

  this.normalizedName = normalizeText(this.name);

  if (!this.slug) this.slug = slugify(this.name);

  if (!this.leaderId) this.leaderId = slugify(this.name);

  this.photo = cleanUrl(this.photo);
  this.officialSourceUrl = cleanUrl(this.officialSourceUrl);
  this.electionSourceUrl = cleanUrl(this.electionSourceUrl);

  if (!this.currentOffice && this.positions.length > 0) {
    const active = this.positions.find((p) => p.status === "Current");
    if (active?.title) this.currentOffice = active.title;
  }

  if (!Array.isArray(this.aliases)) this.aliases = [];
});

/* FILTER SOFT DELETED BY DEFAULT */
leaderSchema.pre(/^find/, function () {
  if (!this.getQuery().includeDeleted) {
    this.where({ isDeleted: false });
  }
});

/* INDEXES */
leaderSchema.index(
  { normalizedName: 1, district: 1 },
  { unique: true }
);

leaderSchema.index({ province: 1, districtName: 1, role: 1 });
leaderSchema.index({ party: 1, role: 1 });
leaderSchema.index({ verified: 1, role: 1 });
leaderSchema.index({ engagementScore: -1 });

/* TEXT SEARCH */
leaderSchema.index({
  name: "text",
  party: "text",
  role: "text",
  districtName: "text",
  province: "text",
  currentOffice: "text",
});

module.exports = mongoose.model("Leader", leaderSchema);