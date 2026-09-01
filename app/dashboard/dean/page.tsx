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
  Lock,
  Edit3,
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

  // Stage Initiation / Edit Deadline Modal State
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [targetStage, setTargetStage] = useState<any>(null);
  const [initiateDeadline, setInitiateDeadline] = useState('');
  const [initiateVenue, setInitiateVenue] = useState('Main Boardroom');
  const [submittingStage, setSubmittingStage] = useState(false);

  // Selected Approved Syllabus for Drilldown Viewer
  const [selectedSyllabus, setSelectedSyllabus] = useState<any>(null);
  const [deanReturnReason, setDeanReturnReason] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);

  const [activeDeanSemester, setActiveDeanSemester] = useState<number>(1);

  // Hover state for Overall Completion Status Split-up
  const [showCompletionHover, setShowCompletionHover] = useState(false);

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

  const curriculumStage = stages.find((s) => s.name.includes('Curriculum') || s.name.includes('Syllabus'));
  const isCurriculumCompleted = curriculumStage?.status === 'COMPLETED';

  const handleOpenInitiate = (stg: any) => {
    const isMeetingStage = stg.name.includes('DAC') || stg.name.includes('BoS');

    if (isMeetingStage && !isCurriculumCompleted) {
      alert('DAC Meeting & BoS Meeting can only be started after Curriculum & Syllabus Formation is completed.');
      return;
    }

    setTargetStage(stg);
    if (stg.deadline) {
      setInitiateDeadline(new Date(stg.deadline).toISOString().slice(0, 16));
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setInitiateDeadline(d.toISOString().slice(0, 16));
    }
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



  const activeStage = overview?.activeStage || stages.find((s) => s.status === 'ACTIVE') || stages[0];
  const pendingDeanReviewsList = overview?.pendingDeanReviews || [];
  const approvedSyllabiList = overview?.approvedSyllabi || [];
  const allSubjectsList = overview?.allSubjects || [];

  // Subject status split-up calculations for hover popover
  const approvedCount = overview?.overallApproved || 0;
  const pendingDeanCount = pendingDeanReviewsList.length;
  const submittedHodCount = allSubjectsList.filter((s: any) => s.syllabusStatus === 'SUBMITTED' || s.syllabusStatus === 'RESUBMITTED').length;
  const returnedCount = allSubjectsList.filter((s: any) => (s.syllabusStatus || '').includes('RETURNED')).length;
  const inProgressCount = allSubjectsList.filter((s: any) => s.syllabusStatus === 'IN_PROGRESS' || s.syllabusStatus === 'NOT_STARTED').length;
  const totalSubjsCount = overview?.overallTotalSubjects || allSubjectsList.length || 0;

  // Render Modern Stylish Vertical Progress Bar Component
  const renderVerticalStageProgress = () => {
    return (
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-purple-200">
        {stages.map((stg, idx) => {
          const isCompleted = stg.status === 'COMPLETED';
          const isActive = stg.status === 'ACTIVE';
          const isInactive = stg.status === 'INACTIVE';
          const isMeeting = stg.name.includes('DAC') || stg.name.includes('BoS');
          const isMeetingLocked = isMeeting && !isCurriculumCompleted;

          return (
            <div key={stg.id} className="relative flex items-start space-x-4">
              {/* Dot / Circle Indicator */}
              <div
                className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 ${isCompleted
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
              <div className={`flex-1 p-4 rounded-2xl border transition-all ${isActive
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

                  <div className="flex items-center space-x-2 shrink-0 self-start md:self-auto">
                    {/* Update Deadline Option for Active Stages */}
                    {!isInactive && (
                      <button
                        onClick={() => handleOpenInitiate(stg)}
                        className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-brand-800 font-bold text-xs rounded-xl border border-purple-200 flex items-center shadow-2xs"
                        title="Update Stage Deadline & Venue"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1 text-brand-600" /> Update Deadline
                      </button>
                    )}

                    {isInactive && (
                      isMeetingLocked ? (
                        <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px] rounded-xl flex items-center">
                          <Lock className="w-3.5 h-3.5 mr-1" /> Complete Curriculum First
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenInitiate(stg)}
                          className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs"
                        >
                          {isMeeting ? 'Schedule Meeting →' : 'Initiate Stage →'}
                        </button>
                      )
                    )}
                  </div>
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

                {/* KPIs (Extension Requests Card Removed from Overview as requested) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Overall Completion Card with Hover Split-up Tooltip */}
                  <div
                    className="relative"
                    onMouseEnter={() => setShowCompletionHover(true)}
                    onMouseLeave={() => setShowCompletionHover(false)}
                  >
                    <StatCard
                      title="Overall Completion"
                      value={`${overview?.overallCompletionPercentage || 0}%`}
                      subtitle={`${approvedCount} / ${totalSubjsCount} Syllabi Approved (Hover for details)`}
                      icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    />

                    {/* Hover Status Split-up Card */}
                    {showCompletionHover && (
                      <div className="absolute top-full left-0 mt-2 w-72 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-purple-200 z-50 animate-in fade-in zoom-in-95 space-y-2">
                        <p className="text-xs font-bold text-slate-900 border-b pb-1.5 flex items-center justify-between">
                          <span>Syllabus Status Split-up</span>
                          <span className="text-[10px] text-brand-700 font-mono">Total: {totalSubjsCount}</span>
                        </p>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center text-emerald-700 font-semibold">
                            <span className="flex items-center"><Check className="w-3.5 h-3.5 mr-1" /> Dean Approved (Final)</span>
                            <span className="font-bold">{approvedCount}</span>
                          </div>
                          <div className="flex justify-between items-center text-indigo-700 font-semibold">
                            <span className="flex items-center"><Eye className="w-3.5 h-3.5 mr-1" /> Pending Dean Review</span>
                            <span className="font-bold">{pendingDeanCount}</span>
                          </div>
                          <div className="flex justify-between items-center text-blue-700 font-semibold">
                            <span className="flex items-center"><FileText className="w-3.5 h-3.5 mr-1" /> Submitted to HoD</span>
                            <span className="font-bold">{submittedHodCount}</span>
                          </div>
                          <div className="flex justify-between items-center text-amber-700 font-semibold">
                            <span className="flex items-center"><Sparkles className="w-3.5 h-3.5 mr-1" /> In Progress / Draft</span>
                            <span className="font-bold">{inProgressCount}</span>
                          </div>
                          <div className="flex justify-between items-center text-red-600 font-semibold">
                            <span className="flex items-center"><RotateCcw className="w-3.5 h-3.5 mr-1" /> Returned for Correction</span>
                            <span className="font-bold">{returnedCount}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

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

                {pendingDeanReviewsList.length === 0 ? (
                  <div className="p-8 text-center bg-purple-50/30 rounded-2xl border border-purple-100 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-800">No Pending Reviews</p>
                    <p className="text-xs text-desc">All submitted syllabi have been reviewed by Dean.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingDeanReviewsList.map((s: any) => (
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
                )}
              </div>
            )}

            {/* TAB 6: APPROVED SYLLABI DIRECTORY (SEMESTER 1 TO 8 TABS) */}
            {activeTab === 'approved' && (
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Approved Syllabi Directory</h3>
                  <p className="text-xs text-desc">Official institutionally approved syllabi organized by Academic Semesters (1 to 8).</p>
                </div>

                {/* Semester 1 to 8 Tabs */}
                <div className="flex items-center space-x-2 border-b pb-3 overflow-x-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <button
                      key={sem}
                      onClick={() => setActiveDeanSemester(sem)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeDeanSemester === sem
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Semester {sem}
                    </button>
                  ))}
                </div>

                {/* Approved Subjects for Selected Semester */}
                {(() => {
                  const semSubjects = approvedSyllabiList
                    .filter((s: any) => s.semester === activeDeanSemester)
                    .sort((a: any, b: any) => a.subjectCode.localeCompare(b.subjectCode));

                  if (semSubjects.length === 0) {
                    return (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed text-desc text-xs">
                        No approved syllabi found in Semester {activeDeanSemester}.
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-purple-50 text-slate-700 font-semibold">
                          <tr>
                            <th className="p-3">Subject Code</th>
                            <th className="p-3">Subject Name</th>
                            <th className="p-3">Department</th>
                            <th className="p-3 text-center">L-T-P-C</th>
                            <th className="p-3">Faculty</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {semSubjects.map((subj: any) => (
                            <tr key={subj.id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono font-bold text-brand-700">{subj.subjectCode}</td>
                              <td className="p-3 font-bold text-slate-900">{subj.subjectName}</td>
                              <td className="p-3 font-semibold text-slate-700">{subj.department?.shortName || subj.department?.name}</td>
                              <td className="p-3 text-center font-semibold text-slate-700">
                                {subj.lecture}-{subj.tutorial}-{subj.practical}-{subj.credits}
                              </td>
                              <td className="p-3 text-slate-700">{subj.assignedFaculty?.name || 'N/A'}</td>
                              <td className="p-3">
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-300">
                                  Approved
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => setSelectedSyllabus(subj)}
                                  className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center inline-flex"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1" /> View & Print PDF
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
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
                  {extensionRequests.length === 0 ? (
                    <div className="p-8 text-center bg-purple-50/30 rounded-2xl border border-purple-100 text-xs font-bold text-slate-600">
                      No Extension requests
                    </div>
                  ) : (
                    extensionRequests.map((req) => (
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
                    ))
                  )}
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

        {/* Initiate / Update Stage Deadline Modal */}
        {showInitiateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                {targetStage?.name.includes('DAC') || targetStage?.name.includes('BoS')
                  ? `Schedule Meeting: ${targetStage?.name}`
                  : `Initiate / Update Stage: ${targetStage?.name}`}
              </h3>
              <p className="text-xs text-desc">{targetStage?.description}</p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">
                    {targetStage?.name.includes('DAC') || targetStage?.name.includes('BoS')
                      ? 'Scheduled Meeting Date *'
                      : 'Stage Deadline Date & Time *'}
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
                  {submittingStage ? 'Saving...' : 'Save Stage Deadline'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
