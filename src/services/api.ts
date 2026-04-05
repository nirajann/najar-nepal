const API_BASE_URL = "http://localhost:5000/api";

type UnauthorizedHandler = (() => void) | null;

let unauthorizedHandler: UnauthorizedHandler = null;

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

async function parseJsonResponse(res: Response) {
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && unauthorizedHandler) {
    unauthorizedHandler();
  }

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function buildUrl(path: string, params?: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.append(key, value);
    });
  }

  return `${API_BASE_URL}${path}${query.toString() ? `?${query.toString()}` : ""}`;
}

function authHeaders(token?: string, isJson = false) {
  return {
    ...(isJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  register: async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: authHeaders(undefined, true),
      body: JSON.stringify({ name, email, password }),
    });
    return parseJsonResponse(res);
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: authHeaders(undefined, true),
      body: JSON.stringify({ email, password }),
    });
    return parseJsonResponse(res);
  },

  updateProfile: async (token: string, profileData: any) => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: authHeaders(token, true),
      body: JSON.stringify(profileData),
    });
    return parseJsonResponse(res);
  },

  getLeaders: async (params?: {
    role?: string;
    districtId?: string;
    province?: string;
    search?: string;
  }) => {
    const res = await fetch(
      buildUrl("/leaders", {
        role: params?.role,
        districtId: params?.districtId,
        province: params?.province,
        search: params?.search,
      })
    );
    return parseJsonResponse(res);
  },

  getLeaderById: async (leaderId: string) => {
    const res = await fetch(`${API_BASE_URL}/leaders/${leaderId}`);
    return parseJsonResponse(res);
  },

  createLeader: async (token: string, payload: any) => {
    const res = await fetch(`${API_BASE_URL}/leaders`, {
      method: "POST",
      headers: authHeaders(token, true),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(res);
  },

  updateLeader: async (token: string, leaderId: string, payload: any) => {
    const res = await fetch(`${API_BASE_URL}/leaders/${leaderId}`, {
      method: "PUT",
      headers: authHeaders(token, true),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(res);
  },

  deleteLeader: async (token: string, leaderId: string) => {
    const res = await fetch(`${API_BASE_URL}/leaders/${leaderId}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return parseJsonResponse(res);
  },

  getDistricts: async (params?: { province?: string; search?: string }) => {
    const res = await fetch(
      buildUrl("/districts", {
        province: params?.province,
        search: params?.search,
      })
    );
    return parseJsonResponse(res);
  },

  getDistrictById: async (districtId: string) => {
    const res = await fetch(`${API_BASE_URL}/districts/${districtId}`);
    return parseJsonResponse(res);
  },

  createDistrict: async (token: string, payload: any) => {
    const res = await fetch(`${API_BASE_URL}/districts`, {
      method: "POST",
      headers: authHeaders(token, true),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(res);
  },

  updateDistrict: async (token: string, districtId: string, payload: any) => {
    const res = await fetch(`${API_BASE_URL}/districts/${districtId}`, {
      method: "PUT",
      headers: authHeaders(token, true),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(res);
  },

  deleteDistrict: async (token: string, districtId: string) => {
    const res = await fetch(`${API_BASE_URL}/districts/${districtId}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return parseJsonResponse(res);
  },

  getProjects: async (params?: {
    status?: string;
    district?: string;
    province?: string;
    search?: string;
  }) => {
    const res = await fetch(
      buildUrl("/projects", {
        status: params?.status,
        district: params?.district,
        province: params?.province,
        search: params?.search,
      })
    );
    return parseJsonResponse(res);
  },

  getProjectById: async (projectId: string) => {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}`);
    return parseJsonResponse(res);
  },

  getComplaints: async (params?: {
    status?: string;
    category?: string;
    search?: string;
  }) => {
    const res = await fetch(
      buildUrl("/complaints", {
        status: params?.status,
        category: params?.category,
        search: params?.search,
      })
    );
    return parseJsonResponse(res);
  },

  getUsers: async (token: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/users`, {
      headers: authHeaders(token),
    });
    return parseJsonResponse(res);
  },

  createComment: async (
    token: string,
    leaderId: string,
    text: string,
    rating: number
  ) => {
    const res = await fetch(`${API_BASE_URL}/comments`, {
      method: "POST",
      headers: authHeaders(token, true),
      body: JSON.stringify({ leaderId, text, rating }),
    });
    return parseJsonResponse(res);
  },

  getAdminAnalyticsOverview: async (token: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/analytics/overview`, {
      headers: authHeaders(token),
    });
    return parseJsonResponse(res);
  },

  getAdminLeaderAnalytics: async (token: string, leaderId: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/analytics/leader/${leaderId}`, {
      headers: authHeaders(token),
    });
    return parseJsonResponse(res);
  },

 submitRating: async (
  token: string,
  leaderId: string,
  value: number,
  action?: "like" | "dislike"
) => {
  const res = await fetch(`${API_BASE_URL}/ratings`, {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify({
      leaderId,
      value,
      reaction: action, // backend expects reaction, not action
    }),
  });
  return parseJsonResponse(res);
},

getLeaderStats: async (leaderId: string) => {
  const res = await fetch(`${API_BASE_URL}/ratings/${leaderId}/stats`);
  return parseJsonResponse(res);
},


  getComments: async (leaderId: string, sort = "newest") => {
    const res = await fetch(
      buildUrl("/comments", {
        leaderId,
        sort,
      })
    );
    return parseJsonResponse(res);
  },
  submitComplaint: async (
    token: string,
    leaderId: string,
    text: string,
    complaintType: string,
    complaintPhoto?: string
  ) => {
    const res = await fetch(`${API_BASE_URL}/complaints`, {
      method: "POST",
      headers: authHeaders(token, true),
      body: JSON.stringify({
        leaderId,
        text,
        complaintType,
        complaintPhoto,
      }),
    });
    return parseJsonResponse(res);
  },




  likeComment: async (token: string, commentId: string) => {
    const res = await fetch(`${API_BASE_URL}/comments/${commentId}/like`, {
      method: "POST",
      headers: authHeaders(token),
    });
    return parseJsonResponse(res);
  },

  replyComment: async (token: string, commentId: string, text: string) => {
    const res = await fetch(`${API_BASE_URL}/comments/${commentId}/reply`, {
      method: "POST",
      headers: authHeaders(token, true),
      body: JSON.stringify({ text }),
    });
    return parseJsonResponse(res);
  },

  getMyComplaintsByLeader: async (token: string, leaderId: string) => {
    const res = await fetch(
      buildUrl("/complaints/my", {
        leaderId,
      }),
      {
        headers: authHeaders(token),
      }
    );
    return parseJsonResponse(res);
  },

  getAdminProjects: async (
    token: string,
    params?: {
      search?: string;
      status?: string;
      district?: string;
      province?: string;
    }
  ) => {
    const res = await fetch(
      buildUrl("/admin/projects", {
        search: params?.search,
        status: params?.status,
        district: params?.district,
        province: params?.province,
      }),
      {
        headers: authHeaders(token),
      }
    );
    return parseJsonResponse(res);
  },

  createAdminProject: async (token: string, payload: any) => {
    const res = await fetch(`${API_BASE_URL}/admin/projects`, {
      method: "POST",
      headers: authHeaders(token, true),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(res);
  },

  updateAdminProject: async (token: string, projectId: string, payload: any) => {
    const res = await fetch(`${API_BASE_URL}/admin/projects/${projectId}`, {
      method: "PUT",
      headers: authHeaders(token, true),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(res);
  },

  deleteAdminProject: async (token: string, projectId: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/projects/${projectId}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return parseJsonResponse(res);
  },

  getAdminUsers: async (token: string, params?: { search?: string }) => {
    const res = await fetch(
      buildUrl("/auth/users", {
        search: params?.search,
      }),
      {
        headers: authHeaders(token),
      }
    );
    return parseJsonResponse(res);
  },

  updateAdminUser: async (token: string, userId: string, payload: any) => {
    const res = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
      method: "PUT",
      headers: authHeaders(token, true),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(res);
  },

  deleteAdminUser: async (token: string, userId: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return parseJsonResponse(res);
  },

  createAdminUser: async (token: string, payload: any) => {
    const res = await fetch(`${API_BASE_URL}/auth/users`, {
      method: "POST",
      headers: authHeaders(token, true),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(res);
  },

  checkLeaderDuplicate: async (params: {
    name: string;
    role?: string;
    districtId?: string;
  }) => {
    const res = await fetch(
      buildUrl("/leaders/check-duplicate", {
        name: params.name,
        role: params.role,
        districtId: params.districtId,
      })
    );
    return parseJsonResponse(res);
  },

  checkDistrictDuplicate: async (params: {
    name: string;
    province?: string;
  }) => {
    const res = await fetch(
      buildUrl("/districts/check-duplicate", {
        name: params.name,
        province: params.province,
      })
    );
    return parseJsonResponse(res);
  },

  checkProjectDuplicate: async (params: {
    title: string;
    district?: string;
    province?: string;
  }) => {
    const res = await fetch(
      buildUrl("/admin/projects/check-duplicate", {
        title: params.title,
        district: params.district,
        province: params.province,
      })
    );
    return parseJsonResponse(res);
  },

  checkUserDuplicate: async (params: { email: string }) => {
    const res = await fetch(
      buildUrl("/auth/users/check-duplicate", {
        email: params.email,
      })
    );
    return parseJsonResponse(res);
  },


  getAdminComplaints: async (
  token: string,
  params?: {
    search?: string;
    status?: string;
    complaintType?: string;
  }
) => {
  const res = await fetch(
    buildUrl("/admin/complaints", {
      search: params?.search,
      status: params?.status,
      complaintType: params?.complaintType,
    }),
    {
      headers: authHeaders(token),
    }
  );
  return parseJsonResponse(res);
},

updateAdminComplaint: async (token: string, complaintId: string, payload: any) => {
  const res = await fetch(`${API_BASE_URL}/admin/complaints/${complaintId}`, {
    method: "PUT",
    headers: authHeaders(token, true),
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res);
},

deleteAdminComplaint: async (token: string, complaintId: string) => {
  const res = await fetch(`${API_BASE_URL}/admin/complaints/${complaintId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return parseJsonResponse(res);
},
};