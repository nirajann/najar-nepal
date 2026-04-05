import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import NepalMap from "../components/NepalMap";
import { api } from "../services/api";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { DistrictInfo } from "../types/home";

const SelectedDistrictPanel = lazy(
  () => import("../components/home/SelectedDistrictPanel")
);
const DistrictDetailsSection = lazy(
  () => import("../components/home/DistrictDetailsSection")
);

function SidePanelSkeleton() {
  return (
    <div className="rounded-[18px] bg-white p-4 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-8 w-40 rounded bg-slate-200" />
        <div className="h-10 rounded-2xl bg-slate-200" />
        <div className="h-10 rounded-2xl bg-slate-200" />
        <div className="h-24 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

function LowerSectionSkeleton() {
  return (
    <div className="rounded-[18px] bg-white p-4 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-16 rounded-2xl bg-slate-200" />
          <div className="h-16 rounded-2xl bg-slate-200" />
          <div className="h-16 rounded-2xl bg-slate-200" />
          <div className="h-16 rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function Home() {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictInfo | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>("ALL");
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(searchText, 220);

  const [districtScores, setDistrictScores] = useState<Record<string, number>>({});
  const [districts, setDistricts] = useState<DistrictInfo[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);

  useEffect(() => {
    const loadDistricts = async () => {
      try {
        setLoadingDistricts(true);

        const cacheKey = "najar_home_districts_cache_v2";
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          const parsed = JSON.parse(cached) as DistrictInfo[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDistricts(parsed);
            setLoadingDistricts(false);
            return;
          }
        }

        const res = await api.getDistricts();
        const items = Array.isArray(res) ? res : res?.districts || [];
        const normalized = items.map((district: DistrictInfo) => ({
          ...district,
          localLevels: Array.isArray(district.localLevels) ? district.localLevels : [],
          mpLeader: district.mpLeader || null,
          ministerLeader: district.ministerLeader || null,
          naLeaders: Array.isArray(district.naLeaders) ? district.naLeaders : [],
          satisfactionScore:
            typeof district.satisfactionScore === "number"
              ? district.satisfactionScore
              : 50,
        }));

        setDistricts(normalized);
        sessionStorage.setItem(cacheKey, JSON.stringify(normalized));
      } catch (error) {
        console.error("Failed to load districts:", error);
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };

    loadDistricts();
  }, []);

  useEffect(() => {
    if (!selectedDistrict) return;

    const freshMatch = districts.find(
      (district) => district.districtId === selectedDistrict.districtId
    );

    if (freshMatch) {
      setSelectedDistrict(freshMatch);
    }
  }, [districts]);

  const provinceButtons = useMemo(() => {
    const seen = new Set<string>();

    return districts
      .map((district) => district.province)
      .filter((province) => {
        if (!province || seen.has(province)) return false;
        seen.add(province);
        return true;
      })
      .map((province, index) => ({
        id: index + 1,
        rawName: province,
        name: province.replace(" PROVINCE", "").trim(),
      }));
  }, [districts]);

  useEffect(() => {
    const loaded: Record<string, number> = {};

    districts.forEach((district) => {
      const saved = localStorage.getItem(`district-satisfaction-${district.name}`);
      if (saved) {
        loaded[district.name.toUpperCase()] = Number(saved);
      }
    });

    setDistrictScores(loaded);
  }, [districts]);

  const filteredDistrictsCount = useMemo(() => {
    return districts.filter((district) => {
      const matchProvince =
        selectedProvince === "ALL" || district.province === selectedProvince;

      const q = debouncedSearchText.trim().toLowerCase();
      const matchSearch =
        !q ||
        district.name.toLowerCase().includes(q) ||
        district.province.toLowerCase().includes(q);

      return matchProvince && matchSearch;
    }).length;
  }, [districts, selectedProvince, debouncedSearchText]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-[1480px] px-3 py-3 md:px-5 md:py-4">
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.9fr)_320px]">
          <div className="min-w-0">
            <NepalMap
              districts={districts}
              districtLoading={loadingDistricts}
              setSelectedDistrict={setSelectedDistrict}
              selectedDistrict={selectedDistrict}
              selectedProvince={selectedProvince}
              searchText={searchText}
              setSearchText={setSearchText}
              provinceButtons={provinceButtons}
              setSelectedProvince={setSelectedProvince}
              districtScores={districtScores}
              totalDistricts={loadingDistricts ? "..." : filteredDistrictsCount}
              onReset={() => {
                setSearchText("");
                setSelectedProvince("ALL");
                setSelectedDistrict(null);
              }}
            />
          </div>

          <Suspense fallback={<SidePanelSkeleton />}>
            <SelectedDistrictPanel district={selectedDistrict} />
          </Suspense>
        </section>

        <section className="mt-4">
          <Suspense fallback={<LowerSectionSkeleton />}>
            <DistrictDetailsSection district={selectedDistrict} />
          </Suspense>
        </section>
      </main>
    </div>
  );
}

export default Home;