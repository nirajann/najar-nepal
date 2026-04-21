import { useMemo } from "react";
import type { DistrictInfo } from "../../types/home";
import { useLanguage } from "../../context/useLanguage";

type Props = {
  district: DistrictInfo | null;
};

function InfoPill({
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
      ? "border-red-100 bg-red-50 text-red-700"
      : tone === "slate"
      ? "border-slate-200 bg-slate-50 text-slate-700"
      : "border-blue-100 bg-blue-50 text-blue-700";

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}

function LocalLevelCard({
  name,
  type,
}: {
  name: string;
  type: string;
}) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-3 py-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <p className="line-clamp-2 text-sm font-semibold text-slate-950">{name}</p>
      <p className="mt-1 text-xs text-slate-500">{type}</p>
    </div>
  );
}

function QuickUpdateCard({
  text,
  tone = "default",
}: {
  text: string;
  tone?: "default" | "blue" | "red";
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-100 bg-blue-50/60"
      : tone === "red"
      ? "border-red-100 bg-red-50/60"
      : "border-slate-200 bg-white";

  return (
    <div
      className={`rounded-[16px] border px-3 py-3 text-sm text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}
    >
      {text}
    </div>
  );
}

function DistrictDetailsSection({ district }: Props) {
  const { language } = useLanguage();
  const text =
    language === "ne"
      ? {
          localLevels: "स्थानीय तह",
          quickUpdates: "छिटो अपडेट",
          noDistrict: "अहिलेसम्म जिल्ला छानिएको छैन।",
          emptyHint1: "जिल्ला खोज्नुहोस् वा नक्साबाट छनोट गर्नुहोस्।",
          emptyHint2: "यहाँ स्थानीय तह, प्रतिनिधि र छोटो अपडेट देखिनेछन्।",
          provinceStatus: "प्रदेश",
          mpMissing: "सांसद प्रोफाइल अझै जोडिएको छैन",
          ministerMissing: "मन्त्री प्रोफाइल अझै जोडिएको छैन",
          mayorMissing: "मेयर / अध्यक्ष प्रोफाइल अझै जोडिएको छैन",
          localLevelType: "स्थानीय तह",
          more: "थप",
          districtOverview: "जिल्ला सारांश",
          selectedDistrict: "चयन गरिएको जिल्ला",
          visibleLevels: "देखिएका तह",
          linkedLeaders: "जोडिएका प्रतिनिधि",
        }
      : {
          localLevels: "Local levels",
          quickUpdates: "Quick updates",
          noDistrict: "No district selected yet.",
          emptyHint1: "Search a district or click the map to view details.",
          emptyHint2: "Local levels, linked representatives, and quick updates will appear here.",
          provinceStatus: "Province",
          mpMissing: "MP profile not linked yet",
          ministerMissing: "Minister profile not linked yet",
          mayorMissing: "Mayor / Chairperson profile not linked yet",
          localLevelType: "Local level",
          more: "more",
          districtOverview: "District overview",
          selectedDistrict: "Selected district",
          visibleLevels: "Visible levels",
          linkedLeaders: "Linked leaders",
        };

  const mayorLabel = language === "ne" ? "मेयर / अध्यक्ष" : "Mayor / Chairperson";
  const mpLabel = language === "ne" ? "सांसद" : "MP";
  const ministerLabel = language === "ne" ? "मन्त्री" : "Minister";

  const districtMpLeader = district?.mpLeader || district?.mpLeaders?.[0] || null;
  const districtMinisterLeader =
    district?.ministerLeader || district?.ministerLeaders?.[0] || null;
  const districtMayorLeader = district?.mayorLeader || null;

  const linkedLeaderCount = district
    ? [districtMayorLeader, districtMpLeader, districtMinisterLeader].filter(
        (leader) => leader?.leaderId
      ).length
    : 0;

const alerts: { text: string; tone: "default" | "blue" | "red" }[] = useMemo(() => {
  if (!district) {
    return [
      { text: text.emptyHint1, tone: "blue" },
      { text: text.emptyHint2, tone: "default" },
    ];
  }

  return [
    { text: `${text.provinceStatus}: ${district.province}`, tone: "blue" },
    {
      text: districtMayorLeader?.name
        ? `${mayorLabel}: ${districtMayorLeader.name}`
        : text.mayorMissing,
      tone: districtMayorLeader?.name ? "default" : "red",
    },
    {
      text: districtMpLeader?.name
        ? `${mpLabel}: ${districtMpLeader.name}`
        : text.mpMissing,
      tone: districtMpLeader?.name ? "default" : "red",
    },
    {
      text: districtMinisterLeader?.name
        ? `${ministerLabel}: ${districtMinisterLeader.name}`
        : text.ministerMissing,
      tone: districtMinisterLeader?.name ? "default" : "red",
    },
  ];
}, [
  district,
  districtMayorLeader,
  districtMpLeader,
  districtMinisterLeader,
  mayorLabel,
  ministerLabel,
  mpLabel,
  text.emptyHint1,
  text.emptyHint2,
  text.mpMissing,
  text.mayorMissing,
  text.ministerMissing,
  text.provinceStatus,
]);
  if (!district) {
    return (
      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="rounded-[22px] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-sm">
          <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            {text.districtOverview}
          </div>

          <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-950">
            {text.noDistrict}
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">{text.emptyHint1}</p>
          <p className="mt-1 text-sm leading-7 text-slate-600">{text.emptyHint2}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                {text.districtOverview}
              </div>
              <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">
                {district.name}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{district.province}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 md:min-w-[360px]">
              <InfoPill label={text.selectedDistrict} value={district.name} tone="slate" />
              <InfoPill
                label={text.visibleLevels}
                value={district.localLevels.length}
                tone="blue"
              />
              <InfoPill
                label={text.linkedLeaders}
                value={linkedLeaderCount}
                tone={linkedLeaderCount > 0 ? "blue" : "red"}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                {text.localLevels}
              </h3>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {district.localLevels.length}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {district.localLevels.slice(0, 12).map((level, index) => (
                <LocalLevelCard
                  key={`${level.name}-${index}`}
                  name={level.name}
                  type={level.type || text.localLevelType}
                />
              ))}

              {district.localLevels.length > 12 && (
                <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm font-medium text-slate-600 shadow-sm">
                  + {district.localLevels.length - 12} {text.more}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 rounded-[24px] border border-slate-900 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] p-4 text-white shadow-[0_18px_36px_rgba(15,23,42,0.12)] md:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
                {text.quickUpdates}
              </h3>
              <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-blue-200">
                {text.districtOverview}
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
             {alerts.map((item, index) => (
  <QuickUpdateCard
    key={index}
    text={item.text}
    tone={item.tone as "default" | "blue" | "red"}
  />
))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DistrictDetailsSection;
