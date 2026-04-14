import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
        <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600">
            About
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
            Najar Nepal is a civic transparency platform.
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            We surface public-facing signals about leaders, districts, and local
            services so communities can make informed, nonpartisan decisions.
            The platform is built to encourage accountability and improve public
            awareness—not to promote political favoritism.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Our purpose</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Provide a public, transparent view of civic activity, service
              feedback, and verified profile information so people can engage
              with facts and visible data.
            </p>
          </div>
          <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Neutral by design</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Rankings and signals are computed from structured inputs and
              transparent metrics. Donations or support do not influence
              outcomes.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">What we show</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Profiles include public roles, districts, and activity signals such
            as community ratings, verified district feedback, and discussion
            volume. We continuously improve data completeness through verified
            submissions and source checks.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default About;
