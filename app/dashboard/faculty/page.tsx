'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SyllabusStepper } from '@/components/syllabus/SyllabusStepper';
import { SyllabusPDFGenerator } from '@/components/pdf/SyllabusPDFGenerator';
import { ActivityTimeline } from '@/components/common/ActivityTimeline';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileCheck,
  ArrowLeft,
  Download,
  Sparkles,
} from 'lucide-react';

export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState<string>('assigned');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeStage, setActiveStage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Subject for Editing / Viewing
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [subjectDetail, setSubjectDetail] = useState<any>(null);
  const [poCount, setPoCount] = useState(12);
  const [psoCount, setPsoCount] = useState(3);
  const [viewingPDF, setViewingPDF] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/faculty/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
        setActiveStage(data.activeStage);
      }
    } catch (err) {
      setError('Failed to load assigned subjects.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubject = async (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setViewingPDF(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/faculty/syllabus/${subjectId}`);
      if (res.ok) {
        const data = await res.json();
        setSubjectDetail(data.subject);
        setPoCount(data.poCount || 12);
        setPsoCount(data.psoCount || 3);
      }
    } catch (err) {
      setError('Failed to load subject details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (formData: any) => {
    if (!selectedSubjectId) return;
    const res = await fetch(`/api/faculty/syllabus/${selectedSubjectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSubmit: false, ...formData }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save draft.');

    fetchSubjects();
    handleOpenSubject(selectedSubjectId);
  };

  const handleSubmitSyllabus = async (formData: any) => {
    if (!selectedSubjectId) return;
    const res = await fetch(`/api/faculty/syllabus/${selectedSubjectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSubmit: true, ...formData }),
    });

    const data = await res.json();
    if (!res.ok) {
      const errorObj: any = new Error(data.error || 'Submission failed.');
      errorObj.missing = data.missing;
      throw errorObj;
    }

    fetchSubjects();
    handleOpenSubject(selectedSubjectId);
  };

  const inProgressCount = subjects.filter((s) => s.syllabusStatus === 'IN_PROGRESS').length;
  const submittedCount = subjects.filter((s) => s.syllabusStatus === 'SUBMITTED' || s.syllabusStatus === 'RESUBMITTED').length;
  const returnedCount = subjects.filter((s) => s.syllabusStatus === 'RETURNED_FOR_CORRECTION').length;
  const approvedCount = subjects.filter((s) => s.syllabusStatus === 'APPROVED').length;

  const filteredSubjects = subjects.filter((s) => {
    if (activeTab === 'drafts') return s.syllabusStatus === 'IN_PROGRESS' || s.syllabusStatus === 'RETURNED_FOR_CORRECTION';
    if (activeTab === 'completed') return s.syllabusStatus === 'SUBMITTED' || s.syllabusStatus === 'RESUBMITTED' || s.syllabusStatus === 'APPROVED';
    return true;
  });

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* If viewing single subject detail */}
        {selectedSubjectId && subjectDetail ? (
          <div className="space-y-6">
            <button
              onClick={() => {
                setSelectedSubjectId(null);
                setSubjectDetail(null);
                fetchSubjects();
              }}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to My Assigned Subjects
            </button>

            {/* Read-Only inherited subject metadata card */}
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-brand-700 bg-purple-100 px-2.5 py-0.5 rounded border border-purple-200">
                      {subjectDetail.subjectCode}
                    </span>
                    <StatusBadge status={subjectDetail.syllabusStatus} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-2">{subjectDetail.subjectName}</h2>
                  <p className="text-xs text-desc mt-0.5">
                    Category: <strong>{subjectDetail.subjectCategory?.code}</strong> | Type: <strong>{subjectDetail.subjectType?.name}</strong> | Department: <strong>{subjectDetail.department?.shortName}</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {subjectDetail.submission && (
                    <button
                      onClick={() => setViewingPDF(!viewingPDF)}
                      className="px-4 py-2 text-xs font-bold text-brand-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl flex items-center"
                    >
                      <FileCheck className="w-4 h-4 mr-1.5" />
                      {viewingPDF ? 'Return to Form Editor' : 'Download Acknowledgement PDF'}
                    </button>
                  )}
                </div>
              </div>

              {/* LTPC Read-Only Banner */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-4 gap-2 text-center text-xs font-semibold text-slate-700">
                <div>Lecture (L): <strong className="text-slate-900">{subjectDetail.lecture}</strong></div>
                <div>Tutorial (T): <strong className="text-slate-900">{subjectDetail.tutorial}</strong></div>
                <div>Practical (P): <strong className="text-slate-900">{subjectDetail.practical}</strong></div>
                <div>Credits (C): <strong className="text-brand-700 font-bold">{subjectDetail.credits}</strong></div>
              </div>

              {/* Returned for Correction Warning Box */}
              {subjectDetail.syllabusStatus === 'RETURNED_FOR_CORRECTION' && subjectDetail.submission?.correctionReason && (
                <div className="p-4 rounded-2xl bg-amber-50 border-l-4 border-amber-500 text-xs text-amber-900 space-y-1">
                  <p className="font-bold text-amber-900 flex items-center">
                    <RotateCcw className="w-4 h-4 mr-1.5 text-amber-600" />
                    Returned for Correction by Head of Department
                  </p>
                  <p className="pl-5 font-medium">"{subjectDetail.submission.correctionReason}"</p>
                </div>
              )}
            </div>

            {/* Render PDF or Stepper Form */}
            {viewingPDF ? (
              <SyllabusPDFGenerator
                subject={subjectDetail}
                submission={subjectDetail.submission}
                poCount={poCount}
                psoCount={psoCount}
                documentTitle="Syllabus Submission Acknowledgement"
              />
            ) : (
              <SyllabusStepper
                subject={subjectDetail}
                poCount={poCount}
                psoCount={psoCount}
                onSaveDraft={handleSaveDraft}
                onSubmitSyllabus={handleSubmitSyllabus}
              />
            )}
          </div>
        ) : (
          /* Main Faculty Dashboard Overview */
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Syllabus Workspace</h1>
                <p className="text-xs text-desc mt-1">Manage assigned syllabus preparation, CO/PO mapping, and justifications.</p>
              </div>

              {activeStage && (
                <div className="mt-3 md:mt-0 px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl text-xs text-brand-800 font-bold flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-brand-600" />
                  Stage Deadline: {new Date(activeStage.deadline).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard title="Assigned Subjects" value={subjects.length} icon={<BookOpen className="w-5 h-5 text-brand-600" />} />
              <StatCard title="In Progress" value={inProgressCount} icon={<Clock className="w-5 h-5 text-purple-600" />} />
              <StatCard title="Submitted / Review" value={submittedCount} icon={<FileCheck className="w-5 h-5 text-blue-600" />} />
              <StatCard title="Approved" value={approvedCount} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} colorClassName="text-emerald-700 bg-emerald-50 border-emerald-200" />
            </div>

            {/* Returned Correction Warning Alert */}
            {returnedCount > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center space-x-2">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                  <span>
                    You have <strong>{returnedCount} subject(s)</strong> returned by HoD for correction. Please open and update them before deadline.
                  </span>
                </div>
              </div>
            )}

            {/* Assigned Subjects Directory Cards */}
            <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                {activeTab === 'drafts' ? 'Draft Syllabi' : activeTab === 'completed' ? 'Completed Syllabi' : 'My Assigned Subjects'}
              </h3>

              {filteredSubjects.length === 0 ? (
                <div className="p-12 text-center text-desc text-xs bg-slate-50 rounded-2xl border border-dashed">
                  No subjects found in this view.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSubjects.map((subj) => (
                    <div
                      key={subj.id}
                      className="p-5 border border-purple-100 rounded-2xl bg-purple-50/20 hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-brand-700 bg-purple-100 px-2.5 py-0.5 rounded border border-purple-200">
                            {subj.subjectCode}
                          </span>
                          <StatusBadge status={subj.syllabusStatus} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-2">{subj.subjectName}</h4>
                        <p className="text-xs text-desc mt-0.5">
                          Category: <strong>{subj.subjectCategory?.code}</strong> | Type: <strong>{subj.subjectType?.name}</strong>
                        </p>
                      </div>

                      <div className="pt-3 border-t border-purple-100 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">L-T-P-C: {subj.lecture}-{subj.tutorial}-{subj.practical}-{subj.credits}</span>
                        <button
                          onClick={() => handleOpenSubject(subj.id)}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs transition-all"
                        >
                          Open Subject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
