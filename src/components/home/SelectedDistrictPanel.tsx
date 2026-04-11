import { useEffect, useState } from "react";
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
    };
  }

  if (score >= 71) {
    return {
      text: "text-blue-700",
      chip: "bg-blue-50 text-blue-700",
      bar: "bg-[linear-gradient(90deg,#2563eb_0%,#0f766e_100%)]",
      track: "bg-blue-100",
    };
  }

  if (score >= 41) {
    return {
      text: "text-amber-700",
      chip: "bg-amber-50 text-amber-700",
      bar: "bg-[linear-gradient(90deg,#f59e0b_0%,#f97316_100%)]",
      track: "bg-amber-100",
    };
  }

  return {
    text: "text-red-700",
    chip: "bg-red-50 text-red-700",
    bar: "bg-[linear-gradient(90deg,#ef4444_0%,#dc2626_100%)]",
    track: "bg-red-100",
  };
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
    <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>

      <button
        type="button"
        onClick={onClick}
        disabled={!clickable}
        className={`flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition ${
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

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-200">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
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
  const toneClass =
    tone === "red"
      ? "bg-red-50 text-red-700"
      : tone === "slate"
      ? "bg-slate-100 text-slate-700"
      : "bg-blue-50 text-blue-700";

  return (
    <div className="rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-xl font-extrabold tracking-tight ${toneClass.split(" ")[1]}`}>
        {value}
      </p>
    </div>
  );
}

function SelectedDistrictPanel({ district, embedded = false }: Props) {
  const navigate = useNavigate();
  const { section } = useLanguage();
  const text = section("selectedDistrictPanel");

  const [pmLeader, setPmLeader] = useState<any>(null);
  const [leaderCount, setLeaderCount] = useState<number>(0);

  useEffect(() => {
    const loadNationalContext = async () => {
      try {
        const leadersRes = await api.getLeaders();
        const leaderItems = Array.isArray(leadersRes) ? leadersRes : leadersRes?.leaders || [];

        setLeaderCount(leaderItems.length || 0);

        const primeMinister =
          leaderItems.find((item: any) => item.role === "Prime Minister") || null;

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
  const availableRepresentatives = district
    ? [
        { label: text.mayor, leader: district.mayorLeader },
        { label: text.mp, leader: district.mpLeader },
        { label: text.minister, leader: district.ministerLeader },
      ].filter((item) => item.leader?.leaderId)
    : [];
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
          <div className="rounded-[22px] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-4">
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
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
        <div className="space-y-2.5">
          <div className="rounded-[24px] bg-[linear-gradient(145deg,#0f172a_0%,#111827_60%,#1d4ed8_100%)] p-3.5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition duration-300">
            <p className="text-[11px] uppercase tracking-[0.16em] text-blue-100">
              {text.selectedDistrict}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">{district.name}</h2>
            <p className="mt-1 text-sm text-slate-200">{district.province}</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
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

            <div className="mt-2.5 rounded-2xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100">
                  {text.publicSignals}
                </p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${publicScoreTone.chip}`}>
                  {typeof district.satisfactionScore === "number"
                    ? district.satisfactionScore
                    : text.noScore}
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/15">
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

          {availableRepresentatives.length > 0 ? (
            <div className="rounded-[22px] border border-blue-100 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {text.linkedProfiles}
                </p>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  {linkedRepresentativeCount}
                </span>
              </div>

              <div className="mt-2.5 grid gap-2">
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
          ) : null}

          <a
            href="#district-insights"
            className="inline-flex items-center self-start rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            View district details
          </a>
        </div>
      )}
    </section>
  );
}

export default SelectedDistrictPanel;
