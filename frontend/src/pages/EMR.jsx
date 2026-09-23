import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  Plus,
  Trash2,
  Stethoscope,
  HeartPulse,
  Pill,
  Save,
  CheckCircle2,
  History,
  FileCheck
} from 'lucide-react';

export default function EMR() {
  const { user, role, isDoctor } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientHistory, setPatientHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Clinical Form Data
  const [formData, setFormData] = useState({
    symptoms: '',
    diagnosis: '',
    treatment_plan: '',
    blood_pressure: '120/80',
    pulse_rate: '72',
    temperature: '98.6',
    weight: '70',
    notes: ''
  });

  // Dynamic Prescription Items
  const [prescriptionItems, setPrescriptionItems] = useState([
    { medicine_name: 'Paracetamol 500mg', dosage: '500mg', frequency: 'TDS (8hr)', duration: '3 days', quantity: 10, instructions: 'After meals' }
  ]);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientHistory(selectedPatientId);
    } else {
      setPatientHistory([]);
    }
  }, [selectedPatientId]);

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
      if (data.length > 0) {
        setSelectedPatientId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPatientHistory = async (id) => {
    setLoading(true);
    try {
      const records = await api.getPatientEMR(id);
      setPatientHistory(records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addPrescriptionRow = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      { medicine_name: '', dosage: '500mg', frequency: 'BD (12hr)', duration: '5 days', quantity: 10, instructions: 'After meals' }
    ]);
  };

  const removePrescriptionRow = (index) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const updatePrescriptionRow = (index, field, value) => {
    const updated = [...prescriptionItems];
    updated[index][field] = value;
    setPrescriptionItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a patient first');
      return;
    }

    try {
      await api.createEMRRecord({
        patient_id: selectedPatientId,
        ...formData,
        prescription_items: prescriptionItems.filter(p => p.medicine_name.trim() !== '')
      });

      setSuccessMsg('Medical record and prescriptions successfully recorded!');
      setTimeout(() => setSuccessMsg(''), 4000);

      // Reset form
      setFormData({
        symptoms: '',
        diagnosis: '',
        treatment_plan: '',
        blood_pressure: '120/80',
        pulse_rate: '72',
        temperature: '98.6',
        weight: '70',
        notes: ''
      });
      loadPatientHistory(selectedPatientId);
    } catch (err) {
      alert(err.message || 'Failed to save clinical record');
    }
  };

  const selectedPatientObj = patients.find(p => p.id === parseInt(selectedPatientId));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-teal-600" />
            Electronic Medical Records (EMR) & Clinical Consultation
          </h2>
          <p className="text-xs text-slate-500">Record patient vitals, clinical diagnosis, treatment plans, and e-prescriptions</p>
        </div>

        {/* Patient Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Patient:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="text-xs font-semibold text-slate-900 outline-none bg-transparent"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.patient_code} - {p.full_name} ({p.gender}, {p.blood_group})
              </option>
            ))}
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Form on Left, History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Clinical Entry Form */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                New Consultation & Prescription
              </h3>
              <p className="text-[11px] text-slate-400">
                Patient: <span className="font-semibold text-slate-700">{selectedPatientObj?.full_name}</span> | Allergies: <span className="text-rose-600 font-semibold">{selectedPatientObj?.allergies || 'None'}</span>
              </p>
            </div>
            <span className="text-[11px] font-mono bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-semibold">
              Dr. in charge: {user?.full_name}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vitals Grid */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Patient Vitals
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600">BP (mmHg)</label>
                  <input
                    type="text"
                    value={formData.blood_pressure}
                    onChange={(e) => setFormData({ ...formData, blood_pressure: e.target.value })}
                    placeholder="120/80"
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs outline-none bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600">Pulse (bpm)</label>
                  <input
                    type="text"
                    value={formData.pulse_rate}
                    onChange={(e) => setFormData({ ...formData, pulse_rate: e.target.value })}
                    placeholder="72"
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs outline-none bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600">Temp (°F)</label>
                  <input
                    type="text"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    placeholder="98.6"
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs outline-none bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600">Weight (kg)</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="70"
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs outline-none bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Symptoms & Diagnosis */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Symptoms / Chief Complaints</label>
              <textarea
                rows="2"
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                placeholder="e.g. Continuous fever for 3 days, dry cough, body aches"
                className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Diagnosis *</label>
              <input
                type="text"
                required
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="e.g. Acute Viral Bronchitis, Essential Hypertension"
                className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Treatment Plan & Advice</label>
              <textarea
                rows="2"
                value={formData.treatment_plan}
                onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                placeholder="e.g. Rest for 3 days, drink warm fluids, review in 1 week if fever persists"
                className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
              ></textarea>
            </div>

            {/* Prescriptions Table */}
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-teal-600" /> Prescribed Medications
                </span>
                <button
                  type="button"
                  onClick={addPrescriptionRow}
                  className="flex items-center gap-1 text-xs text-teal-600 font-semibold hover:text-teal-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Drug
                </button>
              </div>

              <div className="space-y-2">
                {prescriptionItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg text-xs">
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Drug name (e.g. Amoxicillin)"
                        value={item.medicine_name}
                        onChange={(e) => updatePrescriptionRow(idx, 'medicine_name', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Dosage"
                        value={item.dosage}
                        onChange={(e) => updatePrescriptionRow(idx, 'dosage', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs outline-none"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Frequency"
                        value={item.frequency}
                        onChange={(e) => updatePrescriptionRow(idx, 'frequency', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Days / Qty"
                        value={item.duration}
                        onChange={(e) => updatePrescriptionRow(idx, 'duration', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs outline-none"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      {prescriptionItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePrescriptionRow(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition"
            >
              <Save className="w-4 h-4" /> Save Clinical Record & Issue Prescription
            </button>
          </form>
        </div>

        {/* Right Side: Medical History Timeline */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              Patient Medical History
            </h3>
            <span className="text-[11px] text-slate-400">Total: {patientHistory.length} records</span>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-xs text-slate-400 py-6 text-center">Loading patient history...</p>
            ) : patientHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No past records found for this patient.</p>
            ) : (
              patientHistory.map((rec) => (
                <div key={rec.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-900 text-xs">{rec.diagnosis}</span>
                    <span className="text-[10px] text-slate-400">{rec.created_at}</span>
                  </div>

                  <p className="text-slate-600">
                    <strong className="text-slate-700">Symptoms:</strong> {rec.symptoms || 'None'}
                  </p>

                  <p className="text-slate-600">
                    <strong className="text-slate-700">Treatment:</strong> {rec.treatment_plan || 'None'}
                  </p>

                  {rec.blood_pressure && (
                    <div className="flex flex-wrap gap-1.5 text-[10px] py-1">
                      <span className="bg-white border px-1.5 py-0.5 rounded font-mono">BP: {rec.blood_pressure}</span>
                      <span className="bg-white border px-1.5 py-0.5 rounded font-mono">Pulse: {rec.pulse_rate}</span>
                      <span className="bg-white border px-1.5 py-0.5 rounded font-mono">Temp: {rec.temperature}</span>
                    </div>
                  )}

                  {rec.prescriptions && rec.prescriptions.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/80">
                      <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                        <Pill className="w-3 h-3 text-teal-600" /> Prescriptions:
                      </span>
                      <ul className="space-y-1 pl-2">
                        {rec.prescriptions.flatMap(p => p.items || []).map((it, i) => (
                          <li key={i} className="text-[11px] text-slate-600 flex items-center justify-between">
                            <span>• {it.medicine_name} ({it.dosage}) - {it.frequency}</span>
                            <span className="text-slate-400">{it.duration}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-1 text-[10px] text-slate-400">
                    Attending: {rec.doctor_name} ({rec.specialization})
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
