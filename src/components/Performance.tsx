import { useEffect, useState } from "react";
import districtLeaderData from "../data/realNationalData";

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
  onSatisfactionChange?: (
    districtName: string,
    satisfactionValue: number,
    ratingValue: number
  ) => void;
};

function Performance({ district, onSatisfactionChange }: Props) {
  const [value, setValue] = useState(50);
  const [savedValue, setSavedValue] = useState<number | null>(null);

  const districtKey = district?.name.toLowerCase() || "";
  const info = district ? districtLeaderData[districtKey] : null;

  const ratingValue =
    info?.ratingMp ?? info?.ratingMinister ?? info?.ratingMayor ?? 0;

  const ratingPercent = Math.round((ratingValue / 5) * 100);

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
      setValue(50);
    }
  }, [district]);

  const handleSave = () => {
    if (!district) return;

    localStorage.setItem(`district-satisfaction-${district.name}`, String(value));
    setSavedValue(value);

    if (onSatisfactionChange) {
      onSatisfactionChange(district.name, value, ratingPercent);
    }
  };

  const getLabel = (score: number) => {
    if (score >= 80) return "Very High";
    if (score >= 60) return "High";
    if (score >= 40) return "Moderate";
    if (score >= 20) return "Low";
    return "Very Low";
  };

  const getColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-emerald-600";
    if (score >= 40) return "text-yellow-600";
    if (score >= 20) return "text-orange-600";
    return "text-red-600";
  };

  const combinedScore =
    savedValue !== null ? Math.round((savedValue + ratingPercent) / 2) : null;

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <div className="mb-5">
        <h3 className="text-2xl font-bold text-slate-900">Citizen Satisfaction</h3>
        <p className="text-slate-500 mt-1">
          Public feeling and district leader rating combined
        </p>
      </div>

      {!district ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 text-slate-500">
          Select a district to set or view citizen satisfaction.
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Selected District</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{district.name}</p>
            <p className="text-sm text-slate-500 mt-1">{district.province}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <p className="text-sm text-slate-500">Leader Rating</p>
    <p className="text-2xl font-bold text-slate-900 mt-2">
      {ratingValue}/5
    </p>
    <p className="text-sm text-slate-500 mt-1">{ratingPercent}%</p>
  </div>

  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <p className="text-sm text-slate-500">Combined District Score</p>
    <p className="text-2xl font-bold text-slate-900 mt-2">
      {savedValue !== null ? `${Math.round((savedValue + ratingPercent) / 2)}%` : "Not saved"}
    </p>
  </div>


            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Combined District Score</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {combinedScore !== null ? `${combinedScore}%` : "Not saved"}
              </p>
              <p
                className={`text-sm mt-1 ${
                  combinedScore !== null ? getColor(combinedScore) : "text-slate-500"
                }`}
              >
                {combinedScore !== null ? getLabel(combinedScore) : "Waiting for citizen input"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm text-slate-500">Citizen Satisfaction</p>
              <p className={`text-lg font-bold ${getColor(value)}`}>{value}%</p>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full accent-blue-600"
            />

            <div className="flex items-center justify-between mt-3 text-sm">
              <span className="text-slate-500">Low</span>
              <span className={`font-semibold ${getColor(value)}`}>
                {getLabel(value)}
              </span>
              <span className="text-slate-500">High</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full rounded-2xl bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 transition"
          >
            Save Satisfaction
          </button>
        </div>
      )}
    </section>
  );
}

export default Performance;