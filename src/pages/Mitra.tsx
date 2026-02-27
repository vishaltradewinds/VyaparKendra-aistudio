import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Mitra() {
  const [data, setData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");
    
    axios.get("/api/dashboard/mitra", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setData(res.data))
      .catch(() => navigate("/"));
  }, [navigate]);

  if (!data) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Mitra Dashboard</h1>
        <button onClick={() => { localStorage.clear(); navigate("/"); }} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">Logout</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
  );
}
