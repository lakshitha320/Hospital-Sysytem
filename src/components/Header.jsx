import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Shield, Stethoscope, HeartPulse, Building2, FlaskConical, Pill, Receipt, RefreshCw } from 'lucide-react';

const roleMeta = {
  admin: { label: 'Administrator', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Shield },
  doctor: { label: 'Doctor', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Stethoscope },
  nurse: { label: 'Nurse', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: HeartPulse },
  receptionist: { label: 'Receptionist', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Building2 },
  lab_staff: { label: 'Laboratory Tech', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: FlaskConical },
  pharmacist: { label: 'Pharmacist', color: 'bg-rose-100 text-rose-800 border-rose-200', icon: Pill },
  accountant: { label: 'Accountant', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Receipt },
};

export default function Header() {
  const { user, logout, quickSwitchRole, role } = useAuth();
  const currentRoleMeta = roleMeta[role] || { label: role, color: 'bg-gray-100 text-gray-800', icon: User };
  const RoleIcon = currentRoleMeta.icon;

  const testRoles = [
    { username: 'admin', label: 'Admin' },
    { username: 'doctor', label: 'Doctor' },
    { username: 'nurse', label: 'Nurse' },
    { username: 'receptionist', label: 'Reception' },
    { username: 'lab_staff', label: 'Lab' },
    { username: 'pharmacist', label: 'Pharmacy' },
    { username: 'accountant', label: 'Billing' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Current Active Role info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Role:</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentRoleMeta.color}`}>
            <RoleIcon className="w-3.5 h-3.5" />
            {currentRoleMeta.label}
          </span>
        </div>
      </div>

      {/* Center: Quick Role Switcher for seamless testing */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mr-1">
          <RefreshCw className="w-3 h-3 text-slate-400" /> Switch:
        </span>
        {testRoles.map((r) => (
          <button
            key={r.username}
            onClick={() => quickSwitchRole(r.username)}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              user?.username === r.username
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Right: User profile and logout */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.full_name}</p>
          <p className="text-xs text-slate-500">{user?.email || user?.username}</p>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
