import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Bot, Send } from "lucide-react";

export default function Mitra() {
  const [data, setData] = useState<any>(null);
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const navigate = useNavigate();

  const fetchData = () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");
    
    axios.get("/api/dashboard/mitra", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setData(res.data))
      .catch(() => navigate("/"));
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    setIsAiLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/ai/query",
        { question: aiInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiResponse(res.data.answer);
      fetchData(); // Refresh data in case the AI performed an action (like creating a request)
    } catch (error) {
      setAiResponse("Sorry, I encountered an error processing your request.");
    }
    setIsAiLoading(false);
  };

  if (!data) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Mitra Dashboard</h1>
        <button onClick={() => { localStorage.clear(); navigate("/"); }} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">Logout</button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-slate-500 text-sm font-medium mb-2">Wallet Balance</h2>
              <p className="text-4xl font-bold text-indigo-600">₹{data.balance}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-slate-500 text-sm font-medium mb-2">Total Requests</h2>
              <p className="text-4xl font-bold text-emerald-600">{data.requests.length}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4">Recent Requests</h2>
            <div className="space-y-4">
              {data.requests.map((req: any) => (
                <div key={req.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{req.serviceCode}</p>
                    <p className="text-sm text-slate-500">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm">{req.status}</span>
                </div>
              ))}
              {data.requests.length === 0 && <p className="text-slate-500">No requests found.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Bot size={24} className="text-indigo-200" />
              <h3 className="font-bold text-lg">AI Assistant</h3>
            </div>
            <p className="text-indigo-100 text-sm mb-4">
              Ask me to check your balance, create a service request, or apply for a loan.
            </p>
            <div className="space-y-3">
              {aiResponse && (
                <div className="bg-white/10 p-3 rounded-lg text-sm leading-relaxed backdrop-blur-sm border border-white/20">
                  {aiResponse}
                </div>
              )}
              <form onSubmit={handleAiQuery} className="relative">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="e.g., Apply for a 50000 loan for business..."
                  className="w-full pl-3 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                />
                <button
                  type="submit"
                  disabled={isAiLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-200 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
