import { useMemo } from "react";
import type { DistrictInfo } from "../../types/home";
import { useLanguage } from "../../context/LanguageContext";

type Props = {
  district: DistrictInfo | null;
};

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
        };
  const mayorLabel = language === "ne" ? "मेयर / अध्यक्ष" : "Mayor / Chairperson";
  const mpLabel = language === "ne" ? "सांसद" : "MP";
  const ministerLabel = language === "ne" ? "मन्त्री" : "Minister";

  const alerts = useMemo(() => {
    if (!district) {
      return [text.emptyHint1, text.emptyHint2];
    }

    return [
      `${text.provinceStatus}: ${district.province}`,
      district.mayorLeader?.name
        ? `${mayorLabel}: ${district.mayorLeader.name}`
        : text.mayorMissing,
      district.mpLeader?.name ? `${mpLabel}: ${district.mpLeader.name}` : text.mpMissing,
      district.ministerLeader?.name
        ? `${ministerLabel}: ${district.ministerLeader.name}`
        : text.ministerMissing,
    ];
  }, [district, mayorLabel, ministerLabel, mpLabel, text.emptyHint1, text.emptyHint2, text.mpMissing, text.mayorMissing, text.ministerMissing, text.provinceStatus]);

  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-950">{text.localLevels}</h3>
            {district ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {district.localLevels.length}
              </span>
            ) : null}
          </div>

          {!district ? (
            <p className="mt-2 text-sm text-slate-500">
              {text.noDistrict}
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {district.localLevels.slice(0, 12).map((level, index) => (
                <div
                  key={`${level.name}-${index}`}
                  className="rounded-[18px] border border-slate-200 bg-slate-50/80 px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-slate-900">{level.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {level.type || text.localLevelType}
                  </p>
                </div>
              ))}

              {district.localLevels.length > 12 && (
                <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-500">
                  + {district.localLevels.length - 12} {text.more}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 rounded-[20px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-950">{text.quickUpdates}</h3>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              {text.districtOverview}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {alerts.map((item, index) => (
              <div
                key={index}
                className="rounded-[16px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default DistrictDetailsSection;
