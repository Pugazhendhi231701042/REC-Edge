'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { formatIST } from '@/lib/time';
import {
  Bell,
  Key,
  X,
  User as UserIcon,
  LogOut,
  Sliders,
  ChevronDown,
  ShieldCheck,
  Building2,
  Mail,
  Award,
  Sparkles,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, activeTab, onTabChange }) => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Dropdown State
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Profile View Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Settings Password Reset Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ error: '', success: '' });

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (!res.ok || !data.authenticated) {
        router.push('/login');
        return;
      }

      setUser(data.user);
      fetchNotifications();
    } catch (err) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ error: '', success: '' });

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password.');

      setPasswordMsg({ error: '', success: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ error: err.message, success: '' });
    }
  };

  const markAllNotificationsRead = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bgmain flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-brand-700">Loading Academic Management System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bgmain font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        userRole={user?.role}
        userName={user?.name}
        userEmail={user?.email}
        departmentName={user?.department}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-purple-100 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-3">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Regulation 26 — Curriculum & Syllabus Management System
            </h2>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-brand-800 border border-purple-200">
              Regulation 26
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 text-slate-600 hover:bg-purple-50 rounded-xl relative transition-colors"
              >
                <Bell className="w-5 h-5 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-purple-100 p-4 z-40 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                    {unreadCount > 0 && (
                      <button onClick={markAllNotificationsRead} className="text-[10px] font-semibold text-brand-600 hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-desc text-center py-4">No notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`p-2.5 rounded-xl text-xs border ${n.read ? 'bg-slate-50 border-slate-100' : 'bg-purple-50/60 border-purple-100'}`}>
                          <p className="font-bold text-slate-800">{n.title}</p>
                          <p className="text-desc mt-0.5">{n.message}</p>
                          <p className="text-[9px] text-slate-400 mt-1">{formatIST(n.createdAt)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 p-1.5 rounded-2xl hover:bg-purple-50 border border-slate-200 hover:border-purple-300 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="hidden md:block text-left pr-1">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-brand-700 font-bold leading-tight">{user?.userCode || user?.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-purple-100 p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                  <div className="px-3 py-2 border-b border-purple-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[10px] font-mono text-brand-700 font-bold">User ID: {user?.userCode}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setShowProfileModal(true);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-brand-700 transition-colors text-left"
                  >
                    <UserIcon className="w-4 h-4 text-brand-600" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setShowSettingsModal(true);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-brand-700 transition-colors text-left"
                  >
                    <Sliders className="w-4 h-4 text-purple-600" />
                    <span>Account Settings</span>
                  </button>

                  <div className="border-t border-purple-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* User Profile View Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 border border-purple-100">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-bold text-slate-900">User Identity Profile</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center pb-2">
              <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md">
                {user?.name?.charAt(0)}
              </div>
              <h4 className="text-base font-bold text-slate-900 mt-3">{user?.name}</h4>
              <p className="text-xs font-mono font-bold text-brand-700 bg-purple-50 inline-block px-3 py-1 rounded-full border border-purple-200 mt-1">
                User ID: {user?.userCode || 'N/A'}
              </p>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-brand-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-desc font-semibold uppercase">College Email</p>
                  <p className="font-bold text-slate-900">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2 border-t border-slate-200">
                <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-desc font-semibold uppercase">System Role</p>
                  <p className="font-bold text-slate-900">{user?.role}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2 border-t border-slate-200">
                <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-desc font-semibold uppercase">Department / Programme</p>
                  <p className="font-bold text-slate-900">{user?.programmeName || user?.department || 'Institutional Global'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

      {/* Account Settings / Password Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-sm font-bold text-slate-900">Account Settings — Change Password</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordMsg.error && (
              <div className="p-3 rounded-lg bg-red-50 text-xs text-red-700 border border-red-200">
                {passwordMsg.error}
              </div>
            )}
            {passwordMsg.success && (
              <div className="p-3 rounded-lg bg-emerald-50 text-xs text-emerald-700 border border-emerald-200">
                {passwordMsg.success}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (Min 8 chars) *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
