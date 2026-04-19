import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { NepalActionButton } from "../components/NepalDesignSystem";
import ProjectDetailModal from "../components/ProjectDetailModal";
import { api } from "../services/api";
import { useLanguage } from "../context/useLanguage";

type ProjectStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "BROKEN"
  | "STALLED";

type ProjectItem = {
  id: string;
  category: string;
  titleNp: string;
  titleEn: string;
  status: ProjectStatus;
  daysText: string;
  source?: string;
  updatedAt: string;
  priority?: "low" | "medium" | "high";
  progressSummary?: string;
  evidenceText?: string;
  whatIsThis?: string;
  impactOnPeople?: string;
  whyNeeded?: string;
  dueDate?: string;
  district?: string;
  province?: string;
  progress?: number;
  sources?: Array<{
    sourceName?: string;
    title?: string;
    url?: string;
    publishedAt?: string | null;
    summary?: string;
    note?: string;
  }>;
};

type FilterStatus = "ALL" | ProjectStatus;
type SortType = "default" | "urgent" | "updated";

function toProjectStatus(value?: string): ProjectStatus {
  if (value === "IN_PROGRESS") return "IN_PROGRESS";
  if (value === "COMPLETED") return "COMPLETED";
  if (value === "BROKEN") return "BROKEN";
  if (value === "STALLED") return "STALLED";
  return "NOT_STARTED";
}

function getPriority(progress: number, status: ProjectStatus, daysText: string) {
  const text = (daysText || "").toLowerCase();
  if (status === "BROKEN" || text.includes("overdue") || text.includes("delay")) return "high";
  if (status === "IN_PROGRESS" || progress >= 40) return "medium";
  return "low";
}

function normalizeProjectRecord(raw: any): ProjectItem {
  const status = toProjectStatus(raw?.status);
  const progress = typeof raw?.progress === "number" ? raw.progress : 0;
  const updatedAt = raw?.updatedAt || raw?.lastUpdated || "";
  const dueDate =
    typeof raw?.dueDate === "string"
      ? raw.dueDate
      : raw?.dueDate
      ? new Date(raw.dueDate).toISOString().slice(0, 10)
      : "";

  return {
    id: raw?.id || raw?.projectId || "",
    category: raw?.category || "General",
    titleNp: raw?.titleNp || raw?.title || "",
    titleEn: raw?.titleEn || raw?.title || "",
    status,
    daysText: raw?.daysText || "No deadline",
    source: raw?.source || raw?.sourceName || "",
    updatedAt,
    priority: getPriority(progress, status, raw?.daysText || ""),
    progressSummary: raw?.progressSummary || raw?.summary || raw?.description || "",
    evidenceText: raw?.evidenceText || "",
    whatIsThis: raw?.whatIsThis || "",
    impactOnPeople: raw?.impactOnPeople || "",
    whyNeeded: raw?.whyNeeded || "",
    dueDate,
    district: raw?.district || "",
    province: raw?.province || "",
    progress,
    sources: Array.isArray(raw?.sources) ? raw.sources : [],
  };
}

function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isVisible]);

  return { ref, isVisible };
}

function useCountUp(target: number, start: boolean, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;

    let frameId = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [duration, start, target]);

  return start ? value : 0;
}

function RevealSection({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, isVisible } = useInViewOnce<HTMLElement>();

  return (
    <section
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 520ms ease ${delay}ms, transform 520ms ease ${delay}ms`,
      }}
    >
      {children}
    </section>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_28%,#f4f7fb_100%)]">
      <Navbar />
      <main className="mx-auto max-w-[1380px] px-4 py-4 md:px-6 md:py-6">{children}</main>
      <Footer />
    </div>
  );
}

function CountUpValue({ value, start }: { value: number; start: boolean }) {
  const displayValue = useCountUp(value, start);
  return <>{displayValue}</>;
}

function SummaryCard({
  label,
  value,
  index,
  start,
  tone = "default",
}: {
  label: string;
  value: number;
  index: number;
  start: boolean;
  tone?: "default" | "blue" | "green" | "red" | "yellow";
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-100 bg-blue-50/80"
      : tone === "green"
      ? "border-emerald-100 bg-emerald-50/80"
      : tone === "red"
      ? "border-red-100 bg-red-50/80"
      : tone === "yellow"
      ? "border-amber-100 bg-amber-50/80"
      : "border-slate-200 bg-slate-50/90";

  return (
    <div
      className={`rounded-2xl border px-4 py-4 shadow-sm ${toneClass}`}
      style={{
        opacity: start ? 1 : 0,
        transform: start ? "translateY(0)" : "translateY(14px)",
        transition: `opacity 420ms ease ${index * 70}ms, transform 420ms ease ${index * 70}ms`,
      }}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">
        <CountUpValue value={value} start={start} />
      </p>
    </div>
  );
}

function StatusGuideCard({
  label,
  description,
  dotClass,
}: {
  label: string;
  description: string;
  dotClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
        <span className="font-bold text-slate-900">{label}</span>
      </div>
      <p className="text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <NepalActionButton
      onClick={onClick}
      tone={active ? "primary" : "secondary"}
      className="min-h-[42px] shrink-0 px-4 py-2 text-sm font-semibold"
    >
      {children}
    </NepalActionButton>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`project-skeleton-${index}`}
          className="rounded-[28px] border border-blue-100/70 bg-white p-5"
        >
          <div className="animate-pulse space-y-4">
            <div className="flex justify-between gap-4">
              <div className="space-y-2">
                <div className="h-3 w-16 rounded bg-slate-200" />
                <div className="h-6 w-40 rounded bg-slate-200" />
              </div>
              <div className="h-8 w-28 rounded-full bg-slate-200" />
            </div>
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 rounded-2xl bg-slate-200" />
              <div className="h-16 rounded-2xl bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HeroInsight({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{helper}</p>
    </div>
  );
}

function ProgressStrip({ value }: { value: number }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#ef4444_0%,#2563eb_40%,#16a34a_100%)] transition-[width] duration-1000 ease-out"
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
}

function ProjectCard({
  project,
  onClick,
}: {
  project: ProjectItem;
  onClick: () => void;
}) {
  const statusStyle = getStatusStyle(project.status);
  const progress = typeof project.progress === "number" ? project.progress : 0;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-[28px] border border-blue-100/80 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)]"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {project.id || "PROJECT"}
          </p>
          <h3 className="mt-2 text-xl font-extrabold tracking-tight text-slate-950">
            {project.category}
          </h3>
        </div>

        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle.badge}`}>
          {statusStyle.label}
        </span>
      </div>

      <p className="line-clamp-2 font-semibold text-slate-950">{project.titleNp}</p>
      <p className="mt-1 line-clamp-2 text-slate-600">{project.titleEn}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            project.priority === "high"
              ? "bg-red-100 text-red-700"
              : project.priority === "medium"
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {(project.priority || "medium").toUpperCase()} PRIORITY
        </span>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {project.daysText}
        </span>

        {project.province ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {project.province}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
          <span>Progress</span>
          <span className="font-semibold text-slate-900">{progress}%</span>
        </div>
        <ProgressStrip value={progress} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-slate-500">Updated</p>
          <p className="mt-1 font-semibold text-slate-900">{project.updatedAt || "Unknown"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-slate-500">Source</p>
          <p className="mt-1 font-semibold text-slate-900">
            {project.source || "No source yet"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
        <p className="line-clamp-2 text-sm leading-6 text-slate-700">
          {project.progressSummary || "Open the project to view details, evidence, and public impact."}
        </p>
      </div>

      <div className="mt-4 inline-flex items-center text-sm font-semibold text-blue-700 transition group-hover:text-blue-800">
        Open details
      </div>
    </button>
  );
}

function getStatusStyle(status: ProjectStatus) {
  if (status === "NOT_STARTED") {
    return {
      label: "NOT STARTED",
      badge: "bg-slate-200 text-slate-700",
    };
  }

  if (status === "IN_PROGRESS") {
    return {
      label: "IN PROGRESS",
      badge: "bg-blue-100 text-blue-700",
    };
  }

  if (status === "COMPLETED") {
    return {
      label: "COMPLETED",
      badge: "bg-green-100 text-green-700",
    };
  }

  if (status === "BROKEN") {
    return {
      label: "BROKEN",
      badge: "bg-red-100 text-red-700",
    };
  }

  return {
    label: "STALLED",
    badge: "bg-yellow-100 text-yellow-700",
  };
}

export default function Projects() {
  const { section } = useLanguage();
  const text = section("projects");

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("default");
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [headerReady, setHeaderReady] = useState(false);
  const [statsReady, setStatsReady] = useState(false);
  const [progressReady, setProgressReady] = useState(false);

  const statsRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const trackedProjectRef = useRef("");
  const trackedSearchRef = useRef("");

  useEffect(() => {
    const id = window.setTimeout(() => setHeaderReady(true), 40);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError("");

       const res = await api.getProjects();
const payload = res as ProjectItem[] | { rows?: ProjectItem[]; projects?: ProjectItem[] };

const nextProjects = (
  Array.isArray(payload) ? payload : payload.rows || payload.projects || []
).map(normalizeProjectRecord);

        setProjects(nextProjects);
      } catch (loadError: any) {
        setProjects([]);
        setError(loadError.message || text.loadFailed);
      } finally {
        setLoading(false);
      }
    };

    void loadProjects();
  }, [text.loadFailed]);

  useEffect(() => {
    const node = statsRef.current;
    if (!node || statsReady) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsReady(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [statsReady]);

  useEffect(() => {
    const node = progressRef.current;
    if (!node || progressReady) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setProgressReady(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [progressReady]);

  useEffect(() => {
    if (!selectedProject?.id) return;
    if (trackedProjectRef.current === selectedProject.id) return;

    trackedProjectRef.current = selectedProject.id;

    void api.trackEvent({
      eventName: "project_viewed",
      entityType: "project",
      entityId: selectedProject.id,
      entityName: selectedProject.titleEn,
      sourcePage: "projects",
      metadata: {
        category: selectedProject.category,
        status: selectedProject.status,
      },
    });
  }, [selectedProject]);

  useEffect(() => {
    const query = searchText.trim();
    if (query.length < 2) return;
    if (trackedSearchRef.current === query.toLowerCase()) return;

    trackedSearchRef.current = query.toLowerCase();

    void api.trackEvent({
      eventName: "search_used",
      entityType: "project",
      entityId: "projects-search",
      entityName: "Projects search",
      sourcePage: "projects",
      metadata: {
        queryLength: query.length,
        statusFilter,
        sortBy,
      },
    });
  }, [searchText, sortBy, statusFilter]);

  const filteredProjects = useMemo(() => {
    const filtered = projects.filter((item) => {
      const matchesStatus = statusFilter === "ALL" ? true : item.status === statusFilter;

      const q = searchText.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.titleNp.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.district || "").toLowerCase().includes(q) ||
        (item.province || "").toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });

    if (sortBy === "updated") {
      return [...filtered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }

    if (sortBy === "urgent") {
      return [...filtered].sort((a, b) => {
        const aOverdue = a.daysText.toLowerCase().includes("overdue") || a.priority === "high";
        const bOverdue = b.daysText.toLowerCase().includes("overdue") || b.priority === "high";
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        return (b.progress || 0) - (a.progress || 0);
      });
    }

    return [...filtered].sort((a, b) => (b.progress || 0) - (a.progress || 0));
  }, [projects, statusFilter, searchText, sortBy]);

  const trackerSummary = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter((item) => item.status === "COMPLETED").length;
    const inProgress = projects.filter((item) => item.status === "IN_PROGRESS").length;
    const broken = projects.filter((item) => item.status === "BROKEN").length;
    const stalled = projects.filter((item) => item.status === "STALLED").length;
    const notStarted = projects.filter((item) => item.status === "NOT_STARTED").length;
    const overallProgress =
      total > 0
        ? Math.round(
            projects.reduce(
              (sum, item) => sum + (typeof item.progress === "number" ? item.progress : 0),
              0
            ) / total
          )
        : 0;

    return {
      total,
      completed,
      inProgress,
      broken,
      stalled,
      notStarted,
      overallProgress,
    };
  }, [projects]);

  const categoryProgress = useMemo(() => {
    const map = new Map<string, { name: string; done: number; total: number; percent: number }>();

    projects.forEach((project) => {
      const key = project.category || "General";
      const current = map.get(key) || { name: key, done: 0, total: 0, percent: 0 };
      current.total += 1;
      if (project.status === "COMPLETED") current.done += 1;
      map.set(key, current);
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        percent: item.total > 0 ? Math.round((item.done / item.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [projects]);

  return (
    <PageShell>
      <section
        className="rounded-[30px] border border-blue-100/80 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-6"
        style={{
          opacity: headerReady ? 1 : 0,
          transform: headerReady ? "translateY(0)" : "translateY(18px)",
          transition: "opacity 520ms ease, transform 520ms ease",
        }}
      >
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
              Public accountability view
            </div>

            <h1 className="mt-3 bg-[linear-gradient(180deg,#020617_0%,#0f172a_42%,#1d4ed8_100%)] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-6xl">
              {text.title}
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              {text.subtitle}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <HeroInsight
                label="Visible projects"
                value={String(trackerSummary.total)}
                helper="Projects currently shown in the public tracker."
              />
              <HeroInsight
                label="Overall progress"
                value={`${trackerSummary.overallProgress}%`}
                helper="Average visible progress across the current tracker."
              />
              <HeroInsight
                label="Most active state"
                value={
                  trackerSummary.inProgress >= trackerSummary.completed
                    ? "In progress"
                    : "Completed"
                }
                helper="The status currently most visible across listed items."
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{text.overallProgress}</p>
                <p className="mt-1 text-4xl font-extrabold text-slate-950">
                  <CountUpValue value={trackerSummary.overallProgress} start={headerReady} />%
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Visible now
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-950">
                  {filteredProjects.length}
                </p>
              </div>
            </div>

            <div ref={progressRef} className="mt-5">
              <div className="mb-2 flex justify-between text-sm text-slate-600">
                <span>{text.nationalCommitmentProgress}</span>
                <span>
                  <CountUpValue value={trackerSummary.overallProgress} start={progressReady} />%
                </span>
              </div>
              <ProgressStrip value={progressReady ? trackerSummary.overallProgress : 0} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3">
                <p className="text-sm text-slate-500">{text.completed}</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{trackerSummary.completed}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3">
                <p className="text-sm text-slate-500">{text.inProgress}</p>
                <p className="mt-1 text-2xl font-bold text-blue-700">{trackerSummary.inProgress}</p>
              </div>
            </div>
          </div>
        </div>

        <div ref={statsRef} className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <SummaryCard label={text.total} value={trackerSummary.total} index={0} start={statsReady} />
          <SummaryCard label={text.completed} value={trackerSummary.completed} index={1} start={statsReady} tone="green" />
          <SummaryCard label={text.inProgress} value={trackerSummary.inProgress} index={2} start={statsReady} tone="blue" />
          <SummaryCard label={text.broken} value={trackerSummary.broken} index={3} start={statsReady} tone="red" />
          <SummaryCard label={text.stalled} value={trackerSummary.stalled} index={4} start={statsReady} tone="yellow" />
          <SummaryCard label={text.notStarted} value={trackerSummary.notStarted} index={5} start={statsReady} />
        </div>
      </section>

      <RevealSection
        delay={40}
        className="mt-6 rounded-[30px] border border-blue-100/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.06)] md:p-6"
      >
        <div className="mb-5">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
            {text.trackingSystem}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Project status is grouped into clear public states so users can understand what is moving, what is blocked, and what still has not begun.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatusGuideCard
            label="NOT STARTED"
            description="सरकारले कुनै कदम चालेको छैन"
            dotClass="bg-slate-400"
          />
          <StatusGuideCard
            label="IN PROGRESS"
            description="कार्यान्वयन प्रक्रिया सुरु भएको"
            dotClass="bg-blue-500"
          />
          <StatusGuideCard
            label="COMPLETED"
            description="प्रतिबद्धता पूर्ण रूपमा पूरा भएको"
            dotClass="bg-green-500"
          />
          <StatusGuideCard
            label="BROKEN"
            description="समयसीमा नाघ्यो वा त्यागियो"
            dotClass="bg-red-500"
          />
          <StatusGuideCard
            label="STALLED"
            description="प्रगति रोकिएको"
            dotClass="bg-yellow-500"
          />
        </div>
      </RevealSection>

      <RevealSection
        delay={70}
        className="mt-6 rounded-[30px] border border-blue-100/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.06)] md:p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
              {text.progressByCategory}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Compare which categories have the strongest visible completion rate.
            </p>
          </div>
          <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 md:inline-flex">
            {categoryProgress.length} categories
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {categoryProgress.map((item) => (
            <div
              key={item.name}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-2 flex justify-between gap-3">
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">
                  {item.done}/{item.total}
                </p>
              </div>

              <p className="mb-3 text-sm text-slate-500">
                {item.percent}
                {text.completeSuffix}
              </p>

              <ProgressStrip value={progressReady ? item.percent : 0} />
            </div>
          ))}
        </div>
      </RevealSection>

      <RevealSection
        delay={100}
        className="mt-6 rounded-[30px] border border-blue-100/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.06)] md:p-6"
      >
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
              {text.trackCommitments}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {text.trackBody}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
            {text.showing}{" "}
            <span className="font-bold text-slate-900">{filteredProjects.length}</span>{" "}
            {text.items}
          </div>
        </div>

        <div className="rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-3 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <input
              type="text"
              placeholder={text.searchPlaceholder}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-12 w-full rounded-2xl border border-blue-100 px-4 text-sm outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 xl:max-w-sm"
            />

            <div className="flex gap-2 overflow-x-auto pb-1 xl:flex-1">
              <FilterButton active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}>
                {text.filterAll}
              </FilterButton>
              <FilterButton active={statusFilter === "NOT_STARTED"} onClick={() => setStatusFilter("NOT_STARTED")}>
                {text.filterNotStarted}
              </FilterButton>
              <FilterButton active={statusFilter === "IN_PROGRESS"} onClick={() => setStatusFilter("IN_PROGRESS")}>
                {text.filterInProgress}
              </FilterButton>
              <FilterButton active={statusFilter === "COMPLETED"} onClick={() => setStatusFilter("COMPLETED")}>
                {text.filterCompleted}
              </FilterButton>
              <FilterButton active={statusFilter === "BROKEN"} onClick={() => setStatusFilter("BROKEN")}>
                {text.filterBroken}
              </FilterButton>
              <FilterButton active={statusFilter === "STALLED"} onClick={() => setStatusFilter("STALLED")}>
                {text.filterStalled}
              </FilterButton>
            </div>

            <div className="flex gap-2 xl:ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="h-12 rounded-2xl border border-blue-100 px-4 text-sm font-medium outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="default">{text.sortDefault}</option>
                <option value="urgent">{text.sortUrgent}</option>
                <option value="updated">{text.sortUpdated}</option>
              </select>

              {(statusFilter !== "ALL" || searchText.trim()) && (
                <NepalActionButton
                  onClick={() => {
                    setStatusFilter("ALL");
                    setSearchText("");
                    setSortBy("default");
                  }}
                  tone="secondary"
                  className="min-h-[42px] px-4 py-2 text-sm"
                >
                  Reset
                </NepalActionButton>
              )}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : loading ? (
          <div className="mt-6">
            <ProjectsSkeleton />
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-600">
            {text.noMatch}
          </div>
        )}
      </RevealSection>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </PageShell>
  );
}