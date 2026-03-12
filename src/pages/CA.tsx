import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../components/LanguageSelector";
import { 
  Briefcase, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye, 
  ArrowLeft,
  Search,
  Clock,
  ExternalLink,
  CheckSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function CA() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [requestDocs, setRequestDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");
    
    try {
      const res = await axios.get("/api/dashboard/ca", { 
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

  const fetchRequestDocs = async (request: any) => {
    setLoadingDocs(true);
    setSelectedRequest(request);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/service-requests/${request.id}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequestDocs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleVerifyDoc = async (docId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`/api/service-requests/${selectedRequest.id}/verify-document`, {
        docId,
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh docs
      const res = await axios.get(`/api/service-requests/${selectedRequest.id}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequestDocs(res.data);
    } catch (err) {
      alert("Verification failed");
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`/api/service-requests/${selectedRequest.id}/update-status`, {
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedRequest(null);
      fetchData();
    } catch (err) {
      alert("Status update failed");
    }
  };

  const handleUploadResultDoc = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const token = localStorage.getItem("token");
          await axios.post(`/api/service-requests/${selectedRequest.id}/upload`, {
            docType: 'PROCESSED_DOCUMENT',
            fileData: event.target?.result
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Refresh docs
          const res = await axios.get(`/api/service-requests/${selectedRequest.id}/documents`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setRequestDocs(res.data);
        } catch (err) {
          alert("Upload failed");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  if (!data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  );

  const filteredRequests = data.requests.filter((r: any) => 
    r.serviceCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.mitraName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.district.toLowerCase().includes(searchTerm.toLowerCase())
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
          {!selectedRequest ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <Briefcase className="text-indigo-600" />
                    Professional Services Dashboard
                  </h1>
                  <p className="text-slate-500 mt-1">Manage Tax, GST, and Compliance requests</p>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search requests..."
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-80"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Clock size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending Requests</span>
                  </div>
                  <p className="text-4xl font-bold text-slate-900">{data.requests.filter((r:any) => r.status !== 'COMPLETED').length}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mitra / District</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRequests.length > 0 ? filteredRequests.map((req: any) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{req.serviceCode}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{req.id.split('-')[0]}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-700">{req.mitraName}</div>
                          <div className="text-xs text-slate-500">{req.district}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            req.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 
                            req.status === 'PROCESSING' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => fetchRequestDocs(req)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all"
                          >
                            <Eye size={16} /> Review
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center">
                            <CheckCircle size={48} className="text-slate-200 mb-4" />
                            <p className="text-lg font-medium">No requests found</p>
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
                onClick={() => setSelectedRequest(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-6 transition-colors"
              >
                <ArrowLeft size={20} /> Back to Requests
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="text-indigo-600" />
                        Service Documents
                      </h2>
                    </div>
                    
                    {loadingDocs ? (
                      <div className="flex flex-col items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                        <p className="text-slate-500 text-sm">Loading documents...</p>
                      </div>
                    ) : requestDocs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {requestDocs.map((doc: any) => (
                          <div key={doc.id} className="group relative bg-slate-50 rounded-2xl border border-slate-100 p-4 hover:border-indigo-200 transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-wider">
                                {doc.docType}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                doc.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                doc.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {doc.status}
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
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleVerifyDoc(doc.id, 'APPROVED')}
                                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button 
                                onClick={() => handleVerifyDoc(doc.id, 'REJECTED')}
                                className="flex-1 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50 transition-colors flex items-center justify-center gap-1"
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-500 text-sm">No documents uploaded for this request yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 sticky top-24">
                    <h2 className="text-xl font-bold mb-6">Request Details</h2>
                    <div className="space-y-4 mb-8">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service Type</label>
                        <p className="font-bold text-slate-900">{selectedRequest.serviceCode}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mitra Name</label>
                        <p className="text-slate-600">{selectedRequest.mitraName}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">District</label>
                        <p className="text-slate-600">{selectedRequest.district}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</label>
                        <p className="text-sm font-bold text-indigo-600">{selectedRequest.status}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button 
                        onClick={() => handleUpdateStatus('PROCESSING')}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Clock size={18} /> Mark as Processing
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus('COMPLETED')}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckSquare size={18} /> Mark as Completed
                      </button>
                      <div className="pt-4 border-t border-slate-200 mt-4">
                        <button 
                          onClick={handleUploadResultDoc}
                          disabled={isUploading}
                          className="w-full py-3 bg-white border border-indigo-200 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <FileText size={18} /> {isUploading ? 'Uploading...' : 'Upload Result Document'}
                        </button>
                        <p className="text-[10px] text-slate-500 text-center mt-2">
                          Upload the final processed document (e.g., PAN Card, Certificate) for the Mitra to download.
                        </p>
                      </div>
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
