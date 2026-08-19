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
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole,
  userName,
  userEmail,
  departmentName,
  onLogout,
}) => {
  const pathname = usePathname();

  const getNavItems = () => {
    switch (userRole) {
      case 'SUPERADMIN':
        return [
          { label: 'Institutional Overview', href: '/dashboard/dean', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Academic Stages', href: '/dashboard/dean?tab=stages', icon: <Layers className="w-4 h-4" /> },
          { label: 'Departments Progress', href: '/dashboard/dean?tab=departments', icon: <Building2 className="w-4 h-4" /> },
          { label: 'Approved Syllabi', href: '/dashboard/dean?tab=approved', icon: <FileCheck className="w-4 h-4" /> },
          { label: 'Extension Requests', href: '/dashboard/dean?tab=extensions', icon: <ShieldAlert className="w-4 h-4" /> },
        ];
      case 'MASTERADMIN':
        return [
          { label: 'Admin Dashboard', href: '/dashboard/master-admin', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Departments & HoDs', href: '/dashboard/master-admin?tab=departments', icon: <Building2 className="w-4 h-4" /> },
          { label: 'User Directory', href: '/dashboard/master-admin?tab=users', icon: <Users className="w-4 h-4" /> },
          { label: 'Regulations', href: '/dashboard/master-admin?tab=regulations', icon: <Sliders className="w-4 h-4" /> },
          { label: 'PO / PSO Config', href: '/dashboard/master-admin?tab=popso', icon: <BookOpen className="w-4 h-4" /> },
          { label: 'Audit Logs', href: '/dashboard/master-admin?tab=audit', icon: <ShieldAlert className="w-4 h-4" /> },
        ];
      case 'HOD':
        return [
          { label: 'Department Dashboard', href: '/dashboard/hod', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Curriculum Builder', href: '/dashboard/hod?tab=curriculum', icon: <BookOpen className="w-4 h-4" /> },
          { label: 'Faculty Assignments', href: '/dashboard/hod?tab=assign', icon: <Users className="w-4 h-4" /> },
          { label: 'Syllabus Review', href: '/dashboard/hod?tab=review', icon: <FileCheck className="w-4 h-4" /> },
          { label: 'Extension Request', href: '/dashboard/hod?tab=extension', icon: <ShieldAlert className="w-4 h-4" /> },
        ];
      case 'FACULTY':
      default:
        return [
          { label: 'My Assigned Subjects', href: '/dashboard/faculty', icon: <BookOpen className="w-4 h-4" /> },
          { label: 'Draft Syllabi', href: '/dashboard/faculty?tab=drafts', icon: <FileCheck className="w-4 h-4" /> },
          { label: 'Completed Syllabi', href: '/dashboard/faculty?tab=completed', icon: <CheckCircleIcon className="w-4 h-4" /> },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col justify-between p-4 shadow-xl select-none">
      <div>
        {/* Institutional Identity */}
        <div className="pb-5 mb-5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-brand-600/30">
              R26
            </div>
            <div>
              <h1 className="text-xs font-bold uppercase tracking-wider text-slate-200 leading-tight">REC Edge</h1>
              <p className="text-[10px] text-purple-300 font-medium">Curriculum Management System</p>
            </div>
          </div>
          {departmentName && (
            <div className="mt-3 px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-semibold text-purple-200 border border-slate-700">
              Dept: {departmentName}
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Navigation</p>
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href || (item.href.includes('?') && pathname.includes(item.href.split('?')[0]));
            return (
              <Link
                key={idx}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-bold text-slate-100 truncate">{userName}</p>
            <p className="text-[10px] text-purple-300 font-medium uppercase tracking-wider">{userRole}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 rounded-xl border border-red-900/30 transition-colors"
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
