import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Calendar,
  DollarSign,
  FlaskConical,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  FileText,
  PlusCircle,
  CalendarPlus,
  Receipt,
  Pill
} from 'lucide-react';

export default function Dashboard({ setCurrentTab }) {
  const { user, role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const summary = await api.getDashboardSummary();
      setData(summary);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
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

  const statCards = [
    {
      title: 'Total Patients',
      value: data?.total_patients || 0,
      subtext: 'Registered patients in HMS',
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-100',
      action: () => setCurrentTab('patients')
    },
    {
      title: "Today's Appointments",
      value: data?.todays_appointments || 0,
      subtext: `${data?.total_appointments || 0} total scheduled`,
      icon: Calendar,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      action: () => setCurrentTab('appointments')
    },
    {
      title: 'Revenue Summary',
      value: `LKR ${(data?.revenue?.total_collected || 0).toLocaleString()}`,
      subtext: `LKR ${(data?.revenue?.pending_dues || 0).toLocaleString()} pending dues`,
      icon: DollarSign,
      color: 'bg-purple-50 text-purple-700 border-purple-100',
      action: () => setCurrentTab('billing')
    },
    {
      title: 'Laboratory Requests',
      value: data?.laboratory?.total_requests || 0,
      subtext: `${data?.laboratory?.pending || 0} pending, ${data?.laboratory?.in_progress || 0} testing`,
      icon: FlaskConical,
      color: 'bg-cyan-50 text-cyan-700 border-cyan-100',
      action: () => setCurrentTab('lab')
    },
    {
      title: 'Pharmacy Alerts',
      value: (data?.pharmacy_alerts?.low_stock || 0) + (data?.pharmacy_alerts?.expiring_soon || 0),
      subtext: `${data?.pharmacy_alerts?.low_stock || 0} low stock, ${data?.pharmacy_alerts?.expiring_soon || 0} near expiry`,
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-700 border-amber-100',
      action: () => setCurrentTab('pharmacy')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/30 text-teal-200 mb-2">
            Hospital Overview & Operations
          </span>
          <h2 className="text-2xl font-bold">Good day, {user?.full_name}</h2>
          <p className="text-teal-200/80 text-sm mt-1">
            Logged in as <strong className="capitalize">{user?.role}</strong>. Here is today's operational summary.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          {['admin', 'receptionist', 'nurse'].includes(role) && (
            <button
              onClick={() => setCurrentTab('patients')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-teal-900 rounded-lg text-xs font-semibold hover:bg-teal-50 transition shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5 text-teal-600" />
              Register Patient
            </button>
          )}

          {['admin', 'receptionist', 'doctor'].includes(role) && (
            <button
              onClick={() => setCurrentTab('appointments')}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-700 text-white rounded-lg text-xs font-semibold hover:bg-teal-600 transition"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Book Appointment
            </button>
          )}

          {['admin', 'accountant'].includes(role) && (
            <button
              onClick={() => setCurrentTab('billing')}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-700 text-white rounded-lg text-xs font-semibold hover:bg-teal-600 transition"
            >
              <Receipt className="w-3.5 h-3.5" />
              New Invoice
            </button>
          )}

          {['admin', 'pharmacist'].includes(role) && (
            <button
              onClick={() => setCurrentTab('pharmacy')}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-700 text-white rounded-lg text-xs font-semibold hover:bg-teal-600 transition"
            >
              <Pill className="w-3.5 h-3.5" />
              Dispense
            </button>
          )}
        </div>
      </div>

      {/* 5 Specification Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.action}
              className={`p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition cursor-pointer group flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-slate-900 group-hover:text-teal-600 transition">
                  {card.value}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{card.subtext}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Appointments & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Appointments */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              Recent Appointments
            </h3>
            <button
              onClick={() => setCurrentTab('appointments')}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recent_appointments?.length > 0 ? (
              data.recent_appointments.map((appt) => (
                <div key={appt.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 mt-0.5">
                      {appt.patient_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{appt.patient_name}</p>
                      <p className="text-[11px] text-slate-500">
                        {appt.doctor_name} • <span className="text-slate-400">{appt.department_name}</span>
                      </p>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" /> {appt.appointment_date} at {appt.appointment_time}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      appt.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : appt.status === 'In Progress'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {appt.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No recent appointments recorded.</p>
            )}
          </div>
        </div>

        {/* Recent Invoices & Billing */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-600" />
              Latest Invoices
            </h3>
            <button
              onClick={() => setCurrentTab('billing')}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recent_invoices?.length > 0 ? (
              data.recent_invoices.map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">{inv.invoice_number}</span>
                    <p className="text-xs font-semibold text-slate-900">{inv.patient_name}</p>
                    <span className="text-[10px] text-slate-500">Method: {inv.payment_method}</span>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">LKR {inv.total_amount?.toLocaleString()}</p>
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                        inv.payment_status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {inv.payment_status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No invoices created yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
