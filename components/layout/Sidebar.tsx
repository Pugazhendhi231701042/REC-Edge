import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  Settings,
  Layers,
  FileCheck,
  ShieldAlert,
  Bell,
  Sliders,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  userRole: string;
  userName: string;
  userEmail: string;
  departmentName?: string;
  onLogout: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole,
  userName,
  userEmail,
  departmentName,
  onLogout,
  activeTab,
  onTabChange,
}) => {
  const pathname = usePathname();

  const getNavItems = () => {
    switch (userRole) {
      case 'SUPERADMIN':
        return [
          { id: 'overview', label: 'Institutional Overview', href: '/dashboard/dean', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'stages', label: 'Academic Stages', href: '/dashboard/dean?tab=stages', icon: <Layers className="w-4 h-4" /> },
          { id: 'departments', label: 'Departments Progress', href: '/dashboard/dean?tab=departments', icon: <Building2 className="w-4 h-4" /> },
          { id: 'approved', label: 'Approved Syllabi', href: '/dashboard/dean?tab=approved', icon: <FileCheck className="w-4 h-4" /> },
          { id: 'extensions', label: 'Extension Requests', href: '/dashboard/dean?tab=extensions', icon: <ShieldAlert className="w-4 h-4" /> },
        ];
      case 'MASTERADMIN':
        return [
          { id: 'departments', label: 'Departments & HoDs', href: '/dashboard/master-admin?tab=departments', icon: <Building2 className="w-4 h-4" /> },
          { id: 'users', label: 'User Directory', href: '/dashboard/master-admin?tab=users', icon: <Users className="w-4 h-4" /> },
          { id: 'regulations', label: 'Regulations & Types', href: '/dashboard/master-admin?tab=regulations', icon: <Sliders className="w-4 h-4" /> },
          { id: 'creditconfig', label: 'Credit Weights Config', href: '/dashboard/master-admin?tab=creditconfig', icon: <Sparkles className="w-4 h-4" /> },
          { id: 'popso', label: 'PO / PSO Config', href: '/dashboard/master-admin?tab=popso', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'audit', label: 'Audit Logs', href: '/dashboard/master-admin?tab=audit', icon: <ShieldAlert className="w-4 h-4" /> },
        ];
      case 'HOD':
        return [
          { id: 'dashboard', label: 'Department Overview', href: '/dashboard/hod', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'curriculum', label: 'Curriculum Builder', href: '/dashboard/hod?tab=curriculum', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'assign', label: 'Faculty Assignments', href: '/dashboard/hod?tab=assign', icon: <Users className="w-4 h-4" /> },
          { id: 'review', label: 'Syllabus Review', href: '/dashboard/hod?tab=review', icon: <FileCheck className="w-4 h-4" /> },
          { id: 'extension', label: 'Extension Request', href: '/dashboard/hod?tab=extension', icon: <ShieldAlert className="w-4 h-4" /> },
        ];
      case 'FACULTY':
      default:
        return [
          { id: 'assigned', label: 'My Assigned Subjects', href: '/dashboard/faculty', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'drafts', label: 'Draft Syllabi', href: '/dashboard/faculty?tab=drafts', icon: <FileCheck className="w-4 h-4" /> },
          { id: 'completed', label: 'Completed Syllabi', href: '/dashboard/faculty?tab=completed', icon: <CheckCircleIcon className="w-4 h-4" /> },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col justify-between p-4 shadow-xl select-none shrink-0 border-r border-slate-800">
      <div>
        {/* Institutional Logo & Identity Header */}
        <div className="pb-5 mb-5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <img src="/assets/logo.svg" alt="REC Edge Logo" className="w-10 h-10 object-contain rounded-xl" />
            <div>
              <h1 className="text-sm font-black tracking-wider text-white">REC EDGE</h1>
              <p className="text-[10px] text-purple-300 font-bold uppercase tracking-widest">REGULATION 26</p>
            </div>
          </div>
          {departmentName && (
            <div className="mt-3 px-3 py-1 rounded-lg bg-slate-800/90 text-[11px] font-semibold text-purple-200 border border-slate-700/60">
              Dept: {departmentName}
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Main Navigation</p>
          {navItems.map((item) => {
            const isTabActive = activeTab ? activeTab === item.id : pathname === item.href;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (onTabChange) {
                    onTabChange(item.id);
                  }
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  isTabActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-bold text-slate-100 truncate">{userName}</p>
            <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">{userRole}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-950/40 rounded-xl border border-red-900/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
