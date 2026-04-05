import { useEffect, useState } from "react";

type LocalLevel = {
  name: string;
  type?: string;
  wardCount?: number;
};

type LeaderRef = {
  _id?: string;
  leaderId: string;
  name: string;
  role: string;
};

type DistrictInfo = {
  _id?: string;
  districtId: string;
  name: string;
  province: string;
  localLevels: LocalLevel[];
  mpLeader?: LeaderRef | null;
  ministerLeader?: LeaderRef | null;
  naLeaders?: LeaderRef[];
  satisfactionScore?: number;
};

type Props = {
  district: DistrictInfo | null;
  onSatisfactionChange?: (districtName: string, satisfactionValue: number) => void;
};

function Performance({ district, onSatisfactionChange }: Props) {
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

  const handleSave = () => {
    if (!district) return;
    localStorage.setItem(`district-satisfaction-${district.name}`, String(value));
    setSavedValue(value);
    onSatisfactionChange?.(district.name, value);
  };

  return (
    <section className="rounded-[26px] border border-white/70 bg-white/75 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.07)] backdrop-blur-xl">
      <div className="mb-4">
        <h3 className="text-[28px] font-extrabold leading-none text-slate-950">
          Citizen Satisfaction
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Public feeling and district feedback score
        </p>
      </div>

      {!district ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-500">
          Select a district to set or view citizen satisfaction.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-2xl">
                🙂
              </div>
              <div>
                <p className="text-sm text-slate-500">Feedback Score</p>
                <p className="text-xs text-slate-400">View district details</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-3xl font-extrabold text-green-600">
                {savedValue !== null ? savedValue : value}
              </p>
              <p className="text-xs text-slate-500">/ 100</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">Adjust Satisfaction</p>
              <p className="text-lg font-bold text-slate-900">{value}%</p>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full accent-green-600"
            />

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Low</span>
              <span>Moderate</span>
              <span>High</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Save Score
          </button>
        </div>
      )}
    </section>
  );
}

export default Performance;