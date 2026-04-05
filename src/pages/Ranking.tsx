import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../services/api";

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
  votes?: number;
  comments?: number;
  rating?: number;
  engagementScore?: number;
};

type SortOption =
  | "Most Popular"
  | "Highest Rated"
  | "Most Discussed"
  | "Most Liked"
  | "Lowest Rated";

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

function statValue(value?: number) {
  if (typeof value !== "number") return 0;
  return Number.isInteger(value) ? value : Number(value.toFixed(1));
}

function Ranking() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, LeaderStats>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("Most Popular");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRankingData = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.getLeaders();
        const leaderItems = Array.isArray(res) ? res : res?.leaders || [];
        setLeaders(leaderItems);

        const statEntries = await Promise.all(
          leaderItems.map(async (leader: Leader) => {
            try {
              const stats = await api.getLeaderStats(leader.leaderId);
              return [
                leader.leaderId,
                {
                  likes: stats?.likes || 0,
                  dislikes: stats?.dislikes || 0,
                  votes: stats?.votes || 0,
                  comments: stats?.comments || 0,
                  rating: stats?.rating || 0,
                  engagementScore:
                    stats?.engagementScore ??
                    (stats?.likes || 0) +
                      (stats?.votes || 0) +
                      (stats?.comments || 0) -
                      (stats?.dislikes || 0),
                },
              ] as const;
            } catch {
              return [
                leader.leaderId,
                {
                  likes: 0,
                  dislikes: 0,
                  votes: 0,
                  comments: 0,
                  rating: 0,
                  engagementScore: 0,
                },
              ] as const;
            }
          })
        );

        setStatsMap(Object.fromEntries(statEntries));
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

  const rankedLeaders = useMemo(() => {
    const filtered =
      selectedRole === "All"
        ? leaders
        : leaders.filter((leader) => leader.role === selectedRole);

    const sorted = [...filtered].sort((a, b) => {
      const aStats = statsMap[a.leaderId] || {};
      const bStats = statsMap[b.leaderId] || {};

      if (sortBy === "Highest Rated") {
        return (bStats.rating || 0) - (aStats.rating || 0);
      }

      if (sortBy === "Lowest Rated") {
        return (aStats.rating || 0) - (bStats.rating || 0);
      }

      if (sortBy === "Most Discussed") {
        return (bStats.comments || 0) - (aStats.comments || 0);
      }

      if (sortBy === "Most Liked") {
        return (bStats.likes || 0) - (aStats.likes || 0);
      }

      return (bStats.engagementScore || 0) - (aStats.engagementScore || 0);
    });

    return sorted;
  }, [leaders, statsMap, selectedRole, sortBy]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto max-w-[1380px] px-4 py-6 md:px-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 md:text-6xl">
                Leaders Ranking
              </h1>
              <p className="mt-3 text-lg text-slate-500">
                Ranked by real public response from your platform
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-lg text-slate-700">
                Showing{" "}
                <span className="font-bold text-slate-950">
                  {rankedLeaders.length}
                </span>{" "}
                leaders
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-3xl border border-slate-300 bg-white px-5 py-4 text-lg outline-none"
              >
                <option>Most Popular</option>
                <option>Highest Rated</option>
                <option>Most Discussed</option>
                <option>Most Liked</option>
                <option>Lowest Rated</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {roleTabs.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`rounded-full px-6 py-4 text-lg font-semibold transition ${
                  selectedRole === role
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {role === "All" ? "All" : roleLabel(role)}
              </button>
            ))}
          </div>

          {error ? (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[460px] animate-pulse rounded-[28px] border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-3">
              {rankedLeaders.map((leader, index) => {
                const stats = statsMap[leader.leaderId] || {};
                const score =
                  sortBy === "Highest Rated" || sortBy === "Lowest Rated"
                    ? stats.rating || 0
                    : sortBy === "Most Discussed"
                    ? stats.comments || 0
                    : sortBy === "Most Liked"
                    ? stats.likes || 0
                    : stats.engagementScore || 0;

                return (
                  <article
                    key={leader.leaderId}
                    className={`rounded-[28px] border p-7 shadow-sm ${
                      index === 0 || index === 2
                        ? "border-amber-300 bg-amber-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg text-slate-500">Rank #{index + 1}</p>
                        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
                          {leader.name}
                        </h2>
                        <p className="mt-3 text-xl font-semibold text-blue-600">
                          {leader.currentStatus || "Current"} {roleLabel(leader.role)}
                        </p>
                        <p className="mt-2 text-lg text-slate-600">
                          {leader.party || "No party"}
                        </p>
                        <p className="mt-2 text-lg text-slate-500">
                          {getDistrictName(leader.district)}, {getProvinceName(leader)}
                        </p>
                      </div>

                      <div className="rounded-[20px] bg-blue-600 px-5 py-4 text-3xl font-bold text-white shadow-md">
                        {statValue(score)}
                      </div>
                    </div>

                    <div className="mb-6">
                      {leader.photo ? (
                        <img
                          src={leader.photo}
                          alt={leader.name}
                          className="h-28 w-28 rounded-[24px] object-cover"
                        />
                      ) : (
                        <div className="h-28 w-28 rounded-[24px] bg-slate-200" />
                      )}
                    </div>

                    <div className="mb-6 flex flex-wrap gap-3">
                      {leader.badge ? (
                        <span className="rounded-full bg-slate-950 px-4 py-2 text-lg font-semibold text-white">
                          {leader.badge}
                        </span>
                      ) : null}

                      {leader.verified ? (
                        <span className="rounded-full bg-emerald-100 px-4 py-2 text-lg font-semibold text-emerald-700">
                          Verified
                        </span>
                      ) : null}

                      {(leader.startYear || leader.endYear) && (
                        <span className="rounded-full bg-blue-100 px-4 py-2 text-lg font-semibold text-blue-700">
                          {leader.startYear || "—"} - {leader.endYear || "Present"}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-sm text-slate-500">Likes</p>
                        <p className="mt-1 text-xl font-bold text-slate-950">
                          {statValue(stats.likes)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-sm text-slate-500">Dislikes</p>
                        <p className="mt-1 text-xl font-bold text-slate-950">
                          {statValue(stats.dislikes)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-sm text-slate-500">Comments</p>
                        <p className="mt-1 text-xl font-bold text-slate-950">
                          {statValue(stats.comments)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-sm text-slate-500">Rating</p>
                        <p className="mt-1 text-xl font-bold text-slate-950">
                          {statValue(stats.rating)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        to={`/leader/${leader.leaderId}`}
                        className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Go to Profile
                      </Link>

                      <Link
                        to={`/leader/${leader.leaderId}`}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View Activity
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Ranking;