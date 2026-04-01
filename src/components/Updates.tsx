type Municipality = {
  id: number;
  name: string;
};

type DistrictInfo = {
  id: number;
  name: string;
  province: string;
  municipalities: Municipality[];
};

type Props = {
  district: DistrictInfo | null;
};

const defaultAlerts = [
  {
    id: 1,
    type: "Urgent",
    title: "Transport Disruption Alert",
    message: "Check for local banda, strike, or road blockage before travel.",
  },
  {
    id: 2,
    type: "Notice",
    title: "Public Service Advisory",
    message: "Some local offices may close during holidays, protests, or emergency situations.",
  },
  {
    id: 3,
    type: "Info",
    title: "District-Level Awareness",
    message: "Select a district to view leaders, local levels, and public accountability data.",
  },
];

function Updates({ district }: Props) {
  const districtAlerts = district
    ? [
        {
          id: 1,
          type: "District",
          title: `${district.name} Public Notice`,
          message: `Selected district: ${district.name}. Province: ${district.province}. Local levels: ${district.municipalities.length}.`,
        },
        {
          id: 2,
          type: "Travel",
          title: "Travel Before You Go",
          message: `Before traveling in ${district.name}, check for banda, strike, road closure, or transport disruption.`,
        },
        {
          id: 3,
          type: "Citizen",
          title: "Citizen Attention",
          message: `Use this district view to explore MPs, ministers, municipalities, and public ratings.`,
        },
      ]
    : defaultAlerts;

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Public Alerts</h3>
          <p className="text-slate-500 mt-1">
            Important citizen notices and awareness updates
          </p>
        </div>

        {district && (
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
            {district.name}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {districtAlerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  alert.type === "Urgent"
                    ? "bg-red-100 text-red-700"
                    : alert.type === "Notice"
                    ? "bg-yellow-100 text-yellow-700"
                    : alert.type === "District"
                    ? "bg-blue-100 text-blue-700"
                    : alert.type === "Travel"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {alert.type}
              </span>
            </div>

            <h4 className="text-lg font-bold text-slate-900">{alert.title}</h4>
            <p className="text-slate-600 mt-2 leading-7">{alert.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Updates;