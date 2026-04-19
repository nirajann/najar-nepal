import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DistrictInfo } from "../../types/home";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../services/api";

type Props = {
  district: DistrictInfo | null;
  embedded?: boolean;
};

type LeaderCardRef = {
  leaderId?: string;
  name?: string;
  role?: string;
  party?: string;
  photo?: string;
  localLevel?: string;
} | null | undefined;

function getScoreTone(score?: number | null) {
  if (typeof score !== "number") {
    return {
      text: "text-slate-700",
      chip: "bg-slate-100 text-slate-700",
      bar: "bg-slate-400",
      track: "bg-slate-200",
      soft: "bg-slate-50 border-slate-200",
    };
  }

  if (score >= 71) {
    return {
      text: "text-blue-700",
      chip: "bg-blue-50 text-blue-700",
      bar: "bg-[linear-gradient(90deg,#2563eb_0%,#0f766e_100%)]",
      track: "bg-blue-100",
      soft: "bg-blue-50/70 border-blue-100",
    };
  }

  if (score >= 41) {
    return {
      text: "text-amber-700",
      chip: "bg-amber-50 text-amber-700",
      bar: "bg-[linear-gradient(90deg,#f59e0b_0%,#f97316_100%)]",
      track: "bg-amber-100",
      soft: "bg-amber-50/70 border-amber-100",
    };
  }

  return {
    text: "text-red-700",
    chip: "bg-red-50 text-red-700",
    bar: "bg-[linear-gradient(90deg,#ef4444_0%,#dc2626_100%)]",
    track: "bg-red-100",
    soft: "bg-red-50/70 border-red-100",
  };
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tracking-tight text-white">{value}</p>
    </div>
  );
}

function SnapshotMetric({
  label,
  value,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  tone?: "blue" | "red" | "slate";
}) {
  const valueClass =
    tone === "red"
      ? "text-red-700"
      : tone === "slate"
      ? "text-slate-700"
      : "text-blue-700";

  const cardClass =
    tone === "red"
      ? "border-red-100 bg-red-50/70"
      : tone === "slate"
      ? "border-slate-200 bg-slate-50/80"
      : "border-blue-100 bg-blue-50/70";

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${cardClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-xl font-extrabold tracking-tight ${valueClass}`}>{value}</p>
    </div>
  );
}

function LeaderMiniCard({
  label,
  leader,
  onClick,
  viewText,
}: {
  label: string;
  leader?: LeaderCardRef;
  onClick?: () => void;
  viewText: string;
}) {
  const clickable = Boolean(leader?.leaderId && onClick);

  return (
    <div className="group rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-2.5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>

      <button
        type="button"
        onClick={onClick}
        disabled={!clickable}
        className={`flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition ${
          clickable ? "hover:bg-white" : ""
        }`}
      >
        {leader?.photo ? (
          <img
            src={leader.photo}
            alt={leader.name}
            className="h-11 w-11 rounded-xl border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-sm font-bold text-slate-600">
            {leader?.name?.charAt(0) || label.charAt(0)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-semibold ${
              clickable ? "text-blue-700" : "text-slate-900"
            }`}
          >
            {leader?.name}
          </p>
          <p className="truncate text-xs text-slate-500">
            {leader?.localLevel || leader?.role || ""}
          </p>
          {leader?.party ? (
            <p className="truncate text-xs text-slate-400">{leader.party}</p>
          ) : null}
        </div>

        {clickable ? (
          <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
            {viewText}
          </span>
        ) : null}
      </button>
    </div>
  );
}

function SelectedDistrictPanel({ district, embedded = false }: Props) {
  const navigate = useNavigate();
  const { section } = useLanguage();
  const text = section("selectedDistrictPanel");

  const [pmLeader, setPmLeader] = useState<LeaderCardRef>(null);
  const [leaderCount, setLeaderCount] = useState<number>(0);

  useEffect(() => {
    const loadNationalContext = async () => {
      try {
        const leadersRes = await api.getLeaders();
        const leaderItems = Array.isArray(leadersRes) ? leadersRes : leadersRes?.leaders || [];

        setLeaderCount(leaderItems.length || 0);

        const primeMinister =
          leaderItems.find(
            (item: LeaderCardRef) => item?.role === "Prime Minister"
          ) || null;

        setPmLeader(primeMinister);
      } catch (error) {
        console.error("Failed to load national context:", error);
        setPmLeader(null);
        setLeaderCount(0);
      }
    };

    void loadNationalContext();
  }, []);

  const linkedRepresentativeCount = district
    ? [district.mayorLeader, district.mpLeader, district.ministerLeader].filter(
        (leader) => leader?.leaderId
      ).length
    : 0;

  const availableRepresentatives = useMemo(
    () =>
      district
        ? [
            { label: text.mayor, leader: district.mayorLeader },
            { label: text.mp, leader: district.mpLeader },
            { label: text.minister, leader: district.ministerLeader },
          ].filter((item) => item.leader?.leaderId)
        : [],
    [district, text.mayor, text.mp, text.minister]
  );

  const publicScoreTone = getScoreTone(district?.satisfactionScore);

  return (
    <section
      className={`transition duration-300 ${
        embedded
          ? "rounded-[24px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-3 md:p-4"
          : "rounded-[28px] border border-blue-100/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] md:p-5"
      }`}
    >
      {!district ? (
        <div className="space-y-3">
          <div className="rounded-[22px] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 shadow-sm">
            <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              {text.explorer}
            </div>

            <h2 className="mt-3 text-lg font-bold tracking-tight text-slate-950 md:text-xl">
              {text.selectDistrict}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-700">
              {embedded ? "Tap a district to see leaders and public satisfaction." : text.emptyText}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <SnapshotMetric label={text.totalDistricts} value={77} tone="slate" />
              <SnapshotMetric label={text.totalProfiles} value={leaderCount} tone="blue" />
            </div>

            {pmLeader && !embedded ? (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {text.pmLabel}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  {pmLeader.photo ? (
                    <img
                      src={pmLeader.photo}
                      alt={pmLeader.name}
                      className="h-12 w-12 rounded-2xl border border-blue-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-700">
                      {pmLeader.name?.charAt(0) || "P"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {pmLeader.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">{pmLeader.role}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-[24px] border border-slate-900 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.16),transparent_25%),linear-gradient(155deg,#020617_0%,#0b1730_50%,#1d4ed8_100%)] p-4 text-white shadow-[0_20px_40px_rgba(15,23,42,0.22)]">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-blue-400/10 blur-3xl" />
            <div className="absolute left-0 bottom-0 h-24 w-24 rounded-full bg-red-300/10 blur-3xl" />

            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100">
                {text.selectedDistrict}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{district.name}</h2>
              <p className="mt-1 text-sm text-slate-200">{district.province}</p>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <SummaryStat label={text.localLevels} value={district.localLevels.length} />
                <SummaryStat
                  label={text.publicScore}
                  value={
                    typeof district.satisfactionScore === "number"
                      ? district.satisfactionScore
                      : text.noScore
                  }
                />
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100">
                    {text.publicSignals}
                  </p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${publicScoreTone.chip}`}>
                    {typeof district.satisfactionScore === "number"
                      ? district.satisfactionScore
                      : text.noScore}
                  </span>
                </div>

                <div className={`mt-3 h-2.5 overflow-hidden rounded-full ${publicScoreTone.track}`}>
                  <div
                    className={`h-full rounded-full ${publicScoreTone.bar}`}
                    style={{
                      width:
                        typeof district.satisfactionScore === "number"
                          ? `${Math.max(6, Math.min(district.satisfactionScore, 100))}%`
                          : "18%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {availableRepresentatives.length > 0 ? (
            <div className="rounded-[22px] border border-blue-100 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {text.linkedProfiles}
                </p>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  {linkedRepresentativeCount}
                </span>
              </div>

              <div className="mt-3 grid gap-2.5">
                {availableRepresentatives.map((item) => (
                  <LeaderMiniCard
                    key={`${item.label}-${item.leader?.leaderId}`}
                    label={item.label}
                    leader={item.leader}
                    viewText={text.view}
                    onClick={
                      item.leader?.leaderId
                        ? () => navigate(`/leader/${item.leader?.leaderId}`)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
              No linked representative profiles available yet.
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              const section = document.getElementById("district-insights");
              section?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            View district details
          </button>
        </div>
      )}
    </section>
  );
}

export default SelectedDistrictPanel;
