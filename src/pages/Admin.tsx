import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [data, setData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");
    
    axios.get("/api/dashboard/admin", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setData(res.data))
      .catch(() => navigate("/"));
  }, [navigate]);

  if (!data) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
        <button onClick={() => { localStorage.clear(); navigate("/"); }} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">Logout</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-slate-500 text-sm font-medium mb-2">Total Users</h2>
          <p className="text-4xl font-bold text-indigo-600">{data.totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-slate-500 text-sm font-medium mb-2">Platform Revenue</h2>
          <p className="text-4xl font-bold text-emerald-600">₹{data.platformRevenue}</p>
        </div>
      </div>
    </div>
  );
}
