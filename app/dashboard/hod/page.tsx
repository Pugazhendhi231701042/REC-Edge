'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SubjectFormModal } from '@/components/curriculum/SubjectFormModal';
import { SyllabusPDFGenerator } from '@/components/pdf/SyllabusPDFGenerator';
import { ActivityTimeline } from '@/components/common/ActivityTimeline';
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
  Sparkles,
} from 'lucide-react';

export default function HoDDashboard() {
  const [department, setDepartment] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectTypes, setSubjectTypes] = useState<any[]>([]);
  const [subjectCategories, setSubjectCategories] = useState<any[]>([]);
  const [activeSemester, setActiveSemester] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetSubjectForAssign, setTargetSubjectForAssign] = useState<any>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewSubject, setReviewSubject] = useState<any>(null);
  const [correctionReason, setCorrectionReason] = useState('');

  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extDeadline, setExtDeadline] = useState('');
  const [extReason, setExtReason] = useState('');

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
    } catch (err) {
      setError('Failed to load department curriculum data.');
    } finally {
      setLoading(false);
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
        }),
      });

      if (res.ok) {
        setShowAssignModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to assign faculty');
    }
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
        }),
      });

      if (res.ok) {
        setShowReviewModal(false);
        setCorrectionReason('');
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

  const semCount = department?.semesters || 8;
  const semesterNumbers = Array.from({ length: semCount }, (_, i) => i + 1);

  // Semesters Filter
  const activeSemSubjects = subjects.filter((s) => s.semester === activeSemester);
  const totalInSem = activeSemSubjects.length;
  const assignedInSem = activeSemSubjects.filter((s) => s.status === 'ASSIGNED').length;
  const approvedInSem = activeSemSubjects.filter((s) => s.syllabusStatus === 'APPROVED').length;
  const semProgressPercentage = totalInSem > 0 ? Math.round((approvedInSem / totalInSem) * 100) : 0;

  const totalDepartmentSubjects = subjects.length;
  const totalApprovedDepartment = subjects.filter((s) => s.syllabusStatus === 'APPROVED').length;
  const isCurriculumFinalized = subjects.some((s) => s.status === 'FINALIZED' || s.status === 'ASSIGNED');

  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
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
              onClick={() => setShowExtensionModal(true)}
              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-brand-700 font-bold text-xs rounded-xl border border-purple-200 flex items-center"
            >
              <ShieldAlert className="w-4 h-4 mr-1.5" /> Request Deadline Extension
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Subjects"
            value={totalDepartmentSubjects}
            subtitle="Curriculum Master"
            icon={<BookOpen className="w-5 h-5 text-brand-600" />}
          />
          <StatCard
            title="Faculty Assigned"
            value={subjects.filter((s) => s.status === 'ASSIGNED').length}
            subtitle="In Progress & Review"
            icon={<Users className="w-5 h-5 text-indigo-600" />}
          />
          <StatCard
            title="Syllabus Approved"
            value={totalApprovedDepartment}
            subtitle="HoD Signoff Complete"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            colorClassName="text-emerald-700 bg-emerald-50 border-emerald-200"
          />
          <StatCard
            title="Active Semester Progress"
            value={`${semProgressPercentage}%`}
            subtitle={`Semester ${activeSemester}`}
            icon={<Sparkles className="w-5 h-5 text-amber-600" />}
            colorClassName="text-amber-700 bg-amber-50 border-amber-200"
          />
        </div>

        {/* Dynamic Semester Selection Tabs (Requirement 19: Dynamically generated based on Dept config) */}
        <div className="bg-white rounded-2xl border border-purple-100 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-3 overflow-x-auto">
            <div className="flex items-center space-x-2 min-w-max">
              {semesterNumbers.map((sem) => (
                <button
                  key={sem}
                  onClick={() => setActiveSemester(sem)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeSemester === sem
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Semester {sem}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setEditingSubject(null);
                setShowSubjectModal(true);
              }}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Subject to Sem {activeSemester}
            </button>
          </div>

          {/* Active Semester Metrics Bar */}
          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex flex-col md:flex-row md:items-center justify-between text-xs text-slate-700 gap-2">
            <div>
              <span className="font-bold text-slate-900">Semester {activeSemester} Dashboard: </span>
              <span>{totalInSem} Subjects ({assignedInSem} Assigned, {approvedInSem} Approved)</span>
            </div>
            <div className="flex items-center space-x-2 font-bold text-brand-700">
              <span>Progress: {semProgressPercentage}%</span>
            </div>
          </div>

          {/* Semester Subject Table */}
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
                  <th className="p-3">Syllabus Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeSemSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-desc text-xs">
                      No subjects added yet for Semester {activeSemester}. Click "+ Add Subject" above to create one.
                    </td>
                  </tr>
                ) : (
                  activeSemSubjects.map((subj) => (
                    <tr key={subj.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-brand-700">{subj.subjectCode}</td>
                      <td className="p-3 font-bold text-slate-900">{subj.subjectName}</td>
                      <td className="p-3 text-slate-600">{subj.subjectType?.name}</td>
                      <td className="p-3 text-slate-600">{subj.subjectCategory?.code}</td>
                      <td className="p-3 text-center font-semibold text-slate-800">
                        {subj.lecture}-{subj.tutorial}-{subj.practical}-{subj.credits}
                      </td>
                      <td className="p-3 font-semibold text-indigo-900">
                        {subj.assignedFaculty ? subj.assignedFaculty.name : <span className="text-amber-600 font-normal">Unassigned</span>}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={subj.syllabusStatus} />
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {/* Assign Faculty Button */}
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

                        {/* Review Syllabus Button if Submitted */}
                        {(subj.syllabusStatus === 'SUBMITTED' || subj.syllabusStatus === 'RESUBMITTED' || subj.syllabusStatus === 'APPROVED') && (
                          <button
                            onClick={() => {
                              setReviewSubject(subj);
                              setShowReviewModal(true);
                            }}
                            className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs inline-flex items-center"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subject Form Modal (With LTPC credit calculator & auto code preview) */}
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

        {/* Assign Faculty Modal (Requirement 31) */}
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
                        {f.name} ({f.email})
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

        {/* Syllabus Review & Approval Modal (Requirement 55, 56, 57) */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Syllabus Review & Decision</h3>
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
                  documentTitle="HoD Syllabus Review View"
                />
              )}

              {/* Review Decision Buttons */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">HoD Review Decision</h4>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Correction Reason (Mandatory if Returning)</label>
                  <textarea
                    rows={2}
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="e.g. Please revise justification for CO3 -> PO4..."
                    className="w-full p-2.5 text-xs border rounded-xl"
                  />
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

        {/* Deadline Extension Request Modal */}
        {showExtensionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">Request Deadline Extension</h3>
              <form onSubmit={handleRequestExtension} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Requested New Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={extDeadline}
                    onChange={(e) => setExtDeadline(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Justification Reason *</label>
                  <textarea
                    rows={3}
                    required
                    value={extReason}
                    onChange={(e) => setExtReason(e.target.value)}
                    placeholder="e.g. Additional time required for faculty syllabus review..."
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button type="button" onClick={() => setShowExtensionModal(false)} className="px-3 py-1.5 rounded-lg text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded-lg bg-brand-600 text-white font-bold">Submit Request to Dean</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
