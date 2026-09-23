import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Receipt,
  Plus,
  Printer,
  DollarSign,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Building,
  Calendar,
  ShieldCheck
} from 'lucide-react';

export default function Billing() {
  const { role, isAccountant, isAdmin } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  // New Invoice Form
  const [form, setForm] = useState({
    patient_id: '',
    consultation_charges: 2500,
    laboratory_charges: 0,
    pharmacy_charges: 0,
    admission_charges: 0,
    tax: 0,
    discount: 0,
    payment_method: 'Cash',
    payment_status: 'Paid',
    paid_amount: 2500,
    notes: 'Consultation & OPD services'
  });

  // Payment Form
  const [payForm, setPayForm] = useState({
    paid_amount: 0,
    payment_method: 'Cash'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, patData] = await Promise.all([
        api.getInvoices(),
        api.getPatients()
      ]);
      setInvoices(invData);
      setPatients(patData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculatedTotal =
    (parseFloat(form.consultation_charges) || 0) +
    (parseFloat(form.laboratory_charges) || 0) +
    (parseFloat(form.pharmacy_charges) || 0) +
    (parseFloat(form.admission_charges) || 0) +
    (parseFloat(form.tax) || 0) -
    (parseFloat(form.discount) || 0);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await api.createInvoice({
        ...form,
        total_amount: calculatedTotal,
        paid_amount: form.payment_status === 'Paid' ? calculatedTotal : (parseFloat(form.paid_amount) || 0)
      });
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to generate invoice');
    }
  };

  const openPaymentModal = (inv) => {
    setSelectedInvoice(inv);
    const balance = inv.total_amount - inv.paid_amount;
    setPayForm({
      paid_amount: inv.paid_amount + balance,
      payment_method: inv.payment_method || 'Cash'
    });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await api.recordPayment(selectedInvoice.id, payForm);
      setShowPaymentModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    }
  };

  const openReceiptModal = async (inv) => {
    try {
      const full = await api.getInvoiceById(inv.id);
      setReceiptData(full);
      setShowReceiptModal(true);
    } catch (err) {
      alert('Failed to load invoice receipt');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-600" />
            Billing & Invoicing System
          </h2>
          <p className="text-xs text-slate-500">Generate patient invoices, itemized charges, record payments, and print receipts</p>
        </div>

        {['admin', 'accountant', 'receptionist'].includes(role) && (
          <button
            onClick={() => {
              setForm({
                patient_id: patients[0]?.id || '',
                consultation_charges: 2500,
                laboratory_charges: 0,
                pharmacy_charges: 0,
                admission_charges: 0,
                tax: 0,
                discount: 0,
                payment_method: 'Cash',
                payment_status: 'Paid',
                paid_amount: 2500,
                notes: 'Consultation & Services'
              });
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Patient Invoice</span>
          </button>
        )}
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Charge Breakdown</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Paid / Balance</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">Loading billing invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">No invoices generated yet.</td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const balance = inv.total_amount - inv.paid_amount;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-teal-700">{inv.invoice_number}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{inv.patient_name}</p>
                        <span className="text-[11px] text-slate-400 font-mono">{inv.patient_code}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{inv.created_at?.split(' ')[0]}</td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-600">
                        <div>Doc: LKR {inv.consultation_charges}</div>
                        {(inv.laboratory_charges > 0 || inv.pharmacy_charges > 0) && (
                          <div className="text-slate-400">Lab: {inv.laboratory_charges} | Pharm: {inv.pharmacy_charges}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        LKR {inv.total_amount?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="text-emerald-700 font-semibold">Paid: {inv.paid_amount?.toLocaleString()}</span>
                        {balance > 0 && <span className="block text-rose-600">Due: {balance?.toLocaleString()}</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.payment_status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.payment_status === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.payment_status !== 'Paid' && ['admin', 'accountant', 'receptionist'].includes(role) && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="px-2 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded text-[11px] font-semibold"
                            >
                              Pay Now
                            </button>
                          )}
                          <button
                            onClick={() => openReceiptModal(inv)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                          >
                            <Printer className="w-3 h-3 text-teal-600" />
                            Print Receipt
                          </button>
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

      {/* Generate Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Generate Patient Invoice</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
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

              {/* Fee Breakdown Inputs per Section 3.8 */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Fee Categorization (Section 3.8)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">Consultation Charges (LKR)</label>
                    <input
                      type="number"
                      value={form.consultation_charges}
                      onChange={(e) => setForm({ ...form, consultation_charges: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs outline-none bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">Laboratory Charges (LKR)</label>
                    <input
                      type="number"
                      value={form.laboratory_charges}
                      onChange={(e) => setForm({ ...form, laboratory_charges: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs outline-none bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">Pharmacy Charges (LKR)</label>
                    <input
                      type="number"
                      value={form.pharmacy_charges}
                      onChange={(e) => setForm({ ...form, pharmacy_charges: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs outline-none bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">Admission / Room Charges (LKR)</label>
                    <input
                      type="number"
                      value={form.admission_charges}
                      onChange={(e) => setForm({ ...form, admission_charges: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs outline-none bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">Tax / VAT (LKR)</label>
                    <input
                      type="number"
                      value={form.tax}
                      onChange={(e) => setForm({ ...form, tax: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs outline-none bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">Discount (LKR)</label>
                    <input
                      type="number"
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs outline-none bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-teal-900">Total Payable Amount:</span>
                <span className="text-base font-extrabold text-teal-800 font-mono">
                  LKR {calculatedTotal.toLocaleString()}
                </span>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Insurance">Health Insurance</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={form.payment_status}
                    onChange={(e) => setForm({ ...form, payment_status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Paid">Immediate Settlement (Paid)</option>
                    <option value="Unpaid">Invoice on Credit (Unpaid)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Reference</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Settled at cashier counter"
                  className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Receive Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-4 space-y-4">
              <div>
                <p className="text-xs text-slate-500">Invoice: <strong className="text-slate-800">{selectedInvoice.invoice_number}</strong></p>
                <p className="text-xs text-slate-500">Total Billed: LKR {selectedInvoice.total_amount?.toLocaleString()}</p>
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  Remaining Balance: LKR {(selectedInvoice.total_amount - selectedInvoice.paid_amount)?.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Amount Collected (LKR) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payForm.paid_amount}
                  onChange={(e) => setPayForm({ ...payForm, paid_amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={payForm.payment_method}
                  onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Insurance">Health Insurance</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Invoice / Receipt Modal */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-4 border-b flex items-center justify-between no-print">
              <span className="text-xs font-bold text-slate-600">Official Patient Receipt</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                </button>
                <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Layout */}
            <div id="printable-area" className="p-8 text-slate-900 space-y-6">
              {/* Hospital Header */}
              <div className="border-b-2 border-teal-700 pb-4 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white p-1 border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                    <img src="/logo.jpg" alt="Hospital Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-teal-900 tracking-tight">METRO HEALTHCARE</h1>
                    <p className="text-xs text-slate-600 font-medium">Official Tax Invoice & Payment Receipt</p>
                    <p className="text-[11px] text-slate-400">123 Healthway Avenue, Colombo 07 | Tel: +94 11 234 5678</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-teal-50 text-teal-800 text-xs font-bold rounded border border-teal-200">
                    RECEIPT
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-1">{receiptData.invoice_number}</p>
                  <p className="text-[11px] text-slate-400">{receiptData.created_at}</p>
                </div>
              </div>

              {/* Patient & Cashier Details */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p><span className="text-slate-400 font-medium">Billed To:</span> <strong>{receiptData.patient_name}</strong></p>
                  <p className="mt-1"><span className="text-slate-400 font-medium">Patient Code:</span> {receiptData.patient_code}</p>
                  <p className="mt-1"><span className="text-slate-400 font-medium">Phone:</span> {receiptData.patient_phone || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p><span className="text-slate-400 font-medium">Payment Method:</span> <strong className="text-teal-800">{receiptData.payment_method}</strong></p>
                  <p className="mt-1"><span className="text-slate-400 font-medium">Status:</span> <strong className="text-emerald-700">{receiptData.payment_status}</strong></p>
                  <p className="mt-1"><span className="text-slate-400 font-medium">Cashier / Staff:</span> {receiptData.cashier_name || 'Dinesh Jayasuriya'}</p>
                </div>
              </div>

              {/* Itemized Line Items Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Item Type</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4 text-center">Qty</th>
                      <th className="py-2.5 px-4 text-right">Unit Price</th>
                      <th className="py-2.5 px-4 text-right">Amount (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receiptData.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-4 font-semibold text-slate-700">{item.item_type}</td>
                        <td className="py-2 px-4 text-slate-600">{item.description}</td>
                        <td className="py-2 px-4 text-center">{item.quantity}</td>
                        <td className="py-2 px-4 text-right font-mono">{item.unit_price?.toLocaleString()}</td>
                        <td className="py-2 px-4 text-right font-mono font-semibold">{item.total?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Summary */}
              <div className="flex justify-end text-xs">
                <div className="w-64 space-y-1.5 border-t border-slate-300 pt-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Consultation:</span>
                    <span className="font-mono">LKR {receiptData.consultation_charges?.toLocaleString()}</span>
                  </div>
                  {receiptData.laboratory_charges > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Laboratory:</span>
                      <span className="font-mono">LKR {receiptData.laboratory_charges?.toLocaleString()}</span>
                    </div>
                  )}
                  {receiptData.pharmacy_charges > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Pharmacy:</span>
                      <span className="font-mono">LKR {receiptData.pharmacy_charges?.toLocaleString()}</span>
                    </div>
                  )}
                  {receiptData.admission_charges > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Admission / Room:</span>
                      <span className="font-mono">LKR {receiptData.admission_charges?.toLocaleString()}</span>
                    </div>
                  )}
                  {receiptData.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-mono">- LKR {receiptData.discount?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-300 pt-2">
                    <span>Total Amount:</span>
                    <span className="font-mono text-teal-800">LKR {receiptData.total_amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-700">
                    <span>Paid Amount:</span>
                    <span className="font-mono">LKR {receiptData.paid_amount?.toLocaleString()}</span>
                  </div>
                  {receiptData.total_amount - receiptData.paid_amount > 0 && (
                    <div className="flex justify-between text-xs font-bold text-rose-600">
                      <span>Balance Due:</span>
                      <span className="font-mono">LKR {(receiptData.total_amount - receiptData.paid_amount)?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Thank you note & Stamp */}
              <div className="pt-10 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
                <div>
                  <p className="font-semibold text-slate-700">Thank you for choosing ApexCare Hospital.</p>
                  <p className="text-[10px]">Wish you good health & speedy recovery.</p>
                </div>
                <div className="text-right">
                  <div className="w-36 border-t border-slate-400 mb-1 ml-auto"></div>
                  <p className="font-semibold text-slate-800">Authorized Cashier Signature</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
