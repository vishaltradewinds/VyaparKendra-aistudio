import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Bot, Send, IndianRupee, History, Calendar, TrendingUp } from "lucide-react";
import { List } from "react-window";

export default function Mitra() {
  const [data, setData] = useState<any>(null);
  const [aiInput, setAiInput] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: "Hi! I'm your VyaparKendra AI Assistant. How can I help you with service recommendations, customer queries, or administrative tasks today?" }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const navigate = useNavigate();

  const fetchData = () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");
    
    axios.get("/api/dashboard/mitra", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data.onboarding_step < 3) {
          navigate("/onboarding");
        }
        setData(res.data);
      })
      .catch(() => navigate("/"));
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMessage = aiInput;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiInput("");
    setIsAiLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/ai/query",
        { 
          question: userMessage,
          history: messages.slice(1) // Exclude the initial greeting from history
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, { role: 'ai', content: res.data.answer }]);
      fetchData(); // Refresh data in case the AI performed an action (like creating a request)
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error processing your request." }]);
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
            <div className="h-[300px]">
              {data.requests.length > 0 ? (
                <List
                  rowCount={data.requests.length}
                  rowHeight={64}
                  style={{ height: 300 }}
                  rowComponent={({ index, style }) => {
                    const req = data.requests[index];
                    return (
                      <div style={style} className="flex justify-between items-center border-b border-slate-100 pb-2 px-1">
                        <div>
                          <p className="font-medium text-slate-900">{req.serviceCode}</p>
                          <p className="text-xs text-slate-500">{new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
                          {req.status}
                        </span>
                      </div>
                    );
                  }}
                  rowProps={{}}
                />
              ) : (
                <p className="text-slate-500 italic">No requests found.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-600" />
                Earnings & Commissions
              </h2>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Earned</p>
                <p className="text-2xl font-bold text-emerald-600">₹{data.totalCommission.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar size={18} className="text-indigo-600" />
                  <h3 className="font-semibold text-sm">Payout Schedule</h3>
                </div>
                <p className="text-slate-600 text-sm">{data.payoutSchedule}</p>
                <p className="text-[10px] text-slate-400 mt-1 italic">Next payout: Coming Monday</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <History size={18} className="text-indigo-600" />
                  <h3 className="font-semibold text-sm">Last Payout</h3>
                </div>
                <p className="text-slate-600 text-sm">₹0.00</p>
                <p className="text-[10px] text-slate-400 mt-1 italic">No previous payouts found</p>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <IndianRupee size={16} />
              Commission History
            </h3>
            <div className="h-[400px]">
              {data.commissions.length > 0 ? (
                <List
                  rowCount={data.commissions.length}
                  rowHeight={72}
                  style={{ height: 400 }}
                  rowComponent={({ index, style }) => {
                    const comm = data.commissions[index];
                    return (
                      <div style={style} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Service Commission</p>
                          <p className="text-[10px] text-slate-500">{new Date(comm.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">+₹{comm.amount}</p>
                          <p className="text-[10px] text-slate-400">Credited to Wallet</p>
                        </div>
                      </div>
                    );
                  }}
                  rowProps={{}}
                />
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm italic">No commissions earned yet. Start processing services to earn!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-xl p-6 shadow-lg flex flex-col h-[500px]">
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <Bot size={24} className="text-indigo-200" />
              <h3 className="font-bold text-lg">AI Assistant</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg text-sm leading-relaxed backdrop-blur-sm border ${
                    msg.role === 'user' 
                      ? 'bg-indigo-500/30 border-indigo-400/30 ml-8' 
                      : 'bg-white/10 border-white/20 mr-8'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {isAiLoading && (
                <div className="bg-white/10 border-white/20 mr-8 p-3 rounded-lg text-sm leading-relaxed backdrop-blur-sm border w-fit">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleAiQuery} className="relative shrink-0 mt-auto">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask for recommendations, check status..."
                className="w-full pl-3 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
              />
              <button
                type="submit"
                disabled={isAiLoading || !aiInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-200 hover:text-white disabled:opacity-50 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
