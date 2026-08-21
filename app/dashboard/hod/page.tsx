'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SubjectFormModal } from '@/components/curriculum/SubjectFormModal';
import { SyllabusPDFGenerator } from '@/components/pdf/SyllabusPDFGenerator';
import { formatIST } from '@/lib/time';
import {
  BookOpen,
  Users,
  Plus,
  CheckCircle2,
  Lock,
  UserCheck,
  RotateCcw,
  Send,
  Eye,
  ShieldAlert,
  X,
  Trash2,
  Sparkles,
  ArrowRight,
  Search,
  Filter,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function HoDDashboard() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [department, setDepartment] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectTypes, setSubjectTypes] = useState<any[]>([]);
  const [subjectCategories, setSubjectCategories] = useState<any[]>([]);
  const [activeSemester, setActiveSemester] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States for Progress / Approved
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetSubjectForAssign, setTargetSubjectForAssign] = useState<any>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('');

  const [poStatements, setPoStatements] = useState<Record<string, string>>({});
  const [psoStatements, setPsoStatements] = useState<Record<string, string>>({});
  const [poMsg, setPoMsg] = useState('');

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewSubject, setReviewSubject] = useState<any>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [returnDeadline, setReturnDeadline] = useState('');

  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extDeadline, setExtDeadline] = useState('');
  const [extReason, setExtReason] = useState('');

  // Delete Unassigned Subject Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSubj, resRegs] = await Promise.all([
        fetch('/api/hod/subjects'),
        fetch('/api/master-admin/regulations'),
      ]);

      if (resSubj.ok) {
        const data = await resSubj.json();
        setSubjects(data.subjects || []);
        setDepartment(data.department);
      }

      if (resRegs.ok) {
        const data = await resRegs.json();
        setSubjectTypes(data.subjectTypes || []);
        setSubjectCategories(data.subjectCategories || []);
      }

      fetchPOPSOStatements();
    } catch (err) {
      setError('Failed to load department curriculum data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPOPSOStatements = async () => {
    try {
      const res = await fetch('/api/hod/po-pso');
      if (res.ok) {
        const data = await res.json();
        const poMap: Record<string, string> = {};
        const psoMap: Record<string, string> = {};
        (data.poStatements || []).forEach((s: any) => { poMap[s.poKey] = s.statement; });
        (data.psoStatements || []).forEach((s: any) => { psoMap[s.psoKey] = s.statement; });
        setPoStatements(poMap);
        setPsoStatements(psoMap);
      }
    } catch (err) {}
  };

  const handleSavePOPSOStatement = async (type: 'PO' | 'PSO', key: string, statement: string) => {
    setPoMsg('');
    try {
      const res = await fetch('/api/hod/po-pso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, key, statement }),
      });
      if (res.ok) {
        setPoMsg(`${key} statement saved successfully.`);
        fetchPOPSOStatements();
      }
    } catch (err) {
      console.error('Failed to save statement');
    }
  };

  const handleFinalizeCurriculum = async () => {
    if (!confirm('Finalize Department Curriculum? This will lock subject LTPC definitions and unlock faculty assignment.')) return;
    try {
      const res = await fetch('/api/hod/curriculum/finalize', { method: 'POST' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to finalize curriculum');
    }
  };

  const handleAssignFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSubjectForAssign || !selectedFacultyId) return;

    try {
      const res = await fetch('/api/hod/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: targetSubjectForAssign.id,
          facultyId: selectedFacultyId,
          deadline: assignDeadline || null,
        }),
      });

      if (res.ok) {
        setShowAssignModal(false);
        setAssignDeadline('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to assign faculty');
    }
  };

  const handleConfirmDeleteUnassigned = async () => {
    if (!subjectToDelete) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/hod/subjects?id=${subjectToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete subject.');
      }

      setShowDeleteModal(false);
      setSubjectToDelete(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Requirement: Check if PO/PSO statements are configured
  const hasConfiguredPOPSO = Object.keys(poStatements).length > 0;

  const handleOpenAddSubject = () => {
    if (!hasConfiguredPOPSO) {
      alert('Action Required: Please configure Department PO & PSO Statements first before creating subjects.');
      setActiveTab('po_pso');
      return;
    }
    setEditingSubject(null);
    setShowSubjectModal(true);
  };

  const handleReviewAction = async (action: 'APPROVE' | 'RETURN') => {
    if (!reviewSubject) return;
    if (action === 'RETURN' && !correctionReason.trim()) {
      alert('A correction reason is required when returning a syllabus.');
      return;
    }

    try {
      const res = await fetch('/api/hod/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: reviewSubject.id,
          action,
          reason: correctionReason,
          returnDeadline: returnDeadline || null,
        }),
      });

      if (res.ok) {
        setShowReviewModal(false);
        setCorrectionReason('');
        setReturnDeadline('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to submit review');
    }
  };

  const handleRequestExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extDeadline || !extReason.trim()) return;

    try {
      const res = await fetch('/api/hod/extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedDeadline: extDeadline,
          reason: extReason,
        }),
      });

      if (res.ok) {
        setShowExtensionModal(false);
        alert('Extension request submitted to Dean.');
      }
    } catch (err) {
      console.error('Failed extension request');
    }
  };

  const fetchFullSubjectForReview = async (subj: any) => {
    try {
      const res = await fetch(`/api/faculty/syllabus/${subj.id}`);
      if (res.ok) {
        const data = await res.json();
        setReviewSubject(data.subject);
        setShowReviewModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch full subject for review');
    }
  };

  const semCount = department?.semesters || 8;
  const semesterNumbers = Array.from({ length: semCount }, (_, i) => i + 1);

  const totalDepartmentSubjects = subjects.length;
  const assignedCount = subjects.filter((s) => s.status === 'ASSIGNED').length;
  const submittedCount = subjects.filter((s) => s.syllabusStatus === 'SUBMITTED' || s.syllabusStatus === 'RESUBMITTED').length;
  const approvedCount = subjects.filter((s) => s.syllabusStatus === 'APPROVED').length;
  const completionPercentage = totalDepartmentSubjects > 0 ? Math.round((approvedCount / totalDepartmentSubjects) * 100) : 0;

  const isCurriculumFinalized = subjects.some((s) => s.status === 'FINALIZED' || s.status === 'ASSIGNED');
  const activeSemSubjects = subjects.filter((s) => s.semester === activeSemester);

  // Submissions Awaiting Review
  const pendingReviewSubjects = subjects.filter((s) => s.syllabusStatus === 'SUBMITTED' || s.syllabusStatus === 'RESUBMITTED');

  // Faculty Workload Summary
  const facultyList = department?.users?.filter((u: any) => u.role === 'FACULTY') || [];
  const facultyWorkload = facultyList.map((fac: any) => {
    const facSubjs = subjects.filter((s) => s.assignedFacultyId === fac.id);
    const facApproved = facSubjs.filter((s) => s.syllabusStatus === 'APPROVED').length;
    const facSubmitted = facSubjs.filter((s) => s.syllabusStatus === 'SUBMITTED' || s.syllabusStatus === 'RESUBMITTED').length;
    return {
      faculty: fac,
      totalAssigned: facSubjs.length,
      approved: facApproved,
      submitted: facSubmitted,
      subjects: facSubjs,
    };
  });

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* TAB 1: DEPARTMENT OVERVIEW (EXECUTIVE DASHBOARD) */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {department?.programmeName} ({department?.shortName})
                </h1>
                <p className="text-xs text-desc mt-1">
                  Department Code: <strong>{department?.departmentCode}</strong> | Semesters: <strong>{semCount}</strong>
                </p>
              </div>

              <div className="mt-4 md:mt-0 flex items-center space-x-3">
                {!isCurriculumFinalized && (
                  <button
                    onClick={handleFinalizeCurriculum}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center"
                  >
                    <Lock className="w-4 h-4 mr-1.5" /> Finalize Curriculum
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('po_pso')}
                  className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-brand-900 font-bold text-xs rounded-xl border border-purple-300 flex items-center shadow-xs"
                >
                  <Sparkles className="w-4 h-4 mr-1.5 text-brand-700" /> PO & PSO Statements
                </button>
                <button
                  onClick={() => setActiveTab('extension')}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-brand-700 font-bold text-xs rounded-xl border border-purple-200 flex items-center"
                >
                  <ShieldAlert className="w-4 h-4 mr-1.5" /> Request Extension
                </button>
              </div>
            </div>

            {/* Consolidated KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-1">
                <p className="text-xs font-bold text-slate-500">Total Subjects</p>
                <p className="text-2xl font-black text-slate-900">{totalDepartmentSubjects}</p>
                <button onClick={() => setActiveTab('curriculum')} className="text-[11px] font-bold text-brand-600 hover:underline flex items-center mt-1">
                  View Curriculum <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-1">
                <p className="text-xs font-bold text-slate-500">Faculty Assigned</p>
                <p className="text-2xl font-black text-indigo-600">{assignedCount}</p>
                <button onClick={() => setActiveTab('assignments')} className="text-[11px] font-bold text-brand-600 hover:underline flex items-center mt-1">
                  View Assignments <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-1">
                <p className="text-xs font-bold text-slate-500">Syllabus Submitted</p>
                <p className="text-2xl font-black text-blue-600">{submittedCount}</p>
                <button onClick={() => setActiveTab('review')} className="text-[11px] font-bold text-brand-600 hover:underline flex items-center mt-1">
                  Review Syllabi <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-1">
                <p className="text-xs font-bold text-slate-500">HoD Approved</p>
                <p className="text-2xl font-black text-emerald-600">{approvedCount}</p>
                <button onClick={() => setActiveTab('approved')} className="text-[11px] font-bold text-brand-600 hover:underline flex items-center mt-1">
                  View Approved <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>

            {/* Pending Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Pending Actions Summary */}
              <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">Pending Actions</h3>

                <div className="space-y-3 text-xs">
                  {totalDepartmentSubjects - assignedCount > 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                      <span className="font-bold text-amber-900">{totalDepartmentSubjects - assignedCount} Subject(s) awaiting Faculty Assignment</span>
                      <button onClick={() => setActiveTab('curriculum')} className="px-3 py-1 bg-amber-600 text-white font-bold text-xs rounded-xl">
                        Assign →
                      </button>
                    </div>
                  )}

                  {pendingReviewSubjects.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                      <span className="font-bold text-brand-900">{pendingReviewSubjects.length} Syllabi awaiting HoD Review</span>
                      <button onClick={() => setActiveTab('review')} className="px-3 py-1 bg-brand-600 text-white font-bold text-xs rounded-xl">
                        Review →
                      </button>
                    </div>
                  )}

                  {totalDepartmentSubjects - assignedCount === 0 && pendingReviewSubjects.length === 0 && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center">
                      <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600" />
                      All subjects are assigned and reviewed.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Semester Progress Overview Cards */}
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Semester-wise Curriculum Breakdown</h3>
                <button onClick={() => setActiveTab('curriculum')} className="text-xs font-bold text-brand-600 hover:underline flex items-center">
                  View Full Curriculum <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {semesterNumbers.map((sem) => {
                  const semSubjs = subjects.filter((s) => s.semester === sem);
                  const semApproved = semSubjs.filter((s) => s.syllabusStatus === 'APPROVED').length;
                  const semPct = semSubjs.length > 0 ? Math.round((semApproved / semSubjs.length) * 100) : 0;
                  return (
                    <div key={sem} className="p-3.5 rounded-2xl border border-purple-100 bg-purple-50/20 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900">Semester {sem}</span>
                        <span className="text-brand-700">{semPct}%</span>
                      </div>
                      <p className="text-[11px] text-desc">{semSubjs.length} Subjects ({semApproved} Approved)</p>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: `${semPct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CURRICULUM & SUBJECTS DEDICATED PAGE */}
        {(activeTab === 'curriculum' || activeTab === 'subjects') && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Department Curriculum & Subjects Master</h3>
                <p className="text-xs text-desc">Form subjects, assign faculty members, and manage LTPC credits.</p>
              </div>
              <button
                onClick={handleOpenAddSubject}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Subject to Sem {activeSemester}
              </button>
            </div>

            {!hasConfiguredPOPSO && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    <strong>Action Required:</strong> Department PO & PSO statements have not been configured yet. HoD must setup PO/PSO statements before creating subjects.
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('po_pso')}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shrink-0"
                >
                  Setup PO & PSO Statements →
                </button>
              </div>
            )}

            {/* Semester Tabs */}
            <div className="flex items-center space-x-2 border-b pb-3 overflow-x-auto">
              {semesterNumbers.map((sem) => (
                <button
                  key={sem}
                  onClick={() => setActiveSemester(sem)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeSemester === sem ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Semester {sem}
                </button>
              ))}
            </div>

            {/* Subject Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-purple-50 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-3">Subject Code</th>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">L-T-P-C</th>
                    <th className="p-3">Assigned Faculty</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeSemSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-desc text-xs">
                        No subjects formed yet for Semester {activeSemester}.
                      </td>
                    </tr>
                  ) : (
                    activeSemSubjects.map((subj) => {
                      const isUnassigned = !subj.assignedFacultyId && subj.status !== 'ASSIGNED';
                      return (
                        <tr key={subj.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-brand-700">{subj.subjectCode}</td>
                          <td className="p-3 font-bold text-slate-900">{subj.subjectName}</td>
                          <td className="p-3 text-slate-600">{subj.subjectType?.name}</td>
                          <td className="p-3 text-slate-600">{subj.subjectCategory?.code}</td>
                          <td className="p-3 text-center font-semibold text-slate-800">
                            {subj.lecture}-{subj.tutorial}-{subj.practical}-{subj.credits}
                          </td>
                          <td className="p-3 font-semibold text-indigo-900">
                            {subj.assignedFaculty ? (
                              <span>
                                {subj.assignedFaculty.name}{' '}
                                <span className="font-mono text-[10px] text-slate-500">({subj.assignedFaculty.userCode})</span>
                              </span>
                            ) : (
                              <span className="text-amber-600 font-normal">Unassigned</span>
                            )}
                          </td>
                          <td className="p-3">
                            <StatusBadge status={subj.syllabusStatus} />
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setTargetSubjectForAssign(subj);
                                setSelectedFacultyId(subj.assignedFacultyId || '');
                                setShowAssignModal(true);
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded-lg border border-indigo-200 text-xs inline-flex items-center"
                            >
                              <UserCheck className="w-3.5 h-3.5 mr-1" />
                              {subj.assignedFaculty ? 'Reassign' : 'Assign'}
                            </button>

                            {isUnassigned && (
                              <button
                                onClick={() => {
                                  setSubjectToDelete(subj);
                                  setShowDeleteModal(true);
                                }}
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg border border-red-200 text-xs inline-flex items-center"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                              </button>
                            )}

                            {(subj.syllabusStatus === 'SUBMITTED' || subj.syllabusStatus === 'RESUBMITTED' || subj.syllabusStatus === 'APPROVED') && (
                              <button
                                onClick={() => fetchFullSubjectForReview(subj)}
                                className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs inline-flex items-center"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> Review
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: FACULTY ASSIGNMENTS DEDICATED PAGE */}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Faculty Workload & Assignments</h3>
              <p className="text-xs text-desc">Overview of subject distribution across department faculty members.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {facultyWorkload.map((fw: any) => (
                <div key={fw.faculty.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-brand-700 bg-purple-100 px-2 py-0.5 rounded">
                      ID: {fw.faculty.userCode || 'N/A'}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{fw.totalAssigned} Subjects</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{fw.faculty.name}</h4>
                    <p className="text-xs text-desc">{fw.faculty.email}</p>
                  </div>
                  <div className="pt-2 border-t border-purple-100 text-xs space-y-1">
                    <p>Approved: <strong className="text-emerald-700">{fw.approved}</strong></p>
                    <p>Submitted/Review: <strong className="text-blue-700">{fw.submitted}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SYLLABUS PROGRESS DEDICATED PAGE */}
        {activeTab === 'progress' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Department Syllabus Progress Tracker</h3>
              <p className="text-xs text-desc">Track status across all subject syllabi.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-purple-50 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-3">Subject Code</th>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3">Semester</th>
                    <th className="p-3">Faculty</th>
                    <th className="p-3">Syllabus Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((subj) => (
                    <tr key={subj.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-brand-700">{subj.subjectCode}</td>
                      <td className="p-3 font-bold text-slate-900">{subj.subjectName}</td>
                      <td className="p-3 font-semibold text-slate-700">Sem {subj.semester}</td>
                      <td className="p-3 font-semibold text-indigo-900">{subj.assignedFaculty?.name || 'Unassigned'}</td>
                      <td className="p-3"><StatusBadge status={subj.syllabusStatus} /></td>
                      <td className="p-3 text-right">
                        {subj.submission && (
                          <button
                            onClick={() => fetchFullSubjectForReview(subj)}
                            className="px-3 py-1 bg-brand-600 text-white font-bold text-xs rounded-lg shadow-xs"
                          >
                            Inspect →
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SUBMITTED / REVIEW DEDICATED PAGE */}
        {activeTab === 'review' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Submitted Syllabi Awaiting HoD Review</h3>
              <p className="text-xs text-desc">Review submitted syllabi documents and issue approval decisions.</p>
            </div>

            {pendingReviewSubjects.length === 0 ? (
              <p className="text-xs text-desc py-8 text-center">No submitted syllabi currently awaiting HoD review.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingReviewSubjects.map((subj) => (
                  <div key={subj.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 space-y-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-brand-700 uppercase bg-purple-100 px-2 py-0.5 rounded">
                        {subj.subjectCode} | Sem {subj.semester}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">{subj.subjectName}</h4>
                      <p className="text-[11px] text-desc">Submitted by: {subj.assignedFaculty?.name}</p>
                    </div>
                    <button
                      onClick={() => fetchFullSubjectForReview(subj)}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      Review & Decide
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: APPROVED SYLLABI DEDICATED PAGE */}
        {activeTab === 'approved' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Approved Department Syllabi Directory</h3>
              <p className="text-xs text-desc">Completed syllabi with official HoD signoff.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.filter((s) => s.syllabusStatus === 'APPROVED').map((subj) => (
                <div key={subj.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 space-y-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      Approved | {subj.subjectCode}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{subj.subjectName}</h4>
                    <p className="text-[11px] text-desc">Faculty: {subj.assignedFaculty?.name}</p>
                  </div>
                  <button
                    onClick={() => fetchFullSubjectForReview(subj)}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl"
                  >
                    View Document
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: EXTENSION REQUEST DEDICATED PAGE */}
        {activeTab === 'extension' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5 max-w-xl">
            <div>
              <h3 className="text-base font-bold text-slate-900">Request Deadline Extension</h3>
              <p className="text-xs text-desc">Submit deadline extension request to the Academic Dean.</p>
            </div>

            <form onSubmit={handleRequestExtension} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Requested New Deadline *</label>
                <input
                  type="datetime-local"
                  required
                  value={extDeadline}
                  onChange={(e) => setExtDeadline(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Justification Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={extReason}
                  onChange={(e) => setExtReason(e.target.value)}
                  placeholder="e.g. Additional time required for faculty syllabus review..."
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md">
                Submit Request to Dean
              </button>
            </form>
          </div>
        )}

        {/* TAB 8: PO & PSO STATEMENTS MANAGEMENT */}
        {activeTab === 'po_pso' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 md:p-8 shadow-sm space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Program Outcomes (POs) & Program Specific Outcomes (PSOs)</h3>
                <p className="text-xs text-desc">Define statement text for PO1..PO12 and PSO1..PSO3. Faculty will see these statements while mapping Course Outcomes (COs).</p>
              </div>
              {poMsg && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  {poMsg}
                </span>
              )}
            </div>

            {/* PO1 to PO12 */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider">Program Outcomes (PO1 to PO12)</h4>
              {Array.from({ length: 12 }, (_, i) => `PO${i + 1}`).map((poKey) => (
                <div key={poKey} className="p-4 border rounded-2xl bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-brand-700">{poKey} Statement</span>
                    <button
                      type="button"
                      onClick={() => handleSavePOPSOStatement('PO', poKey, poStatements[poKey] || '')}
                      className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      Save {poKey}
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={poStatements[poKey] || ''}
                    onChange={(e) => setPoStatements({ ...poStatements, [poKey]: e.target.value })}
                    placeholder={`Enter ${poKey} statement text (e.g. Engineering knowledge: Apply the knowledge of mathematics, science...)`}
                    className="w-full p-2.5 text-xs border rounded-xl font-medium focus:ring-brand-500 bg-white"
                  />
                </div>
              ))}
            </div>

            {/* PSO1 to PSO3 */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Program Specific Outcomes (PSO1 to PSO3)</h4>
              {Array.from({ length: 3 }, (_, i) => `PSO${i + 1}`).map((psoKey) => (
                <div key={psoKey} className="p-4 border border-amber-200 rounded-2xl bg-amber-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-900">{psoKey} Statement</span>
                    <button
                      type="button"
                      onClick={() => handleSavePOPSOStatement('PSO', psoKey, psoStatements[psoKey] || '')}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      Save {psoKey}
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={psoStatements[psoKey] || ''}
                    onChange={(e) => setPsoStatements({ ...psoStatements, [psoKey]: e.target.value })}
                    placeholder={`Enter ${psoKey} statement text (e.g. Professional Skills: Ability to design and develop software solutions...)`}
                    className="w-full p-2.5 text-xs border rounded-xl font-medium focus:ring-amber-500 bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modals */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Delete Subject?</h3>
              <p className="text-xs text-desc">
                This subject (<strong>{subjectToDelete?.subjectCode} — {subjectToDelete?.subjectName}</strong>) has not yet been assigned to a faculty. Are you sure you want to permanently delete it?
              </p>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button onClick={handleConfirmDeleteUnassigned} disabled={deleting} className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md">
                  {deleting ? 'Deleting...' : 'Delete Subject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showSubjectModal && (
          <SubjectFormModal
            isOpen={showSubjectModal}
            onClose={() => setShowSubjectModal(false)}
            onSuccess={fetchData}
            departmentCode={department?.departmentCode || 'CS'}
            semester={activeSemester}
            subjectTypes={subjectTypes}
            subjectCategories={subjectCategories}
            editingSubject={editingSubject}
          />
        )}

        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">Assign Subject to Faculty</h3>
              <p className="text-xs text-desc">
                Subject: <strong>{targetSubjectForAssign?.subjectCode} — {targetSubjectForAssign?.subjectName}</strong>
              </p>
              <form onSubmit={handleAssignFaculty} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Select Active Faculty Member *</label>
                  <select
                    required
                    value={selectedFacultyId}
                    onChange={(e) => setSelectedFacultyId(e.target.value)}
                    className="w-full p-2.5 border rounded-xl focus:ring-brand-500 font-semibold"
                  >
                    <option value="">Select Faculty...</option>
                    {department?.users?.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.userCode || f.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-3 border-t">
                  <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 rounded-xl text-slate-600 font-semibold">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold">
                    Assign Faculty & Notify
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">HoD Syllabus Review & Decision</h3>
                  <p className="text-xs text-desc">
                    {reviewSubject?.subjectCode} - {reviewSubject?.subjectName} | Faculty: {reviewSubject?.assignedFaculty?.name}
                  </p>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {reviewSubject?.submission && (
                <SyllabusPDFGenerator
                  subject={reviewSubject}
                  submission={reviewSubject.submission}
                  documentTitle="HoD Full Syllabus Review View"
                  hideJustifications={false}
                />
              )}

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">HoD Review Decision</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Correction Reason (Mandatory if Returning)</label>
                    <textarea
                      rows={2}
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      placeholder="e.g. Please revise justification for CO3 -> PO4..."
                      className="w-full p-2.5 text-xs border rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Correction Return Deadline (Optional)</label>
                    <input
                      type="date"
                      value={returnDeadline}
                      onChange={(e) => setReturnDeadline(e.target.value)}
                      className="w-full p-2.5 text-xs border rounded-xl font-bold text-slate-800"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => handleReviewAction('RETURN')}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center"
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" /> Return for Correction
                  </button>
                  <button
                    onClick={() => handleReviewAction('APPROVE')}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve Syllabus
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
