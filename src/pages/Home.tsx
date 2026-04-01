import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import NepalMap from "../components/NepalMap";
import LeaderCard from "../components/LeaderCard";
import Performance from "../components/Performance";
import Updates from "../components/Updates";
import districtJson from "../data/nepalDistricts.json";
import districtLeaderData, { nationalLeaders } from "../data/realNationalData";
import { flattenDistricts } from "../utils/flattenDistricts";
import heroLogo from "../assets/hero.png";

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

type ProvinceButton = {
  id: number;
  name: string;
  rawName: string;
};

function Home() {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictInfo | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>("ALL");
  const [searchText, setSearchText] = useState("");
  const [districtScores, setDistrictScores] = useState<Record<string, number>>({});

  const flatDistricts = useMemo(() => flattenDistricts(districtJson as any), []);

  const provinceButtons = useMemo<ProvinceButton[]>(() => {
    return (districtJson as any).provinceList.map((province: any) => ({
      id: province.id,
      name: province.name.replace(" PROVINCE", "").trim(),
      rawName: province.name,
    }));
  }, []);

  const filteredDistricts = useMemo(() => {
    return flatDistricts.filter((district) => {
      const matchProvince =
        selectedProvince === "ALL" || district.province === selectedProvince;

      const q = searchText.trim().toLowerCase();
      const matchSearch =
        !q ||
        district.name.toLowerCase().includes(q) ||
        district.province.toLowerCase().includes(q);

      return matchProvince && matchSearch;
    });
  }, [flatDistricts, selectedProvince, searchText]);

  useEffect(() => {
    const loaded: Record<string, number> = {};

    (districtJson as any).provinceList.forEach((province: any) => {
      province.districtList.forEach((district: any) => {
        const saved = localStorage.getItem(`district-satisfaction-${district.name}`);

        if (saved) {
          const satisfaction = Number(saved);
          const districtKey = district.name.toLowerCase();
          const info = districtLeaderData[districtKey];

          const ratingValue =
            info?.ratingMp ?? info?.ratingMinister ?? info?.ratingMayor ?? 0;

          const ratingPercent = Math.round((ratingValue / 5) * 100);
          const combined = Math.round((satisfaction + ratingPercent) / 2);

          loaded[district.name.toUpperCase()] = combined;
        }
      });
    });

    setDistrictScores(loaded);
  }, []);

  const handleSatisfactionChange = (
    districtName: string,
    satisfactionValue: number,
    ratingValue: number
  ) => {
    const combined = Math.round((satisfactionValue + ratingValue) / 2);

    setDistrictScores((prev) => ({
      ...prev,
      [districtName.toUpperCase()]: combined,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-2 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 md:p-7">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <img
                    src={heroLogo}
                    alt="Najar Nepal"
                    className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-2xl"
                  />

                  <div>
                    <h1 className="text-2xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                      Nepal Leader Explorer <span className="text-red-500">🇳🇵</span>
                    </h1>
                    <p className="text-slate-500 mt-2 text-base md:text-lg">
                      Explore MPs, ministers, and district-level public information
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 text-sm md:text-base">
                  Showing{" "}
                  <span className="font-bold text-slate-900">
                    {filteredDistricts.length}
                  </span>{" "}
                  districts
                </div>
              </div>

              <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm text-slate-500">National Leader</p>
                <h2 className="text-2xl font-bold text-blue-700">
                  {nationalLeaders.primeMinister.name}
                </h2>
                <p className="text-slate-700">
                  {nationalLeaders.primeMinister.position} •{" "}
                  {nationalLeaders.primeMinister.party}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 mb-5">
                <button
                  onClick={() => setSelectedProvince("ALL")}
                  className={`px-5 py-3 rounded-full font-semibold transition ${
                    selectedProvince === "ALL"
                      ? "bg-blue-600 text-white shadow"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  All Provinces
                </button>

                {provinceButtons.map((province) => (
                  <button
                    key={province.id}
                    onClick={() => setSelectedProvince(province.rawName)}
                    className={`px-5 py-3 rounded-full font-semibold transition ${
                      selectedProvince === province.rawName
                        ? "bg-blue-600 text-white shadow"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {province.name}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search district..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full mb-5 rounded-2xl border border-slate-300 px-5 py-4 text-base md:text-lg outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-6 overflow-hidden">
                <NepalMap
                  setSelectedDistrict={setSelectedDistrict}
                  selectedDistrict={selectedDistrict}
                  selectedProvince={selectedProvince}
                  searchText={searchText}
                  districtScores={districtScores}
                />
              </div>
            </section>

            <Updates district={selectedDistrict} />
          </div>

          <div className="space-y-6">
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              {!selectedDistrict ? (
                <p className="text-slate-500 text-lg">
                  Click a district on the map to see full details
                </p>
              ) : (
                <>
                  <p className="text-slate-500 text-lg mb-2">Selected District</p>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-blue-700 uppercase leading-tight">
                    {selectedDistrict.name}
                  </h2>

                  <p className="text-slate-700 mt-4 text-lg">
                    <span className="font-semibold">Province:</span>{" "}
                    {selectedDistrict.province}
                  </p>

                  <hr className="my-6 border-slate-200" />

                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    Municipalities / Local Levels
                  </h3>

                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                    {selectedDistrict.municipalities?.length > 0 ? (
                      selectedDistrict.municipalities.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                        >
                          {m.name}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500">
                        No municipality data available.
                      </p>
                    )}
                  </div>
                </>
              )}
            </section>

            <LeaderCard district={selectedDistrict} />

            <Performance
              district={selectedDistrict}
              onSatisfactionChange={handleSatisfactionChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;