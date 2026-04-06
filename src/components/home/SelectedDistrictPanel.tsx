import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DistrictInfo } from "../../types/home";

type Props = {
  district: DistrictInfo | null;
};

function LeaderMiniCard({
  label,
  leader,
  onClick,
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
}) {
  const clickable = Boolean(leader?.leaderId && onClick);

  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      {leader?.name ? (
        <button
          type="button"
          onClick={onClick}
          disabled={!clickable}
          className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left transition ${
            clickable ? "hover:bg-white hover:shadow-sm" : ""
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
            <span className="text-xs font-semibold text-blue-600">View</span>
          ) : null}
        </button>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-400">
          Not linked yet
        </div>
      )}
    </div>
  );
}

function SelectedDistrictPanel({ district }: Props) {
  const navigate = useNavigate();
  const [value, setValue] = useState(50);
  const [savedValue, setSavedValue] = useState<number | null>(null);

  useEffect(() => {
    if (!district) {
      setSavedValue(null);
      setValue(50);
      return;
    }

    const saved = localStorage.getItem(`district-satisfaction-${district.name}`);
    if (saved) {
      const parsed = Number(saved);
      setSavedValue(parsed);
      setValue(parsed);
    } else {
      setSavedValue(null);
      setValue(district.satisfactionScore ?? 50);
    }
  }, [district]);

  const saveScore = () => {
    if (!district) return;
    localStorage.setItem(`district-satisfaction-${district.name}`, String(value));
    setSavedValue(value);
  };

  return (
    <section className="rounded-[18px] bg-white p-4 shadow-sm">
      {!district ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-950">Selected district</h2>
          <p className="text-sm leading-6 text-slate-500">
            Search a district or click the Nepal map to begin.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Selected district
            </p>
            <h2 className="mt-1 text-[24px] font-bold tracking-tight text-blue-700">
              {district.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{district.province}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">Local levels</span>
              <span className="text-sm font-semibold text-slate-900">
                {district.localLevels.length}
              </span>
            </div>
          </div>

          <LeaderMiniCard
            label="Member of Parliament"
            leader={district.mpLeader}
            onClick={
              district.mpLeader?.leaderId
                ? () => navigate(`/leader/${district.mpLeader?.leaderId}`)
                : undefined
            }
          />

          <LeaderMiniCard
            label="Mayor"
            leader={district.mayorLeader}
            onClick={
              district.mayorLeader?.leaderId
                ? () => navigate(`/leader/${district.mayorLeader?.leaderId}`)
                : undefined
            }
          />

          <LeaderMiniCard
            label="Minister"
            leader={district.ministerLeader}
            onClick={
              district.ministerLeader?.leaderId
                ? () => navigate(`/leader/${district.ministerLeader?.leaderId}`)
                : undefined
            }
          />

          <div className="rounded-2xl bg-slate-50 px-3 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-950">Citizen satisfaction</h3>
              <p className="text-lg font-bold text-green-600">
                {savedValue !== null ? savedValue : value}
              </p>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full accent-green-600"
            />

            <button
              onClick={saveScore}
              className="mt-3 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Save score
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default SelectedDistrictPanel;