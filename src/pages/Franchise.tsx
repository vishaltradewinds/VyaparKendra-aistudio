import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Users, IndianRupee, Activity, TrendingUp, MapPin, CheckCircle2, Clock, Gift, Copy, Plus, Edit2, Trash2, ShieldAlert, Search, Filter } from "lucide-react";
import { List } from "react-window";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../components/LanguageSelector";

export default function Franchise() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMitra, setEditingMitra] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', status: 'active' });
  
  // Filters
  const [mitraSearch, setMitraSearch] = useState("");
  const [mitraStatusFilter, setMitraStatusFilter] = useState("all");
  const [mitraKycFilter, setMitraKycFilter] = useState("all");
  const [commissionTypeFilter, setCommissionTypeFilter] = useState("all");

  const navigate = useNavigate();

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

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleOpenModal = (mitra: any = null) => {
    if (mitra) {
      setEditingMitra(mitra);
      setFormData({ name: mitra.name, email: mitra.email, password: '', status: mitra.status || 'active' });
    } else {
      setEditingMitra(null);
      setFormData({ name: '', email: '', password: '', status: 'active' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMitra(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      if (editingMitra) {
        await axios.put(`/api/dashboard/franchise/mitras/${editingMitra.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post("/api/dashboard/franchise/mitras", formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      alert("Error saving Mitra. Please check the details.");
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm("Are you sure you want to deactivate this Mitra?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`/api/dashboard/franchise/mitras/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert("Error deactivating Mitra.");
    }
  };

  // Filtered Data
  const filteredMitras = data?.mitras?.filter((mitra: any) => {
    const matchesSearch = (mitra.name?.toLowerCase() || '').includes(mitraSearch.toLowerCase()) || 
                          (mitra.email?.toLowerCase() || '').includes(mitraSearch.toLowerCase());
    const matchesStatus = mitraStatusFilter === 'all' || mitra.status === mitraStatusFilter;
    const matchesKyc = mitraKycFilter === 'all' || mitra.kyc_status === mitraKycFilter;
    return matchesSearch && matchesStatus && matchesKyc;
  }) || [];

  const filteredCommissions = data?.recentCommissions?.filter((comm: any) => {
    return commissionTypeFilter === 'all' || comm.type === commissionTypeFilter;
  }) || [];

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
            <div className="p-6 border-b border-slate-200 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Mitra Network</h2>
                  <span className="text-sm text-slate-500">{filteredMitras.length} Mitras</span>
                </div>
                <button 
                  onClick={() => handleOpenModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus size={16} /> Add Mitra
                </button>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by name or email..." 
                    value={mitraSearch}
                    onChange={(e) => setMitraSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <select 
                  value={mitraStatusFilter}
                  onChange={(e) => setMitraStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="deactivated">Deactivated</option>
                </select>
                <select 
                  value={mitraKycFilter}
                  onChange={(e) => setMitraKycFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="all">All KYC</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="flex-1 min-h-[400px]">
              <div className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider grid grid-cols-6 p-4 font-medium border-b border-slate-200">
                <div>Name</div>
                <div>Email</div>
                <div>KYC Status</div>
                <div>Onboarding</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="h-[400px]">
                {filteredMitras.length > 0 ? (
                  <List
                    rowCount={filteredMitras.length}
                    rowHeight={64}
                    style={{ height: 400 }}
                    rowComponent={({ index, style }) => {
                      const mitra = filteredMitras[index];
                      return (
                        <div style={style} className="grid grid-cols-6 items-center p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
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
                          <div>
                            {mitra.status === 'deactivated' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                                <ShieldAlert size={12} /> Deactivated
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-right flex items-center justify-end gap-2">
                            <button onClick={() => handleOpenModal(mitra)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                              <Edit2 size={16} />
                            </button>
                            {mitra.status !== 'deactivated' && (
                              <button onClick={() => handleDeactivate(mitra.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
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
            <div className="p-6 border-b border-slate-200 flex flex-col gap-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Commissions</h2>
              <select 
                value={commissionTypeFilter}
                onChange={(e) => setCommissionTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="all">All Types</option>
                <option value="FRANCHISE_COMMISSION">Service Commissions</option>
                <option value="REFERRAL_BONUS">Referral Bonuses</option>
              </select>
            </div>
            <div className="p-6 flex-1 h-[500px]">
              {filteredCommissions.length > 0 ? (
                <List
                  rowCount={filteredCommissions.length}
                  rowHeight={80}
                  style={{ height: 500 }}
                  rowComponent={({ index, style }) => {
                    const comm = filteredCommissions[index];
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

      {/* Add/Edit Mitra Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingMitra ? 'Edit Mitra' : 'Add New Mitra'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              {!editingMitra && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
              )}
              {editingMitra && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingMitra ? 'Save Changes' : 'Add Mitra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
