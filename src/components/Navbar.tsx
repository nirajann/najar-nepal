import { useState } from "react";
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

function Navbar() {
  const { isAuthenticated, user, logoutUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

const navLinks = [
  { label: t("nav_home"), to: "/" },
  { label: t("nav_explore_map"), href: "/#district-map" },
  { label: t("nav_projects"), to: "/projects" },
  { label: t("nav_ranking"), to: "/ranking" },
  { label: t("support"), to: "/support" },
];

  const isActive = (path?: string, href?: string) => {
    if (href) {
      return location.pathname === "/" && location.hash === "#district-map";
    }
    if (path === "/") return location.pathname === "/";
    return Boolean(path && location.pathname.startsWith(path));
  };

  const navItemClass = (active: boolean) =>
    [
      "rounded-full px-4 py-2 text-sm font-semibold transition duration-200",
      active
        ? "bg-slate-900 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    ].join(" ");

  return (
    <>
      <SiteShellBackdrop />
      <div className="h-[78px]" aria-hidden="true" />

      <header className="fixed inset-x-0 top-0 z-[200] border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-[1480px] px-3 md:px-5">
          <div className="flex h-[78px] items-center justify-between gap-4">
            <Link to="/" className="flex min-w-0 items-center gap-2.5 md:gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center md:h-14 md:w-14">
                <div className="pointer-events-none absolute inset-1 rounded-full bg-red-50/60 blur-lg" />
                <div className="pointer-events-none absolute bottom-1.5 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-blue-100/55 blur-md md:h-7 md:w-7" />
                <img
                  src={heroLogo}
                  alt="Najar Nepal Logo"
                  className="relative h-8 w-8 object-contain drop-shadow-[0_3px_8px_rgba(15,23,42,0.10)] md:h-10 md:w-10"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="truncate text-[1.35rem] font-extrabold tracking-tight text-slate-950 md:text-[1.6rem]">
                    Najar Nepal
                  </h1>
                  <NepalFlagPennant compact className="hidden sm:block opacity-90" />
                </div>
                <p className="mt-0.5 truncate text-[10px] font-semibold tracking-[0.16em] text-red-600/95 md:text-[11px]">
                  {"\u091c\u0928\u0924\u093e\u0915\u094b \u0928\u091c\u0930"}
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((item) =>
                item.href ? (
                  <a key={item.label} href={item.href} className={navItemClass(isActive(undefined, item.href))}>
                    {item.label}
                  </a>
                ) : (
                  <Link key={item.label} to={item.to!} className={navItemClass(isActive(item.to))}>
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <div className="flex items-center rounded-full border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    language === "en" ? "bg-slate-900 text-white" : "text-slate-600"
                  }`}
                >
                  {t("nav_language_en")}
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("ne")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    language === "ne" ? "bg-slate-900 text-white" : "text-slate-600"
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
                      className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      {t("nav_admin")}
                    </Link>
                  ) : null}

                  <Link
                    to="/profile"
                    className="max-w-[180px] truncate rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {user?.name || t("nav_profile")}
                  </Link>

                  <NepalActionButton onClick={logoutUser} className="min-h-[44px] px-4 py-2 text-sm">
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
              onClick={() => setMobileOpen((prev) => !prev)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm md:hidden"
              aria-label="Toggle menu"
            >
              <div className="space-y-1">
                <span className={`block h-0.5 w-4 bg-slate-800 transition ${mobileOpen ? "translate-y-1.5 rotate-45" : ""}`} />
                <span className={`block h-0.5 w-4 bg-slate-800 transition ${mobileOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 w-4 bg-slate-800 transition ${mobileOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
              </div>
            </button>
          </div>

          <div className={`overflow-hidden transition-all duration-300 md:hidden ${mobileOpen ? "max-h-[520px] pb-4" : "max-h-0"}`}>
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <div className="flex rounded-full border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                    language === "en" ? "bg-slate-900 text-white" : "text-slate-600"
                  }`}
                >
                  {t("nav_language_en")}
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("ne")}
                  className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                    language === "ne" ? "bg-slate-900 text-white" : "text-slate-600"
                  }`}
                >
                  {t("nav_language_ne")}
                </button>
              </div>

              {navLinks.map((item) =>
                item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-2xl px-4 py-3 text-sm font-semibold ${navItemClass(
                      isActive(undefined, item.href)
                    )}`}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to={item.to!}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-2xl px-4 py-3 text-sm font-semibold ${navItemClass(
                      isActive(item.to)
                    )}`}
                  >
                    {item.label}
                  </Link>
                )
              )}

              {isAuthenticated ? (
                <div className="space-y-2 pt-1">
                  {user?.role === "admin" ? (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
                    >
                      {t("nav_admin")}
                    </Link>
                  ) : null}
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
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
                <NepalActionLink to="/login" className="w-full justify-center px-4 py-3 text-sm">
                  {t("nav_login")}
                </NepalActionLink>
              )}

              
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;
