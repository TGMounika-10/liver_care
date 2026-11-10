import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
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

export default apiClient;

