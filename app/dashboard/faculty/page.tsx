'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SyllabusStepper } from '@/components/syllabus/SyllabusStepper';
import { SyllabusPDFGenerator } from '@/components/pdf/SyllabusPDFGenerator';
import { formatIST } from '@/lib/time';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  RotateCcw,
  ArrowRight,
  Send,
  Eye,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';

export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Subject for Syllabus Workflow Stepper
  const [activeSubject, setActiveSubject] = useState<any>(null);

  // Selected Subject for Viewing Approved PDF Acknowledgement
  const [viewPdfSubject, setViewPdfSubject] = useState<any>(null);

  useEffect(() => {
    fetchAssignedSubjects();
  }, []);

  const fetchAssignedSubjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/faculty/subjects');
      const data = await res.json();

      if (res.ok) {
        setSubjects(data.subjects || []);
      } else {
        setError(data.error || 'Failed to fetch assigned subjects.');
      }
    } catch (err) {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (data: any) => {
    if (!activeSubject) return;
    try {
      const res = await fetch(`/api/faculty/syllabus/${activeSubject.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, action: 'SAVE_DRAFT' }),
      });
      if (res.ok) fetchAssignedSubjects();
    } catch (err) {
      console.error('Failed to save draft');
    }
  };

  const handleSubmitSyllabus = async (data: any) => {
    if (!activeSubject) return;
    try {
      const res = await fetch(`/api/faculty/syllabus/${activeSubject.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, action: 'SUBMIT' }),
      });
      if (res.ok) {
        setActiveSubject(null);
        fetchAssignedSubjects();
      }
    } catch (err) {
      console.error('Failed to submit syllabus');
    }
  };

  const assignedCount = subjects.length;
  const inProgressCount = subjects.filter((s) => s.syllabusStatus === 'IN_PROGRESS' || s.syllabusStatus === 'RETURNED_FOR_CORRECTION').length;
  const submittedCount = subjects.filter((s) => s.syllabusStatus === 'SUBMITTED' || s.syllabusStatus === 'RESUBMITTED').length;
  const approvedCount = subjects.filter((s) => s.syllabusStatus === 'APPROVED').length;

  const overallCompletionPct = assignedCount > 0 ? Math.round((approvedCount / assignedCount) * 100) : 0;

  return (
    <AppShell activeTab={activeTab} onTabChange={(tab) => {
      setActiveSubject(null);
      setActiveTab(tab);
    }}>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* If Faculty is inside Syllabus Workflow Stepper */}
        {activeSubject ? (
          <div className="space-y-4">
            <button
              onClick={() => setActiveSubject(null)}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs inline-flex items-center"
            >
              ← Back to Workspace Overview
            </button>
            <SyllabusStepper
              subject={activeSubject}
              poCount={12}
              psoCount={3}
              onSaveDraft={handleSaveDraft}
              onSubmitSyllabus={handleSubmitSyllabus}
            />
          </div>
        ) : (
          <>
            {/* TAB 1: MY WORKSPACE (FACULTY HOME DASHBOARD) */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Syllabus Workspace</h1>
                    <p className="text-xs text-desc mt-1">Curriculum & Syllabus Formation — Regulation 26</p>
                  </div>

                  <div className="mt-3 md:mt-0 flex items-center space-x-3 bg-purple-50 p-3 rounded-2xl border border-purple-200">
                    <Clock className="w-5 h-5 text-brand-600 animate-pulse" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-brand-700 tracking-wider">Active Stage Deadline</p>
                      <p className="text-xs font-bold text-slate-900">01 Oct 2026</p>
                    </div>
                  </div>
                </div>

                {/* Concise KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-1">
                    <p className="text-xs font-bold text-slate-500">Assigned Subjects</p>
                    <p className="text-2xl font-black text-slate-900">{assignedCount}</p>
                    <button onClick={() => setActiveTab('subjects')} className="text-[11px] font-bold text-brand-600 hover:underline flex items-center mt-1">
                      View Subjects <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-1">
                    <p className="text-xs font-bold text-slate-500">In Progress</p>
                    <p className="text-2xl font-black text-amber-600">{inProgressCount}</p>
                    <button onClick={() => setActiveTab('subjects')} className="text-[11px] font-bold text-brand-600 hover:underline flex items-center mt-1">
                      Continue <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-1">
                    <p className="text-xs font-bold text-slate-500">Submitted</p>
                    <p className="text-2xl font-black text-blue-600">{submittedCount}</p>
                    <button onClick={() => setActiveTab('review')} className="text-[11px] font-bold text-brand-600 hover:underline flex items-center mt-1">
                      Track Status <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-1">
                    <p className="text-xs font-bold text-slate-500">Approved</p>
                    <p className="text-2xl font-black text-emerald-600">{approvedCount}</p>
                    <button onClick={() => setActiveTab('approved')} className="text-[11px] font-bold text-brand-600 hover:underline flex items-center mt-1">
                      View Approved <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                </div>

                {/* Completion Progress Visualizer Bar */}
                <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-900">Overall Syllabus Completion Progress</span>
                    <span className="text-brand-700">{overallCompletionPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-brand-600 h-3 rounded-full transition-all" style={{ width: `${overallCompletionPct}%` }}></div>
                  </div>
                </div>

                {/* Action Required & My Assigned Subjects Cards */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900">Action Required & Assigned Subjects</h3>

                  {subjects.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-3xl border border-purple-100 text-xs text-desc">
                      You currently have no assigned subjects for Regulation 26.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {subjects.map((subj) => {
                        const isReturned = subj.syllabusStatus === 'RETURNED_FOR_CORRECTION';
                        const isApproved = subj.syllabusStatus === 'APPROVED';
                        const isSubmitted = subj.syllabusStatus === 'SUBMITTED' || subj.syllabusStatus === 'RESUBMITTED';

                        return (
                          <div
                            key={subj.id}
                            className={`p-6 rounded-3xl border transition-all ${
                              isReturned
                                ? 'bg-amber-50/70 border-amber-300 shadow-md ring-1 ring-amber-500/30'
                                : isApproved
                                ? 'bg-emerald-50/50 border-emerald-200'
                                : 'bg-white border-purple-100 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-mono text-xs font-bold text-brand-700 bg-purple-100 px-2.5 py-0.5 rounded-md">
                                {subj.subjectCode}
                              </span>
                              <StatusBadge status={subj.syllabusStatus} />
                            </div>

                            <h4 className="text-sm font-bold text-slate-900">{subj.subjectName}</h4>
                            <p className="text-xs text-desc mt-1">
                              {subj.subjectType?.name} • {subj.subjectCategory?.code} • {subj.lecture}-{subj.tutorial}-{subj.practical}-{subj.credits} LTPC
                            </p>

                            {isReturned && subj.submission?.correctionReason && (
                              <div className="mt-3 p-3 rounded-2xl bg-amber-100/90 border border-amber-300 text-xs text-amber-900 space-y-1">
                                <p className="font-bold flex items-center">
                                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-700" />
                                  Returned for Correction:
                                </p>
                                <p className="italic">"{subj.submission.correctionReason}"</p>
                              </div>
                            )}

                            <div className="mt-5 pt-3 border-t border-purple-100 flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-500">Semester {subj.semester}</span>

                              {isApproved ? (
                                <button
                                  onClick={() => setViewPdfSubject(subj)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1" /> View Subject
                                </button>
                              ) : isSubmitted ? (
                                <span className="text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                                  Under HoD Review
                                </span>
                              ) : isReturned ? (
                                <button
                                  onClick={() => setActiveSubject(subj)}
                                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md flex items-center"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Review & Correct →
                                </button>
                              ) : (
                                <button
                                  onClick={() => setActiveSubject(subj)}
                                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md flex items-center"
                                >
                                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Continue Syllabus →
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MY SUBJECTS DEDICATED PAGE */}
            {activeTab === 'subjects' && (
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">My Assigned Subjects</h3>
                  <p className="text-xs text-desc">Select a subject to launch the 9-step syllabus authoring workspace.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjects.map((subj) => (
                    <div key={subj.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 space-y-3 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-brand-700 bg-purple-100 px-2 py-0.5 rounded">
                          {subj.subjectCode} | Sem {subj.semester}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">{subj.subjectName}</h4>
                        <p className="text-[11px] text-desc">{subj.subjectType?.name} • {subj.credits} Credits</p>
                      </div>
                      <button
                        onClick={() => setActiveSubject(subj)}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        Open Workspace →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: SUBMITTED / REVIEW DEDICATED PAGE */}
            {activeTab === 'review' && (
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Submitted & Under Review Syllabi</h3>
                  <p className="text-xs text-desc">Track review status or correct returned syllabi.</p>
                </div>

                <div className="space-y-4">
                  {subjects
                    .filter((s) => s.syllabusStatus === 'SUBMITTED' || s.syllabusStatus === 'RESUBMITTED' || s.syllabusStatus === 'RETURNED_FOR_CORRECTION')
                    .map((subj) => {
                      const isReturned = subj.syllabusStatus === 'RETURNED_FOR_CORRECTION';
                      return (
                        <div key={subj.id} className="p-5 rounded-2xl border border-purple-100 bg-purple-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs font-bold text-brand-700">{subj.subjectCode}</span>
                              <StatusBadge status={subj.syllabusStatus} />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">{subj.subjectName}</h4>

                            {isReturned && subj.submission?.correctionReason && (
                              <p className="text-xs text-amber-900 mt-2 bg-amber-100 p-2.5 rounded-xl border border-amber-300">
                                <strong>HoD Feedback:</strong> "{subj.submission.correctionReason}"
                              </p>
                            )}
                          </div>

                          {isReturned ? (
                            <button
                              onClick={() => setActiveSubject(subj)}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center shrink-0"
                            >
                              <RotateCcw className="w-4 h-4 mr-1.5" /> Continue Editing
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 shrink-0">
                              Locked for Review
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* TAB 4: APPROVED SYLLABI DEDICATED PAGE */}
            {activeTab === 'approved' && (
              <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Approved Syllabi Directory</h3>
                  <p className="text-xs text-desc">View and download official Syllabus Submission Acknowledgement PDFs.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjects.filter((s) => s.syllabusStatus === 'APPROVED').map((subj) => (
                    <div key={subj.id} className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 space-y-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          Approved | {subj.subjectCode}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">{subj.subjectName}</h4>
                      </div>
                      <button
                        onClick={() => setViewPdfSubject(subj)}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View & Print
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* View Approved PDF Acknowledgement Modal */}
        {viewPdfSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-bold text-slate-900">Approved Syllabus Submission Acknowledgement</h3>
                <button onClick={() => setViewPdfSubject(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <SyllabusPDFGenerator
                subject={viewPdfSubject}
                submission={viewPdfSubject.submission}
                documentTitle="Syllabus Submission Acknowledgement"
                hideJustifications={false}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
