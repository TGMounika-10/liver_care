import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircle2, RotateCcw, ArrowRight, AlertCircle, Loader2,
  Sparkles, Info, CheckCircle2, AlertTriangle, HelpCircle,
  Stethoscope, ShieldAlert
} from 'lucide-react';
import { RealHumanBodyDisplay } from '../components/Illustrations';
import { predictRisk } from '../services/api';

const CLINICAL_FIELDS = {
  age: {
    label: 'Age',
    unit: 'yrs',
    placeholder: 'Enter age',
    min: 1,
    max: 120,
    normal: '18 – 85 yrs',
    desc: 'Patient age in years. Age > 50 with metabolic risk factors correlates with higher fibrosis progression rate.'
  },
  gender: {
    label: 'Gender',
    unit: '',
    placeholder: 'Select gender',
    normal: 'Male / Female',
    desc: 'Biological sex. Statistically, males exhibit a higher incidence of alcoholic cirrhosis; females often present more rapid fibrosis in NASH.'
  },
  total_bilirubin: {
    label: 'Total Bilirubin (mg/dL)',
    unit: 'mg/dL',
    placeholder: 'e.g. 1.2',
    min: 0.1,
    max: 100,
    normalMin: 0.1,
    normalMax: 1.2,
    normal: '0.1 – 1.2 mg/dL',
    desc: 'Total serum bilirubin concentration. Levels > 2.0 mg/dL lead to jaundice and indicate severe biliary clearance failure.'
  },
  direct_bilirubin: {
    label: 'Direct Bilirubin (mg/dL)',
    unit: 'mg/dL',
    placeholder: 'e.g. 0.3',
    min: 0.0,
    max: 50,
    normalMin: 0.0,
    normalMax: 0.3,
    normal: '0.0 – 0.3 mg/dL',
    desc: 'Conjugated fraction cleared by bile ducts. Elevated direct bilirubin is specific for hepatobiliary obstruction or hepatocellular damage.'
  },
  albumin: {
    label: 'Albumin (g/dL)',
    unit: 'g/dL',
    placeholder: 'e.g. 3.5',
    min: 0.5,
    max: 10,
    normalMin: 3.5,
    normalMax: 5.0,
    inverted: true, // Low is bad
    normal: '3.5 – 5.0 g/dL',
    desc: 'Major circulating protein synthesized by the liver. Albumin < 3.0 g/dL is a hallmark of decompensated cirrhosis and ascites.'
  },
  alkaline_phosphatase: {
    label: 'Alkaline Phosphatase (U/L)',
    unit: 'U/L',
    placeholder: 'e.g. 80',
    min: 10,
    max: 2000,
    normalMin: 44,
    normalMax: 147,
    normal: '44 – 147 U/L',
    desc: 'Enzyme located in biliary canaliculi. Significant elevation indicates cholestatic injury, bile duct pathology, or infiltrative liver disease.'
  },
  sgot: {
    label: 'SGOT (U/L)',
    unit: 'U/L',
    placeholder: 'e.g. 45',
    min: 5,
    max: 2000,
    normalMin: 8,
    normalMax: 48,
    normal: '8 – 48 U/L',
    desc: 'Serum Glutamic Oxaloacetic Transaminase (AST). Released during active hepatocyte injury; AST/ALT ratio > 2 suggests alcoholic hepatitis.'
  },
  cholesterol: {
    label: 'Cholesterol (mg/dL)',
    unit: 'mg/dL',
    placeholder: 'e.g. 180',
    min: 50,
    max: 1000,
    normalMin: 120,
    normalMax: 200,
    normal: '120 – 200 mg/dL',
    desc: 'Synthesized by the liver. Advanced cirrhosis leads to impaired lipid biosynthesis, resulting in paradoxically depleted serum cholesterol.'
  },
};

const INITIAL_FORM = {
  age: '',
  gender: 'Female',
  total_bilirubin: '',
  direct_bilirubin: '',
  albumin: '',
  alkaline_phosphatase: '',
  sgot: '',
  cholesterol: '',
};

export default function PatientDetails() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Real-time clinical evaluation helper
  const getFieldStatus = (key, val) => {
    if (!val || key === 'gender' || key === 'age') return null;
    const num = parseFloat(val);
    if (isNaN(num)) return null;
    const meta = CLINICAL_FIELDS[key];
    if (!meta) return null;

    if (meta.inverted) {
      if (num < meta.normalMin) return { status: 'low', text: 'Low / Depleted', color: 'rose' };
      if (num > meta.normalMax) return { status: 'high', text: 'Slightly Elevated', color: 'amber' };
      return { status: 'normal', text: 'Normal', color: 'emerald' };
    }

    if (num > meta.normalMax) return { status: 'high', text: 'Elevated', color: 'rose' };
    if (num < meta.normalMin) return { status: 'low', text: 'Low', color: 'amber' };
    return { status: 'normal', text: 'Normal', color: 'emerald' };
  };

  const validateField = (name, value) => {
    if (value === '' || value === null || value === undefined) {
      return 'This field is required';
    }
    const num = parseFloat(value);
    switch (name) {
      case 'age':
        if (isNaN(num) || num < 1 || num > 120) return 'Age must be between 1 and 120';
        break;
      case 'total_bilirubin':
        if (isNaN(num) || num < 0.1 || num > 100) return 'Range: 0.1 to 100 mg/dL';
        break;
      case 'direct_bilirubin':
        if (isNaN(num) || num < 0.0 || num > 50) return 'Range: 0.0 to 50 mg/dL';
        break;
      case 'albumin':
        if (isNaN(num) || num < 0.5 || num > 10) return 'Range: 0.5 to 10 g/dL';
        break;
      case 'alkaline_phosphatase':
        if (isNaN(num) || num < 10 || num > 2000) return 'Range: 10 to 2000 U/L';
        break;
      case 'sgot':
        if (isNaN(num) || num < 5 || num > 2000) return 'Range: 5 to 2000 U/L';
        break;
      case 'cholesterol':
        if (isNaN(num) || num < 50 || num > 1000) return 'Range: 50 to 1000 mg/dL';
        break;
      default:
        break;
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setApiError(null);
  };

  // Preset loading for real-time testcases & evaluation
  const handleLoadSample = (type) => {
    if (type === 'healthy') {
      setFormData({
        age: '28',
        gender: 'Female',
        total_bilirubin: '0.7',
        direct_bilirubin: '0.2',
        albumin: '4.3',
        alkaline_phosphatase: '65',
        sgot: '20',
        cholesterol: '155',
      });
    } else if (type === 'moderate') {
      setFormData({
        age: '48',
        gender: 'Male',
        total_bilirubin: '1.6',
        direct_bilirubin: '0.6',
        albumin: '3.4',
        alkaline_phosphatase: '150',
        sgot: '52',
        cholesterol: '210',
      });
    } else {
      setFormData({
        age: '58',
        gender: 'Male',
        total_bilirubin: '4.8',
        direct_bilirubin: '2.4',
        albumin: '2.4',
        alkaline_phosphatase: '310',
        sgot: '145',
        cholesterol: '140',
      });
    }
    setErrors({});
    setApiError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        age: parseInt(formData.age, 10),
        gender: formData.gender === 'Male' ? 1 : 0,
        total_bilirubin: parseFloat(formData.total_bilirubin),
        direct_bilirubin: parseFloat(formData.direct_bilirubin),
        albumin: parseFloat(formData.albumin),
        alkaline_phosphatase: parseFloat(formData.alkaline_phosphatase),
        sgot: parseFloat(formData.sgot),
        cholesterol: parseFloat(formData.cholesterol),
      };

      const result = await predictRisk(payload);

      navigate('/prediction', {
        state: {
          patientData: formData,
          prediction: result,
        },
      });
    } catch (err) {
      setApiError(err.message || 'Failed to obtain prediction. Please check server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shadow-sm">
            <UserCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Patient Details</h1>
            <p className="text-sm text-slate-500">
              Enter the patient information below to predict the risk of liver cirrhosis.
            </p>
          </div>
        </div>

        {/* Quick Demo Fill Buttons for Real-Time Testcases */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Testcases:</span>
          <button
            type="button"
            onClick={() => handleLoadSample('healthy')}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
          >
            Healthy (Low Risk)
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('moderate')}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
          >
            Early Steatosis (Moderate)
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('high')}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            Cirrhosis (High Risk)
          </button>
        </div>
      </div>

      {apiError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* ─── Form & Real Human Body Anatomy Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Card */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <span>Personal Information</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              * All 8 blood biomarkers required
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Age Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Age <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">18 – 85 yrs</span>
                </div>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Enter age (e.g. 52)"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 ${
                    errors.age
                      ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                  }`}
                />
                {errors.age && (
                  <p className="text-rose-500 text-xs mt-1 font-medium">{errors.age}</p>
                )}
              </div>

              {/* Gender Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Biological sex</span>
                </div>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm transition-all outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              {/* Total Bilirubin */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Total Bilirubin (mg/dL) <span className="text-rose-500">*</span>
                  </label>
                  {getFieldStatus('total_bilirubin', formData.total_bilirubin) ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      getFieldStatus('total_bilirubin', formData.total_bilirubin).color === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {getFieldStatus('total_bilirubin', formData.total_bilirubin).text}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Normal: 0.1–1.2</span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.1"
                  name="total_bilirubin"
                  value={formData.total_bilirubin}
                  onChange={handleChange}
                  placeholder="e.g. 1.2"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 ${
                    errors.total_bilirubin
                      ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                  }`}
                />
                {errors.total_bilirubin && (
                  <p className="text-rose-500 text-xs mt-1 font-medium">{errors.total_bilirubin}</p>
                )}
              </div>

              {/* Direct Bilirubin */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Direct Bilirubin (mg/dL) <span className="text-rose-500">*</span>
                  </label>
                  {getFieldStatus('direct_bilirubin', formData.direct_bilirubin) ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      getFieldStatus('direct_bilirubin', formData.direct_bilirubin).color === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {getFieldStatus('direct_bilirubin', formData.direct_bilirubin).text}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Normal: 0.0–0.3</span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.1"
                  name="direct_bilirubin"
                  value={formData.direct_bilirubin}
                  onChange={handleChange}
                  placeholder="e.g. 0.3"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 ${
                    errors.direct_bilirubin
                      ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                  }`}
                />
                {errors.direct_bilirubin && (
                  <p className="text-rose-500 text-xs mt-1 font-medium">{errors.direct_bilirubin}</p>
                )}
              </div>

              {/* Albumin */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Albumin (g/dL) <span className="text-rose-500">*</span>
                  </label>
                  {getFieldStatus('albumin', formData.albumin) ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      getFieldStatus('albumin', formData.albumin).color === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {getFieldStatus('albumin', formData.albumin).text}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Normal: 3.5–5.0</span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.1"
                  name="albumin"
                  value={formData.albumin}
                  onChange={handleChange}
                  placeholder="e.g. 3.5"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 ${
                    errors.albumin
                      ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                  }`}
                />
                {errors.albumin && (
                  <p className="text-rose-500 text-xs mt-1 font-medium">{errors.albumin}</p>
                )}
              </div>

              {/* Alkaline Phosphatase */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Alkaline Phosphatase (U/L) <span className="text-rose-500">*</span>
                  </label>
                  {getFieldStatus('alkaline_phosphatase', formData.alkaline_phosphatase) ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      getFieldStatus('alkaline_phosphatase', formData.alkaline_phosphatase).color === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {getFieldStatus('alkaline_phosphatase', formData.alkaline_phosphatase).text}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Normal: 44–147</span>
                  )}
                </div>
                <input
                  type="number"
                  step="1"
                  name="alkaline_phosphatase"
                  value={formData.alkaline_phosphatase}
                  onChange={handleChange}
                  placeholder="e.g. 80"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 ${
                    errors.alkaline_phosphatase
                      ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                  }`}
                />
                {errors.alkaline_phosphatase && (
                  <p className="text-rose-500 text-xs mt-1 font-medium">{errors.alkaline_phosphatase}</p>
                )}
              </div>

              {/* SGOT */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    SGOT (U/L) <span className="text-rose-500">*</span>
                  </label>
                  {getFieldStatus('sgot', formData.sgot) ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      getFieldStatus('sgot', formData.sgot).color === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {getFieldStatus('sgot', formData.sgot).text}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Normal: 8–48</span>
                  )}
                </div>
                <input
                  type="number"
                  step="1"
                  name="sgot"
                  value={formData.sgot}
                  onChange={handleChange}
                  placeholder="e.g. 45"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 ${
                    errors.sgot
                      ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                  }`}
                />
                {errors.sgot && (
                  <p className="text-rose-500 text-xs mt-1 font-medium">{errors.sgot}</p>
                )}
              </div>

              {/* Cholesterol */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Cholesterol (mg/dL) <span className="text-rose-500">*</span>
                  </label>
                  {getFieldStatus('cholesterol', formData.cholesterol) ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      getFieldStatus('cholesterol', formData.cholesterol).color === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {getFieldStatus('cholesterol', formData.cholesterol).text}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Normal: &lt; 200</span>
                  )}
                </div>
                <input
                  type="number"
                  step="1"
                  name="cholesterol"
                  value={formData.cholesterol}
                  onChange={handleChange}
                  placeholder="e.g. 180"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 ${
                    errors.cholesterol
                      ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                  }`}
                />
                {errors.cholesterol && (
                  <p className="text-rose-500 text-xs mt-1 font-medium">{errors.cholesterol}</p>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>Reset</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-md shadow-teal-800/20 active:scale-95 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Biomarkers...</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Real 3D Translucent Human Body Outline Display */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-between min-h-[500px]">
          <RealHumanBodyDisplay className="w-64 h-[400px]" />

          <div className="mt-4 p-3.5 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-100 text-center w-full">
            <p className="text-xs text-teal-800 font-bold">
              Early Detection Saves Lives
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Accurate screening through multi-parameter hepatic enzyme profiling & ML scoring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
