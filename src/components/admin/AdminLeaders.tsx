import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

type LeaderItem = {
  _id?: string;
  leaderId: string;
  name: string;
  role: string;
  chamber?: string;
  portfolio?: string;
  party?: string;
  district?: string;
  province?: string;
  localLevel?: string;
  ward?: string;
  currentStatus: string;
  age?: number | null;
  birthPlace?: string;
  permanentAddress?: string;
  gender?: string;
  photo?: string;
  officialSourceUrl?: string;
  electionSourceUrl?: string;
  badge?: string;
  verified?: boolean;
  startYear?: string;
  endYear?: string;
};

const provinces = [
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
];

const commonDistricts = [
  "Kathmandu",
  "Lalitpur",
  "Bhaktapur",
  "Chitwan",
  "Kaski",
  "Tanahun",
  "Gorkha",
  "Rupandehi",
  "Jhapa",
];

const emptyForm: LeaderItem = {
  leaderId: "",
  name: "",
  role: "MP",
  chamber: "",
  portfolio: "",
  party: "",
  district: "",
  province: "",
  localLevel: "",
  ward: "",
  currentStatus: "Current",
  age: null,
  birthPlace: "",
  permanentAddress: "",
  gender: "",
  photo: "",
  officialSourceUrl: "",
  electionSourceUrl: "",
  badge: "",
  verified: false,
  startYear: "",
  endYear: "Present",
};

function slugifyLeaderId(name: string, role: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  const roleMap: Record<string, string> = {
    "Prime Minister": "prime-minister",
    Minister: "minister",
    MP: "mp",
    "National Assembly Member": "na",
    Mayor: "mayor",
    Chairperson: "chairperson",
  };

  return slug ? `${slug}-${roleMap[role] || "leader"}` : "";
}

function AdminLeaders() {
  const { token } = useAuth();

  const [leaders, setLeaders] = useState<LeaderItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<LeaderItem>(emptyForm);

  const loadLeaders = async () => {
    try {
      setLoading(true);
      const data = await api.getLeaders({ search });
      setLeaders(Array.isArray(data) ? data : []);
    } catch (error: any) {
  console.error("Leader save error:", error);
  setMessage(error.message || "Failed to save leader");
} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaders();
  }, []);

  useEffect(() => {
    if (!editingId && form.name && form.role) {
      setForm((prev) => ({
        ...prev,
        leaderId: slugifyLeaderId(prev.name, prev.role),
      }));
    }
  }, [form.name, form.role, editingId]);

  const filteredLeaders = useMemo(() => {
    if (!search.trim()) return leaders;

    const q = search.toLowerCase();
    return leaders.filter(
      (leader) =>
        leader.name?.toLowerCase().includes(q) ||
        leader.role?.toLowerCase().includes(q) ||
        leader.party?.toLowerCase().includes(q) ||
        leader.district?.toLowerCase().includes(q) ||
        leader.province?.toLowerCase().includes(q)
    );
  }, [leaders, search]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "age"
          ? value === ""
            ? null
            : Number(value)
          : value,
    }));
  };

  const handleEdit = (leader: LeaderItem) => {
    setEditingId(leader.leaderId);
    setForm({
      ...emptyForm,
      ...leader,
    });
    setShowAdvanced(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowAdvanced(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage("Login required");
      return;
    }

    try {
      if (editingId) {
        const res = await api.updateLeader(token, editingId, form);
        setMessage(res.message || "Leader updated");
      } else {
        const res = await api.createLeader(token, form);
        setMessage(res.message || "Leader created");
      }

      resetForm();
      await loadLeaders();
    } catch (error: any) {
      setMessage(error.message || "Failed to save leader");
    }
  };

  const handleDelete = async (leaderId: string) => {
    if (!token) {
      setMessage("Login required");
      return;
    }

    const confirmed = window.confirm("Delete this leader?");
    if (!confirmed) return;

    try {
      const res = await api.deleteLeader(token, leaderId);
      setMessage(res.message || "Leader deleted");
      await loadLeaders();
    } catch (error: any) {
      setMessage(error.message || "Failed to delete leader");
    }
  };

  return (
    <AdminLayout
      title="Leaders Management"
      description="Add and manage representative data more easily"
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
                {editingId ? "Edit Leader" : "Quick Create Leader"}
              </h2>
              <p className="text-slate-500 mt-1">
                Start with the most important fields first
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="rounded-2xl bg-white border border-slate-300 px-4 py-2 font-semibold text-slate-700"
            >
              {showAdvanced ? "Hide Details" : "More Details"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Name" name="name" value={form.name} onChange={handleChange} />
            <Input label="Leader ID" name="leaderId" value={form.leaderId} onChange={handleChange} />

            <Select
              label="Role"
              name="role"
              value={form.role}
              onChange={handleChange}
              options={[
                "Prime Minister",
                "Minister",
                "MP",
                "National Assembly Member",
                "Mayor",
                "Chairperson",
              ]}
            />

            <Select
              label="Current Status"
              name="currentStatus"
              value={form.currentStatus}
              onChange={handleChange}
              options={["Current", "Former"]}
            />

            <Input label="Party" name="party" value={form.party || ""} onChange={handleChange} />

            <Select
              label="Province"
              name="province"
              value={form.province || ""}
              onChange={handleChange}
              options={["", ...provinces]}
            />

            <Select
              label="District"
              name="district"
              value={form.district || ""}
              onChange={handleChange}
              options={["", ...commonDistricts]}
            />

            <Input label="Badge" name="badge" value={form.badge || ""} onChange={handleChange} />

            <Input label="Start Year" name="startYear" value={form.startYear || ""} onChange={handleChange} />
            <Input label="End Year" name="endYear" value={form.endYear || ""} onChange={handleChange} />

            <Input label="Photo URL" name="photo" value={form.photo || ""} onChange={handleChange} />

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <input
                type="checkbox"
                name="verified"
                checked={!!form.verified}
                onChange={handleChange}
              />
              <span className="font-medium text-slate-700">Verified</span>
            </label>
          </div>

          {showAdvanced && (
            <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              {(form.role === "MP" || form.role === "National Assembly Member") && (
                <Input label="Chamber" name="chamber" value={form.chamber || ""} onChange={handleChange} />
              )}

              {form.role === "Minister" && (
                <Input label="Portfolio" name="portfolio" value={form.portfolio || ""} onChange={handleChange} />
              )}

              {(form.role === "Mayor" || form.role === "Chairperson") && (
                <Input label="Local Level" name="localLevel" value={form.localLevel || ""} onChange={handleChange} />
              )}

              <Input label="Ward" name="ward" value={form.ward || ""} onChange={handleChange} />
              <Input label="Age" name="age" type="number" value={form.age ?? ""} onChange={handleChange} />
              <Input label="Birth Place" name="birthPlace" value={form.birthPlace || ""} onChange={handleChange} />
              <Input
                label="Permanent Address"
                name="permanentAddress"
                value={form.permanentAddress || ""}
                onChange={handleChange}
              />
              <Input label="Gender" name="gender" value={form.gender || ""} onChange={handleChange} />
              <Input
                label="Official Source URL"
                name="officialSourceUrl"
                value={form.officialSourceUrl || ""}
                onChange={handleChange}
              />
              <Input
                label="Election Source URL"
                name="electionSourceUrl"
                value={form.electionSourceUrl || ""}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 transition"
            >
              {editingId ? "Update Leader" : "Create Leader"}
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
          placeholder="Search leaders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
          Loading leaders...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Party</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Province</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaders.map((leader) => (
                <tr key={leader.leaderId} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-semibold text-slate-900">{leader.name}</td>
                  <td className="px-4 py-3">{leader.role}</td>
                  <td className="px-4 py-3">{leader.party || "—"}</td>
                  <td className="px-4 py-3">{leader.district || "—"}</td>
                  <td className="px-4 py-3">{leader.province || "—"}</td>
                  <td className="px-4 py-3">{leader.currentStatus}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(leader)}
                        className="rounded-xl bg-blue-100 px-3 py-2 text-blue-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(leader.leaderId)}
                        className="rounded-xl bg-red-100 px-3 py-2 text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredLeaders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No leaders found
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
            {option || "Select"}
          </option>
        ))}
      </select>
    </div>
  );
}

export default AdminLeaders;