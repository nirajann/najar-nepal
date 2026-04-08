import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import AdminPageSection from "./AdminPageSection";
import AdminToolbar from "./AdminToolbar";
import AdminFormCard from "./AdminFormCard";
import AdminDataTable from "./AdminDataTable";

type ProjectRecord = {
  _id?: string;
  projectId?: string;
  title?: string;
  name?: string;
  district?: string;
  province?: string;
  status?: string;
  category?: string;
  budget?: number | string;
  progress?: number;
  description?: string;
  source?: string;
  createdAt?: string;
};

type DuplicateProject = {
  _id?: string;
  projectId?: string;
  title?: string;
  district?: string;
  province?: string;
  status?: string;
};

type DuplicateCheckResponse = {
  exists: boolean;
  matches?: DuplicateProject[];
  message?: string;
};

type ProjectForm = {
  projectId: string;
  title: string;
  district: string;
  province: string;
  category: string;
  status: string;
  budget: string;
  progress: string;
  description: string;
  source: string;
};

const initialForm: ProjectForm = {
  projectId: "",
  title: "",
  district: "",
  province: "",
  category: "",
  status: "Not Started",
  budget: "",
  progress: "0",
  description: "",
  source: "",
};

function getProjectTitle(project: ProjectRecord) {
  return project.title || project.name || "Untitled Project";
}

function AdminProjects() {
  const { token } = useAuth();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(initialForm);

  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResponse | null>(null);

  const debouncedTitle = useDebouncedValue(form.title, 450);

  const statusOptions = [
    "Not Started",
    "In Progress",
    "Completed",
    "Stalled",
    "Broken",
  ];

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const res = await api.getAdminProjects(token);

      setProjects(Array.isArray(res) ? res : res?.projects || []);
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void loadProjects();
  }, [loadProjects, token]);

  useEffect(() => {
    const runDuplicateCheck = async () => {
      if (editingProjectId) {
        setDuplicateInfo(null);
        return;
      }

      if (!debouncedTitle.trim()) {
        setDuplicateInfo(null);
        return;
      }

      if (!api.checkProjectDuplicate || !token) {
        setDuplicateInfo(null);
        return;
      }

      try {
        setDuplicateLoading(true);

        const res = await api.checkProjectDuplicate(token, {
          title: debouncedTitle.trim(),
          district: form.district || undefined,
          province: form.province || undefined,
        });

        setDuplicateInfo(res || null);
      } catch {
        setDuplicateInfo(null);
      } finally {
        setDuplicateLoading(false);
      }
    };

    runDuplicateCheck();
  }, [debouncedTitle, form.district, form.province, editingProjectId, token]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const q = searchText.trim().toLowerCase();

      const title = getProjectTitle(project).toLowerCase();
      const district = (project.district || "").toLowerCase();
      const province = (project.province || "").toLowerCase();
      const category = (project.category || "").toLowerCase();
      const status = (project.status || "").toLowerCase();

      const matchesSearch =
        !q ||
        title.includes(q) ||
        district.includes(q) ||
        province.includes(q) ||
        category.includes(q) ||
        status.includes(q);

      const matchesStatus =
        selectedStatus === "ALL" || project.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchText, selectedStatus]);

  const handleChange = <K extends keyof ProjectForm>(
    key: K,
    value: ProjectForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingProjectId(null);
    setDuplicateInfo(null);
    setMessage("");
    setError("");
  };

  const handleEdit = (project: ProjectRecord) => {
    setEditingProjectId(project.projectId || project._id || null);
    setDuplicateInfo(null);
    setMessage("");
    setError("");

    setForm({
      projectId: project.projectId || "",
      title: getProjectTitle(project),
      district: project.district || "",
      province: project.province || "",
      category: project.category || "",
      status: project.status || "Not Started",
      budget:
        project.budget !== undefined && project.budget !== null
          ? String(project.budget)
          : "",
      progress:
        project.progress !== undefined && project.progress !== null
          ? String(project.progress)
          : "0",
      description: project.description || "",
      source: project.source || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildPayload = () => ({
    projectId: form.projectId.trim(),
    title: form.title.trim(),
    district: form.district.trim(),
    province: form.province.trim(),
    category: form.category.trim(),
    status: form.status,
    budget: form.budget ? Number(form.budget) : 0,
    progress: form.progress ? Number(form.progress) : 0,
    description: form.description.trim(),
    source: form.source.trim(),
  });

  const handleSubmit = async () => {
    if (!token) {
      setError("Please login as admin first.");
      return;
    }

    if (!form.title.trim()) {
      setError("Project title is required.");
      return;
    }

    if (!editingProjectId && duplicateInfo?.exists) {
      setError("A similar project already exists. Check the suggestions before saving.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const payload = buildPayload();

      if (editingProjectId) {
        const res = await api.updateAdminProject(token, editingProjectId, payload);
        setMessage(res.message || "Project updated successfully");
      } else {
        const res = await api.createAdminProject(token, payload);
        setMessage(res.message || "Project created successfully");
      }

      resetForm();
      await loadProjects();
    } catch (err: any) {
      setError(err.message || "Failed to save project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!token) {
      setError("Please login as admin first.");
      return;
    }

    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) return;

    try {
      const res = await api.deleteAdminProject(token, projectId);
      setMessage(res.message || "Project deleted successfully");

      if (editingProjectId === projectId) {
        resetForm();
      }

      await loadProjects();
    } catch (err: any) {
      setError(err.message || "Failed to delete project");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track public projects and keep structured project data clean
        </p>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <AdminPageSection
        title="Projects Directory"
        description="Search project records, filter by status, and manage entries cleanly."
      >
        <AdminToolbar
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="Search by title, district, province, category, or status..."
          primaryActionLabel={editingProjectId ? "Cancel Edit" : "New Entry"}
          onPrimaryAction={resetForm}
          secondarySlot={
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              <option value="ALL">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          }
        />
      </AdminPageSection>

      <AdminFormCard
        title={editingProjectId ? "Edit Project" : "Add Project"}
        subtitle="Save structured project data to backend and avoid duplicates before submit."
        actions={
          <>
            <button
              onClick={handleSubmit}
              disabled={submitting || (!editingProjectId && !!duplicateInfo?.exists)}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting
                ? editingProjectId
                  ? "Updating..."
                  : "Saving..."
                : editingProjectId
                ? "Update Project"
                : "Save Project"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Reset
            </button>
          </>
        }
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Project Title</label>
          <input
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Project title"
          />
          {duplicateLoading ? (
            <p className="mt-2 text-xs text-slate-500">Checking similar projects...</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Project ID</label>
          <input
            value={form.projectId}
            onChange={(e) => handleChange("projectId", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Optional custom ID"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">District</label>
          <input
            value={form.district}
            onChange={(e) => handleChange("district", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="District"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Province</label>
          <input
            value={form.province}
            onChange={(e) => handleChange("province", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Province"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
          <input
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Road, water, education, health..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
          <select
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Budget</label>
          <input
            value={form.budget}
            onChange={(e) => handleChange("budget", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Budget amount"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Progress (%)</label>
          <input
            value={form.progress}
            onChange={(e) => handleChange("progress", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="0 - 100"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Source / Reference</label>
          <input
            value={form.source}
            onChange={(e) => handleChange("source", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Source link or reference"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={6}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Project description"
          />
        </div>

        {!editingProjectId && duplicateInfo?.exists ? (
          <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">
              Similar project already exists in database
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Check these records before creating a duplicate.
            </p>

            <div className="mt-3 space-y-2">
              {(duplicateInfo.matches || []).map((item, index) => (
                <button
                  key={item.projectId || item._id || index}
                  type="button"
                  onClick={() =>
                    handleEdit({
                      projectId: item.projectId,
                      title: item.title,
                      district: item.district,
                      province: item.province,
                      status: item.status,
                    })
                  }
                  className="block w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-left"
                >
                  <p className="font-semibold text-slate-900">
                    {item.title || "Untitled Project"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.district || "No district"} • {item.province || "No province"} •{" "}
                    {item.status || "No status"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </AdminFormCard>

      <AdminDataTable
        title="Project Records"
        subtitle={`Showing ${filteredProjects.length} project records`}
        rows={filteredProjects}
        emptyMessage={loading ? "Loading projects..." : "No projects found."}
        columns={[
          {
            key: "title",
            header: "Project",
            render: (row) => (
              <div>
                <p className="font-semibold text-slate-900">{getProjectTitle(row)}</p>
                <p className="text-xs text-slate-500">
                  {row.projectId || row._id || "No ID"}
                </p>
              </div>
            ),
          },
          {
            key: "location",
            header: "Location",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-900">{row.district || "—"}</p>
                <p className="text-xs text-slate-500">{row.province || "—"}</p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-900">{row.status || "—"}</p>
                <p className="text-xs text-slate-500">
                  Progress: {row.progress ?? 0}%
                </p>
              </div>
            ),
          },
          {
            key: "budget",
            header: "Budget / Category",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-900">
                  {row.budget !== undefined && row.budget !== null ? row.budget : "—"}
                </p>
                <p className="text-xs text-slate-500">{row.category || "—"}</p>
              </div>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleEdit(row)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(row.projectId || row._id || "")}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
                  disabled={!row.projectId && !row._id}
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

export default AdminProjects;
