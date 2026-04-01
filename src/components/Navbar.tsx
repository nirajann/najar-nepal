import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import heroLogo from "../assets/hero.png";

function Navbar() {
  const { isAuthenticated, user, logoutUser } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Projects", to: "/projects" },
    { label: "Ranking", to: "/ranking" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
              <img
                src={heroLogo}
                alt="Najar Nepal Logo"
                className="w-8 h-8 md:w-9 md:h-9 object-contain"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-950 leading-none">
                Najar Nepal
              </h1>
              <p className="text-[11px] md:text-xs text-red-500 font-medium mt-1">
                जनताको नजर
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-4 lg:px-5 py-2.5 rounded-full text-sm lg:text-base font-semibold transition-all duration-200 ${
                  isActive(item.to)
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-medium hover:bg-blue-50 transition"
                  >
                    Admin
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 hover:text-slate-950 transition"
                >
                  {user?.name || "Profile"}
                </Link>

                <button
                  onClick={logoutUser}
                  className="px-5 py-2.5 rounded-2xl bg-slate-950 text-white text-sm md:text-base font-semibold hover:bg-slate-800 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-2xl bg-red-500 text-white text-sm md:text-base font-semibold hover:bg-red-600 transition"
              >
                Login
              </Link>
            )}
          </div>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden w-10 h-10 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center"
            aria-label="Toggle menu"
          >
            <div className="space-y-1.5">
              <span
                className={`block h-0.5 w-5 bg-slate-800 transition ${
                  mobileOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 bg-slate-800 transition ${
                  mobileOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 bg-slate-800 transition ${
                  mobileOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>

        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileOpen ? "max-h-[500px] pb-4" : "max-h-0"
          }`}
        >
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-3 space-y-2">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-2xl px-4 py-3 font-semibold transition ${
                  isActive(item.to)
                    ? "bg-slate-950 text-white"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="pt-2 border-t border-slate-200">
              {isAuthenticated ? (
                <div className="space-y-2">
                  {user?.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-2xl px-4 py-3 bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition"
                    >
                      Admin
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-2xl px-4 py-3 bg-slate-50 text-slate-700 font-semibold hover:bg-slate-100 transition"
                  >
                    {user?.name || "Profile"}
                  </Link>

                  <button
                    onClick={() => {
                      logoutUser();
                      setMobileOpen(false);
                    }}
                    className="w-full rounded-2xl px-4 py-3 bg-slate-950 text-white font-semibold hover:bg-slate-800 transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-2xl px-4 py-3 bg-red-500 text-white font-semibold text-center hover:bg-red-600 transition"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;