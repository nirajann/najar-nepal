import type { DistrictInfo } from "../types/home";

const DEFAULT_DEV_API_BASE_URL = "http://localhost:5000/api";
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type Primitive = string | number | boolean;
type QueryValue = Primitive | null | undefined;

type UnauthorizedHandler = (() => void) | null;

type RequestOptions = {
  method?: HttpMethod;
  token?: string;
  body?: unknown;
  params?: Record<string, QueryValue>;
  signal?: AbortSignal;
  retry?: boolean;
  timeoutMs?: number;
  isBlob?: boolean;
};

type AnalyticsMetadata = Record<
  string,
  string | number | boolean | null | undefined
>;
export type ApiMessageResponse = {
  message?: string;
  error?: string;
};

export type AuthUser = {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  district?: string;
  province?: string;
  birthplace?: string;
  bio?: string;
  profilePhoto?: string;
  role?: "user" | "admin" | "reviewer";
  verificationStatus?: "unverified" | "pending" | "verified" | "rejected";
  verificationNotes?: string;
  verificationSubmittedAt?: string;
  verificationReviewedAt?: string;
  badges?: string[];
};

export type ProfileResponse = ApiMessageResponse & {
  message?: string;
  user?: AuthUser;
};

export type RatingResponse = ApiMessageResponse & {
  message?: string;
  rating?: {
    value?: number;
    reaction?: string;
    comment?: string;
  };
};

export type AdminAnalyticsOverviewResponse = {
  totals?: Record<string, number>;
  engagement?: Record<string, number>;
  leaderBreakdown?: unknown[];
  districtBreakdown?: unknown[];
  complaintBreakdown?: unknown[];
  recentActivity?: unknown[];
  message?: string;
};

export type LeaderPublicProfileResponse = {
  leader?: unknown;
  stats?: {
    likes?: number;
    dislikes?: number;
    totalReactions?: number;
    averageRating?: number;
    rating?: number;
    likePercentage?: string;
    dislikePercentage?: string;
    ratingCount?: number;
  };
  comments?: unknown[];
  ratingSummary?: unknown;
  message?: string;
};

export type DistrictFeedbackSummary = {
  score?: number | null;
  verifiedContributors?: number;
  [key: string]: unknown;
};

export type DistrictFeedbackValues = {
  transportation?: number;
  roads?: number;
  safety?: number;
  cleanliness?: number;
  publicServices?: number;
  scenery?: number;
};

export type DistrictFeedbackResponse = ApiMessageResponse & {
  message?: string;
  summary?: DistrictFeedbackSummary | null;
  feedback?: DistrictFeedbackValues | null;
};

export type DuplicateCheckResponse<T = unknown> = ApiMessageResponse & {
  exactMatch?: boolean;
  exists?: boolean;
  matches?: T[];
  isDuplicate?: boolean;
  duplicate?: boolean;
};

export type ComplaintItem = {
  _id?: string;
  id?: string;
  leaderId?: string;
  complaintType?: string;
  status?: string;
  text?: string;
  complaintPhoto?: string;
  adminNote?: string;
  createdAt?: string;
  updatedAt?: string;
  leader?: {
    _id?: string;
    leaderId?: string;
    name?: string;
    role?: string;
    district?: string;
    province?: string;
    photo?: string;
  } | null;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
  } | null;
};

export type VerificationSubmitResponse = {
  user?: AuthUser;
  message?: string;
  error?: string;
};

export type VerificationDocumentsResponse = {
  id?: string;
  name?: string;
  email?: string;
  verificationStatus?: string;
  citizenshipNumber?: string;
  hasCitizenshipFrontPhoto?: boolean;
  hasCitizenshipBackPhoto?: boolean;
  hasVerificationSelfiePhoto?: boolean;
  citizenshipFrontPhotoUrl?: string;
  citizenshipBackPhotoUrl?: string;
  verificationSelfiePhotoUrl?: string;
  verificationSubmittedAt?: string;
  verificationNotes?: string;
  message?: string;
};

type LoginResponse = {
  token: string;
  user: AuthUser;
  message?: string;
};

export type GenericListResponse<T> = {
  rows?: T[];
  data?: T[];
  leaders?: T[];
  districts?: T[];
  projects?: T[];
  users?: T[];
  complaints?: T[];
  total?: number;
  generatedAt?: string;
};

type LeaderItem = {
  _id?: string;
  leaderId: string;
  name: string;
  role: string;
  party?: string;
  district?: unknown;
  districtName?: string;
  province?: string;
  currentStatus?: string;
  photo?: string;
  badge?: string;
  verified?: boolean;
  stats?: {
    likes?: number;
    dislikes?: number;
    comments?: number;
    averageRating?: number;
    engagementScore?: number;
    totalReactions?: number;
    ratingCount?: number;
  };
};

type ProjectItem = {
  id?: string;
  projectId?: string;
  title?: string;
  titleEn?: string;
  titleNp?: string;
  category?: string;
  status?: string;
  updatedAt?: string;
  lastUpdated?: string;
  district?: string;
  province?: string;
  progress?: number;
  source?: string;
  sourceName?: string;
  daysText?: string;
};

function resolveApiBaseUrl() {
  const rawBase = (import.meta.env.VITE_API_BASE_URL || "").trim();
  const isProd = import.meta.env.PROD;
  const candidate = rawBase || (isProd ? "" : DEFAULT_DEV_API_BASE_URL);

  if (!candidate) {
    throw new Error("VITE_API_BASE_URL is required in production.");
  }

  let parsed: URL;

  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error("VITE_API_BASE_URL must be a valid absolute URL.");
  }

  if (isProd) {
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      throw new Error("VITE_API_BASE_URL must not point to localhost in production.");
    }
  }

  const normalizedPath = parsed.pathname.replace(/\/+$/, "");
  if (!normalizedPath.endsWith("/api")) {
    parsed.pathname = `${normalizedPath}/api`;
  } else {
    parsed.pathname = normalizedPath;
  }

  return parsed.toString().replace(/\/+$/, "");
}

const API_BASE_URL = resolveApiBaseUrl();

let unauthorizedHandler: UnauthorizedHandler = null;

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

function getStoredId(storage: Storage, key: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;

  const next =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  storage.setItem(key, next);
  return next;
}

function getAnalyticsIdentity() {
  if (typeof window === "undefined") {
    return { visitorKey: "", sessionId: "" };
  }

  return {
    visitorKey: getStoredId(window.localStorage, "analytics-visitor-key"),
    sessionId: getStoredId(window.sessionStorage, "analytics-session-id"),
  };
}

function buildUrl(path: string, params?: Record<string, QueryValue>) {
  const query = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, String(value));
      }
    });
  }

  return `${API_BASE_URL}${path}${query.toString() ? `?${query.toString()}` : ""}`;
}

function buildHeaders(token?: string, isJson = false) {
  return {
    ...(isJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getMessageFromUnknown(data: unknown) {
  if (!data || typeof data !== "object") return undefined;
  const payload = data as { message?: string; error?: string };
  return payload.message || payload.error;
}

function normalizeErrorMessage(status: number, data: unknown, rawText: string) {
  return (
    getMessageFromUnknown(data) ||
    rawText ||
    `Request failed with status ${status}`
  );
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  let data: unknown = null;
  let rawText = "";

  try {
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      rawText = await res.text();
    }
  } catch (error) {
    console.error("Failed to parse response body:", error);
  }

  if (res.status === 401 && unauthorizedHandler) {
    unauthorizedHandler();
  }

  if (!res.ok) {
    throw new Error(normalizeErrorMessage(res.status, data, rawText));
  }

  return (data ?? rawText) as T;
}

async function parseBlobResponse(res: Response): Promise<Blob> {
  if (res.status === 401 && unauthorizedHandler) {
    unauthorizedHandler();
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;

    try {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        message = getMessageFromUnknown(data) || message;
      } else {
        const rawText = await res.text();
        message = rawText || message;
      }
    } catch {
      // ignore parse failure
    }

    throw new Error(message);
  }

  return res.blob();
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    token,
    body,
    params,
    signal,
    retry = method === "GET",
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    isBlob = false,
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeout);
      throw new Error("Request was cancelled.");
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }

  const isJson = body !== undefined && body !== null && !isBlob;

  try {
    const res = await fetch(buildUrl(path, params), {
      method,
      headers: buildHeaders(token, isJson),
      body: isJson ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (isBlob) {
      return (await parseBlobResponse(res)) as T;
    }

    return await parseJsonResponse<T>(res);
  } catch (error: unknown) {
    const isAbortError =
      error instanceof Error && error.name === "AbortError";

    if (isAbortError) {
      throw new Error("The request timed out or was cancelled.");
    }

    if (retry && method === "GET") {
      return request<T>(path, {
        ...options,
        retry: false,
      });
    }

    throw error;
  } finally {
    clearTimeout(timeout);
    if (signal) {
      signal.removeEventListener("abort", onAbort);
    }
  }
}

function get<T>(
  path: string,
  params?: Record<string, QueryValue>,
  token?: string,
  signal?: AbortSignal
) {
  return request<T>(path, {
    method: "GET",
    params,
    token,
    signal,
  });
}

function post<T>(
  path: string,
  body?: unknown,
  token?: string,
  signal?: AbortSignal
) {
  return request<T>(path, {
    method: "POST",
    body,
    token,
    signal,
  });
}

function put<T>(
  path: string,
  body?: unknown,
  token?: string,
  signal?: AbortSignal
) {
  return request<T>(path, {
    method: "PUT",
    body,
    token,
    signal,
  });
}

function patch<T>(
  path: string,
  body?: unknown,
  token?: string,
  signal?: AbortSignal
) {
  return request<T>(path, {
    method: "PATCH",
    body,
    token,
    signal,
  });
}

function del<T>(path: string, token?: string, signal?: AbortSignal) {
  return request<T>(path, {
    method: "DELETE",
    token,
    signal,
  });
}

export const api = {
  register: async (
    name: string,
    email: string,
    password: string
  ): Promise<ApiMessageResponse & Partial<LoginResponse>> =>
    post("/auth/register", { name, email, password }),

  login: async (
    email: string,
    password: string
  ): Promise<LoginResponse> =>
    post("/auth/login", { email, password }),

  updateProfile: async (
    token: string,
    profileData: Partial<AuthUser>
  ): Promise<ProfileResponse> =>
    put("/auth/profile", profileData, token),

  getProfile: async (token: string): Promise<ProfileResponse> =>
    get("/auth/profile", undefined, token),

  submitVerification: async (
    token: string,
    payload: {
      citizenshipNumber: string;
      citizenshipFrontPhoto: string;
      citizenshipBackPhoto: string;
      verificationSelfiePhoto?: string;
      district?: string;
      province?: string;
    }
  ): Promise<VerificationSubmitResponse> =>
    post("/auth/verification/submit", payload, token),

  getUserVerificationDocuments: async (
    token: string,
    userId: string
  ): Promise<VerificationDocumentsResponse> =>
    get(`/auth/users/${userId}/verification-documents`, undefined, token),

  getVerificationDocumentBlob: async (
    token: string,
    userId: string,
    documentType: "front" | "back" | "selfie"
  ) =>
    request<Blob>(
      `/auth/users/${userId}/verification-documents/${documentType}`,
      {
        method: "GET",
        token,
        isBlob: true,
      }
    ),

  reviewUserVerification: async (
    token: string,
    userId: string,
    payload: {
      verificationStatus: "pending" | "verified" | "rejected";
      verificationNotes?: string;
    }
  ) => put(`/auth/users/${userId}/review-verification`, payload, token),

  getPendingVerificationUsers: async (token: string): Promise<AuthUser[]> => {
    const data = await get<AuthUser[]>("/auth/users", undefined, token);
    if (!Array.isArray(data)) return [];
    return data.filter((user) => user.verificationStatus === "pending");
  },

  getLeaders: async (params?: {
    role?: string;
    districtId?: string;
    province?: string;
    search?: string;
    currentStatus?: string;
    verified?: string;
    page?: string | number;
    limit?: string | number;
  }): Promise<LeaderItem[] | GenericListResponse<LeaderItem>> =>
    get("/leaders", {
      role: params?.role,
      districtId: params?.districtId,
      province: params?.province,
      search: params?.search,
      currentStatus: params?.currentStatus,
      verified: params?.verified,
      page: params?.page,
      limit: params?.limit,
    }),

  getLeadersRankingSummary: async (params?: {
    role?: string;
    districtId?: string;
    province?: string;
    search?: string;
    currentStatus?: string;
    verified?: string;
    limit?: string | number;
  }): Promise<LeaderItem[] | GenericListResponse<LeaderItem> | { data?: LeaderItem[]; generatedAt?: string }> =>
    get("/leaders/ranking-summary", {
      role: params?.role,
      districtId: params?.districtId,
      province: params?.province,
      search: params?.search,
      currentStatus: params?.currentStatus,
      verified: params?.verified,
      limit: params?.limit,
    }),

  getLeaderById: async (leaderId: string) => get(`/leaders/${leaderId}`),

  getLeaderPublicProfile: async (
    leaderId: string,
    params?: {
      sort?: string;
      limit?: string | number;
    }
  ): Promise<LeaderPublicProfileResponse> =>
    get(`/leaders/${leaderId}/public-profile`, {
      sort: params?.sort,
      limit: params?.limit,
    }),

  createLeader: async (token: string, payload: unknown): Promise<ApiMessageResponse> =>
    post("/leaders", payload, token),

  updateLeader: async (
    token: string,
    leaderId: string,
    payload: unknown
  ): Promise<ApiMessageResponse> =>
    put(`/leaders/${leaderId}`, payload, token),

  deleteLeader: async (token: string, leaderId: string): Promise<ApiMessageResponse> =>
    del(`/leaders/${leaderId}`, token),

  getDistricts: async (params?: {
    province?: string;
    search?: string;
    page?: string | number;
    limit?: string | number;
  }): Promise<DistrictInfo[] | GenericListResponse<DistrictInfo>> =>
    get("/districts", {
      province: params?.province,
      search: params?.search,
      page: params?.page,
      limit: params?.limit,
    }),

  getDistrictById: async (districtId: string) => get(`/districts/${districtId}`),

  createDistrict: async (
    token: string,
    payload: unknown
  ): Promise<ApiMessageResponse & { district?: DistrictInfo }> =>
    post("/districts", payload, token),

  updateDistrict: async (
    token: string,
    districtId: string,
    payload: unknown
  ): Promise<ApiMessageResponse & { district?: DistrictInfo }> =>
    put(`/districts/${districtId}`, payload, token),

  deleteDistrict: async (
    token: string,
    districtId: string
  ): Promise<ApiMessageResponse> =>
    del(`/districts/${districtId}`, token),

  getProjects: async (params?: {
    status?: string;
    district?: string;
    province?: string;
    search?: string;
    page?: string | number;
    limit?: string | number;
  }): Promise<ProjectItem[] | GenericListResponse<ProjectItem>> =>
    get("/projects", {
      status: params?.status,
      district: params?.district,
      province: params?.province,
      search: params?.search,
      page: params?.page,
      limit: params?.limit,
    }),

  getProjectById: async (projectId: string) => get(`/projects/${projectId}`),

  getComplaints: async (params?: {
    status?: string;
    category?: string;
    search?: string;
    page?: string | number;
    limit?: string | number;
  }): Promise<ComplaintItem[] | GenericListResponse<ComplaintItem>> =>
    get("/complaints", {
      status: params?.status,
      category: params?.category,
      search: params?.search,
      page: params?.page,
      limit: params?.limit,
    }),

  getUsers: async (token: string) => get("/auth/users", undefined, token),

  trackEvent: async (
    payload: {
      eventName: string;
      entityType?: string;
      entityId?: string;
      entityName?: string;
      sourcePage?: string;
      metadata?: AnalyticsMetadata;
    },
    token?: string
  ): Promise<ApiMessageResponse | null> => {
    try {
      const { visitorKey, sessionId } = getAnalyticsIdentity();

      return await post(
        "/analytics/events",
        {
          ...payload,
          visitorKey,
          sessionId,
        },
        token
      );
    } catch (error) {
      if (!import.meta.env.DEV) {
        console.warn("Analytics tracking failed:", error);
      }
      return null;
    }
  },

  createComment: async (
    token: string,
    leaderId: string,
    text: string,
    rating: number,
    sourcePage?: string
  ) =>
    post(
      "/comments",
      {
        leaderId,
        text,
        rating,
        sourcePage,
      },
      token
    ),

  getComments: async (
    leaderId: string,
    params?: {
      sort?: string;
      page?: string | number;
      limit?: string | number;
    }
  ) =>
    get(`/comments/${leaderId}`, {
      sort: params?.sort || "newest",
      page: params?.page,
      limit: params?.limit,
    }),

  likeComment: async (token: string, commentId: string) =>
    post(`/comments/${commentId}/like`, undefined, token),

  replyComment: async (token: string, commentId: string, text: string) =>
    post(`/comments/${commentId}/reply`, { text }, token),

  updateComment: async (token: string, commentId: string, text: string) =>
    put(`/comments/${commentId}`, { text }, token),

  deleteComment: async (token: string, commentId: string) =>
    del(`/comments/${commentId}`, token),

  pinComment: async (token: string, commentId: string, isPinned: boolean) =>
    patch(`/comments/${commentId}/pin`, { isPinned }, token),

  moderateComment: async (
    token: string,
    commentId: string,
    payload: {
      status: "visible" | "hidden" | "flagged";
      moderationReason?: string;
    }
  ) => patch(`/comments/${commentId}/moderate`, payload, token),

  getAdminAnalyticsOverview: async (
    token: string
  ): Promise<AdminAnalyticsOverviewResponse> =>
    get("/admin/analytics/overview", undefined, token),

  getAdminLeaderAnalytics: async (token: string, leaderId: string) =>
    get(`/admin/analytics/leader/${leaderId}`, undefined, token),

  submitRating: async (
    token: string,
    leaderId: string,
    value: number,
    action?: "like" | "dislike",
    sourcePage?: string,
    comment?: string
  ): Promise<RatingResponse> =>
    post(
      "/ratings",
      {
        leaderId,
        value,
        reaction: action,
        sourcePage,
        comment,
      },
      token
    ),

  getLeaderStats: async (leaderId: string) =>
    get(`/ratings/${leaderId}/stats`),

  getMyRating: async (token: string, leaderId: string) =>
    get(`/ratings/${leaderId}/my-rating`, undefined, token),

  deleteMyRating: async (token: string, leaderId: string) =>
    del(`/ratings/${leaderId}`, token),

  moderateRating: async (
    token: string,
    ratingId: string,
    payload: {
      status: "visible" | "hidden" | "flagged";
      moderationReason?: string;
    }
  ) => patch(`/ratings/${ratingId}/moderate`, payload, token),

  submitComplaint: async (
    token: string,
    leaderId: string,
    text: string,
    complaintType: string,
    complaintPhoto?: string
  ): Promise<ApiMessageResponse> =>
    post(
      "/complaints",
      {
        leaderId,
        text,
        complaintType,
        complaintPhoto,
      },
      token
    ),

  submitSupportIssue: async (payload: {
    issueCategory: string;
    pageSection: string;
    description: string;
    screenshotUrl?: string;
    name?: string;
    email?: string;
  }) => post("/support/issues", payload),

  submitSupportCorrection: async (payload: {
    affectedEntity: string;
    incorrectInfo: string;
    suggestedCorrection: string;
    sourceLink?: string;
    notes?: string;
  }) => post("/support/corrections", payload),

  submitSupportContact: async (payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => post("/support/contact", payload),

  submitSupportVolunteer: async (payload: {
    name: string;
    email: string;
    interests: string;
    availability?: string;
    notes?: string;
  }) => post("/support/volunteer", payload),

  getMyComplaintsByLeader: async (token: string, leaderId: string) =>
    get(
      "/complaints/my",
      {
        leaderId,
      },
      token
    ),

  getAdminProjects: async (
    token: string,
    params?: {
      search?: string;
      status?: string;
      district?: string;
      province?: string;
      page?: string | number;
      limit?: string | number;
    }
  ): Promise<ProjectItem[] | GenericListResponse<ProjectItem>> =>
    get(
      "/admin/projects",
      {
        search: params?.search,
        status: params?.status,
        district: params?.district,
        province: params?.province,
        page: params?.page,
        limit: params?.limit,
      },
      token
    ),

  createAdminProject: async (
    token: string,
    payload: unknown
  ): Promise<ApiMessageResponse> =>
    post("/admin/projects", payload, token),

  updateAdminProject: async (
    token: string,
    projectId: string,
    payload: unknown
  ): Promise<ApiMessageResponse> =>
    put(`/admin/projects/${projectId}`, payload, token),

  deleteAdminProject: async (
    token: string,
    projectId: string
  ): Promise<ApiMessageResponse> =>
    del(`/admin/projects/${projectId}`, token),

  getAdminUsers: async (
    token: string,
    params?: { search?: string; page?: string | number; limit?: string | number }
  ): Promise<AuthUser[] | GenericListResponse<AuthUser>> =>
    get(
      "/auth/users",
      {
        search: params?.search,
        page: params?.page,
        limit: params?.limit,
      },
      token
    ),

  updateAdminUser: async (
    token: string,
    userId: string,
    payload: unknown
  ): Promise<ApiMessageResponse> =>
    put(`/auth/users/${userId}`, payload, token),

  deleteAdminUser: async (
    token: string,
    userId: string
  ): Promise<ApiMessageResponse> =>
    del(`/auth/users/${userId}`, token),

  createAdminUser: async (
    token: string,
    payload: unknown
  ): Promise<ApiMessageResponse> =>
    post("/auth/users", payload, token),

  checkLeaderDuplicate: async (params: {
    name: string;
    districtId?: string;
  }): Promise<DuplicateCheckResponse<LeaderItem>> =>
    get("/leaders/check-duplicate", {
      name: params.name,
      districtId: params.districtId,
    }),

  checkDistrictDuplicate: async (params: {
    name: string;
    province?: string;
  }): Promise<DuplicateCheckResponse<DistrictInfo>> =>
    get("/districts/check-duplicate", {
      name: params.name,
      province: params.province,
    }),

  checkProjectDuplicate: async (
    token: string,
    params: {
      title: string;
      district?: string;
      province?: string;
    }
  ): Promise<DuplicateCheckResponse<ProjectItem>> =>
    get(
      "/admin/projects/check-duplicate",
      {
        title: params.title,
        district: params.district,
        province: params.province,
      },
      token
    ),

  checkUserDuplicate: async (
    params: { email: string }
  ): Promise<DuplicateCheckResponse<AuthUser>> =>
    get("/auth/users/check-duplicate", {
      email: params.email,
    }),

  getDistrictFeedbackSummary: async (
    districtId: string
  ): Promise<DistrictFeedbackResponse> =>
    get(`/district-feedback/${districtId}/summary`),

  getMyDistrictFeedback: async (
    token: string,
    districtId: string
  ): Promise<DistrictFeedbackResponse> =>
    get(`/district-feedback/${districtId}/my-feedback`, undefined, token),

  submitDistrictFeedback: async (
    token: string,
    districtId: string,
    payload: {
      transportation: number;
      roads: number;
      safety: number;
      cleanliness: number;
      publicServices: number;
      scenery: number;
    }
  ): Promise<DistrictFeedbackResponse> =>
    post(`/district-feedback/${districtId}`, payload, token),

  getAdminComplaints: async (
    token: string,
    params?: {
      search?: string;
      status?: string;
      complaintType?: string;
      page?: string | number;
      limit?: string | number;
    }
  ): Promise<ComplaintItem[] | GenericListResponse<ComplaintItem>> =>
    get(
      "/admin/complaints",
      {
        search: params?.search,
        status: params?.status,
        complaintType: params?.complaintType,
        page: params?.page,
        limit: params?.limit,
      },
      token
    ),

  updateAdminComplaint: async (
    token: string,
    complaintId: string,
    payload: unknown
  ): Promise<ApiMessageResponse> =>
    put(`/admin/complaints/${complaintId}`, payload, token),

  deleteAdminComplaint: async (
    token: string,
    complaintId: string
  ): Promise<ApiMessageResponse> =>
    del(`/admin/complaints/${complaintId}`, token),
};

export { API_BASE_URL, buildUrl, request };
