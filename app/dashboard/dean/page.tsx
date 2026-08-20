'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SyllabusPDFGenerator } from '@/components/pdf/SyllabusPDFGenerator';
import { DepartmentDetailView } from '@/components/dean/DepartmentDetailView';
import { formatIST } from '@/lib/time';
import {
  Layers,
  Building2,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Send,
  Eye,
  Check,
  X,
  Sparkles,
  Search,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function DeanDashboard() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [extensionRequests, setExtensionRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Department for Detail Page
  const [selectedDeptSummary, setSelectedDeptSummary] = useState<any>(null);

  // Stage Initiation Modal State
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [targetStage, setTargetStage] = useState<any>(null);
  const [initiateDeadline, setInitiateDeadline] = useState('');
  const [submittingStage, setSubmittingStage] = useState(false);

  // Selected Approved Syllabus for Drilldown Viewer
  const [selectedSyllabus, setSelectedSyllabus] = useState<any>(null);

  // Filters for Approved Syllabi & Reviews
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterSem, setFilterSem] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resOverview, resStages, resExt] = await Promise.all([
        fetch('/api/dean/overview'),
        fetch('/api/dean/stage'),
        fetch('/api/dean/extensions'),
      ]);

      if (resOverview.ok) {
        const data = await resOverview.json();
        setOverview(data);
      }
      if (resStages.ok) {
        const data = await resStages.json();
        setStages(data.stages || []);
      }
      if (resExt.ok) {
        const data = await resExt.json();
        setExtensionRequests(data.requests || []);
      }
    } catch (err: any) {
      setError('Failed to load Dean dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInitiate = (stg: any) => {
    setTargetStage(stg);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setInitiateDeadline(d.toISOString().slice(0, 16));
    setShowInitiateModal(true);
  };

  const handleConfirmInitiation = async () => {
    if (!targetStage || !initiateDeadline) return;
    setSubmittingStage(true);
    setError('');

    try {
      const res = await fetch('/api/dean/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: targetStage.id,
          deadline: initiateDeadline,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate stage.');

      setShowInitiateModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingStage(false);
    }
  };

  const handleDecisionExtension = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch('/api/dean/extensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update extension request');
    }
  };

  const activeStage = stages.find((s) => s.status === 'ACTIVE');
  const pendingExtensions = extensionRequests.filter((r) => r.status === 'PENDING');

  // Filtered Approved Syllabi List
  const filteredApprovedSyllabi = (overview?.approvedSyllabi || []).filter((subj: any) => {
    const matchesSearch =
      subj.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subj.subjectCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'ALL' || subj.departmentId === filterDept;
    const matchesSem = filterSem === 'ALL' || subj.semester === parseInt(filterSem);
    return matchesSearch && matchesDept && matchesSem;
  });

  return (
    <AppShell activeTab={activeTab} onTabChange={(tab) => {
      setSelectedDeptSummary(null);
      setActiveTab(tab);
    }}>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Department Detail View if Selected */}
        {selectedDeptSummary ? (
          <DepartmentDetailView
            departmentSummary={selectedDeptSummary}
            allSubjects={overview?.allSubjects || []}
            onBack={() => setSelectedDeptSummary(null)}
            onViewSyllabus={(subj) => setSelectedSyllabus(subj)}
          />
        ) : (
          <>
            {/* 1. INSTITUTIONAL OVERVIEW (MAIN DEAN DASHBOARD COMMAND CENTER) */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Academic Command Center</h1>
                    <p className="text-xs text-desc mt-1">SuperAdmin / Dean Overview — Regulation 26 (AY 2026–2027)</p>
                  </div>

                  {activeStage && (
                    <div className="mt-4 md:mt-0 flex items-center space-x-3 bg-purple-50 p-3 rounded-2xl border border-purple-200">
                      <Clock className="w-5 h-5 text-brand-600 animate-pulse" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-brand-700 tracking-wider">Active Academic Stage</p>
                        <p className="text-xs font-bold text-slate-900">{activeStage.name}</p>
                        <p className="text-[10px] text-desc">Deadline: {formatIST(activeStage.deadline, false)}</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('stages')}
                        className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs ml-2"
                      >
                        View Stage
                      </button>
                    </div>
                  )}
                </div>

                {/* Consolidated KPI Section */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-1">
                    <p className="text-[11px] font-bold text-slate-500">Total Programmes</p>
                    <p className="text-xl font-black text-slate-900">{overview?.deptSummaries?.length || 0}</p>
                    <button onClick={() => setActiveTab('departments')} className="text-[10px] font-bold text-brand-600 hover:underline flex items-center mt-1">
                      View Details <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-1">
                    <p className="text-[11px] font-bold text-slate-500">Total Subjects</p>
                    <p className="text-xl font-black text-slate-900">{overview?.overallTotalSubjects || 0}</p>
                    <button onClick={() => setActiveTab('progress')} className="text-[10px] font-bold text-brand-600 hover:underline flex items-center mt-1">
                      View Details <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-1">
                    <p className="text-[11px] font-bold text-slate-500">Subjects Assigned</p>
                    <p className="text-xl font-black text-indigo-600">{overview?.overallAssigned || 0}</p>
                    <button onClick={() => setActiveTab('progress')} className="text-[10px] font-bold text-brand-600 hover:underline flex items-center mt-1">
                      View Details <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-1">
                    <p className="text-[11px] font-bold text-slate-500">Syllabi Submitted</p>
                    <p className="text-xl font-black text-blue-600">{overview?.overallSubmitted || 0}</p>
                    <button onClick={() => setActiveTab('approved')} className="text-[10px] font-bold text-brand-600 hover:underline flex items-center mt-1">
                      View Details <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-1">
                    <p className="text-[11px] font-bold text-slate-500">HoD Approved</p>
                    <p className="text-xl font-black text-emerald-600">{overview?.overallApproved || 0}</p>
                    <button onClick={() => setActiveTab('approved')} className="text-[10px] font-bold text-brand-600 hover:underline flex items-center mt-1">
                      View Details <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-1">
                    <p className="text-[11px] font-bold text-slate-500">Overall Completion</p>
                    <p className="text-xl font-black text-amber-600">{overview?.overallCompletionPercentage || 0}%</p>
                    <button onClick={() => setActiveTab('progress')} className="text-[10px] font-bold text-brand-600 hover:underline flex items-center mt-1">
                      View Details <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* Institutional Progress & Action Required Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Progress Visualization Panel */}
                  <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">Institutional Progress Visualization</h3>
                      <button
                        onClick={() => setActiveTab('progress')}
                        className="text-xs font-bold text-brand-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 hover:bg-purple-100"
                      >
                        View Department Progress
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-700">Curriculum Formation</span>
                          <span className="text-brand-700">100%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-brand-600 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-700">Faculty Assignment</span>
                          <span className="text-indigo-700">
                            {overview?.overallTotalSubjects ? Math.round((overview.overallAssigned / overview.overallTotalSubjects) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${overview?.overallTotalSubjects ? Math.round((overview.overallAssigned / overview.overallTotalSubjects) * 100) : 0}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-700">Syllabus Submission</span>
                          <span className="text-blue-700">
                            {overview?.overallTotalSubjects ? Math.round((overview.overallSubmitted / overview.overallTotalSubjects) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${overview?.overallTotalSubjects ? Math.round((overview.overallSubmitted / overview.overallTotalSubjects) * 100) : 0}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-700">HoD Approval</span>
                          <span className="text-emerald-700">{overview?.overallCompletionPercentage || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${overview?.overallCompletionPercentage || 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compact Action Required Alerts Panel */}
                  <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Action Required & Alerts</h3>
                    
                    <div className="space-y-3">
                      {pendingExtensions.length > 0 ? (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-amber-900">{pendingExtensions.length} Extension Request(s) Pending</p>
                              <p className="text-[11px] text-amber-800">Requires Dean approval for deadline extension.</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab('extensions')}
                            className="px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-xl shrink-0"
                          >
                            View →
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                          No pending extension requests.
                        </div>
                      )}

                      <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{overview?.overallApproved || 0} Syllabi HoD Approved</p>
                            <p className="text-[11px] text-desc">Ready for institutional governance review.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab('approved')}
                          className="px-3 py-1.5 bg-brand-600 text-white font-bold text-xs rounded-xl shrink-0"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic Stage Timeline Summary Panel */}
                <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Academic Workflow Stage Timeline</h3>
                      <p className="text-xs text-desc">Regulation 26 institutional stages summary.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('stages')}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      Manage Academic Stages
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stages.map((stg, idx) => (
                      <div key={stg.id} className="p-4 rounded-2xl border bg-slate-50/50 flex items-center space-x-3">
                        <span className="w-8 h-8 rounded-xl bg-purple-100 text-brand-800 font-bold text-xs flex items-center justify-center shrink-0">
                          0{idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{stg.name}</p>
                          <StatusBadge status={stg.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. ACADEMIC STAGES DEDICATED PAGE */}
            {activeTab === 'stages' && (
              <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Academic Stages Management</h3>
                  <p className="text-xs text-desc">Initiate institutional stages and configure deadlines.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stages.map((stg) => (
                    <div
                      key={stg.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        stg.status === 'ACTIVE'
                          ? 'bg-purple-50/50 border-brand-300 shadow-md ring-1 ring-brand-500/20'
                          : 'bg-slate-50 border-slate-200 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-900">{stg.name}</span>
                        <StatusBadge status={stg.status} />
                      </div>
                      <p className="text-xs text-desc min-h-[36px]">{stg.description}</p>

                      {stg.status === 'ACTIVE' ? (
                        <div className="mt-4 pt-3 border-t border-purple-200 flex items-center justify-between text-xs font-semibold text-brand-800">
                          <span>Deadline: {formatIST(stg.deadline, false)}</span>
                          <button
                            onClick={() => handleOpenInitiate(stg)}
                            className="px-3 py-1.5 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-700 text-xs shadow-xs"
                          >
                            Update Deadline
                          </button>
                        </div>
                      ) : stg.name === 'Curriculum & Syllabus Formation' ? (
                        <button
                          onClick={() => handleOpenInitiate(stg)}
                          className="mt-4 w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Initiate Stage</span>
                        </button>
                      ) : (
                        <div className="mt-4 pt-3 border-t border-slate-200 text-center text-xs font-semibold text-slate-400">
                          🔒 Upcoming Academic Stage
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. DEPARTMENTS & PROGRAMMES DEDICATED PAGE */}
            {activeTab === 'departments' && (
              <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Departments & Academic Programmes</h3>
                  <p className="text-xs text-desc">Select a programme to inspect its detailed curriculum breakdown.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {overview?.deptSummaries?.map((d: any) => (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDeptSummary(d)}
                      className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 hover:shadow-md transition-all cursor-pointer space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-brand-700 uppercase bg-purple-100 px-2 py-0.5 rounded">
                          {d.programmeType} | Code: {d.departmentCode}
                        </span>
                        <span className="text-xs font-bold text-emerald-700">{d.completionPercentage}%</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{d.programmeName}</h4>
                        <p className="text-xs font-semibold text-desc">HoD: {d.hodName || 'Unassigned'}</p>
                      </div>
                      <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-xs text-slate-700">
                        <span>Subjects: {d.totalSubjects}</span>
                        <span className="text-brand-600 font-bold hover:underline">Open Details →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. DEPARTMENT PROGRESS DEDICATED PAGE */}
            {activeTab === 'progress' && (
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Programme-wise Formation Progress</h3>
                  <p className="text-xs text-desc">Detailed institutional progress across all departments.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-purple-50 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-3">Department / Programme</th>
                        <th className="p-3">HoD</th>
                        <th className="p-3 text-center">Subjects Formed</th>
                        <th className="p-3 text-center">Faculty Assigned</th>
                        <th className="p-3 text-center">Submitted</th>
                        <th className="p-3 text-center">HoD Approved</th>
                        <th className="p-3 text-center">Completion %</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {overview?.deptSummaries?.map((d: any) => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">
                            {d.programmeName} ({d.shortName})
                            <span className="block text-[10px] text-desc font-normal">Code: {d.departmentCode} | Semesters: {d.semesters}</span>
                          </td>
                          <td className="p-3 text-slate-700">{d.hodName}</td>
                          <td className="p-3 text-center font-semibold">{d.totalSubjects}</td>
                          <td className="p-3 text-center font-semibold text-indigo-600">{d.assignedCount}</td>
                          <td className="p-3 text-center font-semibold text-blue-600">{d.submittedCount}</td>
                          <td className="p-3 text-center font-bold text-emerald-600">{d.approvedCount}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div className="bg-brand-600 h-2 rounded-full" style={{ width: `${d.completionPercentage}%` }}></div>
                              </div>
                              <span className="font-bold text-slate-800">{d.completionPercentage}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedDeptSummary(d)}
                              className="px-3 py-1 bg-brand-600 text-white font-bold text-xs rounded-lg shadow-xs"
                            >
                              Inspect →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. APPROVED SYLLABI & REVIEWS DEDICATED DIRECTORY PAGE */}
            {(activeTab === 'approved' || activeTab === 'reviews') && (
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Approved Syllabi Directory (Dean Access)</h3>
                  <p className="text-xs text-desc">Inspect approved syllabi documents without CO/PO justifications on screen.</p>
                </div>

                {/* Filter Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search subject code or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <select
                      value={filterDept}
                      onChange={(e) => setFilterDept(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-brand-500 font-medium"
                    >
                      <option value="ALL">All Departments</option>
                      {overview?.deptSummaries?.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.shortName} — {d.programmeName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={filterSem}
                      onChange={(e) => setFilterSem(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-brand-500 font-medium"
                    >
                      <option value="ALL">All Semesters</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredApprovedSyllabi.length === 0 ? (
                  <p className="text-xs text-desc py-8 text-center">No approved syllabi match the selected filter criteria.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredApprovedSyllabi.map((subj: any) => (
                      <div key={subj.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 hover:shadow-md transition-all flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-brand-700 uppercase bg-purple-100 px-2 py-0.5 rounded">
                            {subj.subjectCode} | Sem {subj.semester}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 mt-1">{subj.subjectName}</h4>
                          <p className="text-[11px] text-desc">
                            Faculty: {subj.assignedFaculty?.name} | Dept: {subj.department?.shortName}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedSyllabus(subj)}
                          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl flex items-center"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Dean Review
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 6. EXTENSION REQUESTS DEDICATED PAGE */}
            {activeTab === 'extensions' && (
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Deadline Extension Requests</h3>
                  <p className="text-xs text-desc">Manage stage extension requests submitted by Heads of Department.</p>
                </div>

                {extensionRequests.length === 0 ? (
                  <p className="text-xs text-desc py-8 text-center">No extension requests found.</p>
                ) : (
                  <div className="space-y-3">
                    {extensionRequests.map((req) => (
                      <div key={req.id} className="p-4 rounded-2xl border border-purple-100 bg-purple-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900">
                              {req.department?.programmeName} ({req.department?.shortName})
                            </span>
                            <StatusBadge status={req.status} />
                          </div>
                          <p className="text-xs text-desc mt-0.5">
                            Requested by: <strong>{req.requestedBy?.name}</strong> | New Requested Deadline:{' '}
                            <strong className="text-amber-800">{formatIST(req.requestedDeadline)}</strong>
                          </p>
                          <p className="text-xs text-slate-700 mt-1 bg-white p-2.5 rounded-xl border border-purple-100">
                            Reason: "{req.reason}"
                          </p>
                        </div>
                        {req.status === 'PENDING' && (
                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              onClick={() => handleDecisionExtension(req.id, 'APPROVE')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center"
                            >
                              <Check className="w-4 h-4 mr-1" /> Approve
                            </button>
                            <button
                              onClick={() => handleDecisionExtension(req.id, 'REJECT')}
                              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center"
                            >
                              <X className="w-4 h-4 mr-1" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Printable PDF Modal for Dean View (User Requirement: Dean Review WITHOUT justifications on screen) */}
        {selectedSyllabus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-bold text-slate-900">Dean Syllabus Review View</h3>
                <button onClick={() => setSelectedSyllabus(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <SyllabusPDFGenerator
                subject={selectedSyllabus}
                submission={selectedSyllabus.submission}
                documentTitle="Approved Syllabus Document (Dean View)"
                hideJustifications={true}
              />
            </div>
          </div>
        )}

        {/* Stage Initiation Modal */}
        {showInitiateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Initiate Stage: {targetStage?.name}?</h3>
              <p className="text-xs text-desc">
                Starting this stage will send an institutional email alert and dashboard activation notification to all active Heads of Department.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Set Completion Deadline *</label>
                <input
                  type="datetime-local"
                  required
                  value={initiateDeadline}
                  onChange={(e) => setInitiateDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button onClick={() => setShowInitiateModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={handleConfirmInitiation}
                  disabled={submittingStage}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
                >
                  {submittingStage ? 'Initiating...' : 'Confirm & Initiate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
