import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Methodology() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
        <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600">
            Methodology
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
            How public signals are calculated
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Najar Nepal summarizes civic activity using structured signals that
            can be traced to visible inputs. We avoid editorial scoring and
            prioritize transparent metrics.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Leader signals</h2>
            <ul className="mt-2 text-sm leading-6 text-slate-700 list-disc pl-4">
              <li>Community ratings submitted by authenticated users.</li>
              <li>Discussion activity and comment engagement.</li>
              <li>Verified profile completeness and source links.</li>
            </ul>
          </div>
          <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">District signals</h2>
            <ul className="mt-2 text-sm leading-6 text-slate-700 list-disc pl-4">
              <li>Verified district feedback scores across key services.</li>
              <li>Public profile coverage and linked representatives.</li>
              <li>Recent civic updates and visibility indicators.</li>
            </ul>
          </div>
        </section>

        <section className="mt-6 rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Quality controls</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            We prioritize verified submissions, enforce input validation, and
            review reports for abuse. Metrics are updated as new verified data
            arrives, and we display data freshness where possible.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Methodology;
