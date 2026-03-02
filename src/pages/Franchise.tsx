import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Users, IndianRupee, Activity, TrendingUp, MapPin, CheckCircle2, Clock, Gift, Copy } from "lucide-react";
import { List } from "react-window";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../components/LanguageSelector";

export default function Franchise() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/");
      
      try {
        const res = await axios.get("/api/dashboard/franchise", { headers: { Authorization: `Bearer ${token}` } });
        setData(res.data);
      } catch (err) {
        navigate("/");
      }
    };
    fetchData();
  }, [navigate]);

  if (!data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">{t('common.loading')}</p>
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
            {t('nav.franchise')}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            <MapPin size={16} className="text-indigo-600" />
            {data.district || "Unknown Region"}
          </div>
          <button 
            onClick={() => { localStorage.clear(); navigate("/"); }} 
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            {t('nav.logout')}
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.franchise')} {t('dashboard.overview')}</h1>
          <p className="text-slate-500">Monitor your regional performance and Mitra network.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <IndianRupee size={20} />
              </div>
              <h2 className="text-slate-500 text-sm font-medium">{t('dashboard.totalCommission')}</h2>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-auto">₹{data.totalCommission.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Gift size={20} />
              </div>
              <h2 className="text-slate-500 text-sm font-medium">Referral Bonuses</h2>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-auto">₹{data.referralBonuses.toLocaleString()}</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Users size={20} />
              </div>
              <h2 className="text-slate-500 text-sm font-medium">{t('dashboard.activeMitras')}</h2>
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

        {/* Referral Section */}
        <div className="mb-8 bg-indigo-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-100">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold mb-2">Grow Your Network</h2>
            <p className="text-indigo-100">Share your referral code with new Mitras and earn <span className="font-bold text-white">₹500</span> for every successful onboarding.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-5 rounded-2xl flex items-center gap-6 w-full md:w-auto">
            <div>
              <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider mb-1">Your Referral Code</p>
              <p className="text-3xl font-mono font-bold">{data.franchiseId}</p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(data.franchiseId);
                alert("Referral code copied!");
              }}
              className="p-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg active:scale-95"
            >
              <Copy size={24} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mitras List */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Mitra Network</h2>
              <span className="text-sm text-slate-500">{data.mitras.length} Total</span>
            </div>
            <div className="flex-1 min-h-[400px]">
              <div className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider grid grid-cols-5 p-4 font-medium border-b border-slate-200">
                <div>Name</div>
                <div>Email</div>
                <div>KYC Status</div>
                <div>Onboarding</div>
                <div className="text-right">ID</div>
              </div>
              <div className="h-[400px]">
                {data.mitras.length > 0 ? (
                  <List
                    rowCount={data.mitras.length}
                    rowHeight={64}
                    style={{ height: 400 }}
                    rowComponent={({ index, style }) => {
                      const mitra = data.mitras[index];
                      return (
                        <div style={style} className="grid grid-cols-5 items-center p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                          <div className="font-medium text-slate-900 truncate pr-2">{mitra.name || 'Unnamed'}</div>
                          <div className="text-slate-600 text-sm truncate pr-2">{mitra.email}</div>
                          <div>
                            {mitra.kyc_status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                                <CheckCircle2 size={12} /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                                <Clock size={12} /> Pending
                              </span>
                            )}
                          </div>
                          <div className="text-slate-600 text-sm">
                            Step {mitra.onboarding_step || 1}/3
                          </div>
                          <div className="text-right text-slate-400 text-sm font-mono">{mitra.id.substring(0, 8)}</div>
                        </div>
                      );
                    }}
                    rowProps={{}}
                  />
                ) : (
                  <div className="p-8 text-center text-slate-500 italic">
                    No Mitras registered in your district yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Commissions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Recent Commissions</h2>
            </div>
            <div className="p-6 flex-1 h-[500px]">
              {data.recentCommissions.length > 0 ? (
                <List
                  rowCount={data.recentCommissions.length}
                  rowHeight={80}
                  style={{ height: 500 }}
                  rowComponent={({ index, style }) => {
                    const comm = data.recentCommissions[index];
                    return (
                      <div style={style} className="px-1 pb-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                              +
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">
                                {comm.type === 'REFERRAL_BONUS' ? 'Referral Bonus' : 'Commission Earned'}
                              </p>
                              <p className="text-xs text-slate-500">{new Date(comm.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className="font-bold text-emerald-600">+₹{comm.amount}</span>
                        </div>
                      </div>
                    );
                  }}
                  rowProps={{}}
                />
              ) : (
                <div className="text-center py-8 text-slate-500 italic">
                  No commissions earned yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
