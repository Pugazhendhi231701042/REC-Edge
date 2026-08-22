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
  Globe,
} from 'lucide-react';
import { COPOMappingTable } from './COPOMappingTable';
import { SDGMappingForm, SDGGoalItem, SDGMappingItem } from './SDGMappingForm';

interface SyllabusStepperProps {
  subject: any;
  poCount: number;
  psoCount: number;
  sdgGoals?: SDGGoalItem[];
  onSaveDraft: (data: any) => Promise<void>;
  onSubmitSyllabus: (data: any) => Promise<void>;
}

export const SyllabusStepper: React.FC<SyllabusStepperProps> = ({
  subject,
  poCount,
  psoCount,
  sdgGoals = [],
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
  const [objectives, setObjectives] = useState<string[]>(['', '', '']);
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
  const [courseOutcomes, setCourseOutcomes] = useState<any[]>([
    { description: '', cognitiveLevel: 'K3' },
    { description: '', cognitiveLevel: 'K3' },
    { description: '', cognitiveLevel: 'K3' },
    { description: '', cognitiveLevel: 'K3' },
    { description: '', cognitiveLevel: 'K3' },
  ]);
  const [textbooks, setTextbooks] = useState<any[]>([]);
  const [references, setReferences] = useState<any[]>([]);
  const [coPoMappings, setCoPoMappings] = useState<Record<string, number>>({});
  const [coPoJustifications, setCoPoJustifications] = useState<Record<string, string>>({});
  const [sdgMappings, setSdgMappings] = useState<SDGMappingItem[]>([]);
  const [poStatements, setPoStatements] = useState<any[]>([]);
  const [psoStatements, setPsoStatements] = useState<any[]>([]);

  useEffect(() => {
    if (subject?.departmentId) {
      fetch(`/api/hod/po-pso?departmentId=${subject.departmentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.poStatements) setPoStatements(data.poStatements);
          if (data.psoStatements) setPsoStatements(data.psoStatements);
        })
        .catch(() => {});
    }
  }, [subject?.departmentId]);

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
        const coList = [
          { description: '', cognitiveLevel: 'K3' },
          { description: '', cognitiveLevel: 'K3' },
          { description: '', cognitiveLevel: 'K3' },
          { description: '', cognitiveLevel: 'K3' },
          { description: '', cognitiveLevel: 'K3' },
        ];
        existingSub.courseOutcomes.forEach((co: any) => {
          if (co.coNumber >= 1 && co.coNumber <= 5) {
            coList[co.coNumber - 1] = {
              description: co.description || '',
              cognitiveLevel: co.cognitiveLevel || 'K3',
            };
          }
        });
        setCourseOutcomes(coList);
      }

      if (existingSub.textbooks?.length > 0) {
        setTextbooks(existingSub.textbooks.map((tb: any) => ({
          title: tb.title,
          authors: tb.authors || '',
          edition: tb.edition || '',
          publisher: tb.publisher || '',
          year: tb.year || '',
        })));
      }

      if (existingSub.references?.length > 0) {
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

      if (existingSub.sdgMappings?.length > 0) {
        setSdgMappings(existingSub.sdgMappings.map((m: any) => ({
          coNumber: m.coNumber,
          sdgNumber: m.sdgNumber,
          topic: m.topic,
        })));
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

  // UPDATED STEPPER SEQUENCE: SDG Mapping comes after CO/PO Justification (Step 8!)
  const steps = [
    { id: 1, label: 'Objectives', icon: <Target className="w-4 h-4" /> },
    { id: 2, label: 'Syllabus', icon: <BookOpen className="w-4 h-4" /> },
    { id: 3, label: 'Course Outcomes', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 4, label: 'Textbooks', icon: <FileText className="w-4 h-4" /> },
    { id: 5, label: 'References', icon: <FileText className="w-4 h-4" /> },
    { id: 6, label: 'CO/PO Mapping', icon: <Grid className="w-4 h-4" /> },
    { id: 7, label: 'CO/PO Justification', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 8, label: 'SDG Mapping', icon: <Globe className="w-4 h-4" /> },
    { id: 9, label: 'Review & Submit', icon: <Send className="w-4 h-4" /> },
  ];

  const getFormData = () => ({
    isSubmit: true,
    unitContactHours,
    theoryContactHours,
    labContactHours,
    totalContactHours,
    objectives: objectives.filter((o) => o.trim()),
    units,
    experiments: experiments.filter((e) => e.title.trim()),
    courseOutcomes: courseOutcomes.map((co, idx) => ({
      coNumber: idx + 1,
      cognitiveLevel: co.cognitiveLevel || 'K3',
      description: typeof co === 'string' ? co : (co.description || ''),
    })),
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
    sdgMappings,
  });

  const handleSaveDraft = async () => {
    if (isLocked) return;
    if (!confirm('Are you sure you want to save draft?')) return;

    setLoading(true);
    setError('');
    try {
      const draftData = getFormData();
      draftData.isSubmit = false;
      await onSaveDraft(draftData);
    } catch (err: any) {
      setError(err.message || 'Failed to save draft.');
    } finally {
      setLoading(false);
    }
  };

  const validateFormBeforeSubmit = (): { valid: boolean; missing: string[]; firstMissingStep: number } => {
    const missing: string[] = [];
    let firstMissingStep = 9;

    // Step 1: Objectives (3 - 5)
    const validObjectives = objectives.filter((o) => o.trim());
    if (validObjectives.length < 3 || validObjectives.length > 5) {
      missing.push('⚠ Course Objectives must have between 3 and 5 non-empty entries.');
      if (firstMissingStep > 1) firstMissingStep = 1;
    }

    // Step 2: Units / Experiments
    if (templateType === 'THEORY' || templateType === 'THEORY_LAB') {
      const incompleteUnits = units.filter((u) => !u.unitName.trim() || !u.content.trim());
      if (incompleteUnits.length > 0) {
        missing.push('⚠ All 5 Syllabus Units must have non-empty titles and topic descriptions.');
        if (firstMissingStep > 2) firstMissingStep = 2;
      }
    }
    if (templateType === 'LAB' || templateType === 'THEORY_LAB') {
      const validExps = experiments.filter((e) => e.title.trim());
      if (validExps.length === 0) {
        missing.push('⚠ At least 1 Laboratory Experiment title is required for practical courses.');
        if (firstMissingStep > 2) firstMissingStep = 2;
      }
    }

    // Step 3: Course Outcomes (5 mandatory COs)
    const validCOs = courseOutcomes.filter((co) =>
      typeof co === 'string' ? co.trim() : co?.description?.trim()
    );
    if (validCOs.length < 5) {
      missing.push('⚠ Exactly 5 Course Outcomes (CO1..CO5) are mandatory with descriptions.');
      if (firstMissingStep > 3) firstMissingStep = 3;
    }

    // Step 4: Textbooks
    const validTextbooks = textbooks.filter((t) => t.title.trim());
    if (validTextbooks.length === 0) {
      missing.push('⚠ At least 1 Textbook entry (Title & Authors) is mandatory.');
      if (firstMissingStep > 4) firstMissingStep = 4;
    }

    // Step 6: CO/PO Mapping
    const mappedCount = Object.values(coPoMappings).filter((v) => v > 0).length;
    if (mappedCount === 0) {
      missing.push('⚠ At least one non-zero correlation must be mapped in the CO/PO Mapping Table.');
      if (firstMissingStep > 6) firstMissingStep = 6;
    }

    // Step 8: SDG Mapping
    if (sdgMappings.length === 0) {
      missing.push('⚠ At least 1 SDG Goal topic mapping is required.');
      if (firstMissingStep > 8) firstMissingStep = 8;
    }

    return {
      valid: missing.length === 0,
      missing,
      firstMissingStep,
    };
  };

  // Auto-Redirect logic on missing validation items to exact step
  const determineFirstMissingStep = (missingItems: string[]): number => {
    const text = missingItems.join(' ');
    if (text.includes('Objectives')) return 1;
    if (text.includes('Syllabus') || text.includes('units') || text.includes('experiments') || text.includes('Contact Hours')) return 2;
    if (text.includes('Course Outcomes') || text.includes('COs')) return 3;
    if (text.includes('Textbook')) return 4;
    if (text.includes('Reference')) return 5;
    if (text.includes('PO/PSO Mapping') || text.includes('Mapping grid')) return 6;
    if (text.includes('Justification')) return 7;
    if (text.includes('SDG') || text.includes('SDG Mapping') || text.includes('CO1 — Please') || text.includes('CO2 — Please') || text.includes('CO3 — Please') || text.includes('CO4 — Please') || text.includes('CO5 — Please')) return 8;
    return 9;
  };

  const handleFinalSubmit = async () => {
    if (isLocked) return;

    if (!confirm('Are you sure you want to submit this syllabus to the Head of Department (HoD) for review?')) {
      return;
    }

    const validation = validateFormBeforeSubmit();
    if (!validation.valid) {
      setMissingChecklist(validation.missing);
      setActiveStep(validation.firstMissingStep);
      setError(`Validation Error: Please complete missing required fields on Step ${validation.firstMissingStep}: ${steps[validation.firstMissingStep - 1].label}.`);
      return;
    }

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
        setError(`Please complete required missing items on Step ${targetStep}: ${steps[targetStep - 1].label}.`);
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
    <div className="space-y-6 select-none">
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

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-brand-700 uppercase bg-purple-100 px-2.5 py-0.5 rounded border border-purple-200">
              {subject.subjectCode}
            </span>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
              {subject.subjectType?.name} ({templateType})
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">{subject.subjectName}</h2>
          <p className="text-xs text-desc mt-0.5">
            L-T-P-C: <strong>{subject.lecture}-{subject.tutorial}-{subject.practical}-{subject.credits}</strong> | Semester {subject.semester}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {!isLocked && (
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl shadow-xs flex items-center transition-colors"
            >
              <Save className="w-4 h-4 mr-1.5" /> Save Draft
            </button>
          )}
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="bg-white p-4 rounded-3xl border border-purple-100 shadow-sm space-y-2">
        <div className="flex justify-between items-center text-xs font-extrabold text-slate-800">
          <span className="flex items-center text-brand-700">
            <Sparkles className="w-4 h-4 mr-1.5 text-brand-600" />
            Syllabus Formation Progress: Step {activeStep} of {steps.length} — {steps[activeStep - 1].label}
          </span>
          <span className="text-brand-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
            {Math.round((activeStep / steps.length) * 100)}% Completed
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-brand-600 h-2.5 rounded-full transition-all duration-300 shadow-xs"
            style={{ width: `${Math.round((activeStep / steps.length) * 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Stepper Navigation Header */}
      <div className="bg-white p-4 rounded-3xl border border-purple-100 shadow-sm overflow-x-auto">
        <div className="flex items-center space-x-1 min-w-max">
          {steps.map((step) => {
            const isActive = activeStep === step.id;
            const isDone = activeStep > step.id;

            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : isDone
                    ? 'bg-purple-50 text-brand-700 hover:bg-purple-100'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span>{step.icon}</span>
                <span>{step.id}. {step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation Error Banner with Checklist */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-2">
          <div className="flex items-center font-bold">
            <AlertCircle className="w-4 h-4 mr-2 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          {missingChecklist.length > 0 && (
            <ul className="list-disc list-inside space-y-1 text-[11px] pl-6">
              {missingChecklist.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Step Content Panels */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-purple-100 shadow-sm space-y-6">
        {/* STEP 1: OBJECTIVES */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase text-brand-700">Step 1: Course Objectives</h3>
                <p className="text-xs text-desc">Define course objectives for this subject.</p>
              </div>
            </div>

            {objectives.map((obj, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-500 w-6">#{idx + 1}</span>
                <input
                  type="text"
                  disabled={isLocked}
                  value={obj}
                  onChange={(e) => {
                    const newArr = [...objectives];
                    newArr[idx] = e.target.value;
                    setObjectives(newArr);
                  }}
                  placeholder="e.g. To understand basic principles of algorithm analysis..."
                  className="flex-1 px-3 py-2 text-xs border rounded-xl focus:ring-brand-500 font-medium"
                />
                {!isLocked && objectives.length > 3 && (
                  <button
                    onClick={() => setObjectives(objectives.filter((_, i) => i !== idx))}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Remove Objective"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {!isLocked && objectives.length < 5 && (
              <button
                onClick={() => setObjectives([...objectives, ''])}
                className="px-3 py-1.5 text-xs font-bold text-brand-700 bg-purple-50 hover:bg-purple-100 rounded-xl flex items-center shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Objective
              </button>
            )}
          </div>
        )}

        {/* STEP 2: SYLLABUS UNITS / EXPERIMENTS */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase text-brand-700">Step 2: Course Syllabus Content</h3>

            {(templateType === 'THEORY' || templateType === 'LAB_ORIENTED_THEORY') && (
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 rounded-xl text-xs font-semibold text-brand-900">
                  Unit Contact Hours: <strong className="text-brand-700 font-bold">{unitContactHours} Hours/Unit</strong> (Total 5 Theory Units = {theoryContactHours} Hours)
                </div>

                {units.map((unit, idx) => (
                  <div key={idx} className="p-4 border rounded-2xl bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-700">Unit {unit.unitNumber}</span>
                      {!isLocked && (
                        <button
                          type="button"
                          onClick={() => {
                            const formatted = unit.content
                              .split('\n')
                              .map((line: string) => line.trim().replace(/^[-•*]\s*/, ''))
                              .filter(Boolean)
                              .join(' - ');
                            const newUnits = [...units];
                            newUnits[idx].content = formatted;
                            setUnits(newUnits);
                          }}
                          className="text-[11px] font-bold text-brand-600 hover:underline bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100"
                        >
                          ⚡ Auto-format newlines to hyphens (" - ")
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      disabled={isLocked}
                      value={unit.unitName}
                      onChange={(e) => {
                        const newUnits = [...units];
                        newUnits[idx].unitName = e.target.value;
                        setUnits(newUnits);
                      }}
                      placeholder={`Unit ${unit.unitNumber} Title...`}
                      className="w-full px-3 py-2 text-xs border rounded-xl font-bold"
                    />
                    <textarea
                      rows={3}
                      disabled={isLocked}
                      value={unit.content}
                      onChange={(e) => {
                        const newUnits = [...units];
                        newUnits[idx].content = e.target.value;
                        setUnits(newUnits);
                      }}
                      placeholder="Enter topics separated by hyphens (or paste line-by-line and click Auto-format)..."
                      className="w-full px-3 py-2 text-xs border rounded-xl"
                    />
                  </div>
                ))}
              </div>
            )}

            {(templateType === 'LAB' || templateType === 'LAB_ORIENTED_THEORY') && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Laboratory Experiments</h4>
                {experiments.map((exp, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-500 w-8">Exp #{exp.experimentNumber}</span>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={exp.title}
                      onChange={(e) => {
                        const newExps = [...experiments];
                        newExps[idx].title = e.target.value;
                        setExperiments(newExps);
                      }}
                      placeholder="Experiment Title..."
                      className="flex-1 px-3 py-2 text-xs border rounded-xl"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: COURSE OUTCOMES WITH COGNITIVE LEVEL */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase text-brand-700">Step 3: Course Outcomes (COs) & Cognitive Levels</h3>
            <p className="text-xs text-desc">Define exactly 5 mandatory Course Outcomes corresponding to Units 1 to 5 and select Cognitive Level (Bloom's Taxonomy).</p>
            {courseOutcomes.map((co, idx) => (
              <div key={idx} className="p-4 border rounded-2xl bg-slate-50/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700">
                    CO{idx + 1} (Corresponds to Unit {idx + 1}) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-semibold text-slate-600">Cognitive Level:</span>
                    <select
                      disabled={isLocked}
                      value={co.cognitiveLevel || 'K3'}
                      onChange={(e) => {
                        const newCOs = [...courseOutcomes];
                        newCOs[idx].cognitiveLevel = e.target.value;
                        setCourseOutcomes(newCOs);
                      }}
                      className="text-xs font-bold text-brand-800 bg-purple-100 border border-purple-300 rounded-xl px-2.5 py-1 focus:ring-brand-500"
                    >
                      <option value="K1">K1 - Remember</option>
                      <option value="K2">K2 - Understand</option>
                      <option value="K3">K3 - Apply</option>
                      <option value="K4">K4 - Analyze</option>
                      <option value="K5">K5 - Evaluate / Create</option>
                      <option value="K6">K6 - Create</option>
                    </select>
                  </div>
                </div>
                <textarea
                  rows={2}
                  disabled={isLocked}
                  value={co.description || ''}
                  onChange={(e) => {
                    const newCOs = [...courseOutcomes];
                    newCOs[idx].description = e.target.value;
                    setCourseOutcomes(newCOs);
                  }}
                  placeholder={`Upon completion of this unit, students will be able to...`}
                  className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-brand-500"
                />
              </div>
            ))}
          </div>
        )}

        {/* STEP 4: TEXTBOOKS (STRUCTURED INPUT & STANDARD FORMATTING) */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase text-brand-700">Step 4: Textbooks</h3>
                <p className="text-xs text-desc">Enter textbook details below. Formatted as: <code>[1] "Title", Authors, Edition, Publisher, Year.</code></p>
              </div>
            </div>

            {textbooks.map((tb, idx) => (
              <div key={idx} className="p-4 border rounded-2xl bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-700">Book [{idx + 1}]</span>
                  {!isLocked && (
                    <button
                      onClick={() => setTextbooks(textbooks.filter((_, i) => i !== idx))}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs flex items-center"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    disabled={isLocked}
                    value={tb.title}
                    onChange={(e) => {
                      const newTbs = [...textbooks];
                      newTbs[idx].title = e.target.value;
                      setTextbooks(newTbs);
                    }}
                    placeholder='Book Title (e.g. Data Structures and Algorithm Analysis in C++) *'
                    className="px-3 py-2 text-xs border rounded-xl font-bold"
                  />
                  <input
                    type="text"
                    disabled={isLocked}
                    value={tb.authors}
                    onChange={(e) => {
                      const newTbs = [...textbooks];
                      newTbs[idx].authors = e.target.value;
                      setTextbooks(newTbs);
                    }}
                    placeholder='Authors (e.g. Mark Allen Weiss) *'
                    className="px-3 py-2 text-xs border rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    disabled={isLocked}
                    value={tb.edition}
                    onChange={(e) => {
                      const newTbs = [...textbooks];
                      newTbs[idx].edition = e.target.value;
                      setTextbooks(newTbs);
                    }}
                    placeholder="Edition (e.g. 4th Edition)"
                    className="px-3 py-2 text-xs border rounded-xl"
                  />
                  <input
                    type="text"
                    disabled={isLocked}
                    value={tb.publisher}
                    onChange={(e) => {
                      const newTbs = [...textbooks];
                      newTbs[idx].publisher = e.target.value;
                      setTextbooks(newTbs);
                    }}
                    placeholder="Publisher (e.g. Pearson)"
                    className="px-3 py-2 text-xs border rounded-xl"
                  />
                  <input
                    type="text"
                    disabled={isLocked}
                    value={tb.year}
                    onChange={(e) => {
                      const newTbs = [...textbooks];
                      newTbs[idx].year = e.target.value;
                      setTextbooks(newTbs);
                    }}
                    placeholder="Year (e.g. 2014)"
                    className="px-3 py-2 text-xs border rounded-xl"
                  />
                </div>

                {tb.title && (
                  <div className="p-2.5 bg-purple-50/60 rounded-xl border border-purple-100 text-xs font-mono text-slate-800">
                    <span className="font-bold text-brand-700">Preview: </span>
                    [{idx + 1}] "{tb.title}"{tb.authors ? `, ${tb.authors}` : ''}{tb.edition ? `, ${tb.edition}` : ''}{tb.publisher ? `, ${tb.publisher}` : ''}{tb.year ? `, ${tb.year}` : ''}.
                  </div>
                )}
              </div>
            ))}

            {!isLocked && (
              <button
                onClick={() => setTextbooks([...textbooks, { title: '', authors: '', edition: '', publisher: '', year: '' }])}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Book</span>
              </button>
            )}
          </div>
        )}

        {/* STEP 5: REFERENCES */}
        {activeStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase text-brand-700">Step 5: Reference Books / Links</h3>
            {references.map((ref, idx) => (
              <div key={idx} className="p-4 border rounded-2xl bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-700">Reference [{idx + 1}]</span>
                  {!isLocked && (
                    <button
                      onClick={() => setReferences(references.filter((_, i) => i !== idx))}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs flex items-center"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  disabled={isLocked}
                  value={ref.title}
                  onChange={(e) => {
                    const newRefs = [...references];
                    newRefs[idx].title = e.target.value;
                    setReferences(newRefs);
                  }}
                  placeholder="Reference Title *"
                  className="w-full px-3 py-2 text-xs border rounded-xl font-bold"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    disabled={isLocked}
                    value={ref.authors}
                    onChange={(e) => {
                      const newRefs = [...references];
                      newRefs[idx].authors = e.target.value;
                      setReferences(newRefs);
                    }}
                    placeholder="Authors"
                    className="px-3 py-2 text-xs border rounded-xl"
                  />
                  <input
                    type="text"
                    disabled={isLocked}
                    value={ref.url}
                    onChange={(e) => {
                      const newRefs = [...references];
                      newRefs[idx].url = e.target.value;
                      setReferences(newRefs);
                    }}
                    placeholder="Web Link URL (Optional)"
                    className="px-3 py-2 text-xs border rounded-xl"
                  />
                </div>
              </div>
            ))}
            {!isLocked && (
              <button
                onClick={() => setReferences([...references, { title: '', authors: '', edition: '', publisher: '', year: '', url: '' }])}
                className="px-3 py-1.5 text-xs font-bold text-brand-700 bg-purple-50 hover:bg-purple-100 rounded-xl flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Reference
              </button>
            )}
          </div>
        )}

        {/* STEP 6: CO/PO MAPPING */}
        {activeStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase text-brand-700">Step 6: CO / PO & PSO Mapping Matrix</h3>
            <p className="text-xs text-desc">Map Course Outcomes (CO1-CO5) to Program Outcomes (PO1-PO{poCount}) and PSOs (PSO1-PSO{psoCount}). Hover headers to view HoD-defined statements.</p>
            <COPOMappingTable
              poCount={poCount}
              psoCount={psoCount}
              poStatements={poStatements}
              psoStatements={psoStatements}
              mappings={coPoMappings}
              onChange={handleMappingChange}
              disabled={isLocked}
            />
          </div>
        )}

        {/* STEP 7: CO/PO JUSTIFICATION WITH STATEMENT DISPLAY */}
        {activeStep === 7 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase text-brand-700">Step 7: CO / PO Justification</h3>
            <p className="text-xs text-desc">Provide mandatory justification text for every non-zero correlated CO-PO mapping cell based on actual PO/PSO statements.</p>

            {correlatedPairs.length === 0 ? (
              <p className="text-xs text-desc py-4 text-center">No non-zero CO-PO correlations mapped in Step 6 yet.</p>
            ) : (
              correlatedPairs.map((pair) => {
                const key = `${pair.coNumber}_${pair.poKey}`;
                const stmtObj = pair.poKey.startsWith('PSO')
                  ? psoStatements.find((s) => s.psoKey === pair.poKey)
                  : poStatements.find((s) => s.poKey === pair.poKey);
                const stmtText = stmtObj?.statement;

                return (
                  <div key={key} className="p-4 border rounded-2xl bg-slate-50/70 space-y-2">
                    <div className="flex justify-between items-start">
                      <label className="block text-xs font-bold text-brand-700">
                        Justification for CO{pair.coNumber} → {pair.poKey} (Correlation: {pair.correlation}) *
                      </label>
                    </div>

                    {stmtText && (
                      <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs text-amber-900">
                        <strong className="font-bold text-amber-950">{pair.poKey} Statement: </strong>
                        {stmtText}
                      </div>
                    )}

                    <textarea
                      rows={2}
                      disabled={isLocked}
                      value={coPoJustifications[key] || ''}
                      onChange={(e) => handleJustificationChange(pair.coNumber, pair.poKey, e.target.value)}
                      placeholder={`Explain how CO${pair.coNumber} addresses ${pair.poKey}...`}
                      className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-brand-500 bg-white"
                    />
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* STEP 8: SDG MAPPING (Moved to Step 8 per user requirement!) */}
        {activeStep === 8 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase text-brand-700 flex items-center">
              <Globe className="w-4 h-4 mr-1.5 text-brand-600" />
              Step 8: UN Sustainable Development Goals (SDG) Mapping *
            </h3>
            <p className="text-xs text-desc">
              <strong>Compulsory Requirement:</strong> Every Course Outcome (CO1 to CO5) MUST be mapped to at least one Sustainable Development Goal and corresponding unit syllabus topic.
            </p>
            <SDGMappingForm
              units={units}
              sdgGoals={sdgGoals}
              sdgMappings={sdgMappings}
              onChange={setSdgMappings}
              disabled={isLocked}
            />
          </div>
        )}

        {/* STEP 9: REVIEW & SUBMIT */}
        {activeStep === 9 && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase text-brand-700">Step 9: Final Review & Submission to HoD</h3>
            <p className="text-xs text-desc">Review your complete syllabus submission below before submitting to the Head of Department.</p>

            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 text-xs space-y-2">
              <p className="font-bold text-slate-900">Submission Checklist Summary:</p>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Objectives: <strong>{objectives.filter((o) => o.trim()).length} Defined</strong></li>
                <li>Syllabus Units: <strong>{units.filter((u) => u.content.trim()).length} / 5 Completed</strong></li>
                <li>Course Outcomes: <strong>{courseOutcomes.filter((c) => (typeof c === 'string' ? c.trim() : c?.description?.trim())).length} / 5 Completed</strong></li>
                <li>Textbooks: <strong>{textbooks.filter((t) => t.title.trim()).length} Entry(ies)</strong></li>
                <li>CO/PO Correlations Mapped: <strong>{correlatedPairs.length} Cells</strong></li>
                <li>SDG Mappings Configured: <strong>{sdgMappings.length} Mapped Topics</strong></li>
              </ul>
            </div>

            {!isLocked && (
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Submitting...' : 'Submit Syllabus to HoD'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom Stepper Nav Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-purple-100">
          <button
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-50 flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous Step
          </button>

          {activeStep < 9 && (
            <button
              onClick={() => setActiveStep((prev) => Math.min(9, prev + 1))}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs flex items-center"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
