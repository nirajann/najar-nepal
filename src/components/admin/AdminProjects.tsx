import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

type ProjectItem = {
  projectId: string;
  title: string;
  titleNp?: string;
  category?: string;
  district?: string;
  province?: string;
  leaderId?: string;
  status: "Not Started" | "In Progress" | "Completed" | "Broken" | "Stalled";
  progress?: number;
  deadline?: string;
  lastUpdated?: string;
  summary?: string;
  evidenceText?: string;
  whatIsThis?: string;
  impactOnPeople?: string;
  whyNeeded?: string;
  sourceName?: string;
  sourceUrl?: string;
};

const emptyForm: ProjectItem = {
  projectId: "",
  title: "",
  titleNp: "",
  category: "",
  district: "",
  province: "",
  leaderId: "",
  status: "Not Started",
  progress: 0,
  deadline: "",
  lastUpdated: "",
  summary: "",
  evidenceText: "",
  whatIsThis: "",
  impactOnPeople: "",
  whyNeeded: "",
  sourceName: "",
  sourceUrl: "",
};

function slugifyProjectId(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function AdminProjects() {
  const { token } = useAuth();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [form, setForm] = useState<ProjectItem>(emptyForm);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminProjects({ search });
      setProjects(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setMessage(error.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (!editingId && form.title) {
      setForm((prev) => ({
        ...prev,
        projectId: slugifyProjectId(prev.title),
      }));
    }
  }, [form.title, editingId]);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();

    return projects.filter(
      (project) =>
        project.title.toLowerCase().includes(q) ||
        (project.category || "").toLowerCase().includes(q) ||
        (project.district || "").toLowerCase().includes(q) ||
        (project.province || "").toLowerCase().includes(q) ||
        (project.status || "").toLowerCase().includes(q)
    );
  }, [projects, search]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "progress" ? Number(value) : value,
    }));
  };

  const handleEdit = (project: ProjectItem) => {
    setEditingId(project.projectId);
    setForm({
      ...emptyForm,
      ...project,
    });
    setShowDetails(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setShowDetails(false);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage("Login required");
      return;
    }

    try {
      const payload = {
        ...form,
        titleNp: form.titleNp || undefined,
        category: form.category || undefined,
        district: form.district || undefined,
        province: form.province || undefined,
        leaderId: form.leaderId || undefined,
        deadline: form.deadline || undefined,
        lastUpdated: form.lastUpdated || undefined,
        summary: form.summary || undefined,
        evidenceText: form.evidenceText || undefined,
        whatIsThis: form.whatIsThis || undefined,
        impactOnPeople: form.impactOnPeople || undefined,
        whyNeeded: form.whyNeeded || undefined,
        sourceName: form.sourceName || undefined,
        sourceUrl: form.sourceUrl || undefined,
      };

      if (editingId) {
        const res = await api.updateAdminProject(token, editingId, payload);
        setMessage(res.message || "Project updated");
      } else {
        const res = await api.createAdminProject(token, payload);
        setMessage(res.message || "Project created");
      }

      resetForm();
      await loadProjects();
    } catch (error: any) {
      setMessage(error.message || "Failed to save project");
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!token) {
      setMessage("Login required");
      return;
    }

    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) return;

    try {
      const res = await api.deleteAdminProject(token, projectId);
      setMessage(res.message || "Project deleted");
      await loadProjects();
    } catch (error: any) {
      setMessage(error.message || "Failed to delete project");
    }
  };

  return (
    <AdminLayout
      title="Projects Management"
      description="Create and update tracker items more easily"
    >
      {message && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {editingId ? "Edit Project" : "Quick Create Project"}
              </h2>
              <p className="text-slate-500 mt-1">Start with core details first</p>
            </div>

            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="rounded-2xl bg-white border border-slate-300 px-4 py-2 font-semibold text-slate-700"
            >
              {showDetails ? "Hide Details" : "More Details"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Title" name="title" value={form.title} onChange={handleChange} />
            <Input label="Project ID" name="projectId" value={form.projectId} onChange={handleChange} />
            <Input label="Category" name="category" value={form.category || ""} onChange={handleChange} />
            <Select
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={["Not Started", "In Progress", "Completed", "Broken", "Stalled"]}
            />
            <Input label="District" name="district" value={form.district || ""} onChange={handleChange} />
            <Input label="Province" name="province" value={form.province || ""} onChange={handleChange} />
            <Input label="Deadline" name="deadline" value={form.deadline || ""} onChange={handleChange} />
            <Input label="Last Updated" name="lastUpdated" value={form.lastUpdated || ""} onChange={handleChange} />
            <Input label="Progress %" name="progress" type="number" value={form.progress ?? 0} onChange={handleChange} />

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Summary</label>
              <textarea
                name="summary"
                value={form.summary || ""}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {showDetails && (
            <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Title Nepali" name="titleNp" value={form.titleNp || ""} onChange={handleChange} />
              <Input label="Leader ID" name="leaderId" value={form.leaderId || ""} onChange={handleChange} />

              <div className="md:col-span-2">
                <TextArea label="Evidence Text" name="evidenceText" value={form.evidenceText || ""} onChange={handleChange} />
              </div>
              <div className="md:col-span-2">
                <TextArea label="What Is This?" name="whatIsThis" value={form.whatIsThis || ""} onChange={handleChange} />
              </div>
              <div className="md:col-span-2">
                <TextArea label="Impact On People" name="impactOnPeople" value={form.impactOnPeople || ""} onChange={handleChange} />
              </div>
              <div className="md:col-span-2">
                <TextArea label="Why Needed" name="whyNeeded" value={form.whyNeeded || ""} onChange={handleChange} />
              </div>

              <Input label="Source Name" name="sourceName" value={form.sourceName || ""} onChange={handleChange} />
              <Input label="Source URL" name="sourceUrl" value={form.sourceUrl || ""} onChange={handleChange} />
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 transition"
            >
              {editingId ? "Update Project" : "Create Project"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl bg-slate-200 px-5 py-3 text-slate-800 font-semibold hover:bg-slate-300 transition"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      <div className="mb-5">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
          Loading projects...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.projectId} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-semibold text-slate-900">{project.title}</td>
                  <td className="px-4 py-3">{project.category || "—"}</td>
                  <td className="px-4 py-3">{project.district || "—"}</td>
                  <td className="px-4 py-3">{project.status}</td>
                  <td className="px-4 py-3">{project.progress ?? 0}%</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(project)}
                        className="rounded-xl bg-blue-100 px-3 py-2 text-blue-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project.projectId)}
                        className="rounded-xl bg-red-100 px-3 py-2 text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No projects found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function Select({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export default AdminProjects;