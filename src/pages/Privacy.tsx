import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
        <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600">
            Privacy
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
            Privacy and data use
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            We collect only what is necessary to operate the platform and keep
            public signals transparent. We do not sell personal data.
          </p>
        </section>

        <section className="mt-6 rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">What we collect</h2>
          <ul className="mt-2 list-disc pl-4 text-sm leading-6 text-slate-700">
            <li>Account details needed for authentication and verification.</li>
            <li>Public feedback submissions (ratings, comments, reports).</li>
            <li>Basic usage analytics to improve reliability and safety.</li>
          </ul>
        </section>

        <section className="mt-6 rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">How we use data</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Data is used to authenticate users, verify submissions, compute
            public signals, and protect the platform from abuse. Verified
            identity documents are stored securely and reviewed only by
            authorized staff.
          </p>
        </section>

        <section className="mt-6 rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Your choices</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            You may request updates or removal of your account data by
            contacting the platform administrators. We will respond with a clear
            status and timeline.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Privacy;
