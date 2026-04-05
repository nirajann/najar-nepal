import type { DistrictInfo } from "../../types/home";

type Props = {
  district: DistrictInfo | null;
};

const defaultAlerts = [
  {
    id: 1,
    type: "Travel",
    title: "Travel disruption",
    message: "Check local road conditions or strikes before travel.",
  },
  {
    id: 2,
    type: "Service",
    title: "Public service notice",
    message: "Some offices may close during holidays or local events.",
  },
];

function PublicAlertsPanel({ district }: Props) {
  const alerts = district
    ? [
        {
          id: 1,
          type: "District",
          title: `${district.name} update`,
          message: `${district.province} • ${district.localLevels.length} local levels`,
        },
        {
          id: 2,
          type: "Travel",
          title: `Before you visit ${district.name}`,
          message: "Check road closures, transport disruption, and local notices.",
        },
      ]
    : defaultAlerts;

  return (
    <section className="rounded-[18px] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Public Alerts</h3>
          <p className="mt-0.5 text-sm text-slate-500">Useful updates for citizens</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-2xl bg-slate-50 px-3 py-3">
            <span
              className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                alert.type === "District"
                  ? "bg-blue-100 text-blue-700"
                  : alert.type === "Travel"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {alert.type}
            </span>

            <h4 className="mt-2 text-sm font-semibold text-slate-900">
              {alert.title}
            </h4>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {alert.message}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PublicAlertsPanel;