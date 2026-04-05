import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
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
  citizenshipNumber?: string;
  badges?: string[];
  createdAt?: string;
};

type DuplicateUser = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
};

type DuplicateCheckResponse = {
  exists: boolean;
  matches?: DuplicateUser[];
  message?: string;
};

type UserForm = {
  name: string;
  email: string;
  role: string;
  verificationStatus: string;
  citizenshipNumber: string;
  badgesText: string;
};

const initialForm: UserForm = {
  name: "",
  email: "",
  role: "user",
  verificationStatus: "unverified",
  citizenshipNumber: "",
  badgesText: "",
};

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

  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResponse | null>(null);

  const debouncedEmail = useDebouncedValue(form.email, 450);

  const loadUsers = async () => {
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

      setUsers(Array.isArray(res) ? res : res?.users || []);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [token]);

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

        setDuplicateInfo(res || null);
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
      citizenshipNumber: user.citizenshipNumber || "",
      badgesText: (user.badges || []).join(", "),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    email: form.email.trim(),
    role: form.role,
    verificationStatus: form.verificationStatus || "unverified",
    citizenshipNumber: form.citizenshipNumber.trim(),
    badges: form.badgesText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  });

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
    } catch (err: any) {
      setError(err.message || "Failed to save user");
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
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
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
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Citizenship Number
            </label>
            <input
              value={form.citizenshipNumber}
              onChange={(e) => handleChange("citizenshipNumber", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              placeholder="Optional"
            />
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
    </div>
  );
}

export default AdminUsers;