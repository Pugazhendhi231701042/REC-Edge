import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Users, CheckCircle2, FileText, Eye, Building2, Filter } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';

interface DepartmentDetailViewProps {
  departmentSummary: any;
  allSubjects: any[];
  onBack: () => void;
  onViewSyllabus: (subject: any) => void;
}

export const DepartmentDetailView: React.FC<DepartmentDetailViewProps> = ({
  departmentSummary,
  allSubjects,
  onBack,
  onViewSyllabus,
}) => {
  if (!departmentSummary) return null;

  const deptSubjects = allSubjects.filter((s) => s.departmentId === departmentSummary.id);
  const semesters = Array.from({ length: departmentSummary.semesters || 8 }, (_, i) => i + 1);
  const [selectedSemFilter, setSelectedSemFilter] = useState<string>('ALL');

  const filteredSubjects = selectedSemFilter === 'ALL'
    ? deptSubjects
    : deptSubjects.filter((s) => s.semester === parseInt(selectedSemFilter));

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs inline-flex items-center"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Departments & Programmes
      </button>

      {/* Department Master Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-brand-700 uppercase bg-purple-100 px-2.5 py-0.5 rounded border border-purple-200">
                {departmentSummary.programmeType} | Code: {departmentSummary.departmentCode}
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                {departmentSummary.completionPercentage}% Overall Completion
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{departmentSummary.programmeName}</h2>
            <p className="text-xs text-desc mt-0.5">
              Head of Department: <strong>{departmentSummary.hodName || 'Unassigned'}</strong> | Semesters: <strong>{departmentSummary.semesters}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-24 bg-slate-200 rounded-full h-3 overflow-hidden">
              <div className="bg-brand-600 h-3 rounded-full" style={{ width: `${departmentSummary.completionPercentage}%` }}></div>
            </div>
            <span className="text-sm font-bold text-brand-700">{departmentSummary.completionPercentage}%</span>
          </div>
        </div>

        {/* Progress Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-purple-100 text-xs">
          <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100">
            <p className="text-desc font-semibold">Subjects Formed</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{departmentSummary.totalSubjects}</p>
          </div>
          <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
            <p className="text-desc font-semibold">Faculty Assigned</p>
            <p className="text-base font-bold text-indigo-900 mt-0.5">{departmentSummary.assignedCount}</p>
          </div>
          <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
            <p className="text-desc font-semibold">Submitted</p>
            <p className="text-base font-bold text-blue-900 mt-0.5">{departmentSummary.submittedCount}</p>
          </div>
          <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
            <p className="text-desc font-semibold">HoD Approved</p>
            <p className="text-base font-bold text-emerald-900 mt-0.5">{departmentSummary.approvedCount}</p>
          </div>
          <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
            <p className="text-desc font-semibold">Overall Completion</p>
            <p className="text-base font-bold text-amber-900 mt-0.5">{departmentSummary.completionPercentage}%</p>
          </div>
        </div>
      </div>

      {/* Complete Subject Directory & Semester Filter */}
      <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Complete Department Subject List</h3>
            <p className="text-xs text-desc">Subject Code, Subject Name, Type, Category, L-T-P-C, Assigned Faculty, Syllabus Status, and Actions.</p>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSemFilter}
              onChange={(e) => setSelectedSemFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-brand-500 bg-purple-50 text-brand-900"
            >
              <option value="ALL">All Semesters ({deptSubjects.length} Subjects)</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem.toString()}>
                  Semester {sem} ({deptSubjects.filter((s) => s.semester === sem).length} Subjects)
                </option>
              ))}
            </select>
          </div>
        </div>

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
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-desc text-xs">
                    No subjects found for the selected semester filter.
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subj) => (
                  <tr key={subj.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-brand-700">
                      {subj.subjectCode}
                      <span className="block text-[10px] text-slate-400 font-normal">Sem {subj.semester}</span>
                    </td>
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
                    <td className="p-3 text-right">
                      {subj.submission ? (
                        <button
                          onClick={() => onViewSyllabus(subj)}
                          className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs inline-flex items-center"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Dean Review
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Not Submitted</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
