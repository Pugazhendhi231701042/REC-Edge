import React from 'react';
import { Printer, FileCheck, Globe, Award, BookOpen, Layers } from 'lucide-react';

interface DepartmentCurriculumPDFGeneratorProps {
  department: any;
  peoStatements?: any[];
  poStatements?: any[];
  psoStatements?: any[];
  subjects?: any[];
  documentTitle?: string;
}

export const DepartmentCurriculumPDFGenerator: React.FC<DepartmentCurriculumPDFGeneratorProps> = ({
  department,
  peoStatements = [],
  poStatements = [],
  psoStatements = [],
  subjects = [],
  documentTitle = 'Department Curriculum & Syllabus Book',
}) => {
  if (!department) return null;

  const handlePrint = () => {
    window.print();
  };

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

  // Group subjects by semester
  const semesterMap: Record<number, any[]> = {};
  subjects.forEach((s) => {
    const sem = s.semester || 1;
    if (!semesterMap[sem]) semesterMap[sem] = [];
    semesterMap[sem].push(s);
  });
  const semesters = Object.keys(semesterMap).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-4 font-sans text-slate-900">
      {/* Print Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-purple-100 shadow-sm print:hidden">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-brand-600" />
          <span className="text-sm font-bold text-slate-900">{documentTitle}</span>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md flex items-center transition-all"
        >
          <Printer className="w-4 h-4 mr-2" /> Print Department Curriculum Book
        </button>
      </div>

      {/* Printable Department Curriculum Book */}
      <div id="printable-department-curriculum" className="printable-area bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-lg text-slate-900 print:shadow-none print:border-none print:p-0 space-y-8">
        
        {/* Cover Page */}
        <div className="text-center border-b-4 border-brand-800 pb-8 pt-4 page-break-after-always">
          <h1 className="text-2xl md:text-3xl font-black uppercase text-brand-900 tracking-wide">
            Rajalakshmi Engineering College
          </h1>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-1">
            An Autonomous Institution | Affiliated to Anna University
          </p>
          <div className="my-6 py-6 border-y-2 border-slate-900 bg-slate-50">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-wide">
              {department.programmeName} ({department.shortName})
            </h2>
            <h3 className="text-sm font-bold text-brand-700 uppercase tracking-wider mt-2">
              Curriculum & Syllabus Book — Regulation 2026
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Published for Academic Year 2026–2027
          </p>
        </div>

        {/* 1. Program Outcomes (POs) & Program Specific Outcomes (PSOs) */}
        <div className="space-y-6 page-break-inside-avoid">
          <h2 className="text-sm font-black uppercase text-brand-800 border-b-2 border-slate-900 pb-1 flex items-center">
            <Award className="w-4 h-4 mr-2 text-brand-600 print:hidden" />
            1. Program Outcomes (POs) & Program Specific Outcomes (PSOs)
          </h2>

          {/* POs */}
          {poStatements.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-slate-900">Program Outcomes (POs):</h3>
              <table className="w-full border-collapse border border-slate-900 text-xs">
                <tbody>
                  {poStatements.map((po, idx) => (
                    <tr key={idx} className="border-b border-slate-900">
                      <td className="border border-slate-900 p-2 font-bold w-[12%] text-center bg-slate-100">{po.poKey || `PO${idx + 1}`}</td>
                      <td className="border border-slate-900 p-2 text-left leading-relaxed">{cleanPrefix(po.statement)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PSOs */}
          {psoStatements.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-slate-900">Program Specific Outcomes (PSOs):</h3>
              <table className="w-full border-collapse border border-slate-900 text-xs">
                <tbody>
                  {psoStatements.map((pso, idx) => (
                    <tr key={idx} className="border-b border-slate-900">
                      <td className="border border-slate-900 p-2 font-bold w-[12%] text-center bg-slate-100">{pso.psoKey || `PSO${idx + 1}`}</td>
                      <td className="border border-slate-900 p-2 text-left leading-relaxed">{cleanPrefix(pso.statement)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. Course Structure Overview by Semester */}
        <div className="space-y-4 page-break-inside-avoid">
          <h2 className="text-sm font-black uppercase text-brand-800 border-b-2 border-slate-900 pb-1 flex items-center">
            <Layers className="w-4 h-4 mr-2 text-brand-600 print:hidden" />
            2. Curriculum Scheme of Instruction
          </h2>

          <table className="w-full border-collapse border border-slate-900 text-xs text-center">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-900">
                <th className="border border-slate-900 p-2 w-[8%]">Sem</th>
                <th className="border border-slate-900 p-2 w-[16%]">Course Code</th>
                <th className="border border-slate-900 p-2 text-left">Course Title</th>
                <th className="border border-slate-900 p-2 w-[12%]">Category</th>
                <th className="border border-slate-900 p-2 w-[6%]">L</th>
                <th className="border border-slate-900 p-2 w-[6%]">T</th>
                <th className="border border-slate-900 p-2 w-[6%]">P</th>
                <th className="border border-slate-900 p-2 w-[6%]">C</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s, idx) => (
                <tr key={idx} className="border-b border-slate-900">
                  <td className="border border-slate-900 p-2 font-bold">{s.semester}</td>
                  <td className="border border-slate-900 p-2 font-bold">{s.subjectCode}</td>
                  <td className="border border-slate-900 p-2 text-left font-bold uppercase">{s.subjectName}</td>
                  <td className="border border-slate-900 p-2">{s.subjectCategory?.code || 'PC'}</td>
                  <td className="border border-slate-900 p-2 font-semibold">{s.lecture ?? 0}</td>
                  <td className="border border-slate-900 p-2 font-semibold">{s.tutorial ?? 0}</td>
                  <td className="border border-slate-900 p-2 font-semibold">{s.practical ?? 0}</td>
                  <td className="border border-slate-900 p-2 font-semibold">{s.credits ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. Detailed Course Syllabi (Iterating through all semester subjects) */}
        <div className="space-y-8">
          <h2 className="text-sm font-black uppercase text-brand-800 border-b-2 border-slate-900 pb-1 flex items-center">
            <BookOpen className="w-4 h-4 mr-2 text-brand-600 print:hidden" />
            3. Detailed Course Syllabi
          </h2>

          {semesters.map((sem) => (
            <div key={sem} className="space-y-6">
              <h3 className="text-xs font-black uppercase bg-slate-900 text-white p-2 tracking-wider">
                SEMESTER {sem}
              </h3>

              {semesterMap[sem].map((subject, subIdx) => {
                const sub = subject.submission || {};
                const templateType = subject.subjectType?.templateType || 'THEORY';
                const isTheoryOrLabTheory = templateType === 'THEORY' || templateType === 'LAB_THEORY' || templateType === 'PROJECT_THEORY';
                const isLabOrLabTheory = templateType === 'LAB' || templateType === 'LAB_THEORY' || templateType === 'PROJECT' || templateType === 'PROJECT_THEORY';
                const computedTotalHours = sub.totalContactHours
                  || (subject.lecture ? subject.lecture * 15 : 0) + (subject.practical ? subject.practical * 15 : 0)
                  || (subject.credits ? Math.round(subject.credits * 15) : 45);

                return (
                  <div key={subIdx} className="space-y-3 pt-2 page-break-inside-avoid border-b border-slate-300 pb-6">
                    {/* Subject Header Grid */}
                    <table className="w-full border-collapse border border-slate-900 text-xs">
                      <thead>
                        <tr className="bg-slate-100 font-bold border-b border-slate-900">
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
                        <tr className="font-medium text-slate-900">
                          <td className="border border-slate-900 p-2 text-center font-bold">{subject.subjectCode}</td>
                          <td className="border border-slate-900 p-2 text-center font-bold uppercase">{subject.subjectName}</td>
                          <td className="border border-slate-900 p-2 text-center">{subject.subjectCategory?.code || 'PC'}</td>
                          <td className="border border-slate-900 p-2 text-center font-semibold">{subject.lecture ?? 0}</td>
                          <td className="border border-slate-900 p-2 text-center font-semibold">{subject.tutorial ?? 0}</td>
                          <td className="border border-slate-900 p-2 text-center font-semibold">{subject.practical ?? 0}</td>
                          <td className="border border-slate-900 p-2 text-center font-semibold">{subject.credits ?? 0}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Objectives */}
                    {sub.objectives && sub.objectives.length > 0 && (
                      <table className="w-full border-collapse border border-slate-900 text-xs">
                        <thead>
                          <tr className="bg-slate-100 font-bold border-b border-slate-900">
                            <th className="border border-slate-900 p-2 text-left uppercase font-bold text-slate-900">Objectives:</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sub.objectives.map((o: any, oIdx: number) => (
                            <tr key={oIdx} className="border-b border-slate-900">
                              <td className="border border-slate-900 p-2 text-left leading-relaxed">
                                ●  {cleanPrefix(o.description)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Units */}
                    {isTheoryOrLabTheory && sub.syllabusUnits && sub.syllabusUnits.length > 0 && (
                      <table className="w-full border-collapse border border-slate-900 text-xs">
                        <tbody>
                          {sub.syllabusUnits.map((u: any, uIdx: number) => (
                            <React.Fragment key={uIdx}>
                              <tr className="bg-slate-100 font-bold border-t border-b border-slate-900">
                                <td className="border border-slate-900 p-2 font-bold text-slate-900 w-[15%] text-left">
                                  UNIT-{getRomanNumeral(u.unitNumber || uIdx + 1)}
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
                          ))}
                          <tr className="bg-slate-100 font-bold border-t border-slate-900">
                            <td colSpan={3} className="border border-slate-900 p-2 text-left font-bold text-slate-900">
                              Total Contact Hours: <span className="font-extrabold">{computedTotalHours} Hours</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}

                    {/* Experiments */}
                    {isLabOrLabTheory && sub.experiments && sub.experiments.length > 0 && (
                      <table className="w-full border-collapse border border-slate-900 text-xs">
                        <thead>
                          <tr className="bg-slate-100 font-bold border-b border-slate-900">
                            <th colSpan={2} className="border border-slate-900 p-2 text-left uppercase font-bold text-slate-900">
                              LIST OF EXPERIMENTS
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sub.experiments.map((exp: any, eIdx: number) => (
                            <tr key={eIdx} className="border-b border-slate-900">
                              <td className="border border-slate-900 p-2 text-center font-bold w-[6%] text-slate-900">{eIdx + 1}</td>
                              <td className="border border-slate-900 p-2 text-left font-normal text-slate-800 leading-relaxed">{cleanPrefix(exp.title)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Course Outcomes */}
                    {sub.courseOutcomes && sub.courseOutcomes.length > 0 && (
                      <table className="w-full border-collapse border border-slate-900 text-xs">
                        <thead>
                          <tr className="bg-slate-100 font-bold border-b border-slate-900">
                            <th className="border border-slate-900 p-2 text-left uppercase font-bold text-slate-900">Course Outcomes:</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sub.courseOutcomes.map((co: any, coIdx: number) => (
                            <tr key={coIdx} className="border-b border-slate-900">
                              <td className="border border-slate-900 p-2 text-left leading-relaxed">
                                ●  <strong>CO{co.coNumber}{co.cognitiveLevel ? ` (${co.cognitiveLevel})` : ''}:</strong> {cleanPrefix(co.description)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Textbooks & References */}
                    {(sub.textbooks?.length > 0 || sub.references?.length > 0) && (
                      <table className="w-full border-collapse border border-slate-900 text-xs">
                        <tbody>
                          {sub.textbooks && sub.textbooks.length > 0 && (
                            <>
                              <tr className="bg-slate-100 font-bold border-b border-slate-900">
                                <th colSpan={2} className="border border-slate-900 p-2 text-left uppercase font-bold text-slate-900">Text Books:</th>
                              </tr>
                              {sub.textbooks.map((tb: any, tbIdx: number) => (
                                <tr key={tbIdx} className="border-b border-slate-900">
                                  <td className="border border-slate-900 p-2 text-center font-bold w-[6%] text-slate-900">{tbIdx + 1}</td>
                                  <td className="border border-slate-900 p-2 text-left font-normal text-slate-800 leading-relaxed">
                                    "{tb.title}"{tb.authors ? `, ${tb.authors}` : ''}{tb.edition ? `, ${tb.edition}` : ''}{tb.publisher ? `, ${tb.publisher}` : ''}{tb.year ? `, ${tb.year}` : ''}.
                                  </td>
                                </tr>
                              ))}
                            </>
                          )}

                          {sub.references && sub.references.length > 0 && (
                            <>
                              <tr className="bg-slate-100 font-bold border-b border-slate-900">
                                <th colSpan={2} className="border border-slate-900 p-2 text-left uppercase font-bold text-slate-900">Reference Book(s) / Web links:</th>
                              </tr>
                              {sub.references.map((ref: any, rIdx: number) => (
                                <tr key={rIdx} className="border-b border-slate-900">
                                  <td className="border border-slate-900 p-2 text-center font-bold w-[6%] text-slate-900">{rIdx + 1}</td>
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
                  </div>
                );
              })}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
