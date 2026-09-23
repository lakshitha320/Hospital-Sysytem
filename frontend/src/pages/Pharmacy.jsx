import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Pill,
  Plus,
  AlertTriangle,
  Search,
  CheckCircle,
  Package,
  Calendar,
  AlertCircle,
  Clock,
  X,
  FileCheck2,
  Trash2
} from 'lucide-react';

export default function Pharmacy() {
  const { role, isPharmacist, isAdmin } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'prescriptions'
  const [search, setSearch] = useState('');

  // Add Medicine Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    generic_name: '',
    category: 'Antibiotics',
    batch_number: '',
    stock_quantity: 100,
    min_stock_level: 20,
    unit_price: 15.0,
    expiry_date: '2027-12-31',
    supplier: 'State Pharmaceuticals'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (searchTerm = '') => {
    setLoading(true);
    try {
      const [meds, alertsData, prescData] = await Promise.all([
        api.getMedicines({ search: searchTerm }),
        api.getPharmacyAlerts(),
        api.getPrescriptions()
      ]);
      setMedicines(meds);
      setAlerts(alertsData);
      setPrescriptions(prescData);
    } catch (err) {
      console.error('Failed to load pharmacy data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadData(search);
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await api.createMedicine(addForm);
      setShowAddModal(false);
      setAddForm({
        name: '',
        generic_name: '',
        category: 'Antibiotics',
        batch_number: '',
        stock_quantity: 100,
        min_stock_level: 20,
        unit_price: 15.0,
        expiry_date: '2027-12-31',
        supplier: 'State Pharmaceuticals'
      });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to add medicine');
    }
  };

  const handleDispense = async (prescriptionId) => {
    try {
      await api.dispensePrescription(prescriptionId);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to dispense prescription');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this medicine?')) return;
    try {
      await api.deleteMedicine(id);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" />
            Pharmacy & Drug Inventory Management
          </h2>
          <p className="text-xs text-slate-500">Track medication stocks, expiry dates, and process electronic doctor prescriptions</p>
        </div>

        {['admin', 'pharmacist'].includes(role) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine Batch</span>
          </button>
        )}
      </div>

      {/* Expiry & Low Stock Warning Banners */}
      {alerts && (alerts.low_stock_count > 0 || alerts.expiring_soon_count > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.low_stock_count > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-800">Critical Low Stock Warning ({alerts.low_stock_count} Items)</h4>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  The following drugs are below minimum threshold: {alerts.low_stock.map(m => `${m.name} (${m.stock_quantity} left)`).join(', ')}
                </p>
              </div>
            </div>
          )}

          {alerts.expiring_soon_count > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-800">Near Expiry Alert ({alerts.expiring_soon_count} Batches)</h4>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Medicines expiring within next 60 days: {alerts.expiring_soon.map(m => `${m.name} (Exp: ${m.expiry_date})`).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold space-x-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-2.5 transition relative ${
            activeTab === 'inventory'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Drug Inventory ({medicines.length})
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-2.5 transition relative ${
            activeTab === 'prescriptions'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Prescription Dispensing Queue ({prescriptions.filter(p => p.status === 'Pending').length} Pending)
        </button>
      </div>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search drug name, generic, or batch..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Search
            </button>
          </form>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Code / Batch</th>
                    <th className="py-3 px-4">Medicine Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Stock In Hand</th>
                    <th className="py-3 px-4">Unit Price</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Supplier</th>
                    {['admin', 'pharmacist'].includes(role) && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">Loading medicines...</td>
                    </tr>
                  ) : medicines.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">No medicines found.</td>
                    </tr>
                  ) : (
                    medicines.map((m) => {
                      const isLow = m.stock_quantity <= m.min_stock_level;
                      const isNearExpiry = new Date(m.expiry_date) <= new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-mono">
                            <span className="text-teal-700 font-semibold">{m.medicine_code}</span>
                            <span className="block text-[10px] text-slate-400">B: {m.batch_number}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-800">{m.name}</p>
                            <span className="text-[11px] text-slate-400 italic">{m.generic_name}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{m.category}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold ${isLow ? 'text-rose-600 font-mono' : 'text-slate-800'}`}>
                                {m.stock_quantity}
                              </span>
                              {isLow && (
                                <span className="px-1.5 py-0.2 text-[9px] bg-rose-100 text-rose-800 rounded font-semibold">
                                  Low Stock
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">Min: {m.min_stock_level}</span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            LKR {m.unit_price?.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className={isNearExpiry ? 'text-amber-700 font-bold' : 'text-slate-600'}>
                              {m.expiry_date}
                            </span>
                            {isNearExpiry && (
                              <span className="block text-[9px] text-amber-600 font-sans font-semibold">Expiring Soon</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">{m.supplier || 'SPC'}</td>
                          {['admin', 'pharmacist'].includes(role) && (
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDelete(m.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Prescriptions Queue Tab */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-teal-600 font-semibold">RX #{p.id}</span>
                    <h4 className="font-bold text-slate-900 text-sm">{p.patient_name}</h4>
                    <p className="text-[11px] text-slate-400">
                      Patient Code: {p.patient_code} • Prescribed by {p.doctor_name}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    p.status === 'Dispensed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prescribed Drugs</span>
                  {p.items?.map((it, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-800">• {it.medicine_name} ({it.dosage})</span>
                      <span className="text-slate-500 font-mono text-[11px]">{it.frequency} | {it.duration} (Qty: {it.quantity})</span>
                    </div>
                  ))}
                </div>

                {p.instructions && (
                  <p className="text-xs text-slate-500 italic"><span className="font-semibold text-slate-600">Instructions:</span> {p.instructions}</p>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">{p.created_at}</span>
                  {p.status === 'Pending' && ['admin', 'pharmacist'].includes(role) && (
                    <button
                      onClick={() => handleDispense(p.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Dispense Medication
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Medicine Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Add New Medicine Batch to Inventory</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="e.g. Augmentin 625mg"
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Generic Name</label>
                  <input
                    type="text"
                    value={addForm.generic_name}
                    onChange={(e) => setAddForm({ ...addForm, generic_name: e.target.value })}
                    placeholder="e.g. Co-amoxiclav"
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Analgesics">Analgesics</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Gastrointestinal">Gastrointestinal</option>
                    <option value="Antihistamines">Antihistamines</option>
                    <option value="Endocrine">Endocrine</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={addForm.batch_number}
                    onChange={(e) => setAddForm({ ...addForm, batch_number: e.target.value })}
                    placeholder="e.g. BATCH-2026-X"
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    value={addForm.stock_quantity}
                    onChange={(e) => setAddForm({ ...addForm, stock_quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    value={addForm.min_stock_level}
                    onChange={(e) => setAddForm({ ...addForm, min_stock_level: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (LKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={addForm.unit_price}
                    onChange={(e) => setAddForm({ ...addForm, unit_price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={addForm.expiry_date}
                    onChange={(e) => setAddForm({ ...addForm, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={addForm.supplier}
                    onChange={(e) => setAddForm({ ...addForm, supplier: e.target.value })}
                    placeholder="e.g. State Pharmaceuticals Corp"
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                >
                  Add Medicine Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
