import React from 'react';
import realisticLiverImg from '../assets/realistic_liver.jpg';
import humanBodyLiverImg from '../assets/human_body_liver.jpg';
import cirrhosisStagesImg from '../assets/cirrhosis_stages.jpg';

/* ═══════════════════════════════════════════════════════════
   CLEAR REALISTIC 3D LIVER MEDICAL VISUALIZATION
   Uses high-resolution photorealistic 3D anatomical render
   with clinical hotspot annotations and subtle ambient glow
   ═══════════════════════════════════════════════════════════ */
export const RealisticLiverDisplay = ({ className = "w-80 h-72", showHotspots = true }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background Soft Ambient Light */}
      <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 via-rose-500/10 to-amber-500/5 rounded-3xl blur-2xl transform scale-95 pointer-events-none" />

      {/* Main High-Res Render Container */}
      <div className="relative w-full h-full flex items-center justify-center p-2 group">
        <img
          src={realisticLiverImg}
          alt="Anatomical 3D Render of Human Liver"
          className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(139,26,28,0.22)] transition-transform duration-500 group-hover:scale-[1.02]"
          loading="eager"
        />

        {/* Anatomical Clinical Callout Tags */}
        {showHotspots && (
          <>
            {/* Right Hepatic Lobe Hotspot */}
            <div className="absolute top-[18%] right-[10%] hidden sm:flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-slate-200/80 text-[10px] font-bold text-slate-700 animate-fade-in hover:border-teal-400 transition-colors">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
              <span>Right Hepatic Lobe</span>
            </div>

            {/* Left Hepatic Lobe Hotspot */}
            <div className="absolute bottom-[28%] left-[8%] hidden sm:flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-slate-200/80 text-[10px] font-bold text-slate-700 animate-fade-in hover:border-teal-400 transition-colors">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Left Lobe</span>
            </div>

            {/* Gallbladder & Portal Vein Callout */}
            <div className="absolute -bottom-2 right-[20%] hidden sm:flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-emerald-200 text-[10px] font-bold text-emerald-800 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Gallbladder & Biliary Tract</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════
   REALISTIC 3D HUMAN BODY OUTLINE WITH GLOWING LIVER
   Translucent clinical body rendering with right upper quadrant
   hepatic illumination, anatomical markers, and diagnostic frame
   ═══════════════════════════════════════════════════════════ */
export const RealHumanBodyDisplay = ({ className = "w-64 h-[420px]" }) => {
  return (
    <div className={`relative flex flex-col items-center justify-center ${className} select-none`}>
      {/* Subtle Medical Diagnostic Grid Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-teal-50/60 via-slate-50/30 to-teal-50/40 rounded-3xl border border-teal-100/60 overflow-hidden shadow-inner">
        {/* Holographic grid lines */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#0D7377 1px, transparent 1px), linear-gradient(90deg, #0D7377 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {/* Real Translucent 3D Body Image with Glowing Liver */}
      <div className="relative z-10 w-full h-[340px] flex items-center justify-center p-3">
        <img
          src={humanBodyLiverImg}
          alt="Translucent 3D Human Body Anatomy with Highlighted Liver"
          className="w-full h-full object-contain filter drop-shadow-[0_8px_20px_rgba(13,115,119,0.18)]"
          loading="eager"
        />

        {/* Anatomical Marker: Right Upper Quadrant (RUQ) */}
        <div className="absolute top-[38%] right-[14%] flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/90 text-white text-[9px] font-extrabold uppercase tracking-wider shadow-sm">
          <span>RUQ · Liver</span>
        </div>
      </div>

      {/* Clinical Caption Bar */}
      <div className="relative z-10 text-center pb-2">
        <p className="text-teal-800 font-extrabold text-xs tracking-wide">
          Anatomical Hepatic Mapping
        </p>
        <p className="text-teal-600 font-medium text-[11px] flex items-center justify-center gap-1 mt-0.5">
          <span>Healthy Liver / Happy You</span>
          <span className="text-rose-500 font-bold">♥</span>
        </p>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════
   LIVER CIRRHOSIS CLINICAL COMPARISON IMAGE
   High-resolution side-by-side 3D render of Healthy vs Cirrhotic
   ═══════════════════════════════════════════════════════════ */
export const CirrhosisComparisonDisplay = ({ className = "w-full max-w-lg" }) => {
  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-md bg-white p-2 ${className}`}>
      <img
        src={cirrhosisStagesImg}
        alt="Side-by-side medical comparison of healthy liver vs cirrhotic scarred liver"
        className="w-full h-auto object-cover rounded-xl"
        loading="lazy"
      />
      <div className="flex items-center justify-between px-3 pt-2 pb-1 text-[11px] font-bold">
        <span className="text-emerald-700 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Stage 0: Healthy Parenchyma
        </span>
        <span className="text-rose-700 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          Stage 4: Advanced Cirrhosis
        </span>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════
   FRIENDLY LIVER MASCOT WITH SHIELD (for Result Page)
   ═══════════════════════════════════════════════════════════ */
export const LiverMascot = ({ className = "w-28 h-28" }) => (
  <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <radialGradient id="mascotBody" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FCA5A5" />
        <stop offset="35%" stopColor="#F87171" />
        <stop offset="70%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#B91C1C" />
      </radialGradient>
      <radialGradient id="shieldGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#5EEAD4" />
        <stop offset="50%" stopColor="#14B8A6" />
        <stop offset="100%" stopColor="#0D7377" />
      </radialGradient>
    </defs>
    <ellipse cx="90" cy="155" rx="42" ry="8" fill="#1E293B" fillOpacity="0.06" />
    <path
      d="M 40 85 C 28 55, 48 22, 82 18 C 120 14, 152 32, 158 62 C 164 88, 152 118, 130 132 C 112 144, 82 146, 62 132 C 46 122, 35 105, 40 85Z"
      fill="url(#mascotBody)"
      filter="drop-shadow(0 6px 12px rgba(220,38,38,0.2))"
    />
    <path d="M 60 35 C 80 25, 110 25, 130 40 C 120 30, 90 28, 65 38Z" fill="white" fillOpacity="0.35" />
    {/* Eyes */}
    <g transform="translate(68, 58)">
      <ellipse cx="0" cy="0" rx="6" ry="8" fill="#1E293B" />
      <ellipse cx="-2" cy="-3" rx="2.5" ry="3" fill="#FFFFFF" />
      <circle cx="2" cy="2" r="1" fill="#FFFFFF" opacity="0.5" />
    </g>
    <g transform="translate(108, 56)">
      <ellipse cx="0" cy="0" rx="6" ry="8" fill="#1E293B" />
      <ellipse cx="-2" cy="-3" rx="2.5" ry="3" fill="#FFFFFF" />
      <circle cx="2" cy="2" r="1" fill="#FFFFFF" opacity="0.5" />
    </g>
    {/* Smile & Cheeks */}
    <path d="M 76 80 Q 88 95 100 80" stroke="#7F1D1D" strokeWidth="2.8" fill="none" strokeLinecap="round" />
    <circle cx="58" cy="78" r="7" fill="#FECACA" opacity="0.7" />
    <circle cx="118" cy="76" r="7" fill="#FECACA" opacity="0.7" />
    {/* Arm with shield */}
    <path d="M42 90 C 30 85, 20 72, 22 60" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" fill="none" />
    <circle cx="22" cy="57" r="4" fill="#FCA5A5" />
    <g transform="translate(130, 100) scale(0.85)">
      <path
        d="M 20 0 C 32 0 40 8 40 18 C 40 32 20 45 20 45 C 20 45 0 32 0 18 C 0 8 8 0 20 0Z"
        fill="url(#shieldGrad)"
        filter="drop-shadow(0 3px 6px rgba(13,115,119,0.3))"
      />
      <path d="M20 12 V28 M12 20 H28" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  </svg>
);


/* ═══════════════════════════════════════════════════════════
   BOTANICAL LEAF ACCENT (Decorative corner flourish)
   ═══════════════════════════════════════════════════════════ */
export const LeafDecoration = ({ className = "w-40 h-40" }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"
       className={`pointer-events-none absolute opacity-40 ${className}`}>
    <path d="M200 120C170 120 130 150 120 200C160 200 190 170 200 120Z"
          fill="#A7F3D0" fillOpacity="0.35"/>
    <path d="M200 60C160 65 110 110 90 180C140 175 185 130 200 60Z"
          fill="#34D399" fillOpacity="0.2"/>
    <path d="M170 200C165 160 125 115 50 100C60 150 110 190 170 200Z"
          fill="#0D7377" fillOpacity="0.12"/>
    <path d="M200 170C150 160 120 180 110 200" stroke="#14919B" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  </svg>
);
