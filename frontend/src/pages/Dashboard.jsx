import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Heart, Users, X,
  Sparkles, Brain, Microscope, BookOpen,
  BarChart3, AlertTriangle, Stethoscope, Layers, FileCheck,
  Database, Cpu
} from 'lucide-react';
import { RealisticLiverDisplay } from '../components/Illustrations';
import { fetchHistory, fetchModelInfo, DEFAULT_MODEL_INFO } from '../services/api';

const CLINICAL_BIOMARKERS = [
  {
    name: 'Total Bilirubin',
    unit: 'mg/dL',
    range: '0.1 – 1.2 mg/dL',
    category: 'Excretory Function',
    desc: 'Breakdown pigment of hemoglobin cleared by hepatocytes. Values above 2.0 mg/dL lead to clinical jaundice and indicate impaired hepatic clearance or biliary obstruction.',
    clinicalImpact: 'High in Cirrhosis, Hepatitis, Biliary Atresia'
  },
  {
    name: 'Direct (Conjugated) Bilirubin',
    unit: 'mg/dL',
    range: '0.0 – 0.3 mg/dL',
    category: 'Conjugation Function',
    desc: 'Water-soluble bilirubin conjugated by glucuronyl transferase. Elevation indicates post-hepatic or intra-hepatic cholestasis where bile outflow is impeded.',
    clinicalImpact: 'Marker of cholestasis and bile duct injury'
  },
  {
    name: 'Serum Albumin',
    unit: 'g/dL',
    range: '3.5 – 5.0 g/dL',
    category: 'Synthetic Capacity',
    desc: 'Solely synthesized by hepatocytes; maintains oncotic pressure. Hypoalbuminemia (< 3.0 g/dL) is a hallmark of decompensated cirrhosis and predicts ascites formation.',
    clinicalImpact: 'Decreases in chronic hepatic insufficiency'
  },
  {
    name: 'Alkaline Phosphatase (ALP)',
    unit: 'U/L',
    range: '44 – 147 U/L',
    category: 'Canalicular Enzyme',
    desc: 'Enzyme localized to the biliary canalicular membrane. Elevation indicates biliary epithelial cell damage, infiltrative liver disease, or cholestasis.',
    clinicalImpact: 'Elevated in cholestatic liver diseases'
  },
  {
    name: 'SGOT / AST',
    unit: 'U/L',
    range: '8 – 48 U/L',
    category: 'Necroinflammatory Enzyme',
    desc: 'Mitochondrial and cytosolic enzyme released upon hepatocellular necrosis. An AST/ALT ratio > 2 strongly correlates with alcoholic liver cirrhosis.',
    clinicalImpact: 'Spikes in active hepatocellular damage'
  },
  {
    name: 'Total Cholesterol',
    unit: 'mg/dL',
    range: '< 200 mg/dL',
    category: 'Metabolic Function',
    desc: 'Synthesized and regulated by hepatic receptors. Severe parenchymal disease leads to impaired cholesterol synthesis and low circulating levels.',
    clinicalImpact: 'Altered lipid metabolism in end-stage cirrhosis'
  },
];

const DISEASE_STAGES = [
  {
    stage: 'Stage 1',
    name: 'Hepatic Steatosis (Fatty Liver)',
    status: 'Reversible',
    statusColor: 'emerald',
    desc: 'Triglyceride accumulation in >5% of hepatocytes. Generally asymptomatic, reversible with dietary intervention and lifestyle changes.'
  },
  {
    stage: 'Stage 2',
    name: 'NASH / Chronic Hepatitis',
    status: 'Reversible with Therapy',
    statusColor: 'teal',
    desc: 'Cellular ballooning, lobular inflammation, and early peri-sinusoidal fibrosis. Hepatocytes begin releasing elevated AST/ALT.'
  },
  {
    stage: 'Stage 3',
    name: 'Advanced Hepatic Fibrosis',
    status: 'Partially Reversible',
    statusColor: 'amber',
    desc: 'Extensive collagen deposition forming bridging fibrosis between portal tracts. Liver stiffness increases substantially.'
  },
  {
    stage: 'Stage 4',
    name: 'Decompensated Cirrhosis',
    status: 'Irreversible / Critical',
    statusColor: 'rose',
    desc: 'Diffuse nodular architectural distortion, portal hypertension, splenomegaly, ascites, and risk of hepatocellular carcinoma.'
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [activeTab, setActiveTab] = useState('biomarkers'); // 'biomarkers' | 'stages' | 'model'
  const [stats, setStats] = useState({ total: 0, high: 0, low: 0, loaded: false });
  const [modelInfo, setModelInfo] = useState(DEFAULT_MODEL_INFO);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchHistory(), fetchModelInfo()]).then(([history, mInfo]) => {
      if (!mounted) return;
      if (Array.isArray(history)) {
        const high = history.filter((r) => r.result === 'High Risk' || r.probability >= 50).length;
        const low = history.length - high;
        setStats({ total: history.length, high, low, loaded: true });
      }
      if (mInfo) setModelInfo(mInfo);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-7 animate-fade-in">

      {/* ═══════ HERO SECTION (Matches Reference Image with Realistic 3D Liver) ═══════ */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 lg:p-10 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Soft background ambient gradient */}
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-teal-50/70 blur-3xl pointer-events-none" />

        <div className="max-w-xl z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/60 text-teal-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Hepatic Risk Diagnostic</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#132A38] tracking-tight leading-tight">
            Liver Cirrhosis <br />
            <span className="text-teal-700 font-extrabold">Prediction System</span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base lg:text-lg leading-relaxed">
            An AI-powered solution to assess the risk of liver cirrhosis and support early healthcare decisions using routine blood test biomarkers.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/patient-details')}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#0E2738] hover:bg-teal-800 text-white font-semibold text-sm shadow-lg shadow-navy-900/15 transition-all duration-200 group active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => navigate('/ml-analytics')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 font-semibold text-sm transition-all"
            >
              <Brain className="w-4 h-4 text-teal-700" />
              <span>ML & Project Info</span>
            </button>

            <button
              onClick={() => setShowLearnMore(true)}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Clinical Guide</span>
            </button>
          </div>
        </div>

        {/* Clear Photorealistic 3D Human Liver Illustration */}
        <div className="flex-shrink-0 relative w-full sm:w-auto flex justify-center">
          <RealisticLiverDisplay className="w-64 h-56 sm:w-72 sm:h-64 lg:w-84 lg:h-72" showHotspots={true} />
        </div>
      </div>

      {/* ═══════ THREE FEATURE CARDS (Exact match to Reference Image) ═══════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Early Detection */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base leading-tight">
              Early Detection
            </h3>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Better Treatment
            </p>
          </div>
        </div>

        {/* Card 2: Healthy Liver */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0 text-rose-500">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base leading-tight">
              Healthy Liver
            </h3>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Healthy Life
            </p>
          </div>
        </div>

        {/* Card 3: Know Your Risk */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0 text-sky-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base leading-tight">
              Know Your Risk
            </h3>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Take Action
            </p>
          </div>
        </div>
      </div>

      {/* ═══════ PROJECT OVERVIEW & ML SNAPSHOT SECTION ═══════ */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 text-teal-700 text-[11px] font-bold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              <span>Project Architecture &amp; Machine Learning Engine</span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mt-0.5">
              {modelInfo.project?.name || 'LiverCare AI — Liver Cirrhosis Prediction System'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              {modelInfo.project?.purpose} Built with React 18, FastAPI, Scikit-Learn Calibrated Random Forest, ReportLab PDF export, and Supabase Cloud PostgreSQL.
            </p>
          </div>
          <button
            onClick={() => navigate('/ml-analytics')}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold transition-colors self-start sm:self-center"
          >
            <BarChart3 className="w-4 h-4 text-teal-700" />
            <span>Full ML Metrics &amp; Charts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary ML Model</span>
            <p className="font-bold text-slate-800 text-sm">Calibrated Random Forest</p>
            <p className="text-[11px] text-slate-500">250 trees + Sigmoid calibration</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Training &amp; Discrimination</span>
            <p className="font-bold text-teal-700 text-sm">ROC-AUC {modelInfo.ml_pipeline?.roc_auc || 0.918}</p>
            <p className="text-[11px] text-slate-500">803 patients (ILPD + Controls)</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Database className="w-3 h-3 text-teal-600" />
              Supabase Screenings
            </span>
            <p className="font-bold text-slate-800 text-sm">
              {stats.loaded ? `${stats.total} Saved Assessments` : 'Syncing records...'}
            </p>
            <p className="text-[11px] text-slate-500">
              {stats.loaded ? `${stats.low} Low Risk · ${stats.high} High Risk` : 'Cloud PostgreSQL Persistence'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clinical Output</span>
            <p className="font-bold text-slate-800 text-sm">4-Stage Stratification</p>
            <p className="text-[11px] text-slate-500">PDF clinical reports &amp; CSV export</p>
          </div>
        </div>
      </div>

      {/* ═══════ ABOUT LIVER CIRRHOSIS SECTION (Exact Match with Cirrhosis Comparison) ═══════ */}
      <div className="bg-white rounded-2xl p-6 lg:p-7 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-24 h-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 shadow-sm">
            <img
              src="/assets/cirrhosis_stages.jpg"
              alt="Liver Cirrhosis Pathology"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              About Liver Cirrhosis
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Liver cirrhosis is the late stage of chronic liver damage, where healthy tissue is replaced by scar tissue, disrupting vital metabolic filtration and hepatic vascular flow.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowLearnMore(true)}
          className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 hover:underline"
        >
          <span>Learn More</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ═══════ DETAILED CLINICAL INFORMATION SECTION (New In-Depth Panels) ═══════ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider">
              <Microscope className="w-4 h-4" />
              <span>Comprehensive Clinical Knowledge Base</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-1">
              Diagnostic Biomarkers & Hepatic Pathology
            </h2>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 text-xs font-semibold overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('biomarkers')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'biomarkers'
                  ? 'bg-white text-teal-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Biomarkers (LFT)
            </button>
            <button
              onClick={() => setActiveTab('stages')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'stages'
                  ? 'bg-white text-teal-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cirrhosis Stages
            </button>
            <button
              onClick={() => setActiveTab('model')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'model'
                  ? 'bg-white text-teal-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ML Architecture
            </button>
          </div>
        </div>

        {/* Tab 1: Blood Biomarkers In-Depth */}
        {activeTab === 'biomarkers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {CLINICAL_BIOMARKERS.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                      {item.category}
                    </span>
                    <span className="text-xs font-extrabold text-slate-700">
                      {item.range}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm mt-2">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 text-[11px] text-teal-900 font-medium">
                  <strong>Clinical Significance:</strong> {item.clinicalImpact}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Stages of Liver Disease */}
        {activeTab === 'stages' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {DISEASE_STAGES.map((s, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border bg-white shadow-sm flex flex-col justify-between"
                  style={{
                    borderColor: s.statusColor === 'emerald' ? '#A7F3D0' :
                                 s.statusColor === 'teal' ? '#99F6E4' :
                                 s.statusColor === 'amber' ? '#FDE68A' : '#FECDD3'
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-400">{s.stage}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.statusColor === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        s.statusColor === 'teal' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                        s.statusColor === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {s.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm mb-1.5">{s.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Clinical Threshold:</strong> Early detection at Stage 1 or Stage 2 allows for complete hepatic parenchymal regeneration. Once bridging fibrosis advances into nodular Stage 4 cirrhosis, architectural distortion is irreversible, emphasizing the necessity of predictive ML screening.
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: ML Model Pipeline Info */}
        {activeTab === 'model' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-teal-700 font-bold">
                  <Brain className="w-4 h-4" />
                  <span>Calibrated ML Engine</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Trained on the <strong>UCI ILPD (583 records) + 220 Clinical Reference Controls</strong> using <strong>RandomForestClassifier</strong> (250 trees, max_depth=7) wrapped with <strong>Sigmoid CalibratedClassifierCV</strong> for clinically accurate risk probabilities.
                </p>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold">
                  <span className="text-slate-500">ROC-AUC Discrimination:</span>
                  <span className="text-emerald-700">0.918 (91.8%)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-teal-700 font-bold">
                  <Layers className="w-4 h-4" />
                  <span>Feature Normalization</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Applies <strong>StandardScaler</strong> (z = (x - mean) / std) across all 8 routine blood biomarkers to harmonize clinical units (mg/dL vs U/L) and reduce enzyme skewness (ALP and SGOT).
                </p>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold">
                  <span className="text-slate-500">Export Artifact:</span>
                  <span className="text-teal-700">scaler.pkl + liver_model.pkl</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-teal-700 font-bold">
                  <FileCheck className="w-4 h-4" />
                  <span>Supabase & FastAPI Cloud</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  FastAPI serverless API computes live risk & stage stratification, persisting all patient telemetry into <strong>Supabase PostgreSQL</strong> with automated ReportLab PDF & CSV exports.
                </p>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold">
                  <span className="text-slate-500">Inference Latency:</span>
                  <span className="text-teal-700">&lt; 25 ms</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => navigate('/ml-analytics')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>View Full ML Benchmarks, Feature Importance & Charts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ FULL CLINICAL GUIDE MODAL ═══════ */}
      {showLearnMore && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">
                  Clinical Handbook: Liver Cirrhosis & Diagnostic Markers
                </h3>
              </div>
              <button
                onClick={() => setShowLearnMore(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-600 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Pathophysiology of Hepatic Fibrosis</h4>
                <p>
                  Chronic liver injury triggers hepatic stellate cell (HSC) activation, transforming them into proliferative, fibrogenic myofibroblasts. This causes accelerated synthesis and deposition of extracellular matrix (collagen types I and III), forming dense fibrotic septa that distort hepatic architecture, compress sinusoids, and generate portal hypertension.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Etiologies & Global Epidemiology</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Alcohol-Related Liver Disease (ARLD):</strong> Chronic ethanol oxidation generates acetaldehyde and reactive oxygen species (ROS), causing oxidative stress and steatohepatitis.</li>
                  <li><strong>Non-Alcoholic Fatty Liver Disease (NAFLD/NASH):</strong> Strongly linked to metabolic syndrome, insulin resistance, type 2 diabetes, and obesity.</li>
                  <li><strong>Viral Hepatitis (B & C):</strong> Immune-mediated chronic hepatocyte destruction leading to cumulative scarring.</li>
                  <li><strong>Autoimmune & Biliary:</strong> Primary biliary cholangitis (PBC) and primary sclerosing cholangitis (PSC).</li>
                </ul>
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-teal-900">
                <p className="font-bold mb-1">How Machine Learning Augments Clinical Practice:</p>
                <p>
                  Conventional screening often relies on solitary AST/ALT flags, which can be normal in up to 30% of cirrhosis patients. By training on multi-parameter patterns (Albumin depletion + Bilirubin elevation + Alkaline Phosphatase shifts), non-linear ML models capture subtle subclinical signatures earlier than individual threshold tests.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowLearnMore(false)}
                className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs"
              >
                Close Handbook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
