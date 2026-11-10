import React, { useEffect, useState } from 'react';
import {
  Brain, Cpu, Database, Layers, Server, Sparkles, CheckCircle2,
  BarChart3, GitBranch, ShieldCheck, ZoomIn, X, Activity, ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { fetchModelInfo, getChartUrl, DEFAULT_MODEL_INFO } from '../services/api';

const CHART_COLORS = ['#0D7377', '#14919B', '#0EA5E9', '#10B981', '#6366F1', '#F59E0B', '#64748B', '#94A3B8'];

export default function MLAnalytics() {
  const navigate = useNavigate();
  const [info, setInfo] = useState(DEFAULT_MODEL_INFO);
  const [loading, setLoading] = useState(true);
  const [zoomChart, setZoomChart] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchModelInfo().then((data) => {
      if (mounted && data) setInfo(data);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const { project, ml_pipeline, model_comparison, feature_importance, charts } = info;

  return (
    <div className="space-y-7 animate-fade-in">
      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200/60 flex items-center justify-center text-teal-700 shadow-sm">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Project Info & ML Analytics</h1>
            <p className="text-sm text-slate-500">
              Complete system architecture, ML pipeline details, feature importance, and evaluation metrics.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/patient-details')}
          className="btn-primary text-xs self-start sm:self-auto"
        >
          <span>Run Live Prediction</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ═══════ PROJECT INFORMATION & ARCHITECTURE BANNER ═══════ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/60 text-teal-700 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{project.version ? `v${project.version}` : 'v1.0.0'} · Full-Stack Clinical AI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{project.name}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{project.purpose}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ROC-AUC: {ml_pipeline.roc_auc || 0.918}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold">
              {ml_pipeline.feature_count || 8} Blood Biomarkers
            </span>
          </div>
        </div>

        {/* Tech Stack Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-xs">
              <Layers className="w-4 h-4" />
              <span>Frontend UI</span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">{project.stack.frontend}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-xs">
              <Server className="w-4 h-4" />
              <span>Backend & ML API</span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">{project.stack.backend}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-xs">
              <Database className="w-4 h-4" />
              <span>Cloud Database</span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">{project.stack.database}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-xs">
              <Cpu className="w-4 h-4" />
              <span>Cloud Deployment</span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">{project.stack.hosting}</p>
          </div>
        </div>

        {/* System Architecture Pipeline */}
        <div className="pt-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">End-to-End Inference Pipeline</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {[
              { step: '01', title: '8 LFT Inputs', desc: 'Age, Gender, Bilirubin, Albumin, ALP, SGOT, Cholesterol' },
              { step: '02', title: 'StandardScaler', desc: 'Z-score normalization (z = (x - μ) / σ)' },
              { step: '03', title: 'Random Forest', desc: '250 decision trees evaluate non-linear patterns' },
              { step: '04', title: 'Sigmoid Calibration', desc: 'CalibratedClassifierCV outputs clinical probabilities' },
              { step: '05', title: 'Supabase & PDF', desc: 'Persisted to PostgreSQL + ReportLab clinical PDF' },
            ].map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-50/70 to-white border border-teal-100/80 relative">
                <span className="text-[10px] font-black text-teal-600 bg-teal-100/70 px-2 py-0.5 rounded-md">
                  STEP {item.step}
                </span>
                <h4 className="font-bold text-slate-800 mt-2">{item.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ ML PIPELINE DETAILS & FEATURE IMPORTANCE ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Feature Importance Interactive Chart */}
        <div className="lg:col-span-7 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                <span>Biomarker Feature Importance (%)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Relative decision weight of each clinical biomarker inside the trained Random Forest.
              </p>
            </div>
            {loading && <span className="text-[11px] text-teal-600 font-semibold">Syncing...</span>}
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={feature_importance}
                layout="vertical"
                margin={{ top: 5, right: 24, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  type="category"
                  dataKey="feature"
                  width={150}
                  tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 600 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Importance']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="importance" radius={[0, 8, 8, 0]} barSize={20}>
                  {feature_importance.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Dataset & Clinical Staging Thresholds */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-card p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-teal-600" />
              <span>Training & Calibration Logic</span>
            </h3>
            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800 block mb-0.5">Dataset Composition</span>
                {ml_pipeline.dataset}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800 block mb-0.5">Model & Calibration</span>
                {ml_pipeline.primary_model} — {ml_pipeline.calibration}
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800 block mb-0.5">Scaling Strategy</span>
                {ml_pipeline.preprocessing}
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Clinical Risk Stratification</span>
            </h3>
            <div className="space-y-2">
              {ml_pipeline.risk_thresholds.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{t.stage}</p>
                    <p className="text-[11px] text-slate-500">{t.label}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-teal-700 text-[11px]">
                    {t.range}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ MODEL COMPARISON BENCHMARK TABLE ═══════ */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Model Comparison Benchmark</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluated on stratified 80/20 test split across Accuracy, Precision, Recall, and F1 Score.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Algorithm</th>
                <th className="px-5 py-3.5">Accuracy</th>
                <th className="px-5 py-3.5">Precision</th>
                <th className="px-5 py-3.5">Recall</th>
                <th className="px-5 py-3.5">F1 Score</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {model_comparison.map((row, idx) => (
                <tr key={idx} className={row.selected ? 'bg-teal-50/40' : 'hover:bg-slate-50/60'}>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{row.model}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-700">{row.accuracy.toFixed(2)}%</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-700">{row.precision.toFixed(2)}%</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-700">{row.recall.toFixed(2)}%</td>
                  <td className="px-5 py-3.5 font-bold text-teal-700">{row.f1_score.toFixed(4)}</td>
                  <td className="px-5 py-3.5">
                    {row.selected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> Active Production
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Evaluated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════ TRAINING & EDA VISUAL CHARTS GALLERY ═══════ */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">ML Evaluation & Dataset EDA Charts</h3>
          <p className="text-xs text-slate-500">
            Generated directly during training via scikit-learn, Matplotlib, and Seaborn. Click any chart to enlarge.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {charts.map((c, idx) => (
            <div
              key={idx}
              onClick={() => setZoomChart(c)}
              className="glass-card-hover p-4 cursor-pointer group flex flex-col justify-between space-y-3"
            >
              <div className="relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100 aspect-[4/3] flex items-center justify-center">
                <img
                  src={getChartUrl(c.file)}
                  alt={c.name}
                  loading="lazy"
                  onError={(e) => {
                    if (!e.currentTarget.dataset.fallback) {
                      e.currentTarget.dataset.fallback = '1';
                      e.currentTarget.src = `/charts/${c.file}`;
                    }
                  }}
                  className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 shadow-sm flex items-center justify-center text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{c.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ CHART LIGHTBOX MODAL ═══════ */}
      {zoomChart && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setZoomChart(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-800 text-base">{zoomChart.name}</h4>
                <p className="text-xs text-slate-500">{zoomChart.desc}</p>
              </div>
              <button
                onClick={() => setZoomChart(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 rounded-2xl p-2 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={getChartUrl(zoomChart.file)}
                alt={zoomChart.name}
                onError={(e) => {
                  if (!e.currentTarget.dataset.fallback) {
                    e.currentTarget.dataset.fallback = '1';
                    e.currentTarget.src = `/charts/${zoomChart.file}`;
                  }
                }}
                className="max-w-full max-h-[65vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
