type ProjectSource = {
  sourceName?: string;
  title?: string;
  url?: string;
  publishedAt?: string | null;
  summary?: string;
  note?: string;
};

type ProjectItem = {
  id: string;
  category: string;
  titleNp: string;
  titleEn: string;
  status: string;
  daysText: string;
  source?: string;
  updatedAt: string;
  priority?: string;
  progressSummary?: string;
  evidenceText?: string;
  whatIsThis?: string;
  impactOnPeople?: string;
  whyNeeded?: string;
  dueDate?: string;
  sources?: ProjectSource[];
};

type Props = {
  project: ProjectItem | null;
  onClose: () => void;
};

function ProjectDetailModal({ project, onClose }: Props) {
  if (!project) return null;

  const statusStyle = getStatusStyle(project.status);

const fallbackSources: ProjectSource[] =
  project.source
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({
      sourceName: item,
      title: item,
      summary: "Source linked to this tracked commitment.",
      url: "",
      publishedAt: null,
      note: "",
    })) || [];

const sources: ProjectSource[] =
  project.sources && project.sources.length > 0
    ? project.sources
    : fallbackSources;


  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-[2rem] bg-white border border-slate-200 shadow-2xl">
        <div className="flex items-center justify-between gap-4 px-5 md:px-7 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {project.id}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle.badge}`}>
                {statusStyle.label}
              </span>
              <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                {project.daysText}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 truncate">
              Project Detail
            </h2>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xl font-bold transition"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(92vh-78px)] px-5 md:px-7 py-6 space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
            <p className="text-sm font-semibold text-blue-700 mb-2">{project.category}</p>
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight">
              {project.titleNp}
            </h1>
            <p className="text-slate-600 text-base md:text-lg mt-3">{project.titleEn}</p>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickFact label="Category" value={project.category} />
            <QuickFact label="Deadline" value={project.dueDate || project.daysText} />
            <QuickFact label="Status" value={statusStyle.label} />
            <QuickFact label="Last Updated" value={project.updatedAt} />
          </section>

          {(project.progressSummary || project.evidenceText) && (
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Current Progress</h3>
              {project.progressSummary && (
                <p className="text-slate-700 leading-8">{project.progressSummary}</p>
              )}
              {project.evidenceText && (
                <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-500 mb-2">Evidence</p>
                  <p className="text-slate-700 leading-7">{project.evidenceText}</p>
                </div>
              )}
            </section>
          )}

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Sources</h3>

            {sources.length > 0 ? (
              <div className="space-y-4">
                {sources.map((source, index) => (
                  <div
                    key={`${source.sourceName || "source"}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                        {source.sourceName || "Source"}
                      </span>
                      {source.publishedAt && (
                        <span className="text-xs text-slate-500">
                          {source.publishedAt}
                        </span>
                      )}
                    </div>

                    <p className="font-semibold text-slate-900">
                      {source.title || source.sourceName || "Untitled Source"}
                    </p>

                    {(source.summary || source.note) && (
                      <p className="text-slate-600 mt-2 leading-7">
                        {source.summary || source.note}
                      </p>
                    )}

                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-3 text-sm font-semibold text-blue-700 hover:underline"
                      >
                        Open source
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No sources added yet.</p>
            )}
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard
              title="What is this?"
              content={
                project.whatIsThis ||
                "This commitment explains what the promise means in practical and policy terms."
              }
              accent="blue"
            />

            <InfoCard
              title="Impact on People"
              content={
                project.impactOnPeople ||
                "This section explains how citizens, local governments, or public services may be affected."
              }
              accent="green"
            />

            <InfoCard
              title="Why is this needed?"
              content={
                project.whyNeeded ||
                "This section explains the accountability gap or public need behind the commitment."
              }
              accent="blue"
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function QuickFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-base md:text-lg font-bold text-slate-900 mt-2">{value}</p>
    </div>
  );
}

function InfoCard({
  title,
  content,
  accent,
}: {
  title: string;
  content: string;
  accent: "blue" | "green";
}) {
  const accentClass =
    accent === "green" ? "border-l-4 border-green-500" : "border-l-4 border-blue-500";

  return (
    <div className={`rounded-3xl border border-slate-200 bg-slate-50 p-5 ${accentClass}`}>
      <p className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-3">
        {title}
      </p>
      <p className="text-slate-700 leading-8">{content}</p>
    </div>
  );
}

function getStatusStyle(status: string) {
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

export default ProjectDetailModal;