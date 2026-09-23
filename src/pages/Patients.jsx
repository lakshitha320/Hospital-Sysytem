import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  UserPlus,
  Edit,
  Eye,
  FileText,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  X,
  Stethoscope,
  FlaskConical,
  Receipt
} from 'lucide-react';

export default function Patients({ onNavigateToAppt }) {
  const { role } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [viewHistoryPatient, setViewHistoryPatient] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    gender: 'Male',
    blood_group: 'O+',
    phone: '',
    email: '',
    address: '',
    emergency_contact: '',
    allergies: 'None'
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async (query = '') => {
    setLoading(true);
    try {
      const data = await api.getPatients(query);
      setPatients(data);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadPatients(search);
  };

  const openAddModal = () => {
    setSelectedPatient(null);
    setFormData({
      full_name: '',
      dob: '1995-01-01',
      gender: 'Male',
      blood_group: 'O+',
      phone: '',
      email: '',
      address: '',
      emergency_contact: '',
      allergies: 'None'
    });
    setShowAddModal(true);
  };

  const openEditModal = (p) => {
    setSelectedPatient(p);
    setFormData({
      full_name: p.full_name,
      dob: p.dob,
      gender: p.gender,
      blood_group: p.blood_group,
      phone: p.phone,
      email: p.email || '',
      address: p.address || '',
      emergency_contact: p.emergency_contact || '',
      allergies: p.allergies || 'None'
    });
    setShowAddModal(true);
  };

  const openHistoryDrawer = async (p) => {
    setHistoryLoading(true);
    setViewHistoryPatient(null);
    try {
      const full = await api.getPatientById(p.id);
      setViewHistoryPatient(full);
    } catch (err) {
      console.error('Failed to load patient history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedPatient) {
        await api.updatePatient(selectedPatient.id, formData);
      } else {
        await api.createPatient(formData);
      }
      setShowAddModal(false);
      loadPatients();
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Patient Management
          </h2>
          <p className="text-xs text-slate-500">Register new patients, view clinical records & medical history</p>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, name, phone..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs w-64 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </form>

          {['admin', 'receptionist', 'nurse'].includes(role) && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Patient</span>
            </button>
          )}
        </div>
      </div>

      {/* Patients Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Age / Gender</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Allergies</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">Loading patients...</td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">No patients found.</td>
                </tr>
              ) : (
                patients.map((p) => {
                  const birthYear = new Date(p.dob).getFullYear();
                  const age = isNaN(birthYear) ? '-' : (2026 - birthYear);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-teal-700">{p.patient_code}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{p.full_name}</span>
                        {p.emergency_contact && (
                          <span className="block text-[11px] text-slate-400">Emg: {p.emergency_contact}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {age} yrs • {p.gender}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded font-bold text-[11px] bg-rose-50 text-rose-700 border border-rose-100">
                          {p.blood_group}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {p.phone}</div>
                        {p.email && <div className="text-[11px] text-slate-400">{p.email}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${p.allergies !== 'None' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-500'}`}>
                          {p.allergies || 'None'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openHistoryDrawer(p)}
                            title="View Medical History & EMR"
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-md transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {['admin', 'receptionist', 'nurse'].includes(role) && (
                            <button
                              onClick={() => openEditModal(p)}
                              title="Edit Patient"
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {selectedPatient ? `Edit Patient (${selectedPatient.patient_code})` : 'Register New Patient'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Kamal Perera"
                  className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="077xxxxxxx"
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="patient@example.com"
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    placeholder="071xxxxxxx (Spouse/Relative)"
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Residential address"
                  className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Known Allergies</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="Penicillin, Sulfa drugs, None, etc."
                  className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                >
                  {selectedPatient ? 'Save Changes' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Full Medical History Drawer */}
      {viewHistoryPatient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto flex flex-col">
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-teal-400 font-mono font-semibold">{viewHistoryPatient.patient_code}</span>
                <h3 className="text-xl font-bold">{viewHistoryPatient.full_name}</h3>
                <p className="text-xs text-slate-300 mt-1">
                  {viewHistoryPatient.gender} • Blood Group: <strong className="text-rose-400">{viewHistoryPatient.blood_group}</strong> • Allergies: {viewHistoryPatient.allergies}
                </p>
              </div>
              <button
                onClick={() => setViewHistoryPatient(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6 flex-1">
              {/* Medical Records (EMR) */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  Clinical Diagnoses & Treatment History
                </h4>
                {viewHistoryPatient.medical_records?.length > 0 ? (
                  <div className="space-y-3">
                    {viewHistoryPatient.medical_records.map((mr) => (
                      <div key={mr.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">Diagnosis: {mr.diagnosis}</span>
                          <span className="text-slate-400">{mr.created_at}</span>
                        </div>
                        <p className="text-xs text-slate-600"><span className="font-medium text-slate-700">Symptoms:</span> {mr.symptoms || 'N/A'}</p>
                        <p className="text-xs text-slate-600"><span className="font-medium text-slate-700">Plan:</span> {mr.treatment_plan || 'N/A'}</p>
                        {mr.blood_pressure && (
                          <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                            <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-mono">BP: {mr.blood_pressure}</span>
                            <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-mono">Pulse: {mr.pulse_rate}</span>
                            <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-mono">Temp: {mr.temperature}</span>
                            <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-mono">Weight: {mr.weight}</span>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400 pt-1">Attending: {mr.doctor_name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No medical records entered yet.</p>
                )}
              </div>

              {/* Laboratory Reports */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <FlaskConical className="w-4 h-4 text-cyan-600" />
                  Laboratory Investigations
                </h4>
                {viewHistoryPatient.lab_requests?.length > 0 ? (
                  <div className="space-y-2">
                    {viewHistoryPatient.lab_requests.map((lr) => (
                      <div key={lr.id} className="p-3 border rounded-lg bg-white flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-800">{lr.test_name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{lr.request_number} • {lr.category}</span>
                          {lr.test_result && (
                            <p className="text-xs text-teal-800 font-medium mt-1 bg-teal-50 p-1.5 rounded whitespace-pre-line">
                              {lr.test_result}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          lr.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {lr.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No lab tests requested for this patient.</p>
                )}
              </div>

              {/* Billing History */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <Receipt className="w-4 h-4 text-purple-600" />
                  Billing History & Invoices
                </h4>
                {viewHistoryPatient.invoices?.length > 0 ? (
                  <div className="space-y-2">
                    {viewHistoryPatient.invoices.map((inv) => (
                      <div key={inv.id} className="p-3 border rounded-lg bg-white flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono text-slate-400">{inv.invoice_number}</span>
                          <p className="font-semibold text-slate-800">LKR {inv.total_amount?.toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          inv.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.payment_status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No invoices issued for this patient.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
