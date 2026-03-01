import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Mitra from "./pages/Mitra";
import Franchise from "./pages/Franchise";
import CA from "./pages/CA";
import Compliance from "./pages/Compliance";
import Investor from "./pages/Investor";
import Services from "./pages/Services";
import MitraOnboarding from "./pages/MitraOnboarding";

// Placeholder component for Forgot Password
const ForgotPassword = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Forgot Password</h1>
      <p className="text-slate-600 mb-6">This feature is currently under construction. Please contact support for assistance.</p>
      <a href="/login" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
        Back to Login
      </a>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/services" element={<Services />} />
        <Route path="/onboarding" element={<MitraOnboarding />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/mitra" element={<Mitra />} />
        <Route path="/franchise" element={<Franchise />} />
        <Route path="/ca" element={<CA />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/investor" element={<Investor />} />
      </Routes>
    </BrowserRouter>
  );
}
