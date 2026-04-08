const express = require("express");
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware.cjs");
const adminMiddleware = require("../middleware/adminMiddleware.cjs");

const Leader = require("../models/Leader.cjs");
const Comment = require("../models/Comment.cjs");
const Rating = require("../models/Rating.cjs");
const Complaint = require("../models/Complaint.cjs");
const { AnalyticsEvent } = require("../models/AnalyticsEvent.cjs");

const router = express.Router();

function normalizeLeaderId(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value.leaderId) return value.leaderId;
  if (value._id) return String(value._id);
  return null;
}

router.get(
  "/overview",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const [leaders, comments, ratings, complaints, topViewedLeadersRaw, activeDistricts, eventTotals] = await Promise.all([
        Leader.find({}).lean(),
        Comment.find({}).lean(),
        Rating.find({}).lean(),
        Complaint.find({}).lean(),
        AnalyticsEvent.aggregate([
          {
            $match: {
              eventName: "leader_profile_viewed",
              entityId: { $ne: "" },
            },
          },
          {
            $group: {
              _id: "$entityId",
              entityName: { $first: "$entityName" },
              totalViews: { $sum: 1 },
              lastViewedAt: { $max: "$occurredAt" },
              uniqueDaily: {
                $addToSet: {
                  visitorKey: "$visitorKey",
                  dayBucket: "$dayBucket",
                },
              },
              uniqueWeekly: {
                $addToSet: {
                  visitorKey: "$visitorKey",
                  weekBucket: "$weekBucket",
                },
              },
              sourcePages: { $addToSet: "$sourcePage" },
            },
          },
          {
            $project: {
              _id: 0,
              leaderId: "$_id",
              name: "$entityName",
              totalViews: 1,
              lastViewedAt: 1,
              uniqueDailyViews: { $size: "$uniqueDaily" },
              uniqueWeeklyViews: { $size: "$uniqueWeekly" },
              sourcePages: 1,
            },
          },
          { $sort: { totalViews: -1, uniqueWeeklyViews: -1 } },
          { $limit: 10 },
        ]),
        AnalyticsEvent.aggregate([
          {
            $match: {
              eventName: "district_selected",
              entityId: { $ne: "" },
            },
          },
          {
            $group: {
              _id: "$entityId",
              districtName: { $first: "$entityName" },
              totalSelections: { $sum: 1 },
              uniqueDaily: {
                $addToSet: {
                  visitorKey: "$visitorKey",
                  dayBucket: "$dayBucket",
                },
              },
              lastSelectedAt: { $max: "$occurredAt" },
            },
          },
          {
            $project: {
              _id: 0,
              districtId: "$_id",
              districtName: 1,
              totalSelections: 1,
              uniqueDailySelections: { $size: "$uniqueDaily" },
              lastSelectedAt: 1,
            },
          },
          { $sort: { totalSelections: -1 } },
          { $limit: 10 },
        ]),
        AnalyticsEvent.aggregate([
          {
            $group: {
              _id: "$eventName",
              total: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
        ]),
      ]);

      const leaderMap = new Map();

      leaders.forEach((leader) => {
        const key = leader.leaderId || String(leader._id);
        leaderMap.set(key, {
          _id: leader._id,
          leaderId: leader.leaderId,
          name: leader.name,
          role: leader.role,
          district: leader.district,
          province: leader.province,
          photo: leader.photo || "",
          likeCount: leader.likes || 0,
          dislikeCount: leader.dislikes || 0,
          voteCount: leader.votes || 0,
          commentCount: 0,
          ratingCount: 0,
          ratingSum: 0,
          avgRating: 0,
          complaintCount: 0,
          engagementScore: 0,
        });
      });

      comments.forEach((comment) => {
        const key = normalizeLeaderId(comment.leaderId);
        if (!key || !leaderMap.has(key)) return;
        leaderMap.get(key).commentCount += 1;
      });

      ratings.forEach((rating) => {
        const key = normalizeLeaderId(rating.leaderId);
        if (!key || !leaderMap.has(key)) return;
        const item = leaderMap.get(key);
        item.ratingCount += 1;
        item.ratingSum += Number(rating.value || rating.rating || 0);
      });

      complaints.forEach((complaint) => {
        const key = normalizeLeaderId(complaint.leaderId);
        if (key && leaderMap.has(key)) {
          leaderMap.get(key).complaintCount += 1;
        }
      });

      const leaderStats = Array.from(leaderMap.values()).map((leader) => {
        const avgRating =
          leader.ratingCount > 0 ? leader.ratingSum / leader.ratingCount : 0;

        const engagementScore =
          leader.likeCount * 2 +
          leader.voteCount * 2 +
          leader.commentCount * 3 +
          avgRating * 10 -
          leader.dislikeCount * 2;

        return {
          ...leader,
          avgRating: Number(avgRating.toFixed(2)),
          engagementScore: Number(engagementScore.toFixed(2)),
        };
      });

      const totalLikes = leaderStats.reduce((sum, item) => sum + item.likeCount, 0);
      const totalDislikes = leaderStats.reduce(
        (sum, item) => sum + item.dislikeCount,
        0
      );
      const totalVotes = leaderStats.reduce((sum, item) => sum + item.voteCount, 0);
      const totalComments = leaderStats.reduce(
        (sum, item) => sum + item.commentCount,
        0
      );
      const totalRatings = leaderStats.reduce(
        (sum, item) => sum + item.ratingCount,
        0
      );

      const topPopular = [...leaderStats]
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 5);

      const mostDiscussed = [...leaderStats]
        .sort((a, b) => b.commentCount - a.commentCount)
        .slice(0, 5);

      const highestRated = [...leaderStats]
        .filter((item) => item.ratingCount > 0)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 5);

      const lowestRated = [...leaderStats]
        .filter((item) => item.ratingCount > 0)
        .sort((a, b) => a.avgRating - b.avgRating)
        .slice(0, 5);

      const districtComplaintMap = new Map();

      complaints.forEach((complaint) => {
        const district = complaint.district || "Unknown";
        districtComplaintMap.set(
          district,
          (districtComplaintMap.get(district) || 0) + 1
        );
      });

      const topComplaintDistricts = Array.from(districtComplaintMap.entries())
        .map(([district, count]) => ({ district, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const recentActivity = [
        {
          label: "New comments",
          value: totalComments,
        },
        {
          label: "New ratings",
          value: totalRatings,
        },
        {
          label: "Complaint signals",
          value: complaints.length,
        },
        {
          label: "Vote actions",
          value: totalVotes,
        },
      ];

      const trackedEvents = {
        totalEvents: eventTotals.reduce((sum, item) => sum + item.total, 0),
        totalsByEvent: eventTotals,
        topViewedLeaders: topViewedLeadersRaw,
        activeDistricts,
      };

      res.json({
        totals: {
          leaders: leaders.length,
          comments: totalComments,
          ratings: totalRatings,
          complaints: complaints.length,
          likes: totalLikes,
          dislikes: totalDislikes,
          votes: totalVotes,
        },
        topPopular,
        mostDiscussed,
        highestRated,
        lowestRated,
        topComplaintDistricts,
        recentActivity,
        trackedEvents,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to load analytics overview",
        error: error.message,
      });
    }
  }
);

router.get(
  "/leader/:leaderId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { leaderId } = req.params;

      const leader = await Leader.findOne({
        $or: [{ leaderId }, { _id: mongoose.Types.ObjectId.isValid(leaderId) ? leaderId : null }],
      }).lean();

      if (!leader) {
        return res.status(404).json({ message: "Leader not found" });
      }

      const key = leader.leaderId || String(leader._id);

      const [comments, ratings, complaints] = await Promise.all([
        Comment.find({ leaderId: key }).sort({ createdAt: -1 }).lean(),
        Rating.find({ leaderId: key }).sort({ createdAt: -1 }).lean(),
        Complaint.find({ leaderId: key }).sort({ createdAt: -1 }).lean(),
      ]);

      const likeCount = leader.likes || 0;
      const dislikeCount = leader.dislikes || 0;
      const voteCount = leader.votes || 0;
      const commentCount = comments.length;
      const ratingCount = ratings.length;
      const avgRating =
        ratingCount > 0
          ? ratings.reduce((sum, item) => sum + Number(item.value || item.rating || 0), 0) /
            ratingCount
          : 0;

      const engagementScore =
        likeCount * 2 +
        voteCount * 2 +
        commentCount * 3 +
        avgRating * 10 -
        dislikeCount * 2;

      res.json({
        leader: {
          _id: leader._id,
          leaderId: leader.leaderId,
          name: leader.name,
          role: leader.role,
          district: leader.district,
          province: leader.province,
          photo: leader.photo || "",
        },
        metrics: {
          likeCount,
          dislikeCount,
          voteCount,
          commentCount,
          ratingCount,
          complaintCount: complaints.length,
          avgRating: Number(avgRating.toFixed(2)),
          engagementScore: Number(engagementScore.toFixed(2)),
        },
        recentComments: comments.slice(0, 10),
        recentRatings: ratings.slice(0, 10),
        recentComplaints: complaints.slice(0, 10),
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to load leader analytics",
        error: error.message,
      });
    }
  }
);

module.exports = router;
