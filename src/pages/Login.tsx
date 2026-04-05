import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const from = (location.state as { from?: string } | null)?.from;

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {
    if (isRegisterMode) {
      const result = await api.register(name, email, password);
      setMessage(result.message || "Registration successful. Please login now.");
      setIsRegisterMode(false);
      setName("");
      setPassword("");
    } else {
      const result = await loginUser(email, password);
      setMessage(result.message || "Login successful");

      if (result.user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  } catch (error: any) {
    setMessage(error.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-3xl font-extrabold text-slate-900">
            {isRegisterMode ? "Register" : "Login"}
          </h1>

          <p className="mb-6 text-slate-500">
            Login is required for ratings, comments, complaints, and profile features.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <input
                type="text"
                placeholder="Full name"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}

            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {message && (
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : isRegisterMode
                ? "Create Account"
                : "Login"}
            </button>
          </form>

          <button
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setMessage("");
            }}
            className="mt-4 w-full font-medium text-blue-600 hover:underline"
          >
            {isRegisterMode
              ? "Already have an account? Login"
              : "Don’t have an account? Register"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default Login;