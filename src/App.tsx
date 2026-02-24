import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Wallet,
  HandCoins,
  MessageSquare,
  Settings,
  LogOut,
  Plus,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  IndianRupee,
  Search,
  Menu,
  X,
  ChevronRight,
  Bot,
  Send,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Service, ServiceRequest, Loan, Analytics } from "./types";

// --- Components ---

const Button = ({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  type = "button",
}: any) => {
  const variants: any = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary:
      "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1.5">
    {label && (
      <label className="text-sm font-medium text-slate-700">{label}</label>
    )}
    <input
      {...props}
      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
    />
  </div>
);

const Card = ({ children, className = "" }: any) => (
  <div
    className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}
  >
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState<any>(
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const [view, setView] = useState("dashboard");
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Auth State
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "mitra",
  });

  // Data State
  const [services, setServices] = useState<Service[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [wallet, setWallet] = useState(0);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // UI State
  const [showAddService, setShowAddService] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [showApplyLoan, setShowApplyLoan] = useState(false);
  const [aiChat, setAiChat] = useState<
    { role: "user" | "bot"; text: string }[]
  >([]);
  const [aiInput, setAiInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, view]);

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const servicesRes = await fetch("/api/services");
      setServices(await servicesRes.json());

      if (user.role === "mitra") {
        const requestsRes = await fetch("/api/mitra/requests", { headers });
        setRequests(await requestsRes.json());
        const walletRes = await fetch("/api/mitra/wallet", { headers });
        setWallet((await walletRes.json()).balance);
        const loansRes = await fetch("/api/loans", { headers });
        setLoans(await loansRes.json());
      } else if (user.role === "admin") {
        const analyticsRes = await fetch("/api/admin/analytics", { headers });
        if (analyticsRes.ok) {
          setAnalytics(await analyticsRes.json());
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? "/api/login" : "/api/register";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      const data = await res.json();
      if (isLogin && data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem(
          "user",
          JSON.stringify({ name: data.name, role: data.role }),
        );
        setToken(data.access_token);
        setUser({ name: data.name, role: data.role });
      } else if (!isLogin) {
        setIsLogin(true);
        alert("Registration successful! Please login.");
      } else {
        alert(data.error || "Auth failed");
      }
    } catch (e) {
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const body = Object.fromEntries(formData);

    await fetch("/api/mitra/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    setShowCreateRequest(false);
    fetchData();
  };

  const handleCompleteRequest = async (id: string) => {
    await fetch(`/api/mitra/requests/${id}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  };

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const body = Object.fromEntries(formData);

    await fetch("/api/loans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    setShowApplyLoan(false);
    fetchData();
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const body = Object.fromEntries(formData);

    await fetch("/api/admin/services", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    setShowAddService(false);
    fetchData();
  };

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = aiInput;
    setAiChat((prev) => [...prev, { role: "user", text: userMsg }]);
    setAiInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg }),
      });
      const data = await res.json();
      setAiChat((prev) => [...prev, { role: "bot", text: data.answer }]);
    } catch (e) {
      setAiChat((prev) => [
        ...prev,
        { role: "bot", text: "Error connecting to AI service." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Public Header */}
        <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Briefcase size={20} />
              </div>
              <span className="text-xl font-bold text-slate-900">
                VyaparKendra
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setShowAuthModal(true);
                }}
                className="text-sm font-medium text-slate-600 hover:text-indigo-600"
              >
                Login
              </button>
              <Button
                onClick={() => {
                  setIsLogin(false);
                  setShowAuthModal(true);
                }}
              >
                Join as Mitra
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-full mb-6 inline-block">
                Empowering Digital India
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight">
                Your Digital Storefront for <br />
                <span className="text-indigo-600">Every Essential Service</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
                Join 10,000+ Mitras providing banking, government, and digital
                services to their communities. Earn high commissions and grow
                your business.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  className="w-full sm:w-auto px-8 py-4 text-lg"
                  onClick={() => {
                    setIsLogin(false);
                    setShowAuthModal(true);
                  }}
                >
                  Start Your Journey
                </Button>
                <button className="flex items-center gap-2 text-slate-600 font-medium hover:text-indigo-600 transition-colors">
                  Watch how it works <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Everything you need to succeed
              </h2>
              <p className="text-slate-500">
                A complete ecosystem designed for the modern digital
                entrepreneur.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Briefcase,
                  title: "100+ Digital Services",
                  desc: "From PAN cards to utility bills, provide everything your customers need.",
                  color: "bg-blue-50 text-blue-600",
                },
                {
                  icon: HandCoins,
                  title: "Loan Assistance",
                  desc: "Help citizens secure business and personal loans with ease.",
                  color: "bg-emerald-50 text-emerald-600",
                },
                {
                  icon: Bot,
                  title: "AI Business Support",
                  desc: "Get instant answers and business growth tips from our AI assistant.",
                  color: "bg-indigo-50 text-indigo-600",
                },
              ].map((feature, i) => (
                <Card
                  key={i}
                  className="text-center hover:shadow-xl transition-shadow border-none bg-slate-50"
                >
                  <div
                    className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mx-auto mb-6`}
                  >
                    <feature.icon size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { label: "Active Mitras", value: "10k+" },
                { label: "Services Provided", value: "1M+" },
                { label: "Commissions Paid", value: "₹50Cr+" },
                { label: "States Covered", value: "28" },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-4xl font-extrabold text-indigo-600 mb-1">
                    {stat.value}
                  </p>
                  <p className="text-slate-500 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Briefcase size={20} />
              </div>
              <span className="text-xl font-bold text-white">VyaparKendra</span>
            </div>
            <p className="mb-8">
              © 2026 VyaparKendra Enterprise. All rights reserved.
            </p>
            <div className="flex justify-center gap-6">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact Support
              </a>
            </div>
          </div>
        </footer>

        {/* Auth Modal */}
        <AnimatePresence>
          {showAuthModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md"
              >
                <Card className="relative">
                  <button
                    onClick={() => setShowAuthModal(false)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {isLogin ? "Welcome Back" : "Create Account"}
                    </h3>
                    <p className="text-slate-500">
                      {isLogin
                        ? "Login to your Mitra dashboard"
                        : "Join the VyaparKendra network"}
                    </p>
                  </div>
                  <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                      <Input
                        label="Full Name"
                        placeholder="John Doe"
                        required
                        value={authForm.name}
                        onChange={(e: any) =>
                          setAuthForm({ ...authForm, name: e.target.value })
                        }
                      />
                    )}
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="john@example.com"
                      required
                      value={authForm.email}
                      onChange={(e: any) =>
                        setAuthForm({ ...authForm, email: e.target.value })
                      }
                    />
                    <Input
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={authForm.password}
                      onChange={(e: any) =>
                        setAuthForm({ ...authForm, password: e.target.value })
                      }
                    />
                    {!isLogin && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                          Role
                        </label>
                        <select
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                          value={authForm.role}
                          onChange={(e) =>
                            setAuthForm({ ...authForm, role: e.target.value })
                          }
                        >
                          <option value="mitra">Mitra (Agent)</option>
                          <option value="admin">Administrator</option>
                          <option value="msme">MSME Customer</option>
                          <option value="nbfc">NBFC Partner</option>
                          <option value="govt">Government Official</option>
                          <option value="tech">Tech Admin</option>
                        </select>
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full py-3"
                      disabled={loading}
                    >
                      {loading
                        ? "Processing..."
                        : isLogin
                          ? "Sign In"
                          : "Create Account"}
                    </Button>
                  </form>
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {isLogin
                        ? "Don't have an account? Register"
                        : "Already have an account? Login"}
                    </button>
                  </div>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "services", label: "Services", icon: Briefcase },
    { id: "requests", label: "Requests", icon: Clock },
    { id: "loans", label: "Loans", icon: HandCoins },
    { id: "ai", label: "AI Assistant", icon: Bot },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Briefcase size={20} />
            </div>
            <span className="text-xl font-bold text-slate-900">
              VyaparKendra
            </span>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${view === item.id ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 px-3 py-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                {user.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-slate-600"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex-1 lg:flex-none max-w-md hidden md:block">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                placeholder="Search services, requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user.role === "mitra" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                <IndianRupee size={16} />
                <span className="text-sm font-bold">
                  {wallet.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </header>

        <div className="p-6 overflow-auto">
          <AnimatePresence mode="wait">
            {view === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Welcome back, {user.name}
                    </h2>
                    <p className="text-slate-500">
                      Here's what's happening with your business today.
                    </p>
                  </div>
                  {user.role === "mitra" && (
                    <Button onClick={() => setShowCreateRequest(true)}>
                      <Plus size={20} />
                      New Service Request
                    </Button>
                  )}
                </div>

                {user.role === "admin" ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Users size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Total Mitras</p>
                        <p className="text-2xl font-bold">
                          {analytics?.total_mitras || 0}
                        </p>
                      </div>
                    </Card>
                    <Card className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Briefcase size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Total Requests</p>
                        <p className="text-2xl font-bold">
                          {analytics?.total_requests || 0}
                        </p>
                      </div>
                    </Card>
                    <Card className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <IndianRupee size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Total Revenue</p>
                        <p className="text-2xl font-bold">
                          ₹{analytics?.total_revenue.toLocaleString() || 0}
                        </p>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Wallet size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Wallet Balance</p>
                        <p className="text-2xl font-bold">
                          ₹{wallet.toLocaleString()}
                        </p>
                      </div>
                    </Card>
                    <Card className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">
                          Pending Requests
                        </p>
                        <p className="text-2xl font-bold">
                          {
                            requests.filter((r) => r.status === "in_progress")
                              .length
                          }
                        </p>
                      </div>
                    </Card>
                    <Card className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <FileText size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">
                          Loan Applications
                        </p>
                        <p className="text-2xl font-bold">
                          {loans.length}
                        </p>
                      </div>
                    </Card>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-slate-900">
                        Recent Requests
                      </h3>
                      <button
                        onClick={() => setView("requests")}
                        className="text-sm text-indigo-600 font-medium"
                      >
                        View all
                      </button>
                    </div>
                    <div className="space-y-4">
                      {requests.slice(0, 5).map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-slate-100"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {req.citizen_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {req.service_name}
                            </p>
                          </div>
                          <div
                            className={`px-2 py-1 rounded text-xs font-bold ${req.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                          >
                            {req.status === "completed"
                              ? "Completed"
                              : "In Progress"}
                          </div>
                        </div>
                      ))}
                      {requests.length === 0 && (
                        <p className="text-center py-8 text-slate-400">
                          No requests found.
                        </p>
                      )}
                    </div>
                  </Card>

                  <Card>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-slate-900">
                        Recent Loan Applications
                      </h3>
                      <button
                        onClick={() => setView("loans")}
                        className="text-sm text-indigo-600 font-medium"
                      >
                        View all
                      </button>
                    </div>
                    <div className="space-y-4">
                      {loans.slice(0, 5).map((loan) => (
                        <div
                          key={loan.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {loan.applicant}
                              </p>
                              <p className="text-xs text-slate-500">
                                {loan.purpose}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-indigo-600">
                              ₹{loan.amount.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                              Amount
                            </p>
                          </div>
                        </div>
                      ))}
                      {loans.length === 0 && (
                        <p className="text-center py-8 text-slate-400">
                          No loan applications found.
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {view === "services" && (
              <motion.div
                key="services"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Digital Services
                    </h2>
                    <p className="text-slate-500">
                      Browse and provide services to your citizens.
                    </p>
                  </div>
                  {user.role === "admin" && (
                    <Button onClick={() => setShowAddService(true)}>
                      <Plus size={20} />
                      Add New Service
                    </Button>
                  )}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      "All",
                      ...Array.from(new Set(services.map((s) => s.category))),
                    ].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${categoryFilter === cat ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      placeholder="Search services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services
                    .filter(
                      (s) =>
                        (categoryFilter === "All" ||
                          s.category === categoryFilter) &&
                        (s.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                          s.category
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())),
                    )
                    .map((service) => (
                      <Card key={service.id} className="flex flex-col">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded tracking-wider">
                              {service.category}
                            </span>
                            <IndianRupee size={20} className="text-slate-300" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-1">
                            {service.name}
                          </h3>
                          <p className="text-sm text-slate-500 mb-2">
                            {service.description ||
                              "Provide this service to earn a high commission."}
                          </p>
                          {service.processing_time && (
                            <p className="text-xs text-indigo-600 font-medium mb-4 flex items-center gap-1">
                              <Clock size={12} /> Est. {service.processing_time}
                            </p>
                          )}

                          <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 mb-6">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">
                                Service Price
                              </p>
                              <p className="text-lg font-bold text-slate-900">
                                ₹{service.price}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">
                                Your Earnings
                              </p>
                              <p className="text-lg font-bold text-emerald-600">
                                ₹{service.commission}
                              </p>
                            </div>
                          </div>
                        </div>
                        {user.role === "mitra" && (
                          <Button
                            className="w-full"
                            onClick={() => setShowCreateRequest(true)}
                          >
                            Apply for Citizen
                          </Button>
                        )}
                      </Card>
                    ))}
                  {services.filter(
                    (s) =>
                      (categoryFilter === "All" ||
                        s.category === categoryFilter) &&
                      (s.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                        s.category
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())),
                  ).length === 0 && (
                    <div className="col-span-full py-20 text-center">
                      <Search
                        size={48}
                        className="mx-auto text-slate-200 mb-4"
                      />
                      <p className="text-slate-500">
                        No services found matching your criteria.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === "requests" && (
              <motion.div
                key="requests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Service Requests
                    </h2>
                    <p className="text-slate-500">
                      Track and manage your active service applications.
                    </p>
                  </div>
                  {user.role === "mitra" && (
                    <Button onClick={() => setShowCreateRequest(true)}>
                      <Plus size={20} />
                      New Request
                    </Button>
                  )}
                </div>

                <Card className="overflow-hidden p-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Citizen Name
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requests.map((req) => (
                        <tr
                          key={req.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-900">
                              {req.citizen_name}
                            </p>
                            <p className="text-xs text-slate-400">
                              ID: {req.id}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-700">
                              {req.service_name}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${req.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                            >
                              {req.status === "completed" ? (
                                <CheckCircle2 size={14} />
                              ) : (
                                <Clock size={14} />
                              )}
                              {req.status === "completed"
                                ? "Completed"
                                : "In Progress"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {new Date(req.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {req.status === "in_progress" && (
                              <Button
                                variant="secondary"
                                onClick={() => handleCompleteRequest(req.id)}
                              >
                                Mark Complete
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {requests.length === 0 && (
                    <div className="py-20 text-center">
                      <Clock
                        size={48}
                        className="mx-auto text-slate-200 mb-4"
                      />
                      <p className="text-slate-500">No requests found yet.</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {view === "loans" && (
              <motion.div
                key="loans"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Loan Management
                    </h2>
                    <p className="text-slate-500">
                      Help citizens apply for business and personal loans.
                    </p>
                  </div>
                  <Button onClick={() => setShowApplyLoan(true)}>
                    <HandCoins size={20} />
                    Apply for Loan
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loans.map((loan) => (
                    <Card key={loan.id}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                          <HandCoins size={20} />
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${loan.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}
                        >
                          {loan.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900">
                        {loan.applicant}
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Loan Application
                      </p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">
                            Amount
                          </p>
                          <p className="text-xl font-bold text-slate-900">
                            ₹{loan.amount.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(loan.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Card>
                  ))}
                  {loans.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
                      <HandCoins
                        size={48}
                        className="mx-auto text-slate-200 mb-4"
                      />
                      <p className="text-slate-500">
                        No loan applications yet.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === "ai" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-[calc(100vh-12rem)] flex flex-col"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    AI Business Assistant
                  </h2>
                  <p className="text-slate-500">
                    Ask anything about services, business growth, or platform
                    help.
                  </p>
                </div>

                <Card className="flex-1 flex flex-col p-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {aiChat.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                        <Bot size={48} className="mb-4 text-slate-200" />
                        <p>
                          Hello! I'm your VyaparKendra assistant.
                          <br />
                          How can I help you grow your business today?
                        </p>
                      </div>
                    )}
                    {aiChat.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-2xl ${msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none"}`}
                        >
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                  </div>
                  <form
                    onSubmit={handleAiQuery}
                    className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2"
                  >
                    <input
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Type your question here..."
                      className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Button type="submit" disabled={loading || !aiInput.trim()}>
                      <Send size={18} />
                    </Button>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showCreateRequest && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md"
            >
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    New Service Request
                  </h3>
                  <button
                    onClick={() => setShowCreateRequest(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleCreateRequest} className="space-y-4">
                  <Input
                    label="Citizen Name"
                    name="citizen_name"
                    required
                    placeholder="Enter citizen's full name"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      name="citizen_phone"
                      required
                      placeholder="10-digit mobile"
                    />
                    <Input
                      label="Aadhar / ID Number"
                      name="id_number"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Select Service
                    </label>
                    <select
                      name="service_id"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                      required
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (Commission: ₹{s.commission})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Additional Notes
                    </label>
                    <textarea
                      name="notes"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                      placeholder="Any specific details..."
                    ></textarea>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setShowCreateRequest(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Create Request
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}

        {showApplyLoan && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md"
            >
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    Loan Application
                  </h3>
                  <button
                    onClick={() => setShowApplyLoan(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleApplyLoan} className="space-y-4">
                  <Input
                    label="Applicant Name"
                    name="applicant"
                    required
                    placeholder="Enter applicant's full name"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      name="phone"
                      required
                      placeholder="10-digit mobile"
                    />
                    <Input
                      label="Loan Amount (₹)"
                      name="amount"
                      type="number"
                      required
                      placeholder="e.g. 50000"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Tenure (Months)"
                      name="tenure"
                      type="number"
                      required
                      placeholder="e.g. 12"
                    />
                    <Input
                      label="Monthly Income (₹)"
                      name="income"
                      type="number"
                      required
                      placeholder="e.g. 25000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Loan Purpose
                    </label>
                    <select
                      name="purpose"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                      required
                    >
                      <option value="Business Expansion">
                        Business Expansion
                      </option>
                      <option value="Personal Use">Personal Use</option>
                      <option value="Education">Education</option>
                      <option value="Home Improvement">Home Improvement</option>
                    </select>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setShowApplyLoan(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Submit Application
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}

        {showAddService && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md"
            >
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    Add New Service
                  </h3>
                  <button
                    onClick={() => setShowAddService(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAddService} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Service Name"
                      name="name"
                      required
                      placeholder="e.g. PAN Card"
                    />
                    <Input
                      label="Category"
                      name="category"
                      required
                      placeholder="e.g. Government"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Service Price (₹)"
                      name="price"
                      type="number"
                      required
                      placeholder="e.g. 200"
                    />
                    <Input
                      label="Mitra Commission (₹)"
                      name="commission"
                      type="number"
                      required
                      placeholder="e.g. 50"
                    />
                  </div>
                  <Input
                    label="Processing Time"
                    name="processing_time"
                    placeholder="e.g. 2-3 working days"
                  />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                      placeholder="Briefly describe the service..."
                    ></textarea>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setShowAddService(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Add Service
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
