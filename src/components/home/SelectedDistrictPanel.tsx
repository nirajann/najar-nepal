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

function SnapshotRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="text-right text-sm font-semibold text-slate-900">{value}</p>
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

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      {!district ? (
        <div className="space-y-4">
          <div className="rounded-[28px] bg-gradient-to-b from-slate-50 to-white p-5">
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
                    className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3"
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

          <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
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
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {text.pmLabel}
                </p>

                {pmLeader ? (
                  <div className="mt-3 flex items-center gap-3">
                    {pmLeader.photo ? (
                      <img
                        src={pmLeader.photo}
                        alt={pmLeader.name}
                        className="h-14 w-14 rounded-2xl border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-sm font-bold text-slate-600">
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
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {text.totalDistricts}
                  </p>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                    77
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
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
          <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 p-5 text-white shadow-sm">
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

            <p className="mt-4 text-sm leading-6 text-slate-200">{text.summaryText}</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {text.districtSnapshot}
            </p>

            <div className="mt-3 space-y-3">
              <SnapshotRow label={text.selectedDistrict} value={district.name} />
              <SnapshotRow label={text.provinceLabel} value={district.province || "-"} />
              <SnapshotRow
                label={text.localLevels}
                value={
                  district.localLevels.length > 0
                    ? `${district.localLevels.length}`
                    : text.noLocalLevels
                }
              />
              <SnapshotRow
                label={text.publicScore}
                value={
                  typeof district.satisfactionScore === "number"
                    ? `${district.satisfactionScore}`
                    : text.noScore
                }
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
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

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
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
