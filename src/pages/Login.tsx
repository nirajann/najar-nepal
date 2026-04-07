import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, MessageSquareText, Star } from "lucide-react";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

type Lang = "en" | "np";

const content = {
  en: {
    welcome: "Welcome back to Najar Nepal",
    join: "Join Najar Nepal",
    login: "Login",
    register: "Create account",
    subtitleLogin:
      "Sign in to rate leaders, comment on public issues, submit complaints, and manage your public profile.",
    subtitleRegister:
      "Create your account to rate leaders, submit complaints, and take part in a more transparent civic platform.",
    cardLogin:
      "Login is required for ratings, comments, complaints, and profile features.",
    cardRegister: "Use a strong password to keep your account secure.",
    fullName: "Full name",
    email: "Email",
    password: "Password",
    enterName: "Enter your full name",
    enterEmail: "Enter your email",
    enterPassword: "Enter your password",
    createAccount: "Create Account",
    loginBtn: "Login",
    wait: "Please wait...",
    switchToRegister: "Don’t have an account? Register",
    switchToLogin: "Already have an account? Login",
    rateLeaders: "Rate leaders",
    submitComplaints: "Submit complaints",
    secureProfile: "Secure profile",
    rateDesc: "Give public feedback in one place.",
    complaintDesc: "Report issues and follow public concerns.",
    secureDesc: "Protected access for your activity and profile.",
    requirements: "Password requirements",
    req1: "At least 8 characters",
    req2: "One uppercase letter",
    req3: "One lowercase letter",
    req4: "One number",
    req5: "One special character",
    secureAccess: "Secure civic access",
    nameRequired: "Full name is required.",
    emailRequired: "Email and password are required.",
    emailInvalid: "Please enter a valid email address.",
    passwordWeak:
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
    registerSuccess: "Registration successful. Please login now.",
    loginSuccess: "Login successful",
  },
  np: {
    welcome: "नजर नेपालमा पुनः स्वागत छ",
    join: "नजर नेपालमा सहभागी हुनुहोस्",
    login: "लगइन",
    register: "खाता बनाउनुहोस्",
    subtitleLogin:
      "नेताहरूलाई मूल्यांकन गर्न, सार्वजनिक विषयमा टिप्पणी गर्न, गुनासो पठाउन र आफ्नो प्रोफाइल व्यवस्थापन गर्न साइन इन गर्नुहोस्।",
    subtitleRegister:
      "खाता बनाएर नेताहरूलाई मूल्यांकन गर्नुहोस्, गुनासो पठाउनुहोस्, र पारदर्शी नागरिक प्लेटफर्ममा सहभागी हुनुहोस्।",
    cardLogin:
      "रेटिङ, टिप्पणी, गुनासो र प्रोफाइल सुविधाका लागि लगइन आवश्यक छ।",
    cardRegister: "खातालाई सुरक्षित राख्न बलियो पासवर्ड प्रयोग गर्नुहोस्।",
    fullName: "पूरा नाम",
    email: "इमेल",
    password: "पासवर्ड",
    enterName: "आफ्नो पूरा नाम लेख्नुहोस्",
    enterEmail: "आफ्नो इमेल लेख्नुहोस्",
    enterPassword: "आफ्नो पासवर्ड लेख्नुहोस्",
    createAccount: "खाता बनाउनुहोस्",
    loginBtn: "लगइन",
    wait: "कृपया पर्खनुहोस्...",
    switchToRegister: "खाता छैन? दर्ता गर्नुहोस्",
    switchToLogin: "पहिले नै खाता छ? लगइन गर्नुहोस्",
    rateLeaders: "नेताहरूलाई मूल्यांकन गर्नुहोस्",
    submitComplaints: "गुनासो पठाउनुहोस्",
    secureProfile: "सुरक्षित प्रोफाइल",
    rateDesc: "एकै ठाउँबाट सार्वजनिक प्रतिक्रिया दिनुहोस्।",
    complaintDesc: "समस्या रिपोर्ट गर्नुहोस् र सार्वजनिक गुनासोहरू हेर्नुहोस्।",
    secureDesc: "तपाईंको गतिविधि र प्रोफाइल सुरक्षित पहुँचमा राखिन्छ।",
    requirements: "पासवर्डका सर्तहरू",
    req1: "कम्तीमा ८ अक्षर",
    req2: "एक ठूलो अक्षर",
    req3: "एक सानो अक्षर",
    req4: "एक संख्या",
    req5: "एक विशेष चिन्ह",
    secureAccess: "सुरक्षित नागरिक पहुँच",
    nameRequired: "पूरा नाम आवश्यक छ।",
    emailRequired: "इमेल र पासवर्ड आवश्यक छ।",
    emailInvalid: "कृपया मान्य इमेल लेख्नुहोस्।",
    passwordWeak:
      "पासवर्ड कम्तीमा ८ अक्षरको हुनुपर्छ र ठूलो अक्षर, सानो अक्षर, संख्या र विशेष चिन्ह समावेश हुनुपर्छ।",
    registerSuccess: "दर्ता सफल भयो। अब लगइन गर्नुहोस्।",
    loginSuccess: "लगइन सफल भयो",
  },
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAuth();

  const [lang, setLang] = useState<Lang>("np");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const from = (location.state as { from?: string } | null)?.from;
  const t = content[lang];

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
        throw new Error(t.emailRequired);
      }

      if (!isValidEmail(email)) {
        throw new Error(t.emailInvalid);
      }

      if (isRegisterMode) {
        if (!name.trim()) {
          throw new Error(t.nameRequired);
        }

        if (!isStrongPassword) {
          throw new Error(t.passwordWeak);
        }

        const result = await api.register(name.trim(), email.trim(), password);
        setMessage(result.message || t.registerSuccess);
        setMessageType("success");
        setIsRegisterMode(false);
        setName("");
        setPassword("");
      } else {
        const result = await loginUser(email.trim(), password);
        setMessage(result.message || t.loginSuccess);
        setMessageType("success");

        if (result.user?.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate(from || "/", { replace: true });
        }
      }
    } catch (error: any) {
      setMessage(error.message || "Something went wrong");
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
                {t.secureAccess}
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                {isRegisterMode ? t.join : t.welcome}
              </h1>

              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                {isRegisterMode ? t.subtitleRegister : t.subtitleLogin}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <Star className="h-5 w-5 text-blue-600" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">{t.rateLeaders}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{t.rateDesc}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <MessageSquareText className="h-5 w-5 text-blue-600" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {t.submitComplaints}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{t.complaintDesc}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">{t.secureProfile}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{t.secureDesc}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                    {isRegisterMode ? t.register : t.login}
                  </h2>
                </div>

                <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setLang("np")}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      lang === "np" ? "bg-slate-950 text-white" : "text-slate-600"
                    }`}
                  >
                    नेपाली
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      lang === "en" ? "bg-slate-950 text-white" : "text-slate-600"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <p className="mb-6 text-sm leading-6 text-slate-500">
                {isRegisterMode ? t.cardRegister : t.cardLogin}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegisterMode && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      {t.fullName}
                    </label>
                    <input
                      type="text"
                      placeholder={t.enterName}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    placeholder={t.enterEmail}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t.password}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={t.enterPassword}
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
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {isRegisterMode && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-slate-800">{t.requirements}</p>
                    <div className="space-y-1 text-xs">
                      <p className={checkClass(passwordChecks.minLength)}>• {t.req1}</p>
                      <p className={checkClass(passwordChecks.upper)}>• {t.req2}</p>
                      <p className={checkClass(passwordChecks.lower)}>• {t.req3}</p>
                      <p className={checkClass(passwordChecks.number)}>• {t.req4}</p>
                      <p className={checkClass(passwordChecks.special)}>• {t.req5}</p>
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
                  {loading ? t.wait : isRegisterMode ? t.createAccount : t.loginBtn}
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
                {isRegisterMode ? t.switchToLogin : t.switchToRegister}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;