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
  RotateCcw,
  ChevronDown,
  ChevronRight,
  MapPin,
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
  const [initiateVenue, setInitiateVenue] = useState('Main Boardroom');
  const [submittingStage, setSubmittingStage] = useState(false);

  // Selected Approved Syllabus for Drilldown Viewer
  const [selectedSyllabus, setSelectedSyllabus] = useState<any>(null);
  const [deanReturnReason, setDeanReturnReason] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Search Query & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterSem, setFilterSem] = useState('ALL');

  // Approved Syllabi Dual Mode Interactive State
  const [approvedViewMode, setApprovedViewMode] = useState<'BY_DEPT' | 'BY_SEM'>('BY_DEPT');
  const [selectedDeptIdForApproved, setSelectedDeptIdForApproved] = useState('ALL');
  const [selectedSemForApproved, setSelectedSemForApproved] = useState('ALL');
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});

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
    setInitiateVenue(stg.venue || 'Main Boardroom');
    setShowInitiateModal(true);
  };

  const handleConfirmInitiation = async () => {
    if (!targetStage) return;
    setSubmittingStage(true);
    setError('');

    try {
      const res = await fetch('/api/dean/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'INITIATE',
          stageId: targetStage.id,
          deadline: initiateDeadline || null,
          venue: initiateVenue || null,
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

  const handleDecisionExtension = async (requestId: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch('/api/dean/extensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: decision }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to decide extension');
    }
  };

  const handleDeanApproveSyllabus = async (subjectId: string) => {
    try {
      const res = await fetch('/api/dean/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, action: 'APPROVE' }),
      });
      if (res.ok) {
        setSelectedSyllabus(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to approve syllabus');
    }
  };

  const handleDeanReturnSyllabus = async () => {
    if (!selectedSyllabus || !deanReturnReason.trim()) return;
    try {
      const res = await fetch('/api/dean/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: selectedSyllabus.id,
          action: 'RETURN',
          reason: deanReturnReason.trim(),
        }),
      });
      if (res.ok) {
        setShowReturnModal(false);
        setSelectedSyllabus(null);
        setDeanReturnReason('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to return syllabus');
    }
  };

  const toggleAccordion = (key: string) => {
    setExpandedAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeStage = overview?.activeStage || stages.find((s) => s.status === 'ACTIVE') || stages[0];
  const pendingDeanReviewsList = overview?.pendingDeanReviews || [];
  const approvedSyllabiList = overview?.approvedSyllabi || [];

  const listToFilter = activeTab === 'reviews' ? pendingDeanReviewsList : approvedSyllabiList;

  const filteredSyllabi = listToFilter.filter((subj: any) => {
    const matchesSearch =
      subj.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subj.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'ALL' || subj.departmentId === filterDept;
    const matchesSem = filterSem === 'ALL' || subj.semester === parseInt(filterSem);
    return matchesSearch && matchesDept && matchesSem;
  });

  // Render Modern Stylish Vertical Progress Bar Component
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
              {/* Dot / Circle Indicator */}
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

              {/* Stage Card Content */}
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
                      <StatusBadge status={stg.status} />
                    </div>
                    {stg.description && <p className="text-xs text-desc mt-0.5">{stg.description}</p>}
                  </div>

                  {isInactive && (
                    <button
                      onClick={() => handleOpenInitiate(stg)}
                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 self-start md:self-auto"
                    >
                      {isMeeting ? 'Schedule Meeting →' : 'Initiate Stage →'}
                    </button>
                  )}
                </div>

                {/* Deadline / Scheduled Info & Venue */}
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

                  {stg.initiatedBy && (
                    <span className="text-[10px] text-slate-500 italic">
                      Initiated by {stg.initiatedBy.name}
                    </span>
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
      setSelectedDeptSummary(null);
      setSelectedSyllabus(null);
      setActiveTab(tab);
    }}>
      <div className="space-y-8 max-w-7xl mx-auto">
        {selectedDeptSummary ? (
          <DepartmentDetailView
            departmentSummary={selectedDeptSummary}
            allSubjects={overview?.allSubjects || []}
            onBack={() => setSelectedDeptSummary(null)}
            onViewSyllabus={(subj) => setSelectedSyllabus(subj)}
          />
        ) : (
          <>
            {/* TAB 1: INSTITUTIONAL OVERVIEW (COMMAND CENTER HOME) */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Command Center</h1>
                    <p className="text-xs text-desc mt-1">Dean / SuperAdmin Executive Governance — Regulation 26</p>
                  </div>
                  {activeStage && (
                    <div className="mt-3 md:mt-0 px-3.5 py-1.5 rounded-xl bg-purple-50 text-brand-800 border border-purple-200 text-xs font-bold flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-brand-600 animate-pulse" />
                      <span>Active Stage: <strong>{activeStage.name}</strong> (Deadline: {activeStage.deadline ? formatIST(activeStage.deadline) : 'N/A'})</span>
                    </div>
                  )}
                </div>

                {/* KPIs (Total Departments KPI Card Removed) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Overall Completion"
                    value={`${overview?.overallCompletionPercentage || 0}%`}
                    subtitle={`${overview?.overallApproved || 0} / ${overview?.overallTotalSubjects || 0} Syllabi Approved`}
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  />
                  <StatCard
                    title="Pending Dean Reviews"
                    value={pendingDeanReviewsList.length}
                    subtitle="HoD Approved Syllabi Awaiting Dean Review"
                    icon={<Eye className="w-5 h-5 text-indigo-600" />}
                    onClick={() => setActiveTab('reviews')}
                  />
                  <StatCard
                    title="Approved Syllabi"
                    value={approvedSyllabiList.length}
                    subtitle="Final Approved Syllabi Archive"
                    icon={<CheckCircle2 className="w-5 h-5 text-brand-600" />}
                    onClick={() => setActiveTab('approved')}
                  />
                  <StatCard
                    title="Extension Requests"
                    value={extensionRequests.filter((r) => r.status === 'PENDING').length}
                    subtitle="Pending HoD Requests"
                    icon={<ShieldAlert className="w-5 h-5 text-amber-600" />}
                    onClick={() => setActiveTab('extensions')}
                  />
                </div>

                {/* Active Stage & Progress Overview (Vertical Progress Bar) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center">
                      <Layers className="w-4 h-4 mr-2 text-brand-600" /> Academic Workflow Stage Progress
                    </h3>
                    {renderVerticalStageProgress()}
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Quick Department Summary</h3>
                    <div className="space-y-3 text-xs">
                      {overview?.deptSummaries?.map((d: any) => (
                        <div key={d.id} className="p-3 rounded-2xl bg-purple-50/40 border border-purple-100 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900">{d.programmeName}</p>
                            <p className="text-[10px] text-desc">HoD: {d.hodName}</p>
                          </div>
                          <span className="font-bold text-brand-700">{d.completionPercentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ACADEMIC STAGES DEDICATED PAGE */}
            {activeTab === 'stages' && (
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-brand-600" /> Academic Stage Governance
                  </h3>
                  <p className="text-xs text-desc">Initiate and monitor Curriculum, DAC, and BoS meeting workflows.</p>
                </div>

                {renderVerticalStageProgress()}
              </div>
            )}

            {/* TAB 3: DEPARTMENTS & PROGRAMMES DEDICATED PAGE */}
            {activeTab === 'departments' && (
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Departments & Academic Programmes Directory</h3>
                  <p className="text-xs text-desc">Select a department to view its complete subject list and semester details.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {overview?.deptSummaries?.map((d: any) => (
                    <div key={d.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 space-y-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-brand-700 uppercase bg-purple-100 px-2 py-0.5 rounded">
                          {d.programmeType} | Code: {d.departmentCode}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{d.programmeName}</h4>
                        <p className="text-xs text-desc mt-0.5">HoD: {d.hodName} | {d.totalSubjects} Subjects</p>
                      </div>
                      <button
                        onClick={() => setSelectedDeptSummary(d)}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        Inspect Department →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: DEPARTMENT PROGRESS DEDICATED PAGE */}
            {activeTab === 'progress' && (
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Institutional Department Progress</h3>
                  <p className="text-xs text-desc">Detailed progress breakdown across all college departments.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-purple-50 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-3">Department</th>
                        <th className="p-3">HoD</th>
                        <th className="p-3 text-center">Total Subjects</th>
                        <th className="p-3 text-center">Assigned</th>
                        <th className="p-3 text-center">Submitted</th>
                        <th className="p-3 text-center">Approved</th>
                        <th className="p-3 text-center">Completion %</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {overview?.deptSummaries?.map((d: any) => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">
                            {d.programmeName}
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
                            <button onClick={() => setSelectedDeptSummary(d)} className="px-3 py-1 bg-brand-600 text-white font-bold text-xs rounded-lg shadow-xs">
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

            {/* TAB 5: SYLLABUS REVIEWS (PENDING DEAN APPROVAL) */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Syllabus Reviews Awaiting Dean Approval</h3>
                  <p className="text-xs text-desc">Syllabi approved by HoD requiring final institutional approval from Dean.</p>
                </div>

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
                    <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-brand-500 font-medium">
                      <option value="ALL">All Departments</option>
                      {overview?.deptSummaries?.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.shortName} — {d.programmeName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)} className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-brand-500 font-medium">
                      <option value="ALL">All Semesters</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSyllabi.map((s: any) => (
                    <div key={s.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-brand-700">{s.subjectCode}</span>
                          <StatusBadge status={s.syllabusStatus} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{s.subjectName}</h4>
                        <p className="text-xs text-desc">Dept: {s.department?.shortName} | Faculty: {s.assignedFaculty?.name}</p>
                      </div>
                      <button
                        onClick={() => setSelectedSyllabus(s)}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Inspect & Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: APPROVED SYLLABI DIRECTORY (DUAL INTERACTIVE DROPDOWN / ACCORDION FILTERING) */}
            {activeTab === 'approved' && (
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Approved Syllabi Directory (Dean Access)</h3>
                    <p className="text-xs text-desc">Dual interactive filtering by Department and Semester.</p>
                  </div>

                  {/* Mode Selector Toggle */}
                  <div className="flex items-center bg-purple-50 p-1 rounded-2xl border border-purple-100">
                    <button
                      onClick={() => setApprovedViewMode('BY_DEPT')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        approvedViewMode === 'BY_DEPT'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-brand-700'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 inline mr-1" /> By Department
                    </button>
                    <button
                      onClick={() => setApprovedViewMode('BY_SEM')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        approvedViewMode === 'BY_SEM'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-brand-700'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 inline mr-1" /> By Semester
                    </button>
                  </div>
                </div>

                {/* MODE 1: BY DEPARTMENT */}
                {approvedViewMode === 'BY_DEPT' && (
                  <div className="space-y-5">
                    <div className="max-w-md">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Select Department</label>
                      <select
                        value={selectedDeptIdForApproved}
                        onChange={(e) => setSelectedDeptIdForApproved(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl font-bold bg-purple-50/50 text-brand-900"
                      >
                        <option value="ALL">All Departments ({overview?.deptSummaries?.length || 0})</option>
                        {overview?.deptSummaries?.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.shortName} — {d.programmeName}</option>
                        ))}
                      </select>
                    </div>

                    {/* 8 Semester Dropdown Accordions */}
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                        const subjectsInSem = approvedSyllabiList.filter((s: any) => {
                          const matchesDept = selectedDeptIdForApproved === 'ALL' || s.departmentId === selectedDeptIdForApproved;
                          return matchesDept && s.semester === sem;
                        });

                        const key = `sem-${sem}`;
                        const isExpanded = expandedAccordions[key] ?? true;

                        return (
                          <div key={sem} className="border border-purple-100 rounded-2xl overflow-hidden bg-purple-50/20">
                            <button
                              onClick={() => toggleAccordion(key)}
                              className="w-full p-4 flex items-center justify-between bg-purple-50/60 hover:bg-purple-100/50 transition-colors"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-black text-brand-700 text-xs bg-purple-200/80 px-2 py-0.5 rounded">
                                  SEM {sem}
                                </span>
                                <h4 className="font-bold text-slate-900 text-xs">Semester {sem} Syllabi</h4>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {subjectsInSem.length} Approved Subject(s)
                                </span>
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="p-4 border-t border-purple-100">
                                {subjectsInSem.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">No approved subjects in Semester {sem} for the selected filter.</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {subjectsInSem.map((s: any) => (
                                      <div key={s.id} className="p-4 bg-white rounded-xl border border-purple-100 flex items-center justify-between">
                                        <div>
                                          <div className="flex items-center space-x-2">
                                            <span className="font-mono text-xs font-bold text-brand-700">{s.subjectCode}</span>
                                            <span className="text-[10px] text-desc">({s.department?.shortName})</span>
                                          </div>
                                          <h5 className="text-xs font-bold text-slate-900 mt-0.5">{s.subjectName}</h5>
                                          <p className="text-[10px] text-desc">Faculty: {s.assignedFaculty?.name}</p>
                                        </div>
                                        <button
                                          onClick={() => setSelectedSyllabus(s)}
                                          className="px-3 py-1.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center"
                                        >
                                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* MODE 2: BY SEMESTER */}
                {approvedViewMode === 'BY_SEM' && (
                  <div className="space-y-5">
                    <div className="max-w-md">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Select Semester</label>
                      <select
                        value={selectedSemForApproved}
                        onChange={(e) => setSelectedSemForApproved(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl font-bold bg-purple-50/50 text-brand-900"
                      >
                        <option value="ALL">All Semesters (Semesters 1 to 8)</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Department Dropdown Accordions */}
                    <div className="space-y-3">
                      {overview?.deptSummaries?.map((dept: any) => {
                        const subjectsInDept = approvedSyllabiList.filter((s: any) => {
                          const matchesSem = selectedSemForApproved === 'ALL' || s.semester === parseInt(selectedSemForApproved);
                          return matchesSem && s.departmentId === dept.id;
                        });

                        const key = `dept-${dept.id}`;
                        const isExpanded = expandedAccordions[key] ?? true;

                        return (
                          <div key={dept.id} className="border border-purple-100 rounded-2xl overflow-hidden bg-purple-50/20">
                            <button
                              onClick={() => toggleAccordion(key)}
                              className="w-full p-4 flex items-center justify-between bg-purple-50/60 hover:bg-purple-100/50 transition-colors"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-black text-brand-700 text-xs bg-purple-200/80 px-2 py-0.5 rounded">
                                  {dept.departmentCode}
                                </span>
                                <h4 className="font-bold text-slate-900 text-xs">{dept.programmeName} ({dept.shortName})</h4>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {subjectsInDept.length} Approved Subject(s)
                                </span>
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="p-4 border-t border-purple-100">
                                {subjectsInDept.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">No approved subjects in {dept.shortName} for the selected semester filter.</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {subjectsInDept.map((s: any) => (
                                      <div key={s.id} className="p-4 bg-white rounded-xl border border-purple-100 flex items-center justify-between">
                                        <div>
                                          <div className="flex items-center space-x-2">
                                            <span className="font-mono text-xs font-bold text-brand-700">{s.subjectCode}</span>
                                            <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">Sem {s.semester}</span>
                                          </div>
                                          <h5 className="text-xs font-bold text-slate-900 mt-0.5">{s.subjectName}</h5>
                                          <p className="text-[10px] text-desc">Faculty: {s.assignedFaculty?.name}</p>
                                        </div>
                                        <button
                                          onClick={() => setSelectedSyllabus(s)}
                                          className="px-3 py-1.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center"
                                        >
                                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: EXTENSION REQUESTS DEDICATED PAGE */}
            {activeTab === 'extensions' && (
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Department Stage Extension Requests</h3>
                  <p className="text-xs text-desc">Review and decide extension requests submitted by Department Heads.</p>
                </div>

                <div className="space-y-4">
                  {extensionRequests.map((req) => (
                    <div key={req.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-xs">{req.department?.programmeName} ({req.department?.shortName})</span>
                          <span className="ml-2 text-xs text-desc font-semibold">Stage: {req.stage?.name}</span>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-purple-100 text-xs text-slate-700 space-y-1">
                        <p><strong>Current Deadline:</strong> {formatIST(req.currentDeadline)}</p>
                        <p><strong>Requested Deadline:</strong> <span className="text-brand-700 font-bold">{formatIST(req.requestedDeadline)}</span></p>
                        <p><strong>Reason:</strong> "{req.reason}"</p>
                      </div>

                      {req.status === 'PENDING' && (
                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            onClick={() => handleDecisionExtension(req.id, 'REJECT')}
                            className="px-4 py-1.5 bg-red-50 text-red-700 font-bold rounded-xl text-xs border border-red-200"
                          >
                            Reject Request
                          </button>
                          <button
                            onClick={() => handleDecisionExtension(req.id, 'APPROVE')}
                            className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-xs"
                          >
                            Approve Extension
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Selected Approved Syllabus Inspection Modal */}
        {selectedSyllabus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900">Dean Syllabus Review — {selectedSyllabus.subjectCode}</h3>
                  <StatusBadge status={selectedSyllabus.syllabusStatus} />
                </div>
                <button onClick={() => setSelectedSyllabus(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <SyllabusPDFGenerator
                subject={selectedSyllabus}
                submission={selectedSyllabus.submission}
                documentTitle="Dean Syllabus Inspection"
                hideJustifications={true}
              />

              {/* Dean Approval & Return Actions (If status is HOD_APPROVED) */}
              {selectedSyllabus.syllabusStatus === 'HOD_APPROVED' && (
                <div className="pt-4 border-t flex items-center justify-between">
                  <span className="text-xs text-desc font-semibold">
                    Reviewed by HoD. Grant Final Institutional Approval or return to Faculty.
                  </span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowReturnModal(true)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center"
                    >
                      <RotateCcw className="w-4 h-4 mr-1.5" /> Return to Faculty
                    </button>
                    <button
                      onClick={() => handleDeanApproveSyllabus(selectedSyllabus.id)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center"
                    >
                      <ShieldCheck className="w-4 h-4 mr-1.5" /> Grant Final Dean Approval
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dean Return Reason Modal */}
        {showReturnModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">Return Syllabus for Correction</h3>
              <p className="text-xs text-desc">Specify the reason for returning this syllabus to the faculty member.</p>
              <textarea
                rows={4}
                required
                value={deanReturnReason}
                onChange={(e) => setDeanReturnReason(e.target.value)}
                placeholder="Enter detailed feedback for correction..."
                className="w-full p-3 text-xs border rounded-xl"
              />
              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button onClick={() => setShowReturnModal(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
                <button onClick={handleDeanReturnSyllabus} disabled={!deanReturnReason.trim()} className="px-4 py-1.5 text-xs bg-amber-600 text-white font-bold rounded-xl disabled:opacity-50">
                  Return Syllabus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Initiate / Schedule Stage Modal */}
        {showInitiateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                {targetStage?.name.includes('DAC') || targetStage?.name.includes('BoS')
                  ? `Schedule Meeting: ${targetStage?.name}`
                  : `Initiate Stage: ${targetStage?.name}`}
              </h3>
              <p className="text-xs text-desc">{targetStage?.description}</p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">
                    {targetStage?.name.includes('DAC') || targetStage?.name.includes('BoS')
                      ? 'Scheduled Meeting Date *'
                      : 'Set Stage Deadline *'}
                  </label>
                  <input
                    type="datetime-local"
                    value={initiateDeadline}
                    onChange={(e) => setInitiateDeadline(e.target.value)}
                    className="w-full p-2 border rounded-xl font-bold"
                  />
                </div>

                {(targetStage?.name.includes('DAC') || targetStage?.name.includes('BoS')) && (
                  <div>
                    <label className="block font-semibold mb-1">Meeting Venue / Location *</label>
                    <input
                      type="text"
                      value={initiateVenue}
                      onChange={(e) => setInitiateVenue(e.target.value)}
                      placeholder="e.g. Main Boardroom / CSE Seminar Hall"
                      className="w-full p-2 border rounded-xl font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button onClick={() => setShowInitiateModal(false)} className="px-3 py-1.5 rounded-xl text-xs text-slate-600">Cancel</button>
                <button
                  onClick={handleConfirmInitiation}
                  disabled={submittingStage}
                  className="px-4 py-1.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-xs"
                >
                  {submittingStage ? 'Saving...' : 'Confirm Stage Schedule'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
