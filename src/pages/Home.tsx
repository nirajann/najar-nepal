import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import NepalMap from "../components/NepalMap";
import { api } from "../services/api";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { DistrictInfo } from "../types/home";
import { useLanguage } from "../context/LanguageContext";

const SelectedDistrictPanel = lazy(
  () => import("../components/home/SelectedDistrictPanel")
);
const DistrictDetailsSection = lazy(
  () => import("../components/home/DistrictDetailsSection")
);
const DistrictFeedbackSection = lazy(
  () => import("../components/home/DistrictFeedbackSection")
);

function SidePanelSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
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
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
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

function normalizeDistrictAlias(name = "") {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\(.*?\)/g, "")
    .replace("sindhupalchok", "sindhupalchowk")
    .replace("tanahun", "tanahu")
    .replace("kavre", "kavrepalanchok")
    .replace("nawalpur", "nawalparasi bardaghat susta east")
    .replace("east nawalparasi", "nawalparasi bardaghat susta east")
    .replace("nawalparasi east", "nawalparasi bardaghat susta east")
    .replace("nawalparasi west", "nawalparasi bardaghat susta west")
    .replace("west nawalparasi", "nawalparasi bardaghat susta west")
    .replace("western rukum", "rukum west")
    .replace("west rukum", "rukum west")
    .replace("rukum paschim", "rukum west")
    .replace("eastern rukum", "rukum east")
    .replace("east rukum", "rukum east")
    .replace("rukum purba", "rukum east");
}

function getLeaderDistrictName(district: any) {
  if (!district) return "";
  if (typeof district === "string") return district;
  return district.name || "";
}

function getDistrictScoreKey(name = "") {
  return normalizeDistrictAlias(name).toUpperCase();
}

function UtilityCard({
  title,
  text,
  href,
  cta,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      to={href}
      className="group rounded-[28px] border border-slate-200 bg-white/85 p-5 transition hover:-translate-y-0.5 hover:border-slate-300"
    >
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      <div className="mt-4 inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-slate-800">
        {cta}
      </div>
    </Link>
  );
}

function HeroSignalCard({
  title,
  value,
  helper,
  tone,
  delay,
}: {
  title: string;
  value: string;
  helper: string;
  tone: "blue" | "red" | "slate";
  delay: string;
}) {
  const toneStyles =
    tone === "red"
      ? "border-red-200 bg-white text-slate-950"
      : tone === "slate"
      ? "border-slate-200 bg-slate-950 text-white"
      : "border-blue-200 bg-white text-slate-950";

  const helperTone = tone === "slate" ? "text-slate-300" : "text-slate-500";

  return (
    <div
      className={`rounded-3xl border px-4 py-4 shadow-lg backdrop-blur-sm ${toneStyles}`}
      style={{ animation: "heroFloat 7s ease-in-out infinite", animationDelay: delay }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className={`mt-2 text-xs leading-5 ${helperTone}`}>{helper}</p>
    </div>
  );
}

function HeroVisual({
  language,
  filteredDistrictsCount,
  leaderCount,
}: {
  language: "en" | "ne";
  filteredDistrictsCount: number;
  leaderCount: number;
}) {
  const text =
    language === "ne"
      ? {
          districtSignals: "जिल्ला संकेत",
          trustLayer: "विश्वास तह",
          civicPulse: "नागरिक स्पन्दन",
          publicView: "सार्वजनिक दृष्टि",
          activeMap: "सक्रिय नेपाल दृश्य",
          districts: "जिल्ला",
          leaders: "नेता",
          mapNote: "नेपालभरि सार्वजनिक भावना, सहभागिता र उत्तरदायित्वको जीवित दृश्य",
          districtHelper: "नक्साबाट जिल्ला-स्तरको आवाज हेर्नुहोस्",
          leaderHelper: "जोडिएका प्रोफाइल, प्रतिक्रिया र सार्वजनिक सन्दर्भ",
          pulseValue: "प्रमाणित प्रतिक्रिया",
          pulseHelper: "नागरिक सहभागिता र सार्वजनिक विश्वासका जीवित संकेत",
        }
      : {
          districtSignals: "District signals",
          trustLayer: "Trust layer",
          civicPulse: "Civic pulse",
          publicView: "Public view",
          activeMap: "Active Nepal view",
          districts: "districts",
          leaders: "leaders",
          mapNote: "A living view of public sentiment, civic participation, and accountability across Nepal",
          districtHelper: "Explore district-level public voice from the map",
          leaderHelper: "Linked profiles, reactions, and public context",
          pulseValue: "verified feedback",
          pulseHelper: "Live signals from civic participation and public trust",
        };

  const highlightedPoints = [
    { top: "22%", left: "18%" },
    { top: "35%", left: "31%" },
    { top: "44%", left: "48%" },
    { top: "56%", left: "64%" },
    { top: "64%", left: "77%" },
  ];

  return (
    <div className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(145deg,#f8fbff_0%,#ffffff_34%,#eff6ff_100%)] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] md:p-7">
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes heroPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.18); opacity: 0.75; }
        }
        @keyframes heroFadeUp {
          0% { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-red-100/70 blur-3xl" />
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-100/80 blur-3xl" />
        <div className="absolute bottom-2 left-1/3 h-44 w-44 rounded-full bg-slate-200/70 blur-3xl" />
        <svg
          viewBox="0 0 600 420"
          className="absolute inset-0 h-full w-full opacity-40"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M30 320C95 274 139 257 201 244C262 231 289 195 351 181C423 164 476 166 566 108"
            stroke="#dbeafe"
            strokeWidth="2"
            strokeDasharray="5 8"
          />
          <path
            d="M65 120C126 141 165 134 223 117C287 98 331 110 393 89C456 68 497 47 552 33"
            stroke="#fecaca"
            strokeWidth="2"
            strokeDasharray="8 10"
          />
        </svg>
      </div>

      <div className="relative z-10" style={{ animation: "heroFadeUp 700ms ease-out both" }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
            {text.activeMap}
          </span>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
            {text.civicPulse}
          </span>
          <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            {text.publicView}
          </span>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 px-5 py-6 text-white shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.26),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.28),transparent_36%)]" />
            <div className="relative z-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                {text.trustLayer}
              </p>

              <div className="mt-5 aspect-[1.28/1] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4">
                <div className="relative h-full overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(30,41,59,0.88))]">
                  <svg viewBox="0 0 420 240" className="absolute inset-0 h-full w-full" fill="none">
                    <path
                      d="M37 143L86 126L115 110L155 101L193 84L224 87L257 72L292 79L321 64L346 67L371 51L390 59L371 87L334 100L301 113L268 122L231 129L206 145L173 150L136 164L111 171L78 176L53 168L37 143Z"
                      fill="rgba(248,250,252,0.08)"
                      stroke="rgba(255,255,255,0.42)"
                      strokeWidth="2"
                    />
                    <path
                      d="M56 165C101 141 140 129 183 120C226 111 261 101 302 89C331 80 353 71 381 61"
                      stroke="rgba(59,130,246,0.55)"
                      strokeWidth="2"
                      strokeDasharray="6 8"
                    />
                  </svg>

                  {highlightedPoints.map((point, index) => (
                    <div
                      key={`${point.top}-${point.left}`}
                      className="absolute"
                      style={{ top: point.top, left: point.left }}
                    >
                      <span
                        className={`block rounded-full ${index % 2 === 0 ? "bg-red-400" : "bg-blue-400"}`}
                        style={{
                          width: "10px",
                          height: "10px",
                          boxShadow: "0 0 0 8px rgba(255,255,255,0.06)",
                          animation: `heroPulse ${index % 2 === 0 ? "2.8s" : "3.2s"} ease-in-out infinite`,
                        }}
                      />
                    </div>
                  ))}

                  <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                      {text.mapNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <HeroSignalCard
              title={text.districtSignals}
              value={`${filteredDistrictsCount}+ ${text.districts}`}
              helper={text.districtHelper}
              tone="blue"
              delay="0.1s"
            />
            <HeroSignalCard
              title={text.trustLayer}
              value={`${leaderCount}+ ${text.leaders}`}
              helper={text.leaderHelper}
              tone="red"
              delay="0.4s"
            />
            <HeroSignalCard
              title={text.civicPulse}
              value={text.pulseValue}
              helper={text.pulseHelper}
              tone="slate"
              delay="0.7s"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const { language } = useLanguage();

  const text =
    language === "ne"
      ? {
          heroBadge: "सार्वजनिक विश्वास प्लेटफर्म",
          heroTitle: "नेपालभरि नेतृत्व, जनमत र नागरिक गतिविधि हेर्नुहोस्",
          heroSubtitle:
            "नक्शाबाट जिल्ला खोज्नुहोस्, नेताको प्रोफाइल हेर्नुहोस्, सार्वजनिक विश्वास बुझ्नुहोस्, र नागरिक आवाज कहाँ सक्रिय छ हेर्नुहोस्।",
          primaryCta: "नक्सा प्रयोग गर्नुहोस्",
          secondaryCta: "र्याङ्किङ हेर्नुहोस्",
          stat1Label: "जिल्ला अवलोकन",
          stat1Helper: "नक्शाबाट जिल्लागत नागरिक दृष्टिकोण अन्वेषण गर्नुहोस्।",
          stat2Label: "सार्वजनिक नेतृत्व",
          stat2Helper: "जिल्लाअनुसार नेता, प्रोफाइल र प्रतिनिधित्व हेर्नुहोस्।",
          stat3Label: "नागरिक गतिविधि",
          stat3Helper: "टिप्पणी, रेटिङ र सार्वजनिक सहभागिताको संकेत हेर्नुहोस्।",
          mapSectionTitle: "जिल्लाअनुसार अन्वेषण गर्नुहोस्",
          mapSectionText:
            "नक्सा नै यस प्लेटफर्मको मुख्य प्रवेश बिन्दु हो। जिल्ला खोज्नुहोस्, प्रदेश फिल्टर गर्नुहोस्, वा क्लिक गरेर स्थानीय सार्वजनिक जानकारी हेर्नुहोस्।",
          mapQuickHint: "नक्सामा क्लिक गर्दा दायाँपट्टि जिल्ला सारांश देखिन्छ।",
          feedbackTitle: "जिल्ला सार्वजनिक प्रतिक्रिया",
          feedbackText:
            "यातायात, सडक, सुरक्षा, सरसफाइ र सार्वजनिक सेवाबारे विस्तृत प्रतिक्रिया दिनुहोस्।",
          sectionUtilityTitle: "प्लेटफर्मबाट के गर्न सकिन्छ",
          card1Title: "नेतृत्व र्याङ्किङ",
          card1Text:
            "कुन नेताले बढी सार्वजनिक विश्वास, छलफल र संलग्नता पाइरहेका छन् हेर्नुहोस्।",
          card1Cta: "र्याङ्किङमा जानुहोस्",
          card2Title: "परियोजना र सार्वजनिक काम",
          card2Text:
            "सार्वजनिक परियोजना, जिल्ला गतिविधि र स्थानीय प्रगति जोडेर हेर्नुहोस्।",
          card2Cta: "परियोजनाहरू हेर्नुहोस्",
          card3Title: "किन यो प्लेटफर्म महत्त्वपूर्ण छ",
          card3Text:
            "जनताको आवाज, सार्वजनिक अभिलेख र नेतृत्वको उत्तरदायित्व एउटै ठाउँमा ल्याउने प्रयास।",
          card3Cta: "थप जान्नुहोस्",
          lowerSectionTitle: "जिल्ला अन्तर्दृष्टि",
          lowerSectionText:
            "चयन गरिएको जिल्लाको सार्वजनिक प्रतिक्रिया र आधारभूत विवरण एउटै ठाउँमा सरल रूपमा हेर्नुहोस्।",
          exploreMoreTitle: "थप अन्वेषण",
          exploreMoreText:
            "जिल्ला दृष्टिकोण हेरेपछि र्याङ्किङ र परियोजनातिर थप गहिरो रूपमा जानुहोस्।",
        }
      : {
          heroBadge: "Public trust platform",
          heroTitle: "Public Voice. Public Trust. Public Accountability.",
          heroSubtitle:
            "See what Nepal really thinks about its leaders through district exploration, public sentiment, and living civic signals built for accountability.",
          primaryCta: "Explore the map",
          secondaryCta: "View rankings",
          stat1Label: "District explorer",
          stat1Helper: "Navigate Nepal district by district through the interactive map.",
          stat2Label: "Public leadership",
          stat2Helper: "View linked leaders, profiles, and district-level representation.",
          stat3Label: "Citizen activity",
          stat3Helper: "See signals from comments, ratings, and public engagement.",
          mapSectionTitle: "Explore by district",
          mapSectionText:
            "The map is the main entry point to the platform. Search for a district, filter by province, or click directly to view local public information.",
          mapQuickHint: "Selecting a district updates the summary panel on the right.",
          feedbackTitle: "District Public Feedback",
          feedbackText:
            "Rate transportation, roads, safety, cleanliness, public services, and visitor experience for the selected district.",
          sectionUtilityTitle: "What you can do on this platform",
          card1Title: "Leaders ranking",
          card1Text:
            "See which leaders are gaining public trust, discussion, and engagement.",
          card1Cta: "Go to rankings",
          card2Title: "Projects and public work",
          card2Text:
            "Connect district activity with public projects, local priorities, and visible progress.",
          card2Cta: "View projects",
          lowerSectionTitle: "District insights",
          lowerSectionText:
            "Public feedback and linked district details stay together here, so the page feels easier to scan after you select a district.",
          exploreMoreTitle: "Explore more",
          exploreMoreText:
            "Go deeper into rankings and projects once you have a district-level view.",
        };

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

        const [districtRes, leaderRes] = await Promise.all([
          api.getDistricts(),
          api.getLeaders(),
        ]);

        const districtItems = Array.isArray(districtRes)
          ? districtRes
          : districtRes?.districts || [];

        const leaderItems = Array.isArray(leaderRes)
          ? leaderRes
          : leaderRes?.leaders || [];

        const normalized = districtItems.map((district: DistrictInfo) => {
          const districtKey = normalizeDistrictAlias(district.name);

          const relatedLeaders = leaderItems.filter((leader: any) => {
            const leaderDistrictName = getLeaderDistrictName(leader.district);
            return normalizeDistrictAlias(leaderDistrictName) === districtKey;
          });

          return {
            ...district,
            localLevels: Array.isArray(district.localLevels) ? district.localLevels : [],
            mpLeader: relatedLeaders.find((l: any) => l.role === "MP") || null,
            ministerLeader: relatedLeaders.find((l: any) => l.role === "Minister") || null,
            mayorLeader:
              relatedLeaders.find((l: any) => l.role === "Mayor") ||
              relatedLeaders.find((l: any) => l.role === "Chairperson") ||
              null,
            naLeaders: relatedLeaders.filter(
              (l: any) => l.role === "National Assembly Member"
            ),
            satisfactionScore:
              typeof district.satisfactionScore === "number"
                ? district.satisfactionScore
                : 50,
          };
        });

        setDistricts(normalized);
      } catch (error) {
        console.error("Failed to load districts/leaders:", error);
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
  }, [districts, selectedDistrict]);

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
        loaded[getDistrictScoreKey(district.name)] = Number(saved);
      }
    });

    setDistrictScores(loaded);
  }, [districts]);

  const handleDistrictScoreSave = (districtName: string, score: number) => {
    const scoreKey = getDistrictScoreKey(districtName);

    setDistrictScores((prev) => ({
      ...prev,
      [scoreKey]: score,
    }));

    setDistricts((prev) =>
      prev.map((district) =>
        district.name === districtName
          ? { ...district, satisfactionScore: score }
          : district
      )
    );

    setSelectedDistrict((prev) =>
      prev && prev.name === districtName
        ? { ...prev, satisfactionScore: score }
        : prev
    );
  };

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

  const leaderCount = useMemo(() => {
    return districts.reduce((count, district) => {
      let next = count;
      if (district.mpLeader?.leaderId) next += 1;
      if (district.mayorLeader?.leaderId) next += 1;
      if (district.ministerLeader?.leaderId) next += 1;
      if (Array.isArray(district.naLeaders)) next += district.naLeaders.length;
      return next;
    }, 0);
  }, [districts]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-[1480px] px-3 py-4 md:px-5 md:py-5">
        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <div className="grid items-center gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div
              className="max-w-3xl"
              style={{ animation: "heroFadeUp 700ms ease-out both" }}
            >
              <div className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                {text.heroBadge}
              </div>

              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 md:text-6xl">
                {text.heroTitle}
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                {text.heroSubtitle}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {language === "ne"
                    ? "नेपालभरि सार्वजनिक आवाज"
                    : "District-level public voice"}
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {language === "ne"
                    ? "विश्वास र उत्तरदायित्व संकेत"
                    : "Trust and accountability signals"}
                </span>
                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                  {language === "ne"
                    ? "नागरिक सहभागिता"
                    : "Modern civic participation"}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#district-map"
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  {text.primaryCta}
                </a>

                <Link
                  to="/ranking"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  {text.secondaryCta}
                </Link>
              </div>
            </div>

            <HeroVisual
              language={language}
              filteredDistrictsCount={loadingDistricts ? 0 : filteredDistrictsCount}
              leaderCount={loadingDistricts ? 0 : leaderCount}
            />
          </div>
        </section>

        <section id="district-map" className="relative z-0 mt-8 md:mt-10">
          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                {text.mapSectionTitle}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {text.mapSectionText}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
              {text.mapQuickHint}
            </div>
          </div>

          <div className="relative z-0 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.9fr)_420px]">
            <div className="relative z-0 min-w-0">
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
          </div>
        </section>

        <section className="mt-10 md:mt-12">
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              {text.lowerSectionTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {text.lowerSectionText}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div>
              <div className="mb-3">
                <h3 className="text-lg font-bold tracking-tight text-slate-950">
                  {text.feedbackTitle}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {text.feedbackText}
                </p>
              </div>

              <Suspense fallback={<LowerSectionSkeleton />}>
                <DistrictFeedbackSection
                  district={selectedDistrict}
                  onScoreSaved={handleDistrictScoreSave}
                />
              </Suspense>
            </div>

            <div>
              <div className="mb-3">
                <h3 className="text-lg font-bold tracking-tight text-slate-950">
                  {language === "ne" ? "जिल्ला विवरण" : "District details"}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {language === "ne"
                    ? "चयन गरिएको जिल्लाको स्थानीय तह र प्रतिनिधिसम्बन्धी आधारभूत जानकारी।"
                    : "A lighter view of local levels and linked representatives for the selected district."}
                </p>
              </div>

              <Suspense fallback={<LowerSectionSkeleton />}>
                <DistrictDetailsSection district={selectedDistrict} />
              </Suspense>
            </div>
          </div>
        </section>

        <section className="mt-10 md:mt-12">
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              {text.exploreMoreTitle || text.sectionUtilityTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {text.exploreMoreText || text.sectionUtilityTitle}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UtilityCard
              title={text.card1Title}
              text={text.card1Text}
              href="/ranking"
              cta={text.card1Cta}
            />
            <UtilityCard
              title={text.card2Title}
              text={text.card2Text}
              href="/projects"
              cta={text.card2Cta}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
