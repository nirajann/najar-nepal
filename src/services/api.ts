const API_BASE_URL = "http://localhost:5000/api";

async function parseJsonResponse(res: Response) {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const api = {
  register: async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    return parseJsonResponse(res);
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    return parseJsonResponse(res);
  },

  updateProfile: async (token: string, profileData: any) => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    return parseJsonResponse(res);
  },

  submitRating: async (
    token: string,
    leaderId: string,
    value: number,
    reaction = "",
    comment = ""
  ) => {
    const res = await fetch(`${API_BASE_URL}/ratings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ leaderId, value, reaction, comment }),
    });

    return parseJsonResponse(res);
  },

  getLeaderStats: async (leaderId: string) => {
    const res = await fetch(`${API_BASE_URL}/ratings/${leaderId}/stats`);
    return parseJsonResponse(res);
  },

  submitComplaint: async (
  token: string,
  leaderId: string,
  message: string,
  type = "Other",
  photo = ""
) => {
  const res = await fetch("http://localhost:5000/api/complaints", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      leaderId,
      type,
      message,
      photo,
    }),
  });

  return res.json();
},

getMyComplaintsByLeader: async (token: string, leaderId: string) => {
  const res = await fetch(`http://localhost:5000/api/complaints/mine/${leaderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
},

getAdminComplaints: async (token: string) => {
  const res = await fetch("http://localhost:5000/api/complaints", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
},

updateAdminComplaint: async (
  token: string,
  complaintId: string,
  payload: { status?: string; adminNote?: string }
) => {
  const res = await fetch(`http://localhost:5000/api/complaints/${complaintId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return res.json();
},
  getComments: async (leaderId: string, sort = "newest") => {
    const res = await fetch(
      `${API_BASE_URL}/comments/${leaderId}?sort=${encodeURIComponent(sort)}`
    );

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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ leaderId, text, rating }),
    });

    return parseJsonResponse(res);
  },

  likeComment: async (token: string, commentId: string) => {
    const res = await fetch(`${API_BASE_URL}/comments/${commentId}/like`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return parseJsonResponse(res);
  },

  replyComment: async (token: string, commentId: string, text: string) => {
    const res = await fetch(`${API_BASE_URL}/comments/${commentId}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });

    return parseJsonResponse(res);
  },

  getProjects: async () => {
    const res = await fetch(`${API_BASE_URL}/projects`);
    return parseJsonResponse(res);
  },

  getProjectDetail: async (projectId: string) => {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}`);
    return parseJsonResponse(res);
  },

  createProject: async (token: string, payload: any) => {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    return parseJsonResponse(res);
  },

  updateProject: async (token: string, projectId: string, payload: any) => {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    return parseJsonResponse(res);
  },

  addProjectSource: async (
    token: string,
    projectId: string,
    payload: {
      url: string;
      title?: string;
      publishedAt?: string;
      summary?: string;
      note?: string;
    }
  ) => {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/source`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    return parseJsonResponse(res);
  },

  getProjectSources: async (projectId: string) => {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/sources`);
    return parseJsonResponse(res);
  },

  approveProjectSource: async (token: string, sourceId: string) => {
    const res = await fetch(
      `${API_BASE_URL}/projects/sources/${sourceId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return parseJsonResponse(res);
  },

  recomputeProjectStatus: async (token: string, projectId: string) => {
    const res = await fetch(
      `${API_BASE_URL}/projects/${projectId}/status-recompute`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return parseJsonResponse(res);
  },
  getLeaders: async (params?: {
  role?: string;
  district?: string;
  province?: string;
  search?: string;
}) => {
  const query = new URLSearchParams();

  if (params?.role) query.append("role", params.role);
  if (params?.district) query.append("district", params.district);
  if (params?.province) query.append("province", params.province);
  if (params?.search) query.append("search", params.search);

  const url = `${API_BASE_URL}/leaders${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url);
  return parseJsonResponse(res);
},

getLeaderById: async (leaderId: string) => {
  const res = await fetch(`${API_BASE_URL}/leaders/${leaderId}`);
  return parseJsonResponse(res);
},

createLeader: async (token: string, payload: any) => {
  const res = await fetch(`${API_BASE_URL}/leaders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(res);
},

updateLeader: async (token: string, leaderId: string, payload: any) => {
  const res = await fetch(`${API_BASE_URL}/leaders/${leaderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(res);
},

deleteLeader: async (token: string, leaderId: string) => {
  const res = await fetch(`${API_BASE_URL}/leaders/${leaderId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonResponse(res);
},
getDistricts: async (params?: { province?: string; search?: string }) => {
  const query = new URLSearchParams();

  if (params?.province) query.append("province", params.province);
  if (params?.search) query.append("search", params.search);

  const res = await fetch(
    `http://localhost:5000/api/districts${query.toString() ? `?${query.toString()}` : ""}`
  );
  return res.json();
},

createDistrict: async (token: string, payload: any) => {
  const res = await fetch("http://localhost:5000/api/districts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
},

updateDistrict: async (token: string, districtId: string, payload: any) => {
  const res = await fetch(`http://localhost:5000/api/districts/${districtId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
},

deleteDistrict: async (token: string, districtId: string) => {
  const res = await fetch(`http://localhost:5000/api/districts/${districtId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
},
getAdminProjects: async (params?: {
  search?: string;
  status?: string;
  district?: string;
  province?: string;
}) => {
  const query = new URLSearchParams();

  if (params?.search) query.append("search", params.search);
  if (params?.status) query.append("status", params.status);
  if (params?.district) query.append("district", params.district);
  if (params?.province) query.append("province", params.province);

  const res = await fetch(
    `http://localhost:5000/api/admin/projects${query.toString() ? `?${query.toString()}` : ""}`
  );
  return res.json();
},

createAdminProject: async (token: string, payload: any) => {
  const res = await fetch("http://localhost:5000/api/admin/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
},

updateAdminProject: async (token: string, projectId: string, payload: any) => {
  const res = await fetch(`http://localhost:5000/api/admin/projects/${projectId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
},

deleteAdminProject: async (token: string, projectId: string) => {
  const res = await fetch(`http://localhost:5000/api/admin/projects/${projectId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
},


getAdminUsers: async (token: string) => {
  const res = await fetch("http://localhost:5000/api/auth/users", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
},

updateAdminUser: async (token: string, userId: string, payload: any) => {
  const res = await fetch(`http://localhost:5000/api/auth/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
},

deleteAdminUser: async (token: string, userId: string) => {
  const res = await fetch(`http://localhost:5000/api/auth/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
},

};