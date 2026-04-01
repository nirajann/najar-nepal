import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

type ComplaintItem = {
  _id: string;
  leaderId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  type?: string;
  message: string;
  photo?: string;
  status?: string;
  adminNote?: string;
  createdAt?: string;
};

function AdminComplaints() {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

  const loadComplaints = async () => {
    try {
      setLoading(true);
      if (!token) return;

      const data = await api.getAdminComplaints(token);
      setComplaints(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setMessage(error.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadComplaints();
    }
  }, [token]);

  const handleUpdate = async (complaintId: string) => {
    if (!token) return;

    try {
      const res = await api.updateAdminComplaint(token, complaintId, {
        status: statusMap[complaintId],
        adminNote: noteMap[complaintId],
      });

      setMessage(res.message || "Complaint updated");
      await loadComplaints();
    } catch (error: any) {
      setMessage(error.message || "Failed to update complaint");
    }
  };

  return (
    <AdminLayout
      title="Complaints Review"
      description="Review, process, and respond to public complaints"
    >
      {message && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
          Loading complaints...
        </div>
      ) : complaints.length > 0 ? (
        <div className="space-y-4">
          {complaints.map((item) => (
            <div
              key={item._id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-bold text-slate-900">{item.userName || "Unknown User"}</p>
                  <p className="text-sm text-slate-500">{item.userEmail || "No email"}</p>
                  <p className="text-sm text-slate-500 mt-1">Leader ID: {item.leaderId}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Type</p>
                  <p className="font-semibold text-slate-900">{item.type || "Other"}</p>
                  <p className="text-sm text-slate-500 mt-2">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-4">
                <p className="text-slate-700 leading-7">{item.message}</p>

                {item.photo && (
                  <a
                    href={item.photo}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-3 text-sm font-semibold text-blue-700 hover:underline"
                  >
                    Open attached proof
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={statusMap[item._id] ?? item.status ?? "pending"}
                  onChange={(e) =>
                    setStatusMap((prev) => ({
                      ...prev,
                      [item._id]: e.target.value,
                    }))
                  }
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">pending</option>
                  <option value="reviewing">reviewing</option>
                  <option value="resolved">resolved</option>
                  <option value="rejected">rejected</option>
                </select>

                <button
                  onClick={() => handleUpdate(item._id)}
                  className="rounded-2xl bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 transition"
                >
                  Update Complaint
                </button>
              </div>

              <textarea
                rows={3}
                value={noteMap[item._id] ?? item.adminNote ?? ""}
                onChange={(e) =>
                  setNoteMap((prev) => ({
                    ...prev,
                    [item._id]: e.target.value,
                  }))
                }
                placeholder="Admin note / feedback to user..."
                className="w-full mt-4 rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
          No complaints found
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminComplaints;