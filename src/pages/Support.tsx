import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  ShieldAlert,
  FilePenLine,
  Mail,
  Users,
  HeartHandshake,
  CircleHelp,
  ArrowRight,
  BadgeCheck,
  Sparkles,
} from "lucide-react";

function DhakaBorder() {
  return (
    <div
      className="h-1.5 w-full bg-[linear-gradient(90deg,#ef4444_0%,#ef4444_16%,#2563eb_16%,#2563eb_34%,#f8fafc_34%,#f8fafc_40%,#ef4444_40%,#ef4444_58%,#2563eb_58%,#2563eb_76%,#f8fafc_76%,#f8fafc_82%,#ef4444_82%,#ef4444_100%)]"
      aria-hidden="true"
    />
  );
}

function SupportShellBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.08),transparent_32%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.10),transparent_34%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(248,250,252,0.92))]" />
      <div className="absolute left-[-6%] top-[120px] h-[260px] w-[260px] rounded-full border border-red-100/70 opacity-70" />
      <div className="absolute right-[-8%] top-[170px] h-[340px] w-[340px] rounded-full border border-blue-100/80 opacity-75" />
      <div className="absolute left-[16%] top-[280px] h-36 w-36 rounded-full bg-red-200/10 blur-3xl" />
      <div className="absolute right-[12%] top-[260px] h-48 w-48 rounded-full bg-blue-300/10 blur-3xl" />
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50/80 px-3 py-1 text-[11px] font-semibold text-red-600 shadow-sm">
      <Sparkles className="h-3.5 w-3.5" />
      <span>{children}</span>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  text,
  href,
  tone = "default",
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href: string;
  tone?: "default" | "blue" | "red";
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)]"
      : tone === "red"
      ? "border-red-100 bg-[linear-gradient(180deg,#ffffff_0%,#fef2f2_100%)]"
      : "border-slate-200 bg-white";

  return (
    <Link
      to={href}
      className={`group relative overflow-hidden rounded-[24px] border p-5 shadow-[0_14px_28px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_38px_rgba(15,23,42,0.10)] ${toneClass}`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-fuchsia-500 to-blue-600" />
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-bold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
        <span>Open</span>
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function MiniTrustItem({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  text,
}: {
  label: string;
  value: string;
  text: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-sm text-slate-200">{text}</p>
    </div>
  );
}

function Support() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <SupportShellBackdrop />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-[1480px] px-3 py-3 md:px-5 md:py-5">
        <section className="overflow-hidden rounded-[30px] border border-blue-100 bg-white/95 shadow-[0_20px_44px_rgba(15,23,42,0.09)] backdrop-blur-sm md:rounded-[36px]">
          <DhakaBorder />

          <div className="grid gap-6 p-5 md:p-8 xl:grid-cols-[1.08fr_0.92fr]">
            <div>
              <SectionEyebrow>Najar Nepal Support</SectionEyebrow>

              <h1 className="mt-3 bg-[linear-gradient(180deg,#020617_0%,#0f172a_42%,#1d4ed8_100%)] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-6xl">
                Professional support for a public-interest platform
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-700">
                Use this support hub to report issues, request corrections, contact the team,
                volunteer, or help sustain the platform. Everything here is designed to make
                Najar Nepal more accurate, transparent, and trustworthy.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  Issue reporting
                </span>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  Corrections and help
                </span>
                <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                  Sustainable support
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/support/report-issue"
                  className="inline-flex items-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Report an issue
                </Link>
                <Link
                  to="/support/contact"
                  className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Contact support
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-900 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.14),transparent_25%),linear-gradient(155deg,#020617_0%,#08142c_50%,#1d4ed8_100%)] p-5 text-white shadow-[0_22px_40px_rgba(15,23,42,0.18)] md:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                Public support model
              </p>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
                Built for trust before fundraising
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-200">
                This page prioritizes public trust first. People should be able to report issues,
                request corrections, contact the team, and understand the support model clearly
                before anything else.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <StatCard
                  label="Correction review"
                  value="Careful process"
                  text="Profile and district corrections should be checked before acceptance."
                />
                <StatCard
                  label="Independence"
                  value="Civic-first"
                  text="Support does not affect rankings, linked profiles, or public scores."
                />
              </div>

              <div className="mt-5 rounded-[20px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 text-blue-300" />
                  <p className="text-sm leading-7 text-slate-100">
                    Keep this page focused on credibility, clear support paths, and transparent
                    platform stewardship.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                Choose a support path
              </h2>
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-700">
                Keep the first step obvious. Users should know exactly where to go within seconds.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              Support hub
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <QuickAction
              icon={<ShieldAlert className="h-5 w-5" />}
              title="Report an issue"
              text="Flag incorrect district data, public profile mistakes, or broken features."
              href="/support/report-issue"
              tone="red"
            />
            <QuickAction
              icon={<FilePenLine className="h-5 w-5" />}
              title="Request a correction"
              text="Suggest factual corrections for leaders, districts, and public information."
              href="/support/corrections"
              tone="blue"
            />
            <QuickAction
              icon={<Mail className="h-5 w-5" />}
              title="Contact the team"
              text="Send questions, suggestions, partnerships, or platform feedback."
              href="/support/contact"
            />
            <QuickAction
              icon={<Users className="h-5 w-5" />}
              title="Volunteer"
              text="Help with moderation, research, data verification, translation, or design."
              href="/support/volunteer"
              tone="blue"
            />
            <QuickAction
              icon={<HeartHandshake className="h-5 w-5" />}
              title="Support the platform"
              text="Help with hosting, maintenance, development, moderation, and long-term growth."
              href="/support/donate"
              tone="red"
            />
            <QuickAction
              icon={<CircleHelp className="h-5 w-5" />}
              title="FAQ"
              text="Learn how scores work, what public signals mean, and how the platform uses data."
              href="/support/faq"
            />
          </div>
        </section>

        <section className="mt-8 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
            <DhakaBorder />
            <div className="p-5 md:p-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                How support works
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                A professional support system should be transparent. Users need to understand
                what happens after they report a problem, request a correction, or support
                the platform.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MiniTrustItem
                  title="Issue review"
                  text="Reported issues should be reviewed and checked before updates are made."
                />
                <MiniTrustItem
                  title="Correction handling"
                  text="Requested profile or district corrections should be verified carefully."
                />
                <MiniTrustItem
                  title="Support independence"
                  text="Financial support should never influence rankings, public data, or visibility."
                />
                <MiniTrustItem
                  title="Community contribution"
                  text="Volunteers can strengthen moderation, translation, and data improvement work."
                />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-900 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] p-5 text-white shadow-[0_18px_36px_rgba(15,23,42,0.14)] md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
              Support spotlight
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
              Keep Najar Nepal independent and improving
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              Support helps with platform costs, moderation, data review, design improvements,
              maintenance, and long-term public benefit. Keep this explanation practical and
              trust-focused.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/support/donate"
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Support the platform
              </Link>
              <Link
                to="/support/contact"
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Contact the team
              </Link>
            </div>

            <div className="mt-5 rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200">
              Public support, feedback, and donations do not influence rankings, public scores,
              or profile visibility.
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Support;