'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SyllabusPDFGenerator } from '@/components/pdf/SyllabusPDFGenerator';
import { DepartmentCurriculumPDFGenerator } from '@/components/pdf/DepartmentCurriculumPDFGenerator';
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
  BookOpen,
} from 'lucide-react';

export default function DeanDashboard() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [extensionRequests, setExtensionRequests] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Department for Detail Page
  const [selectedDeptSummary, setSelectedDeptSummary] = useState<any>(null);

  // Department Bundle Review Modal State
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [showBundleReturnModal, setShowBundleReturnModal] = useState(false);
  const [bundleReturnReason, setBundleReturnReason] = useState('');

  // Bulk 4-Stage Deadlines Manager Modal
  const [showBulkStageModal, setShowBulkStageModal] = useState(false);
  const [bulkStageDates, setBulkStageDates] = useState<any[]>([]);

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

  // Step 2: Programme Planning Progress State
  const [progPlanningData, setProgPlanningData] = useState<any>(null);
  const [inspectingPlanDept, setInspectingPlanDept] = useState<any>(null);
  const [showProgReturnModal, setShowProgReturnModal] = useState<boolean>(false);
  const [progReturnReason, setProgReturnReason] = useState<string>('');
  const [targetReturnDeptId, setTargetReturnDeptId] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [activePlanSemester, setActivePlanSemester] = useState<number>(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resOverview, resStages, resExt, resBundles, resProg] = await Promise.all([
        fetch('/api/dean/overview'),
        fetch('/api/dean/stage'),
        fetch('/api/dean/extensions'),
        fetch('/api/dean/bundle-review'),
        fetch('/api/dean/programme-planning'),
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
      if (resBundles.ok) {
        const data = await resBundles.json();
        setBundles(data.bundles || []);
      }
      if (resProg.ok) {
        const pData = await resProg.json();
        setProgPlanningData(pData);
      }
    } catch (err: any) {
      setError('Failed to load Dean dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProgPlan = async (departmentId: string) => {
    if (!confirm('Are you sure you want to approve this Department Programme Curriculum Book?')) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/dean/programme-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE', departmentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to approve programme book.');
        return;
      }
      alert('✓ Programme Curriculum Book approved successfully!');
      fetchData();
      if (inspectingPlanDept?.department?.id === departmentId) {
        setInspectingPlanDept(null);
      }
    } catch (e) {
      console.error(e);
      alert('Error approving programme curriculum book.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReturnProgPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progReturnReason.trim()) {
      alert('Please enter revision remarks.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/dean/programme-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RETURN',
          departmentId: targetReturnDeptId,
          correctionReason: progReturnReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to return programme book.');
        return;
      }
      alert('Programme Curriculum Book returned for correction with feedback.');
      setShowProgReturnModal(false);
      setProgReturnReason('');
      setTargetReturnDeptId('');
      fetchData();
      if (inspectingPlanDept?.department?.id === targetReturnDeptId) {
        setInspectingPlanDept(null);
      }
    } catch (e) {
      console.error(e);
      alert('Error returning programme curriculum book.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenBulkStagesModal = () => {
    setBulkStageDates(
      stages.map((s) => ({
        id: s.id,
        order: s.order,
        name: s.name,
        startDate: s.startDate ? new Date(s.startDate).toISOString().slice(0, 16) : '',
        deadline: s.deadline ? new Date(s.deadline).toISOString().slice(0, 16) : '',
        status: s.status,
      }))
    );
    setShowBulkStageModal(true);
  };

  const handleSaveBulkStageDeadlines = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingStage(true);
    try {
      const res = await fetch('/api/dean/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BULK_UPDATE_STAGES',
          stages: bulkStageDates,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to save stage deadlines.');
        return;
      }
      alert('✓ Stage Deadlines configured successfully for all 4 stages!');
      setShowBulkStageModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed bulk stage update');
    } finally {
      setSubmittingStage(false);
    }
  };

  const handleDeanApproveBundle = async (bundleId: string) => {
    if (!confirm('Are you sure you want to approve this Department Curriculum Bundle? This will officially approve all subject syllabi for this department.')) return;
    try {
      const res = await fetch('/api/dean/bundle-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleId, action: 'APPROVE' }),
      });
      if (res.ok) {
        alert('✓ Department Curriculum Bundle Approved Successfully!');
        setSelectedBundle(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to approve bundle');
    }
  };

  const handleDeanReturnBundle = async () => {
    if (!selectedBundle || !bundleReturnReason.trim()) return;
    try {
      const res = await fetch('/api/dean/bundle-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleId: selectedBundle.id,
          action: 'RETURN',
          correctionReason: bundleReturnReason.trim(),
        }),
      });
      if (res.ok) {
        alert('Department Curriculum Bundle returned to HoD with correction notes.');
        setShowBundleReturnModal(false);
        setSelectedBundle(null);
        setBundleReturnReason('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to return bundle');
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
                      <StatusBadge status={stg.status} />
                    </div>
                    {stg.description && <p className="text-xs text-desc mt-0.5">{stg.description}</p>}
                  </div>
                </div>

                {/* Scheduled Info */}
                <div className="mt-3 pt-2.5 border-t border-purple-100/60 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
                  <div className="flex items-center space-x-1.5 font-medium">
                    <Clock className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>
                      From: <strong>{stg.startDate ? formatIST(stg.startDate) : 'Not Configured'}</strong> &nbsp;|&nbsp; To: <strong>{stg.deadline ? formatIST(stg.deadline) : 'Not Configured'}</strong>
                    </span>
                  </div>
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
                    <p className="text-xs text-desc mt-1">Dean / SuperAdmin Executive Governance — Curriculum Portal</p>
                  </div>
                  <div className="mt-3 md:mt-0 flex items-center space-x-3">
                    <button
                      onClick={handleOpenBulkStagesModal}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Configure Stage Deadlines</span>
                    </button>
                    {activeStage && (
                      <div className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-brand-800 border border-purple-200 text-xs font-bold flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-brand-600 animate-pulse" />
                        <span>Active Stage: <strong>{activeStage.name}</strong></span>
                      </div>
                    )}
                  </div>
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center">
                      <Layers className="w-4 h-4 mr-2 text-brand-600" /> Academic Stage Governance
                    </h3>
                    <p className="text-xs text-desc">Configure start dates and end deadlines for all 4 academic stages.</p>
                  </div>
                  <button
                    onClick={handleOpenBulkStagesModal}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Configure Deadlines</span>
                  </button>
                </div>

                {renderVerticalStageProgress()}
              </div>
            )}

            {/* TAB 3: PROGRAMME PLANNING PROGRESS DEDICATED PAGE (STEP 2) */}
            {activeTab === 'programme_planning_progress' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center">
                        <Layers className="w-4 h-4 mr-2 text-brand-600" />
                        Step 2: Programme Planning Progress & Governance Review
                      </h3>
                      <p className="text-xs text-desc mt-0.5">
                        Monitor 8-semester curriculum planning, verify MasterAdmin academic governance constraints, and review submitted Programme Curriculum Books.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        progPlanningData?.isStep2Unlocked
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {progPlanningData?.isStep2Unlocked ? '● Step 2 Active (Unlocked)' : '🔒 Step 2 Locked'}
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 text-center">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Programmes</span>
                      <span className="text-xl font-black text-brand-700">{progPlanningData?.departmentPlans?.length || 0}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-center">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Awaiting Approval</span>
                      <span className="text-xl font-black text-blue-700">
                        {progPlanningData?.departmentPlans?.filter((p: any) => p.submission?.status === 'SUBMITTED').length || 0}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Approved Books</span>
                      <span className="text-xl font-black text-emerald-700">
                        {progPlanningData?.departmentPlans?.filter((p: any) => p.submission?.status === 'APPROVED').length || 0}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 text-center">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Revisions Requested</span>
                      <span className="text-xl font-black text-rose-700">
                        {progPlanningData?.departmentPlans?.filter((p: any) => p.submission?.status === 'RETURNED_FOR_CORRECTION').length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Department Programme Planning Cards */}
                <div className="grid grid-cols-1 gap-4">
                  {progPlanningData?.departmentPlans?.map((plan: any) => {
                    const status = plan.submission?.status || 'DRAFT';
                    const isSubmitted = status === 'SUBMITTED';
                    const isApproved = status === 'APPROVED';
                    const isReturned = status === 'RETURNED_FOR_CORRECTION';

                    return (
                      <div
                        key={plan.department.id}
                        className={`p-6 rounded-3xl border transition-all ${
                          isSubmitted
                            ? 'bg-amber-50/20 border-amber-300 shadow-sm'
                            : isApproved
                            ? 'bg-emerald-50/20 border-emerald-200'
                            : 'bg-white border-purple-100 shadow-sm'
                        } space-y-4`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-extrabold uppercase bg-purple-100 text-brand-700 px-2.5 py-0.5 rounded-full">
                                {plan.department.programmeType} | Code: {plan.department.departmentCode}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                {plan.department.semesters || 8} Semesters
                              </span>
                            </div>
                            <h4 className="text-base font-extrabold text-slate-900 mt-1">
                              {plan.department.programmeName}
                            </h4>
                            <p className="text-xs text-desc">HoD: {plan.department.hod?.name || 'Unassigned'}</p>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isSubmitted
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : isReturned
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isApproved
                                ? '✓ Approved'
                                : isSubmitted
                                ? '● Awaiting Dean Approval'
                                : isReturned
                                ? '↺ Needs Revision'
                                : 'Draft Planning'}
                            </span>

                            <button
                              onClick={() => {
                                setInspectingPlanDept(plan);
                                setActivePlanSemester(1);
                              }}
                              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect Programme Book →</span>
                            </button>
                          </div>
                        </div>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-500 block">Total Planned Credits</span>
                            <span className="text-sm font-black text-slate-900">
                              {plan.totalCredits} C{' '}
                              <span className="text-[10px] text-slate-500 font-normal">
                                (Target: {progPlanningData?.creditConfig?.minTotalCredits}–{progPlanningData?.creditConfig?.maxTotalCredits} C)
                              </span>
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-500 block">Planned Subjects</span>
                            <span className="text-sm font-black text-slate-900">{plan.plannedSubjectsCount} Courses</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-500 block">Total Laboratories</span>
                            <span className="text-sm font-black text-slate-900">
                              {plan.totalLabs} / {progPlanningData?.creditConfig?.maxLabTotal} Max
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-500 block">Governance Rules Status</span>
                            <span
                              className={`text-xs font-bold ${
                                plan.isValid ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {plan.isValid ? '✅ Satisfied' : '⚠️ Incomplete / Violations'}
                            </span>
                          </div>
                        </div>

                        {/* Quick Approve / Return Buttons for Submitted Books */}
                        {isSubmitted && (
                          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-amber-200">
                            <button
                              disabled={submittingReview}
                              onClick={() => {
                                setTargetReturnDeptId(plan.department.id);
                                setProgReturnReason('');
                                setShowProgReturnModal(true);
                              }}
                              className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl transition-all flex items-center space-x-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Return for Correction</span>
                            </button>
                            <button
                              disabled={submittingReview}
                              onClick={() => handleApproveProgPlan(plan.department.id)}
                              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve Programme Book</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {(!progPlanningData?.departmentPlans || progPlanningData?.departmentPlans.length === 0) && (
                    <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed text-desc text-xs">
                      No departments found.
                    </div>
                  )}
                </div>

                {/* MODAL: INSPECT DEPARTMENT PROGRAMME CURRICULUM BOOK */}
                {inspectingPlanDept && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6 border border-purple-100">
                      <div className="flex items-center justify-between border-b pb-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-extrabold uppercase bg-purple-100 text-brand-700 px-2 py-0.5 rounded">
                              {inspectingPlanDept.department.programmeType} | Code: {inspectingPlanDept.department.departmentCode}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              {inspectingPlanDept.department.semesters || 8} Semesters
                            </span>
                          </div>
                          <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                            {inspectingPlanDept.department.programmeName} — Programme Curriculum Book
                          </h3>
                        </div>
                        <button
                          onClick={() => setInspectingPlanDept(null)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Semester Tabs */}
                      <div className="flex items-center space-x-2 border-b pb-3 overflow-x-auto">
                        {Array.from({ length: inspectingPlanDept.department.semesters || 8 }, (_, i) => i + 1).map((sem) => (
                          <button
                            key={sem}
                            onClick={() => setActivePlanSemester(sem)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              activePlanSemester === sem
                                ? 'bg-brand-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Semester {sem} ({inspectingPlanDept.semCreditsMap[sem] || 0} C)
                          </button>
                        ))}
                      </div>

                      {/* Semester Subjects Table */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-800">
                            Semester {activePlanSemester} Courses ({inspectingPlanDept.semCreditsMap[activePlanSemester] || 0} Credits)
                          </h4>
                          <span className="text-xs text-desc">
                            Labs in Sem {activePlanSemester}: {inspectingPlanDept.semLabsMap[activePlanSemester] || 0}
                          </span>
                        </div>

                        {(() => {
                          const semItems = inspectingPlanDept.plannedItems.filter(
                            (p: any) => p.semester === activePlanSemester
                          );

                          if (semItems.length === 0) {
                            return (
                              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed text-desc text-xs">
                                No subjects planned in Semester {activePlanSemester} yet.
                              </div>
                            );
                          }

                          return (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-purple-50 text-slate-700 font-semibold">
                                  <tr>
                                    <th className="p-3">Course Code</th>
                                    <th className="p-3">Course Title</th>
                                    <th className="p-3">Offered By</th>
                                    <th className="p-3 text-center">Type</th>
                                    <th className="p-3 text-center">Category</th>
                                    <th className="p-3 text-center">L - T - P</th>
                                    <th className="p-3 text-center">Credits</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {semItems.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                      <td className="p-3 font-mono font-bold text-brand-700">{item.subject.subjectCode}</td>
                                      <td className="p-3 font-bold text-slate-900">{item.subject.subjectName}</td>
                                      <td className="p-3 text-slate-600">{item.subject.department?.shortName || 'Dept'}</td>
                                      <td className="p-3 text-center">
                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">
                                          {item.subject.subjectType?.name}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className="px-2 py-0.5 bg-purple-100 rounded text-[10px] font-bold text-brand-700">
                                          {item.subject.subjectCategory?.code}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center text-slate-700">
                                        {item.subject.lecture} - {item.subject.tutorial} - {item.subject.practical}
                                      </td>
                                      <td className="p-3 text-center font-bold text-slate-900">{item.subject.credits} C</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Review Actions inside Modal */}
                      <div className="border-t pt-4 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">
                          Total Programme Credits: <strong className="text-brand-700">{inspectingPlanDept.totalCredits} C</strong>
                        </span>

                        <div className="flex items-center space-x-2">
                          {inspectingPlanDept.submission?.status === 'SUBMITTED' && (
                            <>
                              <button
                                disabled={submittingReview}
                                onClick={() => {
                                  setTargetReturnDeptId(inspectingPlanDept.department.id);
                                  setProgReturnReason('');
                                  setShowProgReturnModal(true);
                                }}
                                className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl transition-all"
                              >
                                Return for Revision
                              </button>
                              <button
                                disabled={submittingReview}
                                onClick={() => handleApproveProgPlan(inspectingPlanDept.department.id)}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve Programme Book</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setInspectingPlanDept(null)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL: RETURN PROGRAMME BOOK FOR REVISION */}
                {showProgReturnModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-rose-200">
                      <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="text-sm font-bold text-rose-900 flex items-center">
                          <RotateCcw className="w-4 h-4 mr-1.5 text-rose-600" />
                          Return Programme Curriculum Book for Revision
                        </h3>
                        <button
                          onClick={() => setShowProgReturnModal(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleReturnProgPlan} className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Revision Remarks & Required Adjustments:
                          </label>
                          <textarea
                            required
                            rows={4}
                            value={progReturnReason}
                            onChange={(e) => setProgReturnReason(e.target.value)}
                            placeholder="Specify credit violations, prerequisite changes, or semester restructuring required..."
                            className="w-full text-xs p-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                          />
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowProgReturnModal(false)}
                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submittingReview}
                            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                          >
                            Send Revision Remarks
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
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

            {/* TAB 8: DEPARTMENT CURRICULUM BUNDLES DEDICATED PAGE */}
            {activeTab === 'bundles' && (
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Department Curriculum Bundles Governance</h3>
                  <p className="text-xs text-desc">Review and approve consolidated Department Curriculum Books (POs, PSOs, PEOs & all syllabi) submitted by HoDs.</p>
                </div>

                {bundles.length === 0 ? (
                  <div className="p-8 text-center bg-purple-50/30 rounded-2xl border border-purple-100 text-xs font-bold text-slate-600">
                    No Department Curriculum Bundles submitted yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bundles.map((bundle: any) => (
                      <div key={bundle.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-brand-700 uppercase bg-purple-100 px-2 py-0.5 rounded">
                              {bundle.department?.shortName}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">{bundle.department?.programmeName}</h4>
                          </div>
                          <StatusBadge status={bundle.status} />
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-purple-100 text-xs text-slate-700 space-y-1">
                          <p><strong>HoD:</strong> {bundle.department?.users?.find((u: any) => u.role === 'HOD')?.name || 'HoD'}</p>
                          <p><strong>Submitted On:</strong> {bundle.submissionDate ? formatIST(bundle.submissionDate) : 'N/A'}</p>
                          <p><strong>Total Subjects:</strong> {bundle.subjects?.length || 0}</p>
                          {bundle.correctionReason && (
                            <p className="text-amber-700 font-semibold mt-1">
                              <strong>Correction Note:</strong> "{bundle.correctionReason}"
                            </p>
                          )}
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => setSelectedBundle(bundle)}
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center"
                          >
                            <BookOpen className="w-4 h-4 mr-1.5" /> Inspect & Review Bundle
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

        {/* Department Curriculum Bundle Inspection Modal */}
        {selectedBundle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Dean Review — {selectedBundle.department?.programmeName} ({selectedBundle.department?.shortName})
                  </h3>
                  <StatusBadge status={selectedBundle.status} />
                </div>
                <button onClick={() => setSelectedBundle(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* PDF Preview Generator */}
              <DepartmentCurriculumPDFGenerator
                department={selectedBundle.department}
                peoStatements={selectedBundle.department?.programEducationalObjectiveStatements || selectedBundle.peoStatements || []}
                poStatements={selectedBundle.department?.programOutcomeStatements || selectedBundle.poStatements || []}
                psoStatements={selectedBundle.department?.programSpecificOutcomeStatements || selectedBundle.psoStatements || []}
                subjects={selectedBundle.department?.subjects || selectedBundle.subjects || []}
                documentTitle={`Department Curriculum Book — ${selectedBundle.department?.shortName}`}
              />

              {/* Dean Actions */}
              {selectedBundle.status === 'SUBMITTED' && (
                <div className="pt-4 border-t flex items-center justify-between">
                  <span className="text-xs text-desc font-semibold">
                    Review consolidated PEOs, POs, PSOs and subject syllabi before official institutional approval.
                  </span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowBundleReturnModal(true)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center"
                    >
                      <RotateCcw className="w-4 h-4 mr-1.5" /> Return Bundle to HoD
                    </button>
                    <button
                      onClick={() => handleDeanApproveBundle(selectedBundle.id)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center"
                    >
                      <ShieldCheck className="w-4 h-4 mr-1.5" /> Approve Department Bundle
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bundle Return Correction Reason Modal */}
        {showBundleReturnModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">Return Department Bundle</h3>
              <p className="text-xs text-desc">Provide correction notes for the HoD to revise the curriculum bundle.</p>
              <textarea
                rows={4}
                required
                value={bundleReturnReason}
                onChange={(e) => setBundleReturnReason(e.target.value)}
                placeholder="Enter detailed correction requirements..."
                className="w-full p-3 text-xs border rounded-xl"
              />
              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button onClick={() => setShowBundleReturnModal(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
                <button onClick={handleDeanReturnBundle} disabled={!bundleReturnReason.trim()} className="px-4 py-1.5 text-xs bg-amber-600 text-white font-bold rounded-xl disabled:opacity-50">
                  Return Bundle to HoD
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk 4-Stage Deadlines Manager Modal */}
        {showBulkStageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-brand-600" />
                  <h3 className="text-base font-bold text-slate-900">Configure All 4 Academic Stage Deadlines</h3>
                </div>
                <button onClick={() => setShowBulkStageModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-desc">
                Set start dates and deadlines for all 4 official stages. If an extension is approved for any stage in the future, all subsequent stages will automatically shift forward.
              </p>

              <form onSubmit={handleSaveBulkStageDeadlines} className="space-y-4">
                {bulkStageDates.map((stg) => (
                  <div key={stg.id} className="p-4 rounded-2xl border border-purple-100 bg-purple-50/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-900">
                        Stage {stg.order}: {stg.name}
                      </h4>
                      <StatusBadge status={stg.status} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">Start Date</label>
                        <input
                          type="date"
                          value={stg.startDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBulkStageDates((prev) =>
                              prev.map((item) => (item.id === stg.id ? { ...item, startDate: val } : item))
                            );
                          }}
                          className="w-full p-2 border rounded-xl font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">Deadline Date</label>
                        <input
                          type="date"
                          value={stg.deadline}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBulkStageDates((prev) =>
                              prev.map((item) => (item.id === stg.id ? { ...item, deadline: val } : item))
                            );
                          }}
                          className="w-full p-2 border rounded-xl font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end space-x-3 pt-3 border-t">
                  <button type="button" onClick={() => setShowBulkStageModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingStage}
                    className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md disabled:opacity-50"
                  >
                    {submittingStage ? 'Saving Deadlines...' : 'Save All Stage Deadlines'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
