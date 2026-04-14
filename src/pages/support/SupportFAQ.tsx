import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function SupportFAQ() {
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
            Support FAQ
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Quick answers about how support requests, corrections, and public signals work.
          </p>
        </section>

        <section className="mt-6 space-y-4">
          <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Does support affect rankings or public scores?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              No. Support, donations, and partnerships do not influence rankings, public
              feedback scores, or visibility. The platform is designed to remain independent.
            </p>
          </div>

          <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              How are corrections verified?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Corrections are reviewed against reliable sources before updates are made.
              We may request additional documentation for sensitive changes.
            </p>
          </div>

          <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              How long do support requests take?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Response times vary by request type. High-impact issues are prioritized.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Need more help?</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              to="/support/contact"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Contact support
            </Link>
            <Link
              to="/support/report-issue"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Report an issue
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default SupportFAQ;
