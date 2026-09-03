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
  Eye,
  X,
} from 'lucide-react';
import { COPOMappingTable } from './COPOMappingTable';
import { SDGMappingForm, SDGGoalItem, SDGMappingItem } from './SDGMappingForm';
import { TopicBuilder, TopicItem, parseTopicsFromContentString, formatTopicsToContentString } from './TopicBuilder';
import { SyllabusPDFGenerator } from '../pdf/SyllabusPDFGenerator';

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
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [submissionErrorModal, setSubmissionErrorModal] = useState<{ isOpen: boolean; title: string; reasons: string[] }>({
    isOpen: false,
    title: '',
    reasons: [],
  });

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
  const [unitTopics, setUnitTopics] = useState<Record<number, TopicItem[]>>({
    1: [], 2: [], 3: [], 4: [], 5: [],
  });
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
  const [newTb, setNewTb] = useState({ title: '', authors: '', edition: '', publisher: '', year: '' });
  const [references, setReferences] = useState<any[]>([]);
  const [newRef, setNewRef] = useState({ title: '', authors: '', edition: '', publisher: '', year: '', url: '' });
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

  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  // Auto-Save Effect (Debounced 1500ms)
  useEffect(() => {
    if (isLocked) return;
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setAutoSaveStatus('Saving...');
        const draftData = getFormData();
        draftData.isSubmit = false;
        await onSaveDraft(draftData);
        setAutoSaveStatus('All changes auto-saved');
        setTimeout(() => setAutoSaveStatus(''), 2500);
      } catch (err) {
        setAutoSaveStatus('');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    objectives,
    units,
    experiments,
    courseOutcomes,
    textbooks,
    references,
    coPoMappings,
    coPoJustifications,
    sdgMappings,
    unitContactHours,
    labContactHours,
  ]);

  const getStepStatus = (stepId: number): 'COMPLETED' | 'STARTED' | 'NOT_STARTED' => {
    switch (stepId) {
      case 1: {
        const validObjs = objectives.filter((o) => o.trim()).length;
        if (validObjs >= 3) return 'COMPLETED';
        if (validObjs > 0) return 'STARTED';
        return 'NOT_STARTED';
      }
      case 2: {
        if (templateType === 'LAB') {
          const validExps = experiments.filter((e) => e.title && e.title.trim()).length;
          if (validExps >= 10) return 'COMPLETED';
          if (validExps > 0) return 'STARTED';
          return 'NOT_STARTED';
        } else {
          const filledUnits = units.filter((u) => u.content && u.content.trim()).length;
          if (filledUnits >= 5) return 'COMPLETED';
          if (filledUnits > 0) return 'STARTED';
          return 'NOT_STARTED';
        }
      }
      case 3: {
        const validCOs = courseOutcomes.filter((co) =>
          typeof co === 'string' ? co.trim() : co?.description?.trim()
        ).length;
        if (validCOs >= 5) return 'COMPLETED';
        if (validCOs > 0) return 'STARTED';
        return 'NOT_STARTED';
      }
      case 4:
        if (textbooks.filter((t) => t.title && t.title.trim()).length >= 1) return 'COMPLETED';
        return 'NOT_STARTED';
      case 5:
        if (references.filter((r) => r.title && r.title.trim()).length >= 1) return 'COMPLETED';
        return 'NOT_STARTED';
      case 6:
        if (Object.keys(coPoMappings).length > 0) return 'COMPLETED';
        return 'NOT_STARTED';
      case 7:
        if (Object.keys(coPoJustifications).length > 0) return 'COMPLETED';
        return 'NOT_STARTED';
      case 8:
        if (sdgMappings.length > 0) return 'COMPLETED';
        return 'NOT_STARTED';
      case 9:
        return 'NOT_STARTED';
      default:
        return 'NOT_STARTED';
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
    if (templateType === 'LAB' || templateType === 'THEORY_LAB' || templateType === 'LAB_ORIENTED_THEORY') {
      const validExps = experiments.filter((e) => e.title.trim());
      if (validExps.length < 10) {
        missing.push('⚠ Minimum 10 Laboratory Experiments are required for Lab courses.');
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
      setSubmissionErrorModal({
        isOpen: true,
        title: `Validation Error — Step ${validation.firstMissingStep}: ${steps[validation.firstMissingStep - 1].label}`,
        reasons: validation.missing,
      });
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSubmitSyllabus(getFormData());
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      const reasons = err.missing && Array.isArray(err.missing) ? err.missing : [err.message || 'Submission failed. Please check required fields.'];
      if (err.missing && Array.isArray(err.missing)) {
        setMissingChecklist(err.missing);
        const targetStep = determineFirstMissingStep(err.missing);
        setActiveStep(targetStep);
      }
      setShowConfirmModal(false);
      setSubmissionErrorModal({
        isOpen: true,
        title: 'Unable to Submit Syllabus to HoD',
        reasons,
      });
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
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-sm">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Syllabus Submission Locked:</strong> This syllabus has been submitted to the HoD for review. You cannot make edits unless returned for correction.
            </span>
          </div>
          <button
            onClick={() => setShowPdfModal(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs flex items-center shrink-0"
          >
            <Eye className="w-4 h-4 mr-1.5" /> Preview & Download PDF (DRAFT)
          </button>
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
          {autoSaveStatus && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 animate-pulse">
              ✓ {autoSaveStatus}
            </span>
          )}
          {isLocked && (
            <button
              onClick={() => setShowPdfModal(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs flex items-center transition-colors"
            >
              <Eye className="w-4 h-4 mr-1.5" /> Preview PDF (DRAFT)
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Timeline Progress Bar with Section Status Dots */}
      <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Syllabus Formation Progress — Step {activeStep} of {steps.length}: <span className="text-brand-700">{steps[activeStep - 1].label}</span>
            </h3>
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-bold">
            <span className="flex items-center text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1"></span> Completed
            </span>
            <span className="flex items-center text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1"></span> In Progress
            </span>
            <span className="flex items-center text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 mr-1"></span> Not Started
            </span>
          </div>
        </div>

        {/* Horizontal Node Stepper Bar */}
        <div className="overflow-x-auto py-2">
          <div className="flex items-center justify-between min-w-[700px] relative px-4">
            {/* Background Connector Line */}
            <div className="absolute left-6 right-6 top-5 h-1 bg-slate-100 -z-0"></div>

            {steps.map((step) => {
              const status = getStepStatus(step.id);
              const isActive = activeStep === step.id;

              let dotStyle = 'bg-slate-100 border-2 border-slate-300 text-slate-500';
              if (status === 'COMPLETED') {
                dotStyle = 'bg-emerald-600 border-2 border-emerald-600 text-white shadow-xs';
              } else if (status === 'STARTED') {
                dotStyle = 'bg-amber-500 border-2 border-amber-500 text-white ring-4 ring-amber-100';
              }

              if (isActive) {
                dotStyle += ' ring-4 ring-brand-300 scale-110 font-black';
              }

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className="flex flex-col items-center group relative z-10 transition-all"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs transition-all ${dotStyle}`}>
                    {status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold mt-1.5 transition-colors ${isActive ? 'text-brand-700' : 'text-slate-600 group-hover:text-slate-900'}`}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
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
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-700">Unit {unit.unitNumber}</span>
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
                        placeholder={`Unit ${unit.unitNumber} Title (e.g. Differential Calculus)...`}
                        className="w-full px-3 py-2 text-xs border rounded-xl font-bold bg-white"
                      />

                      <TopicBuilder
                        unitNumber={unit.unitNumber}
                        topics={unitTopics[unit.unitNumber] || []}
                        onChange={(newTopics) => {
                          const newMap = { ...unitTopics, [unit.unitNumber]: newTopics };
                          setUnitTopics(newMap);
                          const formattedStr = formatTopicsToContentString(newTopics);
                          const newUnits = [...units];
                          newUnits[unit.unitNumber - 1].content = formattedStr;
                          setUnits(newUnits);
                        }}
                        disabled={isLocked}
                      />
                    </div>
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

        {/* STEP 4: TEXTBOOKS */}
        {activeStep === 4 && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase text-brand-700">Step 4: Textbooks</h3>
                <p className="text-xs text-desc">Enter book details and click "+ Add Textbook" to add to syllabus.</p>
              </div>
            </div>

            {/* Input Form Panel */}
            {!isLocked && (
              <div className="p-5 border rounded-2xl bg-slate-50 space-y-4 shadow-2xs">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Add New Textbook</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newTb.title}
                    onChange={(e) => setNewTb({ ...newTb, title: e.target.value })}
                    placeholder='Book Title (e.g. Data Structures and Algorithm Analysis in C++) *'
                    className="px-3 py-2 text-xs border rounded-xl font-bold bg-white focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    value={newTb.authors}
                    onChange={(e) => setNewTb({ ...newTb, authors: e.target.value })}
                    placeholder='Authors (e.g. Mark Allen Weiss) *'
                    className="px-3 py-2 text-xs border rounded-xl bg-white focus:ring-brand-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newTb.edition}
                    onChange={(e) => setNewTb({ ...newTb, edition: e.target.value })}
                    placeholder="Edition (e.g. 4th Edition)"
                    className="px-3 py-2 text-xs border rounded-xl bg-white focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    value={newTb.publisher}
                    onChange={(e) => setNewTb({ ...newTb, publisher: e.target.value })}
                    placeholder="Publisher (e.g. Pearson)"
                    className="px-3 py-2 text-xs border rounded-xl bg-white focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    value={newTb.year}
                    onChange={(e) => setNewTb({ ...newTb, year: e.target.value })}
                    placeholder="Year (e.g. 2014)"
                    className="px-3 py-2 text-xs border rounded-xl bg-white focus:ring-brand-500"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={!newTb.title.trim()}
                    onClick={() => {
                      if (!newTb.title.trim()) return;
                      setTextbooks([...textbooks, { ...newTb }]);
                      setNewTb({ title: '', authors: '', edition: '', publisher: '', year: '' });
                    }}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Textbook</span>
                  </button>
                </div>
              </div>
            )}

            {/* Added Textbooks List */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                Added Textbooks ({textbooks.length})
              </h4>
              {textbooks.length === 0 ? (
                <div className="p-6 border border-dashed rounded-2xl text-center text-desc text-xs bg-slate-50/50">
                  No textbooks added yet. Fill the details above and click "+ Add Textbook".
                </div>
              ) : (
                textbooks.map((tb, idx) => (
                  <div key={idx} className="p-4 border rounded-2xl bg-white space-y-2 flex items-center justify-between hover:border-purple-200 transition-all shadow-2xs">
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] font-bold text-brand-700 bg-purple-100 px-2 py-0.5 rounded">
                        [{idx + 1}]
                      </span>
                      <p className="text-xs font-bold text-slate-900">"{tb.title}"</p>
                      <p className="text-[11px] text-desc">
                        {tb.authors ? `Authors: ${tb.authors}` : ''} {tb.edition ? `| ${tb.edition}` : ''} {tb.publisher ? `| ${tb.publisher}` : ''} {tb.year ? `(${tb.year})` : ''}
                      </p>
                    </div>

                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => setTextbooks(textbooks.filter((_, i) => i !== idx))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                        title="Remove Textbook"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 5: REFERENCES */}
        {activeStep === 5 && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase text-brand-700">Step 5: Reference Books / Links</h3>
                <p className="text-xs text-desc">Enter reference book or web link details and click "+ Add Reference".</p>
              </div>
            </div>

            {/* Input Form Panel */}
            {!isLocked && (
              <div className="p-5 border rounded-2xl bg-slate-50 space-y-4 shadow-2xs">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Add New Reference</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newRef.title}
                    onChange={(e) => setNewRef({ ...newRef, title: e.target.value })}
                    placeholder='Reference Title (e.g. Advanced Data Structures) *'
                    className="px-3 py-2 text-xs border rounded-xl font-bold bg-white focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    value={newRef.authors}
                    onChange={(e) => setNewRef({ ...newRef, authors: e.target.value })}
                    placeholder='Authors (e.g. Peter Brass)'
                    className="px-3 py-2 text-xs border rounded-xl bg-white focus:ring-brand-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newRef.edition}
                    onChange={(e) => setNewRef({ ...newRef, edition: e.target.value })}
                    placeholder="Edition (e.g. 1st Edition)"
                    className="px-3 py-2 text-xs border rounded-xl bg-white focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    value={newRef.publisher}
                    onChange={(e) => setNewRef({ ...newRef, publisher: e.target.value })}
                    placeholder="Publisher (e.g. Cambridge University Press)"
                    className="px-3 py-2 text-xs border rounded-xl bg-white focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    value={newRef.url}
                    onChange={(e) => setNewRef({ ...newRef, url: e.target.value })}
                    placeholder="Web Link URL (Optional)"
                    className="px-3 py-2 text-xs border rounded-xl bg-white focus:ring-brand-500"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={!newRef.title.trim()}
                    onClick={() => {
                      if (!newRef.title.trim()) return;
                      setReferences([...references, { ...newRef }]);
                      setNewRef({ title: '', authors: '', edition: '', publisher: '', year: '', url: '' });
                    }}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Reference</span>
                  </button>
                </div>
              </div>
            )}

            {/* Added References List */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                Added References ({references.length})
              </h4>
              {references.length === 0 ? (
                <div className="p-6 border border-dashed rounded-2xl text-center text-desc text-xs bg-slate-50/50">
                  No reference books or links added yet. Fill the details above and click "+ Add Reference".
                </div>
              ) : (
                references.map((ref, idx) => (
                  <div key={idx} className="p-4 border rounded-2xl bg-white space-y-2 flex items-center justify-between hover:border-purple-200 transition-all shadow-2xs">
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] font-bold text-brand-700 bg-purple-100 px-2 py-0.5 rounded">
                        [{idx + 1}]
                      </span>
                      <p className="text-xs font-bold text-slate-900">"{ref.title}"</p>
                      <p className="text-[11px] text-desc">
                        {ref.authors ? `Authors: ${ref.authors}` : ''} {ref.publisher ? `| ${ref.publisher}` : ''} {ref.url ? `| Link: ${ref.url}` : ''}
                      </p>
                    </div>

                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => setReferences(references.filter((_, i) => i !== idx))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                        title="Remove Reference"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
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

        {/* STEP 8: SDG MAPPING */}
        {activeStep === 8 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase text-brand-700 flex items-center">
              <Globe className="w-4 h-4 mr-1.5 text-brand-600" />
              Step 8: UN Sustainable Development Goals (SDG) Mapping *
            </h3>
            <p className="text-xs text-desc">
              Map each Course Outcome (CO1 to CO5) to the relevant UN Sustainable Development Goal (SDG) and Unit Syllabus Topic.
            </p>
            <SDGMappingForm
              units={units}
              experiments={experiments}
              sdgGoals={sdgGoals}
              sdgMappings={sdgMappings}
              onChange={setSdgMappings}
              disabled={isLocked}
              isLabCourse={templateType === 'LAB'}
            />
          </div>
        )}

        {/* STEP 9: FINAL REVIEW & SUBMISSION COMMAND CENTER */}
        {activeStep === 9 && (
          <div className="space-y-6 text-xs">
            <div className="border-b pb-3">
              <h3 className="text-sm font-extrabold uppercase text-brand-700">Step 9: Final Review & Submission to HoD</h3>
              <p className="text-xs text-desc">Review your complete syllabus submission summary and verification checklist below before submitting to the Head of Department.</p>
            </div>

            {/* Course Summary Banner */}
            <div className="p-5 rounded-3xl bg-purple-50/60 border border-purple-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-700">Subject Details</p>
                <p className="font-extrabold text-slate-900 mt-0.5">{subject.subjectCode} — {subject.subjectName}</p>
                <p className="text-desc text-[11px]">{subject.subjectType?.name} ({subject.subjectCategory?.code})</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-700">L - T - P - C</p>
                <p className="font-extrabold text-slate-900 mt-0.5">{subject.lecture} - {subject.tutorial} - {subject.practical} - {subject.credits}</p>
                <p className="text-desc text-[11px]">Total: {totalContactHours} Contact Hours</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-700">Semester & Academic Year</p>
                <p className="font-extrabold text-slate-900 mt-0.5">Semester {subject.semester}</p>
                <p className="text-desc text-[11px]">{subject.academicYear?.year || '2026–2027'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-700">Submission Deadline</p>
                <p className="font-extrabold text-slate-900 mt-0.5">
                  {subject.facultyDeadline ? new Date(subject.facultyDeadline).toLocaleDateString() : 'As Scheduled'}
                </p>
                <p className="text-desc text-[11px]">Assigned Faculty: {subject.assignedFaculty?.name}</p>
              </div>
            </div>

            {/* Section Summary Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Section 1: Objectives & COs */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>1. Objectives & Course Outcomes</span>
                  </h4>
                  <button onClick={() => setActiveStep(1)} className="text-[11px] font-bold text-brand-600 hover:underline">
                    Edit →
                  </button>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <p>Course Objectives: <strong className="text-slate-900">{objectives.filter((o) => o.trim()).length} / 5 Defined</strong></p>
                  <p>Course Outcomes: <strong className="text-slate-900">{courseOutcomes.filter((c) => (typeof c === 'string' ? c.trim() : c?.description?.trim())).length} / 5 Mandatory COs</strong></p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {courseOutcomes.map((co, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-purple-100 text-brand-800 text-[10px] font-bold">
                        CO{idx + 1} ({typeof co === 'object' && co?.cognitiveLevel ? co.cognitiveLevel : 'K3'})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2: Syllabus Units & Experiments */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-brand-600" />
                    <span>2. Syllabus Units & Practical</span>
                  </h4>
                  <button onClick={() => setActiveStep(2)} className="text-[11px] font-bold text-brand-600 hover:underline">
                    Edit →
                  </button>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <p>Syllabus Units: <strong className="text-slate-900">{units.filter((u) => u.content.trim()).length} / 5 Completed</strong></p>
                  {experiments.filter((e) => e.title.trim()).length > 0 && (
                    <p>Laboratory Experiments: <strong className="text-slate-900">{experiments.filter((e) => e.title.trim()).length} Experiments Listed</strong></p>
                  )}
                  <p className="text-desc text-[10px]">Topic Builder used for clean structured layout (no manual hyphens).</p>
                </div>
              </div>

              {/* Section 3: Textbooks & References */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>3. Textbooks & References</span>
                  </h4>
                  <button onClick={() => setActiveStep(4)} className="text-[11px] font-bold text-brand-600 hover:underline">
                    Edit →
                  </button>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <p>Textbooks Added: <strong className="text-slate-900">{textbooks.length} Books</strong></p>
                  <p>References Added: <strong className="text-slate-900">{references.length} References/Links</strong></p>
                  {textbooks.length > 0 && (
                    <p className="text-desc text-[10px] truncate">1st Book: "{textbooks[0].title}"</p>
                  )}
                </div>
              </div>

              {/* Section 4: Mappings & SDG Goals */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>4. CO/PO Mapping & SDG Goals</span>
                  </h4>
                  <button onClick={() => setActiveStep(8)} className="text-[11px] font-bold text-brand-600 hover:underline">
                    Edit →
                  </button>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <p>CO/PO Mapping Cells: <strong className="text-slate-900">{correlatedPairs.length} Correlated Cells</strong></p>
                  <p>SDG Mappings Configured: <strong className="text-slate-900">{sdgMappings.length} Goal Mappings</strong></p>
                  <p className="text-desc text-[10px]">All CO1..CO5 mapped to unit syllabus topics and UN SDGs.</p>
                </div>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider">
                Submission Readiness Verification Checklist
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>3 to 5 Course Objectives defined</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All 5 Syllabus Units completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>5 Course Outcomes with Bloom's Cognitive Levels</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Textbooks & References configured</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>CO/PO Matrix & Justifications written</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>SDG Goal Topic mappings complete</span>
                </div>
              </div>
            </div>

            {/* Submit Action Button */}
            {!isLocked && (
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-desc text-xs">
                  Once submitted, syllabus will be locked for HoD review.
                </span>
                <button
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center space-x-2 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Submitting Syllabus...' : 'Submit Syllabus to Head of Department'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* PDF Preview Modal for Faculty when locked/submitted */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Syllabus PDF Preview (DRAFT Watermark)</h3>
                <p className="text-xs text-desc">{subject.subjectCode} — {subject.subjectName}</p>
              </div>
              <button onClick={() => setShowPdfModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <SyllabusPDFGenerator
              subject={subject}
              submission={{
                ...getFormData(),
                totalContactHours,
              }}
              documentTitle={`Syllabus_${subject.subjectCode}_Draft`}
              hideJustifications={false}
            />
          </div>
        </div>
      )}

      {/* Submission Error / Missing Validation Pop-up Modal */}
      {submissionErrorModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border-2 border-red-300">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="w-7 h-7 shrink-0 text-red-600" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {submissionErrorModal.title || 'Unable to Submit Syllabus'}
                </h3>
                <p className="text-xs text-desc">Syllabus validation failed</p>
              </div>
            </div>

            <p className="text-xs text-slate-700">
              The system could not submit your syllabus to the HoD because the following required items are incomplete:
            </p>

            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-900 space-y-2 max-h-52 overflow-y-auto">
              {submissionErrorModal.reasons.map((reason, idx) => (
                <p key={idx} className="font-semibold flex items-start">
                  <span className="mr-2 text-red-600 font-bold">•</span>
                  <span>{reason}</span>
                </p>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSubmissionErrorModal({ isOpen: false, title: '', reasons: [] })}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Got It, Let Me Fix This
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
