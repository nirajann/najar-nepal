import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

type LeaderItem = {
  leaderId: string;
  name: string;
  role: string;
  district?: string;
};

type DistrictItem = {
  districtId: string;
  name: string;
  province: string;
  mpLeaderId?: string;
  ministerLeaderId?: string;
  naLeaderIds?: string[];
  localLevelsText?: string;
  satisfactionScore?: number;
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

const emptyForm: DistrictItem = {
  districtId: "",
  name: "",
  province: "",
  mpLeaderId: "",
  ministerLeaderId: "",
  naLeaderIds: [],
  localLevelsText: "",
  satisfactionScore: 0,
};

function slugifyDistrictId(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function AdminDistricts() {
  const { token } = useAuth();

  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [leaders, setLeaders] = useState<LeaderItem[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DistrictItem>(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [districtData, leaderData] = await Promise.all([
        api.getDistricts(),
        api.getLeaders(),
      ]);

      setDistricts(Array.isArray(districtData) ? districtData : []);
      setLeaders(Array.isArray(leaderData) ? leaderData : []);
    } catch (error: any) {
      setMessage(error.message || "Failed to load district data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!editingId && form.name) {
      setForm((prev) => ({
        ...prev,
        districtId: slugifyDistrictId(prev.name),
      }));
    }
  }, [form.name, editingId]);

  const filteredDistricts = useMemo(() => {
    if (!search.trim()) return districts;
    const q = search.toLowerCase();

    return districts.filter(
      (district) =>
        district.name.toLowerCase().includes(q) ||
        district.province.toLowerCase().includes(q) ||
        district.districtId.toLowerCase().includes(q)
    );
  }, [districts, search]);

  const mpOptions = leaders.filter((leader) => leader.role === "MP");
  const ministerOptions = leaders.filter(
    (leader) => leader.role === "Minister" || leader.role === "Prime Minister"
  );
  const naOptions = leaders.filter((leader) => leader.role === "National Assembly Member");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "satisfactionScore" ? Number(value) : value,
    }));
  };

  const handleNaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map((option) => option.value);

    setForm((prev) => ({
      ...prev,
      naLeaderIds: selected,
    }));
  };

  const handleEdit = (district: DistrictItem) => {
    setEditingId(district.districtId);
    setForm({
      ...emptyForm,
      ...district,
      naLeaderIds: district.naLeaderIds || [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
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
        mpLeaderId: form.mpLeaderId || undefined,
        ministerLeaderId: form.ministerLeaderId || undefined,
        localLevelsText: form.localLevelsText || undefined,
      };

      if (editingId) {
        const res = await api.updateDistrict(token, editingId, payload);
        setMessage(res.message || "District updated");
      } else {
        const res = await api.createDistrict(token, payload);
        setMessage(res.message || "District created");
      }

      resetForm();
      await loadData();
    } catch (error: any) {
      setMessage(error.message || "Failed to save district");
    }
  };

  const handleDelete = async (districtId: string) => {
    if (!token) {
      setMessage("Login required");
      return;
    }

    const confirmed = window.confirm("Delete this district?");
    if (!confirmed) return;

    try {
      const res = await api.deleteDistrict(token, districtId);
      setMessage(res.message || "District deleted");
      await loadData();
    } catch (error: any) {
      setMessage(error.message || "Failed to delete district");
    }
  };

  return (
    <AdminLayout
      title="Districts Management"
      description="Connect districts with MPs, ministers, and NA members easily"
    >
      {message && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {editingId ? "Edit District" : "Quick Create District"}
          </h2>
          <p className="text-slate-500 mb-5">
            Add district and link the correct representatives
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="District Name" name="name" value={form.name} onChange={handleChange} />
            <Input label="District ID" name="districtId" value={form.districtId} onChange={handleChange} />

            <Select
              label="Province"
              name="province"
              value={form.province}
              onChange={handleChange}
              options={["", ...provinces]}
            />

            <Select
              label="MP"
              name="mpLeaderId"
              value={form.mpLeaderId || ""}
              onChange={handleChange}
              options={["", ...mpOptions.map((leader) => leader.leaderId)]}
            />

            <Select
              label="Minister / PM"
              name="ministerLeaderId"
              value={form.ministerLeaderId || ""}
              onChange={handleChange}
              options={["", ...ministerOptions.map((leader) => leader.leaderId)]}
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                National Assembly Members
              </label>
              <select
                multiple
                value={form.naLeaderIds || []}
                onChange={handleNaChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              >
                {naOptions.map((leader) => (
                  <option key={leader.leaderId} value={leader.leaderId}>
                    {leader.name} ({leader.leaderId})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Satisfaction Score"
              name="satisfactionScore"
              type="number"
              value={form.satisfactionScore ?? 0}
              onChange={handleChange}
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Local Levels / Municipalities
              </label>
              <textarea
                name="localLevelsText"
                value={form.localLevelsText || ""}
                onChange={handleChange}
                rows={5}
                placeholder="Example: Bharatpur Metropolitan City, Kalika Municipality, Khairahani Municipality..."
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 transition"
            >
              {editingId ? "Update District" : "Create District"}
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
          placeholder="Search districts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
          Loading districts...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Province</th>
                <th className="px-4 py-3">MP</th>
                <th className="px-4 py-3">Minister</th>
                <th className="px-4 py-3">Satisfaction</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDistricts.map((district) => (
                <tr key={district.districtId} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-semibold text-slate-900">{district.name}</td>
                  <td className="px-4 py-3">{district.province}</td>
                  <td className="px-4 py-3">{district.mpLeaderId || "—"}</td>
                  <td className="px-4 py-3">{district.ministerLeaderId || "—"}</td>
                  <td className="px-4 py-3">{district.satisfactionScore ?? 0}%</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(district)}
                        className="rounded-xl bg-blue-100 px-3 py-2 text-blue-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(district.districtId)}
                        className="rounded-xl bg-red-100 px-3 py-2 text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDistricts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No districts found
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

export default AdminDistricts;