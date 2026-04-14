import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
        <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600">
            Terms
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
            Terms of service
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            By using Najar Nepal, you agree to contribute responsibly and comply
            with civic standards of respectful engagement.
          </p>
        </section>

        <section className="mt-6 rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Acceptable use</h2>
          <ul className="mt-2 list-disc pl-4 text-sm leading-6 text-slate-700">
            <li>No hate speech, harassment, or targeted abuse.</li>
            <li>No impersonation or falsified evidence.</li>
            <li>No automated spam or manipulation.</li>
          </ul>
        </section>

        <section className="mt-6 rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Content integrity</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Users are responsible for the accuracy of their submissions. We may
            moderate, remove, or restrict content that violates these terms or
            undermines public trust.
          </p>
        </section>

        <section className="mt-6 rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Changes</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            We may update these terms to reflect legal or platform changes.
            Continued use of the platform indicates acceptance of updated terms.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Terms;
