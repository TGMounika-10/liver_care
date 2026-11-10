import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, UserCircle2, Activity, FileBarChart, Brain, X } from 'lucide-react';
import { LeafDecoration } from './Illustrations';

const navItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Patient Details', path: '/patient-details', icon: UserCircle2 },
  { name: 'Prediction', path: '/prediction', icon: Activity },
  { name: 'Reports & History', path: '/reports', icon: FileBarChart },
  { name: 'ML & Project Info', path: '/ml-analytics', icon: Brain },
];

export default function Sidebar({ onClose, isMobile = false }) {
  const location = useLocation();

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className="h-full w-[260px] min-w-[260px] bg-white border-r border-slate-100/80 flex flex-col justify-between select-none overflow-y-auto scrollbar-thin">
      {/* ─── Brand Header ─── */}
      <div>
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Project Icon Mark */}
            <img
              src="/favicon.svg"
              alt="LiverCare AI Logo"
              className="w-10 h-10 rounded-2xl shadow-md shadow-teal-700/20 flex-shrink-0"
            />
            <div>
              <h1 className="text-[17px] font-extrabold tracking-tight leading-none">
                <span className="text-teal-700">Liver</span>
                <span className="text-teal-600">Care</span>
                <span className="text-slate-400 font-bold ml-0.5 text-sm">AI</span>
              </h1>
              <p className="text-[10px] font-semibold text-slate-400 mt-1 tracking-[0.12em] uppercase">
                Predict · Care · Live
              </p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {isMobile && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ─── Navigation ─── */}
        <nav className="mt-3 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-[13px] transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-700/20 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 rounded-r-full" />
                )}
                <Icon
                  className={`w-[18px] h-[18px] flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-600'
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span>{item.name}</span>

                {/* Active indicator dot */}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* ─── Sidebar Footer ─── */}
      <div className="relative p-4 overflow-hidden mt-4">
        <LeafDecoration className="bottom-0 left-0 w-24 h-24 opacity-25 transform -scale-x-100" />
        <div className="relative z-10 p-3 rounded-xl bg-gradient-to-r from-teal-50/80 to-emerald-50/40 border border-teal-100/50 text-center">
          <p className="text-[11px] text-teal-700/80 font-medium leading-snug">
            Take care of your liver
            <br />
            <span className="font-semibold text-teal-800">for a healthier tomorrow</span>{' '}
            <span className="text-teal-600">♡</span>
          </p>
        </div>
        <p className="text-[9px] text-slate-400 text-center mt-2 font-medium">
          LiverCare AI v1.0 · Clinical Decision Support
        </p>
      </div>
    </aside>
  );
}
