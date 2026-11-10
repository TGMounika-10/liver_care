import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, CheckCircle2, XCircle, Download, RotateCcw,
  Check, AlertTriangle, TrendingUp,
  Activity, ArrowRight, Shield, FileText
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { LiverMascot } from '../components/Illustrations';
import { downloadReportPdf } from '../services/api';

// Reference ranges to color-code each biomarker in the summary
const RANGES = {
  total_bilirubin: { normal: [0.1, 1.2], unit: 'mg/dL', label: 'Total Bilirubin' },
  direct_bilirubin: { normal: [0.0, 0.3], unit: 'mg/dL', label: 'Direct Bilirubin' },
  albumin: { normal: [3.5, 5.0], unit: 'g/dL', label: 'Albumin', inverted: true },
  alkaline_phosphatase: { normal: [44, 147], unit: 'U/L', label: 'Alk. Phosphatase' },
  sgot: { normal: [8, 48], unit: 'U/L', label: 'SGOT (AST)' },
  cholesterol: { normal: [0, 200], unit: 'mg/dL', label: 'Cholesterol' },
};

function getBiomarkerStatus(key, value) {
  const range = RANGES[key];
  if (!range) return 'normal';
  const v = parseFloat(value);
  if (isNaN(v)) return 'normal';

  if (key === 'albumin') {
    // For albumin, LOW is concerning
    if (v < range.normal[0]) return 'abnormal';
    return 'normal';
  }

  if (v > range.normal[1]) return 'abnormal';
  if (v < range.normal[0]) return 'low';
  return 'normal';
}

export default function Prediction() {
  const location = useLocation();
  const navigate = useNavigate();

  const patientData = location.state?.patientData || {
    age: 52, gender: 'Female',
    total_bilirubin: 1.1, direct_bilirubin: 0.4,
    albumin: 3.8, alkaline_phosphatase: 90,
    sgot: 42, cholesterol: 170,
  };

  const prediction = location.state?.prediction || {
    id: 1, result: 'Low Risk', probability: 18.7,
  };

  const isHighRisk = prediction.result === 'High Risk' || prediction.probability >= 50;
  const highRiskPct = Math.round(prediction.probability * 10) / 10;
  const lowRiskPct = Math.round((100 - highRiskPct) * 10) / 10;

  const donutData = [
    { name: 'Low Risk (Safe)', value: lowRiskPct, color: '#10B981' },
    { name: 'Disease Risk', value: highRiskPct, color: '#EF4444' },
  ];

  // Count abnormal biomarkers
  const abnormalCount = Object.keys(RANGES).filter(k => getBiomarkerStatus(k, patientData[k]) === 'abnormal').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${
            isHighRisk
              ? 'bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200/50 text-rose-600'
              : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/50 text-emerald-600'
          }`}>
            <BarChart3 className="w-6 h-6"/>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Prediction Result</h1>
            <p className="text-sm text-slate-500">
              Comprehensive risk analysis based on the entered patient biomarkers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/patient-details')} className="btn-secondary text-xs">
            <RotateCcw className="w-3.5 h-3.5 text-slate-400"/><span>New Analysis</span>
          </button>
          <button onClick={() => downloadReportPdf(prediction.id, patientData)}
                  className="btn-primary text-xs">
            <Download className="w-3.5 h-3.5"/><span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* ─── Main Result Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ═══ LEFT COLUMN: Result + Patient Summary ═══ */}
        <div className="lg:col-span-7 space-y-5">

          {/* Risk Status Card */}
          <div className="glass-card p-7 relative overflow-hidden">
            {/* Background glow */}
            <div className={`absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
              isHighRisk ? 'bg-rose-200/30' : 'bg-emerald-200/30'
            }`}/>

            <div className="relative z-10 flex flex-col items-center text-center pb-6 border-b border-slate-100">
              {/* Risk Icon */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                isHighRisk
                  ? 'bg-rose-50 border-4 border-rose-100 text-rose-500 pulse-glow-red'
                  : 'bg-emerald-50 border-4 border-emerald-100 text-emerald-500 pulse-glow-green'
              }`}>
                {isHighRisk
                  ? <XCircle className="w-10 h-10"/>
                  : <CheckCircle2 className="w-10 h-10"/>
                }
              </div>

              <h2 className={`text-3xl font-black tracking-tight ${
                isHighRisk ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {isHighRisk ? 'High Risk' : 'Low Risk'}
              </h2>

              <p className="text-slate-500 text-sm mt-2 max-w-md leading-relaxed">
                {isHighRisk
                  ? 'The model has detected patterns consistent with elevated liver disease risk. Comprehensive hepatic evaluation and specialist consultation are recommended.'
                  : 'The model indicates biochemical parameters within expected ranges. The predicted probability of cirrhosis is low based on current biomarker patterns.'
                }
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold ${
                  isHighRisk
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <Activity className="w-4 h-4"/>
                  <span>Risk Probability: {highRiskPct}%</span>
                </div>

                <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold ${
                  highRiskPct < 30
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : highRiskPct < 50
                    ? 'bg-teal-100 text-teal-800 border border-teal-300'
                    : highRiskPct < 75
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  <Shield className="w-3.5 h-3.5"/>
                  <span>
                    {prediction.stage || (
                      highRiskPct < 30 ? 'Stage 0: Optimal Health' :
                      highRiskPct < 50 ? 'Stage 1: Mild Stress / Monitor' :
                      highRiskPct < 75 ? 'Stage 2: Moderate Fibrosis Risk' :
                      'Stage 3-4: Advanced Cirrhosis'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick summary chips */}
            <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 pt-5">
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <span className="text-slate-400">Age:</span> {patientData.age}
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <span className="text-slate-400">Gender:</span> {patientData.gender}
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                abnormalCount > 0
                  ? 'bg-amber-50 border border-amber-200 text-amber-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}>
                <AlertTriangle className="w-3 h-3"/>
                <span>{abnormalCount} Abnormal Biomarker{abnormalCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Biomarker Analysis Table */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600"/>
              Biomarker Analysis
            </h3>

            <div className="space-y-2">
              {Object.entries(RANGES).map(([key, range]) => {
                const val = parseFloat(patientData[key]);
                const status = getBiomarkerStatus(key, patientData[key]);
                const isAbnormal = status === 'abnormal';
                const isLow = status === 'low';
                const normalRange = `${range.normal[0]} – ${range.normal[1]} ${range.unit}`;

                return (
                  <div key={key} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isAbnormal
                      ? 'bg-rose-50/50 border-rose-200/60'
                      : isLow
                      ? 'bg-amber-50/50 border-amber-200/60'
                      : 'bg-slate-50/50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isAbnormal
                          ? 'bg-rose-100 text-rose-600'
                          : isLow
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {isAbnormal || isLow ? <TrendingUp className="w-3.5 h-3.5"/> : <Check className="w-3.5 h-3.5"/>}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{range.label}</p>
                        <p className="text-[10px] text-slate-400">Normal: {normalRange}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        isAbnormal ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-slate-800'
                      }`}>
                        {isNaN(val) ? '—' : val} <span className="text-[10px] font-normal text-slate-400">{range.unit}</span>
                      </p>
                      <p className={`text-[10px] font-semibold ${
                        isAbnormal ? 'text-rose-500' : isLow ? 'text-amber-600' : 'text-emerald-500'
                      }`}>
                        {isAbnormal
                          ? (range.inverted ? '⬇ Low / Depleted' : '⬆ Above Normal')
                          : isLow
                          ? '⬇ Below Normal'
                          : '✓ Normal Range'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/50 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"/>
            <div className="text-xs leading-relaxed">
              <strong>Clinical Disclaimer:</strong> This is an experimental machine learning prediction
              trained on the Indian Liver Patient Dataset (ILPD, 583 records) augmented with 220 clinical healthy controls using a Calibrated Random Forest classifier (ROC-AUC 0.918).
              It is <strong>not</strong> a medical diagnosis. Always consult a qualified hepatologist or physician
              for clinical decisions. Lab values should be interpreted in the context of the patient's full medical history.
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN: Chart + Mascot + Tips ═══ */}
        <div className="lg:col-span-5 space-y-5">

          {/* Donut Chart Card */}
          <div className="glass-card p-6 flex flex-col items-center">
            <h4 className="text-sm font-bold text-slate-800 mb-3 self-start flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600"/>
              Risk Distribution
            </h4>

            <div className="w-full h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={76}
                       paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                    {donutData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} stroke="white" strokeWidth={3}/>
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-2xl font-black ${isHighRisk ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {highRiskPct}%
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {isHighRisk ? 'High Risk' : 'Low Risk'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs font-bold mt-2">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-3 h-3 rounded-full bg-emerald-500"/>
                Low Risk ({donutData[0].value}%)
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-3 h-3 rounded-full bg-rose-500"/>
                High Risk ({donutData[1].value}%)
              </span>
            </div>
          </div>

          {/* Mascot + Health Tips Card */}
          <div className="glass-card p-6 flex flex-col items-center">
            <LiverMascot className="w-28 h-28 mb-3"/>
            <h4 className="text-base font-bold text-slate-800">Keep Your Liver Healthy!</h4>
            <p className="text-[11px] text-slate-500 text-center mt-1 mb-4 max-w-xs">
              Follow these evidence-based recommendations to support liver health and reduce disease risk.
            </p>

            <div className="w-full space-y-2">
              {[
                { text: 'Avoid Excess Alcohol Consumption', detail: 'Alcohol is directly hepatotoxic and the leading cause of cirrhosis worldwide.' },
                { text: 'Eat a Balanced, Low-Fat Diet', detail: 'Rich in fruits, vegetables, lean protein. Avoid processed foods and excess sugar.' },
                { text: 'Get Regular Health Checkups', detail: 'Annual LFT panels help detect liver damage early when it is still reversible.' },
                { text: 'Maintain Healthy Body Weight', detail: 'Obesity increases risk of NAFLD, the fastest-growing cause of liver disease.' },
                { text: 'Stay Physically Active', detail: 'Regular exercise improves liver enzyme levels and reduces hepatic fat deposition.' },
              ].map((tip, i) => (
                <div key={i} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/70 group hover:bg-emerald-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[3]"/>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{tip.text}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 ml-[30px] leading-relaxed">{tip.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="glass-card p-4 flex items-center justify-between gap-3">
            <button onClick={() => navigate('/reports')} className="btn-secondary text-xs flex-1 justify-center">
              <FileText className="w-3.5 h-3.5 text-slate-400"/>
              <span>View History</span>
            </button>
            <button onClick={() => navigate('/patient-details')} className="btn-primary text-xs flex-1 justify-center">
              <span>Analyze Another</span>
              <ArrowRight className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
