import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Lightbulb, Loader2, Search,
  Calendar, TrendingUp, TrendingDown, Filter,
  ChevronLeft, ChevronRight, Activity,
  Users, ArrowUpDown, RefreshCcw, Heart, Trash2, FileSpreadsheet, Eye, X
} from 'lucide-react';
import { fetchHistory, downloadReportPdf, deleteHistoryRecord, exportHistoryCsv, SAMPLE_HISTORY } from '../services/api';

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState('all'); // 'all', 'low', 'high'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (newest first), 'asc'
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory();
      setRecords(Array.isArray(data) ? data : SAMPLE_HISTORY);
    } catch { setRecords(SAMPLE_HISTORY); }
    finally { setLoading(false); }
  };

  const handleDownload = async (record) => {
    setDownloadingId(record.id);
    try { await downloadReportPdf(record.id, record); }
    catch (err) { console.error(err); }
    finally { setDownloadingId(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete prediction record #${id}?`)) return;
    try {
      await deleteHistoryRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Computed filtered & sorted list
  const processedRecords = records
    .filter(r => {
      if (filterResult === 'low' && r.result !== 'Low Risk') return false;
      if (filterResult === 'high' && r.result !== 'High Risk') return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.result?.toLowerCase().includes(q) ||
        String(r.age).includes(q) ||
        r.gender?.toLowerCase().includes(q) ||
        r.formatted_date?.toLowerCase().includes(q) ||
        r.created_at?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const da = new Date(a.created_at || 0);
      const db = new Date(b.created_at || 0);
      return sortOrder === 'desc' ? db - da : da - db;
    });

  const totalPages = Math.max(1, Math.ceil(processedRecords.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageRecords = processedRecords.slice((safePage - 1) * perPage, safePage * perPage);

  // Stats
  const totalHigh = records.filter(r => r.result === 'High Risk').length;
  const totalLow = records.filter(r => r.result === 'Low Risk').length;
  const avgProb = records.length > 0
    ? (records.reduce((sum, r) => sum + (r.probability || 0), 0) / records.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200/50 flex items-center justify-center text-teal-700 shadow-sm">
            <FileText className="w-6 h-6"/>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Reports & History</h1>
            <p className="text-sm text-slate-500">
              View past prediction records, filter by risk level, and download clinical PDF reports.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={loadData} className="btn-secondary text-xs">
            <RefreshCcw className="w-3.5 h-3.5 text-slate-400"/>
            <span>Refresh</span>
          </button>
          <button onClick={exportHistoryCsv} className="btn-secondary text-xs">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600"/>
            <span>Export CSV</span>
          </button>
          <button onClick={() => records.length > 0 && handleDownload(records[0])}
                  disabled={records.length === 0}
                  className="btn-primary text-xs disabled:opacity-50 disabled:cursor-not-allowed">
            <Download className="w-3.5 h-3.5"/>
            <span>Latest PDF Report</span>
          </button>
        </div>
      </div>

      {/* ─── Summary Statistics ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-sky-600"/>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{records.length}</p>
          <p className="text-[10px] text-slate-400 font-medium">Predictions</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600"/>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Risk</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{totalLow}</p>
          <p className="text-[10px] text-slate-400 font-medium">Patients</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-rose-600"/>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High Risk</span>
          </div>
          <p className="text-2xl font-extrabold text-rose-600">{totalHigh}</p>
          <p className="text-[10px] text-slate-400 font-medium">Patients</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-amber-600"/>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Risk</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{avgProb}%</p>
          <p className="text-[10px] text-slate-400 font-medium">Mean Probability</p>
        </div>
      </div>

      {/* ─── Records Table ─── */}
      <div className="glass-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400"/>
            <div className="flex rounded-xl overflow-hidden border border-slate-200 text-[11px] font-semibold">
              {['all', 'low', 'high'].map(f => (
                <button key={f}
                  onClick={() => { setFilterResult(f); setCurrentPage(1); }}
                  className={`px-3.5 py-1.5 transition-colors ${
                    filterResult === f
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'low' ? 'Low Risk' : 'High Risk'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
              className="ml-2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1 transition-colors"
              title="Toggle sort order"
            >
              <ArrowUpDown className="w-3 h-3 text-slate-400"/>
              {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"/>
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by result, age, gender..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto scrollbar-thin">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600"/>
              <p className="text-xs font-medium">Loading clinical records...</p>
            </div>
          ) : pageRecords.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2"/>
              <p className="text-sm font-semibold">No records found</p>
              <p className="text-xs mt-1">Try adjusting filters or run a new prediction.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 w-10">#</th>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-5 py-3.5">Age</th>
                  <th className="px-5 py-3.5">Gender</th>
                  <th className="px-5 py-3.5">Result</th>
                  <th className="px-5 py-3.5">Risk Probability</th>
                  <th className="px-5 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pageRecords.map((item, idx) => {
                  const isHigh = item.result === 'High Risk' || item.probability >= 50;
                  const probStr = typeof item.probability === 'number' ? `${item.probability.toFixed(1)}%` : item.probability;
                  const dateStr = item.formatted_date || item.created_at || '—';
                  const rowNum = (safePage - 1) * perPage + idx + 1;

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-400 text-xs">{rowNum}</td>
                      <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"/>
                          <span>{dateStr}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700 text-sm">{item.age}</td>
                      <td className="px-5 py-4 text-xs text-slate-600">{item.gender || '—'}</td>
                      <td className="px-5 py-4">
                        {isHigh ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            <TrendingUp className="w-3 h-3"/>High Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <TrendingDown className="w-3 h-3"/>Low Risk
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${isHigh ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                 style={{ width: `${Math.min(100, item.probability || 0)}%` }}/>
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-10">{probStr}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedRecord(item)}
                            title="View Patient Biomarkers"
                            className="w-8 h-8 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 inline-flex items-center justify-center transition-colors"
                          >
                            <Eye className="w-4 h-4"/>
                          </button>
                          <button
                            onClick={() => handleDownload(item)}
                            disabled={downloadingId === item.id}
                            title="Download PDF Report"
                            className="w-8 h-8 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 inline-flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            {downloadingId === item.id
                              ? <Loader2 className="w-4 h-4 animate-spin"/>
                              : <Download className="w-4 h-4"/>
                            }
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Delete Record"
                            className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 inline-flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-medium">
              Showing {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, processedRecords.length)} of {processedRecords.length}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600"/>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    safePage === p
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600"/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Health Tips Banner ─── */}
      <div className="glass-card p-5 flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/50 flex items-center justify-center text-amber-600 flex-shrink-0 shadow-sm">
          <Lightbulb className="w-6 h-6"/>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            Tips for a Healthy Liver
            <Heart className="w-3.5 h-3.5 text-rose-400"/>
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Eat fresh, whole foods rich in antioxidants. Avoid excessive alcohol and processed foods.
            Maintain a healthy weight through regular exercise. Stay hydrated and get adequate sleep.
            Schedule annual Liver Function Tests (LFT) for early detection of any abnormalities.
          </p>
        </div>
      </div>

      {/* ─── Patient Biomarkers Detail Modal ─── */}
      {selectedRecord && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-fade-in space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Patient Record #{selectedRecord.id}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedRecord.formatted_date || selectedRecord.created_at}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className={`p-4 rounded-2xl flex items-center justify-between border ${
              selectedRecord.result === 'High Risk' || selectedRecord.probability >= 50
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <div>
                <p className="text-[11px] font-bold uppercase opacity-75">ML Assessment</p>
                <p className="text-xl font-black">{selectedRecord.result}</p>
                <p className="text-[11px] font-semibold mt-0.5 opacity-85">
                  {selectedRecord.probability < 30
                    ? 'Stage 0: Normal / Minimal Risk'
                    : selectedRecord.probability < 50
                    ? 'Stage 1: Mild Hepatic Stress'
                    : selectedRecord.probability < 75
                    ? 'Stage 2: Moderate Fibrosis Risk'
                    : 'Stage 3-4: Advanced Cirrhosis'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold uppercase opacity-75">Risk Score</p>
                <p className="text-xl font-black">{Number(selectedRecord.probability).toFixed(1)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Age', value: `${selectedRecord.age} yrs`, norm: '18 – 85 yrs', abnormal: false },
                { label: 'Gender', value: selectedRecord.gender, norm: 'Biological sex', abnormal: false },
                { label: 'Total Bilirubin', value: `${selectedRecord.total_bilirubin} mg/dL`, norm: '0.1 – 1.2', abnormal: selectedRecord.total_bilirubin > 1.2 },
                { label: 'Direct Bilirubin', value: `${selectedRecord.direct_bilirubin} mg/dL`, norm: '0.0 – 0.3', abnormal: selectedRecord.direct_bilirubin > 0.3 },
                { label: 'Serum Albumin', value: `${selectedRecord.albumin} g/dL`, norm: '3.5 – 5.0', abnormal: selectedRecord.albumin < 3.5 },
                { label: 'Alk. Phosphatase', value: `${selectedRecord.alkaline_phosphatase} U/L`, norm: '44 – 147', abnormal: selectedRecord.alkaline_phosphatase > 147 },
                { label: 'SGOT (AST)', value: `${selectedRecord.sgot} U/L`, norm: '8 – 48', abnormal: selectedRecord.sgot > 48 },
                { label: 'Cholesterol', value: `${selectedRecord.cholesterol} mg/dL`, norm: '120 – 200', abnormal: selectedRecord.cholesterol > 200 },
              ].map((m, i) => (
                <div key={i} className={`p-3 rounded-xl border ${m.abnormal ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{m.label}</span>
                  <p className={`text-sm font-bold mt-0.5 ${m.abnormal ? 'text-rose-700' : 'text-slate-800'}`}>{m.value}</p>
                  <p className="text-[10px] text-slate-400">Ref: {m.norm}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedRecord(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(selectedRecord)}
                className="btn-primary text-xs"
              >
                <Download className="w-3.5 h-3.5"/>
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
