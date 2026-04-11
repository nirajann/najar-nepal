import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { NepalActionButton, NepalActionLink } from "../components/NepalDesignSystem";
import { api } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

type LeaderDistrict =
  | string
  | {
      _id?: string;
      districtId?: string;
      name?: string;
      province?: string;
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
};

type LeaderStats = {
  likes?: number;
  dislikes?: number;
  comments?: number;
  averageRating?: number;
  engagementScore?: number;
  totalReactions?: number;
  ratingCount?: number;
};

type SortOption =
  | "Public Score"
  | "Highest Rated"
  | "Most Discussed"
  | "Most Engaged"
  | "Lowest Rated";

type RankedLeader = {
  leader: Leader;
  stats: Required<LeaderStats>;
  publicScore: number;
  confidenceWeight: number;
  weightedRating: number;
  engagementCount: number;
  trendLabel: string;
  signalLabel: string;
  dataLabel: string;
};

type FeaturedBadge = {
  label: string;
  tone: string;
};

function roleLabel(role: string) {
  if (role === "MP") return "Member of Parliament";
  return role;
}

function getDistrictName(district?: LeaderDistrict) {
  if (!district) return "Unknown district";
  if (typeof district === "string") return district;
  return district.name || "Unknown district";
}

function getProvinceName(leader: Leader) {
  if (leader.province) {
    return leader.province.replace(" PROVINCE", "");
  }

  if (leader.district && typeof leader.district !== "string") {
    return leader.district.province?.replace(" PROVINCE", "") || "Unknown province";
  }

  return "Unknown province";
}

function roundValue(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Number(value.toFixed(1));
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalize(value: number, max: number) {
  if (!max || max <= 0) return 0;
  return clamp(value / max);
}

function getConfidenceWeight(ratingCount: number) {
  return clamp(ratingCount / 12, 0.15, 1);
}

function getTrendLabel(comments: number, engagementCount: number, ratingCount: number) {
  const activity = comments + engagementCount + ratingCount;
  if (activity >= 40) return "High recent activity";
  if (activity >= 18) return "Steady public activity";
  if (activity >= 8) return "Building activity";
  return "Limited recent data";
}

function getSignalLabel(avgRating: number, ratingCount: number, commentCount: number, verified?: boolean) {
  if (verified && avgRating >= 4.2 && ratingCount >= 8) return "High confidence profile";
  if (commentCount >= 12) return "High discussion volume";
  if (verified) return "Verified profile";
  return "Developing profile";
}

function getDataLabel(ratingCount: number, commentCount: number) {
  const total = ratingCount + commentCount;
  if (total < 4) return "Limited profile data";
  if (total < 10) return "Developing public signal";
  return "Established public signal";
}

function buildRankedLeaders(leaders: Leader[], statsMap: Record<string, LeaderStats>) {
  const safeStats = leaders.map((leader) => {
    const raw = statsMap[leader.leaderId] || {};
    const likes = raw.likes ?? 0;
    const dislikes = raw.dislikes ?? 0;
    const comments = raw.comments ?? 0;
    const averageRating = raw.averageRating ?? 0;
    const ratingCount = raw.ratingCount ?? 0;
    const totalReactions = raw.totalReactions ?? likes + dislikes;
    const engagementCount =
      raw.engagementScore ?? likes + comments + ratingCount - dislikes;

    return {
      leader,
      stats: {
        likes,
        dislikes,
        comments,
        averageRating,
        ratingCount,
        totalReactions,
        engagementScore: engagementCount,
      },
    };
  });

  const maxComments = Math.max(...safeStats.map((item) => item.stats.comments), 1);
  const maxEngagement = Math.max(...safeStats.map((item) => item.stats.engagementScore), 1);
  const maxReactions = Math.max(...safeStats.map((item) => item.stats.totalReactions), 1);

  return safeStats.map(({ leader, stats }) => {
    const confidenceWeight = getConfidenceWeight(stats.ratingCount);
    const ratingQuality = normalize((stats.averageRating / 5) * confidenceWeight, 1);
    const discussionQuality = normalize(stats.comments, maxComments);
    const engagementQuality = normalize(stats.engagementScore, maxEngagement);
    const reactionQuality = normalize(stats.totalReactions, maxReactions);

    const publicScore =
      ratingQuality * 45 +
      discussionQuality * 25 +
      engagementQuality * 20 +
      reactionQuality * 10;

    return {
      leader,
      stats,
      publicScore: roundValue(publicScore),
      confidenceWeight: roundValue(confidenceWeight),
      weightedRating: roundValue(stats.averageRating * confidenceWeight),
      engagementCount: stats.engagementScore,
      trendLabel: getTrendLabel(
        stats.comments,
        stats.engagementScore,
        stats.ratingCount
      ),
      signalLabel: getSignalLabel(
        stats.averageRating,
        stats.ratingCount,
        stats.comments,
        leader.verified
      ),
      dataLabel: getDataLabel(stats.ratingCount, stats.comments),
    };
  });
}

function getFeaturedBadge(item: RankedLeader, rank: number): FeaturedBadge {
  if (rank === 1) {
    return {
      label: "Highest public score",
      tone: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  if (item.trendLabel === "High recent activity") {
    return {
      label: "High recent activity",
      tone: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (item.signalLabel === "High discussion volume" || item.stats.comments >= 12) {
    return {
      label: "High discussion volume",
      tone: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  return {
    label: rank === 2 ? "Stronger data signal" : "Visible public profile",
    tone: "border-slate-200 bg-slate-100 text-slate-700",
  };
}

function getScoreTone(score: number) {
  if (score >= 75) return "text-emerald-600";
  if (score >= 55) return "text-blue-700";
  if (score >= 35) return "text-amber-600";
  return "text-slate-700";
}

function translateRankingSignal(value: string, text: Record<string, string>) {
  const map: Record<string, string> = {
    "High recent activity": text.trendRising,
    "Steady public activity": text.trendSteady,
    "Building activity": text.trendBuilding,
    "Limited recent data": text.trendLimited,
    "High confidence profile": text.trustTrusted,
    "High discussion volume": text.trustDiscussed,
    "Verified profile": text.trustVerified,
    "Developing profile": text.trustEmerging,
    "Limited profile data": text.dataEmerging,
    "Developing public signal": text.dataDeveloping,
    "Established public signal": text.dataEstablished,
    "Highest public score": text.badgeMostTrusted,
    "Stronger data signal": text.badgeStrongSignal,
    "Visible public profile": text.badgeWatchlist,
  };

  return map[value] || value;
}

function MiniTrendSparkline({
  values,
  tone = "blue",
}: {
  values: number[];
  tone?: "blue" | "amber" | "red";
}) {
  const safeValues = values.length ? values : [0, 0, 0, 0, 0];
  const max = Math.max(...safeValues, 1);
  const min = Math.min(...safeValues, 0);
  const range = max - min || 1;
  const stroke =
    tone === "amber" ? "#d97706" : tone === "red" ? "#dc2626" : "#2563eb";
  const points = safeValues
    .map((value, index) => {
      const x = (index / Math.max(safeValues.length - 1, 1)) * 100;
      const y = 26 - ((value - min) / range) * 22;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 28" className="h-7 w-24" aria-hidden="true">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function ScoreBadge({
  score,
  large = false,
}: {
  score: number;
  large?: boolean;
}) {
  const { section } = useLanguage();
  const text = section("ranking");
  const tone = getScoreTone(score);
  const sizeClass = large ? "h-20 w-20 md:h-24 md:w-24" : "h-14 w-14";
  const numberClass = large ? "text-2xl md:text-[28px]" : "text-base";

  return (
    <div
      className={`relative inline-flex ${sizeClass} items-center justify-center rounded-full border border-blue-200/80 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.45),_#ffffff_62%)] shadow-[0_12px_26px_rgba(29,78,216,0.12)] ring-4 ring-blue-50/90 transition duration-300`}
    >
      <div className="absolute inset-2 rounded-full border border-dashed border-blue-300/80" />
      <div className="relative text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          {text.score}
        </p>
        <p className={`mt-1 ${numberClass} font-extrabold tracking-tight ${tone}`}>
          {score}
        </p>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-blue-100/80 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f8ff_100%)] px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-600">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-600">{helper}</p> : null}
    </div>
  );
}

function LeaderboardMetric({
  label,
  value,
  helper,
  strong = false,
  compact = false,
}: {
  label: string;
  value: string | number;
  helper?: string;
  strong?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 truncate ${
          compact ? "text-sm font-semibold" : strong ? "text-lg font-extrabold" : "text-base font-bold"
        } text-slate-950`}
      >
        {value}
      </p>
      {helper ? <p className="mt-0.5 text-xs text-slate-600">{helper}</p> : null}
    </div>
  );
}

function FeaturedLeaderCard({
  item,
  rank,
}: {
  item: RankedLeader;
  rank: number;
}) {
  const { section } = useLanguage();
  const text = section("ranking");
  const { leader, stats, publicScore, trendLabel, signalLabel, dataLabel } = item;
  const featureBadge = getFeaturedBadge(item, rank);
  const isFirst = rank === 1;
  const sparkTone = publicScore >= 70 ? "blue" : publicScore >= 45 ? "amber" : "red";
  const sparklineValues = [
    stats.ratingCount,
    stats.comments,
    stats.totalReactions,
    item.engagementCount,
    Math.round(publicScore),
  ];
  const cardTone = isFirst
    ? "border-blue-200 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_48%),linear-gradient(180deg,#ffffff_0%,#f7fbff_58%,#eef4ff_100%)] shadow-[0_18px_42px_rgba(29,78,216,0.12)]"
    : "border-blue-100 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]";

  return (
    <article
      className={`rounded-[26px] border p-4 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(15,23,42,0.12)] ${cardTone} ${
        isFirst ? "xl:-mt-1 xl:p-5" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
              {text.topRank} #{rank}
            </span>
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${featureBadge.tone}`}
            >
              {translateRankingSignal(featureBadge.label, text)}
            </span>
          </div>
          <h2 className="mt-2.5 text-lg font-extrabold tracking-tight text-slate-950 md:text-xl">
            {leader.name}
          </h2>
          <p className="mt-1 text-sm font-semibold text-blue-600">
            {leader.currentStatus || text.current} {roleLabel(leader.role)}
          </p>
          <p className="mt-1 truncate text-sm text-slate-600">
            {getDistrictName(leader.district)}, {getProvinceName(leader)}
          </p>
        </div>

        <ScoreBadge score={publicScore} large />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          {translateRankingSignal(signalLabel, text)}
        </span>
        <p className="text-sm text-slate-600">{translateRankingSignal(dataLabel, text)}</p>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-blue-100/80 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f8ff_100%)] px-3 py-2.5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {text.tableTrend}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {translateRankingSignal(trendLabel, text)}
          </p>
        </div>
        <MiniTrendSparkline values={sparklineValues} tone={sparkTone as "blue" | "amber" | "red"} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MetricTile
          label={text.rating}
          value={roundValue(stats.averageRating)}
          helper={`${stats.ratingCount} ${text.ratings}`}
        />
        <MetricTile label={text.comments} value={stats.comments} helper={text.badge} />
        <MetricTile
          label={text.engagement}
          value={item.engagementCount}
          helper={translateRankingSignal(trendLabel, text)}
        />
      </div>

      <div className="mt-4">
        <NepalActionLink
          to={`/leader/${leader.leaderId}`}
          className="min-h-[44px] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          {text.goToProfile}
        </NepalActionLink>
      </div>
    </article>
  );
}

function LeaderListRow({
  item,
  rank,
}: {
  item: RankedLeader;
  rank: number;
}) {
  const { section } = useLanguage();
  const text = section("ranking");
  const { leader, stats, publicScore, trendLabel, signalLabel, dataLabel } = item;

  return (
    <article className="rounded-[22px] border border-blue-100/80 bg-white/95 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_16px_34px_rgba(15,23,42,0.1)]">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2.4fr)_minmax(120px,0.8fr)_repeat(4,minmax(90px,0.7fr))_minmax(120px,0.9fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] text-sm font-bold text-white shadow-[0_10px_20px_rgba(29,78,216,0.18)]">
            #{rank}
          </div>

          {leader.photo ? (
            <img
              src={leader.photo}
              alt={leader.name}
              className="h-12 w-12 rounded-[16px] object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-blue-50 text-lg font-bold text-blue-700">
              {leader.name?.charAt(0) || "L"}
            </div>
          )}

          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-950">
              {leader.name}
            </h3>
            <p className="mt-0.5 truncate text-sm font-medium text-blue-600">
              {roleLabel(leader.role)}
            </p>
            <p className="mt-0.5 truncate text-sm text-slate-600">
              {getDistrictName(leader.district)}, {getProvinceName(leader)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:block">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {translateRankingSignal(signalLabel, text)}
          </span>
          <p className="mt-1 hidden text-xs text-slate-600 lg:block">
            {translateRankingSignal(dataLabel, text)}
          </p>
        </div>

        <LeaderboardMetric label={text.score} value={publicScore} strong />
        <LeaderboardMetric
          label={text.rating}
          value={roundValue(stats.averageRating)}
          helper={`${stats.ratingCount}`}
        />
        <LeaderboardMetric label={text.comments} value={stats.comments} />
        <LeaderboardMetric label={text.engagement} value={item.engagementCount} />
        <LeaderboardMetric label={text.tableTrend} value={translateRankingSignal(trendLabel, text)} compact />

        <div className="flex lg:justify-end">
          <NepalActionLink
            to={`/leader/${leader.leaderId}`}
            className="min-h-[44px] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            {text.profile}
          </NepalActionLink>
        </div>
      </div>
    </article>
  );
}

function Ranking() {
  const { section } = useLanguage();
  const text = section("ranking");
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, LeaderStats>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("Public Score");
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState("");
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const trackedFilterRef = useRef("");

  useEffect(() => {
    const loadRankingData = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.getLeadersRankingSummary({ limit: "250" });
        const leaderItems = Array.isArray(res) ? res : res?.leaders || [];
        setLeaders(leaderItems);
        setStatsMap(
          Object.fromEntries(
            leaderItems.map((leader: Leader & { stats?: LeaderStats }) => [
              leader.leaderId,
              leader.stats || {},
            ])
          )
        );
        setLastUpdated(
          res?.generatedAt
            ? new Date(res.generatedAt).toLocaleString()
            : new Date().toLocaleString()
        );
      } catch (err: any) {
        setError(err.message || "Failed to load ranking data");
      } finally {
        setLoading(false);
      }
    };

    loadRankingData();
  }, []);

  const roleTabs = useMemo(() => {
    const roles = Array.from(
      new Set(leaders.map((leader) => leader.role).filter(Boolean))
    );
    return ["All", ...roles];
  }, [leaders]);

  useEffect(() => {
    const signature = `${selectedRole}::${sortBy}::${searchText.trim().toLowerCase()}`;

    if (!trackedFilterRef.current) {
      trackedFilterRef.current = signature;
      return;
    }

    if (trackedFilterRef.current === signature) return;
    trackedFilterRef.current = signature;

    void api.trackEvent({
      eventName: "ranking_filter_used",
      entityType: "ranking",
      entityId: "leaders-ranking",
      entityName: `${text.title} filters`,
      sourcePage: "ranking",
      metadata: {
        selectedRole,
        sortBy,
        searchLength: searchText.trim().length,
      },
    });
  }, [selectedRole, sortBy, searchText, text.title]);

  const rankedLeaders = useMemo(() => {
    const roleFiltered =
      selectedRole === "All"
        ? leaders
        : leaders.filter((leader) => leader.role === selectedRole);

    const query = searchText.trim().toLowerCase();
    const filtered = !query
      ? roleFiltered
      : roleFiltered.filter((leader) => {
          const districtName = getDistrictName(leader.district).toLowerCase();
          const provinceName = getProvinceName(leader).toLowerCase();

          return (
            leader.name.toLowerCase().includes(query) ||
            roleLabel(leader.role).toLowerCase().includes(query) ||
            districtName.includes(query) ||
            provinceName.includes(query) ||
            (leader.party || "").toLowerCase().includes(query)
          );
        });

    const computed = buildRankedLeaders(filtered, statsMap);

    return computed.sort((a, b) => {
      if (sortBy === "Highest Rated") {
        return b.stats.averageRating - a.stats.averageRating;
      }

      if (sortBy === "Lowest Rated") {
        return a.stats.averageRating - b.stats.averageRating;
      }

      if (sortBy === "Most Discussed") {
        return b.stats.comments - a.stats.comments;
      }

      if (sortBy === "Most Engaged") {
        return b.engagementCount - a.engagementCount;
      }

      return b.publicScore - a.publicScore;
    });
  }, [leaders, statsMap, selectedRole, sortBy, searchText]);

  const featured = rankedLeaders.slice(0, 3);
  const remaining = rankedLeaders.slice(3);

  return (
    <div className="min-h-screen page-fade-in bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_26%,#f4f7fb_100%)]">
      <Navbar />

      <main className="mx-auto max-w-[1380px] px-4 py-4 md:px-6">
        <section className="surface-shell p-4 md:p-5 lg:p-6">
          <div className="rounded-[28px] border border-blue-100/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 shadow-[0_16px_34px_rgba(15,23,42,0.06)] md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
                  {text.badge}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <h1 className="bg-[linear-gradient(180deg,#020617_0%,#0f172a_42%,#1d4ed8_100%)] bg-clip-text text-3xl font-extrabold tracking-tight text-transparent md:text-4xl">
                    {text.title}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setShowHowItWorks((prev) => !prev)}
                    className="inline-flex min-h-[36px] items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-slate-900"
                  >
                    {showHowItWorks ? text.howHide : text.howShow}
                  </button>
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {text.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 lg:justify-end">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700">
                  {text.visibleLeaders}: <span className="font-semibold text-slate-950">{rankedLeaders.length}</span>
                </span>
                {lastUpdated ? (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">
                    {text.lastUpdated}: <span className="font-semibold text-slate-900">{lastUpdated}</span>
                  </span>
                ) : null}
              </div>
            </div>

            {showHowItWorks && (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-white px-4 py-3">
                <p className="text-sm font-semibold text-slate-950">{text.methodTitle}</p>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  {text.methodText}
                </p>
              </div>
            )}

            <div className="mt-4 rounded-[24px] border border-blue-100/80 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="min-w-0 lg:max-w-[320px] lg:flex-1">
                  <label className="sr-only" htmlFor="ranking-search">
                    {text.searchLabel || "Search profiles"}
                  </label>
                  <input
                    id="ranking-search"
                    type="search"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder={
                      text.searchPlaceholder ||
                      "Search by leader, role, district, province, or party..."
                    }
                    className="h-11 w-full rounded-2xl border border-blue-100 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="min-w-0 lg:flex-[1.4]">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {roleTabs.map((role) => (
                      <NepalActionButton
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        tone={selectedRole === role ? "primary" : "secondary"}
                        className="min-h-[40px] shrink-0 px-4 py-2 text-sm"
                      >
                        {role === "All" ? text.allLeaders : roleLabel(role)}
                      </NepalActionButton>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:ml-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="h-11 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option>{text.sortPublic}</option>
                    <option>{text.sortHighest}</option>
                    <option>{text.sortDiscussed}</option>
                    <option>{text.sortEngaged}</option>
                    <option>{text.sortLowest}</option>
                  </select>

                  {(selectedRole !== "All" || searchText.trim()) ? (
                    <NepalActionButton
                      onClick={() => {
                        setSelectedRole("All");
                        setSearchText("");
                      }}
                      tone="secondary"
                      className="min-h-[40px] px-4 py-2 text-sm"
                    >
                      {text.clearFilters || "Clear filters"}
                    </NepalActionButton>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-8 space-y-5">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="skeleton-shimmer h-[240px] rounded-[28px] border border-blue-100/70"
                  />
                ))}
              </div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="skeleton-shimmer h-[88px] rounded-[24px] border border-blue-100/70"
                  />
                ))}
              </div>
            </div>
          ) : rankedLeaders.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-blue-200 bg-white px-6 py-12 text-center">
              <h2 className="text-xl font-bold text-slate-900">{text.emptyTitle}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {text.emptyBody}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950 md:text-xl">{text.topTitle}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {text.topBody}
                    </p>
                  </div>
                  <div className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 md:inline-flex">
                    {text.spotlight}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-3 xl:items-start">
                  {featured.map((item, index) => (
                    <FeaturedLeaderCard
                      key={item.leader.leaderId}
                      item={item}
                      rank={index + 1}
                    />
                  ))}
                </div>
              </section>

              <section className="rounded-[30px] border border-blue-100/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] md:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950 md:text-xl">{text.fullTitle}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {text.fullBody}
                    </p>
                  </div>
                  <p className="hidden text-sm text-slate-600 md:block">
                    {text.compactView}
                  </p>
                </div>

                <div className="mb-3 hidden rounded-2xl border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f8ff_100%)] px-4 py-3 lg:grid lg:grid-cols-[minmax(0,2.4fr)_minmax(120px,0.8fr)_repeat(4,minmax(90px,0.7fr))_minmax(120px,0.9fr)_auto] lg:gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{text.tableLeader}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{text.tableSignal}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{text.tableScore}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{text.tableAvgRating}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{text.tableComments}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{text.tableEngagement}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{text.tableTrend}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-right text-slate-600">{text.tableAction}</p>
                </div>

                <div className="space-y-3">
                  {remaining.map((item, index) => (
                    <LeaderListRow
                      key={item.leader.leaderId}
                      item={item}
                      rank={index + 4}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Ranking;