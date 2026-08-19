import React from 'react';
import { Printer, Download, FileCheck, Globe } from 'lucide-react';

interface SyllabusPDFGeneratorProps {
  subject: any;
  submission: any;
  poCount?: number;
  psoCount?: number;
  documentTitle?: string;
  hideJustifications?: boolean;
}

export const SyllabusPDFGenerator: React.FC<SyllabusPDFGeneratorProps> = ({
  subject,
  submission,
  poCount = 12,
  psoCount = 3,
  documentTitle = 'Syllabus Submission Acknowledgement',
  hideJustifications = false,
}) => {
  if (!subject || !submission) return null;

  const handlePrint = () => {
    window.print();
  };

  const poKeys: string[] = [];
  for (let p = 1; p <= poCount; p++) poKeys.push(`PO${p}`);
  for (let p = 1; p <= psoCount; p++) poKeys.push(`PSO${p}`);

  const mappingsMap: Record<string, number> = {};
  if (submission.coPoMappings) {
    submission.coPoMappings.forEach((m: any) => {
      mappingsMap[`${m.coNumber}_${m.poKey}`] = m.correlation;
    });
  }

  const justificationsMap: Record<string, string> = {};
  if (submission.coPoJustifications) {
    submission.coPoJustifications.forEach((j: any) => {
      justificationsMap[`${j.coNumber}_${j.poKey}`] = j.justification;
    });
  }

  // Master SDG List mapping number to name
  const sdgNames: Record<number, string> = {
    1: 'No Poverty',
    2: 'Zero Hunger',
    3: 'Good Health and Well-being',
    4: 'Quality Education',
    5: 'Gender Equality',
    6: 'Clean Water and Sanitation',
    7: 'Affordable and Clean Energy',
    8: 'Decent Work and Economic Growth',
    9: 'Industry, Innovation and Infrastructure',
    10: 'Reduced Inequality',
    11: 'Sustainable Cities and Communities',
    12: 'Responsible Consumption and Production',
    13: 'Climate Action',
    14: 'Life Below Water',
    15: 'Life on Land',
    16: 'Peace, Justice and Strong Institutions',
    17: 'Partnerships for the Goals',
  };

  const sdgMappingsList = submission.sdgMappings || [];

  return (
    <div className="space-y-4">
      {/* Print / Download Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-purple-100 shadow-sm print:hidden">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-5 h-5 text-brand-600" />
          <span className="text-sm font-bold text-slate-900">{documentTitle}</span>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md flex items-center transition-all"
        >
          <Printer className="w-4 h-4 mr-2" /> Print / Save Complete PDF
        </button>
      </div>

      {/* Printable Institutional PDF Layout */}
      <div id="printable-syllabus" className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-lg text-slate-900 print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="text-center border-b-2 border-brand-600 pb-6 mb-6">
          <h1 className="text-2xl font-bold uppercase text-brand-700 tracking-wide">Rajalakshmi Engineering College</h1>
          <p className="text-xs font-semibold text-desc uppercase tracking-widest mt-1">An Autonomous Institution | Affiliated to Anna University</p>
          <h2 className="text-base font-bold text-slate-800 mt-3">{subject.department?.programmeName}</h2>
          <div className="inline-block mt-3 px-4 py-1 rounded-full bg-purple-50 text-brand-800 border border-purple-200 text-xs font-bold uppercase tracking-wider">
            Syllabus Submission Acknowledgement — {subject.regulation?.displayName || 'Regulation 26'}
          </div>
        </div>

        {/* 1. Subject Details */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
          <div>
            <p><strong>Subject Name:</strong> {subject.subjectName}</p>
            <p className="mt-1"><strong>Subject Code:</strong> {subject.subjectCode}</p>
            <p className="mt-1"><strong>Category:</strong> {subject.subjectCategory?.code} ({subject.subjectCategory?.name})</p>
            <p className="mt-1"><strong>Subject Type:</strong> {subject.subjectType?.name}</p>
          </div>
          <div>
            <p><strong>L - T - P - C:</strong> {subject.lecture} - {subject.tutorial} - {subject.practical} - {subject.credits}</p>
            <p className="mt-1"><strong>Semester:</strong> Semester {subject.semester}</p>
            <p className="mt-1"><strong>Total Contact Hours:</strong> {submission.totalContactHours || 45} Hours</p>
            <p className="mt-1"><strong>Academic Year:</strong> {subject.academicYear?.year || '2026–2027'}</p>
          </div>
        </div>

        {/* 2. Objectives */}
        {submission.objectives && submission.objectives.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase text-brand-700 border-b pb-1 mb-2">1. Objectives</h3>
            <ul className="list-disc list-inside text-xs space-y-1 text-slate-800">
              {submission.objectives.map((o: any, idx: number) => (
                <li key={idx}>{o.description}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Syllabus Units / Experiments */}
        {submission.syllabusUnits && submission.syllabusUnits.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase text-brand-700 border-b pb-1 mb-3">2. Course Syllabus</h3>
            <div className="space-y-3">
              {submission.syllabusUnits.map((u: any, idx: number) => (
                <div key={idx} className="text-xs">
                  <p className="font-bold text-slate-900">Unit {u.unitNumber}: {u.unitName}</p>
                  <p className="text-slate-700 mt-1 leading-relaxed">{u.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {submission.experiments && submission.experiments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase text-brand-700 border-b pb-1 mb-3">Laboratory Experiments</h3>
            <ol className="list-decimal list-inside text-xs space-y-1 text-slate-800">
              {submission.experiments.map((exp: any, idx: number) => (
                <li key={idx}>{exp.title}</li>
              ))}
            </ol>
          </div>
        )}

        {/* 4. Course Outcomes */}
        {submission.courseOutcomes && submission.courseOutcomes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase text-brand-700 border-b pb-1 mb-2">3. Course Outcomes (COs)</h3>
            <div className="space-y-1 text-xs">
              {submission.courseOutcomes.map((co: any, idx: number) => (
                <p key={idx}><strong>CO{co.coNumber}:</strong> {co.description}</p>
              ))}
            </div>
          </div>
        )}

        {/* 5. Textbooks */}
        {submission.textbooks && submission.textbooks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase text-brand-700 border-b pb-1 mb-2">4. Textbooks</h3>
            <ol className="list-decimal list-inside text-xs space-y-1 text-slate-800">
              {submission.textbooks.map((tb: any, idx: number) => (
                <li key={idx}>
                  {tb.authors}, <em>"{tb.title}"</em>, {tb.edition}, {tb.publisher}, {tb.year}.
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* 6. References */}
        {submission.references && submission.references.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase text-brand-700 border-b pb-1 mb-2">5. Reference Books / Links</h3>
            <ol className="list-decimal list-inside text-xs space-y-1 text-slate-800">
              {submission.references.map((ref: any, idx: number) => (
                <li key={idx}>
                  {ref.authors ? `${ref.authors}, ` : ''}<em>"{ref.title}"</em>{ref.publisher ? `, ${ref.publisher}` : ''}{ref.year ? `, ${ref.year}` : ''}. {ref.url ? `Link: ${ref.url}` : ''}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* 7. CO/PO Mapping Table */}
        <div className="mb-6 page-break-inside-avoid">
          <h3 className="text-sm font-bold uppercase text-brand-700 border-b pb-1 mb-3">6. CO / PO & PSO Mapping Matrix</h3>
          <table className="w-full text-xs text-center border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-slate-300 p-1">CO</th>
                {poKeys.map((k) => (
                  <th key={k} className="border border-slate-300 p-1 text-[10px]">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((coNum) => (
                <tr key={coNum}>
                  <td className="border border-slate-300 p-1 font-bold">CO{coNum}</td>
                  {poKeys.map((k) => {
                    const corr = mappingsMap[`${coNum}_${k}`] ?? 0;
                    return (
                      <td key={k} className="border border-slate-300 p-1 font-medium">
                        {corr > 0 ? corr : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 8. Sustainable Development Goals (SDG) Mapping Table */}
        {sdgMappingsList.length > 0 && (
          <div className="mb-6 page-break-inside-avoid">
            <h3 className="text-sm font-bold uppercase text-brand-700 border-b pb-1 mb-3 flex items-center">
              <Globe className="w-4 h-4 mr-1.5 text-brand-600" />
              7. UN Sustainable Development Goals (SDG) Mapping
            </h3>
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-purple-50 font-bold text-brand-900 border-b border-slate-300">
                  <th className="border border-slate-300 p-2 w-1/3">SDG No. & Theme</th>
                  <th className="border border-slate-300 p-2 w-1/6 text-center">Addressing CO</th>
                  <th className="border border-slate-300 p-2">Topic / Activity addressing SDG</th>
                </tr>
              </thead>
              <tbody>
                {sdgMappingsList.map((m: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 font-bold text-slate-900">
                      SDG {m.sdgNumber} — {sdgNames[m.sdgNumber] || 'SDG Goal'}
                    </td>
                    <td className="border border-slate-300 p-2 font-bold text-brand-700 text-center">
                      CO{m.coNumber}
                    </td>
                    <td className="border border-slate-300 p-2 font-medium text-slate-800">
                      • {m.topic}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 9. CO/PO Justifications (Always shown in printable Acknowledgement PDF for all authorized roles) */}
        {(!hideJustifications || true) && Object.keys(justificationsMap).length > 0 && (
          <div className="mb-8 page-break-inside-avoid">
            <h3 className="text-sm font-bold uppercase text-brand-700 border-b pb-1 mb-3">8. CO / PO Justifications</h3>
            <div className="space-y-2 text-xs">
              {Object.entries(justificationsMap).map(([key, just]) => {
                const [coNum, poKey] = key.split('_');
                return (
                  <p key={key} className="bg-slate-50 p-2 rounded border border-slate-200">
                    <strong>CO{coNum} → {poKey}:</strong> {just}
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {/* Signatures & Approval Footer */}
        <div className="pt-8 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-xs mt-12 page-break-inside-avoid">
          <div>
            <p><strong>Prepared & Submitted By:</strong></p>
            <p className="mt-4 font-semibold">{subject.assignedFaculty?.name || 'Faculty Member'}</p>
            <p className="text-desc">{subject.assignedFaculty?.email}</p>
            <p className="text-[10px] text-slate-400 mt-1">Submitted: {new Date(submission.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="text-right">
            <p><strong>Reviewed & Approved By:</strong></p>
            <p className="mt-4 font-semibold">{submission.approvedBy?.name || 'Head of Department'}</p>
            <p className="text-desc">Head of Department, {subject.department?.shortName}</p>
            <p className="text-[10px] text-slate-400 mt-1">Approved: {submission.approvedAt ? new Date(submission.approvedAt).toLocaleDateString() : 'Pending'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
