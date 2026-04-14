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

const positionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

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
      trim: true,
    },

    institution: {
      type: String,
      default: "",
      trim: true,
    },

    ministry: {
      type: String,
      default: "",
      trim: true,
    },

    portfolio: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Current", "Former"],
      default: "Current",
      trim: true,
    },

    fromDate: {
      type: Date,
      default: null,
    },

    toDate: {
      type: Date,
      default: null,
    },

    sourceUrl: {
      type: String,
      default: "",
      trim: true,
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
        "Ward Chairperson",
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

    currentOffice: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    portfolio: {
      type: String,
      default: "",
      trim: true,
    },

    positions: {
      type: [positionSchema],
      default: [],
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
      index: true,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
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

    lastVerifiedAt: {
      type: Date,
      default: null,
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
    this.leaderId = slugify(this.name);
  }

  if (!this.currentOffice && Array.isArray(this.positions) && this.positions.length > 0) {
    const currentPosition = this.positions.find((item) => item.status === "Current");
    if (currentPosition?.title) {
      this.currentOffice = currentPosition.title;
    }
  }
});

leaderSchema.index({ normalizedName: 1, district: 1 }, { unique: true });
leaderSchema.index({ province: 1, districtName: 1, role: 1 });
leaderSchema.index({ party: 1, role: 1 });

module.exports = mongoose.model("Leader", leaderSchema);
