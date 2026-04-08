import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import geoData from "../data/nepalGeo.json";
import type { DistrictInfo } from "../types/home";
import { useLanguage } from "../context/LanguageContext";

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
  const { language } = useLanguage();

  const text =
    language === "ne"
      ? {
          title: "नेपाल नेतृत्व अन्वेषक",
          subtitle:
            "जिल्ला खोज्नुहोस्, प्रदेश फिल्टर गर्नुहोस्, वा नक्सामा ट्याप गरेर सार्वजनिक जानकारी हेर्नुहोस्।",
          reset: "रिसेट",
          districts: "जिल्ला",
          selected: "चयन गरिएको",
          loading: "लोड हुँदैछ...",
          searchPlaceholder: "जिल्ला खोज्नुहोस्...",
          allProvinces: "सबै प्रदेश",
          liveMap: "प्रत्यक्ष नक्सा दृश्य",
          guideTitle: "कसरी प्रयोग गर्ने",
          guideText:
            "जिल्लामा ट्याप वा क्लिक गर्नुहोस्। दायाँपट्टि जिल्ला सारांश हेर्नुहोस्। तल विस्तृत प्रतिक्रिया दिनुहोस्।",
          legendTitle: "सन्तुष्टि संकेत",
          legendHigh: "उच्च",
          legendMid: "मध्यम",
          legendLow: "कम",
          localLevels: "स्थानीय तह",
          unknownProvince: "अज्ञात प्रदेश",
          mobileHint: "मोबाइलमा जिल्लामा ट्याप गर्नुहोस्",
        }
      : {
          title: "Nepal Leader Explorer",
          subtitle:
            "Search for a district, filter by province, or tap the map to explore local public information.",
          reset: "Reset",
          districts: "Districts",
          selected: "Selected",
          loading: "Loading...",
          searchPlaceholder: "Search district...",
          allProvinces: "All Provinces",
          liveMap: "Live map view",
          guideTitle: "How to use",
          guideText:
            "Choose a district from the map, then review the summary on the right.",
          guideShort:
            "Search and province filters update the map instantly.",
          filtersTitle: "Search and filter",
          filtersText: "Start with a district search or narrow the map by province.",
          resultCount: "Visible districts",
          quickTip: "Tip",
          quickTipText: "Click any district to open its summary and linked public data.",
          provinceLabel: "Province filter",
          legendTitle: "Satisfaction signal",
          legendHigh: "High",
          legendMid: "Medium",
          legendLow: "Low",
          localLevels: "Local levels",
          unknownProvince: "Unknown Province",
          mobileHint: "Tap districts directly for easier mobile use",
        };

  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    districtName: "",
    provinceName: "",
    municipalitiesCount: 0,
  });

  const [mapHeight, setMapHeight] = useState(600);
  const [isMobile, setIsMobile] = useState(false);

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

      setIsMobile(width < 768);

      if (width < 480) setMapHeight(320);
      else if (width < 640) setMapHeight(360);
      else if (width < 900) setMapHeight(430);
      else if (width < 1200) setMapHeight(520);
      else setMapHeight(600);
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
      if (tooltipTimeoutRef.current) {
        window.clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 1040;
    const height = 680;
    const clipId = "nepal-map-clip";

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("overflow", "hidden");

    const defs = svg.append("defs");
    defs
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("rx", 18);

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

    const mapLayer = svg
      .append("g")
      .attr("clip-path", `url(#${clipId})`);

    mapLayer
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("rx", 18)
      .attr("fill", "#eef4f8")
      .style("pointer-events", "none");

    const showTooltip = (event: any, feature: any) => {
      if (isMobile) return;

      const rawName =
        feature.properties?.DISTRICT ||
        feature.properties?.district ||
        feature.properties?.name ||
        feature.properties?.NAME_2 ||
        "Unknown";

      const matches = getDistrictCandidates(rawName, districts);
      const matched = matches[0];

      const bounds = wrapperRef.current?.getBoundingClientRect();
      const clientX = event.clientX ?? 0;
      const clientY = event.clientY ?? 0;

      setTooltip({
        visible: true,
        x: bounds ? clientX - bounds.left + 12 : 20,
        y: bounds ? clientY - bounds.top - 10 : 20,
        districtName: matched?.name || rawName,
        provinceName: matched?.province || text.unknownProvince,
        municipalitiesCount: matched?.localLevels?.length || 0,
      });
    };

    mapLayer
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

        const districtKey = normalizeDistrictAlias(matched?.name || rawName);
        const score = districtScores[districtKey.toUpperCase()];

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
          ? 2.4
          : isMobile
          ? 1.05
          : 0.85;
      })
      .style("cursor", "pointer")
      .style("touch-action", "manipulation")
      .style("pointer-events", "auto")
      .on("mouseenter", function (event: MouseEvent, feature: any) {
        showTooltip(event, feature);
      })
      .on("mouseleave", function () {
        if (tooltipTimeoutRef.current) {
          window.clearTimeout(tooltipTimeoutRef.current);
        }
        tooltipTimeoutRef.current = window.setTimeout(() => {
          setTooltip((prev) => ({ ...prev, visible: false }));
        }, 40);
      })
      .on("click", function (event: MouseEvent, feature: any) {
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
            province: text.unknownProvince,
            localLevels: [],
            mpLeader: null,
            ministerLeader: null,
            mayorLeader: null,
            naLeaders: [],
            satisfactionScore: 0,
          } as DistrictInfo);
        }

        if (!isMobile) {
          showTooltip(event, feature);
        } else {
          setTooltip((prev) => ({ ...prev, visible: false }));
        }
      });

    if (!isMobile && mapHeight >= 520) {
      mapLayer
        .selectAll("text")
        .data(features)
        .enter()
        .append("text")
        .attr("x", (feature: any) => path.centroid(feature)[0])
        .attr("y", (feature: any) => path.centroid(feature)[1])
        .attr("text-anchor", "middle")
        .attr("font-size", "7px")
        .attr("font-weight", "700")
        .attr("fill", "#102033")
        .attr("paint-order", "stroke")
        .attr("stroke", "#f8fafc")
        .attr("stroke-width", 1.4)
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

          return boxWidth > 46 && boxHeight > 18 ? rawName : "";
        });
    }
  }, [
    districts,
    districtLookup,
    searchText,
    selectedDistrict,
    selectedProvince,
    setSelectedDistrict,
    mapHeight,
    districtScores,
    text.unknownProvince,
    isMobile,
  ]);

  return (
    <section
      className="pointer-events-none relative z-0 isolate overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm [contain:layout_paint] md:p-5"
      ref={wrapperRef}
    >
      <div className="pointer-events-auto mb-5 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              {text.liveMap}
            </div>

            <h1 className="mt-3 text-[24px] font-extrabold tracking-tight text-slate-950 md:text-[32px]">
              {text.title}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600 md:text-base">
              {text.subtitle}
            </p>

            {isMobile ? (
              <p className="mt-3 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-medium text-slate-600">
                {text.mobileHint}
              </p>
            ) : null}
          </div>

          <button
            onClick={onReset}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {text.reset}
          </button>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-3 md:p-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] xl:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-white px-3 py-1.5 font-medium text-slate-600 shadow-sm">
                    {text.resultCount || "Visible districts"}: {totalDistricts}
                  </span>

                  {selectedDistrict && (
                    <span className="rounded-full bg-blue-100 px-3 py-1.5 font-medium text-blue-700">
                      {text.selected}: {selectedDistrict.name}
                    </span>
                  )}

                  {districtLoading && (
                    <span className="rounded-full bg-amber-100 px-3 py-1.5 font-medium text-amber-700">
                      {text.loading}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {text.filtersTitle || "Search and filter"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {text.filtersText || "Start with a district search or narrow the map by province."}
                  </p>
                </div>

                <div className="mt-3">
                  <input
                    type="text"
                    placeholder={text.searchPlaceholder}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-700">
                    i
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {text.guideTitle}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{text.guideText}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{text.guideShort}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-3 py-3">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {text.provinceLabel || "Province filter"}
                </p>

                <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedProvince("ALL")}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  selectedProvince === "ALL"
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {text.allProvinces}
              </button>

              <button
                className="hidden rounded-full bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 xl:inline-flex"
                type="button"
              >
                {(text.quickTip || "Tip")}: {text.quickTipText || "Click any district to open its summary and linked public data."}
              </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {provinceButtons.map((province, index) => (
                  <button
                    key={province.id}
                    onClick={() => setSelectedProvince(province.rawName)}
                    className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                      selectedProvince === province.rawName
                        ? "bg-slate-950 text-white"
                        : index > 5 && !isMobile
                        ? "hidden bg-slate-100 text-slate-700 hover:bg-slate-200 sm:inline-flex"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {province.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs">
            <p className="mr-1 font-semibold uppercase tracking-wide text-slate-500">
              {text.legendTitle}
            </p>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              {text.legendHigh}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              {text.legendMid}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              {text.legendLow}
            </span>
          </div>
        </div>
      </div>

      <div className="pointer-events-auto relative z-0 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 [contain:layout_paint]">
        {districtLoading ? (
          <div className="h-[320px] animate-pulse bg-slate-200 md:h-[520px] xl:h-[600px]" />
        ) : (
          <svg
            ref={svgRef}
            className="relative z-0 block w-full overflow-hidden touch-manipulation select-none"
            style={{ height: `${mapHeight}px` }}
          />
        )}
      </div>

      {!isMobile && tooltip.visible && (
        <div
          className="pointer-events-none absolute z-10 max-w-xs rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="text-base font-bold">{tooltip.districtName}</p>
          <p className="text-slate-300">{tooltip.provinceName}</p>
          <p className="mt-1 text-slate-200">
            {text.localLevels}: {tooltip.municipalitiesCount}
          </p>
        </div>
      )}
    </section>
  );
}

export default NepalMap;
