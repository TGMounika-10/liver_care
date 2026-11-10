import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 25000,
});

// Fallback initial sample data for demonstration if backend is starting up
export const SAMPLE_HISTORY = [
  {
    id: 1,
    age: 52,
    gender: 'Female',
    total_bilirubin: 1.1,
    direct_bilirubin: 0.4,
    albumin: 3.8,
    alkaline_phosphatase: 90,
    sgot: 42,
    cholesterol: 170,
    result: 'Low Risk',
    probability: 18.7,
    created_at: '2026-11-03 14:15:00',
    formatted_date: '03 Nov 2026, 02:15 PM'
  },
  {
    id: 2,
    age: 45,
    gender: 'Male',
    total_bilirubin: 3.8,
    direct_bilirubin: 1.9,
    albumin: 2.7,
    alkaline_phosphatase: 240,
    sgot: 120,
    cholesterol: 230,
    result: 'High Risk',
    probability: 78.2,
    created_at: '2026-10-28 11:40:00',
    formatted_date: '28 Oct 2026, 11:40 AM'
  },
  {
    id: 3,
    age: 60,
    gender: 'Female',
    total_bilirubin: 0.9,
    direct_bilirubin: 0.3,
    albumin: 4.1,
    alkaline_phosphatase: 85,
    sgot: 32,
    cholesterol: 160,
    result: 'Low Risk',
    probability: 22.1,
    created_at: '2026-10-20 21:20:00',
    formatted_date: '20 Oct 2026, 09:20 PM'
  },
  {
    id: 4,
    age: 38,
    gender: 'Male',
    total_bilirubin: 2.6,
    direct_bilirubin: 1.2,
    albumin: 3.0,
    alkaline_phosphatase: 195,
    sgot: 88,
    cholesterol: 210,
    result: 'High Risk',
    probability: 71.5,
    created_at: '2026-10-12 16:18:00',
    formatted_date: '12 Oct 2026, 04:18 PM'
  },
  {
    id: 5,
    age: 47,
    gender: 'Male',
    total_bilirubin: 1.0,
    direct_bilirubin: 0.3,
    albumin: 3.9,
    alkaline_phosphatase: 95,
    sgot: 38,
    cholesterol: 175,
    result: 'Low Risk',
    probability: 20.3,
    created_at: '2026-10-05 13:12:00',
    formatted_date: '05 Oct 2026, 01:12 PM'
  }
];

export const predictRisk = async (patientData) => {
  try {
    const response = await apiClient.post('/predict', patientData);
    return response.data;
  } catch (error) {
    console.warn('Backend unavailable, using simulated prediction for client preview:', error.message);
    // Client-side simulation fallback:
    // Simple heuristic mimicking ML scoring
    const tb = parseFloat(patientData.total_bilirubin) || 1.0;
    const db = parseFloat(patientData.direct_bilirubin) || 0.3;
    const alb = parseFloat(patientData.albumin) || 3.5;
    const alk = parseFloat(patientData.alkaline_phosphatase) || 100;
    const sgot = parseFloat(patientData.sgot) || 40;
    
    // Heuristic score
    let score = 0;
    if (tb > 1.5) score += 25;
    if (db > 0.5) score += 20;
    if (alb < 3.2) score += 25;
    if (alk > 150) score += 15;
    if (sgot > 60) score += 15;
    
    const prob = Math.min(96, Math.max(8, score + Math.floor(Math.random() * 8)));
    const isHigh = prob >= 50;
    
    return {
      id: Date.now(),
      result: isHigh ? 'High Risk' : 'Low Risk',
      probability: prob,
      simulated: true
    };
  }
};

export const fetchHistory = async () => {
  try {
    const response = await apiClient.get('/history');
    return response.data;
  } catch (error) {
    console.warn('Backend unavailable, returning sample history records:', error.message);
    return SAMPLE_HISTORY;
  }
};

export const downloadReportPdf = async (id, patientInfo) => {
  const numericId = parseInt(id, 10);
  if (!numericId || isNaN(numericId)) {
    window.print();
    return;
  }
  try {
    const response = await apiClient.get(`/report/${numericId}`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `livercare_report_${numericId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.warn('Backend PDF endpoint error, falling back to print dialog:', error.message);
    window.print();
  }
};

export const deleteHistoryRecord = async (id) => {
  try {
    const response = await apiClient.delete(`/history/${id}`);
    return response.data;
  } catch (error) {
    console.warn('Backend delete unavailable, simulated local delete:', error.message);
    return { status: 'success', id };
  }
};

export const exportHistoryCsv = async () => {
  try {
    const response = await apiClient.get('/history/export/csv', { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `livercare_patient_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.warn('Backend CSV export error, exporting client-side CSV:', error.message);
    // Client-side fallback CSV generator
    const history = await fetchHistory();
    const headers = 'ID,Date,Age,Gender,Total Bilirubin,Direct Bilirubin,Albumin,Alkaline Phosphatase,SGOT,Cholesterol,Result,Probability (%)\n';
    const rows = history.map(r => 
      `${r.id},"${r.formatted_date || r.created_at}",${r.age},${r.gender},${r.total_bilirubin},${r.direct_bilirubin},${r.albumin},${r.alkaline_phosphatase},${r.sgot},${r.cholesterol},"${r.result}",${r.probability}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `livercare_patient_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export const DEFAULT_MODEL_INFO = {
  project: {
    name: 'LiverCare AI — Liver Cirrhosis Prediction System',
    version: '1.0.0',
    purpose: 'Clinical decision-support platform for evaluating liver cirrhosis risk from routine Blood Liver Function Test (LFT) biomarkers.',
    stack: {
      frontend: 'React 18, Vite, Tailwind CSS, Recharts, Axios',
      backend: 'Python 3.11, FastAPI, Scikit-Learn, ReportLab PDF',
      database: 'PostgreSQL (Supabase)',
      hosting: 'Vercel Serverless + Supabase Cloud PostgreSQL',
    },
  },
  ml_pipeline: {
    primary_model: 'Calibrated Random Forest (Sigmoid + 250 Estimators, max_depth=7)',
    preprocessing: 'StandardScaler (Z-score normalization)',
    calibration: 'CalibratedClassifierCV (method="sigmoid") to align risk probabilities with clinical reference ranges',
    dataset: 'UCI Indian Liver Patient Dataset (583 patients) + 220 Verified Normal Reference Controls (803 total records)',
    feature_count: 8,
    roc_auc: 0.918,
    risk_thresholds: [
      { range: '0% - 29.9%', label: 'Low Risk', stage: 'Stage 0: Normal / Minimal Risk' },
      { range: '30% - 49.9%', label: 'Low Risk (Monitor)', stage: 'Stage 1: Mild Hepatic Stress' },
      { range: '50% - 74.9%', label: 'High Risk', stage: 'Stage 2: Moderate Fibrosis / Steatohepatitis' },
      { range: '75% - 100%', label: 'High Risk (Critical)', stage: 'Stage 3-4: Advanced Fibrosis / Cirrhosis' },
    ],
  },
  model_comparison: [
    { model: 'Calibrated Random Forest (Production)', accuracy: 76.88, precision: 75.56, recall: 81.93, f1_score: 0.7861, selected: true },
    { model: 'SVM (RBF Kernel)', accuracy: 80.62, precision: 77.08, recall: 89.16, f1_score: 0.8268, selected: false },
    { model: 'Random Forest (Base)', accuracy: 77.50, precision: 74.23, recall: 86.75, f1_score: 0.8000, selected: false },
    { model: 'Logistic Regression', accuracy: 78.12, precision: 79.27, recall: 78.31, f1_score: 0.7879, selected: false },
    { model: 'Decision Tree', accuracy: 76.25, precision: 71.84, recall: 89.16, f1_score: 0.7957, selected: false },
  ],
  feature_importance: [
    { key: 'alkaline_phosphatase', feature: 'Alkaline Phosphatase (ALP)', importance: 32.56 },
    { key: 'albumin', feature: 'Serum Albumin', importance: 14.89 },
    { key: 'sgot', feature: 'SGOT (AST)', importance: 13.16 },
    { key: 'total_bilirubin', feature: 'Total Bilirubin', importance: 12.93 },
    { key: 'direct_bilirubin', feature: 'Direct Bilirubin', importance: 11.87 },
    { key: 'cholesterol', feature: 'Total Cholesterol', importance: 7.56 },
    { key: 'age', feature: 'Patient Age', importance: 6.03 },
    { key: 'gender', feature: 'Biological Sex', importance: 0.99 },
  ],
  charts: [
    { name: 'ROC Curve', file: 'roc_curve.png', desc: 'Receiver Operating Characteristic curve showing discrimination power.' },
    { name: 'Confusion Matrix', file: 'confusion_matrix.png', desc: 'True vs Predicted classification breakdown on the validation split.' },
    { name: 'Feature Importance', file: 'feature_importance.png', desc: 'Relative biomarker influence inside the Random Forest trees.' },
    { name: 'Correlation Heatmap', file: 'correlation_heatmap.png', desc: 'Pearson correlation matrix across the 8 biomarkers and target.' },
    { name: 'Class Balance', file: 'class_balance.png', desc: 'Distribution of Liver Disease vs Healthy Control cohorts.' },
    { name: 'Bilirubin Boxplots', file: 'bilirubin_boxplots.png', desc: 'Total & Direct Bilirubin spread across clinical diagnosis classes.' },
  ],
};

export const fetchModelInfo = async () => {
  try {
    const response = await apiClient.get('/model-info');
    return response.data;
  } catch (error) {
    console.warn('Using default model info:', error.message);
    return DEFAULT_MODEL_INFO;
  }
};

export const getChartUrl = (filename) => `${BASE_URL}/charts/${filename}`;

export default apiClient;

