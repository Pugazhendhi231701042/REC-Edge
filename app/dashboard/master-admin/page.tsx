'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/common/StatCard';
import { formatIST } from '@/lib/time';
import {
  Building2,
  Users,
  Sliders,
  BookOpen,
  ShieldAlert,
  Plus,
  Key,
  CheckCircle2,
  X,
  Save,
  Search,
  Sparkles,
  Edit2,
} from 'lucide-react';

export default function MasterAdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>('departments');
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [regulations, setRegulations] = useState<any[]>([]);
  const [subjectTypes, setSubjectTypes] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // User Create / Password Reset Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('FACULTY');
  const [userDeptId, setUserDeptId] = useState('');
  const [userPassword, setUserPassword] = useState('Changeme@123');

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<any>(null);
  const [resetPassword, setResetPassword] = useState('Changeme@123');

  // Subject Type Code Edit Modal State
  const [showSubjectTypeModal, setShowSubjectTypeModal] = useState(false);
  const [editingSubjectType, setEditingSubjectType] = useState<any>(null);
  const [typeCodeValue, setTypeCodeValue] = useState(1);
  const [typeNameValue, setTypeNameValue] = useState('');

  // Credit Config Weights State
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
      const [resDepts, resUsers, resRegs, resLogs, resCredit] = await Promise.all([
        fetch('/api/master-admin/departments'),
        fetch('/api/master-admin/users'),
        fetch('/api/master-admin/regulations'),
        fetch('/api/master-admin/audit-logs'),
        fetch('/api/master-admin/credit-config'),
      ]);

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
      if (resLogs.ok) {
        const data = await resLogs.json();
        setAuditLogs(data.logs || []);
      }
      if (resCredit.ok) {
        const data = await resCredit.json();
        if (data.config) {
          setLWeight(data.config.lWeight ?? 1.0);
          setTWeight(data.config.tWeight ?? 1.0);
          setPWeight(data.config.pWeight ?? 0.5);
        }
      }
    } catch (err) {
      setError('Failed to load MasterAdmin data.');
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/master-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          role: userRole,
          departmentId: userDeptId || null,
          newPassword: userPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user.');

      setShowUserModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/master-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_PASSWORD',
          userId: resetTargetUser?.id,
          newPassword: resetPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');

      setShowResetModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
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

  const handleSaveCreditWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreditMsg('');
    try {
      const res = await fetch('/api/master-admin/credit-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lWeight, tWeight, pWeight }),
      });
      if (res.ok) {
        setCreditMsg('Credit calculation weights updated successfully.');
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
        setPoMsg('PO / PSO Configuration updated successfully.');
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

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Master Administration</h1>
            <p className="text-xs text-desc mt-1">Manage Departments, Users, User IDs, Subject Type Codes, Credit Multipliers, and PO/PSO Structures</p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center space-x-2 border-b border-purple-100 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'departments' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
            }`}
          >
            🏛️ Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
            }`}
          >
            👥 User Directory ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('regulations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'regulations' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
            }`}
          >
            📋 Regulations & Types
          </button>
          <button
            onClick={() => setActiveTab('creditconfig')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'creditconfig' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
            }`}
          >
            ✨ Credit Weights Config
          </button>
          <button
            onClick={() => setActiveTab('popso')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'popso' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
            }`}
          >
            🎯 PO / PSO Config
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
            }`}
          >
            📜 Audit Logs
          </button>
        </div>

        {/* TAB 1: DEPARTMENTS */}
        {activeTab === 'departments' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Academic Departments</h3>
              <button
                onClick={openAddDept}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs flex items-center"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Department
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
                    <p><strong>Faculty Count:</strong> {d._count?.users || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: USER DIRECTORY & FILTERING */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">User Directory</h3>
                <p className="text-xs text-desc">Search and filter institutional user accounts and human-readable User IDs.</p>
              </div>
              <button
                onClick={() => {
                  setUserEmail('');
                  setUserName('');
                  setUserRole('FACULTY');
                  setUserDeptId(departments[0]?.id || '');
                  setUserPassword('Changeme@123');
                  setShowUserModal(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs flex items-center shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add User Account
              </button>
            </div>

            {/* Filter Bar Controls */}
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
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-brand-500 font-medium"
                >
                  <option value="ALL">Filter by Role (All Roles)</option>
                  <option value="SUPERADMIN">Dean (SuperAdmin)</option>
                  <option value="MASTERADMIN">MasterAdmin</option>
                  <option value="HOD">HoD</option>
                  <option value="FACULTY">Faculty</option>
                </select>
              </div>

              <div>
                <select
                  value={userDeptFilter}
                  onChange={(e) => setUserDeptFilter(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-brand-500 font-medium"
                >
                  <option value="ALL">Filter by Department (All Depts)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.shortName} — {d.programmeName}
                    </option>
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
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-desc text-xs">
                        No users match the selected search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-brand-700">{u.userCode || 'N/A'}</td>
                        <td className="p-3 font-bold text-slate-900">{u.name}</td>
                        <td className="p-3 text-slate-700">{u.email}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{u.department ? u.department.shortName : 'N/A'}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setResetTargetUser(u);
                              setResetPassword('Changeme@123');
                              setShowResetModal(true);
                            }}
                            className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-200 text-xs inline-flex items-center"
                          >
                            <Key className="w-3.5 h-3.5 mr-1" /> Reset Password
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: REGULATIONS & SUBJECT TYPE CODES */}
        {activeTab === 'regulations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Academic Regulations</h3>
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

            {/* Subject Type Code Editor Section */}
            <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Subject Type Codes Configuration</h3>
              <p className="text-xs text-desc">Configure Subject Type integer codes used in auto subject-code sequence generation.</p>

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
                      className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-lg flex items-center"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Code
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CREDIT WEIGHTS CONFIGURATION */}
        {activeTab === 'creditconfig' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5 max-w-xl">
            <div>
              <h3 className="text-base font-bold text-slate-900">Credit Calculation Formula Config</h3>
              <p className="text-xs text-desc">Configure credit calculation multiplier weights for L, T, and P.</p>
            </div>

            {creditMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-xs text-emerald-700 border border-emerald-200">
                {creditMsg}
              </div>
            )}

            <form onSubmit={handleSaveCreditWeights} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lecture Weight (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={lWeight}
                    onChange={(e) => setLWeight(parseFloat(e.target.value) || 1.0)}
                    className="w-full px-3 py-2 text-xs border rounded-xl font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tutorial Weight (T)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={tWeight}
                    onChange={(e) => setTWeight(parseFloat(e.target.value) || 1.0)}
                    className="w-full px-3 py-2 text-xs border rounded-xl font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Practical Weight (P)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={pWeight}
                    onChange={(e) => setPWeight(parseFloat(e.target.value) || 0.5)}
                    className="w-full px-3 py-2 text-xs border rounded-xl font-bold text-center"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50 text-brand-800 rounded-xl text-xs font-semibold">
                Current Active Calculation: Credits = (L × {lWeight}) + (T × {tWeight}) + (P × {pWeight})
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Save Credit Formula Config
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: PO / PSO CONFIGURATION */}
        {activeTab === 'popso' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5 max-w-xl">
            <h3 className="text-base font-bold text-slate-900">PO & PSO Count Configuration</h3>
            <p className="text-xs text-desc">Configure program outcome counts for department programmes.</p>

            {poMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-xs text-emerald-700 border border-emerald-200">
                {poMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Department</label>
                <select
                  value={selectedDeptForConfig}
                  onChange={(e) => setSelectedDeptForConfig(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.programmeName} ({d.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Program Outcomes (POs)</label>
                  <input
                    type="number"
                    value={poCount}
                    onChange={(e) => setPoCount(parseInt(e.target.value) || 12)}
                    className="w-full px-3 py-2 text-xs border rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Program Specific Outcomes (PSOs)</label>
                  <input
                    type="number"
                    value={psoCount}
                    onChange={(e) => setPsoCount(parseInt(e.target.value) || 3)}
                    className="w-full px-3 py-2 text-xs border rounded-xl font-bold"
                  />
                </div>
              </div>

              <button
                onClick={handleSavePOPSOConfig}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Save PO / PSO Structure
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT LOGS (IST Formatted) */}
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
                  <input type="text" required value={programmeName} onChange={(e) => setProgrammeName(e.target.value)} placeholder="Computer Science and Engineering" className="w-full p-2 border rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Short Name *</label>
                    <input type="text" required value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="CSE" className="w-full p-2 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Department Code *</label>
                    <input type="text" required value={departmentCode} onChange={(e) => setDepartmentCode(e.target.value)} placeholder="CS" className="w-full p-2 border rounded-xl uppercase" />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Number of Semesters *</label>
                  <input type="number" required min="1" max="10" value={semesters} onChange={(e) => setSemesters(parseInt(e.target.value) || 8)} className="w-full p-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Assign Head of Department (HoD)</label>
                  <select value={hodId} onChange={(e) => setHodId(e.target.value)} className="w-full p-2 border rounded-xl">
                    <option value="">Select User for HoD...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.userCode || u.email})</option>
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

        {/* User Create Modal */}
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">Create New User Account</h3>
              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Full Name *</label>
                  <input type="text" required value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Dr. Jane Doe" className="w-full p-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">College Email (@rajalakshmi.edu.in) *</label>
                  <input type="email" required value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="name@rajalakshmi.edu.in" className="w-full p-2 border rounded-xl" />
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
                      <option value="">Select Dept...</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.shortName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Initial Password *</label>
                  <input type="password" required value={userPassword} onChange={(e) => setUserPassword(e.target.value)} className="w-full p-2 border rounded-xl" />
                </div>
                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button type="button" onClick={() => setShowUserModal(false)} className="px-3 py-1.5 rounded-xl text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded-xl bg-brand-600 text-white font-bold">Create Account</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">Reset User Password</h3>
              <p className="text-xs text-desc">User: <strong>{resetTargetUser?.name}</strong> ({resetTargetUser?.userCode || resetTargetUser?.email})</p>
              <form onSubmit={handleResetUserPassword} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">New Password *</label>
                  <input type="password" required value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} className="w-full p-2 border rounded-xl" />
                </div>
                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button type="button" onClick={() => setShowResetModal(false)} className="px-3 py-1.5 rounded-xl text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded-xl bg-amber-600 text-white font-bold">Reset Password</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
