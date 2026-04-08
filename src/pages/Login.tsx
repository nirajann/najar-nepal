import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, MessageSquareText, Star } from "lucide-react";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAuth();
  const { section } = useLanguage();
  const text = section("login");

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const from = (location.state as { from?: string } | null)?.from;

  const passwordChecks = useMemo(
    () => ({
      minLength: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password]
  );

  const isStrongPassword = Object.values(passwordChecks).every(Boolean);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error(text.emailRequired);
      }

      if (!isValidEmail(email)) {
        throw new Error(text.emailInvalid);
      }

      if (isRegisterMode) {
        if (!name.trim()) {
          throw new Error(text.nameRequired);
        }

        if (!isStrongPassword) {
          throw new Error(text.passwordWeak);
        }

        const result = await api.register(name.trim(), email.trim(), password);
        setMessage(result.message || text.registerSuccess);
        setMessageType("success");
        setIsRegisterMode(false);
        setName("");
        setPassword("");
      } else {
        const result = await loginUser(email.trim(), password);
        setMessage(result.message || text.loginSuccess);
        setMessageType("success");

        if (result.user?.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate(from || "/", { replace: true });
        }
      }
    } catch (error: any) {
      setMessage(error.message || text.genericError);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const messageStyles =
    messageType === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-red-200 bg-red-50 text-red-700";

  const checkClass = (ok: boolean) => (ok ? "text-emerald-600" : "text-slate-400");

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="order-2 lg:order-1">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <ShieldCheck className="h-4 w-4" />
                {text.secureAccess}
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                {isRegisterMode ? text.join : text.welcome}
              </h1>

              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                {isRegisterMode ? text.subtitleRegister : text.subtitleLogin}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <Star className="h-5 w-5 text-blue-600" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">{text.rateLeaders}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{text.rateDesc}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <MessageSquareText className="h-5 w-5 text-blue-600" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">{text.submitComplaints}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{text.complaintDesc}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">{text.secureProfile}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{text.secureDesc}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  {isRegisterMode ? text.register : text.login}
                </h2>
              </div>

              <p className="mb-6 text-sm leading-6 text-slate-500">
                {isRegisterMode ? text.cardRegister : text.cardLogin}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegisterMode && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      {text.fullName}
                    </label>
                    <input
                      type="text"
                      placeholder={text.enterName}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {text.email}
                  </label>
                  <input
                    type="email"
                    placeholder={text.enterEmail}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {text.password}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={text.enterPassword}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {isRegisterMode && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-slate-800">{text.requirements}</p>
                    <div className="space-y-1 text-xs">
                      <p className={checkClass(passwordChecks.minLength)}>• {text.req1}</p>
                      <p className={checkClass(passwordChecks.upper)}>• {text.req2}</p>
                      <p className={checkClass(passwordChecks.lower)}>• {text.req3}</p>
                      <p className={checkClass(passwordChecks.number)}>• {text.req4}</p>
                      <p className={checkClass(passwordChecks.special)}>• {text.req5}</p>
                    </div>
                  </div>
                )}

                {message && (
                  <div className={`rounded-2xl border px-4 py-3 text-sm ${messageStyles}`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-950 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? text.wait : isRegisterMode ? text.createAccount : text.loginBtn}
                </button>
              </form>

              <button
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setMessage("");
                  setPassword("");
                }}
                className="mt-5 w-full text-sm font-medium text-blue-600 transition hover:text-blue-700 hover:underline"
              >
                {isRegisterMode ? text.switchToLogin : text.switchToRegister}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;
