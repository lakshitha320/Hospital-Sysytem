import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  FlaskConical,
  Plus,
  CheckCircle,
  Clock,
  FileText,
  Printer,
  X,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Laboratory() {
  const { role, isLabStaff, isAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [tests, setTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'catalog'

  // Modal State
  const [showReqModal, setShowReqModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeReport, setActiveReport] = useState(null);

  // New Request Form
  const [reqForm, setReqForm] = useState({
    patient_id: '',
    test_id: ''
  });

  // Result Form
  const [resultForm, setResultForm] = useState({
    test_result: '',
    reference_range: '',
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqData, testData, patData] = await Promise.all([
        api.getLabRequests(),
        api.getLabTests(),
        api.getPatients()
      ]);
      setRequests(reqData);
      setTests(testData);
      setPatients(patData);
    } catch (err) {
      console.error('Failed to load lab data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await api.createLabRequest(reqForm);
      setShowReqModal(false);
      setReqForm({ patient_id: '', test_id: '' });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create request');
    }
  };

  const handleCollectSample = async (id) => {
    try {
      await api.collectLabSample(id);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to collect sample');
    }
  };

  const openResultModal = (req) => {
    setSelectedRequest(req);
    setResultForm({
      test_result: req.test_result || '',
      reference_range: req.reference_range || req.default_normal_range || '',
      remarks: req.remarks || ''
    });
    setShowResultModal(true);
  };

  const handleSaveResult = async (e) => {
    e.preventDefault();
    try {
      await api.recordLabResult(selectedRequest.id, resultForm);
      setShowResultModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to record test result');
    }
  };

  const openReportModal = (req) => {
    setActiveReport(req);
    setShowReportModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-teal-600" />
            Laboratory Management System
          </h2>
          <p className="text-xs text-slate-500">Test orders, sample tracking, diagnostics result entry, and certified reports</p>
        </div>

        <div className="flex items-center gap-2">
          {['admin', 'doctor', 'nurse', 'receptionist'].includes(role) && (
            <button
              onClick={() => setShowReqModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Lab Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold space-x-6">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-2.5 transition relative ${
            activeTab === 'requests'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Investigation Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-2.5 transition relative ${
            activeTab === 'catalog'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Test Catalog ({tests.length})
        </button>
      </div>

      {/* Requests View */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Request No</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Test Details</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Sample Status</th>
                  <th className="py-3 px-4">Ordered By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">Loading requests...</td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">No lab requests found.</td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-teal-700">{r.request_number}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{r.patient_name}</p>
                        <span className="text-[11px] text-slate-400 font-mono">{r.patient_code}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800">{r.test_name}</p>
                        <span className="text-[11px] text-slate-400">{r.category} • Cost: LKR {r.cost}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'Sample Collected'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {r.sample_collected_at ? (
                          <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Collected
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Awaiting Sample
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {r.doctor_name || 'Hospital OPD'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === 'Pending' && ['admin', 'lab_staff', 'nurse'].includes(role) && (
                            <button
                              onClick={() => handleCollectSample(r.id)}
                              className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold"
                            >
                              Collect Sample
                            </button>
                          )}

                          {['Pending', 'Sample Collected'].includes(r.status) && ['admin', 'lab_staff'].includes(role) && (
                            <button
                              onClick={() => openResultModal(r)}
                              className="px-2 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded text-[11px] font-semibold"
                            >
                              Enter Results
                            </button>
                          )}

                          {r.status === 'Completed' && (
                            <button
                              onClick={() => openReportModal(r)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                            >
                              <FileText className="w-3 h-3 text-teal-600" />
                              View Report
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Catalog View */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Test Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Sample Type</th>
                  <th className="py-3 px-4">Reference / Normal Range</th>
                  <th className="py-3 px-4 text-right">Standard Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tests.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-medium text-teal-700">{t.test_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{t.test_name}</td>
                    <td className="py-3 px-4 text-slate-600">{t.category}</td>
                    <td className="py-3 px-4 text-slate-600">{t.sample_type}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{t.normal_range || '-'}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">LKR {t.cost?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Lab Order Modal */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">New Laboratory Investigation Order</h3>
              <button onClick={() => setShowReqModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={reqForm.patient_id}
                  onChange={(e) => setReqForm({ ...reqForm, patient_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.patient_code} - {p.full_name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Test *</label>
                <select
                  required
                  value={reqForm.test_id}
                  onChange={(e) => setReqForm({ ...reqForm, test_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Choose Test --</option>
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.test_name} ({t.category}) - LKR {t.cost}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowReqModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enter Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Enter Test Results & Remarks</h3>
                <p className="text-xs text-slate-500">
                  {selectedRequest?.test_name} for <strong>{selectedRequest?.patient_name}</strong>
                </p>
              </div>
              <button onClick={() => setShowResultModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResult} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Findings / Diagnostic Result *</label>
                <textarea
                  rows="4"
                  required
                  value={resultForm.test_result}
                  onChange={(e) => setResultForm({ ...resultForm, test_result: e.target.value })}
                  placeholder="e.g. Hemoglobin: 13.8 g/dL&#10;Total WBC: 6,800 /uL&#10;Platelets: 280,000 /uL"
                  className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Normal Range</label>
                <input
                  type="text"
                  value={resultForm.reference_range}
                  onChange={(e) => setResultForm({ ...resultForm, reference_range: e.target.value })}
                  placeholder="Normal values"
                  className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Technologist Remarks / Impressions</label>
                <input
                  type="text"
                  value={resultForm.remarks}
                  onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })}
                  placeholder="e.g. Parameters within normal clinical limits."
                  className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                >
                  Save & Certify Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Certified Lab Report Modal */}
      {showReportModal && activeReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-4 border-b flex items-center justify-between no-print">
              <span className="text-xs font-bold text-slate-600">Official Diagnostic Report Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Report
                </button>
                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Document */}
            <div id="printable-area" className="p-8 text-slate-900 space-y-6">
              {/* Header Letterhead */}
              <div className="border-b-2 border-teal-700 pb-4 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white p-1 border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                    <img src="/logo.jpg" alt="Hospital Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-teal-900 tracking-tight">METRO HEALTHCARE</h1>
                    <p className="text-xs text-slate-600 font-medium">Department of Pathology & Clinical Laboratory Services</p>
                    <p className="text-[11px] text-slate-400">123 Healthway Avenue, Colombo 07 | Hotline: +94 11 234 5678</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-teal-50 text-teal-800 text-xs font-bold rounded border border-teal-200">
                    LABORATORY REPORT
                  </span>
                  <p className="text-xs font-mono text-slate-500 mt-1">{activeReport.request_number}</p>
                </div>
              </div>

              {/* Patient & Test Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p><span className="text-slate-400 font-medium">Patient Name:</span> <strong>{activeReport.patient_name}</strong></p>
                  <p className="mt-1"><span className="text-slate-400 font-medium">Patient Code:</span> {activeReport.patient_code}</p>
                  <p className="mt-1"><span className="text-slate-400 font-medium">Gender / Age:</span> {activeReport.gender || 'Adult'}</p>
                </div>
                <div className="text-right">
                  <p><span className="text-slate-400 font-medium">Referring Doctor:</span> {activeReport.doctor_name || 'OPD Physician'}</p>
                  <p className="mt-1"><span className="text-slate-400 font-medium">Sample Collected:</span> {activeReport.sample_collected_at || 'Recorded'}</p>
                  <p className="mt-1"><span className="text-slate-400 font-medium">Report Date:</span> {activeReport.report_date || 'Certified'}</p>
                </div>
              </div>

              {/* Test Results Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 p-2.5 font-bold text-xs border-b text-slate-800">
                  Investigation: {activeReport.test_name} ({activeReport.category})
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Result Findings</h5>
                    <pre className="text-xs font-mono bg-white p-3 border rounded text-slate-900 whitespace-pre-wrap leading-relaxed">
                      {activeReport.test_result || 'No results recorded'}
                    </pre>
                  </div>

                  {activeReport.reference_range && (
                    <div className="text-xs text-slate-600">
                      <strong>Normal Reference Range:</strong> {activeReport.reference_range}
                    </div>
                  )}

                  {activeReport.remarks && (
                    <div className="text-xs text-slate-600 bg-amber-50 p-2.5 rounded border border-amber-200">
                      <strong>Technologist Remarks:</strong> {activeReport.remarks}
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-12 flex justify-between items-end text-xs">
                <div>
                  <div className="w-36 border-t border-slate-400 mb-1"></div>
                  <p className="font-semibold text-slate-800">{activeReport.tech_name || 'Nuwan Perera'}</p>
                  <p className="text-[10px] text-slate-500">Medical Laboratory Technologist</p>
                </div>
                <div className="text-right">
                  <div className="w-36 border-t border-slate-400 mb-1 ml-auto"></div>
                  <p className="font-semibold text-slate-800">Dr. Arthur Pendelton</p>
                  <p className="text-[10px] text-slate-500">Consultant Pathologist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
