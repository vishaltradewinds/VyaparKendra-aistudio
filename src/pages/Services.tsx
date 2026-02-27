import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Search } from "lucide-react";

export default function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/services")
      .then(res => {
        setServices(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="w-full bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            V
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            VyaparKendra
          </span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Available Services</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Browse our comprehensive catalog of digital, financial, and government services available through our Mitra network.
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-12 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search services by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
          />
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-slate-600 font-medium">Loading services...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, idx) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col h-full"
              >
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                    {service.category}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2">
                    {service.name}
                  </h3>
                  <p className="text-slate-600 text-sm line-clamp-3">
                    {service.description || "No description available."}
                  </p>
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Price</p>
                    <p className="text-lg font-bold text-slate-900">₹{service.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Processing</p>
                    <p className="text-sm font-medium text-slate-700">{service.processing_time || "Standard"}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {filteredServices.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                <p className="text-slate-500 text-lg">No services found matching "{search}"</p>
                <button 
                  onClick={() => setSearch("")}
                  className="mt-4 text-indigo-600 font-medium hover:text-indigo-700"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
