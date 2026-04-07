import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function Profile() {
  const { user, token, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    district: "",
    province: "",
    birthplace: "",
    bio: "",
    profilePhoto: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      district: user.district || "",
      province: user.province || "",
      birthplace: user.birthplace || "",
      bio: user.bio || "",
      profilePhoto: user.profilePhoto || "",
    });
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setLoading(true);
      setMessage("");

      const result = await api.updateProfile(token, form);

      if (result.user) {
        updateUser(result.user);
        setMessage(result.message || "Profile updated successfully");
      } else {
        setMessage(result.message || "Failed to update profile");
      }
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  const verificationStatus = user?.verificationStatus || "unverified";
  const badges = user?.badges || [];
  const verificationSummary =
    verificationStatus === "verified"
      ? "Your identity has been verified. Public visitors only see your badge and status."
      : verificationStatus === "pending"
      ? "Your documents are safely submitted and waiting for reviewer approval."
      : verificationStatus === "rejected"
      ? "Your last verification submission was rejected. You can review the notes and submit updated documents."
      : "You can submit your nagarikta privately for review. Documents are never shown on your public profile.";

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {form.profilePhoto ? (
                  <img
                    src={form.profilePhoto}
                    alt={form.name}
                    className="w-32 h-32 rounded-3xl object-cover border border-slate-200 shadow-sm"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-3xl bg-slate-200 flex items-center justify-center text-slate-500 font-semibold">
                    Photo
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <VerificationBadge status={verificationStatus} />
                    {badges.map((badge) => (
                      <span
                        key={badge}
                        className="px-3 py-1 rounded-full bg-slate-900 text-white text-sm font-semibold"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
                    {form.name || "User Profile"}
                  </h1>
                  <p className="text-slate-600 mt-2">{form.email}</p>
                  <p className="text-slate-500 mt-1">
                    {form.district || "District not set"}
                    {form.province ? `, ${form.province}` : ""}
                  </p>
                  <p className="text-slate-500 mt-1">
                    Birthplace: {form.birthplace || "Not added"}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Edit Profile</h2>

              {message && (
                <div className="mb-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {message}
                </div>
              )}

              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone"
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  placeholder="District"
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  placeholder="Province"
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="birthplace"
                  value={form.birthplace}
                  onChange={handleChange}
                  placeholder="Birthplace"
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="profilePhoto"
                  value={form.profilePhoto}
                  onChange={handleChange}
                  placeholder="Profile photo URL"
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="md:col-span-2">
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Write your bio..."
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                  >
                    {loading ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Verification Center</h2>

              <div className="flex items-center gap-3">
                <VerificationBadge status={verificationStatus} />
                {verificationStatus === "verified" ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Public badge active
                  </span>
                ) : null}
              </div>

              <p className="text-slate-600 mt-4 text-sm leading-6">
                {verificationSummary}
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">What is public</p>
                <p className="mt-2 leading-6">
                  Only your verification status and badge. Your citizenship number and uploaded
                  images remain private and are only available to authorized reviewers.
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <Link
                  to="/verification"
                  className="block w-full rounded-2xl bg-slate-900 px-4 py-3 text-center font-semibold text-white transition hover:bg-slate-700"
                >
                  {verificationStatus === "rejected"
                    ? "Update Verification Documents"
                    : verificationStatus === "pending"
                    ? "View Verification Status"
                    : verificationStatus === "verified"
                    ? "Manage Verification"
                    : "Start Verification"}
                </Link>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Citizen Badges</h2>

              <div className="flex flex-wrap gap-2">
                {badges.length > 0 ? (
                  badges.map((badge) => (
                    <span
                      key={badge}
                      className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold"
                    >
                      {badge}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-500">No badges yet.</p>
                )}
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Privacy Note</h2>
              <p className="text-slate-600 text-sm leading-6">
                Verification documents are handled in a separate private review flow. This
                page only shows profile information and verification status, never the
                uploaded nagarikta images themselves.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function VerificationBadge({
  status,
}: {
  status: "unverified" | "pending" | "verified" | "rejected";
}) {
  const styles = {
    unverified: "bg-slate-200 text-slate-700",
    pending: "bg-yellow-100 text-yellow-700",
    verified: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const labels = {
    unverified: "Unverified",
    pending: "Pending Review",
    verified: "Verified",
    rejected: "Rejected",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default Profile;
