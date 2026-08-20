'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldCheck, Lock, Mail, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your Email / User ID and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      router.push(data.redirectPath);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 select-none">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100/50 grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side: Sophisticated Branding Panel */}
        <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-purple-950 p-8 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center space-x-3">
              <img src="/assets/logo.svg" alt="REC Logo" className="w-12 h-12 object-contain bg-white/10 p-2 rounded-2xl border border-white/20" />
              <div>
                <h1 className="text-xl font-black tracking-wider text-white">REC EDGE</h1>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">REGULATION 26</p>
              </div>
            </div>

            <div className="mt-10 space-y-3">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Academic Governance Portal</span>
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                Curriculum & Syllabus Management System
              </h2>
              <p className="text-xs text-purple-200/80 leading-relaxed">
                Centralized academic workflow automation platform for Dean, MasterAdmin, Heads of Department, and Faculty under Regulation 26.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-purple-300">
            <span className="flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1 text-emerald-400" /> Autonomous Institution
            </span>
            <span>AY 2026–2027</span>
          </div>
        </div>

        {/* Right Side: Clean Institutional Login Card */}
        <div className="p-8 lg:p-12 bg-white flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-900">Welcome Back</h3>
            <p className="text-xs font-medium text-desc mt-1">Sign in to continue to Regulation 26</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-red-50 border border-red-200 flex items-start text-xs text-red-700">
              <AlertCircle className="w-4 h-4 mr-2 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email / User ID *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. dean@rajalakshmi.edu.in or DEAN01"
                  className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password *</label>
                <button
                  type="button"
                  onClick={() => alert('Please contact MasterAdmin (231701042@rajalakshmi.edu.in) for password reset assistance.')}
                  className="text-[11px] font-semibold text-brand-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center space-x-2 transition-all mt-2"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-purple-50 text-center">
            <p className="text-[11px] text-desc">
              MasterAdmin: <span className="font-mono text-slate-700">231701042@rajalakshmi.edu.in</span> | Dean: <span className="font-mono text-slate-700">DEAN01</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
