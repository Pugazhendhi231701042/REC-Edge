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
  const [deanReturnReason, setDeanReturnReason] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);

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
          action: 'INITIATE',
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

  const listToFilter = activeTab === 'reviews' ? pendingDeanReviewsList : approvedSyllabiList;

  const filteredSyllabi = listToFilter.filter((subj: any) => {
    const matchesSearch =
      subj.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subj.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'ALL' || subj.departmentId === filterDept;
    const matchesSem = filterSem === 'ALL' || subj.semester === parseInt(filterSem);
    return matchesSearch && matchesDept && matchesSem;
  });

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

                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Overall Completion"
                    value={`${overview?.overallCompletionPercentage || 0}%`}
                    subtitle={`${overview?.overallApproved || 0} / ${overview?.overallTotalSubjects || 0} Syllabi Approved`}
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  />
                  <StatCard
                    title="Total Departments"
                    value={overview?.deptSummaries?.length || 0}
                    subtitle="Active Academic Programmes"
                    icon={<Building2 className="w-5 h-5 text-brand-600" />}
                    onClick={() => setActiveTab('departments')}
                  />
                  <StatCard
                    title="Pending Dean Reviews"
                    value={pendingDeanReviewsList.length}
                    subtitle="HoD Approved Syllabi Awaiting Dean Review"
                    icon={<Eye className="w-5 h-5 text-indigo-600" />}
                    onClick={() => setActiveTab('reviews')}
                  />
                  <StatCard
                    title="Extension Requests"
                    value={extensionRequests.filter((r) => r.status === 'PENDING').length}
                    subtitle="Pending HoD Requests"
                    icon={<ShieldAlert className="w-5 h-5 text-amber-600" />}
                    onClick={() => setActiveTab('extensions')}
                  />
                </div>

                {/* Active Stage & Progress Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Academic Workflow Stage Progress</h3>
                    <div className="space-y-3">
                      {stages.map((stg) => (
                        <div key={stg.id} className="p-4 rounded-2xl border border-purple-100 bg-purple-50/30 flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-900">{stg.name}</span>
                              <StatusBadge status={stg.status} />
                            </div>
                            <p className="text-xs text-desc mt-0.5">{stg.description}</p>
                          </div>
                          {stg.status === 'INACTIVE' && (
                            <button
                              onClick={() => handleOpenInitiate(stg)}
                              className="px-3.5 py-1.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs"
                            >
                              Initiate Stage →
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
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
                  <h3 className="text-base font-bold text-slate-900">Academic Stage Governance</h3>
                  <p className="text-xs text-desc">Initiate and monitor Curriculum, DAC, and BoS meeting workflows.</p>
                </div>
                <div className="space-y-4">
                  {stages.map((stg) => (
                    <div key={stg.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{stg.name}</span>
                        <StatusBadge status={stg.status} />
                      </div>
                      <p className="text-xs text-desc">{stg.description}</p>
                      <div className="pt-2 border-t border-purple-100 text-xs text-slate-700 flex items-center justify-between">
                        <span>Deadline: <strong>{stg.deadline ? formatIST(stg.deadline) : 'Not Initiated'}</strong></span>
                        {stg.status === 'INACTIVE' && (
                          <button onClick={() => handleOpenInitiate(stg)} className="px-4 py-1.5 bg-brand-600 text-white font-bold rounded-xl text-xs">
                            Initiate Stage →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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

            {/* TAB 5: APPROVED SYLLABI & REVIEWS DEDICATED DIRECTORY PAGE */}
            {(activeTab === 'approved' || activeTab === 'reviews') && (
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {activeTab === 'reviews' ? 'Syllabus Reviews Awaiting Dean Approval' : 'Approved Syllabi Directory (Dean Access)'}
                  </h3>
                  <p className="text-xs text-desc">
                    {activeTab === 'reviews'
                      ? 'Syllabi approved by HoD requiring final institutional approval from Dean.'
                      : 'Inspect fully approved syllabi documents.'}
                  </p>
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

                {filteredSyllabi.length === 0 ? (
                  <p className="text-xs text-desc py-8 text-center">No syllabi match the selected filter criteria.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSyllabi.map((subj: any) => (
                      <div key={subj.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 hover:shadow-md transition-all flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold text-brand-700 uppercase bg-purple-100 px-2 py-0.5 rounded">
                              {subj.subjectCode} | Sem {subj.semester}
                            </span>
                            <StatusBadge status={subj.syllabusStatus} />
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mt-1">{subj.subjectName}</h4>
                          <p className="text-[11px] text-desc">Faculty: {subj.assignedFaculty?.name} | Dept: {subj.department?.shortName}</p>
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

            {/* TAB 6: EXTENSION REQUESTS DEDICATED PAGE */}
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
                            <span className="text-xs font-bold text-slate-900">{req.department?.programmeName} ({req.department?.shortName})</span>
                            <StatusBadge status={req.status} />
                          </div>
                          <p className="text-xs text-desc mt-0.5">
                            Requested by: <strong>{req.requestedBy?.name}</strong> | New Requested Deadline: <strong className="text-amber-800">{formatIST(req.requestedDeadline)}</strong>
                          </p>
                          <p className="text-xs text-slate-700 mt-1 bg-white p-2.5 rounded-xl border border-purple-100">
                            Reason: "{req.reason}"
                          </p>
                        </div>
                        {req.status === 'PENDING' && (
                          <div className="flex items-center space-x-2 shrink-0">
                            <button onClick={() => handleDecisionExtension(req.id, 'APPROVE')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center">
                              <Check className="w-4 h-4 mr-1" /> Approve
                            </button>
                            <button onClick={() => handleDecisionExtension(req.id, 'REJECT')} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center">
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

        {/* View Dean Review Modal (Without CO/PO Justification on Screen per Rule 58) */}
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

              {/* Dean On-Screen Viewer suppresses CO/PO Justification */}
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

        {/* Initiate Stage Modal */}
        {showInitiateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">Initiate Stage: {targetStage?.name}</h3>
              <p className="text-xs text-desc">{targetStage?.description}</p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Set Stage Deadline *</label>
                  <input
                    type="datetime-local"
                    value={initiateDeadline}
                    onChange={(e) => setInitiateDeadline(e.target.value)}
                    className="w-full p-2 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button onClick={() => setShowInitiateModal(false)} className="px-3 py-1.5 rounded-xl text-xs text-slate-600">Cancel</button>
                <button
                  onClick={handleConfirmInitiation}
                  disabled={submittingStage}
                  className="px-4 py-1.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-xs"
                >
                  {submittingStage ? 'Initiating...' : 'Confirm Initiation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
