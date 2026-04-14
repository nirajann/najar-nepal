import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import AdminPageSection from "./AdminPageSection";
import AdminToolbar from "./AdminToolbar";
import AdminFormCard from "./AdminFormCard";
import AdminDataTable from "./AdminDataTable";

type LeaderOption = {
  _id?: string;
  leaderId: string;
  name: string;
  role: string;
  party?: string;
  province?: string;
  currentOffice?: string;
  photo?: string;
};

type LocalLevelItem = {
  name: string;
  type?: string;
  slug?: string;
};

type DistrictRecord = {
  _id?: string;
  districtId: string;
  slug?: string;
  name: string;
  normalizedName?: string;
  province: string;
  provinceSlug?: string;
  mpLeaders?: (LeaderOption | string)[];
  ministerLeaders?: (LeaderOption | string)[];
  naLeaders?: (LeaderOption | string)[];
  localLevels?: LocalLevelItem[];
  totalWards?: number;
  satisfactionScore?: number;
  verified?: boolean;
  sourceUrl?: string;
  lastVerifiedAt?: string;
};

type DuplicateDistrict = {
  _id?: string;
  districtId: string;
  name: string;
  province: string;
};

type DuplicateCheckResponse = {
  exactMatch: boolean;
  matches?: DuplicateDistrict[];
  message?: string;
};

type DistrictForm = {
  districtId: string;
  name: string;
  province: string;
  mpLeaders: string[];
  ministerLeaders: string[];
  naLeaders: string[];
  localLevelsText: string;
  totalWards: string;
  satisfactionScore: string;
  verified: boolean;
  sourceUrl: string;
};

const initialForm: DistrictForm = {
  districtId: "",
  name: "",
  province: "",
  mpLeaders: [],
  ministerLeaders: [],
  naLeaders: [],
  localLevelsText: "",
  totalWards: "0",
  satisfactionScore: "0",
  verified: false,
  sourceUrl: "",
};

function getLeaderValue(leader: LeaderOption | string | null | undefined) {
  if (!leader) return "";
  if (typeof leader === "string") return leader;
  return leader._id || leader.leaderId || "";
}

function getLeaderName(leader: LeaderOption | string | null | undefined) {
  if (!leader) return "—";
  if (typeof leader === "string") return leader;
  return leader.name || leader.leaderId || "—";
}

function getLeaderNames(leaders: (LeaderOption | string)[] | undefined, limit = 2) {
  const items = (leaders || []).map(getLeaderName).filter(Boolean);
  if (items.length === 0) return "—";
  if (items.length <= limit) return items.join(", ");
  return `${items.slice(0, limit).join(", ")} +${items.length - limit} more`;
}

function AdminDistricts() {
  const { token } = useAuth();

  const [districts, setDistricts] = useState<DistrictRecord[]>([]);
  const [leaders, setLeaders] = useState<LeaderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("ALL");

  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);
  const [form, setForm] = useState<DistrictForm>(initialForm);

  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResponse | null>(null);

  const debouncedName = useDebouncedValue(form.name, 450);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [districtsRes, leadersRes] = await Promise.all([
        api.getDistricts(),
        api.getLeaders(),
      ]);

      setDistricts(Array.isArray(districtsRes) ? districtsRes : districtsRes?.districts || []);
      setLeaders(Array.isArray(leadersRes) ? leadersRes : leadersRes?.leaders || []);
    } catch (err: any) {
      setError(err.message || "Failed to load districts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const provinceOptions = useMemo(() => {
    const set = new Set<string>();
    districts.forEach((district) => {
      if (district.province) set.add(district.province);
    });
    return Array.from(set).sort();
  }, [districts]);

  const filteredDistricts = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    return districts.filter((district) => {
      const name = (district.name || "").toLowerCase();
      const province = (district.province || "").toLowerCase();
      const districtId = (district.districtId || "").toLowerCase();

      const searchMatch =
        !q || name.includes(q) || province.includes(q) || districtId.includes(q);

      const provinceMatch =
        selectedProvince === "ALL" || district.province === selectedProvince;

      return searchMatch && provinceMatch;
    });
  }, [districts, searchText, selectedProvince]);

  const mpOptions = useMemo(
    () => leaders.filter((leader) => leader.role === "MP"),
    [leaders]
  );

  const ministerOptions = useMemo(
    () =>
      leaders.filter(
        (leader) => leader.role === "Minister" || leader.role === "Prime Minister"
      ),
    [leaders]
  );

  const naOptions = useMemo(
    () => leaders.filter((leader) => leader.role === "National Assembly Member"),
    [leaders]
  );

  useEffect(() => {
    const runDuplicateCheck = async () => {
      if (editingDistrictId) {
        setDuplicateInfo(null);
        return;
      }

      if (!debouncedName.trim()) {
        setDuplicateInfo(null);
        return;
      }

      try {
        setDuplicateLoading(true);

        const res = await api.checkDistrictDuplicate({
          name: debouncedName.trim(),
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
  }, [debouncedName, form.province, editingDistrictId]);

  const handleChange = <K extends keyof DistrictForm>(
    key: K,
    value: DistrictForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayValue = (
    key: "mpLeaders" | "ministerLeaders" | "naLeaders",
    leaderId: string
  ) => {
    setForm((prev) => {
      const exists = prev[key].includes(leaderId);
      return {
        ...prev,
        [key]: exists
          ? prev[key].filter((id) => id !== leaderId)
          : [...prev[key], leaderId],
      };
    });
  };

  const resetForm = () => {
    setEditingDistrictId(null);
    setForm(initialForm);
    setDuplicateInfo(null);
    setMessage("");
    setError("");
  };

  const handleEdit = (district: DistrictRecord) => {
    setEditingDistrictId(district.districtId);
    setDuplicateInfo(null);
    setMessage("");
    setError("");

    setForm({
      districtId: district.districtId || "",
      name: district.name || "",
      province: district.province || "",
      mpLeaders: (district.mpLeaders || []).map((item) => getLeaderValue(item)).filter(Boolean),
      ministerLeaders: (district.ministerLeaders || [])
        .map((item) => getLeaderValue(item))
        .filter(Boolean),
      naLeaders: (district.naLeaders || []).map((item) => getLeaderValue(item)).filter(Boolean),
      localLevelsText: (district.localLevels || [])
        .map((item) => (item.type ? `${item.name} (${item.type})` : item.name))
        .join(", "),
      totalWards: String(district.totalWards ?? 0),
      satisfactionScore: String(district.satisfactionScore ?? 0),
      verified: !!district.verified,
      sourceUrl: district.sourceUrl || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildPayload = () => ({
    districtId: form.districtId.trim(),
    name: form.name.trim(),
    province: form.province.trim(),
    mpLeaders: form.mpLeaders,
    ministerLeaders: form.ministerLeaders,
    naLeaders: form.naLeaders,
    localLevels: form.localLevelsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const match = item.match(/^(.+?)\s*\((.+)\)$/);
        if (match) {
          return {
            name: match[1].trim(),
            type: match[2].trim(),
          };
        }
        return { name: item, type: "" };
      }),
    totalWards: form.totalWards ? Number(form.totalWards) : 0,
    satisfactionScore: form.satisfactionScore ? Number(form.satisfactionScore) : 0,
    verified: form.verified,
    sourceUrl: form.sourceUrl.trim(),
  });

  const handleSubmit = async () => {
    if (!token) {
      setError("Please login as admin first.");
      return;
    }

    if (!form.name.trim()) {
      setError("District name is required.");
      return;
    }

    if (!form.province.trim()) {
      setError("Province is required.");
      return;
    }

    if (!editingDistrictId && duplicateInfo?.exactMatch) {
      setError("A similar district already exists. Check the suggestions before saving.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const payload = buildPayload();

      if (editingDistrictId) {
        const res = await api.updateDistrict(token, editingDistrictId, payload);
        setMessage(res.message || "District updated successfully");
      } else {
        const res = await api.createDistrict(token, payload);
        setMessage(res.message || "District created successfully");
      }

      resetForm();
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save district");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (districtId: string) => {
    if (!token) {
      setError("Please login as admin first.");
      return;
    }

    const confirmed = window.confirm("Delete this district?");
    if (!confirmed) return;

    try {
      const res = await api.deleteDistrict(token, districtId);
      setMessage(res.message || "District deleted successfully");

      if (editingDistrictId === districtId) {
        resetForm();
      }

      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete district");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Districts</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connect districts with MPs, ministers, assembly members, and local-level data
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
        title="District Directory"
        description="Search district records and manage the linked representatives cleanly."
      >
        <AdminToolbar
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="Search by district, province, or district ID..."
          primaryActionLabel={editingDistrictId ? "Cancel Edit" : "New Entry"}
          onPrimaryAction={resetForm}
          secondarySlot={
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              <option value="ALL">All Provinces</option>
              {provinceOptions.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          }
        />
      </AdminPageSection>

      <AdminFormCard
        title={editingDistrictId ? "Edit District" : "Add District"}
        subtitle="Save clean district records to backend and avoid duplicates before submit."
        actions={
          <>
            <button
              onClick={handleSubmit}
              disabled={submitting || (!editingDistrictId && !!duplicateInfo?.exactMatch)}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting
                ? editingDistrictId
                  ? "Updating..."
                  : "Saving..."
                : editingDistrictId
                ? "Update District"
                : "Save District"}
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
          <label className="mb-2 block text-sm font-medium text-slate-700">District Name</label>
          <input
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="District name"
          />
          {duplicateLoading ? (
            <p className="mt-2 text-xs text-slate-500">Checking similar districts...</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">District ID</label>
          <input
            value={form.districtId}
            onChange={(e) => handleChange("districtId", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Optional custom ID"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Province</label>
          <select
            value={form.province}
            onChange={(e) => handleChange("province", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
          >
            <option value="">Select province</option>
            {provinceOptions.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Total Wards</label>
          <input
            value={form.totalWards}
            onChange={(e) => handleChange("totalWards", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="0"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Satisfaction Score</label>
          <input
            value={form.satisfactionScore}
            onChange={(e) => handleChange("satisfactionScore", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="0 - 100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Source URL</label>
          <input
            value={form.sourceUrl}
            onChange={(e) => handleChange("sourceUrl", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="https://..."
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            id="district-verified"
            type="checkbox"
            checked={form.verified}
            onChange={(e) => handleChange("verified", e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <label htmlFor="district-verified" className="text-sm font-medium text-slate-700">
            Verified district record
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">MPs</label>
          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
            {mpOptions.map((leader) => {
              const value = leader._id || leader.leaderId;
              const checked = form.mpLeaders.includes(value);

              return (
                <label
                  key={value}
                  className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleArrayValue("mpLeaders", value)}
                  />
                  <span>{leader.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Ministers / Prime Minister</label>
          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
            {ministerOptions.map((leader) => {
              const value = leader._id || leader.leaderId;
              const checked = form.ministerLeaders.includes(value);

              return (
                <label
                  key={value}
                  className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleArrayValue("ministerLeaders", value)}
                  />
                  <span>{leader.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            National Assembly Members
          </label>

          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
            {naOptions.map((leader) => {
              const value = leader._id || leader.leaderId;
              const checked = form.naLeaders.includes(value);

              return (
                <label
                  key={value}
                  className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleArrayValue("naLeaders", value)}
                  />
                  <span>{leader.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Local Levels / Municipalities
          </label>
          <textarea
            value={form.localLevelsText}
            onChange={(e) => handleChange("localLevelsText", e.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Example: Bharatpur Metropolitan City (Metropolitan City), Khairahani Municipality (Municipality)"
          />
        </div>

        {!editingDistrictId && duplicateInfo?.exactMatch ? (
          <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">
              Similar district already exists in database
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Check these records before creating a duplicate.
            </p>

            <div className="mt-3 space-y-2">
              {(duplicateInfo.matches || []).map((item) => (
                <button
                  key={item.districtId}
                  type="button"
                  onClick={() =>
                    handleEdit({
                      districtId: item.districtId,
                      name: item.name,
                      province: item.province,
                    })
                  }
                  className="block w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-left"
                >
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.province} • {item.districtId}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </AdminFormCard>

      <AdminDataTable
        title="District Records"
        subtitle={`Showing ${filteredDistricts.length} district records`}
        rows={filteredDistricts}
        emptyMessage={loading ? "Loading districts..." : "No districts found."}
        columns={[
          {
            key: "district",
            header: "District",
            render: (row) => (
              <div>
                <p className="font-semibold text-slate-900">{row.name}</p>
                <p className="text-xs text-slate-500">{row.districtId}</p>
              </div>
            ),
          },
          {
            key: "province",
            header: "Province",
            render: (row) => (
              <p className="font-medium text-slate-900">{row.province || "—"}</p>
            ),
          },
          {
            key: "leaders",
            header: "Linked Leaders",
            render: (row) => (
              <div className="space-y-1">
                <p className="text-sm text-slate-900">
                  MPs: {getLeaderNames(row.mpLeaders)}
                </p>
                <p className="text-xs text-slate-500">
                  Ministers: {getLeaderNames(row.ministerLeaders)}
                </p>
                <p className="text-xs text-slate-500">
                  NA: {getLeaderNames(row.naLeaders)}
                </p>
              </div>
            ),
          },
          {
            key: "score",
            header: "District Stats",
            render: (row) => (
              <div>
                <p className="font-semibold text-slate-900">
                  {row.satisfactionScore ?? 0}% satisfaction
                </p>
                <p className="text-xs text-slate-500">
                  Wards: {row.totalWards ?? 0}
                </p>
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
                  onClick={() => handleDelete(row.districtId)}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
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

export default AdminDistricts;