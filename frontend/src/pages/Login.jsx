import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Hospital, ShieldAlert, ArrowRight, UserCheck, Stethoscope, HeartPulse, Building2, FlaskConical, Pill, Receipt, Shield } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { username: 'admin', role: 'Administrator', icon: Shield, desc: 'Full System Access & Staff' },
    { username: 'doctor', role: 'Doctor', icon: Stethoscope, desc: 'EMR, Diagnosis & Appointments' },
    { username: 'nurse', role: 'Nurse', icon: HeartPulse, desc: 'Vitals & Patient Care' },
    { username: 'receptionist', role: 'Receptionist', icon: Building2, desc: 'Registration & Appointments' },
    { username: 'lab_staff', role: 'Laboratory Staff', icon: FlaskConical, desc: 'Test Processing & Reports' },
    { username: 'pharmacist', role: 'Pharmacist', icon: Pill, desc: 'Stock & Medicine Dispensing' },
    { username: 'accountant', role: 'Accountant', icon: Receipt, desc: 'Billing, Invoices & Revenue' }
  ];

  const handleQuickLogin = (uname) => {
    setUsername(uname);
    setPassword('password123');
    login(uname, 'password123').catch(err => setError(err.message));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700/30">
        
        {/* Left Side: Hospital Branding & Hero Background */}
        <div className="lg:col-span-5 relative text-white flex flex-col justify-between p-8 overflow-hidden min-h-[480px]">
          {/* Background Photo with Dark Hospital Gradient Overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center z-0 scale-105 transition-transform duration-1000"
            style={{ backgroundImage: `url('/hospital-hero.jpg')` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-teal-950/70 z-10 backdrop-blur-[2px]"></div>

          <div className="relative z-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-lg flex items-center justify-center overflow-hidden">
                <img src="/logo.jpg" alt="Metro Healthcare Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white drop-shadow">Metro Healthcare</h1>
                <p className="text-xs text-teal-300 font-medium">Hospital Management Platform</p>
              </div>
            </div>

            <div className="mt-12 space-y-3">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-teal-500/20 text-teal-200 border border-teal-400/30 backdrop-blur-md">
                Verified Clinical Suite
              </span>
              <h2 className="text-2xl font-black leading-snug drop-shadow-sm text-white">
                Next-Gen Healthcare Management
              </h2>
              <p className="text-xs text-slate-200/90 leading-relaxed drop-shadow">
                EMR & Prescriptions, Real-time Ward Admissions, Diagnostics Laboratory Automation, and Itemized Billing.
              </p>
            </div>
          </div>

          <div className="relative z-20 pt-6 border-t border-white/10 text-xs text-teal-200/80 flex items-center justify-between">
            <span className="font-mono text-[11px]">Specification Compliant</span>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Cloud & Local Ready
            </span>
          </div>
        </div>

        {/* Right Side: Login Form & Quick Access */}
        <div className="lg:col-span-7 p-8 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h3 className="text-2xl font-bold text-slate-900">Sign in to HMS</h3>
            <p className="text-xs text-slate-500 mt-1">Enter your assigned hospital credentials to proceed</p>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                  placeholder="e.g. admin or doctor"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-sm transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Role Logins */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <UserCheck className="w-3.5 h-3.5 text-teal-600" /> One-Click Role Switch (Demo Mode)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {demoAccounts.map((acc) => {
                  const Icon = acc.icon;
                  return (
                    <button
                      key={acc.username}
                      onClick={() => handleQuickLogin(acc.username)}
                      type="button"
                      className="p-2 border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-lg text-left transition-all group"
                    >
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium text-xs group-hover:text-teal-700">
                        <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600" />
                        <span>{acc.role}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{acc.username}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 text-center">Default password for all demo accounts: <code className="text-slate-600 font-semibold">password123</code></p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
