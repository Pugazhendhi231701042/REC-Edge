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
  UserCheck,
  Clock,
  Globe,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  userRole: string;
  userName?: string;
  userEmail?: string;
  departmentName?: string;
  onLogout?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole,
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
        { id: 'curriculum', label: 'Curriculum', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'subjects', label: 'Subjects Master', icon: <Building2 className="w-4 h-4" /> },
      ],
    },
    {
      title: 'USERS & ACCESS',
      items: [
        { id: 'users', label: 'User Directory', icon: <Users className="w-4 h-4" /> },
        { id: 'assignments', label: 'Faculty Assignments', icon: <UserCheck className="w-4 h-4" /> },
      ],
    },
    {
      title: 'ACADEMIC CONFIGURATION',
      items: [
        { id: 'regulations', label: 'Regulations & Types', icon: <Sliders className="w-4 h-4" /> },
        { id: 'creditconfig', label: 'Credit Weights', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'sdgs', label: 'UN 17 SDGs Master', icon: <Globe className="w-4 h-4" /> },
        { id: 'popso', label: 'PO / PSO Configuration', icon: <BookOpen className="w-4 h-4" /> },
      ],
    },
    {
      title: 'SYLLABUS MONITORING',
      items: [
        { id: 'progress', label: 'Syllabus Progress', icon: <Clock className="w-4 h-4" /> },
        { id: 'review', label: 'Submitted / Review', icon: <FileCheck className="w-4 h-4" /> },
        { id: 'approved', label: 'Approved Syllabi', icon: <CheckCircle2 className="w-4 h-4" /> },
      ],
    },
    {
      title: 'REQUESTS',
      items: [
        { id: 'extension', label: 'Extension Requests', icon: <ShieldAlert className="w-4 h-4" /> },
      ],
    },
    {
      title: 'SECURITY & SYSTEM',
      items: [
        { id: 'audit', label: 'Audit Logs', icon: <ShieldAlert className="w-4 h-4" /> },
        { id: 'settings', label: 'System Settings', icon: <Settings className="w-4 h-4" /> },
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
