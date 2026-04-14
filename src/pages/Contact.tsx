import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Contact() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
        <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600">
            Contact
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
            Reach the Najar Nepal team
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            For data corrections, privacy requests, or platform feedback, reach
            us at:
          </p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            contact@najarnepal.org
          </p>
        </section>

        <section className="mt-6 rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Response standards</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            We aim to acknowledge requests within 3 business days and resolve
            verified corrections as quickly as possible.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Contact;
