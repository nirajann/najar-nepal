import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function SupportDonate() {
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
            Donations coming soon
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            We are finalizing a transparent donation process that protects civic independence
            and clearly reports how funds are used.
          </p>
        </section>

        <section className="mt-6 rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">What to expect</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            When donations open, this page will list verified payment methods, reporting
            standards, and how contributions are used for public benefit.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/support/contact"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Get notified when donations open
            </Link>
            <Link
              to="/support/faq"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Read support FAQ
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default SupportDonate;
