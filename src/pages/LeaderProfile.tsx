import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { NepalActionButton } from "../components/NepalDesignSystem";
import { useAuth } from "../context/useAuth";
import { api, type LeaderPublicProfileResponse } from "../services/api";

type LeaderDistrict =
  | string
  | {
      _id?: string;
      districtId?: string;
      name?: string;
      province?: string;
      localLevels?: unknown[];
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

type ReplyItem = {
  userName: string;
  text: string;
  createdAt?: string;
};

type CommentItem = {
  _id: string;
  userName: string;
  text: string;
  rating?: number;
  likes?: number;
  createdAt?: string;
  replies?: ReplyItem[];
};

type ComplaintItem = {
  _id: string;
  leaderId: string;
  userId: string;
  userName?: string;
  text: string;
  complaintType?: string;
  complaintPhoto?: string;
  adminNote?: string;
  status?: "pending" | "reviewed" | "resolved";
  createdAt?: string;
};

type ValidationResult = {
  valid: boolean;
  message: string;
};

type MistakeType =
  | "Wrong name"
  | "Wrong role"
  | "Wrong district"
  | "Wrong province"
  | "Wrong party"
  | "Wrong term dates"
  | "Wrong photo"
  | "Other";

const MISTAKE_OPTIONS: MistakeType[] = [
  "Wrong name",
  "Wrong role",
  "Wrong district",
  "Wrong province",
  "Wrong party",
  "Wrong term dates",
  "Wrong photo",
  "Other",
];

const REPORT_REASONS = [
  "Abuse",
  "Spam",
  "Misinformation",
  "Hate speech",
  "Offensive language",
] as const;

const BLOCKED_WORDS = [
  "fuck",
  "fucking",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "dick",
  "cunt",
  "motherfucker",
  "slut",
  "whore",
  "retard",
];

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

function normalizeTextInput(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function formatDateTime(value?: string) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString();
}

function hasBlockedWords(value: string) {
  const lower = value.toLowerCase();
  return BLOCKED_WORDS.some((word) => lower.includes(word));
}

function hasSpamPattern(value: string) {
  const lower = value.toLowerCase();
  return /(.)\1{5,}/.test(lower) || /(\b\w+\b)(\s+\1){3,}/i.test(lower);
}

function isMeaninglessShort(value: string) {
  const trimmed = normalizeTextInput(value);
  if (trimmed.length < 6) return true;
  return /^(ok+|wow+|hmm+|yes+|no+|nice+|lol+)$/i.test(trimmed);
}

function validateCommentText(value: string): ValidationResult {
  const trimmed = normalizeTextInput(value);

  if (!trimmed) {
    return { valid: false, message: "Comment cannot be empty." };
  }

  if (trimmed.length < 6) {
    return {
      valid: false,
      message: "Comment is too short. Please write something meaningful.",
    };
  }

  if (trimmed.length > 300) {
    return {
      valid: false,
      message: "Comment is too long. Please keep it under 300 characters.",
    };
  }

  if (isMeaninglessShort(trimmed)) {
    return {
      valid: false,
      message: "Please write a meaningful comment.",
    };
  }

  if (hasSpamPattern(trimmed)) {
    return {
      valid: false,
      message: "Your comment looks spammy. Please rewrite it clearly.",
    };
  }

  if (hasBlockedWords(trimmed)) {
    return {
      valid: false,
      message: "Please avoid offensive language. Keep discussion respectful.",
    };
  }

  return { valid: true, message: "" };
}

function validateReplyText(value: string): ValidationResult {
  const trimmed = normalizeTextInput(value);

  if (!trimmed) {
    return { valid: false, message: "Reply cannot be empty." };
  }

  if (trimmed.length < 3) {
    return { valid: false, message: "Reply is too short." };
  }

  if (trimmed.length > 220) {
    return {
      valid: false,
      message: "Reply is too long. Please keep it under 220 characters.",
    };
  }

  if (hasSpamPattern(trimmed)) {
    return {
      valid: false,
      message: "Your reply looks spammy. Please rewrite it clearly.",
    };
  }

  if (hasBlockedWords(trimmed)) {
    return {
      valid: false,
      message: "Please avoid offensive language in replies.",
    };
  }

  return { valid: true, message: "" };
}

function getTrustLabel(
  averageRating: number,
  commentCount: number,
  likes: number,
  dislikes: number
) {
  const totalReactions = likes + dislikes;
  const likeRatio = totalReactions > 0 ? likes / totalReactions : 0;

  if (commentCount >= 12 && averageRating >= 4.2 && likeRatio >= 0.65) {
    return "Trusted by Community";
  }

  if (commentCount >= 15) return "Highly Discussed";
  if (totalReactions >= 10) return "Most Engaged";
  if (commentCount >= 6 || totalReactions >= 6) return "Rising Interest";
  return "Needs More Public Feedback";
}

function getEngagementLevel(commentCount: number, totalReactions: number) {
  const score = commentCount + totalReactions;
  if (score >= 30) return "High";
  if (score >= 12) return "Moderate";
  return "Early";
}

function getProfileCompleteness(leader: Leader | null) {
  if (!leader) return 0;

  let filled = 0;
  const fields = [
    leader.name,
    leader.role,
    leader.party,
    getDistrictName(leader.district),
    getProvinceName(leader),
    leader.startYear,
    leader.endYear,
    leader.photo,
    leader.portfolio,
    leader.birthPlace,
    leader.permanentAddress,
  ];

  fields.forEach((item) => {
    if (item && String(item).trim()) filled += 1;
  });

  return Math.round((filled / fields.length) * 100);
}

function getTrendText(commentCount: number, totalReactions: number, streak?: number) {
  if ((streak || 0) >= 8) return "Active public interest";
  if (commentCount >= 10 || totalReactions >= 12) return "Growing discussion";
  if (commentCount >= 4 || totalReactions >= 5) return "Steady engagement";
  return "Early visibility";
}

function ProgressBar({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string;
  colorClass: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm text-slate-200">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f2f7ff_100%)] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function OverviewCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f8ff_100%)] px-5 py-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-700">{text}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SignalStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function BadgePill({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
      {text}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f6faff_100%)] px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(15,23,42,0.1)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
        {label}
      </p>
      <p className="mt-2 text-xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function CommentFilterTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const options = [
    { value: "newest", label: "Newest" },
    { value: "liked", label: "Top liked" },
    { value: "highest-rated", label: "Highest rated" },
    { value: "lowest-rated", label: "Lowest rated" },
  ];

  return (
    <div className="inline-flex rounded-2xl border border-blue-100 bg-blue-50/60 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
            value === option.value
              ? "bg-slate-950 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
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
  const [message, setMessage] = useState("");

  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentCooldownUntil, setCommentCooldownUntil] = useState(0);

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
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsRefreshing, setCommentsRefreshing] = useState(false);
  const [commentSort, setCommentSort] = useState("newest");

  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replySubmitting, setReplySubmitting] = useState<Record<string, boolean>>({});
  const [replyError, setReplyError] = useState<Record<string, string>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  const [reportOpenFor, setReportOpenFor] = useState<string | null>(null);
  const [reportReason, setReportReason] =
    useState<(typeof REPORT_REASONS)[number]>("Abuse");
  const [reportNote, setReportNote] = useState("");

  const [mistakeModalOpen, setMistakeModalOpen] = useState(false);
  const [mistakeType, setMistakeType] = useState<MistakeType>("Wrong role");
  const [mistakeText, setMistakeText] = useState("");
  const [suggestedCorrection, setSuggestedCorrection] = useState("");
  const [sourceLink, setSourceLink] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [mistakeMessage, setMistakeMessage] = useState("");
  const [mistakeSubmitting, setMistakeSubmitting] = useState(false);

  const [complaintHistory, setComplaintHistory] = useState<ComplaintItem[]>([]);
  const trackedViewRef = useRef("");
  const leaderId = leader?.leaderId || "";

  const ensureLogin = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return false;
    }
    return true;
  };

  const loadLeaderOnly = useCallback(async () => {
    if (!id) {
      setLeader(null);
      setLeaderLoading(false);
      return;
    }

    try {
      setLeaderLoading(true);
      setMessage("");

      const data: LeaderPublicProfileResponse = await api.getLeaderPublicProfile(id, {
        sort: "newest",
        limit: "50",
      });

      const nextLeader = (data?.leader as Leader | null | undefined) || null;
      const nextStats = data?.stats || {};

      setLeader(nextLeader);
      setStats({
        likes: nextStats.likes ?? 0,
        dislikes: nextStats.dislikes ?? 0,
        totalReactions: nextStats.totalReactions ?? 0,
        averageRating: nextStats.averageRating ?? nextStats.rating ?? 0,
        likePercentage: nextStats.likePercentage ?? "0.0",
        dislikePercentage: nextStats.dislikePercentage ?? "0.0",
        ratingCount: nextStats.ratingCount ?? 0,
      });
    } catch (error: unknown) {
      setLeader(null);
      setStats({
        likes: 0,
        dislikes: 0,
        totalReactions: 0,
        averageRating: 0,
        likePercentage: "0.0",
        dislikePercentage: "0.0",
        ratingCount: 0,
      });
      setMessage(getErrorMessage(error, "Leader not found"));
    } finally {
      setLeaderLoading(false);
    }
  }, [id]);

  const loadCommentsOnly = useCallback(
    async (softRefresh = false) => {
      if (!id) {
        setCommentsList([]);
        setCommentsLoading(false);
        return;
      }

      try {
        if (softRefresh) {
          setCommentsRefreshing(true);
        } else {
          setCommentsLoading(true);
        }

        const data: LeaderPublicProfileResponse = await api.getLeaderPublicProfile(id, {
          sort: commentSort,
          limit: "50",
        });

        const nextComments = Array.isArray(data?.comments)
          ? (data.comments as CommentItem[])
          : [];
        setCommentsList(nextComments);
      } catch (error: unknown) {
        setCommentsList([]);
        setMessage(getErrorMessage(error, "Failed to load comments"));
      } finally {
        setCommentsLoading(false);
        setCommentsRefreshing(false);
      }
    },
    [id, commentSort]
  );

  const loadComplaintHistory = useCallback(async () => {
    if (!token || !leaderId) {
      setComplaintHistory([]);
      return;
    }

    try {
      const data = await api.getMyComplaintsByLeader(token, leaderId);
      setComplaintHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setComplaintHistory([]);
    }
  }, [leaderId, token]);

  useEffect(() => {
    void loadLeaderOnly();
  }, [loadLeaderOnly]);

  useEffect(() => {
    void loadCommentsOnly();
  }, [loadCommentsOnly]);

  useEffect(() => {
    if (!token || !leaderId) return;
    void loadComplaintHistory();
  }, [loadComplaintHistory, leaderId, token]);

useEffect(() => {
  if (!mistakeModalOpen) return;

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = previousOverflow;
  };
}, [mistakeModalOpen]);

  useEffect(() => {
    if (!leader?.leaderId) return;
    if (trackedViewRef.current === leader.leaderId) return;

    trackedViewRef.current = leader.leaderId;

    void api.trackEvent(
      {
        eventName: "leader_profile_viewed",
        entityType: "leader",
        entityId: leader.leaderId,
        entityName: leader.name,
        sourcePage: "leader_profile",
        metadata: {
          role: leader.role || "",
          district: getDistrictName(leader.district),
        },
      },
      token || undefined
    );
  }, [leader, token]);

  const handleLike = async (value: boolean) => {
    if (!ensureLogin() || !token || !leader) return;

    try {
      setLiked(value);
      const result = await api.submitRating(
        token,
        leader.leaderId,
        rating || 1,
        value ? "like" : "dislike",
        "leader_profile"
      );
      setMessage(result.message || "Reaction saved");
      await loadLeaderOnly();
      await loadCommentsOnly(true);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to save reaction"));
    }
  };

  const handleRating = async (value: number) => {
    if (!ensureLogin() || !token || !leader) return;

    try {
      setRating(value);
      const result = await api.submitRating(
        token,
        leader.leaderId,
        value,
        undefined,
        "leader_profile"
      );
      setMessage(result.message || "Rating saved");
      await loadLeaderOnly();
      await loadCommentsOnly(true);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to save rating"));
    }
  };

  const commentValidation = useMemo(() => validateCommentText(comment), [comment]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ensureLogin() || !token || !leader) return;

    if (Date.now() < commentCooldownUntil) {
      setMessage("Please wait a few seconds before posting another comment.");
      return;
    }

    if (!commentValidation.valid) {
      setMessage(commentValidation.message);
      return;
    }

    try {
      setCommentSubmitting(true);
      await api.createComment(
        token,
        leader.leaderId,
        normalizeTextInput(comment),
        rating || 0,
        "leader_profile"
      );
      setMessage("Comment posted");
      setComment("");
      setCommentCooldownUntil(Date.now() + 8000);
      await loadLeaderOnly();
      await loadCommentsOnly(true);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to post comment"));
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!ensureLogin() || !token) return;

    try {
      await api.likeComment(token, commentId);
      await loadLeaderOnly();
      await loadCommentsOnly(true);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to like comment"));
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!ensureLogin() || !token) return;

    const current = replyText[commentId] || "";
    const validation = validateReplyText(current);

    if (!validation.valid) {
      setReplyError((prev) => ({ ...prev, [commentId]: validation.message }));
      return;
    }

    try {
      setReplySubmitting((prev) => ({ ...prev, [commentId]: true }));
      setReplyError((prev) => ({ ...prev, [commentId]: "" }));

      await api.replyComment(token, commentId, normalizeTextInput(current));

      setReplyText((prev) => ({ ...prev, [commentId]: "" }));
      await loadLeaderOnly();
      await loadCommentsOnly(true);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to reply"));
    } finally {
      setReplySubmitting((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleReportComment = (commentId: string) => {
    const target = commentsList.find((item) => item._id === commentId);
    if (!target) return;

    const note = normalizeTextInput(reportNote);

    setMessage(
      `Report noted for "${target.userName}" comment under "${reportReason}"${
        note ? `: ${note}` : "."
      }`
    );
    setReportOpenFor(null);
    setReportReason("Abuse");
    setReportNote("");
  };

  const handleReportMistakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ensureLogin() || !token || !leader) return;

    const cleanedMistake = normalizeTextInput(mistakeText);
    const cleanedCorrection = normalizeTextInput(suggestedCorrection);
    const cleanedSource = normalizeTextInput(sourceLink);
    const cleanedContact = normalizeTextInput(contactInfo);

    if (!cleanedMistake) {
      setMistakeMessage("Please describe the factual mistake.");
      return;
    }

    if (cleanedMistake.length < 8) {
      setMistakeMessage("Please provide a little more detail about the mistake.");
      return;
    }

    try {
      setMistakeSubmitting(true);
      setMistakeMessage("");

      const composedMessage = [
        `Profile Accuracy Report`,
        `Mistake Type: ${mistakeType}`,
        `What is the mistake?: ${cleanedMistake}`,
        `Suggested correction: ${cleanedCorrection || "Not provided"}`,
        `Source / reference: ${cleanedSource || "Not provided"}`,
        `Optional contact: ${cleanedContact || "Not provided"}`,
      ].join("\n");

      const result = await api.submitComplaint(
        token,
        leader.leaderId,
        composedMessage,
        "Profile Mistake"
      );

      setMistakeMessage(result.message || "Report submitted successfully.");
      setMistakeText("");
      setSuggestedCorrection("");
      setSourceLink("");
      setContactInfo("");
      await loadComplaintHistory();
    } catch (error: unknown) {
      setMistakeMessage(getErrorMessage(error, "Failed to submit report."));
    } finally {
      setMistakeSubmitting(false);
    }
  };

  const displayRole = leader?.role || "";
  const displayRating =
    stats.averageRating && stats.averageRating > 0
      ? stats.averageRating
      : leader?.siteMetrics?.ratingAverage || 0;

  const displayFollowers = leader?.siteMetrics?.followers || 0;
  const profileCompleteness = getProfileCompleteness(leader);
  const trustLabel = getTrustLabel(
    Number(displayRating || 0),
    commentsList.length,
    stats.likes,
    stats.dislikes
  );
  const engagementLevel = getEngagementLevel(
    commentsList.length,
    stats.totalReactions
  );
  const trendText = getTrendText(
    commentsList.length,
    stats.totalReactions,
    leader?.streak
  );

  if (leaderLoading) {
    return (
      <div className="min-h-screen page-fade-in bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_26%,#f4f7fb_100%)]">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="surface-shell p-6">
            <h1 className="text-3xl font-bold text-slate-900">Loading leader...</h1>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!leader) {
    return (
      <div className="min-h-screen page-fade-in bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_26%,#f4f7fb_100%)]">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="surface-shell p-6">
            <h1 className="text-3xl font-bold text-slate-900">Leader not found</h1>
            <p className="mt-2 text-slate-500">
              This profile is not connected yet in the real leader dataset.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-fade-in bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_26%,#f4f7fb_100%)]">
      <Navbar />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
        {message && (
          <div className="rounded-2xl border border-blue-100 bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        <section className="overflow-hidden rounded-[32px] border border-slate-900/80 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] text-white shadow-[0_24px_64px_rgba(15,23,42,0.25)]">
          <div className="bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.22),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_58%,#1d4ed8_100%)] px-6 py-7 text-white md:px-8 md:py-8">
            <p className="text-sm font-medium text-blue-100">Public civic profile</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-5xl">
              {leader.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
              Public-facing profile for civic trust, citizen feedback, and transparent discussion across Nepal.
            </p>
          </div>

          <div className="border-t border-slate-800/70 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 py-6 text-slate-950 md:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="-mt-16 shrink-0">
                {leader.photo ? (
                  <img
                    src={leader.photo}
                    alt={leader.name}
                    className="h-28 w-28 rounded-[28px] border border-blue-200 object-cover shadow-[0_18px_34px_rgba(15,23,42,0.18)] md:h-32 md:w-32"
                  />
                ) : (
                  <div className="space-y-2 text-center">
                    <div className="flex h-28 w-28 items-center justify-center rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_60%,#2563eb_100%)] text-4xl font-bold text-white shadow-xl md:h-32 md:w-32">
                      {leader.name?.charAt(0) || "L"}
                    </div>
                    <p className="text-xs font-medium text-slate-600">No official photo yet</p>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-4 flex flex-wrap gap-2">
                  {leader.verified && (
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                      Verified profile
                    </span>
                  )}
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                    {trustLabel}
                  </span>
                  {leader.badge && (
                    <span className="rounded-full border border-slate-200 bg-slate-950 px-3 py-1.5 text-sm font-semibold text-white">
                      {leader.badge}
                    </span>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <InfoBlock label="Role" value={`${leader.currentStatus || "Current"} ${displayRole}`.trim()} />
                  <InfoBlock
                    label="District"
                    value={`${getDistrictName(leader.district) || "Not added yet"}${
                      getProvinceName(leader) ? `, ${getProvinceName(leader)}` : ""
                    }`}
                  />
                  <InfoBlock label="Party" value={leader.party || "Not added yet"} />
                  <InfoBlock label="Term" value={`${leader.startYear || "-"} - ${leader.endYear || "Present"}`} />
                </div>

                <div className="mt-6 rounded-3xl border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f8ff_100%)] p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Civic summary</p>
                  <p className="mt-2 leading-7 text-slate-700">
                    {leader.name} is currently serving as a{" "}
                    {leader.currentStatus?.toLowerCase() || ""} {displayRole.toLowerCase()}.
                    This profile brings together public trust signals, citizen discussion, and factual identity details to support transparency and accountability.
                  </p>
                </div>

                <p className="mt-4 text-sm text-slate-600">
                  {engagementLevel} engagement with {profileCompleteness}% profile completeness.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <NepalActionButton
                    onClick={() =>
                      document.getElementById("quick-rate-card")?.scrollIntoView({
                        behavior: "smooth",
                      })
                    }
                    className="px-5 py-3 text-sm"
                  >
                    Rate Leader
                  </NepalActionButton>
                  {/* <NepalActionButton tone="secondary" className="px-5 py-3 text-sm">
                    Follow
                  </NepalActionButton> */}
                  <NepalActionButton
                    tone="secondary"
                    onClick={() => setMistakeModalOpen(true)}
                    className="px-5 py-3 text-sm"
                  >
                    Report Mistake
                  </NepalActionButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Likes" value={stats.likes} />
          <StatCard label="Average rating" value={displayRating} />
          <StatCard label="Comments" value={commentsList.length} />
          <StatCard label="Followers" value={displayFollowers} />
          <StatCard label="Activity trend" value={trendText} />
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_360px]">
          <div className="space-y-5">
            <section className="surface-shell p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-4">
                  <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Public context, trust cues, and factual profile details.
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {engagementLevel} engagement
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <OverviewCard
                  title="Public trust snapshot"
                  text={`Community trust is currently ${trustLabel.toLowerCase()}, supported by ${stats.likes} likes, ${stats.totalReactions} reactions, and an average rating of ${displayRating}.`}
                />
                <OverviewCard
                  title="Citizen engagement"
                  text={`This profile has ${commentsList.length} community comments and shows ${trendText.toLowerCase()} across reaction and discussion activity.`}
                />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <DetailRow label="Role" value={`${leader.currentStatus || "Current"} ${displayRole}`.trim()} />
                <DetailRow label="Party" value={leader.party || "Not added yet"} />
                <DetailRow label="District" value={getDistrictName(leader.district) || "Not added yet"} />
                <DetailRow label="Province" value={getProvinceName(leader) || "Not added yet"} />
                <DetailRow label="Service" value={`${leader.startYear || "-"} - ${leader.endYear || "Present"}`} />
                {leader.portfolio ? <DetailRow label="Portfolio" value={leader.portfolio} /> : null}
                {leader.age ? <DetailRow label="Age" value={String(leader.age)} /> : null}
                {leader.birthPlace ? <DetailRow label="Birth Place" value={leader.birthPlace} /> : null}
                {leader.permanentAddress ? (
                  <div className="md:col-span-2">
                    <DetailRow label="Permanent Address" value={leader.permanentAddress} />
                  </div>
                ) : null}
              </div>
            </section>

            <section className="surface-shell p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Community Discussion</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {commentsList.length} comment{commentsList.length === 1 ? "" : "s"}
                    {commentsRefreshing ? " · updating..." : ""}
                  </p>
                </div>

                <CommentFilterTabs value={commentSort} onChange={setCommentSort} />
              </div>

              <form
                onSubmit={handleCommentSubmit}
                className="mt-5 rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f8ff_100%)] p-4"
              >
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share a respectful public comment about this leader..."
                      className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-200"
                      maxLength={300}
                    />
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={commentValidation.valid ? "text-slate-500" : "text-red-600"}>
                        {commentValidation.valid
                          ? "Keep it factual and respectful."
                          : commentValidation.message}
                      </span>
                      <span className="text-slate-500">
                        {normalizeTextInput(comment).length}/300
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:min-w-[190px]">
                    <div className="flex justify-start gap-1.5 lg:justify-end">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className={`text-2xl leading-none transition ${
                            rating >= star ? "text-amber-400" : "text-slate-300"
                          }`}
                          aria-label={`Rate ${star} star`}
                        >
                          {"\u2605"}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={!commentValidation.valid || commentSubmitting}
                      className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {commentSubmitting ? "Posting..." : "Post Comment"}
                    </button>
                  </div>
                </div>
              </form>

              <div className="mt-5 space-y-3">
                {commentsLoading ? (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 text-sm text-slate-600">
                    Loading comments...
                  </div>
                ) : commentsList.length > 0 ? (
                  commentsList.map((item) => {
                    const currentReplyValidation = validateReplyText(replyText[item._id] || "");
                    const replyCount = item.replies?.length || 0;
                    const showReplies = expandedReplies[item._id] ?? false;
                    const visibleReplies = showReplies
                      ? item.replies || []
                      : (item.replies || []).slice(0, 2);

                    return (
                      <article
                        key={item._id}
                        className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:shadow-md"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">{item.userName}</p>
                              {typeof item.rating === "number" && item.rating > 0 ? (
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                  {item.rating}★
                                </span>
                              ) : null}
                              <span className="text-xs text-slate-500">
                                {formatDateTime(item.createdAt)}
                              </span>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-700">{item.text}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setReportOpenFor((prev) => (prev === item._id ? null : item._id))
                            }
                            className="shrink-0 text-xs font-medium text-slate-500 transition hover:text-blue-700"
                          >
                            Report
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleLikeComment(item._id)}
                            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            Like {item.likes || 0}
                          </button>

                          <span className="text-xs text-slate-500">
                            {replyCount} repl{replyCount === 1 ? "y" : "ies"}
                          </span>

                          {replyCount > 2 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedReplies((prev) => ({
                                  ...prev,
                                  [item._id]: !prev[item._id],
                                }))
                              }
                              className="text-xs font-semibold text-slate-600 hover:text-blue-700"
                            >
                              {showReplies ? "Show less replies" : `Show all ${replyCount} replies`}
                            </button>
                          ) : null}
                        </div>

                        {reportOpenFor === item._id && (
                          <div className="mt-3 rounded-2xl border border-red-100 bg-red-50/60 p-4">
                            <p className="text-sm font-semibold text-slate-900">Report comment</p>
                            <p className="mt-1 text-xs text-slate-600">
                              Help keep discussion respectful and safe.
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {REPORT_REASONS.map((reason) => (
                                <button
                                  key={reason}
                                  type="button"
                                  onClick={() => setReportReason(reason)}
                                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                    reportReason === reason
                                      ? "bg-slate-950 text-white"
                                      : "bg-white text-slate-700"
                                  }`}
                                >
                                  {reason}
                                </button>
                              ))}
                            </div>

                            <textarea
                              rows={2}
                              value={reportNote}
                              onChange={(e) => setReportNote(e.target.value)}
                              placeholder="Optional note"
                              className="mt-3 w-full rounded-2xl border border-red-100 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-red-200"
                            />

                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleReportComment(item._id)}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                              >
                                Submit Report
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReportOpenFor(null);
                                  setReportNote("");
                                }}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {visibleReplies.length > 0 && (
                          <div className="mt-3 space-y-2 border-l border-blue-100 pl-3 md:pl-4">
                            {visibleReplies.map((reply, index) => (
                              <div
                                key={index}
                                className="rounded-2xl bg-blue-50/50 px-3 py-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-slate-800">
                                    {reply.userName}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatDateTime(reply.createdAt)}
                                  </p>
                                </div>
                                <p className="mt-1.5 text-sm leading-6 text-slate-700">
                                  {reply.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
                          <textarea
                            rows={2}
                            value={replyText[item._id] || ""}
                            onChange={(e) =>
                              setReplyText((prev) => ({
                                ...prev,
                                [item._id]: e.target.value,
                              }))
                            }
                            placeholder="Write a respectful reply..."
                            className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                            maxLength={220}
                          />

                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span
                              className={
                                currentReplyValidation.valid ? "text-slate-500" : "text-red-600"
                              }
                            >
                              {replyError[item._id] ||
                                (currentReplyValidation.valid
                                  ? "Keep replies constructive."
                                  : currentReplyValidation.message)}
                            </span>
                            <span className="text-slate-500">
                              {normalizeTextInput(replyText[item._id] || "").length}/220
                            </span>
                          </div>

                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => handleReplySubmit(item._id)}
                              disabled={!currentReplyValidation.valid || !!replySubmitting[item._id]}
                              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {replySubmitting[item._id] ? "Replying..." : "Reply"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 px-5 py-10 text-center">
                    <p className="text-base font-semibold text-slate-700">
                      Be the first to share your thoughts about this leader.
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Respectful civic discussion helps improve transparency and accountability.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="surface-shell p-6">
              <h2 className="text-2xl font-bold text-slate-900">Activity and updates</h2>
              <div className="mt-4 rounded-2xl border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f8ff_100%)] p-5">
                <p className="text-sm font-semibold text-slate-900">Current interest trend</p>
                <p className="mt-2 text-slate-700">
                  {trendText}. This profile is drawing public attention through ratings,
                  comments, and reaction activity tracked on the platform.
                </p>
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="surface-shell-dark p-6">
              <h2 className="mb-4 text-2xl font-bold text-white">Public trust snapshot</h2>

              <div className="space-y-4">
                <ProgressBar label="Like" value={stats.likePercentage} colorClass="bg-green-500" />
                <ProgressBar label="Dislike" value={stats.dislikePercentage} colorClass="bg-red-500" />

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                    Community reading
                  </p>
                  <p className="mt-2 text-slate-100">{trustLabel}</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleLike(true)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        liked === true
                          ? "bg-emerald-600 text-white"
                          : "bg-white/10 text-white hover:bg-white/15"
                      }`}
                    >
                      Support
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLike(false)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        liked === false
                          ? "bg-red-600 text-white"
                          : "bg-white/10 text-white hover:bg-white/15"
                      }`}
                    >
                      Concern
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section id="quick-rate-card" className="surface-shell p-6">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">Quick rate</h2>

              <div className="mb-3 flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    className={`text-4xl leading-none transition ${
                      rating >= star ? "text-yellow-400" : "text-slate-300"
                    }`}
                  >
                    {"\u2605"}
                  </button>
                ))}
              </div>

              <p className="text-sm text-slate-600">
                Add your public rating now and update it anytime later.
              </p>
            </section>

            <section className="surface-shell p-6">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">Profile signals</h2>

              <div className="flex flex-wrap gap-2">
                <BadgePill text={trustLabel} />
                <BadgePill text={engagementLevel === "High" ? "Most Engaged" : "Rising Interest"} />
                <BadgePill
                  text={profileCompleteness >= 70 ? "Profile mostly complete" : "Needs more verified data"}
                />
                <BadgePill
                  text={commentsList.length >= 10 ? "Highly Discussed" : "Needs More Public Feedback"}
                />
              </div>

              <div className="mt-5 grid gap-3">
                <SignalStat label="Profile accuracy" value={`${profileCompleteness}%`} />
                <SignalStat label="Engagement level" value={engagementLevel} />
                <SignalStat
                  label="Public visibility"
                  value={leader?.streak ? `${leader.streak} day streak` : "Early stage"}
                />
              </div>
            </section>

            <section className="surface-shell p-6">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">Report a factual mistake</h2>
              <p className="text-sm leading-6 text-slate-700">
                Help improve public transparency by reporting incorrect profile information.
              </p>

              <button
                type="button"
                onClick={() => setMistakeModalOpen(true)}
                className="mt-4 w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Open report form
              </button>

              {complaintHistory.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Your previous profile accuracy reports
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {complaintHistory.length} submitted item
                    {complaintHistory.length === 1 ? "" : "s"}
                  </p>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </main>

{mistakeModalOpen && (
  <div
    className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[2px]"
    onClick={() => setMistakeModalOpen(false)}
  >
    <div className="h-full overflow-y-auto px-3 py-3 sm:px-4 sm:py-6">
      <div
        className="mx-auto w-full max-w-2xl rounded-[24px] border border-blue-100 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5 md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Report a factual mistake
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Help improve profile accuracy using clear, factual corrections.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMistakeModalOpen(false)}
              className="shrink-0 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[calc(100dvh-140px)] overflow-y-auto px-4 py-4 sm:px-5 md:px-6">
          {mistakeMessage && (
            <div className="mb-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-slate-700">
              {mistakeMessage}
            </div>
          )}

          <form onSubmit={handleReportMistakeSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Mistake type
              </label>
              <select
                value={mistakeType}
                onChange={(e) => setMistakeType(e.target.value as MistakeType)}
                className="w-full rounded-2xl border border-blue-100 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              >
                {MISTAKE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                What is the mistake?
              </label>
              <textarea
                rows={3}
                value={mistakeText}
                onChange={(e) => setMistakeText(e.target.value)}
                className="w-full rounded-2xl border border-blue-100 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Describe the incorrect information"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Suggested correction
              </label>
              <textarea
                rows={2}
                value={suggestedCorrection}
                onChange={(e) => setSuggestedCorrection(e.target.value)}
                className="w-full rounded-2xl border border-blue-100 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="What should it say instead?"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Source / reference link
              </label>
              <input
                type="text"
                value={sourceLink}
                onChange={(e) => setSourceLink(e.target.value)}
                className="w-full rounded-2xl border border-blue-100 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Optional contact
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full rounded-2xl border border-blue-100 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Email or other contact info"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setMistakeModalOpen(false)}
                className="rounded-2xl border border-blue-100 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={mistakeSubmitting}
                className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {mistakeSubmitting ? "Submitting..." : "Submit report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
)}

      <Footer />
    </div>
  );
}

export default LeaderProfile;
