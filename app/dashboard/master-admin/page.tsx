'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SyllabusPDFGenerator } from '@/components/pdf/SyllabusPDFGenerator';
import { formatIST } from '@/lib/time';
import {
  Building2,
  Users,
  Sliders,
  BookOpen,
  ShieldAlert,
  Plus,
  Edit,
  CheckCircle2,
  X,
  Save,
  Search,
  Sparkles,
  Edit2,
  ArrowRight,
  ShieldCheck,
  Check,
  Globe,
  Clock,
  Eye,
  UserCheck,
  Filter,
  FileCheck,
  AlertCircle,
  Trash2,
  KeyRound,
  RotateCcw,
  Settings,
  Lock,
  Calendar,
  MapPin,
  Layers,
} from 'lucide-react';

export default function MasterAdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [stages, setStages] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [regulations, setRegulations] = useState<any[]>([]);
  const [subjectTypes, setSubjectTypes] = useState<any[]>([]);
  const [sdgGoals, setSdgGoals] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [workflowData, setWorkflowData] = useState<any>({ subjects: [], extensionRequests: [], metrics: {} });
  const [settingsData, setSettingsData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalUserError, setModalUserError] = useState('');

  // Selected Syllabus for Inspection Modal
  const [selectedSyllabus, setSelectedSyllabus] = useState<any>(null);

  // Workflow Filters State
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterSem, setFilterSem] = useState('ALL');
  const [filterSearchText, setFilterSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // User Directory Filter State
  const [userSearchText, setUserSearchText] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userDeptFilter, setUserDeptFilter] = useState('ALL');

  // Department Modal State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [programmeType, setProgrammeType] = useState('B.E.');
  const [programmeName, setProgrammeName] = useState('');
  const [shortName, setShortName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [semesters, setSemesters] = useState(8);
  const [hodId, setHodId] = useState('');

  // User Create / Edit Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userCode, setUserCode] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('FACULTY');
  const [userDeptId, setUserDeptId] = useState('');
  const [userPassword, setUserPassword] = useState('Changeme@123');

  // Destructive Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'USER' | 'DEPT'; id: string; name: string } | null>(null);

  // Subject Type Code Edit Modal State
  const [showSubjectTypeModal, setShowSubjectTypeModal] = useState(false);
  const [editingSubjectType, setEditingSubjectType] = useState<any>(null);
  const [typeCodeValue, setTypeCodeValue] = useState(1);
  const [typeNameValue, setTypeNameValue] = useState('');

  // SDG Edit Modal State
  const [showSdgModal, setShowSdgModal] = useState(false);
  const [editingSdg, setEditingSdg] = useState<any>(null);
  const [sdgNameInput, setSdgNameInput] = useState('');

  // Credit Config Weights State
  const [calculationMethod, setCalculationMethod] = useState<'SUM' | 'WEIGHTED'>('SUM');
  const [lWeight, setLWeight] = useState(1.0);
  const [tWeight, setTWeight] = useState(1.0);
  const [pWeight, setPWeight] = useState(0.5);
  const [creditMsg, setCreditMsg] = useState('');

  // PO/PSO Config State
  const [selectedDeptForConfig, setSelectedDeptForConfig] = useState('');
  const [poCount, setPoCount] = useState(12);
  const [psoCount, setPsoCount] = useState(3);
  const [poMsg, setPoMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resDepts, resUsers, resRegs, resLogs, resCredit, resSdgs, resWorkflow, resSettings, resStages] = await Promise.all([
        fetch('/api/master-admin/departments'),
        fetch('/api/master-admin/users'),
        fetch('/api/master-admin/regulations'),
        fetch('/api/master-admin/audit-logs'),
        fetch('/api/master-admin/credit-config'),
        fetch('/api/master-admin/sdgs'),
        fetch('/api/master-admin/workflow'),
        fetch('/api/master-admin/settings'),
        fetch('/api/dean/stage'),
      ]);

      if (resStages.ok) {
        const data = await resStages.json();
        setStages(data.stages || []);
      }

      if (resDepts.ok) {
        const data = await resDepts.json();
        setDepartments(data.departments || []);
        if (data.departments?.length > 0 && !selectedDeptForConfig) {
          setSelectedDeptForConfig(data.departments[0].id);
        }
      }
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsers(data.users || []);
      }
      if (resRegs.ok) {
        const data = await resRegs.json();
        setRegulations(data.regulations || []);
        setSubjectTypes(data.subjectTypes || []);
      }
      if (resSdgs.ok) {
        const data = await resSdgs.json();
        setSdgGoals(data.sdgs || []);
      }
      if (resLogs.ok) {
        const data = await resLogs.json();
        setAuditLogs(data.logs || []);
      }
      if (resCredit.ok) {
        const data = await resCredit.json();
        if (data.config) {
          setCalculationMethod(data.config.calculationMethod || 'SUM');
          setLWeight(data.config.lWeight ?? 1.0);
          setTWeight(data.config.tWeight ?? 1.0);
          setPWeight(data.config.pWeight ?? 0.5);
        }
      }
      if (resWorkflow.ok) {
        const data = await resWorkflow.json();
        setWorkflowData(data);
      }
      if (resSettings.ok) {
        const data = await resSettings.json();
        setSettingsData(data.settings || {});
      }
    } catch (err) {
      setError('Failed to load MasterAdmin system metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/master-admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDept?.id,
          programmeType,
          programmeName,
          shortName,
          departmentCode,
          semesters,
          hodId: hodId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save department.');

      setShowDeptModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalUserError('');
    try {
      const payload: any = {
        action: editingUser ? 'EDIT_USER' : 'CREATE_USER',
        userId: editingUser?.id,
        userCode,
        email: userEmail,
        name: userName,
        role: userRole,
        departmentId: userDeptId || null,
        newPassword: userPassword,
      };

      const res = await fetch('/api/master-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save user account.');

      setShowUserModal(false);
      fetchData();
    } catch (err: any) {
      setModalUserError(err.message);
    }
  };

  const handleResetUserPassword = async (u: any) => {
    if (!confirm(`Reset password for ${u.name} (${u.email}) to 'Changeme@123'?`)) return;
    try {
      const res = await fetch('/api/master-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_PASSWORD', userId: u.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');
      alert(data.message || 'Password reset to Changeme@123');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!confirm(`Are you sure you want to delete user '${u.name}' (${u.userCode || u.email})? This action cannot be undone.`)) return;
    try {
      const res = await fetch('/api/master-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_USER', userId: u.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user.');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveSubjectTypeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubjectType) return;
    try {
      const res = await fetch('/api/master-admin/regulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EDIT_SUBJECT_TYPE',
          subjectTypeId: editingSubjectType.id,
          typeCode: typeCodeValue,
          typeName: typeNameValue,
        }),
      });

      if (res.ok) {
        setShowSubjectTypeModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update subject type code');
    }
  };

  const handleSaveSdgGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSdg) return;

    try {
      const res = await fetch('/api/master-admin/sdgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSdg.id,
          name: sdgNameInput,
        }),
      });

      if (res.ok) {
        setShowSdgModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update SDG Goal');
    }
  };

  const handleSaveCreditConfig = async () => {
    setCreditMsg('');
    try {
      const res = await fetch('/api/master-admin/credit-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calculationMethod, lWeight, tWeight, pWeight }),
      });
      if (res.ok) {
        setCreditMsg(`Credit calculation rule updated to ${calculationMethod === 'SUM' ? 'Direct Sum (C = L+T+P)' : 'Weighted Formula'}.`);
      }
    } catch (err) {
      console.error('Failed to update credit weights');
    }
  };

  const handleSavePOPSOConfig = async () => {
    if (!selectedDeptForConfig) return;
    setPoMsg('');
    try {
      const res = await fetch('/api/master-admin/po-pso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: selectedDeptForConfig,
          poCount,
          psoCount,
        }),
      });

      if (res.ok) {
        setPoMsg('PO / PSO Structure configuration updated successfully.');
      }
    } catch (err) {
      console.error('Failed to update PO/PSO config');
    }
  };

  const openAddDept = () => {
    setEditingDept(null);
    setProgrammeType('B.E.');
    setProgrammeName('');
    setShortName('');
    setDepartmentCode('');
    setSemesters(8);
    setHodId('');
    setShowDeptModal(true);
  };

  const openEditDept = (dept: any) => {
    setEditingDept(dept);
    setProgrammeType(dept.programmeType);
    setProgrammeName(dept.programmeName);
    setShortName(dept.shortName);
    setDepartmentCode(dept.departmentCode);
    setSemesters(dept.semesters);
    setHodId(dept.hodId || '');
    setShowDeptModal(true);
  };

  const openAddUser = () => {
    setEditingUser(null);
    setUserCode(`CS${101 + users.length}`);
    setUserEmail('');
    setUserName('');
    setUserRole('FACULTY');
    setUserDeptId(departments[0]?.id || '');
    setUserPassword('Changeme@123');
    setModalUserError('');
    setShowUserModal(true);
  };

  const openEditUser = (u: any) => {
    setEditingUser(u);
    setUserCode(u.userCode || '');
    setUserEmail(u.email || '');
    setUserName(u.name || '');
    setUserRole(u.role || 'FACULTY');
    setUserDeptId(u.departmentId || '');
    setUserPassword('');
    setModalUserError('');
    setShowUserModal(true);
  };

  const metrics = workflowData.metrics || {};
  const activeReg = regulations.find((r) => r.active) || regulations[0];

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearchText.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchText.toLowerCase()) ||
      (u.userCode && u.userCode.toLowerCase().includes(userSearchText.toLowerCase()));
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesDept = userDeptFilter === 'ALL' || u.departmentId === userDeptFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  // Filtered Workflow Subjects List
  const allWorkflowSubjects = workflowData.subjects || [];
  const filteredWorkflowSubjects = allWorkflowSubjects.filter((subj: any) => {
    const matchesDept = filterDept === 'ALL' || subj.departmentId === filterDept;
    const matchesSem = filterSem === 'ALL' || subj.semester === parseInt(filterSem);
    const matchesStatus = filterStatus === 'ALL' || subj.syllabusStatus === filterStatus;
    const matchesSearch =
      subj.subjectCode.toLowerCase().includes(filterSearchText.toLowerCase()) ||
      subj.subjectName.toLowerCase().includes(filterSearchText.toLowerCase());
    return matchesDept && matchesSem && matchesStatus && matchesSearch;
  });

  const renderVerticalStageProgress = () => {
    return (
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-purple-200">
        {stages.map((stg, idx) => {
          const isCompleted = stg.status === 'COMPLETED';
          const isActive = stg.status === 'ACTIVE';
          const isInactive = stg.status === 'INACTIVE';
          const isMeeting = stg.name.includes('DAC') || stg.name.includes('BoS');

          return (
            <div key={stg.id} className="relative flex items-start space-x-4">
              <div
                className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm'
                    : isActive
                    ? 'bg-brand-600 text-white ring-4 ring-purple-200 shadow-md animate-pulse'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : isActive ? (
                  <div className="w-2 h-2 rounded-full bg-white" />
                ) : (
                  <span className="text-[10px]">{idx + 1}</span>
                )}
              </div>

              <div className={`flex-1 p-4 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-purple-50/80 border-purple-300 shadow-sm ring-1 ring-purple-200'
                  : isCompleted
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-slate-50/50 border-slate-200 opacity-80'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-extrabold text-slate-900">{stg.name}</h4>
                      {isMeeting && isInactive ? (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Not Scheduled
                        </span>
                      ) : (
                        <StatusBadge status={stg.status} />
                      )}
                    </div>
                    {stg.description && <p className="text-xs text-desc mt-0.5">{stg.description}</p>}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-purple-100/60 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
                  {isMeeting ? (
                    <>
                      <div className="flex items-center space-x-1.5 font-medium">
                        <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                        <span>
                          Scheduled on: <strong>{stg.deadline ? formatIST(stg.deadline) : 'Not Scheduled'}</strong>
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 font-medium">
                        <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>
                          Venue: <strong>{stg.venue || 'Not Specified'}</strong>
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-1.5 font-medium">
                      <Clock className="w-4 h-4 text-brand-600 shrink-0" />
                      <span>
                        Deadline: <strong>{stg.deadline ? formatIST(stg.deadline) : 'Not Initiated'}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AppShell activeTab={activeTab} onTabChange={(tab) => {
      setSelectedSyllabus(null);
      setActiveTab(tab);
    }}>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* TAB 1: SYSTEM OVERVIEW (DASHBOARD) */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Overview</h1>
                <p className="text-xs text-desc mt-1">Complete control and configuration of the Regulation 26 academic management system.</p>
              </div>
              <div className="mt-3 md:mt-0 px-3 py-1.5 rounded-xl bg-purple-50 text-brand-800 border border-purple-200 text-xs font-bold flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Active Regulation: <strong>{activeReg?.displayName || 'Regulation 26'}</strong></span>
              </div>
            </div>

            {/* 8 SYSTEM KPI CARDS (Consolidated metrics from Database) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div onClick={() => setActiveTab('departments')} className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-1">
                <p className="text-[11px] uppercase font-bold text-slate-500">Departments / Programmes</p>
                <p className="text-2xl font-black text-slate-900">{metrics.departmentsCount ?? departments.length}</p>
                <span className="text-[11px] font-bold text-brand-600 flex items-center">View Programmes <ArrowRight className="w-3.5 h-3.5 ml-1" /></span>
              </div>

              <div onClick={() => setActiveTab('users')} className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-1">
                <p className="text-[11px] uppercase font-bold text-slate-500">Users</p>
                <p className="text-2xl font-black text-indigo-600">{metrics.usersCount ?? users.length}</p>
                <span className="text-[11px] font-bold text-brand-600 flex items-center">User Directory <ArrowRight className="w-3.5 h-3.5 ml-1" /></span>
              </div>

              <div onClick={() => setActiveTab('subjects')} className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-1">
                <p className="text-[11px] uppercase font-bold text-slate-500">Subjects</p>
                <p className="text-2xl font-black text-blue-600">{metrics.subjectsCount ?? allWorkflowSubjects.length}</p>
                <span className="text-[11px] font-bold text-brand-600 flex items-center">Subjects Master <ArrowRight className="w-3.5 h-3.5 ml-1" /></span>
              </div>

              <div onClick={() => setActiveTab('regulations')} className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-1">
                <p className="text-[11px] uppercase font-bold text-slate-500">Active Regulation</p>
                <p className="text-lg font-black text-brand-700 truncate">{metrics.activeRegCode ?? 'R2026'}</p>
                <span className="text-[11px] font-bold text-brand-600 flex items-center">Manage Regulations <ArrowRight className="w-3.5 h-3.5 ml-1" /></span>
              </div>

              <div onClick={() => setActiveTab('progress')} className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-1">
                <p className="text-[11px] uppercase font-bold text-slate-500">Syllabi In Progress</p>
                <p className="text-2xl font-black text-amber-600">{metrics.inProgressCount ?? 0}</p>
                <span className="text-[11px] font-bold text-brand-600 flex items-center">Track Progress <ArrowRight className="w-3.5 h-3.5 ml-1" /></span>
              </div>

              <div onClick={() => setActiveTab('review')} className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-1">
                <p className="text-[11px] uppercase font-bold text-slate-500">Awaiting HoD Approval</p>
                <p className="text-2xl font-black text-blue-600">{metrics.awaitingHodCount ?? 0}</p>
                <span className="text-[11px] font-bold text-brand-600 flex items-center">Review Queue <ArrowRight className="w-3.5 h-3.5 ml-1" /></span>
              </div>

              <div onClick={() => setActiveTab('review')} className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-1">
                <p className="text-[11px] uppercase font-bold text-slate-500">Awaiting Dean Approval</p>
                <p className="text-2xl font-black text-purple-600">{metrics.awaitingDeanCount ?? 0}</p>
                <span className="text-[11px] font-bold text-brand-600 flex items-center">Inspect Queue <ArrowRight className="w-3.5 h-3.5 ml-1" /></span>
              </div>

              <div onClick={() => setActiveTab('approved')} className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-1">
                <p className="text-[11px] uppercase font-bold text-slate-500">Approved Syllabi</p>
                <p className="text-2xl font-black text-emerald-600">{metrics.approvedCount ?? 0}</p>
                <span className="text-[11px] font-bold text-brand-600 flex items-center">Approved Directory <ArrowRight className="w-3.5 h-3.5 ml-1" /></span>
              </div>
            </div>

            {/* SYSTEM CONFIGURATION STATUS & QUICK ACTIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SYSTEM CONFIGURATION STATUS */}
              <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-2 text-brand-600" /> System Configuration Status
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Departments & Programmes</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center">
                      <Check className="w-3 h-3 mr-1" /> Configured
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">User Directory</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center">
                      <Check className="w-3 h-3 mr-1" /> Configured
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Regulations</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center">
                      <Check className="w-3 h-3 mr-1" /> Configured
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Subject Types</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center">
                      <Check className="w-3 h-3 mr-1" /> Configured
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Subject Categories</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center">
                      <Check className="w-3 h-3 mr-1" /> Configured
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Credit Weights</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center">
                      <Check className="w-3 h-3 mr-1" /> Configured
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">PO / PSO Structure</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center">
                      <Check className="w-3 h-3 mr-1" /> Configured
                    </span>
                  </div>
                </div>
              </div>

              {/* QUICK ADMIN ACTIONS */}
              <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">Quick Admin Actions</h3>
                <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                  <button onClick={openAddDept} className="p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl shadow-xs flex items-center justify-center space-x-2">
                    <Plus className="w-4 h-4" /><span>+ Add Department</span>
                  </button>
                  <button onClick={openAddUser} className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xs flex items-center justify-center space-x-2">
                    <Plus className="w-4 h-4" /><span>+ Add User</span>
                  </button>
                  <button onClick={() => setActiveTab('regulations')} className="p-3 bg-purple-50 hover:bg-purple-100 text-brand-700 border border-purple-200 rounded-2xl flex items-center justify-center space-x-2">
                    <Sliders className="w-4 h-4" /><span>+ Manage Regulations</span>
                  </button>
                  <button onClick={() => setActiveTab('regulations')} className="p-3 bg-purple-50 hover:bg-purple-100 text-brand-700 border border-purple-200 rounded-2xl flex items-center justify-center space-x-2">
                    <BookOpen className="w-4 h-4" /><span>+ Subject Types</span>
                  </button>
                  <button onClick={() => setActiveTab('creditconfig')} className="p-3 bg-purple-50 hover:bg-purple-100 text-brand-700 border border-purple-200 rounded-2xl flex items-center justify-center space-x-2">
                    <Sparkles className="w-4 h-4" /><span>+ Credit Weights</span>
                  </button>
                  <button onClick={() => setActiveTab('popso')} className="p-3 bg-purple-50 hover:bg-purple-100 text-brand-700 border border-purple-200 rounded-2xl flex items-center justify-center space-x-2">
                    <BookOpen className="w-4 h-4" /><span>+ Configure PO / PSO</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ACADEMIC WORKFLOW STAGE PROGRESS */}
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Layers className="w-4 h-4 mr-2 text-brand-600" /> Academic Workflow Stage Progress
              </h3>
              {renderVerticalStageProgress()}
            </div>

            {/* SYSTEM-WIDE ACADEMIC PROGRESS & RECENT ACTIVITY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SYSTEM-WIDE ACADEMIC PROGRESS */}
              <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">System-Wide Academic Progress</h3>
                  <button onClick={() => setActiveTab('progress')} className="text-xs font-bold text-brand-600 hover:underline">
                    View Full Progress →
                  </button>
                </div>
                <div className="space-y-3.5 text-xs">
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-slate-800">Curriculum Formation</span>
                      <span className="text-brand-700">{metrics.curriculumFormationPct ?? 100}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-brand-600 h-2 rounded-full" style={{ width: `${metrics.curriculumFormationPct ?? 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-slate-800">Faculty Assignment</span>
                      <span className="text-indigo-700">{metrics.facultyAssignmentPct ?? 85}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${metrics.facultyAssignmentPct ?? 85}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-slate-800">Faculty Syllabus Preparation</span>
                      <span className="text-amber-700">{metrics.facultySyllabusPct ?? 70}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${metrics.facultySyllabusPct ?? 70}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-slate-800">HoD Approval</span>
                      <span className="text-purple-700">{metrics.hodApprovalPct ?? 55}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${metrics.hodApprovalPct ?? 55}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-slate-800">Dean Approval (Final)</span>
                      <span className="text-emerald-700">{metrics.deanApprovalPct ?? 40}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${metrics.deanApprovalPct ?? 40}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RECENT SYSTEM ACTIVITY */}
              <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Recent System Activity</h3>
                  <button onClick={() => setActiveTab('audit')} className="text-xs font-bold text-brand-600 hover:underline">
                    View Audit Logs →
                  </button>
                </div>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="p-3 rounded-2xl bg-purple-50/30 border border-purple-100 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-desc">By: {log.user?.name || log.userId} ({log.userRole})</p>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">{formatIST(log.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: DEPARTMENTS & PROGRAMMES */}
        {activeTab === 'departments' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Departments & Academic Programmes Directory</h3>
                <p className="text-xs text-desc">Create, view, edit, and deactivate institutional academic programmes.</p>
              </div>
              <button onClick={openAddDept} className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs flex items-center">
                <Plus className="w-4 h-4 mr-1.5" /> Add Programme
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {departments.map((d) => (
                <div key={d.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-brand-700 uppercase bg-purple-100 px-2 py-0.5 rounded">
                      {d.programmeType} | Code: {d.departmentCode}
                    </span>
                    <button onClick={() => openEditDept(d)} className="text-xs font-bold text-brand-600 hover:underline">
                      Edit
                    </button>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{d.programmeName}</h4>
                    <p className="text-xs font-semibold text-desc">Short Name: {d.shortName}</p>
                  </div>
                  <div className="pt-2 border-t border-purple-100 text-xs text-slate-700 space-y-1">
                    <p><strong>Configured Semesters:</strong> {d.semesters}</p>
                    <p><strong>HoD:</strong> {d.hod ? `${d.hod.name} (${d.hod.userCode || 'N/A'})` : 'Unassigned'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: CURRICULUM */}
        {activeTab === 'curriculum' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Institutional Curriculum Structure</h3>
                <p className="text-xs text-desc">Curriculum formation tree across all programmes and semesters.</p>
              </div>

              <div className="flex items-center space-x-3">
                <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-1.5 text-xs font-bold border rounded-xl bg-purple-50 text-brand-900">
                  <option value="ALL">All Departments ({departments.length})</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.shortName} — {d.programmeName}</option>)}
                </select>
                <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)} className="px-3 py-1.5 text-xs font-bold border rounded-xl bg-purple-50 text-brand-900">
                  <option value="ALL">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-purple-50 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-3">Dept</th>
                    <th className="p-3">Subject Code</th>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">L-T-P-C</th>
                    <th className="p-3">Assigned Faculty</th>
                    <th className="p-3">Syllabus Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWorkflowSubjects.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{s.department?.shortName}</td>
                      <td className="p-3 font-mono font-bold text-brand-700">{s.subjectCode} <span className="text-[10px] text-slate-400">Sem {s.semester}</span></td>
                      <td className="p-3 font-bold text-slate-800">{s.subjectName}</td>
                      <td className="p-3 text-slate-600">{s.subjectType?.name}</td>
                      <td className="p-3 text-slate-600">{s.subjectCategory?.code}</td>
                      <td className="p-3 text-center font-semibold">{s.lecture}-{s.tutorial}-{s.practical}-{s.credits}</td>
                      <td className="p-3 font-semibold text-indigo-900">{s.assignedFaculty ? `${s.assignedFaculty.name} (${s.assignedFaculty.userCode})` : 'Unassigned'}</td>
                      <td className="p-3"><StatusBadge status={s.syllabusStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: SUBJECTS MASTER */}
        {activeTab === 'subjects' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Institutional Subjects Master Directory</h3>
                <p className="text-xs text-desc">Centralized subject database across Regulation 26.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search subject code or title..."
                  value={filterSearchText}
                  onChange={(e) => setFilterSearchText(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border rounded-xl"
                />
              </div>

              <div>
                <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-xl font-medium">
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.shortName} — {d.programmeName}</option>)}
                </select>
              </div>

              <div>
                <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-xl font-medium">
                  <option value="ALL">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-purple-50 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-3">Department</th>
                    <th className="p-3">Subject Code</th>
                    <th className="p-3">Subject Title</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">L-T-P-C</th>
                    <th className="p-3">Faculty</th>
                    <th className="p-3">Syllabus Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWorkflowSubjects.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{s.department?.shortName}</td>
                      <td className="p-3 font-mono font-bold text-brand-700">{s.subjectCode} <span className="text-[10px] text-slate-400">Sem {s.semester}</span></td>
                      <td className="p-3 font-bold text-slate-800">{s.subjectName}</td>
                      <td className="p-3 text-slate-600">{s.subjectType?.name}</td>
                      <td className="p-3 text-slate-600">{s.subjectCategory?.code}</td>
                      <td className="p-3 text-center font-semibold">{s.lecture}-{s.tutorial}-{s.practical}-{s.credits}</td>
                      <td className="p-3 font-semibold text-indigo-900">{s.assignedFaculty ? `${s.assignedFaculty.name} (${s.assignedFaculty.userCode})` : 'Unassigned'}</td>
                      <td className="p-3"><StatusBadge status={s.syllabusStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: USER DIRECTORY */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">User Directory — Complete Control</h3>
                <p className="text-xs text-desc">Search, filter, edit attributes, manage roles, and User IDs (`userCode`).</p>
              </div>
              <button onClick={openAddUser} className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs flex items-center shrink-0">
                <Plus className="w-4 h-4 mr-1.5" /> Add User Account
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by ID, name, or email..."
                  value={userSearchText}
                  onChange={(e) => setUserSearchText(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-brand-500"
                />
              </div>

              <div>
                <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl font-medium">
                  <option value="ALL">All Roles</option>
                  <option value="SUPERADMIN">Dean (SuperAdmin)</option>
                  <option value="MASTERADMIN">MasterAdmin</option>
                  <option value="HOD">HoD</option>
                  <option value="FACULTY">Faculty</option>
                </select>
              </div>

              <div>
                <select value={userDeptFilter} onChange={(e) => setUserDeptFilter(e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl font-medium">
                  <option value="ALL">All Depts</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.shortName} — {d.programmeName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-purple-50 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">User Name</th>
                    <th className="p-3">College Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-brand-700">{u.userCode || 'N/A'}</td>
                      <td className="p-3 font-bold text-slate-900">{u.name}</td>
                      <td className="p-3 text-slate-700">{u.email}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100">{u.role}</span></td>
                      <td className="p-3 text-slate-600">{u.department ? u.department.shortName : (u.role === 'MASTERADMIN' || u.role === 'SUPERADMIN' ? 'Institutional Global' : 'N/A')}</td>
                      <td className="p-3 text-right space-x-1">
                        <button onClick={() => openEditUser(u)} className="px-2.5 py-1 bg-brand-50 text-brand-800 font-bold rounded-lg border border-purple-200 text-xs inline-flex items-center">
                          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                        </button>
                        <button onClick={() => handleResetUserPassword(u)} title="Reset Password to Changeme@123" className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold rounded-lg border border-amber-200 text-xs inline-flex items-center">
                          <KeyRound className="w-3.5 h-3.5 mr-1" /> Reset Pass
                        </button>
                        <button onClick={() => handleDeleteUser(u)} title="Delete User Account" className="px-2.5 py-1 bg-red-50 text-red-700 font-bold rounded-lg border border-red-200 text-xs inline-flex items-center">
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: FACULTY ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Faculty Subject Assignments Directory</h3>
              <p className="text-xs text-desc">Workload distribution and course assignments across all departments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {users.filter((u) => u.role === 'FACULTY').map((f) => {
                const assigned = allWorkflowSubjects.filter((s: any) => s.assignedFacultyId === f.id);
                return (
                  <div key={f.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-brand-700 bg-purple-100 px-2 py-0.5 rounded">
                        {f.userCode || 'FACULTY'}
                      </span>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                        {assigned.length} Subject(s)
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{f.name}</h4>
                      <p className="text-xs text-desc">{f.email}</p>
                    </div>
                    {assigned.length > 0 && (
                      <div className="pt-2 border-t border-purple-100 text-xs space-y-1">
                        {assigned.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-slate-800">{s.subjectCode}</span>
                            <StatusBadge status={s.syllabusStatus} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: REGULATIONS & TYPES */}
        {activeTab === 'regulations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Academic Regulations Management</h3>
              <div className="space-y-3">
                {regulations.map((r) => (
                  <div key={r.id} className="p-4 border rounded-2xl flex items-center justify-between bg-slate-50">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{r.displayName}</span>
                      <span className="ml-2 text-xs text-desc">Code: {r.code}</span>
                    </div>
                    {r.active ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">
                        Current Active Regulation
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          await fetch('/api/master-admin/regulations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'SET_ACTIVE', regId: r.id }),
                          });
                          fetchData();
                        }}
                        className="px-3 py-1 text-xs font-semibold text-brand-700 bg-purple-50 hover:bg-purple-100 rounded-lg"
                      >
                        Make Active
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Subject Type Codes Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {subjectTypes.map((st) => (
                  <div key={st.id} className="p-4 border border-purple-100 rounded-2xl bg-purple-50/30 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{st.name}</h4>
                      <p className="text-[11px] font-mono text-brand-700">Code: <strong>{st.code}</strong></p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingSubjectType(st);
                        setTypeCodeValue(st.code);
                        setTypeNameValue(st.name);
                        setShowSubjectTypeModal(true);
                      }}
                      className="px-3 py-1 bg-brand-600 text-white font-bold text-xs rounded-lg flex items-center"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Code
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: CREDIT WEIGHTS */}
        {activeTab === 'creditconfig' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5 max-w-xl">
            <h3 className="text-base font-bold text-slate-900">Credit Calculation Formula Config</h3>
            {creditMsg && <div className="p-3 rounded-xl bg-emerald-50 text-xs text-emerald-700 border border-emerald-200">{creditMsg}</div>}
            <form onSubmit={(e) => { e.preventDefault(); handleSaveCreditConfig(); }} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lecture (L)</label>
                  <input type="number" step="0.1" required value={lWeight} onChange={(e) => setLWeight(parseFloat(e.target.value) || 1.0)} className="w-full p-2 text-xs border rounded-xl text-center font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tutorial (T)</label>
                  <input type="number" step="0.1" required value={tWeight} onChange={(e) => setTWeight(parseFloat(e.target.value) || 1.0)} className="w-full p-2 text-xs border rounded-xl text-center font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Practical (P)</label>
                  <input type="number" step="0.1" required value={pWeight} onChange={(e) => setPWeight(parseFloat(e.target.value) || 0.5)} className="w-full p-2 text-xs border rounded-xl text-center font-bold" />
                </div>
              </div>
              <div className="p-3 bg-purple-50 text-brand-800 rounded-xl text-xs font-semibold">
                Formula: Credits = (L × {lWeight}) + (T × {tWeight}) + (P × {pWeight})
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md">
                Save Credit Formula Config
              </button>
            </form>
          </div>
        )}

        {/* TAB: UN SDGS MASTER */}
        {activeTab === 'sdgs' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">17 UN Sustainable Development Goals (SDGs) Master</h3>
              <p className="text-xs text-desc">Institutional SDG goal definitions common across all college departments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sdgGoals.map((sdg) => (
                <div key={sdg.id} className="p-4 border border-purple-100 rounded-2xl bg-purple-50/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-brand-700 bg-purple-100 px-2 py-0.5 rounded">
                      SDG {sdg.sdgNumber}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{sdg.name}</h4>
                  </div>
                  <button
                    onClick={() => {
                      setEditingSdg(sdg);
                      setSdgNameInput(sdg.name);
                      setShowSdgModal(true);
                    }}
                    className="px-3 py-1 bg-brand-600 text-white font-bold text-xs rounded-lg flex items-center"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: PO / PSO CONFIG */}
        {activeTab === 'popso' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5 max-w-xl">
            <h3 className="text-base font-bold text-slate-900">PO & PSO Count Configuration</h3>
            {poMsg && <div className="p-3 rounded-xl bg-emerald-50 text-xs text-emerald-700 border border-emerald-200">{poMsg}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Department</label>
                <select value={selectedDeptForConfig} onChange={(e) => setSelectedDeptForConfig(e.target.value)} className="w-full p-2 text-xs border rounded-xl">
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.programmeName} ({d.shortName})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">POs Count</label>
                  <input type="number" value={poCount} onChange={(e) => setPoCount(parseInt(e.target.value) || 12)} className="w-full p-2 text-xs border rounded-xl font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PSOs Count</label>
                  <input type="number" value={psoCount} onChange={(e) => setPsoCount(parseInt(e.target.value) || 3)} className="w-full p-2 text-xs border rounded-xl font-bold" />
                </div>
              </div>
              <button onClick={handleSavePOPSOConfig} className="w-full py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs">
                Save PO / PSO Structure
              </button>
            </div>
          </div>
        )}

        {/* TAB: SYLLABUS PROGRESS */}
        {activeTab === 'progress' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Institutional Syllabus Progress Pipeline</h3>
              <p className="text-xs text-desc">Real-time status tracking for all Regulation 26 syllabi.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-purple-50 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-3">Department</th>
                    <th className="p-3">Subject Code</th>
                    <th className="p-3">Subject Title</th>
                    <th className="p-3">Assigned Faculty</th>
                    <th className="p-3">Syllabus Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allWorkflowSubjects.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{s.department?.shortName}</td>
                      <td className="p-3 font-mono font-bold text-brand-700">{s.subjectCode}</td>
                      <td className="p-3 font-bold text-slate-800">{s.subjectName}</td>
                      <td className="p-3 font-semibold text-indigo-900">{s.assignedFaculty ? s.assignedFaculty.name : 'Unassigned'}</td>
                      <td className="p-3"><StatusBadge status={s.syllabusStatus} /></td>
                      <td className="p-3 text-right">
                        {s.submission ? (
                          <button onClick={() => setSelectedSyllabus(s)} className="px-3 py-1 bg-brand-600 text-white font-bold text-xs rounded-lg shadow-xs">
                            Inspect Document
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No Draft Yet</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: SUBMITTED / REVIEW */}
        {activeTab === 'review' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Institutional Review Queue</h3>
              <p className="text-xs text-desc">Inspect all submitted, resubmitted, HoD approved, or returned syllabi.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allWorkflowSubjects
                .filter((s: any) => ['SUBMITTED', 'RESUBMITTED', 'HOD_APPROVED', 'RETURNED_FOR_CORRECTION', 'RETURNED_BY_DEAN'].includes(s.syllabusStatus))
                .map((s: any) => (
                  <div key={s.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-brand-700">{s.subjectCode}</span>
                        <StatusBadge status={s.syllabusStatus} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{s.subjectName}</h4>
                      <p className="text-xs text-desc">Dept: {s.department?.shortName} | Faculty: {s.assignedFaculty?.name}</p>
                    </div>
                    <button onClick={() => setSelectedSyllabus(s)} className="px-3 py-1.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs">
                      View Review
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB: APPROVED SYLLABI */}
        {activeTab === 'approved' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Approved Syllabi Directory</h3>
              <p className="text-xs text-desc">Full institutional archive of Dean approved syllabi documents.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allWorkflowSubjects.filter((s: any) => s.syllabusStatus === 'APPROVED').map((s: any) => (
                <div key={s.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      APPROVED | {s.subjectCode}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{s.subjectName}</h4>
                    <p className="text-[11px] text-desc">Dept: {s.department?.shortName} | Faculty: {s.assignedFaculty?.name}</p>
                  </div>
                  <button onClick={() => setSelectedSyllabus(s)} className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center">
                    <Eye className="w-3.5 h-3.5 mr-1" /> View Document
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: EXTENSION REQUESTS */}
        {activeTab === 'extension' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Institutional Extension Requests</h3>
              <p className="text-xs text-desc">Stage deadline extension requests across all college departments.</p>
            </div>

            <div className="space-y-3">
              {(workflowData.extensionRequests || []).map((req: any) => (
                <div key={req.id} className="p-4 rounded-2xl border border-purple-100 bg-purple-50/20 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-xs">{req.department?.programmeName} ({req.department?.shortName})</span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-desc mt-0.5">Requested by: {req.requestedBy?.name} | Deadline: {formatIST(req.requestedDeadline)}</p>
                    <p className="text-xs text-slate-700 mt-1 bg-white p-2.5 rounded-xl border border-purple-100">Reason: "{req.reason}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">System Audit Trail</h3>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-purple-50 text-slate-700 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">Timestamp (IST)</th>
                    <th className="p-2.5">User</th>
                    <th className="p-2.5">Role</th>
                    <th className="p-2.5">Action</th>
                    <th className="p-2.5">Entity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="p-2.5 text-slate-500 font-mono">{formatIST(log.createdAt)}</td>
                      <td className="p-2.5 font-bold text-slate-900">{log.user?.name || log.userId}</td>
                      <td className="p-2.5 text-slate-600">{log.userRole}</td>
                      <td className="p-2.5 font-bold text-brand-700">{log.action}</td>
                      <td className="p-2.5 text-slate-700">{log.entity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: SYSTEM SETTINGS (Section 29) */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-6 max-w-4xl">
            <div>
              <h3 className="text-base font-bold text-slate-900">Global System Settings</h3>
              <p className="text-xs text-desc">Configure institutional academic, subject, CO/PO, workflow, and platform parameters.</p>
            </div>

            <div className="space-y-6 text-xs">
              {/* Academic Settings */}
              <div className="p-5 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center">
                  <Sliders className="w-4 h-4 mr-2 text-brand-600" /> Academic Settings
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-desc font-semibold">Active Regulation</label>
                    <input type="text" readOnly value={settingsData.activeRegulation || 'Regulation 26'} className="w-full p-2 border rounded-xl bg-slate-100 font-bold" />
                  </div>
                  <div>
                    <label className="block text-desc font-semibold">Academic Year</label>
                    <input type="text" readOnly value={settingsData.academicYear || '2026–2027'} className="w-full p-2 border rounded-xl bg-slate-100 font-bold" />
                  </div>
                </div>
              </div>

              {/* Subject & Credit Calculation Formula Settings */}
              <div className="p-5 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-brand-600" /> Subject & Credit Formula Settings
                  </h4>
                  {creditMsg && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {creditMsg}
                    </span>
                  )}
                </div>

                <div className="p-4 bg-white rounded-xl border border-purple-100 space-y-3">
                  <label className="block font-bold text-slate-900">Credit Calculation Method (LTPC):</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCalculationMethod('SUM')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        calculationMethod === 'SUM'
                          ? 'bg-purple-100/70 border-brand-600 ring-2 ring-brand-500/20 text-brand-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <p className="font-extrabold text-xs">Method A: Direct Sum (Recommended)</p>
                      <p className="text-[11px] text-desc mt-0.5 font-normal">Formula: <code>C = L + T + P</code> (e.g. L=1, T=1, P=1 → C=3)</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCalculationMethod('WEIGHTED')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        calculationMethod === 'WEIGHTED'
                          ? 'bg-purple-100/70 border-brand-600 ring-2 ring-brand-500/20 text-brand-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <p className="font-extrabold text-xs">Method B: Weighted Formula</p>
                      <p className="text-[11px] text-desc mt-0.5 font-normal">Formula: <code>C = L*wL + T*wT + P*wP</code> (e.g. P=2 → 1.0 Credit)</p>
                    </button>
                  </div>

                  {calculationMethod === 'WEIGHTED' && (
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-desc font-semibold mb-1">Lecture Weight (wL)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={lWeight}
                          onChange={(e) => setLWeight(parseFloat(e.target.value) || 1.0)}
                          className="w-full p-2 border rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-desc font-semibold mb-1">Tutorial Weight (wT)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={tWeight}
                          onChange={(e) => setTWeight(parseFloat(e.target.value) || 1.0)}
                          className="w-full p-2 border rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-desc font-semibold mb-1">Practical Weight (wP)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={pWeight}
                          onChange={(e) => setPWeight(parseFloat(e.target.value) || 0.5)}
                          className="w-full p-2 border rounded-xl font-bold"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveCreditConfig}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center"
                    >
                      <Save className="w-3.5 h-3.5 mr-1.5" /> Save Credit Calculation Rule
                    </button>
                  </div>
                </div>
              </div>

              {/* Security & Audit */}
              <div className="p-5 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-2 text-brand-600" /> Platform Security & Audit
                </h4>
                <p className="text-slate-700">All administrative operations performed by MasterAdmin are logged permanently in the immutable System Audit Trail with IST timestamps.</p>
              </div>
            </div>
          </div>
        )}

        {/* Syllabus Inspection Modal */}
        {selectedSyllabus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900">MasterAdmin Syllabus Inspection — {selectedSyllabus.subjectCode}</h3>
                  <StatusBadge status={selectedSyllabus.syllabusStatus} />
                </div>
                <button onClick={() => setSelectedSyllabus(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <SyllabusPDFGenerator
                subject={selectedSyllabus}
                submission={selectedSyllabus.submission}
                documentTitle="MasterAdmin Syllabus Inspection"
                hideJustifications={false}
              />
            </div>
          </div>
        )}

        {/* SDG Edit Modal */}
        {showSdgModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">Edit UN SDG Goal {editingSdg?.sdgNumber}</h3>
              <form onSubmit={handleSaveSdgGoal} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">SDG Name / Theme *</label>
                  <input type="text" required value={sdgNameInput} onChange={(e) => setSdgNameInput(e.target.value)} className="w-full p-2 border rounded-xl font-bold" />
                </div>
                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button type="button" onClick={() => setShowSdgModal(false)} className="px-3 py-1.5 rounded-xl text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded-xl bg-brand-600 text-white font-bold">Save SDG Goal</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Create / Edit Modal */}
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? 'Edit User Account & Attributes' : 'Create New User Account'}
              </h3>

              {modalUserError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1.5 text-red-500 shrink-0" />
                  <span>{modalUserError}</span>
                </div>
              )}

              <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">User ID (userCode) *</label>
                  <input type="text" required value={userCode} onChange={(e) => setUserCode(e.target.value)} className="w-full p-2 border rounded-xl font-mono font-bold text-brand-700" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Full Name *</label>
                  <input type="text" required value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">College Email (@rajalakshmi.edu.in) *</label>
                  <input type="email" required value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="w-full p-2 border rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Role *</label>
                    <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className="w-full p-2 border rounded-xl">
                      <option value="FACULTY">Faculty</option>
                      <option value="HOD">HoD</option>
                      <option value="MASTERADMIN">MasterAdmin</option>
                      <option value="SUPERADMIN">Dean</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Department</label>
                    <select value={userDeptId} onChange={(e) => setUserDeptId(e.target.value)} className="w-full p-2 border rounded-xl">
                      <option value="">Global (No Department)</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.shortName}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">{editingUser ? 'New Password (Optional)' : 'Initial Password *'}</label>
                  <input type="password" required={!editingUser} value={userPassword} onChange={(e) => setUserPassword(e.target.value)} className="w-full p-2 border rounded-xl" />
                </div>
                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button type="button" onClick={() => setShowUserModal(false)} className="px-3 py-1.5 rounded-xl text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded-xl bg-brand-600 text-white font-bold">{editingUser ? 'Update User' : 'Create Account'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Subject Type Code Edit Modal */}
        {showSubjectTypeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">Edit Subject Type Code</h3>
              <form onSubmit={handleSaveSubjectTypeCode} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Subject Type Name *</label>
                  <input type="text" required value={typeNameValue} onChange={(e) => setTypeNameValue(e.target.value)} className="w-full p-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Integer Code *</label>
                  <input type="number" required min="1" max="99" value={typeCodeValue} onChange={(e) => setTypeCodeValue(parseInt(e.target.value) || 1)} className="w-full p-2 border rounded-xl font-bold" />
                </div>
                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button type="button" onClick={() => setShowSubjectTypeModal(false)} className="px-3 py-1.5 rounded-xl text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded-xl bg-brand-600 text-white font-bold">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Department Modal */}
        {showDeptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">{editingDept ? 'Edit Department' : 'Create Department'}</h3>
              <form onSubmit={handleSaveDepartment} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Programme Type *</label>
                  <select value={programmeType} onChange={(e) => setProgrammeType(e.target.value)} className="w-full p-2 border rounded-xl">
                    <option value="B.E.">B.E.</option>
                    <option value="B.Tech.">B.Tech.</option>
                    <option value="M.E.">M.E.</option>
                    <option value="M.Tech.">M.Tech.</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Programme Name *</label>
                  <input type="text" required value={programmeName} onChange={(e) => setProgrammeName(e.target.value)} className="w-full p-2 border rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Short Name *</label>
                    <input type="text" required value={shortName} onChange={(e) => setShortName(e.target.value)} className="w-full p-2 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Department Code *</label>
                    <input type="text" required value={departmentCode} onChange={(e) => setDepartmentCode(e.target.value)} className="w-full p-2 border rounded-xl uppercase" />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Semesters *</label>
                  <input type="number" required min="1" max="10" value={semesters} onChange={(e) => setSemesters(parseInt(e.target.value) || 8)} className="w-full p-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Head of Department (HoD) <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <select value={hodId} onChange={(e) => setHodId(e.target.value)} className="w-full p-2 border rounded-xl">
                    <option value="">No HoD Assigned (Unassigned)</option>
                    {users.filter((u) => u.role === 'HOD' || u.role === 'FACULTY').map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.userCode || u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button type="button" onClick={() => setShowDeptModal(false)} className="px-3 py-1.5 rounded-xl text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded-xl bg-brand-600 text-white font-bold">Save Department</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
