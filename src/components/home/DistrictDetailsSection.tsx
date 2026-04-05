import { useMemo } from "react";
import type { DistrictInfo } from "../../types/home";

type Props = {
  district: DistrictInfo | null;
};

function DistrictDetailsSection({ district }: Props) {
  const alerts = useMemo(() => {
    if (!district) {
      return [
        "Search a district or click the map to view details.",
        "District leaders, local levels, and updates will appear here.",
      ];
    }

    return [
      `${district.province}`,
      district.mpLeader?.name ? `MP: ${district.mpLeader.name}` : "MP not linked yet",
      district.ministerLeader?.name
        ? `Minister: ${district.ministerLeader.name}`
        : "Minister not linked yet",
    ];
  }, [district]);

  return (
    <section className="rounded-[18px] bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Local levels</h3>

          {!district ? (
            <p className="mt-2 text-sm text-slate-500">
              No district selected yet.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {district.localLevels.slice(0, 12).map((level, index) => (
                <div
                  key={`${level.name}-${index}`}
                  className="rounded-2xl bg-slate-50 px-3 py-3"
                >
                  <p className="text-sm font-medium text-slate-900">{level.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {level.type || "Local level"}
                  </p>
                </div>
              ))}

              {district.localLevels.length > 12 && (
                <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
                  + {district.localLevels.length - 12} more
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-950">Quick updates</h3>

          <div className="mt-3 space-y-2">
            {alerts.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-700"
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