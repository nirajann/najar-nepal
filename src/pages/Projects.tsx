import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { NepalActionButton } from "../components/NepalDesignSystem";
import ProjectDetailModal from "../components/ProjectDetailModal";
import { api } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
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
  if (status === "BROKEN" || daysText.includes("overdue")) return "high";
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
        threshold: 0.16,
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

function Projects() {
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
        const nextProjects = (Array.isArray(res) ? res : res?.projects || []).map(
          normalizeProjectRecord
        );
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
      const matchesStatus =
        statusFilter === "ALL" ? true : item.status === statusFilter;

      const q = searchText.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.titleNp.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });

    if (sortBy === "updated") {
      return [...filtered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }

    if (sortBy === "urgent") {
      return [...filtered].sort((a, b) => {
        const aOverdue = a.daysText.includes("overdue") || a.daysText.includes("ढिला");
        const bOverdue = b.daysText.includes("overdue") || b.daysText.includes("ढिला");
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        return a.daysText.localeCompare(b.daysText);
      });
    }

    return filtered;
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
            projects.reduce((sum, item) => sum + (typeof item.progress === "number" ? item.progress : 0), 0) /
              total
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
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <section
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8"
          style={{
            opacity: headerReady ? 1 : 0,
            transform: headerReady ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 520ms ease, transform 520ms ease",
          }}
        >
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-2">
                {text.title}
              </h1>
              <p className="text-slate-500 text-base md:text-lg">
                {text.subtitle}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-sm text-slate-500">{text.overallProgress}</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                <CountUpValue value={trackerSummary.overallProgress} start={headerReady} />%
              </p>
            </div>
          </div>

          <div
            ref={statsRef}
            className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
          >
            <SummaryCard label={text.total} value={trackerSummary.total} index={0} start={statsReady} />
            <SummaryCard label={text.completed} value={trackerSummary.completed} index={1} start={statsReady} />
            <SummaryCard label={text.inProgress} value={trackerSummary.inProgress} index={2} start={statsReady} />
            <SummaryCard label={text.broken} value={trackerSummary.broken} index={3} start={statsReady} />
            <SummaryCard label={text.stalled} value={trackerSummary.stalled} index={4} start={statsReady} />
            <SummaryCard label={text.notStarted} value={trackerSummary.notStarted} index={5} start={statsReady} />
          </div>

          <div ref={progressRef} className="mt-6">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>{text.nationalCommitmentProgress}</span>
              <span>
                <CountUpValue value={trackerSummary.overallProgress} start={progressReady} />%
              </span>
            </div>
            <div className="h-4 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{
                  width: progressReady ? `${trackerSummary.overallProgress}%` : "0%",
                  transition: "width 900ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            </div>
          </div>
        </section>

        <RevealSection
          delay={40}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8"
        >
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-5">
            {text.trackingSystem}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
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
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8"
        >
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-5">
                {text.progressByCategory}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryProgress.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex justify-between gap-3 mb-2">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">
                    {item.done}/{item.total}
                  </p>
                </div>

                <p className="text-sm text-slate-500 mb-3">{item.percent}{text.completeSuffix}</p>

                <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{
                      width: progressReady ? `${item.percent}%` : "0%",
                      transition: "width 820ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </RevealSection>

        <RevealSection
          delay={100}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8"
        >
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {text.trackCommitments}
              </h2>
              <p className="text-slate-500 mt-1">
                {text.trackBody}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
              {text.showing} <span className="font-bold text-slate-900">{filteredProjects.length}</span> {text.items}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <FilterButton active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}>
                {text.filterAll}
              </FilterButton>
              <FilterButton
                active={statusFilter === "NOT_STARTED"}
                onClick={() => setStatusFilter("NOT_STARTED")}
              >
                {text.filterNotStarted}
              </FilterButton>
              <FilterButton
                active={statusFilter === "IN_PROGRESS"}
                onClick={() => setStatusFilter("IN_PROGRESS")}
              >
                {text.filterInProgress}
              </FilterButton>
              <FilterButton
                active={statusFilter === "COMPLETED"}
                onClick={() => setStatusFilter("COMPLETED")}
              >
                {text.filterCompleted}
              </FilterButton>
              <FilterButton
                active={statusFilter === "BROKEN"}
                onClick={() => setStatusFilter("BROKEN")}
              >
                {text.filterBroken}
              </FilterButton>
              <FilterButton
                active={statusFilter === "STALLED"}
                onClick={() => setStatusFilter("STALLED")}
              >
                {text.filterStalled}
              </FilterButton>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">{text.sortDefault}</option>
              <option value="urgent">{text.sortUrgent}</option>
              <option value="updated">{text.sortUpdated}</option>
            </select>
          </div>

          <input
            type="text"
            placeholder={text.searchPlaceholder}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full mb-6 rounded-2xl border border-slate-300 px-5 py-4 text-base outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`project-skeleton-${index}`}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
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
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => setSelectedProject(project)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
              {text.noMatch}
            </div>
          )}
        </RevealSection>
      </main>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
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
}: {
  label: string;
  value: string | number;
  index: number;
  start: boolean;
}) {
  const numericValue = typeof value === "number" ? value : Number(value) || 0;

  return (
    <div
      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
      style={{
        opacity: start ? 1 : 0,
        transform: start ? "translateY(0)" : "translateY(14px)",
        transition: `opacity 420ms ease ${index * 70}ms, transform 420ms ease ${index * 70}ms`,
      }}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 mt-1">
        <CountUpValue value={numericValue} start={start} />
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${dotClass}`} />
        <span className="font-bold text-blue-700">{label}</span>
      </div>
      <p className="text-slate-600 text-sm">{description}</p>
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
      className="min-h-[44px] px-5 py-3 font-semibold"
    >
      {children}
    </NepalActionButton>
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

  return (
    <button
      onClick={onClick}
      className="text-left rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md w-full"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-sm text-slate-500">{project.id}</p>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{project.category}</h3>
        </div>

        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusStyle.badge}`}>
          {statusStyle.label}
        </span>
      </div>

      <p className="font-semibold text-slate-900 mb-2">{project.titleNp}</p>
      <p className="text-slate-600 mb-4">{project.titleEn}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            project.priority === "high"
              ? "bg-red-100 text-red-700"
              : project.priority === "medium"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {(project.priority || "medium").toUpperCase()} PRIORITY
        </span>

        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          {project.daysText}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3">
          <p className="text-slate-500">Updated</p>
          <p className="font-semibold text-slate-900 mt-1">{project.updatedAt}</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3">
          <p className="text-slate-500">Source</p>
          <p className="font-semibold text-slate-900 mt-1">
            {project.source || "No source yet"}
          </p>
        </div>
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

export default Projects;
