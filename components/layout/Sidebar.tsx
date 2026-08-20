import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  Sliders,
  Layers,
  FileCheck,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Eye,
  LogOut,
  UserCheck,
  Clock,
  Send,
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
  const getDeanSections = () => [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'overview', label: 'Institutional Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      title: 'ACADEMIC MANAGEMENT',
      items: [
        { id: 'stages', label: 'Academic Stages', icon: <Layers className="w-4 h-4" /> },
        { id: 'departments', label: 'Departments & Programmes', icon: <Building2 className="w-4 h-4" /> },
        { id: 'progress', label: 'Department Progress', icon: <FileCheck className="w-4 h-4" /> },
      ],
    },
    {
      title: 'SYLLABUS',
      items: [
        { id: 'approved', label: 'Approved Syllabi', icon: <CheckCircle2 className="w-4 h-4" /> },
        { id: 'reviews', label: 'Syllabus Reviews', icon: <Eye className="w-4 h-4" /> },
      ],
    },
    {
      title: 'REQUESTS',
      items: [
        { id: 'extensions', label: 'Extension Requests', icon: <ShieldAlert className="w-4 h-4" /> },
      ],
    },
  ];

  const getMasterAdminSections = () => [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'overview', label: 'System Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      title: 'ORGANIZATION',
      items: [
        { id: 'departments', label: 'Departments & Programmes', icon: <Building2 className="w-4 h-4" /> },
        { id: 'users', label: 'User Directory', icon: <Users className="w-4 h-4" /> },
      ],
    },
    {
      title: 'ACADEMIC CONFIGURATION',
      items: [
        { id: 'regulations', label: 'Regulations & Types', icon: <Sliders className="w-4 h-4" /> },
        { id: 'creditconfig', label: 'Credit Weights', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'popso', label: 'PO / PSO Configuration', icon: <BookOpen className="w-4 h-4" /> },
      ],
    },
    {
      title: 'SECURITY & MONITORING',
      items: [
        { id: 'audit', label: 'Audit Logs', icon: <ShieldAlert className="w-4 h-4" /> },
      ],
    },
  ];

  const getHoDSections = () => [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'overview', label: 'Department Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      title: 'CURRICULUM',
      items: [
        { id: 'curriculum', label: 'Curriculum', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'subjects', label: 'Subjects Master', icon: <Building2 className="w-4 h-4" /> },
        { id: 'assignments', label: 'Faculty Assignments', icon: <UserCheck className="w-4 h-4" /> },
      ],
    },
    {
      title: 'SYLLABUS',
      items: [
        { id: 'progress', label: 'Syllabus Progress', icon: <Clock className="w-4 h-4" /> },
        { id: 'review', label: 'Submitted / Review', icon: <FileCheck className="w-4 h-4" /> },
        { id: 'approved', label: 'Approved Syllabi', icon: <CheckCircle2 className="w-4 h-4" /> },
      ],
    },
    {
      title: 'REQUESTS',
      items: [
        { id: 'extension', label: 'Extension Request', icon: <ShieldAlert className="w-4 h-4" /> },
      ],
    },
  ];

  const getFacultySections = () => [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'overview', label: 'My Workspace', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      title: 'SYLLABUS',
      items: [
        { id: 'subjects', label: 'My Subjects', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'review', label: 'Submitted / Review', icon: <Send className="w-4 h-4" /> },
        { id: 'approved', label: 'Approved Syllabi', icon: <CheckCircle2 className="w-4 h-4" /> },
      ],
    },
  ];

  let sections = getFacultySections();
  if (userRole === 'SUPERADMIN') sections = getDeanSections();
  else if (userRole === 'MASTERADMIN') sections = getMasterAdminSections();
  else if (userRole === 'HOD') sections = getHoDSections();

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

        {/* Structured Navigation */}
        <div className="space-y-4">
          {sections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sec.title}</p>
              {sec.items.map((item) => {
                const isTabActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange && onTabChange(item.id)}
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
          ))}
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
