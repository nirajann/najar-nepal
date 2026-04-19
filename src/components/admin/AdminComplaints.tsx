import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type ComplaintItem } from "../../services/api";
import { useAuth } from "../../context/useAuth";
import AdminPageSection from "./AdminPageSection";
import AdminToolbar from "./AdminToolbar";
import AdminFormCard from "./AdminFormCard";
import AdminDataTable from "./AdminDataTable";

type ComplaintRecord = ComplaintItem;

type ComplaintUpdateForm = {
  status: string;
  adminNote: string;
};

const initialUpdateForm: ComplaintUpdateForm = {
  status: "Pending",
  adminNote: "",
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function getLeaderName(item: ComplaintRecord) {
  return item.leader?.name || item.leaderId || "Unknown leader";
}

function getUserName(item: ComplaintRecord) {
  return item.user?.name || item.user?.email || "Anonymous";
}

function StatusBadge({ status }: { status?: string }) {
  const value = status || "Pending";

  const styles =
    value === "Resolved"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : value === "Rejected"
      ? "bg-red-50 text-red-700 border-red-200"
      : value === "Investigating"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}>
      {value}
    </span>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function AdminComplaints() {
  const { token, authReady } = useAuth();

  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");

  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null);
  const [updateForm, setUpdateForm] = useState<ComplaintUpdateForm>(initialUpdateForm);

  const loadComplaints = useCallback(async () => {
    if (!token) {
      setComplaints([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.getAdminComplaints(token, {
        search: searchText || undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        complaintType: selectedType !== "ALL" ? selectedType : undefined,
      });

      const payload =
        res as ComplaintItem[] | { rows?: ComplaintItem[]; complaints?: ComplaintItem[] };
      const items = Array.isArray(payload)
        ? payload
        : payload.rows || payload.complaints || [];

      setComplaints(items);

      if (selectedComplaint?._id) {
        const freshSelected = items.find(
          (item: ComplaintRecord) => item._id === selectedComplaint._id
        );
        if (freshSelected) {
          setSelectedComplaint(freshSelected);
          setUpdateForm({
            status: freshSelected.status || "Pending",
            adminNote: "",
          });
        }
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load complaints"));
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [searchText, selectedComplaint?._id, selectedStatus, selectedType, token]);

  useEffect(() => {
    if (!authReady) return;
    if (!token) return;
    void loadComplaints();
  }, [authReady, loadComplaints, token]);

  const filteredComplaints = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    return complaints.filter((item) => {
      const complaintText = (item.text || "").toLowerCase();
      const complaintType = (item.complaintType || "").toLowerCase();
      const status = (item.status || "").toLowerCase();
      const leaderName = getLeaderName(item).toLowerCase();
      const userName = getUserName(item).toLowerCase();

      const matchesSearch =
        !q ||
        complaintText.includes(q) ||
        complaintType.includes(q) ||
        status.includes(q) ||
        leaderName.includes(q) ||
        userName.includes(q);

      const matchesStatus =
        selectedStatus === "ALL" || item.status === selectedStatus;

      const matchesType =
        selectedType === "ALL" || item.complaintType === selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [complaints, searchText, selectedStatus, selectedType]);

  const complaintTypeOptions = useMemo(() => {
    const values = new Set<string>();
    complaints.forEach((item) => {
      if (item.complaintType) values.add(item.complaintType);
    });
    return Array.from(values);
  }, [complaints]);

  const handleSelectComplaint = (item: ComplaintRecord) => {
    setSelectedComplaint(item);
    setUpdateForm({
      status: item.status || "Pending",
      adminNote: "",
    });
    setMessage("");
    setError("");
  };

  const handleRefresh = async () => {
    await loadComplaints();
  };

  const handleUpdateComplaint = async () => {
    if (!token || !selectedComplaint?._id) {
      setError("Complaint not selected.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const res = await api.updateAdminComplaint(token, selectedComplaint._id, {
        status: updateForm.status,
        adminNote: updateForm.adminNote,
      });

      setMessage(res.message || "Complaint updated successfully");
      await loadComplaints();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update complaint"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    if (!token) {
      setError("Please login as admin first.");
      return;
    }

    const confirmed = window.confirm("Delete this complaint?");
    if (!confirmed) return;

    try {
      const res = await api.deleteAdminComplaint(token, complaintId);
      setMessage(res.message || "Complaint deleted successfully");

      if (selectedComplaint?._id === complaintId) {
        setSelectedComplaint(null);
        setUpdateForm(initialUpdateForm);
      }

      await loadComplaints();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete complaint"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Complaints</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review complaint records, investigate issues, and manage resolution status
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
        title="Complaints Directory"
        description="Search complaints from the website and filter by status or complaint type."
        rightSlot={
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
        }
      >
        <AdminToolbar
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="Search by leader, user, complaint type, or text..."
          secondarySlot={
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Investigating">Investigating</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              >
                <option value="ALL">All Types</option>
                {complaintTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          }
        />
      </AdminPageSection>

      {filteredComplaints.length === 0 && !loading ? (
        <EmptyState
          title="No complaints found"
          description="When users submit complaints, they will appear here for review."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                Complaint Records
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredComplaints.length} complaint records
              </p>
            </div>

            <div className="px-5 py-5">
              <AdminDataTable
                title=""
                subtitle=""
                rows={filteredComplaints}
                emptyMessage={loading ? "Loading complaints..." : "No complaints found."}
                columns={[
                  {
                    key: "leader",
                    header: "Leader",
                    render: (row) => (
                      <button
                        type="button"
                        onClick={() => handleSelectComplaint(row)}
                        className="flex items-center gap-3 text-left"
                      >
                        {row.leader?.photo ? (
                          <img
                            src={row.leader.photo}
                            alt={getLeaderName(row)}
                            className="h-10 w-10 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-2xl bg-slate-200" />
                        )}

                        <div>
                          <p className="font-semibold text-slate-900">
                            {getLeaderName(row)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {row.leader?.role || row.complaintType || "Complaint"}
                          </p>
                        </div>
                      </button>
                    ),
                  },
                  {
                    key: "complaint",
                    header: "Complaint",
                    render: (row) => (
                      <div>
                        <p className="max-w-[320px] truncate font-medium text-slate-900">
                          {row.text || "No complaint text"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {row.complaintType || "General"}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: "user",
                    header: "User",
                    render: (row) => (
                      <div>
                        <p className="font-medium text-slate-900">{getUserName(row)}</p>
                        <p className="text-xs text-slate-500">
                          {row.user?.email || "No email"}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (row) => <StatusBadge status={row.status} />,
                  },
                  {
                    key: "date",
                    header: "Date",
                    render: (row) => (
                      <p className="text-sm text-slate-700">{formatDate(row.createdAt)}</p>
                    ),
                  },
                  {
                    key: "actions",
                    header: "Actions",
                    render: (row) => (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectComplaint(row)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComplaint(row._id || "")}
                          disabled={!row._id}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </section>

          <div className="space-y-6">
            <AdminFormCard
              title="Complaint Details"
              subtitle={
                selectedComplaint
                  ? "Review complaint details and update investigation status"
                  : "Select a complaint from the table to review details"
              }
              actions={
                selectedComplaint ? (
                  <>
                    <button
                      type="button"
                      onClick={handleUpdateComplaint}
                      disabled={saving}
                      className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Update"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedComplaint(null);
                        setUpdateForm(initialUpdateForm);
                      }}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                    >
                      Close
                    </button>
                  </>
                ) : null
              }
            >
              {selectedComplaint ? (
                <>
                  <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Complaint text
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-800">
                      {selectedComplaint.text || "No complaint text"}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Leader
                    </label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
                      {getLeaderName(selectedComplaint)}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      User
                    </label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
                      {getUserName(selectedComplaint)}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Complaint Type
                    </label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
                      {selectedComplaint.complaintType || "General"}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Submitted
                    </label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
                      {formatDate(selectedComplaint.createdAt)}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Status
                    </label>
                    <select
                      value={updateForm.status}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({ ...prev, status: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Investigating">Investigating</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Evidence Photo
                    </label>
                    {selectedComplaint.complaintPhoto ? (
                      <a
                        href={selectedComplaint.complaintPhoto}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-blue-600 hover:underline"
                      >
                        Open complaint photo
                      </a>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        No photo attached
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Admin Note
                    </label>
                    <textarea
                      rows={4}
                      value={updateForm.adminNote}
                      onChange={(e) =>
                        setUpdateForm((prev) => ({ ...prev, adminNote: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                      placeholder="Write investigation note or action taken..."
                    />
                  </div>
                </>
              ) : (
                <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Select a complaint record from the table to inspect it here.
                </div>
              )}
            </AdminFormCard>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminComplaints;
