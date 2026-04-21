const express = require("express");
const District = require("../models/District.cjs");
const DistrictFeedback = require("../models/DistrictFeedback.cjs");
const authMiddleware = require("../middleware/authMiddleware.cjs");

const router = express.Router();

function average(values = []) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundScore(value) {
  return Math.round(value * 10) / 10;
}

function computeOverallScore(payload) {
  const values = [
    Number(payload.transportation) || 0,
    Number(payload.roads) || 0,
    Number(payload.safety) || 0,
    Number(payload.cleanliness) || 0,
    Number(payload.publicServices) || 0,
    Number(payload.scenery) || 0,
  ];

  return roundScore(average(values));
}

function normalizeDistrictKey(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\(.*?\)/g, "");
}

function slugifyDistrictKey(value = "") {
  return normalizeDistrictKey(value).replace(/\s+/g, "-");
}

async function findDistrictByAnyKey(rawDistrictId) {
  const districtKey = String(rawDistrictId || "").trim();
  const normalizedKey = normalizeDistrictKey(districtKey);
  const slugKey = slugifyDistrictKey(districtKey);

  console.log("district lookup input:", {
    rawDistrictId,
    districtKey,
    normalizedKey,
    slugKey,
  });

  const districtSamples = await District.find({})
    .select("districtId slug name normalizedName province provinceSlug")
    .limit(20)
    .lean();

  console.log("district samples:", districtSamples);

  const districts = await District.find({})
    .select("districtId slug name normalizedName province provinceSlug")
    .lean();

  return (
    districts.find((district) => {
      const candidates = [
        district?.districtId,
        district?.slug,
        district?.name,
        district?.normalizedName,
      ]
        .filter(Boolean)
        .map((value) => normalizeDistrictKey(value));

      return (
        candidates.includes(normalizedKey) ||
        candidates.includes(normalizeDistrictKey(slugKey))
      );
    }) || null
  );
}

function formatSummaryResponse(districtId, districtName, summary) {
  const verifiedContributors = Number(summary?.verifiedRatingsCount) || 0;
  const hasVerifiedFeedback = verifiedContributors > 0;

  return {
    districtId,
    districtName,
    status: hasVerifiedFeedback ? "ready" : "empty",
    score: hasVerifiedFeedback ? summary.satisfactionScore : null,
    verifiedContributors,
    categoryScores: summary?.categoryScores || {
      transportation: 0,
      roads: 0,
      safety: 0,
      cleanliness: 0,
      publicServices: 0,
      scenery: 0,
    },
  };
}

async function recalculateDistrictAggregate(districtId) {
  const verifiedFeedback = await DistrictFeedback.find({
    districtId,
    isVerifiedSnapshot: true,
  });

  if (!verifiedFeedback.length) {
    await District.findOneAndUpdate(
      { districtId },
      {
        $set: {
          satisfactionScore: 0,
        },
      }
    );

    return {
      satisfactionScore: 0,
      ratingsCount: 0,
      verifiedRatingsCount: 0,
      categoryScores: {
        transportation: 0,
        roads: 0,
        safety: 0,
        cleanliness: 0,
        publicServices: 0,
        scenery: 0,
      },
    };
  }

  const categoryScores = {
    transportation: roundScore(
      average(verifiedFeedback.map((item) => item.transportation || 0))
    ),
    roads: roundScore(average(verifiedFeedback.map((item) => item.roads || 0))),
    safety: roundScore(average(verifiedFeedback.map((item) => item.safety || 0))),
    cleanliness: roundScore(
      average(verifiedFeedback.map((item) => item.cleanliness || 0))
    ),
    publicServices: roundScore(
      average(verifiedFeedback.map((item) => item.publicServices || 0))
    ),
    scenery: roundScore(average(verifiedFeedback.map((item) => item.scenery || 0))),
  };

  const satisfactionScore = roundScore(
    average([
      categoryScores.transportation,
      categoryScores.roads,
      categoryScores.safety,
      categoryScores.cleanliness,
      categoryScores.publicServices,
      categoryScores.scenery,
    ])
  );

  await District.findOneAndUpdate(
    { districtId },
    {
      $set: {
        satisfactionScore,
      },
    }
  );

  return {
    satisfactionScore,
    ratingsCount: verifiedFeedback.length,
    verifiedRatingsCount: verifiedFeedback.length,
    categoryScores,
  };
}

// Get aggregate district feedback summary
router.get("/:districtId/summary", async (req, res) => {
  try {
    const district = await findDistrictByAnyKey(req.params.districtId);

    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    const summary = await recalculateDistrictAggregate(district.districtId);
    res.json(formatSummaryResponse(district.districtId, district.name, summary));
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch district feedback summary",
      error: error.message,
    });
  }
});

// Submit or update feedback for one district by one verified user
router.post("/:districtId", authMiddleware, async (req, res) => {
  try {
    const district = await findDistrictByAnyKey(req.params.districtId);

    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    const isVerified =
      req.user?.verificationStatus === "verified" ||
      req.user?.isVerified === true;

    if (!isVerified) {
      return res.status(403).json({
        message: "Only verified users can submit district feedback",
      });
    }

    const payload = {
      transportation: Number(req.body.transportation),
      roads: Number(req.body.roads),
      safety: Number(req.body.safety),
      cleanliness: Number(req.body.cleanliness),
      publicServices: Number(req.body.publicServices),
      scenery: Number(req.body.scenery),
    };

    const values = Object.values(payload);

    const invalidValue = values.some(
      (value) => Number.isNaN(value) || value < 0 || value > 100
    );

    if (invalidValue) {
      return res.status(400).json({
        message: "All district feedback scores must be numbers between 0 and 100",
      });
    }

    const overallScore = computeOverallScore(payload);

    const feedback = await DistrictFeedback.findOneAndUpdate(
      {
        districtId: district.districtId,
        userId: req.user.id,
      },
      {
        $set: {
          districtId: district.districtId,
          userId: req.user.id,
          isVerifiedSnapshot: true,
          ...payload,
          overallScore,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const summary = await recalculateDistrictAggregate(district.districtId);

    res.status(201).json({
      message: "District feedback saved successfully",
      feedback,
      summary: formatSummaryResponse(district.districtId, district.name, summary),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save district feedback",
      error: error.message,
    });
  }
});

// Get current user's feedback for one district
router.get("/:districtId/my-feedback", authMiddleware, async (req, res) => {
  try {
    const district = await findDistrictByAnyKey(req.params.districtId);

    if (!district) {
      return res.status(404).json({ message: "District not found" });
    }

    const feedback = await DistrictFeedback.findOne({
      districtId: district.districtId,
      userId: req.user.id,
    });

    res.json({
      districtId: district.districtId,
      hasFeedback: Boolean(feedback),
      feedback: feedback || null,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch your district feedback",
      error: error.message,
    });
  }
});

module.exports = router;
