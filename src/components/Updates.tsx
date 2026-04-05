type LocalLevel = {
  name: string;
  type?: string;
  wardCount?: number;
};

type DistrictInfo = {
  _id?: string;
  districtId: string;
  name: string;
  province: string;
  localLevels: LocalLevel[];
};

type Props = {
  district: DistrictInfo | null;
};

const defaultAlerts = [
  {
    id: 1,
    type: "Urgent",
    title: "Transport Disruption",
    message: "Check local strike or road blockage",
  },
  {
    id: 2,
    type: "Notice",
    title: "Public Service Advisory",
    message: "Office closures during holidays",
  },
  {
    id: 3,
    type: "Info",
    title: "Important district-level updates",
    message: "Check accountability reports and data",
  },
];

function Updates({ district }: Props) {
  const districtAlerts = district
    ? [
        {
          id: 1,
          type: "District",
          title: `${district.name} Public Notice`,
          message: `Province: ${district.province} • Local levels: ${district.localLevels.length}`,
        },
        {
          id: 2,
          type: "Notice",
          title: "Travel Before You Go",
          message: `Check road closure or disruption in ${district.name}`,
        },
        {
          id: 3,
          type: "Info",
          title: "Important district-level updates",
          message: "Check accountability reports and data",
        },
      ]
    : defaultAlerts;

  return (
    <section className="rounded-[26px] border border-white/70 bg-white/75 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.07)] backdrop-blur-xl">
      <div className="mb-4">
        <h3 className="text-[28px] font-extrabold leading-none text-slate-950">
          Public Alerts
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Important citizen notices and awareness updates
        </p>
      </div>

      <div className="space-y-3">
        {districtAlerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="min-w-0">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  alert.type === "Urgent"
                    ? "bg-red-100 text-red-700"
                    : alert.type === "Notice"
                    ? "bg-yellow-100 text-yellow-700"
                    : alert.type === "District"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {alert.type}
              </span>

              <h4 className="mt-3 text-lg font-bold text-slate-900">{alert.title}</h4>
              <p className="mt-1 text-sm text-slate-500">{alert.message}</p>
            </div>

            <span className="pt-1 text-slate-400">›</span>
          </div>
        ))}
      </div>

      <button className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
        View All Alerts
      </button>
    </section>
  );
}

export default Updates;