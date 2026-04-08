import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DistrictInfo } from "../../types/home";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../services/api";

type Props = {
  district: DistrictInfo | null;
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

function CompactSignalBar({
  label,
  value,
  helper,
}: {
  label: string;
  value?: number | null;
  helper?: string;
}) {
  const tone = getScoreTone(value);
  const width = typeof value === "number" ? `${Math.max(6, Math.min(value, 100))}%` : "18%";

  return (
    <div className="rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone.chip}`}>
          {typeof value === "number" ? value : "--"}
        </span>
      </div>
      <div className={`mt-3 h-2.5 overflow-hidden rounded-full ${tone.track}`}>
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width }} />
      </div>
      {helper ? <p className="mt-2 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function LeaderMiniCard({
  label,
  leader,
  onClick,
  viewText,
  emptyText,
}: {
  label: string;
  leader?: LeaderCardRef;
  onClick?: () => void;
  viewText: string;
  emptyText: string;
}) {
  const clickable = Boolean(leader?.leaderId && onClick);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>

      {leader?.name ? (
        <button
          type="button"
          onClick={onClick}
          disabled={!clickable}
          className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left transition ${
            clickable ? "hover:bg-white" : ""
          }`}
        >
          {leader.photo ? (
            <img
              src={leader.photo}
              alt={leader.name}
              className="h-14 w-14 rounded-2xl border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-sm font-bold text-slate-600">
              {leader.name.charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-semibold ${
                clickable ? "text-blue-700" : "text-slate-900"
              }`}
            >
              {leader.name}
            </p>

            <p className="truncate text-xs text-slate-500">
              {leader.localLevel || leader.role || ""}
            </p>

            {leader.party ? (
              <p className="truncate text-xs text-slate-400">{leader.party}</p>
            ) : null}
          </div>

          {clickable ? (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              {viewText}
            </span>
          ) : null}
        </button>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm leading-6 text-slate-500">
          {emptyText}
        </div>
      )}
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

function SelectedDistrictPanel({ district }: Props) {
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
    ? [district.mpLeader, district.mayorLeader, district.ministerLeader].filter(
        (leader) => leader?.leaderId
      ).length
    : 0;
  const publicScoreTone = getScoreTone(district?.satisfactionScore);

  return (
    <section className="rounded-[28px] border border-blue-100/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition duration-300 md:p-5">
      {!district ? (
        <div className="space-y-4">
          <div className="rounded-[28px] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-5">
            <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              {text.explorer}
            </div>

            <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-950">
              {text.selectDistrict}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">{text.emptyText}</p>

            <div className="mt-5 grid gap-2.5">
              {[text.emptyStep1, text.emptyStep2, text.emptyStep3, text.emptyStep4].map(
                (item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-[11px] font-bold text-white">
                      {index + 1}
                    </div>
                    <p className="text-sm font-medium text-slate-700">{item}</p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-blue-100 bg-blue-50/40 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">{text.nationalContext}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {text.nationalHelper}
                </p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {text.nationalSnapshot}
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
                  Nepal
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {text.pmLabel}
                </p>

                {pmLeader ? (
                  <div className="mt-3 flex items-center gap-3">
                    {pmLeader.photo ? (
                      <img
                        src={pmLeader.photo}
                        alt={pmLeader.name}
                        className="h-14 w-14 rounded-2xl border border-blue-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-700">
                        {pmLeader.name?.charAt(0) || "P"}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {pmLeader.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">{pmLeader.role}</p>
                      {pmLeader.party ? (
                        <p className="truncate text-xs text-slate-400">{pmLeader.party}</p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">{text.noPrimeMinister}</p>
                )}
              </div>

              <div className="grid gap-3">
                <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {text.totalDistricts}
                  </p>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                    77
                  </p>
                </div>

                <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {text.totalProfiles}
                  </p>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                    {leaderCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-[28px] bg-[linear-gradient(145deg,#0f172a_0%,#111827_60%,#1d4ed8_100%)] p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition duration-300">
            <p className="text-[11px] uppercase tracking-[0.16em] text-blue-100">
              {text.selectedDistrict}
            </p>
            <h2 className="mt-2 text-[28px] font-bold tracking-tight">{district.name}</h2>
            <p className="mt-1 text-sm text-slate-200">{district.province}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
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

            <div className="mt-4 rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
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
              <p className="mt-3 text-sm leading-6 text-slate-200">{text.summaryText}</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-blue-100 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {text.districtSnapshot}
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <SnapshotMetric label={text.selectedDistrict} value={district.name} tone="slate" />
              <SnapshotMetric label={text.provinceLabel} value={district.province || "-"} tone="blue" />
              <SnapshotMetric
                label={text.localLevels}
                value={
                  district.localLevels.length > 0
                    ? `${district.localLevels.length}`
                    : text.noLocalLevels
                }
                tone="blue"
              />
              <SnapshotMetric
                label={text.representatives}
                value={linkedRepresentativeCount}
                tone={linkedRepresentativeCount > 0 ? "blue" : "red"}
              />
            </div>

            <div className="mt-4 space-y-3">
              <CompactSignalBar
                label={text.publicScore}
                value={district.satisfactionScore}
                helper={text.districtSummary}
              />
              <CompactSignalBar
                label={text.representatives}
                value={Math.round((linkedRepresentativeCount / 3) * 100)}
                helper={text.linkedProfiles}
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-blue-100 bg-white p-4 shadow-sm transition duration-300">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {text.representatives}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{text.linkedProfiles}</p>
            </div>

            <div className="mt-4 space-y-3">
              <LeaderMiniCard
                label={text.mp}
                leader={district.mpLeader}
                viewText={text.view}
                emptyText={text.notLinked}
                onClick={
                  district.mpLeader?.leaderId
                    ? () => navigate(`/leader/${district.mpLeader?.leaderId}`)
                    : undefined
                }
              />

              <LeaderMiniCard
                label={text.mayor}
                leader={district.mayorLeader}
                viewText={text.view}
                emptyText={text.notLinked}
                onClick={
                  district.mayorLeader?.leaderId
                    ? () => navigate(`/leader/${district.mayorLeader?.leaderId}`)
                    : undefined
                }
              />

              <LeaderMiniCard
                label={text.minister}
                leader={district.ministerLeader}
                viewText={text.view}
                emptyText={text.notLinked}
                onClick={
                  district.ministerLeader?.leaderId
                    ? () => navigate(`/leader/${district.ministerLeader?.leaderId}`)
                    : undefined
                }
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f8ff_100%)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {text.publicSignals}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {typeof district.satisfactionScore === "number"
                ? `${text.districtSummary}: ${district.satisfactionScore}.`
                : text.noScore}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default SelectedDistrictPanel;
