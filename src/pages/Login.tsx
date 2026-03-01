import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("mitra");
  const [district, setDistrict] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        const res = await axios.post("/api/auth/login", { email, password });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        
        if (res.data.role === "mitra" && res.data.onboarding_step < 3) {
          navigate("/onboarding");
        } else {
          navigate(`/${res.data.role}`);
        }
      } else {
        await axios.post("/api/auth/register", { name, email, password, role, district });
        setIsLogin(true);
        alert("Registration successful. Please login.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || (isLogin ? "Login failed" : "Registration failed"));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="w-full bg-white border-b border-slate-200 py-4 px-6 flex items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            V
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            VyaparKendra
          </span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-slate-500 mt-2">
              {isLogin ? "Enter your credentials to access your dashboard" : "Join the network and start earning today"}
            </p>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-100">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 ease-in-out focus:-translate-y-0.5 focus:shadow-sm"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 ease-in-out focus:-translate-y-0.5 focus:shadow-sm"
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                {isLogin && (
                  <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                    Forgot Password?
                  </Link>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 ease-in-out focus:-translate-y-0.5 focus:shadow-sm"
                required
              />
            </div>
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 ease-in-out focus:-translate-y-0.5 focus:shadow-sm bg-white"
                  >
                    <option value="mitra">Mitra (Agent)</option>
                    <option value="admin">Admin</option>
                    <option value="franchise">Franchise</option>
                    <option value="ca">CA</option>
                    <option value="compliance">Compliance</option>
                    <option value="investor">Investor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 ease-in-out focus:-translate-y-0.5 focus:shadow-sm"
                    required
                  />
                </div>
              </>
            )}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors mt-2"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
