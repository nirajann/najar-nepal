import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

type LeaderDistrict =
  | string
  | {
      _id?: string;
      districtId?: string;
      name?: string;
      province?: string;
      localLevels?: any[];
    };

type Leader = {
  _id?: string;
  leaderId: string;
  name: string;
  role: string;
  party?: string;
  district?: LeaderDistrict;
  province?: string;
  currentStatus?: string;
  photo?: string;
  badge?: string;
  verified?: boolean;
  startYear?: string;
  endYear?: string;
  portfolio?: string;
  age?: number | string;
  birthPlace?: string;
  permanentAddress?: string;
  streak?: number;
  siteMetrics?: {
    followers?: number;
    ratingAverage?: number;
  };
};

type CommentItem = {
  _id: string;
  userName: string;
  text: string;
  rating?: number;
  likes?: number;
  replies?: {
    userName: string;
    text: string;
    createdAt?: string;
  }[];
};

type ComplaintItem = {
  _id: string;
  leaderId: string;
  userId: string;
  userName?: string;
  message: string;
  type?: string;
  photo?: string;
  adminNote?: string;
  status?: "pending" | "reviewed" | "resolved";
  createdAt?: string;
};

function getDistrictName(district?: LeaderDistrict) {
  if (!district) return "";
  if (typeof district === "string") return district;
  return district.name || "";
}

function getProvinceName(leader?: Leader | null) {
  if (!leader) return "";
  if (leader.province) return leader.province;
  if (leader.district && typeof leader.district !== "string") {
    return leader.district.province || "";
  }
  return "";
}

function LeaderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();

  const [leader, setLeader] = useState<Leader | null>(null);
  const [leaderLoading, setLeaderLoading] = useState(true);

  const [liked, setLiked] = useState<boolean | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [complaint, setComplaint] = useState("");

  const [pageMessage, setPageMessage] = useState("");
  const [commentsError, setCommentsError] = useState("");
  const [reactionError, setReactionError] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [complaintMessage, setComplaintMessage] = useState("");

  const [commentLoading, setCommentLoading] = useState(false);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [complaintType, setComplaintType] = useState("Other");
  const [complaintPhoto, setComplaintPhoto] = useState("");
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [complaintHistory, setComplaintHistory] = useState<ComplaintItem[]>([]);

  const [stats, setStats] = useState({
    likes: 0,
    dislikes: 0,
    totalReactions: 0,
    averageRating: 0,
    likePercentage: "0.0",
    dislikePercentage: "0.0",
    ratingCount: 0,
  });

  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [commentSort, setCommentSort] = useState("newest");
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const ensureLogin = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return false;
    }
    return true;
  };

  const loadLeader = async () => {
    if (!id) return;

    try {
      setLeaderLoading(true);
      setPageMessage("");
      const data = await api.getLeaderById(id);
      setLeader(data?.leader || data || null);
    } catch (error: any) {
      setLeader(null);
      setPageMessage(error.message || "Leader not found");
    } finally {
      setLeaderLoading(false);
    }
  };

  const loadLeaderData = async () => {
    if (!leader) return;

    try {
      setCommentsError("");
      const statsData = await api.getLeaderStats(leader.leaderId);
      setStats({
        likes: statsData?.likes ?? 0,
        dislikes: statsData?.dislikes ?? 0,
        totalReactions: statsData?.totalReactions ?? 0,
        averageRating: statsData?.averageRating ?? statsData?.rating ?? 0,
        likePercentage: statsData?.likePercentage ?? "0.0",
        dislikePercentage: statsData?.dislikePercentage ?? "0.0",
        ratingCount: statsData?.ratingCount ?? 0,
      });

      const commentsData = await api.getComments(leader.leaderId, commentSort);
      setCommentsList(Array.isArray(commentsData) ? commentsData : commentsData?.comments || []);
    } catch (error: any) {
      setCommentsError(error.message || "Failed to load leader activity");
    }
  };

  const loadComplaintHistory = async () => {
    if (!token || !leader) return;

    try {
      const data = await api.getMyComplaintsByLeader(token, leader.leaderId);
      setComplaintHistory(Array.isArray(data) ? data : data?.complaints || []);
    } catch (error: any) {
      setComplaintMessage(error.message || "Failed to load complaint history");
    }
  };

  useEffect(() => {
    loadLeader();
  }, [id]);

  useEffect(() => {
    if (leader) {
      loadLeaderData();
    }
  }, [leader, commentSort]);

  useEffect(() => {
    if (token && leader) {
      loadComplaintHistory();
    }
  }, [token, leader]);

  const handleLike = async (value: boolean) => {
    if (!ensureLogin() || !token || !leader) return;

    try {
      setReactionLoading(true);
      setReactionError("");
      setLiked(value);

      const result = await api.submitRating(
        token,
        leader.leaderId,
        rating > 0 ? rating : 1,
        value ? "like" : "dislike"
      );

      setPageMessage(result?.message || "Reaction saved");
      await loadLeaderData();
    } catch (error: any) {
      setReactionError(error.message || "Failed to save reaction");
    } finally {
      setReactionLoading(false);
    }
  };

  const handleRating = async (value: number) => {
    if (!ensureLogin() || !token || !leader) return;

    try {
      setRatingLoading(true);
      setRatingError("");
      setRating(value);

      const result = await api.submitRating(token, leader.leaderId, value);
      setPageMessage(result?.message || "Rating saved");
      await loadLeaderData();
    } catch (error: any) {
      setRatingError(error.message || "Failed to save rating");
    } finally {
      setRatingLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ensureLogin() || !token || !leader) return;

    if (!comment.trim()) {
      setCommentsError("Comment cannot be empty");
      return;
    }

    try {
      setCommentLoading(true);
      setCommentsError("");
      await api.createComment(token, leader.leaderId, comment.trim(), rating || 0);
      setPageMessage("Comment posted");
      setComment("");
      await loadLeaderData();
    } catch (error: any) {
      setCommentsError(error.message || "Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ensureLogin() || !token || !leader) return;

    if (!complaint.trim()) {
      setComplaintMessage("Complaint message cannot be empty.");
      return;
    }

    if (complaint.trim().length < 10) {
      setComplaintMessage("Complaint must be at least 10 characters.");
      return;
    }

    try {
      setComplaintLoading(true);
      setComplaintMessage("");

      const result = await api.submitComplaint(
        token,
        leader.leaderId,
        complaint.trim(),
        complaintType,
        complaintPhoto
      );

      setComplaintMessage(result?.message || "Complaint submitted successfully.");
      setComplaint("");
      setComplaintPhoto("");
      setComplaintType("Other");
      await loadComplaintHistory();
    } catch (error: any) {
      setComplaintMessage(error.message || "Failed to submit complaint.");
    } finally {
      setComplaintLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!ensureLogin() || !token) return;

    try {
      await api.likeComment(token, commentId);
      await loadLeaderData();
    } catch (error: any) {
      setCommentsError(error.message || "Failed to like comment");
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!ensureLogin() || !token) return;
    if (!replyText[commentId]?.trim()) return;

    try {
      await api.replyComment(token, commentId, replyText[commentId].trim());
      setReplyText((prev) => ({ ...prev, [commentId]: "" }));
      await loadLeaderData();
    } catch (error: any) {
      setCommentsError(error.message || "Failed to reply");
    }
  };

  const displayRole = leader?.role || "";
  const displayRating =
    stats.averageRating && stats.averageRating > 0
      ? stats.averageRating
      : leader?.siteMetrics?.ratingAverage || 0;

  const displayFollowers = leader?.siteMetrics?.followers || 0;

  if (leaderLoading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h1 className="text-3xl font-bold text-slate-900">Loading leader...</h1>
          </div>
        </main>
      </div>
    );
  }

  if (!leader) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h1 className="text-3xl font-bold text-slate-900">Leader not found</h1>
            <p className="text-slate-500 mt-2">
              {pageMessage || "This profile is not connected yet in the real leader dataset."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {pageMessage && (
          <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 text-sm text-slate-700 shadow-sm">
            {pageMessage}
          </div>
        )}

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {leader.photo ? (
              <img
                src={leader.photo}
                alt={leader.name}
                className="w-36 h-36 md:w-44 md:h-44 rounded-3xl object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-3xl bg-slate-200 border border-slate-200 shadow-sm" />
            )}

            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-4">
                {leader.badge && (
                  <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-sm font-semibold">
                    {leader.badge}
                  </span>
                )}

                {leader.verified && (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                    Verified
                  </span>
                )}

                {(leader.startYear || leader.endYear) && (
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                    {leader.startYear || "—"} - {leader.endYear || "Present"}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900">
                {leader.name}
              </h1>

              <p className="text-blue-600 font-semibold mt-3 text-lg md:text-xl">
                {leader.currentStatus} {displayRole}
              </p>

              <p className="text-slate-700 mt-2 text-lg">{leader.party}</p>

              <p className="text-slate-500 mt-1">
                {getDistrictName(leader.district)
                  ? `District: ${getDistrictName(leader.district)}`
                  : "District not added yet"}
                {getProvinceName(leader) ? `, ${getProvinceName(leader)}` : ""}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard label="Likes" value={stats.likes} />
          <StatCard label="Dislikes" value={stats.dislikes} />
          <StatCard label="Rating" value={displayRating} />
          <StatCard label="Comments" value={commentsList.length} />
          <StatCard label="Followers" value={displayFollowers} />
          <StatCard label="Streak" value={leader.streak ? `${leader.streak} weeks` : "—"} />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <h2 className="text-2xl font-bold text-slate-900">Community Discussion</h2>

                <select
                  value={commentSort}
                  onChange={(e) => setCommentSort(e.target.value)}
                  className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest</option>
                  <option value="liked">Most Liked</option>
                  <option value="highest-rated">Highest Rated</option>
                  <option value="lowest-rated">Lowest Rated</option>
                </select>
              </div>

              {commentsError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {commentsError}
                </div>
              )}

              <form onSubmit={handleCommentSubmit} className="space-y-4 mb-6">
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this leader..."
                  className="w-full rounded-3xl border border-slate-300 px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-3xl ${
                          rating >= star ? "text-yellow-400" : "text-slate-300"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={commentLoading}
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                  >
                    {commentLoading ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {commentsList.length > 0 ? (
                  commentsList.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{item.userName}</p>
                        <p className="text-sm text-slate-500 mt-1">
                          Rating: {item.rating || 0} • Likes: {item.likes || 0}
                        </p>
                      </div>

                      <p className="text-slate-700 mt-4 leading-7">{item.text}</p>

                      <div className="flex flex-wrap gap-3 mt-4">
                        <button
                          onClick={() => handleLikeComment(item._id)}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-white text-sm font-medium"
                        >
                          Like
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {item.replies?.map((reply, index) => (
                          <div
                            key={index}
                            className="ml-2 md:ml-6 rounded-2xl bg-white border border-slate-200 p-4"
                          >
                            <p className="font-semibold text-slate-800">{reply.userName}</p>
                            <p className="text-slate-700 mt-2">{reply.text}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <textarea
                          rows={2}
                          value={replyText[item._id] || ""}
                          onChange={(e) =>
                            setReplyText((prev) => ({
                              ...prev,
                              [item._id]: e.target.value,
                            }))
                          }
                          placeholder="Write a reply..."
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <button
                          onClick={() => handleReplySubmit(item._id)}
                          className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-medium"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No comments yet.</p>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Public Reaction</h2>

              {reactionError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {reactionError}
                </div>
              )}

              <div className="flex gap-3 mb-5">
                <button
                  onClick={() => handleLike(true)}
                  disabled={reactionLoading}
                  className={`flex-1 rounded-2xl px-4 py-3 font-semibold transition disabled:opacity-60 ${
                    liked === true
                      ? "bg-green-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {reactionLoading && liked === true ? "Saving..." : "Like"}
                </button>

                <button
                  onClick={() => handleLike(false)}
                  disabled={reactionLoading}
                  className={`flex-1 rounded-2xl px-4 py-3 font-semibold transition disabled:opacity-60 ${
                    liked === false
                      ? "bg-red-500 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {reactionLoading && liked === false ? "Saving..." : "Dislike"}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-slate-600 mb-1">
                    <span>Like</span>
                    <span>{stats.likePercentage}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${stats.likePercentage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-slate-600 mb-1">
                    <span>Dislike</span>
                    <span>{stats.dislikePercentage}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${stats.dislikePercentage}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-slate-500">
                    Average rating: {displayRating} ({stats.ratingCount} votes)
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick Rating</h2>

              {ratingError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {ratingError}
                </div>
              )}

              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    disabled={ratingLoading}
                    className={`text-3xl disabled:opacity-60 ${
                      rating >= star ? "text-yellow-400" : "text-slate-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <p className="text-sm text-slate-500">
                Rate once and update later anytime.
              </p>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Submit Complaint</h2>

              {complaintMessage && (
                <div className="mb-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {complaintMessage}
                </div>
              )}

              <form onSubmit={handleComplaintSubmit} className="space-y-4">
                <select
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Other">Other</option>
                  <option value="Corruption">Corruption</option>
                  <option value="Road">Road</option>
                  <option value="Water">Water</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Abuse of Power">Abuse of Power</option>
                  <option value="Delay">Delay</option>
                </select>

                <input
                  type="text"
                  value={complaintPhoto}
                  onChange={(e) => setComplaintPhoto(e.target.value)}
                  placeholder="Photo proof URL (optional for now)"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <textarea
                  rows={5}
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Write your complaint..."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="submit"
                  disabled={complaintLoading}
                  className="w-full rounded-2xl bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {complaintLoading ? "Submitting..." : "Submit Complaint"}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Your Complaint History</h3>

                {complaintHistory.length > 0 ? (
                  <div className="space-y-3">
                    {complaintHistory.map((item) => (
                      <div
                        key={item._id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className="text-sm font-semibold text-blue-700">
                            {item.type || "Other"}
                          </span>

                          <span className="text-sm font-semibold text-amber-700 capitalize">
                            {item.status || "pending"}
                          </span>
                        </div>

                        <p className="text-slate-700 text-sm leading-6">{item.message}</p>

                        {item.photo && (
                          <a
                            href={item.photo}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block mt-3 text-sm font-semibold text-blue-700 hover:underline"
                          >
                            View attached proof
                          </a>
                        )}

                        {item.adminNote && (
                          <div className="mt-3 rounded-xl bg-white border border-slate-200 p-3">
                            <p className="text-xs font-bold text-slate-500 mb-1">Admin Note</p>
                            <p className="text-sm text-slate-700">{item.adminNote}</p>
                          </div>
                        )}

                        <p className="text-xs text-slate-500 mt-3">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">
                    No previous complaints submitted for this leader yet.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 mt-2">{value}</p>
    </div>
  );
}

export default LeaderProfile;