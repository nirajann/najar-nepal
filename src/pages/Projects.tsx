import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import ProjectDetailModal from "../components/ProjectDetailModal";
import {
  categoryProgress,
  projectItems,
  trackerSummary,
  type ProjectItem,
  type ProjectStatus,
} from "../data/projectsTrackerData";

type FilterStatus = "ALL" | ProjectStatus;
type SortType = "default" | "urgent" | "updated";

function Projects() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("default");
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  const filteredProjects = useMemo(() => {
    const filtered = projectItems.filter((item) => {
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
  }, [statusFilter, searchText, sortBy]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-2">
                Public Projects Tracker
              </h1>
              <p className="text-slate-500 text-base md:text-lg">
                Easy public dashboard to track commitments, progress, delays, and accountability
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-sm text-slate-500">Overall Progress</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                {trackerSummary.overallProgress}%
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <SummaryCard label="Total" value={trackerSummary.total} />
            <SummaryCard label="Completed" value={trackerSummary.completed} />
            <SummaryCard label="In Progress" value={trackerSummary.inProgress} />
            <SummaryCard label="Broken" value={trackerSummary.broken} />
            <SummaryCard label="Stalled" value={trackerSummary.stalled} />
            <SummaryCard label="Not Started" value={trackerSummary.notStarted} />
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>National commitment progress</span>
              <span>{trackerSummary.overallProgress}%</span>
            </div>
            <div className="h-4 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${trackerSummary.overallProgress}%` }}
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-5">
            Tracking System
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
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-5">
            Progress by Category
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

                <p className="text-sm text-slate-500 mb-3">{item.percent}% complete</p>

                <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                Track Commitments
              </h2>
              <p className="text-slate-500 mt-1">
                Click any promise to open full details, evidence, and public impact
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
              Showing <span className="font-bold text-slate-900">{filteredProjects.length}</span> items
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <FilterButton active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}>
                All
              </FilterButton>
              <FilterButton
                active={statusFilter === "NOT_STARTED"}
                onClick={() => setStatusFilter("NOT_STARTED")}
              >
                Not Started
              </FilterButton>
              <FilterButton
                active={statusFilter === "IN_PROGRESS"}
                onClick={() => setStatusFilter("IN_PROGRESS")}
              >
                In Progress
              </FilterButton>
              <FilterButton
                active={statusFilter === "COMPLETED"}
                onClick={() => setStatusFilter("COMPLETED")}
              >
                Completed
              </FilterButton>
              <FilterButton
                active={statusFilter === "BROKEN"}
                onClick={() => setStatusFilter("BROKEN")}
              >
                Broken
              </FilterButton>
              <FilterButton
                active={statusFilter === "STALLED"}
                onClick={() => setStatusFilter("STALLED")}
              >
                Stalled
              </FilterButton>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">Sort: Default</option>
              <option value="urgent">Sort: Urgent / Overdue</option>
              <option value="updated">Sort: Recently Updated</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Search by ID, category, Nepali title, or English title..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full mb-6 rounded-2xl border border-slate-300 px-5 py-4 text-base outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
        </section>
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

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
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
    <button
      onClick={onClick}
      className={`px-5 py-3 rounded-full font-semibold transition ${
        active
          ? "bg-blue-600 text-white shadow"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
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
      className="text-left rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md w-full"
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