import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import geoData from "../data/nepalGeo.json";
import districtJson from "../data/nepalDistricts.json";

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
  setSelectedDistrict: React.Dispatch<React.SetStateAction<DistrictInfo | null>>;
  selectedDistrict: DistrictInfo | null;
  selectedProvince: string;
  searchText: string;
  districtScores: Record<string, number>;
};

type ProvinceJsonItem = {
  id: number;
  name: string;
  districtList: {
    id: number;
    name: string;
    municipalityList: Municipality[];
  }[];
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

function NepalMap({
  setSelectedDistrict,
  selectedDistrict,
  selectedProvince,
  searchText,
  districtScores,
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

  const [mapHeight, setMapHeight] = useState(620);

  const provinceList = districtJson.provinceList as ProvinceJsonItem[];

  const districtLookup = useMemo(() => {
    const map = new Map<string, DistrictInfo>();

    provinceList.forEach((province) => {
      province.districtList.forEach((district) => {
        map.set(normalizeName(district.name), {
          id: district.id,
          name: district.name,
          province: province.name,
          municipalities: district.municipalityList || [],
        });
      });
    });

    return map;
  }, [provinceList]);

  useEffect(() => {
    const updateSize = () => {
      if (!wrapperRef.current) return;
      const width = wrapperRef.current.clientWidth;

      if (width < 640) setMapHeight(360);
      else if (width < 900) setMapHeight(460);
      else setMapHeight(620);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 920;
    const height = 620;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg
      .append("defs")
      .html(`
        <filter id="mapShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.18"/>
        </filter>

        <filter id="selectedGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#2563eb" flood-opacity="0.45"/>
        </filter>

        <linearGradient id="mapBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="100%" stop-color="#e2e8f0" />
        </linearGradient>
      `);

    const rootGroup = svg.append("g");

    const projection = d3.geoMercator();
    const path = d3.geoPath(projection);

    const featureCollection: any =
      (geoData as any).type === "FeatureCollection"
        ? geoData
        : {
            type: "FeatureCollection",
            features: (geoData as any).features || [],
          };

    const features = featureCollection.features || [];

    projection.fitSize([width - 34, height - 34], featureCollection);

    rootGroup
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("rx", 28)
      .attr("fill", "url(#mapBg)");

    const districtsGroup = rootGroup
      .append("g")
      .attr("transform", "translate(12,12)")
      .attr("filter", "url(#mapShadow)");

    districtsGroup
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

        const normalizedDistrict = normalizeName(rawName);
        const matched = districtLookup.get(normalizedDistrict);

        const districtKey = (matched?.name || rawName).toUpperCase();
        const score = districtScores[districtKey];

        const searchMatch =
          searchText.trim() === "" ||
          normalizedDistrict.includes(normalizeName(searchText));

        const provinceMatch =
          selectedProvince === "ALL" || matched?.province === selectedProvince;

        const selectedMatch =
          selectedDistrict &&
          normalizeName(selectedDistrict.name) === normalizedDistrict;

        if (selectedMatch) return "#2563eb";
        if (!provinceMatch || !searchMatch) return "#dbeafe";

        if (score === undefined) return "#97d9d0";
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

        const normalizedDistrict = normalizeName(rawName);

        if (
          selectedDistrict &&
          normalizeName(selectedDistrict.name) === normalizedDistrict
        ) {
          return "#1d4ed8";
        }

        return "#475569";
      })
      .attr("stroke-width", (feature: any) => {
        const rawName =
          feature.properties?.DISTRICT ||
          feature.properties?.district ||
          feature.properties?.name ||
          feature.properties?.NAME_2 ||
          "";

        const normalizedDistrict = normalizeName(rawName);

        if (
          selectedDistrict &&
          normalizeName(selectedDistrict.name) === normalizedDistrict
        ) {
          return 2.4;
        }

        return 1;
      })
      .attr("filter", (feature: any) => {
        const rawName =
          feature.properties?.DISTRICT ||
          feature.properties?.district ||
          feature.properties?.name ||
          feature.properties?.NAME_2 ||
          "";

        const normalizedDistrict = normalizeName(rawName);

        if (
          selectedDistrict &&
          normalizeName(selectedDistrict.name) === normalizedDistrict
        ) {
          return "url(#selectedGlow)";
        }

        return null;
      })
      .style("cursor", "pointer")
      .on("mouseenter", function (event: MouseEvent, feature: any) {
        const rawName =
          feature.properties?.DISTRICT ||
          feature.properties?.district ||
          feature.properties?.name ||
          feature.properties?.NAME_2 ||
          "Unknown";

        const normalizedDistrict = normalizeName(rawName);
        const matched = districtLookup.get(normalizedDistrict);

        const isSelected =
          selectedDistrict &&
          normalizeName(selectedDistrict.name) === normalizedDistrict;

        if (!isSelected) {
          d3.select(this)
            .transition()
            .duration(120)
            .attr("fill", "#60a5fa")
            .attr("stroke-width", 2);
        }

        setTooltip({
          visible: true,
          x: event.offsetX + 14,
          y: event.offsetY - 10,
          districtName: matched?.name || rawName,
          provinceName: matched?.province || "Unknown Province",
          municipalitiesCount: matched?.municipalities?.length || 0,
        });
      })
      .on("mousemove", function (event: MouseEvent) {
        setTooltip((prev) => ({
          ...prev,
          x: event.offsetX + 14,
          y: event.offsetY - 10,
        }));
      })
      .on("mouseleave", function (_event: MouseEvent, feature: any) {
        const rawName =
          feature.properties?.DISTRICT ||
          feature.properties?.district ||
          feature.properties?.name ||
          feature.properties?.NAME_2 ||
          "";

        const normalizedDistrict = normalizeName(rawName);
        const matched = districtLookup.get(normalizedDistrict);
        const districtKey = (matched?.name || rawName).toUpperCase();
        const score = districtScores[districtKey];

        const searchMatch =
          searchText.trim() === "" ||
          normalizedDistrict.includes(normalizeName(searchText));

        const provinceMatch =
          selectedProvince === "ALL" || matched?.province === selectedProvince;

        const selectedMatch =
          selectedDistrict &&
          normalizeName(selectedDistrict.name) === normalizedDistrict;

        let fillColor = "#dbeafe";

        if (selectedMatch) {
          fillColor = "#2563eb";
        } else if (provinceMatch && searchMatch) {
          if (score === undefined) fillColor = "#97d9d0";
          else if (score >= 80) fillColor = "#22c55e";
          else if (score >= 60) fillColor = "#84cc16";
          else if (score >= 40) fillColor = "#facc15";
          else if (score >= 20) fillColor = "#fb923c";
          else fillColor = "#ef4444";
        }

        d3.select(this)
          .transition()
          .duration(120)
          .attr("fill", fillColor)
          .attr("stroke-width", selectedMatch ? 2.4 : 1);

        setTooltip((prev) => ({
          ...prev,
          visible: false,
        }));
      })
      .on("click", function (_event: MouseEvent, feature: any) {
        const rawName =
          feature.properties?.DISTRICT ||
          feature.properties?.district ||
          feature.properties?.name ||
          feature.properties?.NAME_2 ||
          "";

        const normalizedDistrict = normalizeName(rawName);
        const matched = districtLookup.get(normalizedDistrict);

        if (matched) {
          setSelectedDistrict(matched);
        } else {
          setSelectedDistrict({
            id: 0,
            name: rawName,
            province: "Unknown Province",
            municipalities: [],
          });
        }
      });

    districtsGroup
      .selectAll("text")
      .data(features)
      .enter()
      .append("text")
      .attr("x", (feature: any) => path.centroid(feature)[0])
      .attr("y", (feature: any) => path.centroid(feature)[1])
      .attr("text-anchor", "middle")
      .attr("font-size", mapHeight < 400 ? "7px" : "9px")
      .attr("font-weight", "800")
      .attr("fill", "#0f172a")
      .attr("paint-order", "stroke")
      .attr("stroke", "#f8fafc")
      .attr("stroke-width", 2)
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

        if (boxWidth > 42 && boxHeight > 16 && mapHeight >= 400) {
          return rawName;
        }

        return "";
      });
  }, [
    districtLookup,
    searchText,
    selectedDistrict,
    selectedProvince,
    setSelectedDistrict,
    mapHeight,
    districtScores,
  ]);

  return (
    <div className="relative space-y-3" ref={wrapperRef}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs md:text-sm font-semibold">
            Interactive Map
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs md:text-sm font-semibold">
            Mobile Friendly
          </span>
          {selectedDistrict && (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs md:text-sm font-semibold">
              Selected: {selectedDistrict.name}
            </span>
          )}
        </div>

        <button
          onClick={() => setSelectedDistrict(null)}
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition"
        >
          Reset
        </button>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-5 shadow-inner">
        <div className="rounded-[1.75rem] overflow-hidden border border-slate-200 bg-white shadow-sm">
          <svg
            ref={svgRef}
            className="w-full"
            style={{ height: `${mapHeight}px` }}
          />
        </div>
      </div>

      {tooltip.visible && (
        <div
          className="absolute z-20 bg-slate-900 text-white text-sm rounded-2xl px-4 py-3 shadow-2xl pointer-events-none max-w-xs"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-bold text-base">{tooltip.districtName}</p>
          <p className="text-slate-300">{tooltip.provinceName}</p>
          <p className="text-slate-200 mt-1">
            Local levels: {tooltip.municipalitiesCount}
          </p>
          <p className="text-blue-300 text-xs mt-2">Click to open district details</p>
        </div>
      )}
    </div>
  );
}

export default NepalMap;