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
  trustLabel: string;
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
  if (activity >= 40) return "Rising This Week";
  if (activity >= 18) return "Steady Attention";
  if (activity >= 8) return "Building Interest";
  return "Limited recent data";
}

function getTrustLabel(avgRating: number, ratingCount: number, commentCount: number, verified?: boolean) {
  if (verified && avgRating >= 4.2 && ratingCount >= 8) return "Trusted by Community";
  if (commentCount >= 12) return "Most Discussed";
  if (verified) return "Verified Profile";
  return "Emerging Profile";
}

function getDataLabel(ratingCount: number, commentCount: number) {
  const total = ratingCount + commentCount;
  if (total < 4) return "Emerging profile";
  if (total < 10) return "Developing signal";
  return "Established signal";
}

function buildRankedLeaders(leaders: Leader[], statsMap: Record<string, LeaderStats>) {
  const safeStats = leaders.map((leader) => {
    const raw = statsMap[leader.leaderId] || {};
    const likes = raw.likes ?? 0;
    const dislikes = raw.dislikes ?? 0;
    const comments = raw.comments ?? 0;
    const rating = raw.averageRating ?? 0;
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
        rating,
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
    const ratingQuality = normalize((stats.rating / 5) * confidenceWeight, 1);
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
      weightedRating: roundValue(stats.rating * confidenceWeight),
      engagementCount: stats.engagementScore,
      trendLabel: getTrendLabel(
        stats.comments,
        stats.engagementScore,
        stats.ratingCount
      ),
      trustLabel: getTrustLabel(
        stats.rating,
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
      label: "Most Trusted",
      tone: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  if (item.trendLabel === "Rising This Week") {
    return {
      label: "Rising This Week",
      tone: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (item.trustLabel === "Most Discussed" || item.stats.comments >= 12) {
    return {
      label: "Most Discussed",
      tone: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  return {
    label: rank === 2 ? "Strong Public Signal" : "Community Watchlist",
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
    "Rising This Week": text.trendRising,
    "Steady Attention": text.trendSteady,
    "Building Interest": text.trendBuilding,
    "Limited recent data": text.trendLimited,
    "Trusted by Community": text.trustTrusted,
    "Most Discussed": text.trustDiscussed,
    "Verified Profile": text.trustVerified,
    "Emerging Profile": text.trustEmerging,
    "Emerging profile": text.dataEmerging,
    "Developing signal": text.dataDeveloping,
    "Established signal": text.dataEstablished,
    "Most Trusted": text.badgeMostTrusted,
    "Strong Public Signal": text.badgeStrongSignal,
    "Community Watchlist": text.badgeWatchlist,
  };

  return map[value] || value;
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
      className={`relative inline-flex ${sizeClass} items-center justify-center rounded-full border border-blue-100 bg-white shadow-sm ring-4 ring-blue-50`}
    >
      <div className="absolute inset-2 rounded-full border border-dashed border-blue-200/80" />
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

function FeaturedLeaderCard({
  item,
  rank,
}: {
  item: RankedLeader;
  rank: number;
}) {
  const { section } = useLanguage();
  const text = section("ranking");
  const { leader, stats, publicScore, trendLabel, trustLabel, dataLabel } = item;
  const featureBadge = getFeaturedBadge(item, rank);
  const isFirst = rank === 1;
  const cardTone = isFirst
    ? "border-blue-200 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_48%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-lg shadow-blue-100/60"
    : "border-slate-200 bg-white shadow-sm";

  return (
    <article
      className={`rounded-[26px] border p-4 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${cardTone} ${
        isFirst ? "xl:-mt-1 xl:p-5" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
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
          {translateRankingSignal(trustLabel, text)}
        </span>
        <p className="text-sm text-slate-500">{translateRankingSignal(dataLabel, text)}</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MetricTile
          label={text.rating}
          value={roundValue(stats.rating)}
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
  const { leader, stats, publicScore, trendLabel, trustLabel, dataLabel } = item;

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white/95 px-4 py-3 shadow-sm transition duration-300 hover:border-slate-300 hover:shadow-md">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2.4fr)_minmax(120px,0.8fr)_repeat(4,minmax(90px,0.7fr))_minmax(120px,0.9fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
            #{rank}
          </div>

          {leader.photo ? (
            <img
              src={leader.photo}
              alt={leader.name}
              className="h-12 w-12 rounded-[16px] object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-slate-200 text-lg font-bold text-slate-600">
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
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {getDistrictName(leader.district)}, {getProvinceName(leader)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:block">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {translateRankingSignal(trustLabel, text)}
          </span>
          <p className="mt-1 hidden text-xs text-slate-500 lg:block">
            {translateRankingSignal(dataLabel, text)}
          </p>
        </div>

        <LeaderboardMetric label={text.score} value={publicScore} strong />
        <LeaderboardMetric
          label={text.rating}
          value={roundValue(stats.rating)}
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
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
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 truncate ${
          compact ? "text-sm font-semibold" : strong ? "text-lg font-extrabold" : "text-base font-bold"
        } text-slate-950`}
      >
        {value}
      </p>
      {helper ? <p className="mt-0.5 text-xs text-slate-500">{helper}</p> : null}
    </div>
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
    const signature = `${selectedRole}::${sortBy}`;

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
      },
    });
  }, [selectedRole, sortBy, text.title]);

  const rankedLeaders = useMemo(() => {
    const filtered =
      selectedRole === "All"
        ? leaders
        : leaders.filter((leader) => leader.role === selectedRole);

    const computed = buildRankedLeaders(filtered, statsMap);

    return computed.sort((a, b) => {
      if (sortBy === "Highest Rated") {
        return b.stats.rating - a.stats.rating;
      }

      if (sortBy === "Lowest Rated") {
        return a.stats.rating - b.stats.rating;
      }

      if (sortBy === "Most Discussed") {
        return b.stats.comments - a.stats.comments;
      }

      if (sortBy === "Most Engaged") {
        return b.engagementCount - a.engagementCount;
      }

      return b.publicScore - a.publicScore;
    });
  }, [leaders, statsMap, selectedRole, sortBy]);

  const featured = rankedLeaders.slice(0, 3);
  const remaining = rankedLeaders.slice(3);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto max-w-[1380px] px-4 py-4 md:px-6">
        <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm md:p-5 lg:p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                {text.badge}
              </div>

              <h1 className="mt-2.5 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
                {text.title}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {text.subtitle}
              </p>

              {showHowItWorks && (
                <div className="mt-3 rounded-3xl border border-slate-200 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-slate-900">{text.methodTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {text.methodText}
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-3 xl:w-[540px]">
              <div className="rounded-3xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-700 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{text.visibleLeaders}</p>
                <p className="mt-1 text-xl font-extrabold text-slate-950">
                  {rankedLeaders.length}
                </p>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-3xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option>{text.sortPublic}</option>
                <option>{text.sortHighest}</option>
                <option>{text.sortDiscussed}</option>
                <option>{text.sortEngaged}</option>
                <option>{text.sortLowest}</option>
              </select>

              {lastUpdated ? (
                <div className="rounded-3xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm text-slate-600">
                  {text.lastUpdated}: <span className="font-semibold text-slate-900">{lastUpdated}</span>
                </div>
              ) : (
                <div />
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
            {roleTabs.map((role) => (
              <NepalActionButton
                key={role}
                onClick={() => setSelectedRole(role)}
                tone={selectedRole === role ? "primary" : "secondary"}
                className="min-h-[42px] px-4 py-2.5 text-sm"
              >
                {role === "All" ? text.allLeaders : roleLabel(role)}
              </NepalActionButton>
            ))}
            </div>

            <NepalActionButton
              onClick={() => setShowHowItWorks((prev) => !prev)}
              tone="secondary"
              className="min-h-[42px] px-4 py-2 text-sm"
            >
              {showHowItWorks ? text.howHide : text.howShow}
            </NepalActionButton>
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
                    className="h-[240px] animate-pulse rounded-[28px] border border-slate-200 bg-slate-100"
                  />
                ))}
              </div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[88px] animate-pulse rounded-[24px] border border-slate-200 bg-slate-100"
                  />
                ))}
              </div>
            </div>
          ) : rankedLeaders.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
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
                    <p className="mt-1 text-sm text-slate-500">
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

              <section className="rounded-[30px] border border-slate-200 bg-white/75 p-4 shadow-sm md:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950 md:text-xl">{text.fullTitle}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {text.fullBody}
                    </p>
                  </div>
                  <p className="hidden text-sm text-slate-500 md:block">
                    {text.compactView}
                  </p>
                </div>

                <div className="mb-3 hidden rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 lg:grid lg:grid-cols-[minmax(0,2.4fr)_minmax(120px,0.8fr)_repeat(4,minmax(90px,0.7fr))_minmax(120px,0.9fr)_auto] lg:gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{text.tableLeader}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{text.tableSignal}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{text.tableScore}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{text.tableAvgRating}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{text.tableComments}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{text.tableEngagement}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{text.tableTrend}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-right text-slate-500">{text.tableAction}</p>
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


