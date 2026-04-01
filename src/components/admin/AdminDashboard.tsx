import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../services/api";
import { allLeaders } from "../../data/leaders/allLeaders";

type LeaderStats = {
  likes: number;
  dislikes: number;
  totalReactions: number;
  averageRating: number;
  likePercentage: string;
  dislikePercentage: string;
  ratingCount: number;
};

type DashboardLeader = {
  id: string;
  name: string;
  role: string;
  district?: string;
  province?: string;
  photo?: string;
  badge?: string;
  stats: LeaderStats;
  score: number;
};

function AdminDashboard() {
  const [leadersData, setLeadersData] = useState<DashboardLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const result = await Promise.all(
        allLeaders.map(async (leader) => {
          try {
            const stats = await api.getLeaderStats(leader.id);

            const safeStats: LeaderStats = {
              likes: stats.likes ?? 0,
              dislikes: stats.dislikes ?? 0,
              totalReactions: stats.totalReactions ?? 0,
              averageRating: stats.averageRating ?? 0,
              likePercentage: stats.likePercentage ?? "0.0",
              dislikePercentage: stats.dislikePercentage ?? "0.0",
              ratingCount: stats.ratingCount ?? 0,
            };

            const score =
              safeStats.likes * 2 +
              safeStats.ratingCount * 3 +
              safeStats.averageRating * 20 -
              safeStats.dislikes;

            return {
              id: leader.id,
              name: leader.name,
              role: leader.role,
              district: leader.district,
              province: leader.province,
              photo: leader.photo,
              badge: leader.badge,
              stats: safeStats,
              score,
            };
          } catch {
            return {
              id: leader.id,
              name: leader.name,
              role: leader.role,
              district: leader.district,
              province: leader.province,
              photo: leader.photo,
              badge: leader.badge,
              stats: {
                likes: 0,
                dislikes: 0,
                totalReactions: 0,
                averageRating: 0,
                likePercentage: "0.0",
                dislikePercentage: "0.0",
                ratingCount: 0,
              },
              score: 0,
            };
          }
        })
      );

      setLeadersData(result);
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const totals = useMemo(() => {
    return leadersData.reduce(
      (acc, leader) => {
        acc.likes += leader.stats.likes;
        acc.dislikes += leader.stats.dislikes;
        acc.reactions += leader.stats.totalReactions;
        acc.votes += leader.stats.ratingCount;
        return acc;
      },
      {
        likes: 0,
        dislikes: 0,
        reactions: 0,
        votes: 0,
      }
    );
  }, [leadersData]);

  const topRising = useMemo(() => {
    return [...leadersData].sort((a, b) => b.score - a.score).slice(0, 6);
  }, [leadersData]);

  const topRated = useMemo(() => {
    return [...leadersData]
      .sort((a, b) => b.stats.averageRating - a.stats.averageRating)
      .slice(0, 6);
  }, [leadersData]);

  const mostDiscussed = useMemo(() => {
    return [...leadersData]
      .sort((a, b) => b.stats.ratingCount - a.stats.ratingCount)
      .slice(0, 6);
  }, [leadersData]);

  const chartMax = useMemo(() => {
    return Math.max(...topRising.map((item) => item.score), 1);
  }, [topRising]);

  return (
    <AdminLayout
      title="Website Dashboard"
      description="Visual overview of public activity, leader engagement, and website growth"
    >
      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-500">
          Loading dashboard...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-600">
              Auto-refresh every 30 seconds
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-600">
              Last updated: <span className="font-semibold text-slate-900">{lastUpdated || "—"}</span>
            </div>
          </div>

          <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard label="Total Leaders" value={leadersData.length} />
            <MetricCard label="Total Likes" value={totals.likes} />
            <MetricCard label="Total Dislikes" value={totals.dislikes} />
            <MetricCard label="Total Votes" value={totals.votes} />
          </section>

          <section className="grid grid-cols-1 2xl:grid-cols-[1.4fr_1fr] gap-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-slate-900">Rising Leaders</h2>
                <p className="text-slate-500 mt-1">
                  Current engagement score from likes, votes, ratings, and dislikes
                </p>
              </div>

              <div className="space-y-4">
                {topRising.map((leader, index) => (
                  <div key={leader.id} className="rounded-2xl bg-white border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>

                        {leader.photo ? (
                          <img
                            src={leader.photo}
                            alt={leader.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-slate-200" />
                        )}

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{leader.name}</p>
                          <p className="text-sm text-slate-500">
                            {leader.role}
                            {leader.district ? ` • ${leader.district}` : ""}
                          </p>
                        </div>
                      </div>

                      <span className="text-sm font-bold text-blue-700">
                        {leader.score.toFixed(0)}
                      </span>
                    </div>

                    <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${(leader.score / chartMax) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-slate-900">Engagement Snapshot</h2>
                <p className="text-slate-500 mt-1">
                  Quick visual distribution of website activity
                </p>
              </div>

              <div className="space-y-5">
                <ProgressRow
                  label="Likes"
                  value={totals.likes}
                  max={Math.max(totals.likes, totals.dislikes, totals.votes, totals.reactions, 1)}
                />
                <ProgressRow
                  label="Dislikes"
                  value={totals.dislikes}
                  max={Math.max(totals.likes, totals.dislikes, totals.votes, totals.reactions, 1)}
                />
                <ProgressRow
                  label="Votes"
                  value={totals.votes}
                  max={Math.max(totals.likes, totals.dislikes, totals.votes, totals.reactions, 1)}
                />
                <ProgressRow
                  label="Reactions"
                  value={totals.reactions}
                  max={Math.max(totals.likes, totals.dislikes, totals.votes, totals.reactions, 1)}
                />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
            <LeaderboardCard
              title="Top Rated Leaders"
              subtitle="Highest average public rating"
              leaders={topRated}
              valueKey="rating"
            />

            <LeaderboardCard
              title="Most Discussed Leaders"
              subtitle="Most voted public profiles"
              leaders={mostDiscussed}
              valueKey="votes"
            />
          </section>
        </div>
      )}
    </AdminLayout>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-extrabold text-slate-900 mt-2">{value}</p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const width = max > 0 ? (value / max) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-sm text-slate-600 mb-2">
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full rounded-full bg-slate-900" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function LeaderboardCard({
  title,
  subtitle,
  leaders,
  valueKey,
}: {
  title: string;
  subtitle: string;
  leaders: DashboardLeader[];
  valueKey: "rating" | "votes";
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-slate-500 mt-1">{subtitle}</p>
      </div>

      <div className="space-y-4">
        {leaders.map((leader, index) => (
          <div
            key={leader.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>

              {leader.photo ? (
                <img
                  src={leader.photo}
                  alt={leader.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-slate-200" />
              )}

              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{leader.name}</p>
                <p className="text-sm text-slate-500">
                  {leader.role}
                  {leader.district ? ` • ${leader.district}` : ""}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-slate-900">
                {valueKey === "rating"
                  ? leader.stats.averageRating.toFixed(1)
                  : leader.stats.ratingCount}
              </p>
              <p className="text-xs text-slate-500">
                {valueKey === "rating" ? "rating" : "votes"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;