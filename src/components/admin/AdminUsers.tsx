import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

type UserItem = {
  _id?: string;
  id?: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  district?: string;
  province?: string;
  birthplace?: string;
  bio?: string;
  role: string;
  verificationStatus?: string;
  citizenshipNumber?: string;
  badges?: string[];
};

const emptyForm: UserItem = {
  name: "",
  username: "",
  email: "",
  phone: "",
  district: "",
  province: "",
  birthplace: "",
  bio: "",
  role: "user",
  verificationStatus: "unverified",
  citizenshipNumber: "",
  badges: [],
};

function AdminUsers() {
  const { token } = useAuth();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState<UserItem>(emptyForm);

  const loadUsers = async () => {
    try {
      setLoading(true);

      if (!token) return;

      const data = await api.getAdminUsers(token);

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setMessage(data.message || "Failed to load users");
      }
    } catch (error: any) {
      setMessage(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();

    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.role?.toLowerCase().includes(q) ||
        (user.district || "").toLowerCase().includes(q) ||
        (user.province || "").toLowerCase().includes(q) ||
        (user.verificationStatus || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleEdit = (user: UserItem) => {
    setEditingUserId(user._id || user.id || null);
    setForm({
      ...emptyForm,
      ...user,
      badges: user.badges || [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingUserId(null);
    setForm(emptyForm);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBadgesChange = (value: string) => {
    const badges = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setForm((prev) => ({
      ...prev,
      badges,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !editingUserId) {
      setMessage("Select a user first");
      return;
    }

    try {
      const payload = {
        name: form.name,
        username: form.username || "",
        phone: form.phone || "",
        district: form.district || "",
        province: form.province || "",
        birthplace: form.birthplace || "",
        bio: form.bio || "",
        role: form.role,
        verificationStatus: form.verificationStatus || "unverified",
        citizenshipNumber: form.citizenshipNumber || "",
        badges: form.badges || [],
      };

      const res = await api.updateAdminUser(token, editingUserId, payload);
      setMessage(res.message || "User updated successfully");

      resetForm();
      await loadUsers();
    } catch (error: any) {
      setMessage(error.message || "Failed to update user");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!token) {
      setMessage("Login required");
      return;
    }

    const confirmed = window.confirm("Delete this user?");
    if (!confirmed) return;

    try {
      const res = await api.deleteAdminUser(token, userId);
      setMessage(res.message || "User deleted successfully");
      await loadUsers();
    } catch (error: any) {
      setMessage(error.message || "Failed to delete user");
    }
  };

  return (
    <AdminLayout
      title="Users Management"
      description="View and edit registered users, roles, and verification details"
    >
      {message && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {editingUserId ? "Edit User" : "Select a user to edit"}
          </h2>
          <p className="text-slate-500 mb-5">
            Admin can update role, verification status, and profile details
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Name" name="name" value={form.name} onChange={handleChange} />
            <Input label="Email" name="email" value={form.email} onChange={handleChange} disabled />

            <Input label="Username" name="username" value={form.username || ""} onChange={handleChange} />
            <Input label="Phone" name="phone" value={form.phone || ""} onChange={handleChange} />

            <Input label="District" name="district" value={form.district || ""} onChange={handleChange} />
            <Input label="Province" name="province" value={form.province || ""} onChange={handleChange} />

            <Input label="Birthplace" name="birthplace" value={form.birthplace || ""} onChange={handleChange} />
            <Input
              label="Citizenship Number"
              name="citizenshipNumber"
              value={form.citizenshipNumber || ""}
              onChange={handleChange}
            />

            <Select
              label="Role"
              name="role"
              value={form.role}
              onChange={handleChange}
              options={["user", "admin"]}
            />

            <Select
              label="Verification Status"
              name="verificationStatus"
              value={form.verificationStatus || "unverified"}
              onChange={handleChange}
              options={["unverified", "pending", "verified", "rejected"]}
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Bio</label>
              <textarea
                name="bio"
                value={form.bio || ""}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Badges (comma separated)
              </label>
              <input
                type="text"
                value={(form.badges || []).join(", ")}
                onChange={(e) => handleBadgesChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="verified citizen, active voter"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!editingUserId}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              Update User
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
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
          Loading users...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Province</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => {
                const userId = user._id || user.id || "";
                return (
                  <tr key={userId || index} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-semibold text-slate-900">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.role}</td>
                    <td className="px-4 py-3">{user.district || "—"}</td>
                    <td className="px-4 py-3">{user.province || "—"}</td>
                    <td className="px-4 py-3">{user.verificationStatus || "unverified"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="rounded-xl bg-blue-100 px-3 py-2 text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(userId)}
                          className="rounded-xl bg-red-100 px-3 py-2 text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No users found
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
  disabled = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
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

export default AdminUsers;