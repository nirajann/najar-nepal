import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import heroLogo from "../assets/hero.png";

function Navbar() {
  const { isAuthenticated, user, logoutUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: t("nav_home"), to: "/" },
    { label: t("nav_projects"), to: "/projects" },
    { label: t("nav_ranking"), to: "/ranking" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <div className="h-[64px] md:h-[68px]" aria-hidden="true" />

      <header className="fixed inset-x-0 top-0 z-[200] isolate border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1480px] px-3 md:px-5">
        <div className="flex h-[64px] items-center justify-between gap-3 md:h-[68px]">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img src={heroLogo} alt="Najar Nepal Logo" className="h-5 w-5 object-contain" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-[24px] font-extrabold leading-none tracking-tight text-slate-950 md:text-[28px]">
                Najar Nepal
              </h1>
              <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-red-500">
                जनताको नजर
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1.5 md:flex">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive(item.to)
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  language === "en"
                    ? "bg-slate-950 text-white"
                    : "text-slate-600"
                }`}
              >
                {t("nav_language_en")}
              </button>
              <button
                type="button"
                onClick={() => setLanguage("ne")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  language === "ne"
                    ? "bg-slate-950 text-white"
                    : "text-slate-600"
                }`}
              >
                {t("nav_language_ne")}
              </button>
            </div>

            {isAuthenticated ? (
              <>
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    {t("nav_admin")}
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="max-w-[180px] truncate rounded-full border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  {user?.name || t("nav_profile")}
                </Link>

                <button
                  onClick={logoutUser}
                  className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {t("nav_logout")}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                {t("nav_login")}
              </Link>
            )}
          </div>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm md:hidden"
            aria-label="Toggle menu"
          >
            <div className="space-y-1">
              <span
                className={`block h-0.5 w-4 bg-slate-800 transition ${
                  mobileOpen ? "translate-y-1.5 rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-4 bg-slate-800 transition ${
                  mobileOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-4 bg-slate-800 transition ${
                  mobileOpen ? "-translate-y-1.5 -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 md:hidden ${
            mobileOpen ? "max-h-[460px] pb-4" : "max-h-0"
          }`}
        >
          <div className="space-y-2 border-t border-slate-200 pt-3">
            <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                  language === "en"
                    ? "bg-slate-950 text-white"
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
                    ? "bg-slate-950 text-white"
                    : "text-slate-600"
                }`}
              >
                {t("nav_language_ne")}
              </button>
            </div>

            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive(item.to)
                    ? "bg-slate-950 text-white"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <div className="space-y-2 pt-1">
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
                  >
                    {t("nav_admin")}
                  </Link>
                )}

                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  {user?.name || t("nav_profile")}
                </Link>

                <button
                  onClick={() => {
                    logoutUser();
                    setMobileOpen(false);
                  }}
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                >
                  {t("nav_logout")}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-2xl bg-red-500 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                {t("nav_login")}
              </Link>
            )}
          </div>
        </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;
