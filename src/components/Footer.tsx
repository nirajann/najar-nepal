import { Link } from "react-router-dom";
import heroLogo from "../assets/hero.png";

function FooterLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="text-sm text-slate-600 transition hover:text-blue-700"
    >
      {children}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
      <div className="mx-auto max-w-[1480px] px-4 py-8 md:px-6 md:py-10">
        <div className="grid gap-8 md:grid-cols-[1.25fr_0.8fr_0.8fr_0.9fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-blue-100">
                <img
                  src={heroLogo}
                  alt="Najar Nepal Logo"
                  className="h-8 w-8 object-contain"
                />
              </div>

              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-slate-950">
                  Najar Nepal
                </h3>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-red-600">
                  जनताको नजर
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
              A civic-tech platform built to improve transparency, public awareness,
              and accountability in Nepal through district exploration, public
              feedback, and leader visibility.
            </p>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-slate-700">
              Public beta. Data, profiles, and civic signals are still being refined
              and expanded.
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-900">
              Platform
            </h4>
            <div className="mt-3 flex flex-col gap-2.5">
              <FooterLink to="/">Home</FooterLink>
              <FooterLink to="/ranking">Ranking</FooterLink>
              <FooterLink to="/projects">Projects</FooterLink>
              <FooterLink to="/support">Support</FooterLink>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-900">
              Trust
            </h4>
            <div className="mt-3 flex flex-col gap-2.5">
              <FooterLink to="/about">About</FooterLink>
              <FooterLink to="/methodology">Methodology</FooterLink>
              <FooterLink to="/privacy">Privacy</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-900">
              Civic note
            </h4>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Support, feedback, or donations do not influence rankings, public
              scores, or visibility on the platform.
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              Built for public trust, not political favoritism.
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-blue-100 pt-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Najar Nepal. All rights reserved.</p>
          <p>Built for transparency, public awareness, and accountability in Nepal.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;