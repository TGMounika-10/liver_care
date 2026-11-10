import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { LeafDecoration } from './Illustrations';

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF6F6] via-[#F0F8F8] to-[#F5F9FA] text-slate-800 flex flex-col md:flex-row relative">
      {/* ─── Mobile Header (Visible on < md screens) ─── */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <img
            src="/favicon.svg"
            alt="LiverCare AI Logo"
            className="w-8 h-8 rounded-xl shadow-sm"
          />
          <span className="font-extrabold text-base tracking-tight">
            <span className="text-teal-700">Liver</span>
            <span className="text-teal-600">Care</span>
            <span className="text-slate-400 font-bold ml-0.5 text-xs">AI</span>
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ─── Mobile Sidebar Drawer Overlay ─── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-out Sidebar Drawer */}
          <div className="relative z-10 w-[270px] max-w-[80vw] h-full shadow-2xl animate-fade-in bg-white">
            <Sidebar onClose={() => setMobileMenuOpen(false)} isMobile={true} />
          </div>
        </div>
      )}

      {/* ─── Desktop Sidebar (Hidden on mobile, sticky on md+) ─── */}
      <div className="hidden md:block sticky top-0 h-screen z-30">
        <Sidebar />
      </div>

      {/* ─── Main Content Area ─── */}
      <main className="flex-1 relative overflow-y-auto scrollbar-thin min-h-[calc(100vh-57px)] md:min-h-screen">
        {/* Subtle decorative leaves */}
        <LeafDecoration className="top-0 right-0 w-36 h-36 sm:w-52 sm:h-52 opacity-20 rotate-180" />
        <LeafDecoration className="bottom-0 right-0 w-32 h-32 sm:w-44 sm:h-44 opacity-25" />

        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #14919B 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Scrollable page content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
