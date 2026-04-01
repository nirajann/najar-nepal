import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isRegisterMode) {
        const result = await api.register(name, email, password);

        if (result.message === "User registered successfully") {
          setMessage("Registration successful. Please login now.");
          setIsRegisterMode(false);
          setName("");
          setPassword("");
        } else {
          setMessage(result.message || "Registration failed");
        }
      } else {
        const result = await api.login(email, password);

        if (result.token && result.user) {
          loginUser(result.token, result.user);
          setMessage("Login successful");

          if (result.user.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/");
          }
        } else {
          setMessage(result.message || "Login failed");
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

      <main className="max-w-md mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            {isRegisterMode ? "Register" : "Login"}
          </h1>

          <p className="text-slate-500 mb-6">
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
              className="w-full rounded-2xl bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 transition disabled:opacity-60"
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
            className="w-full mt-4 text-blue-600 font-medium hover:underline"
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