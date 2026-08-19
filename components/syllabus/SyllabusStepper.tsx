import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Save,
  Send,
  AlertCircle,
  Plus,
  Trash2,
  FileText,
  BookOpen,
  Target,
  Grid,
  MessageSquare,
  Sparkles,
  Lock,
} from 'lucide-react';
import { COPOMappingTable } from './COPOMappingTable';

interface SyllabusStepperProps {
  subject: any;
  poCount: number;
  psoCount: number;
  onSaveDraft: (data: any) => Promise<void>;
  onSubmitSyllabus: (data: any) => Promise<void>;
}

export const SyllabusStepper: React.FC<SyllabusStepperProps> = ({
  subject,
  poCount,
  psoCount,
  onSaveDraft,
  onSubmitSyllabus,
}) => {
  const templateType = subject.subjectType?.templateType || 'THEORY';
  const existingSub = subject.submission;
  const currentSyllabusStatus = subject.syllabusStatus;

  // Lock status check: Faculty cannot edit if submitted, resubmitted, or approved
  const isLocked = ['SUBMITTED', 'RESUBMITTED', 'APPROVED'].includes(currentSyllabusStatus);

  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [missingChecklist, setMissingChecklist] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form State
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [unitContactHours, setUnitContactHours] = useState<number>(9);
  const [labContactHours, setLabContactHours] = useState<number>(30);
  const [units, setUnits] = useState<any[]>([
    { unitNumber: 1, unitName: '', content: '' },
    { unitNumber: 2, unitName: '', content: '' },
    { unitNumber: 3, unitName: '', content: '' },
    { unitNumber: 4, unitName: '', content: '' },
    { unitNumber: 5, unitName: '', content: '' },
  ]);
  const [experiments, setExperiments] = useState<any[]>([
    { experimentNumber: 1, title: '' },
    { experimentNumber: 2, title: '' },
    { experimentNumber: 3, title: '' },
    { experimentNumber: 4, title: '' },
    { experimentNumber: 5, title: '' },
    { experimentNumber: 6, title: '' },
    { experimentNumber: 7, title: '' },
    { experimentNumber: 8, title: '' },
    { experimentNumber: 9, title: '' },
    { experimentNumber: 10, title: '' },
  ]);
  const [courseOutcomes, setCourseOutcomes] = useState<string[]>([
    '', '', '', '', ''
  ]);
  const [textbooks, setTextbooks] = useState<any[]>([
    { title: '', authors: '', edition: '', publisher: '', year: '' },
  ]);
  const [references, setReferences] = useState<any[]>([
    { title: '', authors: '', edition: '', publisher: '', year: '', url: '' },
  ]);
  const [coPoMappings, setCoPoMappings] = useState<Record<string, number>>({});
  const [coPoJustifications, setCoPoJustifications] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingSub) {
      if (existingSub.unitContactHours) setUnitContactHours(existingSub.unitContactHours);
      if (existingSub.labContactHours) setLabContactHours(existingSub.labContactHours);

      if (existingSub.objectives?.length > 0) {
        setObjectives(existingSub.objectives.map((o: any) => o.description));
      }

      if (existingSub.syllabusUnits?.length > 0) {
        setUnits(existingSub.syllabusUnits.map((u: any) => ({
          unitNumber: u.unitNumber,
          unitName: u.unitName,
          content: u.content,
        })));
      }

      if (existingSub.experiments?.length > 0) {
        setExperiments(existingSub.experiments.map((e: any) => ({
          experimentNumber: e.experimentNumber,
          title: e.title,
        })));
      }

      if (existingSub.courseOutcomes?.length > 0) {
        const coDescs = ['', '', '', '', ''];
        existingSub.courseOutcomes.forEach((co: any) => {
          if (co.coNumber >= 1 && co.coNumber <= 5) {
            coDescs[co.coNumber - 1] = co.description;
          }
        });
        setCourseOutcomes(coDescs);
      }

      if (existingSub.textbooks?.length > 0) {
        setTextbooks(existingSub.textbooks.map((tb: any) => ({
          title: tb.title,
          authors: tb.authors,
          edition: tb.edition || '',
          publisher: tb.publisher || '',
          year: tb.year || '',
        })));
      }

      if (existingSub.references?.length > 0) {
        setTextbooks(existingSub.textbooks);
        setReferences(existingSub.references.map((r: any) => ({
          title: r.title,
          authors: r.authors || '',
          edition: r.edition || '',
          publisher: r.publisher || '',
          year: r.year || '',
          url: r.url || '',
        })));
      }

      if (existingSub.coPoMappings?.length > 0) {
        const mapObj: Record<string, number> = {};
        existingSub.coPoMappings.forEach((m: any) => {
          mapObj[`${m.coNumber}_${m.poKey}`] = m.correlation;
        });
        setCoPoMappings(mapObj);
      }

      if (existingSub.coPoJustifications?.length > 0) {
        const justObj: Record<string, string> = {};
        existingSub.coPoJustifications.forEach((j: any) => {
          justObj[`${j.coNumber}_${j.poKey}`] = j.justification;
        });
        setCoPoJustifications(justObj);
      }
    }
  }, [existingSub]);

  // Derived Contact Hours Calculations
  const theoryContactHours = 5 * (unitContactHours || 0);
  const totalContactHours = templateType === 'THEORY'
    ? theoryContactHours
    : templateType === 'LAB'
    ? labContactHours
    : theoryContactHours + labContactHours;

  const steps = [
    { id: 1, label: 'Objectives', icon: <Target className="w-4 h-4" /> },
    { id: 2, label: 'Syllabus', icon: <BookOpen className="w-4 h-4" /> },
    { id: 3, label: 'Course Outcomes', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 4, label: 'Textbooks', icon: <FileText className="w-4 h-4" /> },
    { id: 5, label: 'References', icon: <FileText className="w-4 h-4" /> },
    { id: 6, label: 'CO/PO Mapping', icon: <Grid className="w-4 h-4" /> },
    { id: 7, label: 'Justifications', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 8, label: 'Review & Submit', icon: <Send className="w-4 h-4" /> },
  ];

  const getFormData = () => ({
    unitContactHours,
    theoryContactHours,
    labContactHours,
    totalContactHours,
    objectives: objectives.filter((o) => o.trim()),
    units,
    experiments: experiments.filter((e) => e.title.trim()),
    courseOutcomes: courseOutcomes.map((desc, idx) => ({ coNumber: idx + 1, description: desc })),
    textbooks: textbooks.filter((t) => t.title.trim()),
    references: references.filter((r) => r.title.trim()),
    coPoMappings: Object.entries(coPoMappings).map(([key, val]) => {
      const [coNumber, poKey] = key.split('_');
      return { coNumber: parseInt(coNumber), poKey, correlation: val };
    }),
    coPoJustifications: Object.entries(coPoJustifications).map(([key, val]) => {
      const [coNumber, poKey] = key.split('_');
      return { coNumber: parseInt(coNumber), poKey, justification: val };
    }),
  });

  const handleSaveDraft = async () => {
    if (isLocked) return;
    setLoading(true);
    setError('');
    try {
      await onSaveDraft(getFormData());
    } catch (err: any) {
      setError(err.message || 'Failed to save draft.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-Redirect logic on missing validation items
  const determineFirstMissingStep = (missingItems: string[]): number => {
    const text = missingItems.join(' ');
    if (text.includes('Objectives')) return 1;
    if (text.includes('Syllabus') || text.includes('units') || text.includes('experiments') || text.includes('Contact Hours')) return 2;
    if (text.includes('Course Outcomes') || text.includes('COs')) return 3;
    if (text.includes('Textbook')) return 4;
    if (text.includes('Reference')) return 5;
    if (text.includes('PO/PSO Mapping') || text.includes('Mapping grid')) return 6;
    if (text.includes('Justification')) return 7;
    return 8;
  };

  const handleFinalSubmit = async () => {
    if (isLocked) return;
    setLoading(true);
    setError('');
    try {
      await onSubmitSyllabus(getFormData());
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      if (err.missing && Array.isArray(err.missing)) {
        setMissingChecklist(err.missing);
        const targetStep = determineFirstMissingStep(err.missing);
        setActiveStep(targetStep);
        setError(`Please fix missing items on ${steps[targetStep - 1].label}.`);
        setShowConfirmModal(false);
      } else {
        setError(err.message || 'Submission failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (coNumber: number, poKey: string, correlation: number) => {
    if (isLocked) return;
    setCoPoMappings((prev) => ({
      ...prev,
      [`${coNumber}_${poKey}`]: correlation,
    }));
  };

  const handleJustificationChange = (coNumber: number, poKey: string, text: string) => {
    if (isLocked) return;
    setCoPoJustifications((prev) => ({
      ...prev,
      [`${coNumber}_${poKey}`]: text,
    }));
  };

  const correlatedPairs: { coNumber: number; poKey: string; correlation: number }[] = [];
  Object.entries(coPoMappings).forEach(([key, val]) => {
    if (val > 0) {
      const [coNumber, poKey] = key.split('_');
      correlatedPairs.push({ coNumber: parseInt(coNumber), poKey, correlation: val });
    }
  });

  return (
    <div className="space-y-6">
      {/* Edit Lock Banner if Submitted */}
      {isLocked && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900 shadow-sm">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Syllabus Submission Locked:</strong> This syllabus has been submitted to the HoD for review. You cannot make edits unless returned for correction.
            </span>
          </div>
        </div>
      )}

      {/* Stepper Header Bar */}
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-purple-100 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px]">
          {steps.map((s, idx) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => setActiveStep(s.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeStep === s.id
                    ? 'bg-brand-600 text-white shadow-md'
                    : s.id < activeStep
                    ? 'bg-purple-50 text-brand-700'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
              {idx < steps.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Step Content Area */}
      <div className="bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-purple-100 shadow-sm min-h-[450px]">
        {/* STEP 1: OBJECTIVES */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Course Objectives</h3>
              <p className="text-xs text-desc">Define clear, structured course objectives for {subject.subjectCode}.</p>
            </div>

            <div className="space-y-3">
              {objectives.map((obj, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-purple-50 text-brand-700 text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    disabled={isLocked}
                    value={obj}
                    onChange={(e) => {
                      const updated = [...objectives];
                      updated[idx] = e.target.value;
                      setObjectives(updated);
                    }}
                    placeholder={`Objective ${idx + 1}...`}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 disabled:bg-slate-100"
                  />
                  {!isLocked && objectives.length > 1 && (
                    <button
                      onClick={() => setObjectives(objectives.filter((_, i) => i !== idx))}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!isLocked && (
              <button
                onClick={() => setObjectives([...objectives, ''])}
                className="inline-flex items-center px-3 py-2 text-xs font-semibold text-brand-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Objective
              </button>
            )}
          </div>
        )}

        {/* STEP 2: SYLLABUS TEMPLATE */}
        {activeStep === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Syllabus Breakdown</h3>
              <p className="text-xs text-desc">Template: <strong>{templateType}</strong></p>
            </div>

            {/* Theory Component (Updated label per user instruction) */}
            {(templateType === 'THEORY' || templateType === 'LAB_ORIENTED_THEORY') && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-brand-800">Contact Hours for each unit</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min="1"
                      disabled={isLocked}
                      value={unitContactHours}
                      onChange={(e) => setUnitContactHours(parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-1.5 text-center text-sm font-bold border border-slate-300 rounded-xl focus:ring-brand-500 disabled:bg-slate-100"
                    />
                    <div className="text-xs font-bold text-brand-700 bg-white px-3 py-1.5 rounded-xl border border-purple-200">
                      Total Theory Hours: {theoryContactHours}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {units.map((u, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-brand-700 uppercase">Unit {u.unitNumber}:</span>
                        <input
                          type="text"
                          disabled={isLocked}
                          value={u.unitName}
                          onChange={(e) => {
                            const updated = [...units];
                            updated[idx].unitName = e.target.value;
                            setUnits(updated);
                          }}
                          placeholder={`Unit ${u.unitNumber} Title...`}
                          className="flex-1 px-3 py-1.5 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-brand-500 disabled:bg-slate-100"
                        />
                      </div>
                      <textarea
                        rows={3}
                        disabled={isLocked}
                        value={u.content}
                        onChange={(e) => {
                          const updated = [...units];
                          updated[idx].content = e.target.value;
                          setUnits(updated);
                        }}
                        placeholder={`Detailed syllabus content for Unit ${u.unitNumber}...`}
                        className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-brand-500 disabled:bg-slate-100"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lab Component */}
            {(templateType === 'LAB' || templateType === 'LAB_ORIENTED_THEORY') && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-indigo-900">Lab Experiments & Contact Hours</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-700">Lab Contact Hours:</span>
                    <input
                      type="number"
                      min="1"
                      disabled={isLocked}
                      value={labContactHours}
                      onChange={(e) => setLabContactHours(parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-1.5 text-center text-sm font-bold border border-slate-300 rounded-xl focus:ring-brand-500 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {experiments.map((exp, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-100 text-indigo-900 text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={exp.title}
                        onChange={(e) => {
                          const updated = [...experiments];
                          updated[idx].title = e.target.value;
                          setExperiments(updated);
                        }}
                        placeholder={`Experiment ${idx + 1} Title / Description...`}
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-brand-500 disabled:bg-slate-100"
                      />
                      {!isLocked && experiments.length > (templateType === 'LAB' ? 10 : 7) && (
                        <button
                          onClick={() => setExperiments(experiments.filter((_, i) => i !== idx))}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {!isLocked && (
                  <button
                    onClick={() => setExperiments([...experiments, { experimentNumber: experiments.length + 1, title: '' }])}
                    className="inline-flex items-center px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Experiment
                  </button>
                )}
              </div>
            )}

            <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs font-bold">
              <span>Calculated Total Contact Hours:</span>
              <span className="text-amber-400 text-sm font-mono">{totalContactHours} Hours</span>
            </div>
          </div>
        )}

        {/* STEP 3: COURSE OUTCOMES */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Course Outcomes (COs)</h3>
              <p className="text-xs text-desc">Specify exactly 5 mandatory Course Outcomes (CO1 to CO5).</p>
            </div>

            <div className="space-y-3">
              {courseOutcomes.map((coDesc, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-3 border border-purple-100 rounded-2xl bg-purple-50/30">
                  <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-600 text-white text-xs font-bold shrink-0">
                    CO{idx + 1}
                  </span>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    value={coDesc}
                    onChange={(e) => {
                      const updated = [...courseOutcomes];
                      updated[idx] = e.target.value;
                      setCourseOutcomes(updated);
                    }}
                    placeholder={`Description for Course Outcome ${idx + 1}...`}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-brand-500 disabled:bg-slate-100"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: TEXTBOOKS */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Textbooks</h3>
                <p className="text-xs text-desc">Add required textbooks for this course.</p>
              </div>
              {!isLocked && (
                <button
                  onClick={() => setTextbooks([...textbooks, { title: '', authors: '', edition: '', publisher: '', year: '' }])}
                  className="px-3 py-1.5 text-xs font-semibold text-brand-700 bg-purple-50 hover:bg-purple-100 rounded-xl flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Textbook
                </button>
              )}
            </div>

            <div className="space-y-4">
              {textbooks.map((tb, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Textbook #{idx + 1}</span>
                    {!isLocked && textbooks.length > 1 && (
                      <button onClick={() => setTextbooks(textbooks.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Title *"
                      disabled={isLocked}
                      value={tb.title}
                      onChange={(e) => {
                        const updated = [...textbooks];
                        updated[idx].title = e.target.value;
                        setTextbooks(updated);
                      }}
                      className="px-3 py-1.5 text-xs border rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="Author(s) *"
                      disabled={isLocked}
                      value={tb.authors}
                      onChange={(e) => {
                        const updated = [...textbooks];
                        updated[idx].authors = e.target.value;
                        setTextbooks(updated);
                      }}
                      className="px-3 py-1.5 text-xs border rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="Edition (e.g. 4th Edition)"
                      disabled={isLocked}
                      value={tb.edition}
                      onChange={(e) => {
                        const updated = [...textbooks];
                        updated[idx].edition = e.target.value;
                        setTextbooks(updated);
                      }}
                      className="px-3 py-1.5 text-xs border rounded-xl"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Publisher"
                        disabled={isLocked}
                        value={tb.publisher}
                        onChange={(e) => {
                          const updated = [...textbooks];
                          updated[idx].publisher = e.target.value;
                          setTextbooks(updated);
                        }}
                        className="px-3 py-1.5 text-xs border rounded-xl"
                      />
                      <input
                        type="text"
                        placeholder="Year"
                        disabled={isLocked}
                        value={tb.year}
                        onChange={(e) => {
                          const updated = [...textbooks];
                          updated[idx].year = e.target.value;
                          setTextbooks(updated);
                        }}
                        className="px-3 py-1.5 text-xs border rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: REFERENCES */}
        {activeStep === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reference Books & Online Resources</h3>
                <p className="text-xs text-desc">Add physical reference books or web resources.</p>
              </div>
              {!isLocked && (
                <button
                  onClick={() => setReferences([...references, { title: '', authors: '', edition: '', publisher: '', year: '', url: '' }])}
                  className="px-3 py-1.5 text-xs font-semibold text-brand-700 bg-purple-50 hover:bg-purple-100 rounded-xl flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Reference
                </button>
              )}
            </div>

            <div className="space-y-4">
              {references.map((ref, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Reference #{idx + 1}</span>
                    {!isLocked && references.length > 1 && (
                      <button onClick={() => setReferences(references.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Title *"
                      disabled={isLocked}
                      value={ref.title}
                      onChange={(e) => {
                        const updated = [...references];
                        updated[idx].title = e.target.value;
                        setReferences(updated);
                      }}
                      className="px-3 py-1.5 text-xs border rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="Author(s) / Organization"
                      disabled={isLocked}
                      value={ref.authors}
                      onChange={(e) => {
                        const updated = [...references];
                        updated[idx].authors = e.target.value;
                        setReferences(updated);
                      }}
                      className="px-3 py-1.5 text-xs border rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="URL / Web Link (Optional)"
                      disabled={isLocked}
                      value={ref.url}
                      onChange={(e) => {
                        const updated = [...references];
                        updated[idx].url = e.target.value;
                        setReferences(updated);
                      }}
                      className="px-3 py-1.5 text-xs border rounded-xl col-span-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: CO/PO MAPPING */}
        {activeStep === 6 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">CO/PO & PSO Mapping Matrix</h3>
              <p className="text-xs text-desc">Map the 5 Course Outcomes against the configured {poCount} POs and {psoCount} PSOs.</p>
            </div>
            <COPOMappingTable
              poCount={poCount}
              psoCount={psoCount}
              mappings={coPoMappings}
              onChange={handleMappingChange}
              disabled={isLocked}
            />
          </div>
        )}

        {/* STEP 7: JUSTIFICATIONS */}
        {activeStep === 7 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">CO/PO Mapping Justifications</h3>
              <p className="text-xs text-desc">
                Provide detailed justifications for all mapped correlations (1, 2, or 3). Uncorrelated pairs (-) do not require justification.
              </p>
            </div>

            {correlatedPairs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed text-desc text-xs">
                No active correlations selected in Step 6. Return to Step 6 to set mapping values (1, 2, or 3).
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {correlatedPairs.map((pair) => {
                  const key = `${pair.coNumber}_${pair.poKey}`;
                  const currentText = coPoJustifications[key] || '';
                  return (
                    <div key={key} className="p-4 border border-purple-100 rounded-2xl bg-purple-50/20 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>
                          CO{pair.coNumber} → {pair.poKey}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-brand-800">
                          Correlation: {pair.correlation}
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        required
                        disabled={isLocked}
                        value={currentText}
                        onChange={(e) => handleJustificationChange(pair.coNumber, pair.poKey, e.target.value)}
                        placeholder={`Provide academic justification for mapping CO${pair.coNumber} to ${pair.poKey}...`}
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-brand-500 disabled:bg-slate-100"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 8: REVIEW & SUBMIT */}
        {activeStep === 8 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Review Syllabus & Submit</h3>
              <p className="text-xs text-desc">Verify all sections before submitting to the Head of Department.</p>
            </div>

            {missingChecklist.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-xs text-amber-900">
                <p className="font-bold flex items-center text-amber-800">
                  <AlertCircle className="w-4 h-4 mr-1.5 text-amber-600" />
                  Cannot submit syllabus yet. Please complete missing requirements:
                </p>
                <ul className="list-disc list-inside space-y-1 font-medium">
                  {missingChecklist.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 border rounded-2xl bg-slate-50 flex items-center justify-between">
                <span>Objectives</span>
                <span className="font-bold text-emerald-600 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> {objectives.filter((o) => o.trim()).length} Completed
                </span>
              </div>

              <div className="p-3 border rounded-2xl bg-slate-50 flex items-center justify-between">
                <span>Syllabus Breakdown</span>
                <span className="font-bold text-emerald-600 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> {totalContactHours} Hours
                </span>
              </div>

              <div className="p-3 border rounded-2xl bg-slate-50 flex items-center justify-between">
                <span>Course Outcomes (CO1..CO5)</span>
                <span className="font-bold text-emerald-600 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> {courseOutcomes.filter((c) => c.trim()).length}/5 Filled
                </span>
              </div>

              <div className="p-3 border rounded-2xl bg-slate-50 flex items-center justify-between">
                <span>CO/PO Mapping Matrix</span>
                <span className="font-bold text-purple-600 flex items-center">
                  <Grid className="w-4 h-4 mr-1" /> {Object.keys(coPoMappings).length} Mapped
                </span>
              </div>
            </div>

            {!isLocked && (
              <div className="pt-4 border-t flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center"
                >
                  <Save className="w-4 h-4 mr-1.5" /> Save Draft
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={loading}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md flex items-center"
                >
                  <Send className="w-4 h-4 mr-1.5" /> Submit Syllabus to HoD
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stepper Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
          disabled={activeStep === 1}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white rounded-xl border border-slate-200 disabled:opacity-40 flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous Step
        </button>

        {!isLocked && (
          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-brand-700 bg-purple-50 hover:bg-purple-100 rounded-xl flex items-center"
          >
            <Save className="w-4 h-4 mr-1.5" /> Save Progress Draft
          </button>
        )}

        <button
          onClick={() => setActiveStep(Math.min(8, activeStep + 1))}
          disabled={activeStep === 8}
          className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs disabled:opacity-40 flex items-center"
        >
          Next Step <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Submit Syllabus to HoD?</h3>
            <p className="text-xs text-desc">
              After submission, the syllabus will be sent to the Head of Department for review. You will not be able to make normal edits unless the HoD returns it for correction.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
              >
                {loading ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitted Successfully Modal (User Requirement) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Submitted Successfully!</h3>
            <p className="text-xs text-desc">
              Your syllabus for <strong>{subject.subjectCode} — {subject.subjectName}</strong> has been submitted to the Head of Department for review.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
