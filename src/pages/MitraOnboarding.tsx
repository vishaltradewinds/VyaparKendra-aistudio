import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  BookOpen, 
  CheckCircle2, 
  Upload, 
  PlayCircle, 
  ArrowRight, 
  ShieldCheck,
  AlertCircle,
  Clock
} from "lucide-react";

export default function MitraOnboarding() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/onboarding/status", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(res.data);
    } catch (err) {
      console.error(err);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleUpload = async (docType: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/onboarding/upload", { docType }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStatus();
    } catch (err) {
      alert("Upload failed");
    }
  };

  const completeModule = async (moduleId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/onboarding/complete-training", { moduleId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStatus();
    } catch (err) {
      alert("Failed to update progress");
    }
  };

  const finalSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/onboarding/final-submit", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStatus();
    } catch (err) {
      alert("Final submission failed");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  );

  const steps = [
    { id: 0, title: "Document Verification", icon: FileText, description: "Upload your ID and shop details." },
    { id: 1, title: "Training Modules", icon: BookOpen, description: "Learn how to use the platform." },
    { id: 2, title: "Final Review", icon: ShieldCheck, description: "Submit your application for approval." }
  ];

  const currentStep = status.onboarding_step;

  if (currentStep >= 3) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Application Under Review</h1>
          <p className="text-slate-600 mb-8">
            Thank you for completing the onboarding! Our team is currently reviewing your documents and training progress. 
            You will be notified once your account is fully activated.
          </p>
          <button 
            onClick={() => navigate("/dashboard/mitra")}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <nav className="w-full bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">V</div>
          <span className="text-xl font-bold tracking-tight text-slate-900">VyaparKendra</span>
        </div>
        <div className="text-sm font-medium text-slate-500">Mitra Onboarding</div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to the Network!</h1>
          <p className="text-slate-600">Complete these steps to start offering services in your community.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
                  ${isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-200' : 'bg-white border-2 border-slate-200 text-slate-400'}
                `}>
                  {isCompleted ? <CheckCircle2 size={24} /> : <Icon size={24} />}
                </div>
                <div className="mt-3 text-center">
                  <p className={`text-sm font-bold ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>{step.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText className="text-indigo-600" />
                Document Upload
              </h2>
              <div className="space-y-4">
                {[
                  { id: "AADHAAR", label: "Aadhaar Card (Front & Back)" },
                  { id: "PAN", label: "PAN Card" },
                  { id: "SHOP_PHOTO", label: "Shop Front Photo" }
                ].map(doc => {
                  const isUploaded = status.documents.some((d: any) => d.docType === doc.id);
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="font-medium text-slate-900">{doc.label}</p>
                        <p className="text-xs text-slate-500">Required for verification</p>
                      </div>
                      {isUploaded ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                          <CheckCircle2 size={18} /> Uploaded
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleUpload(doc.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all"
                        >
                          <Upload size={16} /> Upload
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <AlertCircle className="text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  Please ensure all documents are clear and legible. Blurred images may lead to rejection.
                </p>
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="text-indigo-600" />
                Training Modules
              </h2>
              <div className="space-y-4">
                {status.training.map((module: any) => (
                  <div key={module.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900">{module.title}</h3>
                        <p className="text-sm text-slate-600">{module.description}</p>
                      </div>
                      {module.completed ? (
                        <CheckCircle2 className="text-emerald-500" />
                      ) : (
                        <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded uppercase">{module.duration}</span>
                      )}
                    </div>
                    {!module.completed && (
                      <button 
                        onClick={() => completeModule(module.id)}
                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
                      >
                        <PlayCircle size={16} /> Start Module
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 text-center"
            >
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Ready for Review</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                You've completed all the necessary steps! Click the button below to submit your application for final review by our compliance team.
              </p>
              <button 
                onClick={finalSubmit}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                Submit Application <ArrowRight size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
