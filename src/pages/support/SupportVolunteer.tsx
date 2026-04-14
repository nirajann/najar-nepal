import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { api } from "../../services/api";

function SupportVolunteer() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    interests: "",
    availability: "",
    notes: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      await api.submitSupportVolunteer({
        name: form.name,
        email: form.email,
        interests: form.interests,
        availability: form.availability || undefined,
        notes: form.notes || undefined,
      });
      setStatus("success");
      setMessage("Thanks for your interest. We will reach out with next steps.");
      setForm({
        name: "",
        email: "",
        interests: "",
        availability: "",
        notes: "",
      });
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.message || "Submission failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
        <Link to="/support" className="text-sm font-semibold text-blue-700">
          Back to Support
        </Link>

        <section className="mt-4 rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600">
            Support
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
            Volunteer with Najar Nepal
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Volunteers strengthen data verification, moderation, translation, and civic
            outreach. We welcome help that improves accuracy and public trust.
          </p>
        </section>

        <section className="mt-6 rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Volunteer interest form</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            This is an interest form. We will contact you after reviewing availability.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Name</label>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                value={form.name}
                onChange={handleChange("name")}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                value={form.email}
                onChange={handleChange("email")}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">
                Areas of interest
              </label>
              <textarea
                className="mt-2 min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                placeholder="Fact checking, moderation, translation, outreach"
                value={form.interests}
                onChange={handleChange("interests")}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Availability</label>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                placeholder="e.g. weekends, evenings"
                value={form.availability}
                onChange={handleChange("availability")}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Notes (optional)</label>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                value={form.notes}
                onChange={handleChange("notes")}
              />
            </div>

            {message ? (
              <div
                className={`md:col-span-2 rounded-2xl px-4 py-3 text-sm ${
                  status === "success"
                    ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border border-red-100 bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            ) : null}

            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "loading" ? "Submitting..." : "Submit interest"}
              </button>
              <Link
                to="/support/contact"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Contact support
              </Link>
            </div>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default SupportVolunteer;
