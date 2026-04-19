import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import NepalMap from "../components/NepalMap";
import { api } from "../services/api";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { DistrictInfo, LeaderRef } from "../types/home";
import { useLanguage } from "../context/useLanguage";
import Footer from "../components/Footer";
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

function DhakaBorder() {
  return (
    <div
      className="h-1.5 w-full bg-[linear-gradient(90deg,#ef4444_0%,#ef4444_16%,#2563eb_16%,#2563eb_34%,#f8fafc_34%,#f8fafc_40%,#ef4444_40%,#ef4444_58%,#2563eb_58%,#2563eb_76%,#f8fafc_76%,#f8fafc_82%,#ef4444_82%,#ef4444_100%)]"
      aria-hidden="true"
    />
  );
}

function NepalPatternBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.11),transparent_34%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.13),transparent_36%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(248,250,252,0.92))]" />
      <div className="absolute left-[-9%] top-[58px] h-[310px] w-[310px] rounded-full border border-red-100/80 opacity-80" />
      <div className="absolute right-[-10%] top-[138px] h-[410px] w-[410px] rounded-full border border-blue-100/80 opacity-80" />
      <div className="absolute left-[15%] top-[250px] h-44 w-44 rounded-full bg-red-200/15 blur-3xl" />
      <div className="absolute right-[10%] top-[230px] h-56 w-56 rounded-full bg-blue-300/15 blur-3xl" />
      <div className="absolute inset-x-0 top-[430px] h-[300px] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(248,250,252,0.8)_70%,rgba(248,250,252,1)_100%)]" />
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

type LeaderDistrictLike = string | { name?: string } | null | undefined;

type HomeLeaderRecord = LeaderRef & {
  district?: LeaderDistrictLike;
};

function getLeaderDistrictName(district: LeaderDistrictLike) {
  if (!district) return "";
  if (typeof district === "string") return district;
  return district.name || "";
}

function getDistrictScoreKey(name = "") {
  return normalizeDistrictAlias(name).toUpperCase();
}

function SidePanelSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
      <DhakaBorder />
      <div className="space-y-4 p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-28 rounded bg-slate-200" />
          <div className="h-8 w-44 rounded bg-slate-200" />
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-24 rounded-2xl bg-slate-200" />
          <div className="h-16 rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function LowerSectionSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_16px_30px_rgba(15,23,42,0.06)]">
      <DhakaBorder />
      <div className="space-y-4 p-5 animate-pulse">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="h-16 rounded-2xl bg-slate-200" />
          <div className="h-16 rounded-2xl bg-slate-200" />
        </div>
        <div className="h-24 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

function LiveStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "blue" | "red";
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-100 bg-[linear-gradient(180deg,#eff6ff_0%,#dbeafe_100%)]"
      : tone === "red"
      ? "border-red-100 bg-[linear-gradient(180deg,#fef2f2_0%,#fee2e2_100%)]"
      : "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]";

  return (
    <div
      className={`group rounded-[22px] border px-3 py-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(15,23,42,0.08)] md:px-4 md:py-4 ${toneClass}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700 md:text-[11px]">
        {label}
      </p>
      <p className="mt-1.5 text-xl font-extrabold tracking-tight text-slate-950 md:mt-2 md:text-2xl">
        {value}
      </p>
    </div>
  );
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
      className="group relative overflow-hidden rounded-[24px] border border-blue-100 bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_42px_rgba(15,23,42,0.10)] md:rounded-[28px] md:p-5"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-red-500 to-blue-600" />
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-blue-100/30 blur-2xl transition duration-300 group-hover:bg-blue-200/40" />
      <h3 className="relative text-lg font-bold text-slate-950">{title}</h3>
      <p className="relative mt-2 text-sm leading-6 text-slate-700">{text}</p>
      <div className="relative mt-4 inline-flex items-center text-sm font-semibold text-slate-900 transition group-hover:text-blue-700">
        {cta}
      </div>
    </Link>
  );
}

function TrustPill({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
      <span>{text}</span>
    </div>
  );
}

function QuickActionCard({
  title,
  text,
  href,
  badge,
}: {
  title: string;
  text: string;
  href: string;
  badge: string;
}) {
  return (
    <Link
      to={href}
      className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_24px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_38px_rgba(15,23,42,0.10)]"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-red-500 to-blue-600" />
      <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-700">
        {badge}
      </div>
      <h3 className="mt-3 text-lg font-bold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
      <div className="mt-4 text-sm font-semibold text-slate-900 transition group-hover:text-blue-700">
        Explore
      </div>
    </Link>
  );
}

function ProcessStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_28px_rgba(15,23,42,0.05)]">
      <div className="absolute right-[-14px] top-[-14px] flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-lg font-extrabold text-blue-700">
        {number}
      </div>
      <h3 className="text-lg font-bold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 pr-8 text-sm leading-6 text-slate-700">{text}</p>
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

  return (
    <section className="mt-8 overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)] md:rounded-[32px]">
      <DhakaBorder />
      <div className="p-4 md:p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
              {content.featuredProfilesEyebrow}
            </p>
            <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-950 md:text-2xl">
              {content.featuredProfilesTitle}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-700">
              {content.featuredProfilesHelper}
            </p>
          </div>
          {!loading && leaders.length > 0 ? (
            <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <span>{leaders.length}</span>
              <span>{content.featuredProfilesVisibleCount}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-[18px] bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 rounded bg-slate-200" />
                      <div className="h-3 w-16 rounded bg-slate-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : leaders.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {leaders.map((leader, index) => (
                <Link
                  key={leader.leaderId}
                  to={`/leader/${leader.leaderId}`}
                  className={`group rounded-[22px] border p-4 shadow-[0_12px_24px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(15,23,42,0.09)] ${
                    index === 0
                      ? "border-blue-200 bg-[linear-gradient(160deg,#ffffff_0%,#eff6ff_100%)]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {leader.photo ? (
                      <img
                        src={leader.photo}
                        alt={leader.name}
                        className="h-14 w-14 rounded-[18px] border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-blue-50 text-lg font-bold text-blue-700 ring-1 ring-blue-100">
                        {leader.name.charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                        {index === 0
                          ? content.featuredProfilesFeaturedLabel
                          : content.featuredProfilesPublicLabel}
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-base font-bold tracking-tight text-slate-950">
                        {leader.name}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-slate-700">{leader.role}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                    <p className="truncate pr-3 text-xs font-medium text-slate-600">
                      {leader.districtName}
                    </p>
                    <span className="text-sm font-semibold text-slate-900 transition group-hover:text-blue-700">
                      {content.featuredProfilesAction}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-700">
              {content.featuredProfilesEmpty}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

type HeroPreviewItem = {
  districtId: string;
  districtName: string;
  province: string;
  score: number | null;
  leaderName: string;
  liveSignal: string;
  activitySummary: string;
  linkedCount: number;
  accent: "blue" | "red" | "slate";
  markerX: number;
  markerY: number;
};

function getHeroPreviewSignal(score: number | null, linkedCount: number) {
  if (typeof score === "number" && score >= 75) return "Strong public feedback signal";
  if (typeof score === "number" && score >= 50) return "Moderate public feedback visibility";
  if (linkedCount >= 2) return "Linked public profiles available";
  if (linkedCount >= 1) return "Early district visibility on platform";
  return "District public data is still developing";
}

function getHeroPreviewActivity(score: number | null, linkedCount: number, localLevels: number) {
  if (typeof score === "number") {
    return `${localLevels} local levels and ${linkedCount} linked public profile${linkedCount === 1 ? "" : "s"} are listed for this district.`;
  }

  if (linkedCount > 0) {
    return `${linkedCount} linked public profile${linkedCount === 1 ? "" : "s"} and district context are already available.`;
  }

  return `${localLevels} local levels are visible now while district public signals continue to build.`;
}

function getHeroPreviewAccent(score: number | null, linkedCount: number) {
  if (typeof score === "number" && score < 45) return "red" as const;
  if (typeof score === "number" && score >= 70) return "blue" as const;
  if (linkedCount >= 2) return "blue" as const;
  return "slate" as const;
}

function HeroVisual({
  filteredDistrictsCount,
  leaderCount,
  items,
  selectedDistrictId,
  loading,
}: {
  filteredDistrictsCount: number;
  leaderCount: number;
  items: HeroPreviewItem[];
  selectedDistrictId?: string;
  loading: boolean;
}) {
  const [rotatingIndex, setRotatingIndex] = useState(0);

  const selectedIndex = useMemo(() => {
    if (!selectedDistrictId) return -1;
    return items.findIndex((item) => item.districtId === selectedDistrictId);
  }, [items, selectedDistrictId]);

  useEffect(() => {
    if (items.length <= 1 || selectedIndex >= 0) return;

    const intervalId = window.setInterval(() => {
      setRotatingIndex((current) => (current + 1) % items.length);
    }, 5200);

    return () => window.clearInterval(intervalId);
  }, [items.length, selectedIndex]);

  const activeIndex =
    selectedIndex >= 0 ? selectedIndex : Math.min(rotatingIndex, Math.max(items.length - 1, 0));

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-[24px] border border-blue-100 bg-white p-4 shadow-[0_16px_34px_rgba(15,23,42,0.08)] md:rounded-[30px]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-red-500 to-blue-600" />
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="h-5 w-32 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="h-[230px] animate-pulse rounded-[18px] bg-slate-200" />
        </div>
      </div>
    );
  }

  const activeItem = items[activeIndex] || null;

  if (!activeItem) {
    return (
      <div className="relative overflow-hidden rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-3 shadow-[0_16px_34px_rgba(15,23,42,0.10)] md:rounded-[30px] md:p-4">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-red-500 to-blue-600" />
        <div className="rounded-[22px] border border-blue-100 bg-white p-3 shadow-sm md:rounded-[26px] md:p-4">
          <div className="rounded-[20px] border border-slate-900 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] p-4 text-white shadow-[0_18px_32px_rgba(15,23,42,0.16)] md:rounded-[24px] md:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              Live civic stats
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Explore the interactive map to reveal district-level public feedback, linked
              representatives, and local context.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const accent =
    activeItem.accent === "blue"
      ? {
          scoreCard: "border-blue-100 bg-blue-50/70 text-blue-700",
          bar: "bg-[linear-gradient(90deg,#2563eb_0%,#0f766e_100%)]",
        }
      : activeItem.accent === "slate"
      ? {
          scoreCard: "border-slate-200 bg-slate-100 text-slate-700",
          bar: "bg-[linear-gradient(90deg,#94a3b8_0%,#cbd5e1_100%)]",
        }
      : {
          scoreCard: "border-red-100 bg-red-50/70 text-red-700",
          bar: "bg-[linear-gradient(90deg,#ef4444_0%,#2563eb_100%)]",
        };

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-blue-100 bg-white p-4 shadow-[0_18px_38px_rgba(15,23,42,0.10)] md:rounded-[32px]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-red-500 to-blue-600" />
      <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-blue-100/30 blur-3xl" />

      <div className="relative space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
              Live civic stats
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Public feedback, visibility, and representative signals updated from the map.
            </p>
          </div>
          <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {filteredDistrictsCount} districts visible
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              District snapshot
            </p>
            <h3 className="mt-2 text-xl font-bold text-slate-950">{activeItem.districtName}</h3>
            <p className="text-sm text-slate-600">{activeItem.province}</p>

            <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Public feedback score</span>
              <span>
                {typeof activeItem.score === "number" ? `${activeItem.score}/100` : "Not rated"}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div
                className={`h-full rounded-full ${accent.bar}`}
                style={{
                  width:
                    typeof activeItem.score === "number"
                      ? `${Math.max(8, Math.min(activeItem.score, 100))}%`
                      : "18%",
                }}
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
                <p className="font-semibold text-slate-900">{leaderCount}+</p>
                <p>Leader profiles</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
                <p className="font-semibold text-slate-900">{activeItem.linkedCount}</p>
                <p>Linked profiles</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
                <p className="font-semibold text-slate-900">{filteredDistrictsCount}</p>
                <p>Visible districts</p>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-blue-100 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Public representatives
            </p>
            <div className="mt-3 flex items-start gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${accent.scoreCard}`}
              >
                <span className="text-base font-bold">{activeItem.leaderName.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold text-slate-950">
                  {activeItem.leaderName}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {activeItem.liveSignal}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3">
              <p className="text-sm leading-6 text-slate-700">
                {activeItem.activitySummary}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileStickyActions({
  primaryCta,
  secondaryCta,
}: {
  primaryCta: string;
  secondaryCta: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-3 z-40 block px-3 md:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur">
        <a
          href="#district-map"
          className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
        >
          {primaryCta}
        </a>
        <Link
          to="/ranking"
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-900"
        >
          {secondaryCta}
        </Link>
      </div>
    </div>
  );
}

function Home() {
  const { section } = useLanguage();
  const text = section("home");

  const lastTrackedDistrictRef = useRef("");
  const lastTrackedSearchRef = useRef("");

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

const districtPayload = districtRes as
  | DistrictInfo[]
  | { rows?: DistrictInfo[]; districts?: DistrictInfo[] };

const leaderPayload = leaderRes as
  | HomeLeaderRecord[]
  | { rows?: HomeLeaderRecord[]; leaders?: HomeLeaderRecord[] };

const districtItems = Array.isArray(districtPayload)
  ? districtPayload
  : districtPayload.rows || districtPayload.districts || [];

const leaderItems = Array.isArray(leaderPayload)
  ? leaderPayload
  : leaderPayload.rows || leaderPayload.leaders || [];

        const normalized = districtItems.map((district: DistrictInfo) => {
          const districtKey = normalizeDistrictAlias(district.name);

          const relatedLeaders = leaderItems.filter((leader: HomeLeaderRecord) => {
            const leaderDistrictName = getLeaderDistrictName(leader.district);
            return normalizeDistrictAlias(leaderDistrictName) === districtKey;
          });

          return {
            ...district,
            localLevels: Array.isArray(district.localLevels) ? district.localLevels : [],
            mpLeader: relatedLeaders.find((leader: HomeLeaderRecord) => leader.role === "MP") || null,
            ministerLeader:
              relatedLeaders.find((leader: HomeLeaderRecord) => leader.role === "Minister") ||
              relatedLeaders.find((leader: HomeLeaderRecord) => leader.role === "Prime Minister") ||
              null,
            mayorLeader:
              relatedLeaders.find((leader: HomeLeaderRecord) => leader.role === "Mayor") ||
              relatedLeaders.find((leader: HomeLeaderRecord) => leader.role === "Chairperson") ||
              null,
            naLeaders: relatedLeaders.filter(
              (leader: HomeLeaderRecord) => leader.role === "National Assembly Member"
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

  const filteredDistricts = useMemo(() => {
    return districts.filter((district) => {
      const matchProvince =
        selectedProvince === "ALL" || district.province === selectedProvince;

      const query = debouncedSearchText.trim().toLowerCase();
      const matchSearch =
        !query ||
        district.name.toLowerCase().includes(query) ||
        district.province.toLowerCase().includes(query);

      return matchProvince && matchSearch;
    });
  }, [districts, selectedProvince, debouncedSearchText]);

  const filteredDistrictsCount = filteredDistricts.length;

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

      candidates.forEach((leader: LeaderRef) => {
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

  const heroPreviewItems = useMemo<HeroPreviewItem[]>(() => {
    const markerPositions = [
      { x: 172, y: 124 },
      { x: 138, y: 118 },
      { x: 226, y: 108 },
      { x: 286, y: 92 },
      { x: 180, y: 128 },
    ];

    return districts
      .map((district, index) => {
        const linkedLeaders = [
          district.mayorLeader,
          district.mpLeader,
          district.ministerLeader,
          ...(Array.isArray(district.naLeaders) ? district.naLeaders : []),
        ].filter(Boolean);

        const score =
          typeof district.satisfactionScore === "number" ? district.satisfactionScore : null;
        const linkedCount = linkedLeaders.length;
        const completeness =
          (score !== null ? 2 : 0) +
          (district.mayorLeader?.leaderId ? 3 : 0) +
          (district.mpLeader?.leaderId ? 2 : 0) +
          (district.ministerLeader?.leaderId ? 2 : 0) +
          (linkedCount > 0 ? 1 : 0);

        const marker = markerPositions[index % markerPositions.length];
        const leaderName =
          district.mayorLeader?.name ||
          district.mpLeader?.name ||
          district.ministerLeader?.name ||
          linkedLeaders[0]?.name ||
          district.name;

        return {
          districtId: district.districtId,
          districtName: district.name,
          province: district.province,
          score,
          leaderName,
          liveSignal: getHeroPreviewSignal(score, linkedCount),
          activitySummary: getHeroPreviewActivity(
            score,
            linkedCount,
            district.localLevels?.length || 0
          ),
          linkedCount,
          accent: getHeroPreviewAccent(score, linkedCount),
          markerX: marker.x,
          markerY: marker.y,
          completeness,
        };
      })
      .filter((item) => item.score !== null || item.linkedCount > 0)
      .sort((a, b) => b.completeness - a.completeness)
      .slice(0, 5)
      .map((item) => ({
        districtId: item.districtId,
        districtName: item.districtName,
        province: item.province,
        score: item.score,
        leaderName: item.leaderName,
        liveSignal: item.liveSignal,
        activitySummary: item.activitySummary,
        linkedCount: item.linkedCount,
        accent: item.accent,
        markerX: item.markerX,
        markerY: item.markerY,
      }));
  }, [districts]);

  const trustPills = [
    "Public district discovery",
    "Representative visibility",
    "Citizen feedback signals",
    "Independent civic experience",
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <NepalPatternBackdrop />
      <Navbar />
      <MobileStickyActions primaryCta={text.primaryCta} secondaryCta={text.secondaryCta} />

      <main className="relative z-10 mx-auto max-w-[1480px] px-3 py-3 pb-28 md:px-5 md:py-5 md:pb-6">
        <section className="rounded-[30px] border border-blue-100 bg-white/95 p-4 shadow-[0_22px_48px_rgba(15,23,42,0.10)] backdrop-blur-sm md:rounded-[36px] md:p-6">
          <div className="grid items-start gap-5 xl:grid-cols-[1.05fr_0.95fr] xl:gap-7">
            <div className="max-w-3xl pt-0.5">
              <div className="inline-flex rounded-full border border-red-100 bg-red-50/80 px-3 py-1 text-[11px] font-semibold text-red-600 shadow-sm">
                {text.heroBadge}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {trustPills.map((pill) => (
                  <TrustPill key={pill} text={pill} />
                ))}
              </div>

              <h1 className="mt-4 max-w-4xl bg-[linear-gradient(180deg,#020617_0%,#0f172a_42%,#1d4ed8_100%)] bg-clip-text text-[2rem] font-extrabold tracking-tight text-transparent sm:text-[2.35rem] md:mt-5 md:text-5xl xl:text-[4.3rem] xl:leading-[0.98]">
                {text.heroTitle}
              </h1>

              <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-700 md:mt-4 md:text-[1.1rem] md:leading-8">
                {text.heroSupportLine}
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                Search any district to see local leaders, public feedback, and civic activity
                signals in one clear place. Built to help citizens discover information faster,
                compare what matters, and take action with confidence.
              </p>

              <div className="mt-5 max-w-2xl rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-2.5 shadow-[0_16px_34px_rgba(15,23,42,0.08)] md:mt-6 md:rounded-[28px] md:p-3">
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <input
                    type="search"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder={text.heroSearchPlaceholder}
                    className="h-12 flex-1 rounded-2xl border border-blue-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 md:h-14"
                  />
                  <NepalAnchorButton
                    href="#district-map"
                    className="min-h-[48px] justify-center whitespace-nowrap px-5 text-sm shadow-[0_14px_24px_rgba(15,23,42,0.14)] md:min-h-[54px] md:px-6"
                  >
                    {text.primaryCta}
                  </NepalAnchorButton>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2.5 md:mt-5 md:gap-3">
                <NepalActionLink to="/ranking" tone="secondary">
                  {text.secondaryCta}
                </NepalActionLink>
                <NepalActionLink to="/support" tone="secondary">
                  Report or correct information
                </NepalActionLink>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <QuickActionCard
                  badge="Search"
                  title="Explore districts"
                  text="Find your district and see the key public signals available today."
                  href="#district-map"
                />
                <QuickActionCard
                  badge="Rankings"
                  title="Compare leaders"
                  text="Open leader rankings and compare profiles, visibility, and public engagement."
                  href="/ranking"
                />
                <QuickActionCard
                  badge="Support"
                  title="Report an issue"
                  text="Submit corrections, contact support, or raise a civic issue quickly."
                  href="/support"
                />
              </div>
            </div>

            <HeroVisual
              filteredDistrictsCount={loadingDistricts ? 0 : filteredDistrictsCount}
              leaderCount={loadingDistricts ? 0 : leaderCount}
              items={heroPreviewItems}
              selectedDistrictId={selectedDistrict?.districtId}
              loading={loadingDistricts}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 md:mt-6 md:grid-cols-4 md:gap-3">
            <LiveStat label={text.liveStatsUpdated} value={new Date().toLocaleDateString()} />
            <LiveStat
              label={text.liveStatsDistricts}
              value={String(filteredDistrictsCount)}
              tone="blue"
            />
            <LiveStat label={text.liveStatsProfiles} value={`${leaderCount}+`} />
            <LiveStat
              label={text.liveStatsSignals}
              value={String(Object.keys(districtScores).length)}
              tone="red"
            />
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
              How it works
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              A simpler way to understand what is happening in your district
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Najar Nepal helps people move from confusion to clarity by turning scattered local
              information into a searchable, explorable civic experience.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
            <ProcessStep
              number="1"
              title="Search your district"
              text="Use the map and search tools to find your district quickly and see the public information already available."
            />
            <ProcessStep
              number="2"
              title="Review leaders and signals"
              text="Open district insights, representative profiles, and public feedback signals without jumping across many pages."
            />
            <ProcessStep
              number="3"
              title="Take action"
              text="Rate district experience, compare profiles, and submit corrections or support requests when information needs attention."
            />
          </div>
        </section>

        <section className="mt-8 md:mt-10">
          <div id="district-map">
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
              summarySlot={
                <Suspense fallback={<SidePanelSkeleton />}>
                  <SelectedDistrictPanel district={selectedDistrict} embedded />
                </Suspense>
              }
            />
          </div>
        </section>

        <section id="district-insights" className="mt-8 md:mt-10">
          <div className="mb-3 md:mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              {text.lowerSectionTitle}
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-700">
              {text.lowerSectionText}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-5">
            <div>
              <div className="mb-2.5">
                <h3 className="text-lg font-bold tracking-tight text-slate-950 md:text-xl">
                  {text.feedbackTitle}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-700">{text.feedbackText}</p>
              </div>

              <Suspense fallback={<LowerSectionSkeleton />}>
                <DistrictFeedbackSection
                  district={selectedDistrict}
                  onScoreSaved={handleDistrictScoreSave}
                />
              </Suspense>
            </div>

            <div>
              <div className="mb-2.5">
                <h3 className="text-lg font-bold tracking-tight text-slate-950 md:text-xl">
                  {text.districtDetailsTitle}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {text.districtDetailsText}
                </p>
              </div>

              <Suspense fallback={<LowerSectionSkeleton />}>
                <DistrictDetailsSection district={selectedDistrict} />
              </Suspense>
            </div>
          </div>
        </section>

        <FeaturedLeadersPanel leaders={featuredLeaders} loading={loadingDistricts} />

        <section className="mt-8 overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)] md:rounded-[32px]">
          <DhakaBorder />
          <div className="grid gap-5 p-4 md:p-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
                Trust and transparency
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                Built for clarity, not noise
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                The goal is to help citizens discover district and leader information in a way that
                feels understandable, fast, and useful. Public feedback, district visibility, and
                representative context are surfaced together so people can spend less time searching
                and more time understanding.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">District-first navigation</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Search, map exploration, and province filters are all centered on helping people
                  reach the right local context quickly.
                </p>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">Representative visibility</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Linked leader profiles help connect district information with the people who
                  represent those communities.
                </p>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">Public feedback signals</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  District feedback creates an easier way to understand public sentiment at a
                  glance.
                </p>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">Action-oriented support</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Support, corrections, and issue reporting are kept accessible so the platform can
                  improve over time.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 md:mt-10">
          <div className="mb-3 md:mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              {text.exploreMoreTitle}
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-700">
              {text.exploreMoreText}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
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

      <Footer />
    </div>
  );
}

export default Home;
