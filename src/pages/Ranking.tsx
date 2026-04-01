import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { allLeaders } from "../data/leaders/allLeaders";
import { api } from "../services/api";

type FilterType =
  | "All"
  | "Prime Minister"
  | "Minister"
  | "MP"
  | "National Assembly Member";

type SortType = "popularity" | "rating" | "likes" | "votes";

type LeaderStatsMap = Record<
  string,
  {
    likes: number;
    dislikes: number;
    averageRating: number;
    ratingCount: number;
    totalReactions: number;
  }
>;

function getPopularityScore(stats: {
  likes: number;
  dislikes: number;
  averageRating: number;
  ratingCount: number;
}) {
  return stats.likes * 2 + stats.averageRating * 20 + stats.ratingCount * 3 - stats.dislikes;
}

function getRankStyle(index: number) {
  if (index === 0) {
    return "border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-100 shadow-[0_10px_40px_rgba(234,179,8,0.20)]";
  }
  if (index === 1) {
    return "border-slate-300 bg-gradient-to-br from-slate-50 to-slate-200 shadow-[0_10px_40px_rgba(148,163,184,0.18)]";
  }
  if (index === 2) {
    return "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-100 shadow-[0_10px_40px_rgba(180,83,9,0.18)]";
  }
  return "border-slate-200 bg-slate-50";
}

function getTenureText(startYear?: string, endYear?: string) {
  if (!startYear) return "Tenure not added";

  const start = Number(startYear);
  if (Number.isNaN(start)) return `${startYear} - ${endYear || "Present"}`;

  const currentYear = new Date().getFullYear();
  const finish = endYear && endYear !== "Present" ? Number(endYear) : currentYear;

  if (Number.isNaN(finish)) return `${startYear} - ${endYear || "Present"}`;

  const years = Math.max(0, finish - start);
  return years <= 1 ? "1 year" : `${years} years`;
}

function Ranking() {
  const [filter, setFilter] = useState<FilterType>("All");
  const [sortBy, setSortBy] = useState<SortType>("popularity");
  const [statsMap, setStatsMap] = useState<LeaderStatsMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);

        const entries = await Promise.all(
          allLeaders.map(async (leader) => {
            try {
              const stats = await api.getLeaderStats(leader.id);

              return [
                leader.id,
                {
                  likes: stats.likes ?? 0,
                  dislikes: stats.dislikes ?? 0,
                  averageRating: stats.averageRating ?? 0,
                  ratingCount: stats.ratingCount ?? 0,
                  totalReactions: stats.totalReactions ?? 0,
                },
              ] as const;
            } catch {
              return [
                leader.id,
                {
                  likes: 0,
                  dislikes: 0,
                  averageRating: 0,
                  ratingCount: 0,
                  totalReactions: 0,
                },
              ] as const;
            }
          })
        );

        setStatsMap(Object.fromEntries(entries));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const filteredLeaders = useMemo(() => {
    let result = [...allLeaders];

    if (filter !== "All") {
      result = result.filter((leader) => leader.role === filter);
    }

    result.sort((a, b) => {
      const statsA = statsMap[a.id] || {
        likes: 0,
        dislikes: 0,
        averageRating: 0,
        ratingCount: 0,
        totalReactions: 0,
      };

      const statsB = statsMap[b.id] || {
        likes: 0,
        dislikes: 0,
        averageRating: 0,
        ratingCount: 0,
        totalReactions: 0,
      };

      if (sortBy === "popularity") {
        return getPopularityScore(statsB) - getPopularityScore(statsA);
      }

      if (sortBy === "rating") {
        return statsB.averageRating - statsA.averageRating;
      }

      if (sortBy === "likes") {
        return statsB.likes - statsA.likes;
      }

      if (sortBy === "votes") {
        return statsB.ratingCount - statsA.ratingCount;
      }

      return 0;
    });

    return result;
  }, [filter, sortBy, statsMap]);

  const topThree = filteredLeaders.slice(0, 3);
  const others = filteredLeaders.slice(3);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900">
                Leaders Ranking
              </h1>
              <p className="text-slate-500 mt-2 text-base md:text-lg">
                Ranked by real public response from your platform
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-600">
              Showing{" "}
              <span className="font-bold text-slate-900">{filteredLeaders.length}</span>{" "}
              leaders
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-4 mb-8">
            <div className="flex flex-wrap gap-3">
              {(
                ["All", "Prime Minister", "Minister", "MP", "National Assembly Member"] as FilterType[]
              ).map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`px-5 py-3 rounded-full font-semibold transition ${
                    filter === item
                      ? "bg-blue-600 text-white shadow"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="xl:ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="popularity">Sort: Most Popular</option>
                <option value="rating">Sort: Highest Rated</option>
                <option value="likes">Sort: Most Liked</option>
                <option value="votes">Sort: Most Votes</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-500">
              Loading ranking data...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
                {topThree.map((leader, index) => {
                  const stats = statsMap[leader.id] || {
                    likes: 0,
                    dislikes: 0,
                    averageRating: 0,
                    ratingCount: 0,
                    totalReactions: 0,
                  };

                  return (
                    <div
                      key={leader.id}
                      className={`rounded-3xl border p-6 transition duration-300 hover:-translate-y-1 ${getRankStyle(
                        index
                      )}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <div>
                          <p className="text-sm font-semibold text-slate-500">
                            Rank #{index + 1}
                          </p>
                          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
                            {leader.name}
                          </h2>
                          <p className="text-blue-600 font-semibold mt-1">
                            {leader.currentStatus} {leader.role}
                          </p>
                          <p className="text-slate-600">{leader.party || "Not added yet"}</p>
                          <p className="text-slate-500">
                            {leader.district || "District not added"}
                            {leader.province ? `, ${leader.province}` : ""}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-blue-600 text-white px-4 py-3 text-lg font-bold shadow-md">
                          {getPopularityScore(stats).toFixed(0)}
                        </div>
                      </div>

                      {leader.photo ? (
                        <img
                          src={leader.photo}
                          alt={leader.name}
                          className="w-24 h-24 rounded-3xl object-cover border border-white shadow-sm mb-5"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-3xl bg-slate-200 border border-white shadow-sm mb-5" />
                      )}

                      <div className="flex flex-wrap gap-2 mb-5">
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

                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <StatCard label="Likes" value={stats.likes} />
                        <StatCard label="Dislikes" value={stats.dislikes} />
                        <StatCard label="Rating" value={stats.averageRating} />
                        <StatCard label="Votes" value={stats.ratingCount} />
                        <StatCard label="Reactions" value={stats.totalReactions} />
                        <StatCard
                          label="Tenure"
                          value={getTenureText(leader.startYear, leader.endYear)}
                        />
                      </div>

                      <Link
                        to={`/leader/${leader.id}`}
                        className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-white font-semibold hover:bg-slate-700 transition"
                      >
                        View Profile
                      </Link>
                    </div>
                  );
                })}
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-5">All Ranked Leaders</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {others.map((leader, index) => {
                    const stats = statsMap[leader.id] || {
                      likes: 0,
                      dislikes: 0,
                      averageRating: 0,
                      ratingCount: 0,
                      totalReactions: 0,
                    };

                    return (
                      <div
                        key={leader.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="flex gap-4 items-start">
                          {leader.photo ? (
                            <img
                              src={leader.photo}
                              alt={leader.name}
                              className="w-20 h-20 rounded-2xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-500 font-semibold">
                              Photo
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm text-slate-500">Rank #{index + 4}</p>
                                <h2 className="text-2xl font-bold text-slate-900">
                                  {leader.name}
                                </h2>
                                <p className="text-blue-600 font-semibold mt-1">
                                  {leader.currentStatus} {leader.role}
                                </p>
                                <p className="text-slate-600 mt-1">
                                  {leader.party || "Not added yet"}
                                </p>
                                <p className="text-slate-500 mt-1">
                                  {leader.district || "District not added"}
                                  {leader.province ? `, ${leader.province}` : ""}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-blue-600 text-white px-3 py-2 text-sm font-bold">
                                {getPopularityScore(stats).toFixed(0)}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4 mb-4">
                              {leader.badge && (
                                <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold">
                                  {leader.badge}
                                </span>
                              )}

                              {(leader.startYear || leader.endYear) && (
                                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                  {leader.startYear || "—"} - {leader.endYear || "Present"}
                                </span>
                              )}

                              {leader.verified && (
                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                  Verified
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
                              <StatCard label="Likes" value={stats.likes} />
                              <StatCard label="Dislikes" value={stats.dislikes} />
                              <StatCard label="Rating" value={stats.averageRating} />
                              <StatCard label="Votes" value={stats.ratingCount} />
                              <StatCard label="Reactions" value={stats.totalReactions} />
                              <StatCard
                                label="Tenure"
                                value={getTenureText(leader.startYear, leader.endYear)}
                              />
                            </div>

                            <div className="mt-5">
                              <Link
                                to={`/leader/${leader.id}`}
                                className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-white font-semibold hover:bg-slate-700 transition"
                              >
                                View Profile
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

export default Ranking;