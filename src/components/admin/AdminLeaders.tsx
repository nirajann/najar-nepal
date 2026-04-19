import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  type DuplicateCheckResponse as ApiDuplicateCheckResponse,
  type GenericListResponse,
} from "../../services/api";
import { useAuth } from "../../context/useAuth";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import AdminPageSection from "./AdminPageSection";
import AdminFormCard from "./AdminFormCard";
import AdminDataTable from "./AdminDataTable";

type DistrictOption = {
  _id?: string;
  districtId: string;
  name: string;
  province: string;
};

type PositionItem = {
  title: string;
  type: string;
  institution?: string;
  ministry?: string;
  portfolio?: string;
  status?: string;
  fromDate?: string | null;
  toDate?: string | null;
  sourceUrl?: string;
};

type LeaderRecord = {
  _id?: string;
  leaderId: string;
  slug?: string;
  name: string;
  normalizedName?: string;
  role: string;
  chamber?: string;
  currentOffice?: string;
  portfolio?: string;
  positions?: PositionItem[];
  party?: string;
  district?: string | { _id?: string; districtId?: string; name?: string } | null;
  districtName?: string;
  constituency?: string;
  electionProcess?: string;
  province?: string;
  localLevel?: string;
  ward?: string;
  currentStatus?: string;
  age?: number | null;
  birthPlace?: string;
  permanentAddress?: string;
  gender?: string;
  photo?: string;
  officialSourceUrl?: string;
  electionSourceUrl?: string;
  badge?: string;
  verified?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  startYear?: string;
  endYear?: string;
  lastVerifiedAt?: string | null;
};

type DuplicateLeader = {
  _id?: string;
  leaderId: string;
  name: string;
  role?: string;
  party?: string;
  province?: string;
  district?: string;
};

type DuplicateCheckResponse = ApiDuplicateCheckResponse<DuplicateLeader>;

type AnalyticsLeader = {
  leaderId: string;
  commentCount: number;
  avgRating: number;
  voteCount: number;
  engagementScore: number;
  likeCount?: number;
  dislikeCount?: number;
  complaintCount?: number;
};

type OverviewResponse = {
  topPopular?: AnalyticsLeader[];
  mostDiscussed?: AnalyticsLeader[];
  highestRated?: AnalyticsLeader[];
  lowestRated?: AnalyticsLeader[];
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type LeaderForm = {
  leaderId: string;
  name: string;
  role: string;
  chamber: string;
  currentOffice: string;
  portfolio: string;
  party: string;
  district: string;
  province: string;
  constituency: string;
  electionProcess: string;
  localLevel: string;
  ward: string;
  currentStatus: string;
  age: string;
  birthPlace: string;
  permanentAddress: string;
  gender: string;
  photo: string;
  officialSourceUrl: string;
  electionSourceUrl: string;
  badge: string;
  verified: boolean;
  startDate: string;
  endDate: string;
  startYear: string;
  endYear: string;
  positionsText: string;
};

const emptyForm: LeaderForm = {
  leaderId: "",
  name: "",
  role: "MP",
  chamber: "",
  currentOffice: "",
  portfolio: "",
  party: "",
  district: "",
  province: "",
  constituency: "",
  electionProcess: "",
  localLevel: "",
  ward: "",
  currentStatus: "Current",
  age: "",
  birthPlace: "",
  permanentAddress: "",
  gender: "",
  photo: "",
  officialSourceUrl: "",
  electionSourceUrl: "",
  badge: "",
  verified: false,
  startDate: "",
  endDate: "",
  startYear: "",
  endYear: "Present",
  positionsText: "",
};

function getDistrictName(district: LeaderRecord["district"]): string {
  if (!district) return "";
  if (typeof district === "string") return district;
  return district.name || district.districtId || "";
}

function getDistrictValue(district: LeaderRecord["district"]): string {
  if (!district) return "";
  if (typeof district === "string") return district;
  return district._id || district.districtId || "";
}

function buildPositionsText(positions: PositionItem[] | undefined) {
  if (!positions || positions.length === 0) return "";
  return positions
    .map((item) => {
      const base = item.title || "";
      const extras = [
        item.type,
        item.institution,
        item.ministry,
        item.portfolio,
        item.status,
        item.fromDate,
        item.toDate,
        item.sourceUrl,
      ]
        .filter(Boolean)
        .join(" | ");
      return extras ? `${base} :: ${extras}` : base;
    })
    .join("\n");
}

function parsePositionsText(text: string): PositionItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [titlePart, metaPart] = line.split("::").map((item) => item.trim());
      const meta = metaPart ? metaPart.split("|").map((item) => item.trim()) : [];

      return {
        title: titlePart || "",
        type: meta[0] || "Other",
        institution: meta[1] || "",
        ministry: meta[2] || "",
        portfolio: meta[3] || "",
        status: meta[4] || "Current",
        fromDate: meta[5] || null,
        toDate: meta[6] || null,
        sourceUrl: meta[7] || "",
      };
    })
    .filter((item) => item.title);
}

function AdminLeaders() {
  const { token } = useAuth();

  const [leaders, setLeaders] = useState<LeaderRecord[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [analyticsMap, setAnalyticsMap] = useState<Record<string, AnalyticsLeader>>({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedProvince, setSelectedProvince] = useState("ALL");
  const [openSuggestions, setOpenSuggestions] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");

  const [editingLeaderId, setEditingLeaderId] = useState<string | null>(null);
  const [form, setForm] = useState<LeaderForm>(emptyForm);

  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResponse | null>(null);

  const debouncedName = useDebouncedValue(form.name, 450);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const requests: Promise<unknown>[] = [api.getLeaders(), api.getDistricts()];

      if (token && api.getAdminAnalyticsOverview) {
        requests.push(api.getAdminAnalyticsOverview(token));
      }

      const results = await Promise.all(requests);

      const leadersRes = results[0];
      const districtsRes = results[1];
      const analyticsRes = results[2] as OverviewResponse | undefined;

      const leaderPayload =
        leadersRes as LeaderRecord[] | GenericListResponse<LeaderRecord>;
      const districtPayload =
        districtsRes as DistrictOption[] | GenericListResponse<DistrictOption>;

      const loadedLeaders = Array.isArray(leaderPayload)
        ? leaderPayload
        : leaderPayload.rows || leaderPayload.leaders || [];
      const loadedDistricts = Array.isArray(districtPayload)
        ? districtPayload
        : districtPayload.rows || districtPayload.districts || [];

      setLeaders(loadedLeaders);
      setDistricts(loadedDistricts);

      if (analyticsRes) {
        const map: Record<string, AnalyticsLeader> = {};

        const mergeList = (items?: AnalyticsLeader[]) => {
          (items || []).forEach((item) => {
            const current = map[item.leaderId] || {
              leaderId: item.leaderId,
              commentCount: 0,
              avgRating: 0,
              voteCount: 0,
              engagementScore: 0,
              likeCount: 0,
              dislikeCount: 0,
              complaintCount: 0,
            };

            map[item.leaderId] = {
              ...current,
              ...item,
            };
          });
        };

        mergeList(analyticsRes.topPopular);
        mergeList(analyticsRes.mostDiscussed);
        mergeList(analyticsRes.highestRated);
        mergeList(analyticsRes.lowestRated);

        setAnalyticsMap(map);
      } else {
        setAnalyticsMap({});
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load leaders"));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const runDuplicateCheck = async () => {
      if (editingLeaderId) {
        setDuplicateInfo(null);
        return;
      }

      if (!debouncedName.trim()) {
        setDuplicateInfo(null);
        return;
      }

      try {
        setDuplicateLoading(true);

        const res = await api.checkLeaderDuplicate({
          name: debouncedName.trim(),
          districtId: form.district || undefined,
        });

        setDuplicateInfo((res as DuplicateCheckResponse) || null);
      } catch {
        setDuplicateInfo(null);
      } finally {
        setDuplicateLoading(false);
      }
    };

    runDuplicateCheck();
  }, [debouncedName, form.district, editingLeaderId]);

  const provinceOptions = useMemo(() => {
    const set = new Set<string>();
    districts.forEach((district) => {
      if (district.province) set.add(district.province);
    });
    return Array.from(set).sort();
  }, [districts]);

  const filteredDistricts = useMemo(() => {
    if (!form.province) return districts;
    return districts.filter((district) => district.province === form.province);
  }, [districts, form.province]);

  const searchSuggestions = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return [];

    return leaders
      .filter((leader) => (leader.name || "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [leaders, searchText]);

  const filteredLeaders = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    return leaders
      .filter((leader) => {
        const name = (leader.name || "").toLowerCase();
        const province = (leader.province || "").toLowerCase();
        const currentOffice = (leader.currentOffice || "").toLowerCase();
        const party = (leader.party || "").toLowerCase();

        const searchMatch =
          !q ||
          name.includes(q) ||
          province.includes(q) ||
          currentOffice.includes(q) ||
          party.includes(q);

        const roleMatch = selectedRole === "ALL" || leader.role === selectedRole;
        const provinceMatch =
          selectedProvince === "ALL" ||
          province === selectedProvince.toLowerCase();

        return searchMatch && roleMatch && provinceMatch;
      })
      .sort((a, b) => {
        const scoreA = analyticsMap[a.leaderId]?.engagementScore || 0;
        const scoreB = analyticsMap[b.leaderId]?.engagementScore || 0;
        return scoreB - scoreA;
      });
  }, [leaders, searchText, selectedRole, selectedProvince, analyticsMap]);

  const handleChange = <K extends keyof LeaderForm>(key: K, value: LeaderForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "province") {
        next.district = "";
      }

      return next;
    });
  };

  const handleDistrictChange = (value: string) => {
    const matched = districts.find(
      (district) => district._id === value || district.districtId === value
    );

    setForm((prev) => ({
      ...prev,
      district: value,
      province: matched?.province || prev.province,
    }));
  };

  const handleEdit = (leader: LeaderRecord) => {
    setEditingLeaderId(leader.leaderId);
    setDuplicateInfo(null);
    setMessage("");
    setError("");

    setForm({
      leaderId: leader.leaderId || "",
      name: leader.name || "",
      role: leader.role || "MP",
      chamber: leader.chamber || "",
      currentOffice: leader.currentOffice || "",
      portfolio: leader.portfolio || "",
      party: leader.party || "",
      district: getDistrictValue(leader.district),
      province: leader.province || "",
      constituency: leader.constituency || "",
      electionProcess: leader.electionProcess || "",
      localLevel: leader.localLevel || "",
      ward: leader.ward || "",
      currentStatus: leader.currentStatus || "Current",
      age: leader.age != null ? String(leader.age) : "",
      birthPlace: leader.birthPlace || "",
      permanentAddress: leader.permanentAddress || "",
      gender: leader.gender || "",
      photo: leader.photo || "",
      officialSourceUrl: leader.officialSourceUrl || "",
      electionSourceUrl: leader.electionSourceUrl || "",
      badge: leader.badge || "",
      verified: !!leader.verified,
      startDate: leader.startDate ? String(leader.startDate).slice(0, 10) : "",
      endDate: leader.endDate ? String(leader.endDate).slice(0, 10) : "",
      startYear: leader.startYear || "",
      endYear: leader.endYear || "Present",
      positionsText: buildPositionsText(leader.positions),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingLeaderId(null);
    setForm(emptyForm);
    setDuplicateInfo(null);
    setMessage("");
    setError("");
  };

  const buildPayload = () => ({
    leaderId: form.leaderId.trim(),
    name: form.name.trim(),
    role: form.role,
    chamber: form.chamber,
    currentOffice: form.currentOffice.trim(),
    portfolio: form.portfolio.trim(),
    positions: parsePositionsText(form.positionsText),
    party: form.party.trim(),
    district: form.district || null,
    province: form.province.trim(),
    constituency: form.constituency.trim(),
    electionProcess: form.electionProcess.trim(),
    localLevel: form.localLevel.trim(),
    ward: form.ward.trim(),
    currentStatus: form.currentStatus,
    age: form.age ? Number(form.age) : null,
    birthPlace: form.birthPlace.trim(),
    permanentAddress: form.permanentAddress.trim(),
    gender: form.gender.trim(),
    photo: form.photo.trim(),
    officialSourceUrl: form.officialSourceUrl.trim(),
    electionSourceUrl: form.electionSourceUrl.trim(),
    badge: form.badge.trim(),
    verified: form.verified,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    startYear: form.startYear.trim(),
    endYear: form.endYear.trim(),
  });

  const handleSubmit = async () => {
    if (!token) {
      setError("Please login as admin first.");
      return;
    }

    if (!form.name.trim()) {
      setError("Leader name is required.");
      return;
    }

    if (!form.role.trim()) {
      setError("Role is required.");
      return;
    }

    if (!editingLeaderId && duplicateInfo?.exactMatch) {
      setError("A similar leader already exists. Check the suggestions below before saving.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const payload = buildPayload();

      if (editingLeaderId) {
        const res = await api.updateLeader(token, editingLeaderId, payload);
        setMessage(res.message || "Leader updated successfully");
      } else {
        const res = await api.createLeader(token, payload);
        setMessage(res.message || "Leader created successfully");
      }

      resetForm();
      await loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save leader"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (leaderId: string) => {
    if (!token) {
      setError("Please login as admin first.");
      return;
    }

    const confirmed = window.confirm("Delete this leader?");
    if (!confirmed) return;

    try {
      const res = await api.deleteLeader(token, leaderId);
      setMessage(res.message || "Leader deleted successfully");

      if (editingLeaderId === leaderId) {
        resetForm();
      }

      await loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete leader"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Leaders</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage leaders, roles, offices, and public engagement
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
        title="Leaders Directory"
        description="Search leader records, filter by role and province, and monitor public activity."
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative w-full xl:max-w-[460px]">
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setOpenSuggestions(true);
                }}
                onFocus={() => setOpenSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setOpenSuggestions(false), 150);
                }}
                placeholder="Search leader name, office, party..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-300 focus:bg-white"
              />

              {openSuggestions && searchText.trim() && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-slate-200 bg-white shadow-lg">
                  {searchSuggestions.length > 0 ? (
                    searchSuggestions.map((leader) => (
                      <button
                        key={leader.leaderId}
                        type="button"
                        onMouseDown={() => {
                          setSearchText(leader.name);
                          setOpenSuggestions(false);
                        }}
                        className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {leader.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {leader.role} • {leader.currentOffice || leader.province || "No province"}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      No matching leader found
                    </div>
                  )}
                </div>
              )}
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="Prime Minister">Prime Minister</option>
              <option value="Minister">Minister</option>
              <option value="MP">MP</option>
              <option value="National Assembly Member">National Assembly Member</option>
              <option value="Mayor">Mayor</option>
              <option value="Chairperson">Chairperson</option>
              <option value="Ward Chairperson">Ward Chairperson</option>
            </select>

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
          </div>

          <button
            type="button"
            onClick={resetForm}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {editingLeaderId ? "Cancel Edit" : "New Entry"}
          </button>
        </div>
      </AdminPageSection>

      <AdminFormCard
        title={editingLeaderId ? "Edit Leader" : "Add Leader"}
        subtitle="Save clean leader data and avoid duplicates before submit."
        actions={
          <>
            <button
              onClick={handleSubmit}
              disabled={submitting || (!editingLeaderId && !!duplicateInfo?.exactMatch)}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting
                ? editingLeaderId
                  ? "Updating..."
                  : "Saving..."
                : editingLeaderId
                ? "Update Leader"
                : "Save Leader"}
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
            placeholder="Leader name"
          />
          {duplicateLoading ? (
            <p className="mt-2 text-xs text-slate-500">Checking similar names...</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Leader ID</label>
          <input
            value={form.leaderId}
            onChange={(e) => handleChange("leaderId", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Optional custom ID"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
          <select
            value={form.role}
            onChange={(e) => handleChange("role", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
          >
            <option value="Prime Minister">Prime Minister</option>
            <option value="Minister">Minister</option>
            <option value="MP">MP</option>
            <option value="National Assembly Member">National Assembly Member</option>
            <option value="Mayor">Mayor</option>
            <option value="Chairperson">Chairperson</option>
            <option value="Ward Chairperson">Ward Chairperson</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Current Status</label>
          <select
            value={form.currentStatus}
            onChange={(e) => handleChange("currentStatus", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
          >
            <option value="Current">Current</option>
            <option value="Former">Former</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Current Office</label>
          <input
            value={form.currentOffice}
            onChange={(e) => handleChange("currentOffice", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Minister for Finance, Deputy Speaker, etc."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Party</label>
          <input
            value={form.party}
            onChange={(e) => handleChange("party", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Party name"
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
          <label className="mb-2 block text-sm font-medium text-slate-700">District</label>
          <select
            value={form.district}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
          >
            <option value="">Select district</option>
            {filteredDistricts.map((district) => (
              <option
                key={district._id || district.districtId}
                value={district._id || district.districtId}
              >
                {district.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Chamber</label>
          <select
            value={form.chamber}
            onChange={(e) => handleChange("chamber", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
          >
            <option value="">Select chamber</option>
            <option value="House of Representatives">House of Representatives</option>
            <option value="National Assembly">National Assembly</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Constituency</label>
          <input
            value={form.constituency}
            onChange={(e) => handleChange("constituency", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Chitwan-2, Election Area No.-2, etc."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Election Process</label>
          <input
            value={form.electionProcess}
            onChange={(e) => handleChange("electionProcess", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Direct, Proportional, Indirect"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Portfolio</label>
          <input
            value={form.portfolio}
            onChange={(e) => handleChange("portfolio", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Portfolio / ministry"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Badge</label>
          <input
            value={form.badge}
            onChange={(e) => handleChange("badge", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Badge text"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Start Date</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">End Date</label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Start Year</label>
          <input
            value={form.startYear}
            onChange={(e) => handleChange("startYear", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="2026"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">End Year</label>
          <input
            value={form.endYear}
            onChange={(e) => handleChange("endYear", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Present"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Age</label>
          <input
            value={form.age}
            onChange={(e) => handleChange("age", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
          <input
            value={form.gender}
            onChange={(e) => handleChange("gender", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Local Level</label>
          <input
            value={form.localLevel}
            onChange={(e) => handleChange("localLevel", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Municipality / Rural Municipality"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Ward</label>
          <input
            value={form.ward}
            onChange={(e) => handleChange("ward", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Ward number"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Birth Place</label>
          <input
            value={form.birthPlace}
            onChange={(e) => handleChange("birthPlace", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Birth place"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Permanent Address</label>
          <input
            value={form.permanentAddress}
            onChange={(e) => handleChange("permanentAddress", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Permanent address"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Photo URL</label>
          <input
            value={form.photo}
            onChange={(e) => handleChange("photo", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Official Source URL</label>
          <input
            value={form.officialSourceUrl}
            onChange={(e) => handleChange("officialSourceUrl", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Election Source URL</label>
          <input
            value={form.electionSourceUrl}
            onChange={(e) => handleChange("electionSourceUrl", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="https://..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Positions</label>
          <textarea
            value={form.positionsText}
            onChange={(e) => handleChange("positionsText", e.target.value)}
            rows={6}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder={`One line per position
Example:
Member of Parliament :: MP | House of Representatives |  |  | Current | 2022-11-20 |  | https://...
Minister for Law, Justice and Parliamentary Affairs :: Minister | Government of Nepal | Ministry of Law, Justice and Parliamentary Affairs | Law, Justice and Parliamentary Affairs | Current | 2026-03-27 |  | https://...`}
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            id="verified"
            type="checkbox"
            checked={form.verified}
            onChange={(e) => handleChange("verified", e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <label htmlFor="verified" className="text-sm font-medium text-slate-700">
            Verified leader profile
          </label>
        </div>

        {!editingLeaderId && duplicateInfo?.exactMatch ? (
          <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">
              Similar leader already exists in database
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Check these records before creating a duplicate.
            </p>

            <div className="mt-3 space-y-2">
              {(duplicateInfo.matches || []).map((item) => (
                <button
                  key={item.leaderId}
                  type="button"
                  onClick={() =>
                    handleEdit({
                      leaderId: item.leaderId,
                      name: item.name,
                      role: item.role || "MP",
                      party: item.party,
                      province: item.province,
                      district: item.district || "",
                    })
                  }
                  className="block w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-left"
                >
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.role || "No role"} • {item.party || "No party"} • {item.district || "No district"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </AdminFormCard>

      <AdminDataTable
        title="Leader Records"
        subtitle={`Showing ${filteredLeaders.length} leader records`}
        rows={filteredLeaders}
        emptyMessage={loading ? "Loading leaders..." : "No leaders found."}
        columns={[
          {
            key: "leader",
            header: "Leader",
            render: (row) => (
              <div className="flex items-center gap-3">
                {row.photo ? (
                  <img
                    src={row.photo}
                    alt={row.name}
                    className="h-10 w-10 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-2xl bg-slate-200" />
                )}

                <div>
                  <p className="font-semibold text-slate-900">{row.name}</p>
                  <p className="text-xs text-slate-500">{row.leaderId}</p>
                </div>
              </div>
            ),
          },
          {
            key: "role",
            header: "Role / Office",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-900">{row.role}</p>
                <p className="text-xs text-slate-500">
                  {row.currentOffice || row.currentStatus || "Current"}
                </p>
              </div>
            ),
          },
          {
            key: "location",
            header: "Location",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-900">{getDistrictName(row.district) || "—"}</p>
                <p className="text-xs text-slate-500">{row.province || "—"}</p>
              </div>
            ),
          },
          {
            key: "engagement",
            header: "Performance",
            render: (row) => {
              const stats = analyticsMap[row.leaderId];

              return (
                <div>
                  <p className="font-semibold text-slate-900">
                    Score: {stats?.engagementScore ?? 0}
                  </p>
                  <p className="text-xs text-slate-500">
                    Comments: {stats?.commentCount ?? 0} • Votes: {stats?.voteCount ?? 0} • Rating:{" "}
                    {stats?.avgRating ?? 0}
                  </p>
                </div>
              );
            },
          },
          {
            key: "party",
            header: "Party / Badge",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-900">{row.party || "—"}</p>
                <p className="text-xs text-slate-500">{row.badge || "—"}</p>
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
                  onClick={() => handleDelete(row.leaderId)}
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

export default AdminLeaders;
