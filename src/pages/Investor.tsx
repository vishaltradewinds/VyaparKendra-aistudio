import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../components/LanguageSelector";

export default function Investor() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/");
      
      try {
        const res = await axios.get("/api/dashboard/investor", { headers: { Authorization: `Bearer ${token}` } });
        setData(res.data);
      } catch (err) {
        navigate("/");
      }
    };
    fetchData();
  }, [navigate]);

  if (!data) return <div className="p-8">{t('common.loading')}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Investor Dashboard</h1>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <button onClick={() => { localStorage.clear(); navigate("/"); }} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">{t('nav.logout')}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-slate-500 text-sm font-medium mb-2">Total Platform Revenue</h2>
          <p className="text-4xl font-bold text-indigo-600">₹{data.totalRevenue}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-slate-500 text-sm font-medium mb-2">MoM Growth</h2>
          <p className="text-4xl font-bold text-emerald-600">+{data.monthOverMonthGrowth}%</p>
        </div>
      </div>
    </div>
  );
}
