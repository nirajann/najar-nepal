import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DistrictInfo } from "../../types/home";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../services/api";

type Props = {
  district: DistrictInfo | null;
};

function LeaderMiniCard({
  label,
  leader,
  onClick,
  viewText,
  emptyText,
}: {
  label: string;
  leader?: {
    leaderId?: string;
    name?: string;
    role?: string;
    party?: string;
    photo?: string;
    localLevel?: string;
  } | null;
  onClick?: () => void;
  viewText: string;
  emptyText: string;
}) {
  const clickable = Boolean(leader?.leaderId && onClick);

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-400">
          {emptyText}
        </div>
      )}
    </div>
  );
}

function SelectedDistrictPanel({ district }: Props) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const text =
    language === "ne"
      ? {
          explorer: "जिल्ला अन्वेषण",
          selectDistrict: "जिल्ला चयन गर्नुहोस्",
          emptyText:
            "जिल्ला चयन गरेपछि यहाँ स्थानीय प्रतिनिधि, सार्वजनिक स्कोर र जिल्ला सारांश देखिन्छ।",
          emptyStep1: "नक्साबाट जिल्ला क्लिक गर्नुहोस्",
          emptyStep2: "स्थानीय प्रतिनिधि हेर्नुहोस्",
          emptyStep3: "सार्वजनिक स्कोर बुझ्नुहोस्",
          emptyStep4: "तल विस्तृत प्रतिक्रिया दिनुहोस्",
          nationalContext: "राष्ट्रिय सन्दर्भ",
          nationalHelper:
            "यो भाग जिल्लाको विकल्प होइन। यो केवल देशव्यापी सानो सन्दर्भ झलक हो।",
          pmLabel: "प्रधानमन्त्री",
          nationalSnapshot: "राष्ट्रिय झलक",
          totalDistricts: "जम्मा जिल्ला",
          totalProfiles: "नेता प्रोफाइल",
          selectedDistrict: "चयन गरिएको जिल्ला",
          localLevels: "स्थानीय तह",
          publicScore: "सार्वजनिक स्कोर",
          districtSummary: "जिल्ला सारांश",
          mp: "सांसद",
          mayor: "मेयर / अध्यक्ष",
          minister: "मन्त्री",
          notLinked: "अझै जडान गरिएको छैन",
          view: "हेर्नुहोस्",
          noPrimeMinister: "अहिलेसम्म राष्ट्रिय प्रोफाइल लोड भएको छैन",
        }
      : {
          explorer: "District explorer",
          selectDistrict: "Select a district",
          emptyText:
            "Choose any district on the map to see its local leaders, public score, and quick summary.",
          emptyStep1: "Pick a district from the map",
          emptyStep2: "Review the district summary here",
          emptyStep3: "Use the feedback section below",
          emptyStep4: "Explore linked leaders if available",
          nationalContext: "National context",
          nationalHelper:
            "This does not replace district data. It is only a small national snapshot.",
          pmLabel: "Prime Minister",
          nationalSnapshot: "National snapshot",
          totalDistricts: "Total districts",
          totalProfiles: "Leader profiles",
          selectedDistrict: "Selected district",
          localLevels: "Local levels",
          publicScore: "Public score",
          districtSummary: "District summary",
          mp: "Member of Parliament",
          mayor: "Mayor / Chairperson",
          minister: "Minister",
          notLinked: "Not linked yet",
          view: "View",
          noPrimeMinister: "No national profile loaded yet",
        };

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

    loadNationalContext();
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
        <div className="space-y-3.5">
          <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 p-5 text-white shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.16em] text-blue-100">
              {text.selectedDistrict}
            </p>
            <h2 className="mt-2 text-[28px] font-bold tracking-tight">{district.name}</h2>
            <p className="mt-1 text-sm text-slate-200">{district.province}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-200">
                  {text.localLevels}
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  {district.localLevels.length}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-200">
                  {text.publicScore}
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  {district.satisfactionScore ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {text.districtSummary}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {language === "ne"
                ? "जिल्लासँग सम्बन्धित प्रतिनिधि र सार्वजनिक स्कोर यहाँ देखिन्छ। विस्तृत जिल्ला प्रतिक्रिया तल दिइनेछ।"
                : "This panel shows linked representatives and the public score for the selected district. Detailed district feedback is shown below the map section."}
            </p>
          </div>

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
      )}
    </section>
  );
}

export default SelectedDistrictPanel;
