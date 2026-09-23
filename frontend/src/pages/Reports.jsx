import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  BarChart3,
  DollarSign,
  Calendar,
  Users,
  Pill,
  FlaskConical,
  UserCheck,
  TrendingUp,
  Download,
  Building
} from 'lucide-react';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const summary = await api.getReportsSummary();
      setData(summary);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const rev = data?.revenue || {};
  const pharmacy = data?.pharmacy_overview || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Hospital Analytics & Operational Reports
          </h2>
          <p className="text-xs text-slate-500">Comprehensive reporting on revenue, patient volumes, laboratory, and pharmacy (Section 3.10)</p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition no-print"
        >
          <Download className="w-4 h-4" />
          <span>Export / Print Full Report</span>
        </button>
      </div>

      {/* 1. Revenue Report Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Revenue Breakdown by Department / Service (Section 3.10)
          </h3>
          <span className="text-sm font-extrabold text-teal-800 font-mono">
            Total Billed: LKR {rev.grand_total?.toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-xs font-medium text-emerald-800">Doctor Consultations</span>
            <p className="text-lg font-bold text-emerald-950 mt-1">LKR {rev.consultation_total?.toLocaleString()}</p>
            <span className="text-[11px] text-emerald-600">OPD & Specialist clinics</span>
          </div>

          <div className="p-4 bg-cyan-50/60 rounded-xl border border-cyan-100">
            <span className="text-xs font-medium text-cyan-800">Laboratory Diagnostics</span>
            <p className="text-lg font-bold text-cyan-950 mt-1">LKR {rev.lab_total?.toLocaleString()}</p>
            <span className="text-[11px] text-cyan-600">Pathology & Radiology</span>
          </div>

          <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100">
            <span className="text-xs font-medium text-purple-800">Pharmacy Medication</span>
            <p className="text-lg font-bold text-purple-950 mt-1">LKR {rev.pharmacy_total?.toLocaleString()}</p>
            <span className="text-[11px] text-purple-600">Dispensed drugs</span>
          </div>

          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
            <span className="text-xs font-medium text-blue-800">Admission & Wards</span>
            <p className="text-lg font-bold text-blue-950 mt-1">LKR {rev.admission_total?.toLocaleString()}</p>
            <span className="text-[11px] text-blue-600">Inpatient care & beds</span>
          </div>
        </div>
      </div>

      {/* 2. Appointments & Department Volumes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Volume */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Building className="w-4 h-4 text-teal-600" />
            Appointments by Clinical Department
          </h3>
          <div className="space-y-3">
            {data?.appointments_by_dept?.map((dept, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>{dept.department}</span>
                  <span className="font-bold">{dept.count} visits</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-teal-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, dept.count * 25)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Appointment Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            Appointment Fulfillment Status
          </h3>
          <div className="space-y-3">
            {data?.appointments_by_status?.map((st, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-xs">
                <span className="font-semibold text-slate-800">{st.status}</span>
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-white border font-mono">
                  {st.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Patient Demographics & Pharmacy Inventory Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Blood Group & Gender Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-600" />
            Patient Blood Group Distribution
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {data?.patient_blood?.map((bg, idx) => (
              <div key={idx} className="p-3 text-center rounded-xl bg-rose-50/60 border border-rose-100">
                <span className="text-sm font-bold text-rose-800 block">{bg.blood_group}</span>
                <span className="text-xs text-rose-600 font-semibold">{bg.count} Patients</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pharmacy Stock Valuation */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Pill className="w-4 h-4 text-teal-600" />
            Pharmacy Inventory Valuation
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Total Drug Formulas</span>
              <span className="text-base font-bold text-slate-800">{pharmacy.total_items} Types</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Total Valuation</span>
              <span className="text-base font-bold text-emerald-700 font-mono">
                LKR {pharmacy.inventory_value?.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-800">
              <span className="block text-[11px]">Low Stock Items</span>
              <span className="text-base font-bold">{pharmacy.low_stock_items}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800">
              <span className="block text-[11px]">Expiring &lt; 60 Days</span>
              <span className="text-base font-bold">{pharmacy.near_expiry_items}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Laboratory Diagnostics Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-cyan-600" />
          Laboratory Test Category Performance
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data?.lab_stats?.map((ls, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-1">
              <span className="font-bold text-slate-800 block text-sm">{ls.category}</span>
              <div className="flex justify-between text-slate-500 pt-1">
                <span>Completed Investigations:</span>
                <span className="font-semibold text-slate-800">{ls.total_tests}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Value:</span>
                <span className="font-mono font-bold text-teal-700">LKR {ls.total_value?.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
