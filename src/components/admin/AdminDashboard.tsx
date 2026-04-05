import { useEffect, useMemo, useState } from "react";
import {
  Users,
  MessageSquare,
  Star,
  ShieldAlert,
  Vote,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import StatCard from "./StatCard";
import WidgetCard from "./WidgetCard";
import LeaderListWidget from "./LeaderListWidget";
import EngagementWidget from "./EngagementWidget";

type AnalyticsLeader = {
  _id?: string;
  leaderId: string;
  name: string;
  role: string;
  district?: string;
  province?: string;
  photo?: string;
  likeCount: number;
  dislikeCount: number;
  voteCount: number;
  commentCount: number;
  ratingCount: number;
  avgRating: number;
  complaintCount: number;
  engagementScore: number;
};

type OverviewResponse = {
  totals: {
    leaders: number;
    comments: number;
    ratings: number;
    complaints: number;
    likes: number;
    dislikes: number;
    votes: number;
  };
  topPopular: AnalyticsLeader[];
  mostDiscussed: AnalyticsLeader[];
  highestRated: AnalyticsLeader[];
  lowestRated: AnalyticsLeader[];
  topComplaintDistricts: { district: string; count: number }[];
  recentActivity: { label: string; value: number }[];
};

function AdminDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");
      const res = await api.getAdminAnalyticsOverview(token);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [token]);

  const lastUpdated = useMemo(() => {
    return new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [data]);

  const topPopularForWidget =
    data?.topPopular.map((leader) => ({
      id: leader.leaderId,
      name: leader.name,
      role: leader.role,
      district:
        typeof leader.district === "string" ? leader.district : leader.province || "",
      score: leader.engagementScore,
      photo: leader.photo,
    })) || [];

  const mostDiscussedForWidget =
    data?.mostDiscussed.map((leader) => ({
      id: leader.leaderId,
      name: leader.name,
      role: `${leader.role} • ${leader.commentCount} comments`,
      district:
        typeof leader.district === "string" ? leader.district : leader.province || "",
      score: leader.commentCount,
      photo: leader.photo,
    })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Website Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Real-time overview of leader popularity, ratings, discussion, and complaint signals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadOverview}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
          >
            <RefreshCw size={14} />
            Refresh
          </button>

          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
            Last updated: <span className="font-semibold text-slate-950">{lastUpdated}</span>
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Leaders"
          value={loading ? "..." : data?.totals.leaders || 0}
          helper="Profiles tracked"
          icon={Users}
        />
        <StatCard
          title="Comments"
          value={loading ? "..." : data?.totals.comments || 0}
          helper="Public discussion"
          icon={MessageSquare}
        />
        <StatCard
          title="Ratings"
          value={loading ? "..." : data?.totals.ratings || 0}
          helper="Rating submissions"
          icon={Star}
        />
        <StatCard
          title="Complaints"
          value={loading ? "..." : data?.totals.complaints || 0}
          helper="Complaint signals"
          icon={ShieldAlert}
        />
        <StatCard
          title="Votes"
          value={loading ? "..." : data?.totals.votes || 0}
          helper="Engagement actions"
          icon={Vote}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
        <WidgetCard
          title="Top Popular Leaders"
          subtitle="Sorted by engagement score from likes, votes, ratings, comments, and dislikes"
        >
          <LeaderListWidget leaders={topPopularForWidget} />
        </WidgetCard>

        <WidgetCard
          title="Engagement Snapshot"
          subtitle="Live visual summary from your website"
        >
          <EngagementWidget
            likes={data?.totals.likes || 0}
            dislikes={data?.totals.dislikes || 0}
            votes={data?.totals.votes || 0}
          />
        </WidgetCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <WidgetCard
          title="Most Discussed"
          subtitle="Leaders getting the most comments"
        >
          <LeaderListWidget leaders={mostDiscussedForWidget} />
        </WidgetCard>

        <WidgetCard
          title="Highest Rated"
          subtitle="Best average public ratings"
        >
          <div className="space-y-3">
            {(data?.highestRated || []).map((leader) => (
              <div
                key={leader.leaderId}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <p className="font-semibold text-slate-900">{leader.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {leader.role} • Rating {leader.avgRating}
                </p>
              </div>
            ))}
          </div>
        </WidgetCard>

        <WidgetCard
          title="Lowest Rated"
          subtitle="Profiles needing attention"
        >
          <div className="space-y-3">
            {(data?.lowestRated || []).map((leader) => (
              <div
                key={leader.leaderId}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <p className="font-semibold text-slate-900">{leader.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {leader.role} • Rating {leader.avgRating}
                </p>
              </div>
            ))}
          </div>
        </WidgetCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <WidgetCard
          title="District Complaint Heat"
          subtitle="Districts receiving the most complaint activity"
        >
          <div className="space-y-3">
            {(data?.topComplaintDistricts || []).map((item) => (
              <div
                key={item.district}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <p className="font-medium text-slate-900">{item.district}</p>
                <p className="text-sm font-semibold text-red-600">{item.count}</p>
              </div>
            ))}
          </div>
        </WidgetCard>

        <WidgetCard
          title="Activity Overview"
          subtitle="What is happening across the website right now"
        >
          <div className="grid grid-cols-2 gap-3">
            {(data?.recentActivity || []).map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
        </WidgetCard>
      </div>
    </div>
  );
}

export default AdminDashboard;