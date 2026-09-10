import React, { useState } from 'react';
import { Printer, Download, FileCheck, Globe, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [downloading, setDownloading] = useState(false);

  if (!subject || !submission) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const input = document.getElementById('printable-syllabus');
    if (!input) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${(documentTitle || 'Syllabus').replace(/\s+/g, '_')}_${subject.subjectCode || 'doc'}.pdf`);
    } catch (err) {
      console.error('PDF download error:', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const unitsList = submission.syllabusUnits || submission.units || [];
  const experimentsList = submission.experiments || submission.labExperiments || [];

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

  // Sort SDG Mappings: Primary by coNumber (1..5), Secondary by sdgNumber (1..17)
  const sortedSDGMappings = [...(submission.sdgMappings || [])].sort((a: any, b: any) => {
    if (a.coNumber !== b.coNumber) {
      return a.coNumber - b.coNumber;
    }
    return a.sdgNumber - b.sdgNumber;
  });

  const cleanPrefix = (str: string) => {
    if (!str) return '';
    return str
      .replace(/^[\u25AF\u25A0\u25A1●•\-\*\s\t]+/, '')
      .replace(/^(\d+[\.\)\s\t]+|\[CO\d+\]|CO\d+[\:\-\s]+)\s*/i, '')
      .replace(/^[\u25AF\u25A0\u25A1●•\-\*\s\t]+/, '')
      .trim();
  };

  const getRomanNumeral = (num: number) => {
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romans[num - 1] || num.toString();
  };

  const isApproved = subject.syllabusStatus === 'APPROVED' || subject.syllabusStatus === 'HOD_APPROVED';
  const watermarkText = isApproved
    ? (subject.department?.programmeName || subject.department?.name || 'RAJALAKSHMI ENGINEERING COLLEGE').toUpperCase()
    : 'DRAFT';

  const templateType = subject.subjectType?.templateType || 'THEORY';
  const isTheoryOrLabTheory = templateType === 'THEORY' || templateType === 'LAB_THEORY' || templateType === 'PROJECT_THEORY';
  const isLabOrLabTheory = templateType === 'LAB' || templateType === 'LAB_THEORY' || templateType === 'PROJECT' || templateType === 'PROJECT_THEORY';

  const computedTotalHours = submission.totalContactHours
    || (subject.lecture ? subject.lecture * 15 : 0) + (subject.practical ? subject.practical * 15 : 0)
    || (subject.credits ? Math.round(subject.credits * 15) : 45);

  return (
    <div className="space-y-4 font-sans text-slate-900">
      {/* Print / Download Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-purple-100 shadow-sm print:hidden">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-5 h-5 text-brand-600" />
          <span className="text-sm font-bold text-slate-900">{documentTitle}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center transition-all"
          >
            <Printer className="w-4 h-4 mr-1.5" /> Print
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md flex items-center transition-all disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {downloading ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Dedicated Printable Institutional PDF Layout - CurriculumCreator Publication Style */}
      <div id="printable-syllabus" className="printable-area relative bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-lg text-slate-900 print:shadow-none print:border-none print:p-0 overflow-hidden">
        {/* Diagonal Watermark Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden opacity-[0.05] select-none">
          <span className="text-5xl md:text-7xl font-black uppercase text-slate-900 tracking-widest -rotate-45 text-center leading-relaxed">
            {watermarkText}
          </span>
        </div>

        <div className="relative z-10 space-y-4">
          {/* Institution Header */}
          <div className="text-center border-b-2 border-brand-700 pb-4 mb-4">
            <h1 className="text-xl md:text-2xl font-black uppercase text-brand-800 tracking-wide">Rajalakshmi Engineering College</h1>
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mt-0.5">An Autonomous Institution | Affiliated to Anna University</p>
            <h2 className="text-sm font-bold text-slate-800 mt-2">{subject.department?.programmeName || subject.department?.name}</h2>
            <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-purple-50 text-brand-900 border border-purple-200 text-[11px] font-bold uppercase tracking-wider">
              Syllabus Submission Acknowledgement — {subject.regulation?.displayName || 'Regulation 2026'}
            </div>
          </div>

          {/* 1. Subject Details Grid (CurriculumCreator 7-Column Publication Table) */}
          <table className="w-full border-collapse border border-slate-900 text-xs mb-4">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900">
                <th className="border border-slate-900 p-2 text-center w-[18%]">Course Code</th>
                <th className="border border-slate-900 p-2 text-center w-[42%]">Course Title</th>
                <th className="border border-slate-900 p-2 text-center w-[16%]">Category</th>
                <th className="border border-slate-900 p-2 text-center w-[6%]">L</th>
                <th className="border border-slate-900 p-2 text-center w-[6%]">T</th>
                <th className="border border-slate-900 p-2 text-center w-[6%]">P</th>
                <th className="border border-slate-900 p-2 text-center w-[6%]">C</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-900 font-medium text-slate-900">
                <td className="border border-slate-900 p-2 text-center font-bold">{subject.subjectCode}</td>
                <td className="border border-slate-900 p-2 text-center font-bold uppercase">{subject.subjectName}</td>
                <td className="border border-slate-900 p-2 text-center">{subject.subjectCategory?.code || 'PC'}</td>
                <td className="border border-slate-900 p-2 text-center font-semibold">{subject.lecture ?? 0}</td>
                <td className="border border-slate-900 p-2 text-center font-semibold">{subject.tutorial ?? 0}</td>
                <td className="border border-slate-900 p-2 text-center font-semibold">{subject.practical ?? 0}</td>
                <td className="border border-slate-900 p-2 text-center font-semibold">{subject.credits ?? 0}</td>
              </tr>
              <tr>
                <td colSpan={7} className="border border-slate-900 p-2 text-left bg-slate-50 font-medium">
                  <strong>Branch(es) / Department:</strong> {subject.department?.programmeName || subject.department?.name || 'All Engineering Branches'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 2. Objectives Table */}
          {submission.objectives && submission.objectives.length > 0 && (
            <table className="w-full border-collapse border border-slate-900 text-xs mb-4 page-break-inside-avoid">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-900">
                  <th className="border border-slate-900 p-2 text-left uppercase font-bold text-slate-900">Objectives:</th>
                </tr>
              </thead>
              <tbody>
                {submission.objectives.map((o: any, idx: number) => {
                  const text = typeof o === 'string' ? o : o?.description || '';
                  return (
                    <tr key={idx} className="border-b border-slate-900">
                      <td className="border border-slate-900 p-2 text-left leading-relaxed font-medium">
                        ●  {cleanPrefix(text)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* 3. Theory Course Syllabus Units (Units I – V) */}
          {isTheoryOrLabTheory && unitsList.length > 0 && (
            <table className="w-full border-collapse border border-slate-900 text-xs mb-4">
              <tbody>
                {unitsList.map((u: any, idx: number) => {
                  const roman = getRomanNumeral(u.unitNumber || idx + 1);
                  return (
                    <React.Fragment key={idx}>
                      <tr className="bg-slate-100 font-bold border-t border-b border-slate-900">
                        <td className="border border-slate-900 p-2 font-bold text-slate-900 w-[15%] text-left">
                          UNIT-{roman}
                        </td>
                        <td className="border border-slate-900 p-2 font-bold uppercase text-slate-900 text-left">
                          {u.unitName}
                        </td>
                        <td className="border border-slate-900 p-2 font-bold text-slate-900 w-[15%] text-right">
                          {u.contactHours ? `${u.contactHours} Hours` : ''}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-900">
                        <td colSpan={3} className="border border-slate-900 p-2.5 text-justify leading-relaxed font-normal text-slate-800">
                          {u.content}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="bg-slate-100 font-bold border-t border-slate-900">
                  <td colSpan={3} className="border border-slate-900 p-2 text-left font-bold text-slate-900">
                    Total Contact Hours: <span className="font-extrabold">{computedTotalHours} Hours</span>
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {/* 4. List of Experiments Table (For Lab & Lab-Oriented Theory) */}
          {isLabOrLabTheory && experimentsList.length > 0 && (
            <table className="w-full border-collapse border border-slate-900 text-xs mb-4 page-break-inside-avoid">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-900">
                  <th colSpan={2} className="border border-slate-900 p-2 text-left uppercase font-bold text-slate-900">
                    LIST OF EXPERIMENTS
                  </th>
                </tr>
              </thead>
              <tbody>
                {experimentsList.map((exp: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-900">
                    <td className="border border-slate-900 p-2 text-center font-bold w-[6%] text-slate-900">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-900 p-2 text-left font-normal text-slate-800 leading-relaxed">
                      {cleanPrefix(exp.title)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 5. Course Outcomes Table */}
          {submission.courseOutcomes && submission.courseOutcomes.length > 0 && (
            <table className="w-full border-collapse border border-slate-900 text-xs mb-4 page-break-inside-avoid">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-900">
                  <th colSpan={2} className="border border-slate-900 p-2 text-left uppercase font-bold text-slate-900">
                    Course Outcomes:
                  </th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-900">
                  <td colSpan={2} className="border border-slate-900 p-2 text-left italic text-slate-700">
                    On completion of the course, students will be able to
                  </td>
                </tr>
              </thead>
              <tbody>
                {submission.courseOutcomes.map((co: any, idx: number) => {
                  const desc = typeof co === 'string' ? co : co?.description || '';
                  const level = typeof co === 'object' && co?.cognitiveLevel ? co.cognitiveLevel : `K${Math.min(idx + 2, 5)}`;
                  return (
                    <tr key={idx} className="border-b border-slate-900">
                      <td className="border border-slate-900 p-2 text-left leading-relaxed">
                        ●  <strong>CO{co.coNumber || idx + 1}:</strong> {cleanPrefix(desc)}
                      </td>
                      <td className="border border-slate-900 p-2 text-center font-extrabold w-[14%] bg-purple-50/60 text-brand-900 border-l border-slate-900">
                        {level}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* 6. Text Books & Reference Books Tables */}
          {(submission.textbooks?.length > 0 || submission.references?.length > 0) && (
            <table className="w-full border-collapse border border-slate-900 text-xs mb-4 page-break-inside-avoid">
              <tbody>
                {submission.textbooks && submission.textbooks.length > 0 && (
                  <>
                    <tr className="bg-slate-100 font-bold border-b border-slate-900">
                      <th colSpan={2} className="border border-slate-900 p-2 text-left uppercase font-bold text-slate-900">
                        Text Books:
                      </th>
                    </tr>
                    {submission.textbooks.map((tb: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-900">
                        <td className="border border-slate-900 p-2 text-center font-bold w-[6%] text-slate-900">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-900 p-2 text-left font-normal text-slate-800 leading-relaxed">
                          "{tb.title}"{tb.authors ? `, ${tb.authors}` : ''}{tb.edition ? `, ${tb.edition}` : ''}{tb.publisher ? `, ${tb.publisher}` : ''}{tb.year ? `, ${tb.year}` : ''}.
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {submission.references && submission.references.length > 0 && (
                  <>
                    <tr className="bg-slate-100 font-bold border-b border-slate-900">
                      <th colSpan={2} className="border border-slate-900 p-2 text-left uppercase font-bold text-slate-900">
                        Reference Books(s) / Web links:
                      </th>
                    </tr>
                    {submission.references.map((ref: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-900">
                        <td className="border border-slate-900 p-2 text-center font-bold w-[6%] text-slate-900">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-900 p-2 text-left font-normal text-slate-800 leading-relaxed">
                          "{ref.title}"{ref.authors ? `, ${ref.authors}` : ''}{ref.edition ? `, ${ref.edition}` : ''}{ref.publisher ? `, ${ref.publisher}` : ''}{ref.year ? `, ${ref.year}` : ''}. {ref.url ? `Link: ${ref.url}` : ''}
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          )}

          {/* 7. CO / PO & PSO Mapping Matrix */}
          <div className="mb-4 page-break-inside-avoid">
            <h3 className="text-xs font-bold uppercase text-slate-900 mb-2">CO / PO & PSO Mapping Matrix</h3>
            <table className="w-full text-xs text-center border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-900">
                  <th className="border border-slate-900 p-1.5 font-bold">CO</th>
                  {poKeys.map((k) => (
                    <th key={k} className="border border-slate-900 p-1 text-[10px] font-bold">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((coNum, idx) => {
                  return (
                    <tr key={coNum} className="border-b border-slate-900">
                      <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">CO{coNum}</td>
                      {poKeys.map((k) => {
                        const corr = mappingsMap[`${coNum}_${k}`] ?? 0;
                        return (
                          <td key={k} className="border border-slate-900 p-1 font-medium text-slate-900">
                            {corr > 0 ? corr : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black border-t-2 border-slate-900">
                  <td className="border border-slate-900 p-1.5 font-black text-slate-900 text-center">Average</td>
                  {poKeys.map((k) => {
                    let total = 0;
                    let count = 0;
                    [1, 2, 3, 4, 5].forEach((coNum) => {
                      const val = mappingsMap[`${coNum}_${k}`] ?? 0;
                      if (val > 0) {
                        total += val;
                        count++;
                      }
                    });
                    const avg = count > 0 ? (total / count).toFixed(2) : '-';
                    return (
                      <td key={k} className="border border-slate-900 p-1 font-black text-slate-900">
                        {avg}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 8. Sustainable Development Goals (SDG) Mapping Table */}
          {sortedSDGMappings.length > 0 && (
            <div className="mb-4 page-break-inside-avoid">
              <h3 className="text-xs font-bold uppercase text-slate-900 mb-2 flex items-center">
                <Globe className="w-3.5 h-3.5 mr-1.5 text-brand-600 print:hidden" />
                UN Sustainable Development Goals (SDG) Mapping
              </h3>
              <table className="w-full text-xs text-left border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-b border-slate-900">
                    <th className="border border-slate-900 p-2 w-[16%] text-center">Addressing CO</th>
                    <th className="border border-slate-900 p-2 w-[34%]">SDG No. & Theme</th>
                    <th className="border border-slate-900 p-2">Topic / Activity addressing SDG</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSDGMappings.map((m: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-900">
                      <td className="border border-slate-900 p-2 font-bold text-center text-slate-900">
                        CO{m.coNumber}
                      </td>
                      <td className="border border-slate-900 p-2 font-bold text-slate-900">
                        SDG {m.sdgNumber} — {sdgNames[m.sdgNumber] || 'SDG Goal'}
                      </td>
                      <td className="border border-slate-900 p-2 font-normal text-slate-800">
                        ●  {cleanPrefix(m.topic)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 9. CO / PO Justifications */}
          {Object.keys(justificationsMap).length > 0 && (
            <div className="mb-6 page-break-inside-avoid">
              <h3 className="text-xs font-bold uppercase text-slate-900 border-b border-slate-900 pb-1 mb-2">
                CO / PO Justifications
              </h3>
              <div className="space-y-1.5 text-xs">
                {Object.entries(justificationsMap).map(([key, just]) => {
                  const [coNum, poKey] = key.split('_');
                  return (
                    <p key={key} className="p-2 rounded border border-slate-300 bg-slate-50 leading-relaxed text-slate-800">
                      <strong className="text-slate-900">CO{coNum} → {poKey}:</strong> {just}
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          {/* Signatures & Approval Footer */}
          <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs mt-8 page-break-inside-avoid">
            <div>
              <p><strong>Prepared & Submitted By:</strong></p>
              <p className="mt-4 font-semibold text-slate-900">{subject.assignedFaculty?.name || 'Faculty Member'}</p>
              <p className="text-slate-600">{subject.assignedFaculty?.email}</p>
              <p className="text-[10px] text-slate-500 mt-1">Submitted: {new Date(submission.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="text-right">
              <p><strong>Reviewed & Approved By:</strong></p>
              <p className="mt-4 font-semibold text-slate-900">{submission.approvedBy?.name || 'Head of Department'}</p>
              <p className="text-slate-600">Head of Department, {subject.department?.shortName || subject.department?.name}</p>
              <p className="text-[10px] text-slate-500 mt-1">Approved: {submission.approvedAt ? new Date(submission.approvedAt).toLocaleDateString() : 'Pending'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

