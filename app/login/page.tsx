'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('231701042@rajalakshmi.edu.in');
  const [password, setPassword] = useState('Changeme@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      router.push(data.redirectPath);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Changeme@123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-bgmain flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-brand-600/30">
            R26
          </div>
        </div>
        <h2 className="mt-4 text-center text-xl font-extrabold text-slate-900 tracking-tight">
          Rajalakshmi Engineering College
        </h2>
        <p className="mt-1 text-center text-xs font-semibold text-desc uppercase tracking-wider">
          Regulation 26 — Curriculum & Syllabus Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card py-8 px-6 shadow-2xl rounded-3xl border border-purple-100 sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College Email Address (@rajalakshmi.edu.in)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="username@rajalakshmi.edu.in"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/30 focus:outline-none transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <span>Sign In to System</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Selector for Easy Testing */}
          <div className="mt-8 pt-6 border-t border-purple-100">
            <p className="text-[11px] font-bold text-desc uppercase tracking-wider text-center mb-3">
              Quick Test Credentials (Default Password: Changeme@123)
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                onClick={() => setDemoAccount('231701042@rajalakshmi.edu.in')}
                className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-brand-800 font-bold text-left"
              >
                🔑 MasterAdmin
                <span className="block text-[9px] text-desc font-normal">231701042@...</span>
              </button>

              <button
                onClick={() => setDemoAccount('dean@rajalakshmi.edu.in')}
                className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-bold text-left"
              >
                🎓 Dean (SuperAdmin)
                <span className="block text-[9px] text-desc font-normal">dean@...</span>
              </button>

              <button
                onClick={() => setDemoAccount('hod.cse@rajalakshmi.edu.in')}
                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold text-left"
              >
                🏛️ HoD CSE
                <span className="block text-[9px] text-desc font-normal">hod.cse@...</span>
              </button>

              <button
                onClick={() => setDemoAccount('faculty1.cse@rajalakshmi.edu.in')}
                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-left"
              >
                👨‍🏫 Faculty CSE
                <span className="block text-[9px] text-desc font-normal">faculty1.cse@...</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-desc">
          <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-brand-600" />
          Institutional Role-Based Access Enforcement Enabled
        </p>
      </div>
    </div>
  );
}
