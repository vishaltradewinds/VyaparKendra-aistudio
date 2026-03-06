import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../components/LanguageSelector";
import { Search, Filter, Users, IndianRupee, Activity, ShieldAlert, CheckCircle2, Clock, Settings, Edit2, Trash2, Plus } from "lucide-react";
import { List } from "react-window";

export default function Admin() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  
  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("all");
  
  // Services
  const [activeTab, setActiveTab] = useState<'users' | 'ledger' | 'services'>('users');
  const [editingService, setEditingService] = useState<any>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: '', category: '', price: 0, commission: 0, description: '', processing_time: '' });

  const navigate = useNavigate();

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");
    
    try {
      const res = await axios.get("/api/dashboard/admin", { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data);
    } catch (err) {
      navigate("/");
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleSaveService = async () => {
    const token = localStorage.getItem("token");
    try {
      if (editingService) {
        await axios.put(`/api/services/${editingService.id}`, serviceForm, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post("/api/services", serviceForm, { headers: { Authorization: `Bearer ${token}` } });
      }
      setEditingService(null);
      setIsAddingService(false);
      fetchData();
    } catch (err) {
      console.error("Failed to save service", err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`/api/services/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      console.error("Failed to delete service", err);
    }
  };

  if (!data) return <div className="p-8">{t('common.loading')}</div>;

  // Filtered Data
  const filteredUsers = data?.users?.filter((user: any) => {
    const matchesSearch = (user.name?.toLowerCase() || '').includes(userSearch.toLowerCase()) || 
                          (user.email?.toLowerCase() || '').includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || user.status === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const filteredLedger = data?.ledger?.filter((entry: any) => {
    return ledgerTypeFilter === 'all' || entry.type === ledgerTypeFilter;
  }) || [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">{t('nav.admin')} Dashboard</h1>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <button onClick={() => { localStorage.clear(); navigate("/"); }} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">{t('nav.logout')}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-slate-500 text-sm font-medium mb-2">Total Users</h2>
          <p className="text-4xl font-bold text-indigo-600">{data.totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-slate-500 text-sm font-medium mb-2">Platform Revenue</h2>
          <p className="text-4xl font-bold text-emerald-600">₹{data.platformRevenue}</p>
        </div>
      </div>

      <div className="mb-6 flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-sm font-medium transition-colors ${activeTab === 'users' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          User Management
        </button>
        <button 
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 px-4 text-sm font-medium transition-colors ${activeTab === 'ledger' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Ledger & Transactions
        </button>
        <button 
          onClick={() => setActiveTab('services')}
          className={`pb-3 px-4 text-sm font-medium transition-colors ${activeTab === 'services' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Service Pricing
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users size={20} className="text-indigo-600" />
                User Management
              </h2>
              <span className="text-sm text-slate-500">{filteredUsers.length} Users</span>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <select 
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="franchise">Franchise</option>
                <option value="mitra">Mitra</option>
              </select>
              <select 
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          </div>
          <div className="flex-1 min-h-[400px]">
            <div className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider grid grid-cols-4 p-4 font-medium border-b border-slate-200">
              <div>Name/Email</div>
              <div>Role</div>
              <div>Status</div>
              <div className="text-right">KYC</div>
            </div>
            <div className="h-[400px]">
              {filteredUsers.length > 0 ? (
                <List
                  rowCount={filteredUsers.length}
                  rowHeight={64}
                  style={{ height: 400 }}
                  rowComponent={({ index, style }) => {
                    const user = filteredUsers[index];
                    return (
                      <div style={style} className="grid grid-cols-4 items-center p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                        <div className="truncate pr-2">
                          <p className="font-medium text-slate-900 text-sm truncate">{user.name || 'Unnamed'}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <div>
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium capitalize">
                            {user.role}
                          </span>
                        </div>
                        <div>
                          {user.status === 'deactivated' ? (
                            <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                              <ShieldAlert size={12} /> Deactivated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                              <CheckCircle2 size={12} /> Active
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          {user.kyc_status === 'verified' ? (
                            <span className="text-emerald-600 text-xs font-medium">Verified</span>
                          ) : (
                            <span className="text-amber-600 text-xs font-medium">Pending</span>
                          )}
                        </div>
                      </div>
                    );
                  }}
                  rowProps={{}}
                />
              ) : (
                <div className="p-8 text-center text-slate-500 italic">No users found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity size={20} className="text-indigo-600" />
                Ledger Entries
              </h2>
            </div>
            <select 
              value={ledgerTypeFilter}
              onChange={(e) => setLedgerTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="all">All Types</option>
              <option value="SERVICE_DEBIT">Service Debits</option>
              <option value="MITRA_COMMISSION">Mitra Commissions</option>
              <option value="FRANCHISE_COMMISSION">Franchise Commissions</option>
              <option value="REFERRAL_BONUS">Referral Bonuses</option>
              <option value="WALLET_RECHARGE">Wallet Recharges</option>
            </select>
          </div>
          <div className="flex-1 min-h-[400px]">
            <div className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider grid grid-cols-3 p-4 font-medium border-b border-slate-200">
              <div>Type/Date</div>
              <div>Movement</div>
              <div className="text-right">Amount</div>
            </div>
            <div className="h-[400px]">
              {filteredLedger.length > 0 ? (
                <List
                  rowCount={filteredLedger.length}
                  rowHeight={64}
                  style={{ height: 400 }}
                  rowComponent={({ index, style }) => {
                    const entry = filteredLedger[index];
                    return (
                      <div style={style} className="grid grid-cols-3 items-center p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                        <div className="truncate pr-2">
                          <p className="font-medium text-slate-900 text-sm truncate">{entry.type}</p>
                          <p className="text-xs text-slate-500 truncate">{new Date(entry.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-xs text-slate-500">
                          <p>Dr: {entry.debit}</p>
                          <p>Cr: {entry.credit}</p>
                        </div>
                        <div className="text-right font-bold text-slate-900">
                          ₹{entry.amount}
                        </div>
                      </div>
                    );
                  }}
                  rowProps={{}}
                />
              ) : (
                <div className="p-8 text-center text-slate-500 italic">No ledger entries found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Settings size={20} className="text-indigo-500" />
              Service Pricing & Configuration
            </h2>
            <button 
              onClick={() => {
                setEditingService(null);
                setServiceForm({ name: '', category: '', price: 0, commission: 0, description: '', processing_time: '' });
                setIsAddingService(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              Add Service
            </button>
          </div>

          {(isAddingService || editingService) && (
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-md font-semibold text-slate-800 mb-4">{editingService ? 'Edit Service' : 'New Service'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Service Name</label>
                  <input 
                    type="text" 
                    value={serviceForm.name} 
                    onChange={e => setServiceForm({...serviceForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g., PAN Card Application"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                  <input 
                    type="text" 
                    value={serviceForm.category} 
                    onChange={e => setServiceForm({...serviceForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g., Identity"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Platform Fee (₹)</label>
                  <input 
                    type="number" 
                    value={serviceForm.price} 
                    onChange={e => setServiceForm({...serviceForm, price: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Amount deducted from Mitra wallet</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Processing Time</label>
                  <input 
                    type="text" 
                    value={serviceForm.processing_time} 
                    onChange={e => setServiceForm({...serviceForm, processing_time: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g., 2-3 days"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                  <input 
                    type="text" 
                    value={serviceForm.description} 
                    onChange={e => setServiceForm({...serviceForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => { setEditingService(null); setIsAddingService(false); }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveService}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save Service
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 p-4 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
            <div className="col-span-2">Service Details</div>
            <div>Platform Fee</div>
            <div className="text-right">Actions</div>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.services?.map((service: any) => (
              <div key={service.id} className="grid grid-cols-4 items-center p-4 hover:bg-slate-50 transition-colors">
                <div className="col-span-2 pr-4">
                  <p className="font-medium text-slate-900 text-sm">{service.name}</p>
                  <p className="text-xs text-slate-500">{service.category} • {service.processing_time}</p>
                </div>
                <div className="font-mono text-sm font-medium text-slate-700">
                  ₹{service.price}
                </div>
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => {
                      setEditingService(service);
                      setServiceForm(service);
                      setIsAddingService(false);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteService(service.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
