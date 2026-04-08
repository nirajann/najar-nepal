import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import NepalMap from "../components/NepalMap";
import { api } from "../services/api";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { DistrictInfo } from "../types/home";
import { useLanguage } from "../context/LanguageContext";
import {
  NepalActionLink,
  NepalAnchorButton,
} from "../components/NepalDesignSystem";

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
    <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
      <DhakaBorder />
      <div className="p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-[11px] font-bold text-red-600">
            ???
          </div>
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="h-3 w-20 rounded bg-slate-200" />
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-40 rounded bg-slate-200" />
          <div className="h-10 rounded-2xl bg-slate-200" />
          <div className="h-10 rounded-2xl bg-slate-200" />
          <div className="h-24 rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function LowerSectionSkeleton() {
  return (
    <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
      <DhakaBorder />
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Loading section
          </p>
          <div className="h-3 w-16 rounded bg-slate-200" />
        </div>
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
    </div>
  );
}

function DhakaBorder() {
  return (
    <div
      className="h-2 w-full bg-[linear-gradient(90deg,#dc2626_0%,#dc2626_12%,#1d4ed8_12%,#1d4ed8_24%,#f8fafc_24%,#f8fafc_28%,#dc2626_28%,#dc2626_40%,#1d4ed8_40%,#1d4ed8_52%,#f8fafc_52%,#f8fafc_56%,#dc2626_56%,#dc2626_68%,#1d4ed8_68%,#1d4ed8_80%,#f8fafc_80%,#f8fafc_84%,#dc2626_84%,#dc2626_100%)]"
      aria-hidden="true"
    />
  );
}

function NepalPatternBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.08),transparent_34%),radial-gradient(circle_at_top_right,rgba(29,78,216,0.08),transparent_38%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(248,250,252,0.86))]" />
      <div className="absolute left-[-6%] top-[90px] h-[340px] w-[340px] rounded-full border border-red-100/70 opacity-70" />
      <div className="absolute right-[-8%] top-[180px] h-[420px] w-[420px] rounded-full border border-blue-100/80 opacity-70" />
      <svg viewBox="0 0 1440 1200" className="absolute inset-0 h-full w-full opacity-[0.16]" fill="none">
        <path d="M0 220C142 187 253 165 386 136C525 105 642 85 794 88C945 91 1081 123 1249 108C1320 101 1385 88 1440 72" stroke="#1d4ed8" strokeWidth="2" />
        <path d="M0 286C123 250 259 224 404 210C566 194 672 198 847 213C1028 229 1189 256 1440 228" stroke="#dc2626" strokeWidth="2" strokeDasharray="5 9" />
        <path d="M0 970C161 936 316 908 468 898C636 887 781 900 964 920C1151 940 1287 982 1440 1031" stroke="#0f172a" strokeWidth="1.5" opacity="0.6" />
      </svg>
      <div className="absolute left-0 right-0 top-[420px] h-24 opacity-[0.12]" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(220,38,38,0.9) 0 18px, rgba(248,250,252,0) 18px 28px, rgba(29,78,216,0.95) 28px 46px, rgba(248,250,252,0) 46px 58px)" }} />
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
      className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-red-500 to-blue-600" />
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span>{cta}</span>
        <span className="text-red-500 transition group-hover:translate-x-0.5">{"->"}</span>
      </div>
    </Link>
  );
}

function NationalStatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
    </div>
  );
}

type FeaturedLeaderItem = {
  leaderId: string;
  name: string;
  role: string;
  districtName: string;
  province: string;
  party?: string;
  photo?: string;
};

function FeaturedLeadersPanel({
  leaders,
  loading,
}: {
  leaders: FeaturedLeaderItem[];
  loading: boolean;
}) {
  const { section } = useLanguage();
  const content = section("home");
  const primaryLeader = leaders[0];
  const supportingLeaders = leaders.slice(1, 4);

  const getAvatarTone = (index: number) =>
    index % 3 === 1
      ? "bg-blue-50 text-blue-700 ring-blue-100"
      : index % 3 === 2
      ? "bg-slate-100 text-slate-700 ring-slate-200"
      : "bg-red-50 text-red-600 ring-red-100";

  return (
    <section className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm md:mt-8">
      <DhakaBorder />
      <div className="p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
              {content.featuredProfilesEyebrow}
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
              {content.featuredProfilesTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {content.featuredProfilesHelper}
            </p>
          </div>
          {!loading && leaders.length > 0 ? (
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>
                {leaders.length} {content.featuredProfilesVisibleCount}
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)]">
              <div className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-5">
                <div className="animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-[22px] bg-slate-200" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-24 rounded bg-slate-200" />
                      <div className="h-6 w-48 rounded bg-slate-200" />
                      <div className="h-4 w-40 rounded bg-slate-200" />
                      <div className="h-10 rounded-2xl bg-slate-200" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`featured-loading-${index}`}
                    className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-slate-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-28 rounded bg-slate-200" />
                          <div className="h-3 w-20 rounded bg-slate-200" />
                          <div className="h-3 w-24 rounded bg-slate-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : leaders.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)]">
              {primaryLeader ? (
                <article className="group relative overflow-hidden rounded-[26px] border border-slate-200 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_40px_rgba(15,23,42,0.10)] md:p-6">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-red-500/80 to-blue-600" />
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-red-50/70 blur-3xl" />
                  <div className="relative flex h-full flex-col justify-between gap-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      {primaryLeader.photo ? (
                        <img
                          src={primaryLeader.photo}
                          alt={primaryLeader.name}
                          className="h-20 w-20 shrink-0 rounded-[24px] border border-white/80 object-cover shadow-sm"
                        />
                      ) : (
                        <div
                          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] text-2xl font-bold ring-1 ${getAvatarTone(0)}`}
                        >
                          {primaryLeader.name.charAt(0)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-600">
                            {content.featuredProfilesFeaturedLabel}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                            {content.featuredProfilesPublicLabel}
                          </span>
                        </div>
                        <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                          {primaryLeader.name}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {primaryLeader.role}
                        </p>
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              {content.featuredProfilesLocationLabel}
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {primaryLeader.districtName}
                              {primaryLeader.province ? `, ${primaryLeader.province}` : ""}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              {content.featuredProfilesRoleLabel}
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {primaryLeader.role}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              {primaryLeader.party ? content.featuredProfilesPartyLabel : content.featuredProfilesProfileLabel}
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {primaryLeader.party || content.featuredProfilesProfileReady}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="max-w-lg">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {content.featuredProfilesFeaturedLabel}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {content.featuredProfilesHelper}
                        </p>
                      </div>
                      <Link
                        to={`/leader/${primaryLeader.leaderId}`}
                        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600"
                      >
                        <span>{content.featuredProfilesAction}</span>
                        <span className="transition group-hover:translate-x-0.5">{"->"}</span>
                      </Link>
                    </div>
                  </div>
                </article>
              ) : null}

              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {content.featuredProfilesSupportingTitle}
                </p>
                {supportingLeaders.map((leader, index) => (
                  <article
                    key={leader.leaderId}
                    className="group rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      {leader.photo ? (
                        <img
                          src={leader.photo}
                          alt={leader.name}
                          className="h-14 w-14 shrink-0 rounded-[18px] object-cover"
                        />
                      ) : (
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] text-base font-bold ring-1 ${getAvatarTone(index + 1)}`}
                        >
                          {leader.name.charAt(0)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {content.featuredProfilesPublicLabel}
                        </span>
                        <h3 className="mt-2 truncate text-base font-bold text-slate-950">
                          {leader.name}
                        </h3>
                        <p className="text-sm font-medium text-slate-500">{leader.role}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {leader.districtName}
                          {leader.province ? `, ${leader.province}` : ""}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/leader/${leader.leaderId}`}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-red-600"
                    >
                      <span>{content.featuredProfilesAction}</span>
                      <span className="transition group-hover:translate-x-0.5">{"->"}</span>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-600">
              {content.featuredProfilesEmpty}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
function HeroVisual({
  filteredDistrictsCount,
  leaderCount,
}: {
  filteredDistrictsCount: number;
  leaderCount: number;
}) {
  const { section } = useLanguage();
  const uiText = section("home");
const previewItems = [
  {
    districtName: "Kathmandu",
    province: "Bagmati Province",
    leader: "Kathmandu Metropolitan leadership",
    score: "82/100",
    feedback: "Public sentiment and trust signals remain clearly visible across the district view.",
    updateOne: "District context stays visible in one place",
    updateTwo: "Trust snapshot updates with the selected area",
    updateThree: "Leader profile overview remains easy to scan",
    markerX: 172,
    markerY: 124,
    accent: "red" as const,
  },
  {
    districtName: "Pokhara",
    province: "Gandaki Province",
    leader: "Pokhara Metropolitan leadership",
    score: "79/100",
    feedback: "Citizen discussion around services, tourism, and infrastructure remains easy to follow.",
    updateOne: "District and profile context stay connected",
    updateTwo: "Public trust view stays readable and clear",
    updateThree: "Civic signals are shown in a cleaner summary",
    markerX: 138,
    markerY: 118,
    accent: "blue" as const,
  },
  {
    districtName: "Dharan",
    province: "Koshi Province",
    leader: "Dharan Sub-Metropolitan leadership",
    score: "76/100",
    feedback: "Local engagement and service discussion are presented in a more direct district view.",
    updateOne: "Map and district summary stay in sync",
    updateTwo: "Public trust is easier to understand quickly",
    updateThree: "Leader visibility remains part of the same flow",
    markerX: 226,
    markerY: 108,
    accent: "slate" as const,
  },
  {
    districtName: "Jhapa",
    province: "Koshi Province",
    leader: "Jhapa district public profile",
    score: "74/100",
    feedback: "District-level representation and public context are visible together in one civic view.",
    updateOne: "District browsing feels more direct",
    updateTwo: "Profile context stays visible with the map",
    updateThree: "Public information remains easy to explore",
    markerX: 286,
    markerY: 92,
    accent: "red" as const,
  },
  {
    districtName: "Lalitpur",
    province: "Bagmati Province",
    leader: "Lalitpur Metropolitan leadership",
    score: "81/100",
    feedback: "Urban services, heritage, and public trust are presented in a cleaner accountability view.",
    updateOne: "Selected district remains the main focus",
    updateTwo: "Trust score and area context stay together",
    updateThree: "Public profile visibility feels more active",
    markerX: 180,
    markerY: 128,
    accent: "blue" as const,
  },
];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % previewItems.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [previewItems.length]);

  const activeItem = previewItems[activeIndex];
  const accentClasses =
    activeItem.accent === "blue"
      ? {
          badge: "bg-blue-50 text-blue-700",
          glow: "bg-blue-400/12",
          dot: "#60a5fa",
          pulse: "rgba(96,165,250,0.14)",
        }
      : activeItem.accent === "slate"
      ? {
          badge: "bg-slate-100 text-slate-700",
          glow: "bg-slate-300/20",
          dot: "#cbd5e1",
          pulse: "rgba(203,213,225,0.16)",
        }
      : {
          badge: "bg-red-50 text-red-600",
          glow: "bg-red-400/12",
          dot: "#ef4444",
          pulse: "rgba(239,68,68,0.14)",
        };

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.12)] md:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-red-500 to-blue-600" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.85),transparent_28%)]" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            {uiText.heroPreviewLabel}
          </span>
          <span className="text-xs font-medium text-slate-500">
            {leaderCount}+ {uiText.heroPreviewLeaderProfiles}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-4 text-white shadow-[0_18px_32px_rgba(15,23,42,0.18)] transition duration-700">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {uiText.heroPreviewMapLabel}
                </p>
                <p
                  key={`feedback-${activeIndex}`}
                  className="mt-1 animate-[fadeIn_500ms_ease-out] text-sm text-slate-400"
                >
                  {activeItem.feedback}
                </p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                {filteredDistrictsCount} {uiText.heroPreviewVisible}
              </span>
            </div>

            <div className="relative h-[240px] overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(30,41,59,0.9),rgba(15,23,42,0.96))]">
              <div className="absolute inset-y-0 left-[-15%] w-[38%] rotate-12 bg-white/5 blur-2xl animate-[shellDrift_16s_ease-in-out_infinite]" />
              <svg viewBox="0 0 420 240" className="absolute inset-0 h-full w-full" fill="none">
                <path
                  d="M36 146L84 128L122 112L166 98L214 84L250 92L288 78L328 84L356 70L386 78L364 101L328 113L292 126L256 134L214 142L176 156L138 170L96 178L54 172L36 146Z"
                  fill="rgba(255,255,255,0.06)"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="2"
                />
                <path
                  d="M56 165C104 142 149 129 189 120C236 109 278 96 332 77"
                  stroke="rgba(96,165,250,0.7)"
                  strokeWidth="2"
                  strokeDasharray="6 7"
                />
                <circle
                  key={`marker-${activeIndex}`}
                  cx={activeItem.markerX}
                  cy={activeItem.markerY}
                  r="5"
                  fill={accentClasses.dot}
                  className="animate-[pulse_2.8s_ease-in-out_infinite]"
                />
                <circle
                  key={`pulse-${activeIndex}`}
                  cx={activeItem.markerX}
                  cy={activeItem.markerY}
                  r="14"
                  fill={accentClasses.pulse}
                  className="animate-[pulse_3.1s_ease-in-out_infinite]"
                />
              </svg>

              <div className="absolute bottom-4 left-4 right-4 grid gap-3 sm:grid-cols-2">
                <div
                  key={`district-${activeIndex}`}
                  className="rounded-[20px] border border-white/10 bg-white/8 p-3 backdrop-blur-sm animate-[fadeIn_550ms_ease-out]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                    {uiText.heroPreviewDistrictLabel}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-white">{activeItem.districtName}</h3>
                  <p className="text-sm text-slate-300">{activeItem.province}</p>
                </div>

                <div
                  key={`score-${activeIndex}`}
                  className="rounded-[20px] border border-white/10 bg-white/8 p-3 backdrop-blur-sm animate-[fadeIn_650ms_ease-out]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                    {uiText.heroPreviewTrustLabel}
                  </p>
                  <p className="mt-1 text-xl font-extrabold text-white">{activeItem.score}</p>
                  <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${accentClasses.badge}`}>
                    {activeItem.province}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition duration-700">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {uiText.heroPreviewLeaderLabel}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentClasses.badge}`}>
                  {activeItem.leader.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950">{activeItem.leader}</h3>
                  <p className="text-sm text-slate-500">{uiText.heroPreviewLeaderHelper}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition duration-700">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {uiText.heroPreviewActivityLabel}
              </p>
              <div className="mt-3 space-y-3">
                {[activeItem.updateOne, activeItem.updateTwo, activeItem.updateThree].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                    <p className="text-sm leading-6 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function Home() {
  const { section } = useLanguage();
  const lastTrackedDistrictRef = useRef("");
  const lastTrackedSearchRef = useRef("");

  const text = section("home");

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
            mpLeader: relatedLeaders.find((leader: any) => leader.role === "MP") || null,
            ministerLeader:
              relatedLeaders.find((leader: any) => leader.role === "Minister") || null,
            mayorLeader:
              relatedLeaders.find((leader: any) => leader.role === "Mayor") ||
              relatedLeaders.find((leader: any) => leader.role === "Chairperson") ||
              null,
            naLeaders: relatedLeaders.filter(
              (leader: any) => leader.role === "National Assembly Member"
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

    void loadDistricts();
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
    const nextScores: Record<string, number> = {};

    districts.forEach((district) => {
      if (typeof district.satisfactionScore === "number") {
        nextScores[getDistrictScoreKey(district.name)] = district.satisfactionScore;
      }
    });

    setDistrictScores(nextScores);
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

      const query = debouncedSearchText.trim().toLowerCase();
      const matchSearch =
        !query ||
        district.name.toLowerCase().includes(query) ||
        district.province.toLowerCase().includes(query);

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

  useEffect(() => {
    if (!selectedDistrict?.districtId) return;
    if (lastTrackedDistrictRef.current === selectedDistrict.districtId) return;

    lastTrackedDistrictRef.current = selectedDistrict.districtId;

    void api.trackEvent({
      eventName: "district_selected",
      entityType: "district",
      entityId: selectedDistrict.districtId,
      entityName: selectedDistrict.name,
      sourcePage: "home_map",
      metadata: {
        province: selectedDistrict.province || "",
      },
    });
  }, [selectedDistrict]);

  useEffect(() => {
    const query = debouncedSearchText.trim();
    if (query.length < 2) return;
    if (lastTrackedSearchRef.current === query.toLowerCase()) return;

    lastTrackedSearchRef.current = query.toLowerCase();

    void api.trackEvent({
      eventName: "search_used",
      entityType: "district",
      entityId: "home-map-search",
      entityName: "District search",
      sourcePage: "home_map",
      metadata: {
        queryLength: query.length,
        provinceFilter: selectedProvince,
      },
    });
  }, [debouncedSearchText, selectedProvince]);

  const featuredLeaders = useMemo<FeaturedLeaderItem[]>(() => {
    const rolePriority: Record<string, number> = {
      "Prime Minister": 1,
      Minister: 2,
      Mayor: 3,
      MP: 4,
      Chairperson: 5,
      "National Assembly Member": 6,
    };

    const seen = new Set<string>();
    const collected: FeaturedLeaderItem[] = [];

    districts.forEach((district) => {
      const candidates = [
        district.mpLeader,
        district.mayorLeader,
        district.ministerLeader,
        ...(Array.isArray(district.naLeaders) ? district.naLeaders : []),
      ].filter(Boolean);

      candidates.forEach((leader: any) => {
        if (!leader?.leaderId || seen.has(leader.leaderId)) return;
        seen.add(leader.leaderId);
        collected.push({
          leaderId: leader.leaderId,
          name: leader.name || "Leader profile",
          role: leader.role || "Leader",
          districtName: district.name || "",
          province: district.province || "",
          party: leader.party || "",
          photo: leader.photo || "",
        });
      });
    });

    return collected
      .sort((a, b) => {
        const aPriority = rolePriority[a.role] ?? 99;
        const bPriority = rolePriority[b.role] ?? 99;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 4);
  }, [districts]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <NepalPatternBackdrop />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-[1480px] px-3 py-4 md:px-5 md:py-5">
        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <div className="grid items-center gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-3xl" style={{ animation: "heroFadeUp 700ms ease-out both" }}>
              <div className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                {text.heroBadge}
              </div>

              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 md:text-6xl">
                {text.heroTitle}
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                {text.heroSubtitle}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <NepalAnchorButton href="#district-map">
                  {text.primaryCta}
                </NepalAnchorButton>

                <NepalActionLink to="/ranking" tone="secondary">
                  {text.secondaryCta}
                </NepalActionLink>

                <a
                  href="#district-map"
                  className="inline-flex items-center px-1 py-3 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
                >
                  {text.seeHowItWorks}
                </a>
              </div>
            </div>

            <HeroVisual
              filteredDistrictsCount={loadingDistricts ? 0 : filteredDistrictsCount}
              leaderCount={loadingDistricts ? 0 : leaderCount}
            />
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 md:mt-8 md:grid-cols-2 xl:grid-cols-4">
          <NationalStatCard label={text.stat1Label} value="77" helper={text.stat1Helper} />
          <NationalStatCard label={text.stat2Label} value="753" helper={text.stat2Helper} />
          <NationalStatCard
            label={text.stat3Label}
            value={String(Object.keys(districtScores).length)}
            helper={text.stat3Helper}
          />
          <NationalStatCard
            label={text.stat4Label}
            value={`${leaderCount}+`}
            helper={text.stat4Helper}
          />
        </section>

        <FeaturedLeadersPanel
          leaders={featuredLeaders}
          loading={loadingDistricts}
        />

        <section className="mt-8 md:mt-10">
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

          <div id="district-map" className="relative z-0 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.9fr)_420px]">
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
                  {text.districtDetailsTitle}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {text.districtDetailsText}
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
              {text.exploreMoreTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {text.exploreMoreText}
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








