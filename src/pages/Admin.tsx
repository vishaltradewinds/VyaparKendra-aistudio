import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../components/LanguageSelector";
import { Search, Filter, Users, IndianRupee, Activity, ShieldAlert, CheckCircle2, Clock } from "lucide-react";
import { List } from "react-window";

export default function Admin() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  
  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
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
    fetchData();
  }, [navigate]);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Users List */}
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

        {/* Ledger List */}
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
      </div>
    </div>
  );
}
