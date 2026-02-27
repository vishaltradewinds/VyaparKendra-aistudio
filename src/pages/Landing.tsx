import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Briefcase, Wallet, Users, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                V
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                VyaparKendra
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/services"
                className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors mr-2"
              >
                Services
              </Link>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-white"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6 ring-1 ring-inset ring-indigo-700/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Empowering Digital India
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]"
            >
              Your Digital Storefront for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">
                Every Essential Service
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed"
            >
              Join 10,000+ Mitras providing banking, government, and digital services to their communities. Earn high commissions and grow your business today.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-xl shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                Start Earning Now
                <ArrowRight className="ml-2 -mr-1 w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
              >
                Learn More
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Everything you need to succeed
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              We provide the tools, services, and support you need to become the digital hub of your community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Briefcase,
                title: "200+ Services",
                desc: "Offer PAN, Aadhaar, banking, and utility services from one unified dashboard.",
                colorClass: "bg-indigo-100 text-indigo-600",
              },
              {
                icon: Wallet,
                title: "Instant Commissions",
                desc: "Earn high margins on every transaction, credited instantly to your wallet.",
                colorClass: "bg-emerald-100 text-emerald-600",
              },
              {
                icon: Users,
                title: "Community Impact",
                desc: "Become the trusted digital service provider for your village or neighborhood.",
                colorClass: "bg-blue-100 text-blue-600",
              },
              {
                icon: ShieldCheck,
                title: "Secure & Compliant",
                desc: "Bank-grade security and full regulatory compliance for peace of mind.",
                colorClass: "bg-rose-100 text-rose-600",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "Optimized platform ensuring quick transactions and zero downtime.",
                colorClass: "bg-amber-100 text-amber-600",
              },
              {
                icon: ArrowRight,
                title: "Easy Onboarding",
                desc: "Get started in minutes with our streamlined KYC and onboarding process.",
                colorClass: "bg-violet-100 text-violet-600",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.colorClass} flex items-center justify-center mb-6`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/vyapar/1920/1080')] opacity-10 mix-blend-overlay bg-cover bg-center"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
            Ready to transform your business?
          </h2>
          <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of successful Mitras who are already earning and making a difference in their communities.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-indigo-600 bg-white rounded-xl shadow-lg hover:bg-indigo-50 hover:scale-105 transition-all"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              V
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              VyaparKendra
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} VyaparKendra. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
