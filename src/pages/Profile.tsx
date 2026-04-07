import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function Profile() {
  const { user, token, updateUser } = useAuth();
  const { language } = useLanguage();

  const text =
    language === "ne"
      ? {
          profileTitle: "प्रयोगकर्ता प्रोफाइल",
          districtUnset: "जिल्ला सेट गरिएको छैन",
          notAdded: "थप गरिएको छैन",
          birthplace: "जन्मस्थान",
          editProfile: "प्रोफाइल सम्पादन",
          fullName: "पूरा नाम",
          username: "प्रयोगकर्ता नाम",
          email: "इमेल",
          phone: "फोन",
          district: "जिल्ला",
          province: "प्रदेश",
          profilePhoto: "प्रोफाइल फोटो URL",
          bio: "परिचय लेख्नुहोस्...",
          saveProfile: "प्रोफाइल सुरक्षित गर्नुहोस्",
          saving: "सुरक्षित हुँदैछ...",
          verificationCenter: "प्रमाणीकरण केन्द्र",
          publicBadgeActive: "सार्वजनिक ब्याज सक्रिय",
          whatIsPublic: "सार्वजनिक रूपमा के देखिन्छ",
          whatIsPublicBody:
            "तपाईंको प्रमाणीकरण स्थिति र ब्याज मात्र। नागरिकता नम्बर र अपलोड गरिएका कागजातहरू निजी रहन्छन् र अधिकृत समीक्षकले मात्र हेर्न सक्छन्।",
          updateVerification: "प्रमाणीकरण कागजात अपडेट गर्नुहोस्",
          viewVerification: "प्रमाणीकरण स्थिति हेर्नुहोस्",
          manageVerification: "प्रमाणीकरण व्यवस्थापन",
          startVerification: "प्रमाणीकरण सुरु गर्नुहोस्",
          citizenBadges: "नागरिक ब्याजहरू",
          noBadges: "अहिलेसम्म कुनै ब्याज छैन।",
          privacyNote: "गोपनीयता सूचना",
          privacyBody:
            "प्रमाणीकरण कागजातहरू छुट्टै निजी समीक्षा प्रक्रियामा राखिन्छन्। यस पृष्ठमा प्रोफाइल जानकारी र प्रमाणीकरण स्थिति मात्र देखिन्छ, अपलोड गरिएको नागरिकता छवि होइन।",
          verificationSummaryVerified:
            "तपाईंको पहिचान प्रमाणित भइसकेको छ। सार्वजनिक प्रयोगकर्ताले केवल ब्याज र स्थिति मात्र देख्छन्।",
          verificationSummaryPending:
            "तपाईंका कागजातहरू सुरक्षित रूपमा पठाइएको छ र समीक्षकको अनुमोदनको प्रतीक्षामा छन्।",
          verificationSummaryRejected:
            "तपाईंको पछिल्लो प्रमाणीकरण अस्वीकृत भयो। टिप्पणी हेरेर अद्यावधिक कागजात पुनः पठाउन सक्नुहुन्छ।",
          verificationSummaryDefault:
            "तपाईंले आफ्नो नागरिकता निजी रूपमा समीक्षाका लागि पठाउन सक्नुहुन्छ। कागजातहरू सार्वजनिक प्रोफाइलमा कहिल्यै देखाइँदैनन्।",
          updatedSuccess: "प्रोफाइल सफलतापूर्वक अद्यावधिक भयो",
          updatedFail: "प्रोफाइल अद्यावधिक गर्न सकिएन",
          wrong: "केही गल्ती भयो",
        }
      : {
          profileTitle: "User Profile",
          districtUnset: "District not set",
          notAdded: "Not added",
          birthplace: "Birthplace",
          editProfile: "Edit Profile",
          fullName: "Full name",
          username: "Username",
          email: "Email",
          phone: "Phone",
          district: "District",
          province: "Province",
          profilePhoto: "Profile photo URL",
          bio: "Write your bio...",
          saveProfile: "Save Profile",
          saving: "Saving...",
          verificationCenter: "Verification Center",
          publicBadgeActive: "Public badge active",
          whatIsPublic: "What is public",
          whatIsPublicBody:
            "Only your verification status and badge. Your citizenship number and uploaded images remain private and are only available to authorized reviewers.",
          updateVerification: "Update Verification Documents",
          viewVerification: "View Verification Status",
          manageVerification: "Manage Verification",
          startVerification: "Start Verification",
          citizenBadges: "Citizen Badges",
          noBadges: "No badges yet.",
          privacyNote: "Privacy Note",
          privacyBody:
            "Verification documents are handled in a separate private review flow. This page only shows profile information and verification status, never the uploaded nagarikta images themselves.",
          verificationSummaryVerified:
            "Your identity has been verified. Public visitors only see your badge and status.",
          verificationSummaryPending:
            "Your documents are safely submitted and waiting for reviewer approval.",
          verificationSummaryRejected:
            "Your last verification submission was rejected. You can review the notes and submit updated documents.",
          verificationSummaryDefault:
            "You can submit your nagarikta privately for review. Documents are never shown on your public profile.",
          updatedSuccess: "Profile updated successfully",
          updatedFail: "Failed to update profile",
          wrong: "Something went wrong",
        };

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
        setMessage(result.message || text.updatedSuccess);
      } else {
        setMessage(result.message || text.updatedFail);
      }
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, text.wrong));
    } finally {
      setLoading(false);
    }
  };

  const verificationStatus = user?.verificationStatus || "unverified";
  const badges = user?.badges || [];
  const verificationSummary =
    verificationStatus === "verified"
      ? text.verificationSummaryVerified
      : verificationStatus === "pending"
      ? text.verificationSummaryPending
      : verificationStatus === "rejected"
      ? text.verificationSummaryRejected
      : text.verificationSummaryDefault;

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
                    <VerificationBadge status={verificationStatus} language={language} />
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
                    {form.name || text.profileTitle}
                  </h1>
                  <p className="text-slate-600 mt-2">{form.email}</p>
                  <p className="text-slate-500 mt-1">
                    {form.district || text.districtUnset}
                    {form.province ? `, ${form.province}` : ""}
                  </p>
                  <p className="text-slate-500 mt-1">
                    {text.birthplace}: {form.birthplace || text.notAdded}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{text.editProfile}</h2>

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
                  placeholder={text.fullName}
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder={text.username}
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={text.email}
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder={text.phone}
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  placeholder={text.district}
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  placeholder={text.province}
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="birthplace"
                  value={form.birthplace}
                  onChange={handleChange}
                  placeholder={text.birthplace}
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="profilePhoto"
                  value={form.profilePhoto}
                  onChange={handleChange}
                  placeholder={text.profilePhoto}
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="md:col-span-2">
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={4}
                    placeholder={text.bio}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                  >
                    {loading ? text.saving : text.saveProfile}
                  </button>
                </div>
              </form>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{text.verificationCenter}</h2>

              <div className="flex items-center gap-3">
                <VerificationBadge status={verificationStatus} language={language} />
                {verificationStatus === "verified" ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {text.publicBadgeActive}
                  </span>
                ) : null}
              </div>

              <p className="text-slate-600 mt-4 text-sm leading-6">
                {verificationSummary}
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{text.whatIsPublic}</p>
                <p className="mt-2 leading-6">
                  {text.whatIsPublicBody}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <Link
                  to="/verification"
                  className="block w-full rounded-2xl bg-slate-900 px-4 py-3 text-center font-semibold text-white transition hover:bg-slate-700"
                >
                  {verificationStatus === "rejected"
                    ? text.updateVerification
                    : verificationStatus === "pending"
                    ? text.viewVerification
                    : verificationStatus === "verified"
                    ? text.manageVerification
                    : text.startVerification}
                </Link>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{text.citizenBadges}</h2>

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
                  <p className="text-slate-500">{text.noBadges}</p>
                )}
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{text.privacyNote}</h2>
              <p className="text-slate-600 text-sm leading-6">
                {text.privacyBody}
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
  language,
}: {
  status: "unverified" | "pending" | "verified" | "rejected";
  language: "en" | "ne";
}) {
  const styles = {
    unverified: "bg-slate-200 text-slate-700",
    pending: "bg-yellow-100 text-yellow-700",
    verified: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const labels = {
    unverified: language === "ne" ? "अप्रमाणित" : "Unverified",
    pending: language === "ne" ? "समीक्षामा" : "Pending Review",
    verified: language === "ne" ? "प्रमाणित" : "Verified",
    rejected: language === "ne" ? "अस्वीकृत" : "Rejected",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default Profile;
