type LeaderItem = {
  id: string;
  name: string;
  role: string;
  district?: string;
  score: number;
  photo?: string;
};

type Props = {
  leaders: LeaderItem[];
};

function LeaderListWidget({ leaders }: Props) {
  return (
    <div className="space-y-3">
      {leaders.length === 0 ? (
        <p className="text-sm text-slate-500">No leader activity found.</p>
      ) : (
        leaders.map((leader, index) => (
          <div
            key={leader.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                {index + 1}
              </div>

              {leader.photo ? (
                <img
                  src={leader.photo}
                  alt={leader.name}
                  className="h-11 w-11 rounded-2xl object-cover"
                />
              ) : (
                <div className="h-11 w-11 rounded-2xl bg-slate-200" />
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {leader.name}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {leader.role}
                  {leader.district ? ` • ${leader.district}` : ""}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-blue-700">{leader.score}</p>
              <p className="text-xs text-slate-500">engagement</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default LeaderListWidget;