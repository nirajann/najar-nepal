import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import geoData from "../data/nepalGeo.json";
import type { DistrictInfo } from "../types/home";

type ProvinceButton = {
  id: number;
  name: string;
  rawName: string;
};

type Props = {
  districts: DistrictInfo[];
  districtLoading: boolean;
  setSelectedDistrict: React.Dispatch<React.SetStateAction<DistrictInfo | null>>;
  selectedDistrict: DistrictInfo | null;
  selectedProvince: string;
  searchText: string;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
  provinceButtons: ProvinceButton[];
  setSelectedProvince: React.Dispatch<React.SetStateAction<string>>;
  districtScores: Record<string, number>;
  totalDistricts: string | number;
  onReset: () => void;
};

type TooltipState = {
  visible: boolean;
  x: number;
  y: number;
  districtName: string;
  provinceName: string;
  municipalitiesCount: number;
};

function normalizeName(name: string) {
  return name
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/\(.*?\)/g, "")
    .replace(/DISTRICT/g, "")
    .trim();
}

function normalizeDistrictAlias(name: string) {
  return normalizeName(name)
    .replace("SINDHUPALCHOK", "SINDHUPALCHOWK")
    .replace("TANAHUN", "TANAHU")
    .replace("KAVRE", "KAVREPALANCHOK")
    .replace("NAWALPUR", "NAWALPARASI BARDAGHAT SUSTA EAST")
    .replace("EAST NAWALPARASI", "NAWALPARASI BARDAGHAT SUSTA EAST")
    .replace("NAWALPARASI EAST", "NAWALPARASI BARDAGHAT SUSTA EAST")
    .replace("WEST NAWALPARASI", "NAWALPARASI BARDAGHAT SUSTA WEST")
    .replace("NAWALPARASI WEST", "NAWALPARASI BARDAGHAT SUSTA WEST")
    .replace("WESTERN RUKUM", "RUKUM WEST")
    .replace("WEST RUKUM", "RUKUM WEST")
    .replace("EASTERN RUKUM", "RUKUM EAST")
    .replace("EAST RUKUM", "RUKUM EAST");
}

function getDistrictCandidates(rawName: string, districts: DistrictInfo[]) {
  const normalized = normalizeDistrictAlias(rawName);

  if (normalized === "RUKUM") {
    return districts.filter((district) => {
      const districtName = normalizeDistrictAlias(district.name);
      return districtName === "RUKUM EAST" || districtName === "RUKUM WEST";
    });
  }

  return districts.filter(
    (district) => normalizeDistrictAlias(district.name) === normalized
  );
}

function throttleRaf<T extends (...args: any[]) => void>(fn: T) {
  let ticking = false;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    lastArgs = args;
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(() => {
      if (lastArgs) fn(...lastArgs);
      ticking = false;
    });
  };
}

function NepalMap({
  districts,
  districtLoading,
  setSelectedDistrict,
  selectedDistrict,
  selectedProvince,
  searchText,
  setSearchText,
  provinceButtons,
  setSelectedProvince,
  districtScores,
  totalDistricts,
  onReset,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    districtName: "",
    provinceName: "",
    municipalitiesCount: 0,
  });

  const [mapHeight, setMapHeight] = useState(600);

  const districtLookup = useMemo(() => {
    const map = new Map<string, DistrictInfo>();

    districts.forEach((district) => {
      map.set(normalizeDistrictAlias(district.name), {
        ...district,
        localLevels: Array.isArray(district.localLevels) ? district.localLevels : [],
      });
    });

    return map;
  }, [districts]);

  useEffect(() => {
    const updateSize = () => {
      if (!wrapperRef.current) return;
      const width = wrapperRef.current.clientWidth;

      if (width < 640) setMapHeight(360);
      else if (width < 900) setMapHeight(430);
      else if (width < 1200) setMapHeight(520);
      else setMapHeight(600);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 1040;
    const height = 680;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const projection = d3.geoMercator();
    const path = d3.geoPath(projection);

    const featureCollection: any =
      (geoData as any).type === "FeatureCollection"
        ? geoData
        : { type: "FeatureCollection", features: (geoData as any).features || [] };

    const features = featureCollection.features || [];

    projection.fitExtent(
      [
        [18, 16],
        [width - 18, height - 18],
      ],
      featureCollection
    );

    svg
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("rx", 18)
      .attr("fill", "#eef4f8");

    const updateTooltip = throttleRaf((event: MouseEvent, feature: any) => {
      const rawName =
        feature.properties?.DISTRICT ||
        feature.properties?.district ||
        feature.properties?.name ||
        feature.properties?.NAME_2 ||
        "Unknown";

      const matches = getDistrictCandidates(rawName, districts);
      const matched = matches[0];

      setTooltip({
        visible: true,
        x: event.offsetX + 14,
        y: event.offsetY - 10,
        districtName: matched?.name || rawName,
        provinceName: matched?.province || "Unknown Province",
        municipalitiesCount: matched?.localLevels?.length || 0,
      });
    });

    svg
      .selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("d", path as any)
      .attr("fill", (feature: any) => {
        const rawName =
          feature.properties?.DISTRICT ||
          feature.properties?.district ||
          feature.properties?.name ||
          feature.properties?.NAME_2 ||
          "";

        const matches = getDistrictCandidates(rawName, districts);
        const matched = matches[0];

        const districtKey = (matched?.name || rawName).toUpperCase();
        const score = districtScores[districtKey];

        const normalizedDistrict = normalizeDistrictAlias(rawName);
        const searchMatch =
          searchText.trim() === "" ||
          normalizedDistrict.includes(normalizeDistrictAlias(searchText));

        const provinceMatch =
          selectedProvince === "ALL" || matched?.province === selectedProvince;

        const selectedMatch =
          !!selectedDistrict &&
          normalizeDistrictAlias(selectedDistrict.name) === normalizedDistrict;

        if (selectedMatch) return "#1d4ed8";
        if (!provinceMatch || !searchMatch) return "#dbeafe";
        if (score === undefined) return "#a8e3db";
        if (score >= 80) return "#22c55e";
        if (score >= 60) return "#84cc16";
        if (score >= 40) return "#facc15";
        if (score >= 20) return "#fb923c";
        return "#ef4444";
      })
      .attr("stroke", (feature: any) => {
        const rawName =
          feature.properties?.DISTRICT ||
          feature.properties?.district ||
          feature.properties?.name ||
          feature.properties?.NAME_2 ||
          "";
        const normalizedDistrict = normalizeDistrictAlias(rawName);

        return selectedDistrict &&
          normalizeDistrictAlias(selectedDistrict.name) === normalizedDistrict
          ? "#1e3a8a"
          : "#64748b";
      })
      .attr("stroke-width", (feature: any) => {
        const rawName =
          feature.properties?.DISTRICT ||
          feature.properties?.district ||
          feature.properties?.name ||
          feature.properties?.NAME_2 ||
          "";
        const normalizedDistrict = normalizeDistrictAlias(rawName);

        return selectedDistrict &&
          normalizeDistrictAlias(selectedDistrict.name) === normalizedDistrict
          ? 2.3
          : 0.85;
      })
      .style("cursor", "pointer")
      .on("mouseenter", function (event: MouseEvent, feature: any) {
        updateTooltip(event, feature);
      })
      .on("mousemove", function (event: MouseEvent, feature: any) {
        updateTooltip(event, feature);
      })
      .on("mouseleave", function () {
        setTooltip((prev) => ({ ...prev, visible: false }));
      })
      .on("click", function (_event: MouseEvent, feature: any) {
        const rawName =
          feature.properties?.DISTRICT ||
          feature.properties?.district ||
          feature.properties?.name ||
          feature.properties?.NAME_2 ||
          "";

        const matches = getDistrictCandidates(rawName, districts);

        if (matches.length === 1) {
          setSelectedDistrict(matches[0]);
        } else if (matches.length > 1) {
          setSelectedDistrict(matches[0]);
        } else {
          setSelectedDistrict({
            districtId: normalizeDistrictAlias(rawName).toLowerCase().replace(/\s+/g, "-"),
            name: rawName,
            province: "Unknown Province",
            localLevels: [],
            mpLeader: null,
            ministerLeader: null,
            mayorLeader: null,
            naLeaders: [],
            satisfactionScore: 0,
          } as DistrictInfo);
        }
      });

    svg
      .selectAll("text")
      .data(features)
      .enter()
      .append("text")
      .attr("x", (feature: any) => path.centroid(feature)[0])
      .attr("y", (feature: any) => path.centroid(feature)[1])
      .attr("text-anchor", "middle")
      .attr("font-size", mapHeight < 420 ? "6px" : "8px")
      .attr("font-weight", "700")
      .attr("fill", "#102033")
      .attr("paint-order", "stroke")
      .attr("stroke", "#f8fafc")
      .attr("stroke-width", 1.5)
      .style("pointer-events", "none")
      .text((feature: any) => {
        const rawName =
          feature.properties?.DISTRICT ||
          feature.properties?.district ||
          feature.properties?.name ||
          feature.properties?.NAME_2 ||
          "";

        const bounds = path.bounds(feature);
        const boxWidth = bounds[1][0] - bounds[0][0];
        const boxHeight = bounds[1][1] - bounds[0][1];

        return boxWidth > 42 && boxHeight > 16 && mapHeight >= 420 ? rawName : "";
      });
  }, [
    districts,
    districtLookup,
    searchText,
    selectedDistrict,
    selectedProvince,
    setSelectedDistrict,
    mapHeight,
    districtScores,
  ]);

  return (
    <section className="relative rounded-[18px] bg-white p-3 shadow-sm md:p-4" ref={wrapperRef}>
      <div className="mb-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-slate-950 md:text-[28px]">
              Nepal Leader Explorer
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Search a district or click the map to begin.
            </p>
          </div>

          <button
            onClick={onReset}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            Reset
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
            Districts: {totalDistricts}
          </span>

          {selectedDistrict && (
            <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">
              Selected: {selectedDistrict.name}
            </span>
          )}

          {districtLoading && (
            <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
              Loading...
            </span>
          )}
        </div>

        <input
          type="text"
          placeholder="Search district..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5"
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedProvince("ALL")}
            className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
              selectedProvince === "ALL"
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Provinces
          </button>

          {provinceButtons.map((province, index) => (
            <button
              key={province.id}
              onClick={() => setSelectedProvince(province.rawName)}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                selectedProvince === province.rawName
                  ? "bg-slate-950 text-white"
                  : index > 5
                  ? "hidden bg-slate-100 text-slate-700 hover:bg-slate-200 sm:inline-flex"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {province.name}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[18px] bg-slate-100">
        {districtLoading ? (
          <div className="h-[600px] animate-pulse bg-slate-200 md:h-[520px] xl:h-[600px]" />
        ) : (
          <svg ref={svgRef} className="w-full" style={{ height: `${mapHeight}px` }} />
        )}
      </div>

      {tooltip.visible && (
        <div
          className="pointer-events-none absolute z-20 max-w-xs rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="text-base font-bold">{tooltip.districtName}</p>
          <p className="text-slate-300">{tooltip.provinceName}</p>
          <p className="mt-1 text-slate-200">
            Local levels: {tooltip.municipalitiesCount}
          </p>
        </div>
      )}
    </section>
  );
}

export default NepalMap;