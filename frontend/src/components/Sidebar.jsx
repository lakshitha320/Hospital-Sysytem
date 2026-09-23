import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Stethoscope,
  ClipboardList,
  FlaskConical,
  Pill,
  Receipt,
  UserCog,
  BarChart3,
  Hospital
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const { role, isAdmin } = useAuth();

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'nurse', 'receptionist', 'lab_staff', 'pharmacist', 'accountant'] },
    { id: 'patients', name: 'Patients', icon: Users, roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
    { id: 'appointments', name: 'Appointments', icon: CalendarCheck, roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
    { id: 'doctors', name: 'Doctors & Schedules', icon: Stethoscope, roles: ['admin', 'doctor', 'receptionist'] },
    { id: 'emr', name: 'EMR & Prescriptions', icon: ClipboardList, roles: ['admin', 'doctor', 'nurse'] },
    { id: 'lab', name: 'Laboratory', icon: FlaskConical, roles: ['admin', 'lab_staff', 'doctor', 'nurse'] },
    { id: 'pharmacy', name: 'Pharmacy & Stock', icon: Pill, roles: ['admin', 'pharmacist', 'doctor'] },
    { id: 'billing', name: 'Billing & Invoicing', icon: Receipt, roles: ['admin', 'accountant', 'receptionist'] },
    { id: 'staff', name: 'Staff Management', icon: UserCog, roles: ['admin'] },
    { id: 'reports', name: 'Reports & Analytics', icon: BarChart3, roles: ['admin', 'accountant'] },
  ];

  // Filter based on user's role
  const visibleNav = navigation.filter(item => isAdmin || item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-md shadow-teal-500/10 flex items-center justify-center overflow-hidden shrink-0">
          <img src="/logo.jpg" alt="Hospital Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-base font-extrabold tracking-tight text-white leading-none">Metro Healthcare</h1>
          <p className="text-[11px] text-teal-400 font-medium mt-1">Hospital Management (HMS)</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Core Modules
        </div>

        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* System Status info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Online</span>
        </div>
        <span className="text-[10px] text-slate-500">v1.0.0 (Spec Compliant)</span>
      </div>
    </aside>
  );
}
