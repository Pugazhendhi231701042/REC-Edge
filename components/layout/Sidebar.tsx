'use client';

import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Sliders,
  CheckCircle2,
  FileCheck,
  ShieldAlert,
  BookOpen,
  Settings,
  History,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface SidebarProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
  departmentName?: string;
  onLogout?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole = 'FACULTY',
  userName,
  userEmail,
  departmentName,
  onLogout,
  activeTab = 'overview',
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
      title: 'ACADEMIC GOVERNANCE',
      items: [
        { id: 'stages', label: 'Academic Stages', icon: <Layers className="w-4 h-4" /> },
        { id: 'departments', label: 'Departments & Programmes', icon: <Building2 className="w-4 h-4" /> },
        { id: 'progress', label: 'Department Progress', icon: <CheckCircle2 className="w-4 h-4" /> },
      ],
    },
    {
      title: 'REVIEWS & APPROVALS',
      items: [
        { id: 'approved', label: 'Approved Syllabi Directory', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'reviews', label: 'Pending Dean Reviews', icon: <FileCheck className="w-4 h-4" /> },
        { id: 'extensions', label: 'Extension Requests', icon: <ShieldAlert className="w-4 h-4" /> },
      ],
    },
  ];

  const getMasterAdminSections = () => [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'overview', label: 'Control Center Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      title: 'ORGANIZATION',
      items: [
        { id: 'departments', label: 'Departments & Programmes', icon: <Building2 className="w-4 h-4" /> },
      ],
    },
    {
      title: 'USERS & ACCESS',
      items: [
        { id: 'users', label: 'User Directory', icon: <Users className="w-4 h-4" /> },
      ],
    },
    {
      title: 'ACADEMIC CONFIGURATION',
      items: [
        { id: 'regulations', label: 'Regulations & Types', icon: <Sliders className="w-4 h-4" /> },
        { id: 'creditconfig', label: 'Credit Weights Config', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'popso', label: 'PO / PSO Structure', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'sdgs', label: 'Global SDGs Master', icon: <BookOpen className="w-4 h-4" /> },
      ],
    },
    {
      title: 'SYLLABUS MONITORING',
      items: [
        { id: 'workflow', label: 'System Syllabus Tracker', icon: <CheckCircle2 className="w-4 h-4" /> },
        { id: 'approved', label: 'Approved Syllabi Archive', icon: <BookOpen className="w-4 h-4" /> },
      ],
    },
    {
      title: 'REQUESTS',
      items: [
        { id: 'extensions', label: 'Extension Requests Log', icon: <ShieldAlert className="w-4 h-4" /> },
      ],
    },
    {
      title: 'SECURITY & SYSTEM',
      items: [
        { id: 'auditlogs', label: 'Audit Trail Logs', icon: <History className="w-4 h-4" /> },
        { id: 'settings', label: 'System Configuration', icon: <Settings className="w-4 h-4" /> },
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
      title: 'CURRICULUM & FACULTY',
      items: [
        { id: 'curriculum', label: 'Department Curriculum', icon: <Building2 className="w-4 h-4" /> },
        { id: 'assignments', label: 'Faculty Assignments', icon: <Users className="w-4 h-4" /> },
      ],
    },
    {
      title: 'REVIEW & APPROVALS',
      items: [
        { id: 'review', label: 'Submissions Review', icon: <FileCheck className="w-4 h-4" /> },
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
        { id: 'review', label: 'Submitted / Review', icon: <FileCheck className="w-4 h-4" /> },
        { id: 'approved', label: 'Approved Syllabi', icon: <CheckCircle2 className="w-4 h-4" /> },
      ],
    },
  ];

  let sections = getFacultySections();
  if (userRole === 'SUPERADMIN') sections = getDeanSections();
  else if (userRole === 'MASTERADMIN') sections = getMasterAdminSections();
  else if (userRole === 'HOD') sections = getHoDSections();

  return (
    <aside className="w-64 bg-white border-r border-purple-100 flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Branding Header */}
      <div className="p-5 border-b border-purple-100 flex items-center space-x-3">
        <img
          src="/assets/logo.svg"
          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          alt="REC Logo"
          className="h-9 w-auto object-contain shrink-0"
        />
        <div>
          <h2 className="font-extrabold text-sm text-slate-900 tracking-tight leading-none">
            REC <span className="text-brand-600">EDGE</span>
          </h2>
          <p className="text-[10px] font-bold text-desc mt-1">Regulation 26</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {sectionGroups(sections, activeTab, onTabChange)}
      </div>

      {/* Sidebar Bottom Footer (ACY 2026-2027) */}
      <div className="p-4 border-t border-purple-100 bg-purple-50/40 text-center">
        <p className="text-[11px] font-bold text-slate-800">ACY 2026–2027</p>
        <p className="text-[10px] text-desc font-medium">Curriculum Management Portal</p>
      </div>
    </aside>
  );
};

function sectionGroups(sections: any[], activeTab?: string, onTabChange?: (tab: string) => void) {
  return sections.map((section, sIdx) => (
    <div key={sIdx} className="space-y-1">
      <p className="px-3 text-[10px] uppercase font-black text-slate-400 tracking-wider">
        {section.title}
      </p>
      {section.items.map((item: any) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange && onTabChange(item.id)}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              isActive
                ? 'bg-purple-100/80 text-brand-800 shadow-xs ring-1 ring-purple-200'
                : 'text-slate-600 hover:bg-purple-50/50 hover:text-brand-700'
            }`}
          >
            <span className={isActive ? 'text-brand-600' : 'text-slate-400'}>
              {item.icon}
            </span>
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  ));
}
