import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../components/LanguageSelector";
import { 
  ShieldCheck, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye, 
  ArrowLeft,
  Search,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Compliance() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDocs, setUserDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");
    
    try {
      const res = await axios.get("/api/dashboard/compliance", { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setData(res.data);
    } catch (err) {
      navigate("/");
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const fetchUserDocs = async (user: any) => {
    setLoadingDocs(true);
    setSelectedUser(user);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/compliance/user-documents/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserDocs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleVerify = async (status: 'approved' | 'rejected') => {
    const reason = status === 'rejected' ? prompt("Enter rejection reason:") : "";
    if (status === 'rejected' && reason === null) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/compliance/verify-kyc", {
        userId: selectedUser.id,
        status,
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUser(null);
      fetchData();
    } catch (err) {
      alert("Verification failed");
    }
  };

  if (!data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  );

  const filteredUsers = data.pendingKyc.filter((u: any) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="w-full bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">V</div>
          <span className="text-xl font-bold tracking-tight text-slate-900">VyaparKendra</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <button 
            onClick={() => { localStorage.clear(); navigate("/"); }} 
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {t('nav.logout')}
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {!selectedUser ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <ShieldCheck className="text-indigo-600" />
                    Compliance Review
                  </h1>
                  <p className="text-slate-500 mt-1">Verify and approve new Mitra applications</p>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by name, email or district..."
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-80"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                      <Users size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending KYC</span>
                  </div>
                  <p className="text-4xl font-bold text-slate-900">{data.pendingKyc.length}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Applicant</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">District</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Step</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredUsers.length > 0 ? filteredUsers.map((user: any) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{user.name}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                            {user.district}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500" 
                                style={{ width: `${(user.onboarding_step / 3) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-slate-500">{user.onboarding_step}/3</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => fetchUserDocs(user)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all"
                          >
                            <Eye size={16} /> Review
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center">
                            <CheckCircle size={48} className="text-slate-200 mb-4" />
                            <p className="text-lg font-medium">All caught up!</p>
                            <p className="text-sm">No pending KYC verifications at the moment.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button 
                onClick={() => setSelectedUser(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-6 transition-colors"
              >
                <ArrowLeft size={20} /> Back to List
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <FileText className="text-indigo-600" />
                      Submitted Documents
                    </h2>
                    
                    {loadingDocs ? (
                      <div className="flex flex-col items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                        <p className="text-slate-500 text-sm">Loading documents...</p>
                      </div>
                    ) : userDocs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {userDocs.map((doc: any) => (
                          <div key={doc.id} className="group relative bg-slate-50 rounded-2xl border border-slate-100 p-4 hover:border-indigo-200 transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-wider">
                                {doc.docType}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(doc.uploaded_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="aspect-video bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center mb-3">
                              {doc.file_data ? (
                                <img 
                                  src={doc.file_data} 
                                  alt={doc.docType} 
                                  className="max-w-full max-h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="text-slate-300 flex flex-col items-center">
                                  <FileText size={40} />
                                  <span className="text-xs mt-2">No preview available</span>
                                </div>
                              )}
                            </div>
                            
                            <button 
                              onClick={() => {
                                if (doc.file_data) {
                                  const win = window.open();
                                  win?.document.write(`<img src="${doc.file_data}" style="max-width: 100%;" />`);
                                }
                              }}
                              className="w-full py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                            >
                              View Full Size
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-slate-500 text-sm">No documents found for this user.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 sticky top-24">
                    <h2 className="text-xl font-bold mb-6">Applicant Details</h2>
                    <div className="space-y-4 mb-8">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                        <p className="font-bold text-slate-900">{selectedUser.name}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                        <p className="text-slate-600">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">District</label>
                        <p className="text-slate-600">{selectedUser.district}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Onboarding Progress</label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500" 
                              style={{ width: `${(selectedUser.onboarding_step / 3) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-500">{selectedUser.onboarding_step}/3</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button 
                        onClick={() => handleVerify('approved')}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} /> Approve KYC
                      </button>
                      <button 
                        onClick={() => handleVerify('rejected')}
                        className="w-full py-3 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle size={18} /> Reject Application
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
