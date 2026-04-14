import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { api } from "../../services/api";

function SupportCorrections() {
  const [form, setForm] = useState({
    affectedEntity: "",
    incorrectInfo: "",
    suggestedCorrection: "",
    sourceLink: "",
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
      await api.submitSupportCorrection({
        affectedEntity: form.affectedEntity,
        incorrectInfo: form.incorrectInfo,
        suggestedCorrection: form.suggestedCorrection,
        sourceLink: form.sourceLink || undefined,
        notes: form.notes || undefined,
      });
      setStatus("success");
      setMessage("Correction request submitted. We will review it carefully.");
      setForm({
        affectedEntity: "",
        incorrectInfo: "",
        suggestedCorrection: "",
        sourceLink: "",
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
            Request a correction
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Corrections improve accuracy across leader profiles, districts, and public
            records. Please share clear sources and specific updates.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900">Submit a correction</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Share the incorrect information, your suggested correction, and supporting sources.
          </p>

          <div className="mt-4">
            <label className="text-sm font-semibold text-slate-700">
              Affected page, leader, or district
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              placeholder="e.g. Lalitpur district profile"
              value={form.affectedEntity}
              onChange={handleChange("affectedEntity")}
              required
            />
          </div>

          <div className="mt-4">
            <label className="text-sm font-semibold text-slate-700">Incorrect information</label>
            <textarea
              className="mt-2 min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              value={form.incorrectInfo}
              onChange={handleChange("incorrectInfo")}
              required
            />
          </div>

          <div className="mt-4">
            <label className="text-sm font-semibold text-slate-700">Suggested correction</label>
            <textarea
              className="mt-2 min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              value={form.suggestedCorrection}
              onChange={handleChange("suggestedCorrection")}
              required
            />
          </div>

          <div className="mt-4">
            <label className="text-sm font-semibold text-slate-700">Source link</label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              placeholder="https://"
              value={form.sourceLink}
              onChange={handleChange("sourceLink")}
            />
          </div>

          <div className="mt-4">
            <label className="text-sm font-semibold text-slate-700">Additional notes (optional)</label>
            <textarea
              className="mt-2 min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              value={form.notes}
              onChange={handleChange("notes")}
            />
          </div>

          {message ? (
            <div
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                status === "success"
                  ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border border-red-100 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Submitting..." : "Submit correction"}
            </button>
            <Link
              to="/methodology"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Review methodology
            </Link>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}

export default SupportCorrections;
