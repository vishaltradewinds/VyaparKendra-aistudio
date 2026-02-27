import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Users, IndianRupee, Activity, TrendingUp, MapPin, CheckCircle2, Clock } from "lucide-react";

export default function Franchise() {
  const [data, setData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");
    
    axios.get("/api/dashboard/franchise", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setData(res.data))
      .catch(() => navigate("/"));
  }, [navigate]);

  if (!data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Loading Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="w-full bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            V
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            VyaparKendra
          </span>
          <span className="ml-2 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            Franchise
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            <MapPin size={16} className="text-indigo-600" />
            {data.district || "Unknown Region"}
          </div>
          <button 
            onClick={() => { localStorage.clear(); navigate("/"); }} 
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Franchise Overview</h1>
          <p className="text-slate-500">Monitor your regional performance and Mitra network.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <IndianRupee size={20} />
              </div>
              <h2 className="text-slate-500 text-sm font-medium">Total Commission</h2>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-auto">₹{data.totalCommission.toLocaleString()}</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Users size={20} />
              </div>
              <h2 className="text-slate-500 text-sm font-medium">Active Mitras</h2>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-auto">{data.totalMitras}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Activity size={20} />
              </div>
              <h2 className="text-slate-500 text-sm font-medium">Regional Requests</h2>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-auto">{data.regionalPerformance.totalRequests}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <h2 className="text-slate-500 text-sm font-medium">Regional Volume</h2>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-auto">₹{data.regionalPerformance.totalVolume.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mitras List */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Mitra Network</h2>
              <span className="text-sm text-slate-500">{data.mitras.length} Total</span>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">KYC Status</th>
                    <th className="p-4 font-medium text-right">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.mitras.map((mitra: any) => (
                    <tr key={mitra.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-900">{mitra.name || 'Unnamed'}</td>
                      <td className="p-4 text-slate-600 text-sm">{mitra.email}</td>
                      <td className="p-4">
                        {mitra.kyc_status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                            <CheckCircle2 size={12} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right text-slate-400 text-sm font-mono">{mitra.id.substring(0, 8)}</td>
                    </tr>
                  ))}
                  {data.mitras.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        No Mitras registered in your district yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Commissions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Recent Commissions</h2>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-4">
                {data.recentCommissions.map((comm: any) => (
                  <div key={comm.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        +
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">Commission Earned</p>
                        <p className="text-xs text-slate-500">{new Date(comm.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">+₹{comm.amount}</span>
                  </div>
                ))}
                {data.recentCommissions.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No commissions earned yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
