import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  type DuplicateCheckResponse as ApiDuplicateCheckResponse,
  type GenericListResponse,
  type VerificationDocumentsResponse,
} from "../../services/api";
import { useAuth } from "../../context/useAuth";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import AdminPageSection from "./AdminPageSection";
import AdminToolbar from "./AdminToolbar";
import AdminFormCard from "./AdminFormCard";
import AdminDataTable from "./AdminDataTable";

type UserRecord = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  verificationStatus?: string;
  badges?: string[];
  createdAt?: string;
};

type DuplicateUser = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
};

type DuplicateCheckResponse = ApiDuplicateCheckResponse<DuplicateUser>;

type UserForm = {
  name: string;
  email: string;
  role: string;
  verificationStatus: string;
  badgesText: string;
};

const initialForm: UserForm = {
  name: "",
  email: "",
  role: "user",
  verificationStatus: "unverified",
  badgesText: "",
};

type ReviewDocumentUrls = {
  front: string;
  back: string;
  selfie: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function AdminUsers() {
  const { token } = useAuth();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedVerification, setSelectedVerification] = useState("ALL");

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(initialForm);
  const [selectedReviewUser, setSelectedReviewUser] = useState<UserRecord | null>(null);
  const [reviewDocuments, setReviewDocuments] = useState<VerificationDocumentsResponse | null>(
    null
  );
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewDocumentUrls, setReviewDocumentUrls] = useState<ReviewDocumentUrls>({
    front: "",
    back: "",
    selfie: "",
  });

  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResponse | null>(null);

  const debouncedEmail = useDebouncedValue(form.email, 450);

  useEffect(() => {
    return () => {
      Object.values(reviewDocumentUrls).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [reviewDocumentUrls]);

  const loadUsers = useCallback(async () => {
    if (!token) {
      setError("Please login as admin first.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.getAdminUsers(token, {
        search: searchText || undefined,
      });
      const payload = res as UserRecord[] | GenericListResponse<UserRecord>;
      const items = Array.isArray(payload) ? payload : payload.rows || payload.users || [];
      setUsers(items);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load users"));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchText, token]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const runDuplicateCheck = async () => {
      if (editingUserId) {
        setDuplicateInfo(null);
        return;
      }

      if (!debouncedEmail.trim()) {
        setDuplicateInfo(null);
        return;
      }

      if (!api.checkUserDuplicate) {
        setDuplicateInfo(null);
        return;
      }

      try {
        setDuplicateLoading(true);

        const res = await api.checkUserDuplicate({
          email: debouncedEmail.trim(),
        });

        setDuplicateInfo((res as DuplicateCheckResponse) || null);
      } catch {
        setDuplicateInfo(null);
      } finally {
        setDuplicateLoading(false);
      }
    };

    runDuplicateCheck();
  }, [debouncedEmail, editingUserId]);

  const filteredUsers = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    return users.filter((user) => {
      const name = (user.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const role = (user.role || "").toLowerCase();
      const verification = (user.verificationStatus || "").toLowerCase();

      const searchMatch =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        role.includes(q) ||
        verification.includes(q);

      const roleMatch = selectedRole === "ALL" || user.role === selectedRole;
      const verificationMatch =
        selectedVerification === "ALL" ||
        user.verificationStatus === selectedVerification;

      return searchMatch && roleMatch && verificationMatch;
    });
  }, [users, searchText, selectedRole, selectedVerification]);

  const handleChange = <K extends keyof UserForm>(
    key: K,
    value: UserForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setEditingUserId(null);
    setForm(initialForm);
    setDuplicateInfo(null);
    setMessage("");
    setError("");
  };

  const handleEdit = (user: UserRecord) => {
    setEditingUserId(user._id || null);
    setDuplicateInfo(null);
    setMessage("");
    setError("");

    setForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "user",
      verificationStatus: user.verificationStatus || "unverified",
      badgesText: (user.badges || []).join(", "),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    email: form.email.trim(),
    role: form.role,
    verificationStatus: form.verificationStatus || "unverified",
    badges: form.badgesText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  });

  const handleReviewDocuments = async (user: UserRecord) => {
    if (!token || !user._id) {
      setReviewError("Unable to load verification documents for this user.");
      return;
    }

    try {
      setSelectedReviewUser(user);
      setReviewLoading(true);
      setReviewError("");
      setReviewDocuments(null);
      setReviewDocumentUrls((prev) => {
        Object.values(prev).forEach((url) => {
          if (url) URL.revokeObjectURL(url);
        });
        return { front: "", back: "", selfie: "" };
      });

      const res: VerificationDocumentsResponse = await api.getUserVerificationDocuments(
        token,
        user._id
      );
      const nextDocuments = res || null;
      setReviewDocuments(nextDocuments);

      const nextUrls: ReviewDocumentUrls = { front: "", back: "", selfie: "" };

      if (nextDocuments?.hasCitizenshipFrontPhoto) {
        const blob = await api.getVerificationDocumentBlob(token, user._id, "front");
        nextUrls.front = URL.createObjectURL(blob);
      }

      if (nextDocuments?.hasCitizenshipBackPhoto) {
        const blob = await api.getVerificationDocumentBlob(token, user._id, "back");
        nextUrls.back = URL.createObjectURL(blob);
      }

      if (nextDocuments?.hasVerificationSelfiePhoto) {
        const blob = await api.getVerificationDocumentBlob(token, user._id, "selfie");
        nextUrls.selfie = URL.createObjectURL(blob);
      }

      setReviewDocumentUrls(nextUrls);
    } catch (err: unknown) {
      setReviewError(getErrorMessage(err, "Failed to load verification documents"));
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!token) {
      setError("Please login as admin first.");
      return;
    }

    if (!form.name.trim()) {
      setError("User name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!editingUserId && duplicateInfo?.exists) {
      setError("A user with the same email already exists. Check the suggestion below.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const payload = buildPayload();

      if (editingUserId) {
        const res = await api.updateAdminUser(token, editingUserId, payload);
        setMessage(res.message || "User updated successfully");
      } else {
        if (!api.createAdminUser) {
          throw new Error("createAdminUser API method is missing");
        }
        const res = await api.createAdminUser(token, payload);
        setMessage(res.message || "User created successfully");
      }

      resetForm();
      await loadUsers();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save user"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!token) {
      setError("Please login as admin first.");
      return;
    }

    const confirmed = window.confirm("Delete this user?");
    if (!confirmed) return;

    try {
      const res = await api.deleteAdminUser(token, userId);
      setMessage(res.message || "User deleted successfully");

      if (editingUserId === userId) {
        resetForm();
      }

      await loadUsers();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete user"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          View, verify, and manage registered users with cleaner duplicate checks
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
        title="Users Directory"
        description="Search users, filter records, and edit verification details."
      >
        <AdminToolbar
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="Search by name, email, role, or verification..."
          primaryActionLabel={editingUserId ? "Cancel Edit" : "New Entry"}
          onPrimaryAction={resetForm}
          secondarySlot={
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="admin">Admin</option>
                <option value="reviewer">Reviewer</option>
                <option value="user">User</option>
              </select>

              <select
                value={selectedVerification}
                onChange={(e) => setSelectedVerification(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              >
                <option value="ALL">All Verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          }
        />
      </AdminPageSection>

      <form onSubmit={handleSubmit}>
        <AdminFormCard
          title={editingUserId ? "Edit User" : "Add User"}
          subtitle="Keep user records clean and avoid email duplicates before saving."
          actions={
            <>
              <button
                type="submit"
                disabled={submitting || (!editingUserId && !!duplicateInfo?.exists)}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting
                  ? editingUserId
                    ? "Updating..."
                    : "Saving..."
                  : editingUserId
                  ? "Update User"
                  : "Save User"}
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
            <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              placeholder="User name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              placeholder="user@email.com"
            />
            {duplicateLoading ? (
              <p className="mt-2 text-xs text-slate-500">Checking similar email...</p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
            <select
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="reviewer">Reviewer</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Verification Status
            </label>
            <select
              value={form.verificationStatus}
              onChange={(e) => handleChange("verificationStatus", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              <option value="unverified">Unverified</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Badges</label>
            <input
              value={form.badgesText}
              onChange={(e) => handleChange("badgesText", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              placeholder="verified citizen, contributor, volunteer"
            />
          </div>

          {!editingUserId && duplicateInfo?.exists ? (
            <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                A user with similar email already exists
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Check this record before creating a duplicate.
              </p>

              <div className="mt-3 space-y-2">
                {(duplicateInfo.matches || []).map((item, index) => (
                  <button
                    key={item._id || item.email || index}
                    type="button"
                    onClick={() =>
                      handleEdit({
                        _id: item._id,
                        name: item.name,
                        email: item.email,
                        role: item.role,
                      })
                    }
                    className="block w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-left"
                  >
                    <p className="font-semibold text-slate-900">{item.name || "Unnamed User"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.email || "No email"} • {item.role || "user"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </AdminFormCard>
      </form>

      <AdminDataTable
        title="User Records"
        subtitle={`Showing ${filteredUsers.length} user records`}
        rows={filteredUsers}
        emptyMessage={loading ? "Loading users..." : "No users found."}
        columns={[
          {
            key: "user",
            header: "User",
            render: (row) => (
              <div>
                <p className="font-semibold text-slate-900">{row.name || "Unnamed User"}</p>
                <p className="text-xs text-slate-500">{row.email || "No email"}</p>
              </div>
            ),
          },
          {
            key: "role",
            header: "Role",
            render: (row) => (
              <p className="font-medium text-slate-900">{row.role || "user"}</p>
            ),
          },
          {
            key: "verification",
            header: "Verification",
            render: (row) => (
              <p className="font-medium text-slate-900">
                {row.verificationStatus || "unverified"}
              </p>
            ),
          },
          {
            key: "badges",
            header: "Badges",
            render: (row) => (
              <p className="text-sm text-slate-700">
                {row.badges?.length ? row.badges.join(", ") : "—"}
              </p>
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
                  onClick={() => handleReviewDocuments(row)}
                  className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                  disabled={!row._id}
                >
                  Review Docs
                </button>
                <button
                  onClick={() => handleDelete(row._id || "")}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
                  disabled={!row._id}
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />

      {selectedReviewUser ? (
        <AdminPageSection
          title="Verification Review"
          description="Private document access for authorized reviewers only."
        >
          {reviewError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {reviewError}
            </div>
          ) : null}

          {reviewLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
              Loading verification documents...
            </div>
          ) : reviewDocuments ? (
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">
                    {reviewDocuments.name || selectedReviewUser.name || "User"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {reviewDocuments.email || selectedReviewUser.email || "No email"}
                  </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                  {reviewDocuments.verificationStatus || "unverified"}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Citizenship number
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                    {reviewDocuments.citizenshipNumber || "Not provided"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Submitted at
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {reviewDocuments.verificationSubmittedAt
                      ? new Date(reviewDocuments.verificationSubmittedAt).toLocaleString()
                      : "Not submitted yet"}
                  </p>
                </div>
              </div>

              {reviewDocuments.verificationNotes ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Review notes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {reviewDocuments.verificationNotes}
                  </p>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  {
                    label: "Front document",
                    src: reviewDocumentUrls.front,
                  },
                  {
                    label: "Back document",
                    src: reviewDocumentUrls.back,
                  },
                  {
                    label: "Selfie",
                    src: reviewDocumentUrls.selfie,
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 text-sm font-semibold text-slate-800">{item.label}</p>
                    {item.src ? (
                      <img
                        src={item.src}
                        alt={item.label}
                        className="h-64 w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                        Not provided
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </AdminPageSection>
      ) : null}
    </div>
  );
}

export default AdminUsers;
