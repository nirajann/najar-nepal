import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/useLanguage";
import heroLogo from "../assets/hero.png";
import {
  NepalActionButton,
  NepalActionLink,
  NepalFlagPennant,
  SiteShellBackdrop,
} from "./NepalDesignSystem";

type NavItem = {
  label: string;
  to?: string;
  href?: string;
};

function Navbar() {
  const { isAuthenticated, user, logoutUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  const supportLabel = language === "ne" ? "सहयोग" : "Support";
  const brandLine = "जनताको नजर";

  const navLinks = useMemo<NavItem[]>(
    () => [
      { label: t("nav_home"), to: "/" },
      { label: t("nav_explore_map"), href: "/#district-map" },
      { label: t("nav_projects"), to: "/projects" },
      { label: t("nav_ranking"), to: "/ranking" },
      { label: supportLabel, to: "/support" },
    ],
    [supportLabel, t]
  );

  const isActive = (path?: string, href?: string) => {
    if (href) {
      return location.pathname === "/" && location.hash === "#district-map";
    }
    if (path === "/") return location.pathname === "/";
    return Boolean(path && location.pathname.startsWith(path));
  };

  const navItemClass = (active: boolean) =>
    [
      "group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-4 py-2.5 text-sm font-semibold transition duration-300",
      active
        ? "border border-slate-900/90 bg-slate-950 text-white shadow-[0_10px_28px_rgba(15,23,42,0.2)]"
        : "border border-transparent text-slate-700 hover:border-blue-100 hover:bg-white/80 hover:text-slate-950 hover:shadow-sm",
    ].join(" ");

  const topShellClass = isScrolled
    ? "border-slate-200/80 bg-white/78 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-2xl"
    : "border-slate-200/60 bg-white/68 shadow-[0_10px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl";

  return (
    <>
      <SiteShellBackdrop />
      <div className="h-[88px]" aria-hidden="true" />

      <header className="fixed inset-x-0 top-0 z-[200]">
        <div className="mx-auto max-w-[1520px] px-3 pt-3 md:px-5">
          <div
            className={`relative overflow-hidden rounded-[26px] border transition duration-300 md:rounded-[30px] ${topShellClass}`}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,#ef4444_0%,#ef4444_20%,#2563eb_20%,#2563eb_46%,#f8fafc_46%,#f8fafc_52%,#ef4444_52%,#ef4444_76%,#2563eb_76%,#2563eb_100%)]" />
            <div className="pointer-events-none absolute -left-8 top-3 h-24 w-24 rounded-full bg-red-100/50 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-blue-100/50 blur-3xl" />

            <div className="relative px-3 md:px-4">
              <div className="flex min-h-[72px] items-center justify-between gap-3 md:min-h-[76px]">
                <Link to="/" className="group flex min-w-0 items-center gap-3 md:gap-4">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/85 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-300 group-hover:-translate-y-0.5 md:h-14 md:w-14">
                    <div className="pointer-events-none absolute inset-1 rounded-[14px] bg-[linear-gradient(135deg,rgba(239,68,68,0.12),rgba(255,255,255,0.86),rgba(37,99,235,0.14))]" />
                    <img
                      src={heroLogo}
                      alt="Najar Nepal Logo"
                      className="relative h-8 w-8 object-contain drop-shadow-[0_4px_10px_rgba(15,23,42,0.12)] md:h-10 md:w-10"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="truncate text-[1.2rem] font-extrabold tracking-tight text-slate-950 md:text-[1.5rem]">
                        Najar Nepal
                      </h1>
                      <NepalFlagPennant compact className="hidden sm:block opacity-90" />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="truncate text-[10px] font-semibold tracking-[0.18em] text-red-600/95 md:text-[11px]">
                        {brandLine}
                      </p>
                      <span className="hidden rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-700 sm:inline-flex">
                        Civic platform
                      </span>
                    </div>
                  </div>
                </Link>

                <nav className="hidden items-center gap-1 lg:flex">
                  {navLinks.map((item) =>
                    item.href ? (
                      <a
                        key={item.label}
                        href={item.href}
                        className={navItemClass(isActive(undefined, item.href))}
                      >
                        <span>{item.label}</span>
                      </a>
                    ) : (
                      <Link
                        key={item.label}
                        to={item.to!}
                        className={navItemClass(isActive(item.to))}
                      >
                        <span>{item.label}</span>
                      </Link>
                    )
                  )}
                </nav>

                <div className="hidden items-center gap-2 lg:flex">
                  <div className="flex items-center rounded-full border border-white/80 bg-white/80 p-1 shadow-sm backdrop-blur">
                    <button
                      type="button"
                      onClick={() => setLanguage("en")}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        language === "en"
                          ? "bg-slate-950 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      {t("nav_language_en")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage("ne")}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        language === "ne"
                          ? "bg-slate-950 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      {t("nav_language_ne")}
                    </button>
                  </div>

                  {isAuthenticated ? (
                    <>
                      {user?.role === "admin" ? (
                        <Link
                          to="/admin"
                          className="rounded-full border border-blue-200 bg-blue-50/90 px-3.5 py-2 text-sm font-semibold text-blue-700 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-100"
                        >
                          {t("nav_admin")}
                        </Link>
                      ) : null}

                      <Link
                        to="/profile"
                        className="max-w-[200px] truncate rounded-full border border-white/70 bg-white/85 px-3.5 py-2 text-sm font-medium text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:bg-white"
                      >
                        {user?.name || t("nav_profile")}
                      </Link>

                      <NepalActionButton
                        onClick={logoutUser}
                        className="min-h-[44px] px-4 py-2 text-sm"
                      >
                        {t("nav_logout")}
                      </NepalActionButton>
                    </>
                  ) : (
                    <NepalActionLink to="/login" className="min-h-[44px] px-4 py-2 text-sm">
                      {t("nav_login")}
                    </NepalActionLink>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen((prev) => !prev)}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border bg-white/85 shadow-sm transition duration-300 lg:hidden ${
                    mobileOpen
                      ? "border-slate-900 bg-slate-950 text-white"
                      : "border-slate-200 text-slate-900"
                  }`}
                  aria-label="Toggle menu"
                  aria-expanded={mobileOpen}
                >
                  <div className="space-y-1">
                    <span
                      className={`block h-0.5 w-4 transition ${
                        mobileOpen
                          ? "translate-y-1.5 rotate-45 bg-white"
                          : "bg-slate-800"
                      }`}
                    />
                    <span
                      className={`block h-0.5 w-4 transition ${
                        mobileOpen ? "opacity-0" : "bg-slate-800"
                      }`}
                    />
                    <span
                      className={`block h-0.5 w-4 transition ${
                        mobileOpen
                          ? "-translate-y-1.5 -rotate-45 bg-white"
                          : "bg-slate-800"
                      }`}
                    />
                  </div>
                </button>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 lg:hidden ${
                  mobileOpen ? "max-h-[720px] pb-4" : "max-h-0"
                }`}
              >
                <div className="space-y-3 border-t border-slate-200/80 pt-3">
                  <div className="rounded-[24px] border border-white/80 bg-white/82 p-3 shadow-sm backdrop-blur">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-600">
                          Civic navigation
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Explore districts, rankings, projects, and support in one place.
                        </p>
                      </div>
                      <NepalFlagPennant compact className="opacity-90" />
                    </div>

                    <div className="mt-3 flex rounded-full border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => setLanguage("en")}
                        className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                          language === "en"
                            ? "bg-slate-950 text-white shadow-sm"
                            : "text-slate-600"
                        }`}
                      >
                        {t("nav_language_en")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage("ne")}
                        className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                          language === "ne"
                            ? "bg-slate-950 text-white shadow-sm"
                            : "text-slate-600"
                        }`}
                      >
                        {t("nav_language_ne")}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {navLinks.map((item) =>
                      item.href ? (
                        <a
                          key={item.label}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between rounded-[20px] border px-4 py-3 text-sm font-semibold transition duration-300 ${
                            isActive(undefined, item.href)
                              ? "border-slate-900 bg-slate-950 text-white shadow-sm"
                              : "border-slate-200 bg-white/90 text-slate-800"
                          }`}
                        >
                          <span>{item.label}</span>
                        </a>
                      ) : (
                        <Link
                          key={item.label}
                          to={item.to!}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between rounded-[20px] border px-4 py-3 text-sm font-semibold transition duration-300 ${
                            isActive(item.to)
                              ? "border-slate-900 bg-slate-950 text-white shadow-sm"
                              : "border-slate-200 bg-white/90 text-slate-800"
                          }`}
                        >
                          <span>{item.label}</span>
                        </Link>
                      )
                    )}
                  </div>

                  {isAuthenticated ? (
                    <div className="grid gap-2 pt-1">
                      {user?.role === "admin" ? (
                        <Link
                          to="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="rounded-[20px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
                        >
                          {t("nav_admin")}
                        </Link>
                      ) : null}

                      <Link
                        to="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-[20px] border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700"
                      >
                        {user?.name || t("nav_profile")}
                      </Link>

                      <NepalActionButton
                        onClick={() => {
                          logoutUser();
                          setMobileOpen(false);
                        }}
                        className="w-full px-4 py-3 text-sm"
                      >
                        {t("nav_logout")}
                      </NepalActionButton>
                    </div>
                  ) : (
                    <NepalActionLink
                      to="/login"
                      className="w-full justify-center px-4 py-3 text-sm"
                    >
                      {t("nav_login")}
                    </NepalActionLink>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;
