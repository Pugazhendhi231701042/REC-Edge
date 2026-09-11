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
  FileCheck,
  Download,
  Pencil,
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
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeUnitTab, setActiveUnitTab] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [missingChecklist, setMissingChecklist] = useState<string[]>([]);
  const [submissionErrorModal, setSubmissionErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    reasons: string[];
  }>({
    isOpen: false,
    title: '',
    reasons: [],
  });

  const existingSub = subject.submission || (subject.syllabusSubmissions && subject.syllabusSubmissions[0]);
  const templateType = subject.subjectType?.templateType || 'THEORY';
  const currentSyllabusStatus = subject.syllabusStatus;

  // Lock status check: Faculty cannot edit if submitted, resubmitted, or approved
  const isLocked = ['SUBMITTED', 'RESUBMITTED', 'SUBMITTED_TO_HOD', 'HOD_REVIEW', 'HOD_APPROVED', 'APPROVED'].includes(currentSyllabusStatus);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [objectives, setObjectives] = useState<string[]>(['', '', '']);
  const [units, setUnits] = useState<any[]>([
    { unitNumber: 1, unitName: '', content: '' },
    { unitNumber: 2, unitName: '', content: '' },
    { unitNumber: 3, unitName: '', content: '' },
    { unitNumber: 4, unitName: '', content: '' },
    { unitNumber: 5, unitName: '', content: '' },
  ]);
  const [unitTopics, setUnitTopics] = useState<Record<number, TopicItem[]>>({
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
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
    { description: '', cognitiveLevel: '' },
    { description: '', cognitiveLevel: '' },
    { description: '', cognitiveLevel: '' },
    { description: '', cognitiveLevel: '' },
    { description: '', cognitiveLevel: '' },
  ]);
  const [textbooks, setTextbooks] = useState<any[]>([]);
  const [newTb, setNewTb] = useState({ title: '', authors: '', edition: '', publisher: '', year: '' });
  const [editingTbIdx, setEditingTbIdx] = useState<number | null>(null);
  const [editTb, setEditTb] = useState({ title: '', authors: '', edition: '', publisher: '', year: '' });

  const [references, setReferences] = useState<any[]>([]);
  const [newRef, setNewRef] = useState({ title: '', authors: '', edition: '', publisher: '', year: '', url: '' });
  const [editingRefIdx, setEditingRefIdx] = useState<number | null>(null);
  const [editRef, setEditRef] = useState({ title: '', authors: '', edition: '', publisher: '', year: '', url: '' });

  const [coPoMappings, setCoPoMappings] = useState<Record<string, number>>({});
  const [coPoJustifications, setCoPoJustifications] = useState<Record<string, string>>({});
  const [activeJustificationCO, setActiveJustificationCO] = useState<number>(1);
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
      if (existingSub.objectives?.length > 0) {
        setObjectives(existingSub.objectives.map((o: any) => o.description));
      }

      if (existingSub.syllabusUnits?.length > 0) {
        const loadedUnits: any[] = [];
        const loadedTopicsMap: Record<number, TopicItem[]> = {};

        existingSub.syllabusUnits.forEach((u: any) => {
          loadedUnits.push({
            unitNumber: u.unitNumber,
            unitName: u.unitName || '',
            content: u.content || '',
          });
          loadedTopicsMap[u.unitNumber] = parseTopicsFromContentString(u.content || '');
        });

        for (let i = 1; i <= 5; i++) {
          if (!loadedUnits.some((u) => u.unitNumber === i)) {
            loadedUnits.push({ unitNumber: i, unitName: '', content: '' });
          }
          if (!loadedTopicsMap[i]) {
            loadedTopicsMap[i] = [];
          }
        }

        loadedUnits.sort((a, b) => a.unitNumber - b.unitNumber);
        setUnits(loadedUnits);
        setUnitTopics(loadedTopicsMap);
      }

      if (existingSub.experiments?.length > 0) {
        let loadedExps = existingSub.experiments.map((e: any, idx: number) => ({
          experimentNumber: e.experimentNumber || idx + 1,
          title: e.title || '',
        }));

        if (templateType === 'LAB' || templateType === 'PROJECT') {
          while (loadedExps.length < 10) {
            loadedExps.push({ experimentNumber: loadedExps.length + 1, title: '' });
          }
        } else if (templateType === 'LAB_ORIENTED_THEORY' || templateType === 'PROJECT_ORIENTED_THEORY') {
          while (loadedExps.length < 7) {
            loadedExps.push({ experimentNumber: loadedExps.length + 1, title: '' });
          }
        }
        setExperiments(loadedExps);
      } else {
        if (templateType === 'LAB' || templateType === 'PROJECT') {
          setExperiments(Array.from({ length: 10 }, (_, i) => ({ experimentNumber: i + 1, title: '' })));
        } else if (templateType === 'LAB_ORIENTED_THEORY' || templateType === 'PROJECT_ORIENTED_THEORY') {
          setExperiments(Array.from({ length: 7 }, (_, i) => ({ experimentNumber: i + 1, title: '' })));
        }
      }

      if (existingSub.courseOutcomes?.length > 0) {
        const coList = [
          { description: '', cognitiveLevel: '' },
          { description: '', cognitiveLevel: '' },
          { description: '', cognitiveLevel: '' },
          { description: '', cognitiveLevel: '' },
          { description: '', cognitiveLevel: '' },
        ];
        existingSub.courseOutcomes.forEach((co: any) => {
          if (co.coNumber >= 1 && co.coNumber <= 5) {
            coList[co.coNumber - 1] = {
              description: co.description || '',
              cognitiveLevel: co.cognitiveLevel || '',
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
    setIsDataLoaded(true);
  }, [existingSub]);

  // Derived Contact Hours Calculations: Total Contact Hours = 15 * Credits
  const subjectCredits = subject?.credits ? Number(subject.credits) : 3;
  const totalContactHours = subjectCredits > 0 ? Math.round(subjectCredits * 15) : 45;
  const unitContactHours = Math.round(totalContactHours / 5);
  const theoryContactHours = totalContactHours;
  const labContactHours = totalContactHours;

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
    objectives: objectives.filter((o) => o && typeof o === 'string' && o.trim()),
    units: units.map((u) => {
      const topics = unitTopics[u.unitNumber];
      let finalContent = u.content || '';
      if (topics && topics.length > 0) {
        const formatted = formatTopicsToContentString(topics);
        if (formatted.trim()) finalContent = formatted;
      }
      return {
        ...u,
        content: finalContent,
      };
    }),
    experiments: experiments.filter((e) => e && e.title && typeof e.title === 'string' && e.title.trim()),
    courseOutcomes: courseOutcomes.map((co, idx) => ({
      coNumber: idx + 1,
      cognitiveLevel: co.cognitiveLevel || '',
      description: typeof co === 'string' ? co : (co.description || ''),
    })),
    textbooks: textbooks.filter((t) => t && t.title && typeof t.title === 'string' && t.title.trim()),
    references: references.filter((r) => r && r.title && typeof r.title === 'string' && r.title.trim()),
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
  const isFirstRun = React.useRef(true);

  // Auto-Save Effect (Debounced 1500ms)
  useEffect(() => {
    if (isLocked || !isDataLoaded) return;
    if (isFirstRun.current) {
      isFirstRun.current = false;
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
    isDataLoaded,
  ]);

  const getStepStatus = (stepId: number): 'COMPLETED' | 'STARTED' | 'NOT_STARTED' => {
    switch (stepId) {
      case 1: {
        const validObjs = objectives.filter((o) => o && typeof o === 'string' && o.trim()).length;
        if (validObjs >= 3) return 'COMPLETED';
        if (validObjs > 0) return 'STARTED';
        return 'NOT_STARTED';
      }
      case 2: {
        if (templateType === 'LAB' || templateType === 'PROJECT') {
          const validExps = experiments.filter((e) => e && e.title && typeof e.title === 'string' && e.title.trim()).length;
          if (validExps >= 10) return 'COMPLETED';
          if (validExps > 0) return 'STARTED';
          return 'NOT_STARTED';
        } else {
          const filledUnits = units.filter((u) => u && u.content && typeof u.content === 'string' && u.content.trim()).length;
          if (filledUnits >= 5) return 'COMPLETED';
          if (filledUnits > 0) return 'STARTED';
          return 'NOT_STARTED';
        }
      }
      case 3: {
        const validCOs = courseOutcomes.filter((co) =>
          co && (typeof co === 'string' ? co.trim() : (typeof co?.description === 'string' ? co.description.trim() : ''))
        ).length;
        if (validCOs >= 5) return 'COMPLETED';
        if (validCOs > 0) return 'STARTED';
        return 'NOT_STARTED';
      }
      case 4:
        if (textbooks.filter((t) => t && t.title && typeof t.title === 'string' && t.title.trim()).length >= 1) return 'COMPLETED';
        return 'NOT_STARTED';
      case 5:
        if (references.filter((r) => r && r.title && typeof r.title === 'string' && r.title.trim()).length >= 1) return 'COMPLETED';
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
    const validObjectives = objectives.filter((o) => o && typeof o === 'string' && o.trim());
    if (validObjectives.length < 3 || validObjectives.length > 5) {
      missing.push('⚠ Course Objectives must have between 3 and 5 non-empty entries.');
      if (firstMissingStep > 1) firstMissingStep = 1;
    }

    // Step 2: Units / Experiments
    if (templateType === 'THEORY' || templateType === 'LAB_ORIENTED_THEORY' || templateType === 'PROJECT_ORIENTED_THEORY') {
      const incompleteUnits = units.filter((u) => !u || !u.unitName || typeof u.unitName !== 'string' || !u.unitName.trim() || !u.content || typeof u.content !== 'string' || !u.content.trim());
      if (incompleteUnits.length > 0) {
        missing.push('⚠ All 5 Syllabus Units must have non-empty titles and topic descriptions.');
        if (firstMissingStep > 2) firstMissingStep = 2;
      }
    }
    if (templateType === 'LAB' || templateType === 'PROJECT') {
      const validExps = experiments.filter((e) => e && e.title && typeof e.title === 'string' && e.title.trim());
      if (validExps.length < 10) {
        missing.push('⚠ Exactly 10 Laboratory Experiments are required for Lab/Project courses.');
        if (firstMissingStep > 2) firstMissingStep = 2;
      }
    } else if (templateType === 'LAB_ORIENTED_THEORY' || templateType === 'PROJECT_ORIENTED_THEORY') {
      const validExps = experiments.filter((e) => e && e.title && typeof e.title === 'string' && e.title.trim());
      if (validExps.length < 7) {
        missing.push('⚠ Minimum 7 Laboratory Experiments are required for Lab-Oriented Theory courses.');
        if (firstMissingStep > 2) firstMissingStep = 2;
      }
    }

    // Step 3: Course Outcomes (5 mandatory COs & Cognitive Levels)
    const validCOs = courseOutcomes.filter((co) =>
      co && (typeof co === 'string' ? co.trim() : (typeof co?.description === 'string' ? co.description.trim() : ''))
    );
    if (validCOs.length < 5) {
      missing.push('⚠ Exactly 5 Course Outcomes (CO1..CO5) are mandatory with descriptions.');
      if (firstMissingStep > 3) firstMissingStep = 3;
    }
    const unselectedCogLevels = courseOutcomes.filter((co) => !co?.cognitiveLevel || !co.cognitiveLevel.trim());
    if (unselectedCogLevels.length > 0) {
      missing.push('⚠ Please select a Cognitive Level (K1-K6) for all 5 Course Outcomes.');
      if (firstMissingStep > 3) firstMissingStep = 3;
    }

    // Step 4: Textbooks (Not mandatory for LAB or PROJECT courses)
    if (templateType !== 'LAB' && templateType !== 'PROJECT') {
      const validTextbooks = textbooks.filter((t) => t.title.trim());
      if (validTextbooks.length === 0) {
        missing.push('⚠ At least 1 Textbook entry (Title & Authors) is mandatory.');
        if (firstMissingStep > 4) firstMissingStep = 4;
      }
    }

    // Step 6: CO/PO Mapping
    const mappedCount = Object.values(coPoMappings).filter((v) => v > 0).length;
    if (mappedCount === 0) {
      missing.push('⚠ At least one non-zero correlation must be mapped in the CO/PO Mapping Table.');
      if (firstMissingStep > 6) firstMissingStep = 6;
    }

    // Step 8: SDG Mapping
    if (templateType === 'LAB') {
      if (sdgMappings.length === 0) {
        missing.push('⚠ At least 1 SDG Goal experiment mapping is required.');
        if (firstMissingStep > 8) firstMissingStep = 8;
      }
    } else {
      for (let coNum = 1; coNum <= 5; coNum++) {
        const coSDGs = sdgMappings.filter((m) => Number(m.coNumber) === coNum);
        if (coSDGs.length === 0) {
          missing.push(`⚠ CO${coNum} — Please select at least one SDG and topic.`);
          if (firstMissingStep > 8) firstMissingStep = 8;
        }
      }
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

    const validation = validateFormBeforeSubmit();
    if (!validation.valid) {
      setMissingChecklist(validation.missing);
      setActiveStep(validation.firstMissingStep);
      setError(`Validation Error: Please complete missing required fields on Step ${validation.firstMissingStep}: ${steps[validation.firstMissingStep - 1].label}.`);
      setSubmissionErrorModal({
        isOpen: true,
        title: `Unable to Submit Syllabus — Missing Requirements`,
        reasons: validation.missing,
      });
      return;
    }

    if (!confirm('Are you sure you want to submit this syllabus to the Head of Department (HoD) for review?')) {
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

  const handleFillTemplateData = () => {
    if (isLocked) return;

    const sampleUnits = [
      { unitNumber: 1, unitName: 'Linear Data Structures & Stacks', content: 'Abstract Data Types (ADTs) — Array Implementation — Singly Linked Lists — Doubly Linked Lists — Circular Linked Lists — Applications of Linked Lists — Stack ADT — Array and Linked List Implementation of Stacks — Infix to Postfix Conversion — Postfix Expression Evaluation — Recursion Stack Analysis.' },
      { unitNumber: 2, unitName: 'Queues & Deques', content: 'Queue ADT — Array and Linked List Implementation of Queues — Circular Queue — Priority Queue — Double-Ended Queue (Deque) — Applications of Queues in Operating System Scheduling — Breadth-First Search (BFS) Buffer Queue Management.' },
      { unitNumber: 3, unitName: 'Non-Linear Structures: Trees & Heaps', content: 'Tree Terminologies — Binary Tree Representation and Traversals (Preorder, Inorder, Postorder) — Expression Trees — Binary Search Trees (BST) Insertion, Deletion, Searching — AVL Balanced Trees — Rotations — Priority Queues and Binary Heaps — Max Heap and Min Heap Construction — Heap Sort.' },
      { unitNumber: 4, unitName: 'Graph Algorithms & Shortest Paths', content: 'Graph Representation: Adjacency Matrix and Adjacency List — Graph Traversals: Depth First Search (DFS) and Breadth First Search (BFS) — Minimum Spanning Trees: Prim’s Algorithm and Kruskal’s Algorithm — Shortest Path Algorithms: Dijkstra’s Algorithm and Floyd-Warshall Algorithm — Topological Sorting.' },
      { unitNumber: 5, unitName: 'Hashing, Searching & Sorting Techniques', content: 'Hashing Concepts — Hash Functions — Hash Collision Resolution Techniques: Separate Chaining, Open Addressing (Linear Probing, Quadratic Probing, Double Hashing) — Rehashing — Searching: Linear Search, Binary Search — Sorting: Bubble Sort, Insertion Sort, Quick Sort, Merge Sort — Analysis of Sorting Complexities.' }
    ];

    setObjectives([
      'To understand fundamental algorithmic concepts, data structure representations, and time/space complexity analysis.',
      'To implement and manipulate linear data structures including stacks, queues, and linked lists in software applications.',
      'To master non-linear data structures such as trees, heaps, and graph algorithms for complex data modeling.',
      'To evaluate searching, sorting, and hashing techniques for optimizing algorithmic performance in real-world systems.'
    ]);

    setUnits(sampleUnits);

    const loadedTopicsMap: Record<number, TopicItem[]> = {};
    sampleUnits.forEach((u) => {
      loadedTopicsMap[u.unitNumber] = parseTopicsFromContentString(u.content);
    });
    setUnitTopics(loadedTopicsMap);

    setExperiments([
      { experimentNumber: 1, title: 'Array implementation of Stack and Queue ADTs' },
      { experimentNumber: 2, title: 'Implementation of Singly and Doubly Linked Lists' },
      { experimentNumber: 3, title: 'Evaluation of Postfix expressions using Stack' },
      { experimentNumber: 4, title: 'Circular Queue implementation using Array' },
      { experimentNumber: 5, title: 'Binary Search Tree operations: Insertion, Deletion, and Traversals' },
      { experimentNumber: 6, title: 'Implementation of AVL Tree rotations and balancing' },
      { experimentNumber: 7, title: 'Implementation of Priority Queue using Binary Heap' },
      { experimentNumber: 8, title: 'Graph Traversals using Breadth First Search (BFS) and Depth First Search (DFS)' },
      { experimentNumber: 9, title: 'Minimum Spanning Tree construction using Prim’s Algorithm' },
      { experimentNumber: 10, title: 'Implementation of Open Addressing Hashing with collision handling' }
    ]);

    setCourseOutcomes([
      { description: 'Understand and apply linear data structures to solve computational problems.', cognitiveLevel: 'K2' },
      { description: 'Design and implement stack and queue data structures for real-time applications.', cognitiveLevel: 'K3' },
      { description: 'Construct and manipulate non-linear tree structures and binary search trees.', cognitiveLevel: 'K4' },
      { description: 'Analyze graph traversal techniques and compute optimal shortest paths.', cognitiveLevel: 'K4' },
      { description: 'Evaluate hashing and sorting techniques for efficient data retrieval.', cognitiveLevel: 'K5' }
    ]);

    setTextbooks([
      { title: 'Data Structures and Algorithm Analysis in C', authors: 'Mark Allen Weiss', edition: '2nd Edition', publisher: 'Pearson Education', year: '2016' },
      { title: 'Fundamentals of Data Structures in C', authors: 'Ellis Horowitz, Sartaj Sahni, Susan Anderson-Freed', edition: '2nd Edition', publisher: 'Universities Press', year: '2018' }
    ]);

    setReferences([
      { title: 'Introduction to Algorithms', authors: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', edition: '3rd Edition', publisher: 'MIT Press / PHI', year: '2015', url: 'https://mitpress.mit.edu/books/introduction-algorithms' },
      { title: 'Data Structures and Algorithms', authors: 'Alfred V. Aho, John E. Hopcroft, Jeffrey D. Ullman', edition: '1st Edition', publisher: 'Pearson Education', year: '2014', url: 'https://pearson.com' }
    ]);

    const mapObj: Record<string, number> = {};
    for (let c = 1; c <= 5; c++) {
      for (let p = 1; p <= 12; p++) {
        const key = `${c}_PO${p}`;
        mapObj[key] = (c + p) % 3 === 0 ? 3 : (c + p) % 2 === 0 ? 2 : 1;
      }
      for (let s = 1; s <= 3; s++) {
        const key = `${c}_PSO${s}`;
        mapObj[key] = s === 1 ? 3 : 2;
      }
    }
    setCoPoMappings(mapObj);

    const justObj: Record<string, string> = {};
    Object.entries(mapObj).forEach(([k, val]) => {
      const [c, p] = k.split('_');
      justObj[k] = `CO${c} strongly aligns with ${p} by applying structured algorithmic logic and engineering principles.`;
    });
    setCoPoJustifications(justObj);

    setSdgMappings([
      { coNumber: 1, sdgNumber: 4, topic: 'Fundamental algorithmic thinking promotes quality technical education.' },
      { coNumber: 2, sdgNumber: 9, topic: 'Data structure optimization supports scalable industry software infrastructure.' },
      { coNumber: 3, sdgNumber: 9, topic: 'Efficient tree algorithms enable complex computational innovation.' },
      { coNumber: 4, sdgNumber: 9, topic: 'Graph optimization algorithms enhance network routing efficiency.' },
      { coNumber: 5, sdgNumber: 4, topic: 'Advanced searching and sorting skills empower lifelong learning.' }
    ]);

    setAutoSaveStatus('Template data auto-filled!');
    setTimeout(() => setAutoSaveStatus(''), 3000);
  };

  const applyCoursePreset = (courseType: 'DS' | 'OS' | 'DBMS' | 'CN' | 'SE') => {
    let title = 'Data Structures';
    let objs: string[] = [];
    let courseUnits: any[] = [];
    let exps: any[] = [];
    let cos: any[] = [];
    let tbs: any[] = [];
    let refs: any[] = [];

    if (courseType === 'DS') {
      title = 'Data Structures';
      objs = [
        'To understand fundamental algorithmic concepts, data structure representations, and time/space complexity analysis.',
        'To implement and manipulate linear data structures including stacks, queues, and linked lists in software applications.',
        'To master non-linear data structures such as trees, heaps, and graph algorithms for complex data modeling.',
        'To evaluate searching, sorting, and hashing techniques for optimizing algorithmic performance in real-world systems.'
      ];
      courseUnits = [
        { unitNumber: 1, unitName: 'Linear Data Structures & Stacks', content: 'Abstract Data Types (ADTs) — Array Implementation — Singly Linked Lists — Doubly Linked Lists — Circular Linked Lists — Applications of Linked Lists — Stack ADT — Array and Linked List Implementation of Stacks — Infix to Postfix Conversion — Postfix Expression Evaluation — Recursion Stack Analysis.' },
        { unitNumber: 2, unitName: 'Queues & Deques', content: 'Queue ADT — Array and Linked List Implementation of Queues — Circular Queue — Priority Queue — Double-Ended Queue (Deque) — Applications of Queues in Operating System Scheduling — Breadth-First Search (BFS) Buffer Queue Management.' },
        { unitNumber: 3, unitName: 'Non-Linear Structures: Trees & Heaps', content: 'Tree Terminologies — Binary Tree Representation and Traversals (Preorder, Inorder, Postorder) — Expression Trees — Binary Search Trees (BST) Insertion, Deletion, Searching — AVL Balanced Trees — Rotations — Priority Queues and Binary Heaps — Max Heap and Min Heap Construction — Heap Sort.' },
        { unitNumber: 4, unitName: 'Graph Algorithms & Shortest Paths', content: 'Graph Representation: Adjacency Matrix and Adjacency List — Graph Traversals: Depth First Search (DFS) and Breadth First Search (BFS) — Minimum Spanning Trees: Prim’s Algorithm and Kruskal’s Algorithm — Shortest Path Algorithms: Dijkstra’s Algorithm and Floyd-Warshall Algorithm — Topological Sorting.' },
        { unitNumber: 5, unitName: 'Hashing, Searching & Sorting Techniques', content: 'Hashing Concepts — Hash Functions — Hash Collision Resolution Techniques: Separate Chaining, Open Addressing (Linear Probing, Quadratic Probing, Double Hashing) — Rehashing — Searching: Linear Search, Binary Search — Sorting: Bubble Sort, Insertion Sort, Quick Sort, Merge Sort — Analysis of Sorting Complexities.' }
      ];
      exps = [
        { experimentNumber: 1, title: 'Array implementation of Stack and Queue ADTs' },
        { experimentNumber: 2, title: 'Implementation of Singly and Doubly Linked Lists' },
        { experimentNumber: 3, title: 'Evaluation of Postfix expressions using Stack' },
        { experimentNumber: 4, title: 'Circular Queue implementation using Array' },
        { experimentNumber: 5, title: 'Binary Search Tree operations: Insertion, Deletion, and Traversals' },
        { experimentNumber: 6, title: 'Implementation of AVL Tree rotations and balancing' },
        { experimentNumber: 7, title: 'Implementation of Priority Queue using Binary Heap' },
        { experimentNumber: 8, title: 'Graph Traversals using Breadth First Search (BFS) and Depth First Search (DFS)' },
        { experimentNumber: 9, title: 'Minimum Spanning Tree construction using Prim’s Algorithm' },
        { experimentNumber: 10, title: 'Implementation of Open Addressing Hashing with collision handling' }
      ];
      cos = [
        { description: 'Understand and apply linear data structures to solve computational problems.', cognitiveLevel: 'K2' },
        { description: 'Design and implement stack and queue data structures for real-time applications.', cognitiveLevel: 'K3' },
        { description: 'Construct and manipulate non-linear tree structures and binary search trees.', cognitiveLevel: 'K4' },
        { description: 'Analyze graph traversal techniques and compute optimal shortest paths.', cognitiveLevel: 'K4' },
        { description: 'Evaluate hashing and sorting techniques for efficient data retrieval.', cognitiveLevel: 'K5' }
      ];
      tbs = [
        { title: 'Data Structures and Algorithm Analysis in C', authors: 'Mark Allen Weiss', edition: '2nd Edition', publisher: 'Pearson Education', year: '2016' },
        { title: 'Fundamentals of Data Structures in C', authors: 'Ellis Horowitz, Sartaj Sahni, Susan Anderson-Freed', edition: '2nd Edition', publisher: 'Universities Press', year: '2018' }
      ];
      refs = [
        { title: 'Introduction to Algorithms', authors: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', edition: '3rd Edition', publisher: 'MIT Press / PHI', year: '2015', url: 'https://mitpress.mit.edu/books/introduction-algorithms' }
      ];
    } else if (courseType === 'OS') {
      title = 'Operating Systems';
      objs = [
        'To understand operating system architecture, process management, and CPU scheduling algorithms.',
        'To analyze process synchronization mechanisms, semaphores, and deadlock prevention strategies.',
        'To comprehend memory management schemes including paging, segmentation, and virtual memory.',
        'To evaluate storage management, file system structures, and disk scheduling algorithms.'
      ];
      courseUnits = [
        { unitNumber: 1, unitName: 'OS Architecture & Process Management', content: 'Operating System Structure — System Calls — Kernel Architecture — Process Concept — Process State Transitions — Process Control Block (PCB) — Context Switching — Process Creation and Termination — Inter-Process Communication (IPC) — Direct and Indirect Communication.' },
        { unitNumber: 2, unitName: 'CPU Scheduling & Process Synchronization', content: 'Basic CPU Scheduling Concepts — Scheduling Criteria — Scheduling Algorithms: FCFS, SJF, Priority, Round Robin, Multilevel Queue — Critical Section Problem — Hardware Synchronization — Semaphores — Classic Synchronization Problems: Producer-Consumer, Dining Philosophers — Monitors — Deadlock Characterization — Deadlock Handling.' },
        { unitNumber: 3, unitName: 'Memory Management & Virtual Memory', content: 'Swapping — Contiguous Memory Allocation — Paging Architecture — Structure of Page Table — Segmentation — Virtual Memory Demand Paging — Page Replacement Algorithms: FIFO, Optimal, LRU, LFU — Allocation of Frames — Thrashing Analysis.' },
        { unitNumber: 4, unitName: 'Storage & File System Interface', content: 'File Concept — Access Methods — Directory Structure — File System Mounting — File Sharing and Protection — Directory Implementation — Allocation Methods: Contiguous, Linked, Indexed — Free Space Management — Disk Structure — Disk Scheduling: FCFS, SSTF, SCAN, C-SCAN.' },
        { unitNumber: 5, unitName: 'I/O Systems & Case Studies', content: 'I/O Hardware Principles — Application I/O Interface — Kernel I/O Subsystem — Transforming I/O Requests to Hardware Operations — Protection and Security Principles — User Authentication — Case Studies: Linux System Architecture and Windows OS Architecture.' }
      ];
      exps = [
        { experimentNumber: 1, title: 'Implementation of CPU Scheduling Algorithms (FCFS, SJF, Round Robin)' },
        { experimentNumber: 2, title: 'Implementation of Producer-Consumer Problem using Semaphores' },
        { experimentNumber: 3, title: 'Implementation of Banker’s Algorithm for Deadlock Avoidance' },
        { experimentNumber: 4, title: 'Implementation of Page Replacement Algorithms (FIFO, LRU, Optimal)' },
        { experimentNumber: 5, title: 'Implementation of Disk Scheduling Algorithms (FCFS, SSTF, SCAN)' },
        { experimentNumber: 6, title: 'Inter-Process Communication using Pipes and Shared Memory' },
        { experimentNumber: 7, title: 'Implementation of Memory Allocation Strategies (First Fit, Best Fit, Worst Fit)' },
        { experimentNumber: 8, title: 'File Allocation Strategies Simulation' },
        { experimentNumber: 9, title: 'Implementation of Multithreading using Pthreads' },
        { experimentNumber: 10, title: 'Shell Scripting and System Call programming in Linux' }
      ];
      cos = [
        { description: 'Demonstrate fundamental concepts of operating systems and process management.', cognitiveLevel: 'K2' },
        { description: 'Apply CPU scheduling algorithms and process synchronization mechanisms.', cognitiveLevel: 'K3' },
        { description: 'Analyze memory management techniques and virtual memory page replacement algorithms.', cognitiveLevel: 'K4' },
        { description: 'Evaluate file system structures, allocation methods, and disk scheduling.', cognitiveLevel: 'K4' },
        { description: 'Design kernel I/O subsystem modules and examine security protection models.', cognitiveLevel: 'K5' }
      ];
      tbs = [
        { title: 'Operating System Concepts', authors: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne', edition: '10th Edition', publisher: 'John Wiley & Sons', year: '2018' }
      ];
      refs = [
        { title: 'Modern Operating Systems', authors: 'Andrew S. Tanenbaum, Herbert Bos', edition: '4th Edition', publisher: 'Pearson Education', year: '2015', url: 'https://pearson.com' }
      ];
    } else if (courseType === 'DBMS') {
      title = 'Database Management Systems';
      objs = [
        'To understand database architecture, relational models, and Entity-Relationship (ER) diagram design.',
        'To write efficient SQL queries, view definitions, constraints, and relational algebra expressions.',
        'To apply relational database design principles and normalization techniques up to BCNF.',
        'To comprehend transaction processing, ACID properties, concurrency control, and query optimization.'
      ];
      courseUnits = [
        { unitNumber: 1, unitName: 'Database Architecture & ER Modeling', content: 'Purpose of Database Systems — View of Data — Database Architecture — Data Models — Entity Relationship (ER) Model — Entities, Attributes, Relationships — ER Diagram Design Rules — Extended ER Features — Specialization, Generalization, Aggregation — Conversion of ER to Relational Schema.' },
        { unitNumber: 2, unitName: 'Relational Model & Structured Query Language (SQL)', content: 'Relational Algebra Operators — Selection, Projection, Join, Division — SQL Data Definition Language (DDL) — SQL Data Manipulation Language (DML) — Complex Subqueries — Aggregate Functions — Group By & Having — Views — Triggers and Stored Procedures — Integrity Constraints.' },
        { unitNumber: 3, unitName: 'Database Design & Normalization', content: 'Functional Dependencies — Axioms of Functional Dependencies — Closure of Attribute Sets — Canonical Cover — Normalization Pitfalls — First Normal Form (1NF) — Second Normal Form (2NF) — Third Normal Form (3NF) — Boyce-Codd Normal Form (BCNF) — Multivalued Dependencies and 4NF.' },
        { unitNumber: 4, unitName: 'Transaction Management & Concurrency Control', content: 'Transaction Concept — ACID Properties — Transaction State Diagram — Concurrent Executions — Serializability — Conflict and View Serializability — Recoverable Schedules — Lock-Based Protocols — Two-Phase Locking (2PL) — Deadlock Handling — Timestamp-Based Protocols.' },
        { unitNumber: 5, unitName: 'Indexing, Hashing & Query Optimization', content: 'Basic Retrieval Structures — Ordered Indices — Dense and Sparse Indices — B+ Tree Index Files — Static and Dynamic Hashing — Query Processing Steps — Heuristic Query Optimization — Cost Estimation — Database Security and Granting Authorization.' }
      ];
      exps = [
        { experimentNumber: 1, title: 'Data Definition Language (DDL) Commands and Schema Creation' },
        { experimentNumber: 2, title: 'Data Manipulation Language (DML) Commands and Integrity Constraints' },
        { experimentNumber: 3, title: 'Complex Nested SQL Subqueries and Join Operations' },
        { experimentNumber: 4, title: 'Creation of Views, Indexes, and Sequences' },
        { experimentNumber: 5, title: 'PL/SQL Programming: Cursors and Exception Handling' },
        { experimentNumber: 6, title: 'PL/SQL Stored Procedures and Functions' },
        { experimentNumber: 7, title: 'Design and Execution of Database Triggers' },
        { experimentNumber: 8, title: 'ER Diagram to Relational Schema Conversion for Real-World Case Study' },
        { experimentNumber: 9, title: 'Database Normalization Analysis (1NF to BCNF)' },
        { experimentNumber: 10, title: 'Transaction Concurrency Simulation and Locking Demonstration' }
      ];
      cos = [
        { description: 'Design ER models and map them into relational database schemas.', cognitiveLevel: 'K3' },
        { description: 'Construct complex SQL queries, views, and PL/SQL procedures.', cognitiveLevel: 'K3' },
        { description: 'Apply database normalization rules to eliminate redundancy.', cognitiveLevel: 'K4' },
        { description: 'Analyze transaction processing, concurrency control, and recovery protocols.', cognitiveLevel: 'K4' },
        { description: 'Evaluate B+ tree indexing strategies and query cost estimation.', cognitiveLevel: 'K5' }
      ];
      tbs = [
        { title: 'Database System Concepts', authors: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan', edition: '7th Edition', publisher: 'McGraw Hill', year: '2020' }
      ];
      refs = [
        { title: 'Fundamentals of Database Systems', authors: 'Ramez Elmasri, Shamkant B. Navathe', edition: '7th Edition', publisher: 'Pearson', year: '2017', url: 'https://pearson.com' }
      ];
    } else if (courseType === 'CN') {
      title = 'Computer Networks';
      objs = [
        'To understand layered network architecture, OSI reference model, and TCP/IP protocol suite.',
        'To analyze data link layer framing, error detection/correction, and media access protocols.',
        'To comprehend IP addressing, routing algorithms, and network layer forwarding.',
        'To evaluate transport layer protocols (TCP/UDP), congestion control, and application layer services.'
      ];
      courseUnits = [
        { unitNumber: 1, unitName: 'Network Architecture & Physical Layer', content: 'Network Topologies — LAN, MAN, WAN — Layered Architecture — OSI 7-Layer Reference Model — TCP/IP Protocol Suite — Physical Layer Transmission Media — Guided Media (Twisted Pair, Coaxial, Fiber Optics) — Wireless Media — Switching Techniques: Circuit Switching, Packet Switching.' },
        { unitNumber: 2, unitName: 'Data Link Layer & MAC Sublayer', content: 'Data Link Layer Services — Framing Techniques — Error Detection: Parity, CRC — Error Correction: Hamming Code — Flow Control Protocols: Stop-and-Wait, Sliding Window (Go-Back-N, Selective Repeat) — Multiple Access Protocols: ALOHA, CSMA/CD (Ethernet), CSMA/CA (Wi-Fi) — IEEE 802.3 Ethernet Standard — Switches and Bridges.' },
        { unitNumber: 3, unitName: 'Network Layer & IP Routing', content: 'Network Layer Functions — IPv4 Addressing — Subnetting and CIDR — IPv6 Addressing Format — Address Resolution Protocol (ARP) — ICMP — IP Datagram Forwarding — Routing Algorithms: Distance Vector Routing (RIP), Link State Routing (OSPF) — Border Gateway Protocol (BGP).' },
        { unitNumber: 4, unitName: 'Transport Layer Protocols', content: 'Transport Layer Services — Multiplexing and Demultiplexing — User Datagram Protocol (UDP) Header — Transmission Control Protocol (TCP) Segment Format — TCP 3-Way Handshake Connection Establishment — TCP Reliable Data Transfer — TCP Flow Control — TCP Congestion Control: Slow Start, Congestion Avoidance.' },
        { unitNumber: 5, unitName: 'Application Layer & Network Security', content: 'Domain Name System (DNS) Resolution — Hypertext Transfer Protocol (HTTP/HTTPS) — File Transfer Protocol (FTP) — Simple Mail Transfer Protocol (SMTP) — Network Security Fundamentals — Symmetric Key Cryptography (AES) — Asymmetric Key Cryptography (RSA) — Firewalls and VPNs.' }
      ];
      exps = [
        { experimentNumber: 1, title: 'Study of Network Cables, RJ-45 Connector Crimping, and NIC Configuration' },
        { experimentNumber: 2, title: 'Implementation of Error Detection Codes (CRC) in C/Python' },
        { experimentNumber: 3, title: 'Simulation of Stop-and-Wait and Sliding Window Protocols' },
        { experimentNumber: 4, title: 'Packet Capture and Analysis using Wireshark' },
        { experimentNumber: 5, title: 'IPv4 Subnetting and CIDR Address Allocation Calculation' },
        { experimentNumber: 6, title: 'Implementation of Dijkstra’s Shortest Path Routing Algorithm' },
        { experimentNumber: 7, title: 'Socket Programming: Client-Server Chat Application using TCP' },
        { experimentNumber: 8, title: 'Socket Programming: UDP Echo Server and Client' },
        { experimentNumber: 9, title: 'Simulation of Distance Vector Routing Protocol' },
        { experimentNumber: 10, title: 'Network Topologies Simulation using Cisco Packet Tracer' }
      ];
      cos = [
        { description: 'Understand layered computer network architectures and physical media transmission.', cognitiveLevel: 'K2' },
        { description: 'Apply error control, flow control, and medium access protocols in Data Link Layer.', cognitiveLevel: 'K3' },
        { description: 'Analyze IPv4/IPv6 addressing schemes and shortest path routing algorithms.', cognitiveLevel: 'K4' },
        { description: 'Evaluate TCP connection management and congestion control algorithms.', cognitiveLevel: 'K4' },
        { description: 'Design application layer socket programs and examine cryptographic protocols.', cognitiveLevel: 'K5' }
      ];
      tbs = [
        { title: 'Computer Networking: A Top-Down Approach', authors: 'James F. Kurose, Keith W. Ross', edition: '7th Edition', publisher: 'Pearson', year: '2017' }
      ];
      refs = [
        { title: 'Computer Networks', authors: 'Andrew S. Tanenbaum, David J. Wetherall', edition: '5th Edition', publisher: 'Pearson Education', year: '2014', url: 'https://pearson.com' }
      ];
    } else if (courseType === 'SE') {
      title = 'Software Engineering';
      objs = [
        'To understand software engineering lifecycle models and agile development methodologies.',
        'To gather software requirements, formulate SRS specifications, and create UML models.',
        'To apply software architecture design principles, modularity, and design patterns.',
        'To master software testing techniques, quality assurance, and DevOps CI/CD practices.'
      ];
      courseUnits = [
        { unitNumber: 1, unitName: 'Software Process Models & Agile Development', content: 'Software Engineering Definition — Lifecycle Models: Waterfall Model, Incremental Model, Evolutionary Model, Spiral Model — Agile Development Philosophy — Scrum Framework — User Stories — Sprint Planning — Kanban Board — DevOps Culture Integration.' },
        { unitNumber: 2, unitName: 'Requirements Engineering & UML Modeling', content: 'Requirements Elicitation Techniques — Functional and Non-Functional Requirements — Software Requirements Specification (SRS) Document Standard — Object-Oriented Analysis — UML Diagrams: Use Case Diagrams, Class Diagrams, Sequence Diagrams, Activity Diagrams, State Machine Diagrams.' },
        { unitNumber: 3, unitName: 'Software Architecture & Architectural Design', content: 'Architectural Styles: Layered, Client-Server, Microservices, Event-Driven Architecture — Modularity Principles: Cohesion and Coupling — Software Design Patterns: Creational (Singleton, Factory), Structural (Adapter), Behavioral (Observer).' },
        { unitNumber: 4, unitName: 'Software Testing & Quality Assurance', content: 'Software Testing Fundamentals — Black-Box Testing: Equivalence Partitioning, Boundary Value Analysis — White-Box Testing: Control Flow Graph, Cyclomatic Complexity, Basis Path Testing — Unit Testing, Integration Testing, System Testing — Acceptance Testing — Software Quality Metrics.' },
        { unitNumber: 5, unitName: 'Project Management, Maintenance & DevOps', content: 'Software Cost Estimation: COCOMO Model — Risk Management — Software Configuration Management (Git) — Continuous Integration and Continuous Deployment (CI/CD) Pipelines — Software Maintenance Types: Corrective, Adaptive, Perfective, Preventive — Software Reengineering.' }
      ];
      exps = [
        { experimentNumber: 1, title: 'Formulation of Software Requirements Specification (SRS) Document for Real-World Project' },
        { experimentNumber: 2, title: 'Creation of Use Case Diagram and Actor Specifications' },
        { experimentNumber: 3, title: 'Designing Domain Class Diagram and Attribute Mappings' },
        { experimentNumber: 4, title: 'Modeling Sequence Diagrams for System Interaction Workflows' },
        { experimentNumber: 5, title: 'Activity and Statechart Diagram Modeling' },
        { experimentNumber: 6, title: 'Black-Box Test Case Design using Boundary Value Analysis' },
        { experimentNumber: 7, title: 'White-Box Testing: Computing Cyclomatic Complexity of Code Modules' },
        { experimentNumber: 8, title: 'Automated Unit Testing Execution using Jest / JUnit' },
        { experimentNumber: 9, title: 'Git Version Control Branching and Pull Request Workflow' },
        { experimentNumber: 10, title: 'Configuring Continuous Integration (CI) Pipeline Build Checks' }
      ];
      cos = [
        { description: 'Select appropriate software lifecycle models and agile practices for project execution.', cognitiveLevel: 'K2' },
        { description: 'Formulate SRS documents and model object-oriented UML diagrams.', cognitiveLevel: 'K3' },
        { description: 'Design modular software architectures and apply creational/structural design patterns.', cognitiveLevel: 'K4' },
        { description: 'Evaluate black-box and white-box software testing strategies.', cognitiveLevel: 'K4' },
        { description: 'Estimate project costs using COCOMO model and configure DevOps CI/CD pipelines.', cognitiveLevel: 'K5' }
      ];
      tbs = [
        { title: 'Software Engineering: A Practitioner’s Approach', authors: 'Roger S. Pressman, Bruce R. Maxim', edition: '9th Edition', publisher: 'McGraw-Hill', year: '2020' }
      ];
      refs = [
        { title: 'Software Engineering', authors: 'Ian Sommerville', edition: '10th Edition', publisher: 'Pearson', year: '2016', url: 'https://pearson.com' }
      ];
    }

    setObjectives(objs);
    setUnits(courseUnits);

    const loadedTopicsMap: Record<number, TopicItem[]> = {};
    courseUnits.forEach((u) => {
      loadedTopicsMap[u.unitNumber] = parseTopicsFromContentString(u.content);
    });
    setUnitTopics(loadedTopicsMap);

    setExperiments(exps);
    setCourseOutcomes(cos);
    setTextbooks(tbs);
    setReferences(refs);

    const mapObj: Record<string, number> = {};
    for (let c = 1; c <= 5; c++) {
      for (let p = 1; p <= 12; p++) {
        const key = `${c}_PO${p}`;
        mapObj[key] = (c + p) % 3 === 0 ? 3 : (c + p) % 2 === 0 ? 2 : 1;
      }
      for (let s = 1; s <= 3; s++) {
        const key = `${c}_PSO${s}`;
        mapObj[key] = s === 1 ? 3 : 2;
      }
    }
    setCoPoMappings(mapObj);

    const justObj: Record<string, string> = {};
    Object.entries(mapObj).forEach(([k, val]) => {
      const [c, p] = k.split('_');
      justObj[k] = `CO${c} strongly aligns with ${p} by applying structured ${title} concepts and engineering principles.`;
    });
    setCoPoJustifications(justObj);

    setSdgMappings([
      { coNumber: 1, sdgNumber: 4, topic: `Fundamental ${title} principles promote quality technical education.` },
      { coNumber: 2, sdgNumber: 9, topic: `${title} core techniques support industry infrastructure and innovation.` },
      { coNumber: 3, sdgNumber: 9, topic: `Advanced ${title} modeling enables software and system engineering design.` },
      { coNumber: 4, sdgNumber: 9, topic: `${title} architecture optimization enhances operational efficiency.` },
      { coNumber: 5, sdgNumber: 4, topic: `Practical ${title} skills empower technical proficiency and lifelong learning.` }
    ]);

    setAutoSaveStatus(`Loaded '${title}' course template across all steps!`);
    setTimeout(() => setAutoSaveStatus(''), 4000);
  };

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
          {!isLocked && (
            <button
              type="button"
              onClick={handleFillTemplateData}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs rounded-xl shadow-sm flex items-center transition-all"
              title="Auto-fill sample syllabus template data across all 9 steps for testing"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-yellow-200 animate-pulse" />
              Use Template
            </button>
          )}
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase text-brand-700">Step 2: Course Syllabus Content</h3>
            </div>

            {!isLocked && (
              <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-200/80 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand-900 flex items-center">
                    <Sparkles className="w-4 h-4 text-amber-500 mr-1.5" />
                    Fast Syllabus Builder: Load Standard Course Template
                  </span>
                  <span className="text-[10px] font-bold text-brand-700 bg-purple-100 px-2 py-0.5 rounded">
                    5 Pre-configured Courses
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">Select a course template below to auto-fill all 5 syllabus units, objectives, topics, outcomes, textbooks & references:</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => applyCoursePreset('DS')}
                    className="px-3 py-1.5 text-xs font-bold bg-white text-brand-800 border border-purple-200 hover:bg-brand-600 hover:text-white rounded-xl shadow-2xs transition-all flex items-center"
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1 text-brand-500" /> 1. Data Structures
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCoursePreset('OS')}
                    className="px-3 py-1.5 text-xs font-bold bg-white text-blue-800 border border-blue-200 hover:bg-blue-600 hover:text-white rounded-xl shadow-2xs transition-all flex items-center"
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1 text-blue-500" /> 2. Operating Systems
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCoursePreset('DBMS')}
                    className="px-3 py-1.5 text-xs font-bold bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-600 hover:text-white rounded-xl shadow-2xs transition-all flex items-center"
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1 text-emerald-500" /> 3. Database Management
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCoursePreset('CN')}
                    className="px-3 py-1.5 text-xs font-bold bg-white text-indigo-800 border border-indigo-200 hover:bg-indigo-600 hover:text-white rounded-xl shadow-2xs transition-all flex items-center"
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1 text-indigo-500" /> 4. Computer Networks
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCoursePreset('SE')}
                    className="px-3 py-1.5 text-xs font-bold bg-white text-amber-800 border border-amber-200 hover:bg-amber-600 hover:text-white rounded-xl shadow-2xs transition-all flex items-center"
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1 text-amber-500" /> 5. Software Engineering
                  </button>
                </div>
              </div>
            )}

            {(templateType === 'THEORY' || templateType === 'LAB_ORIENTED_THEORY' || templateType === 'PROJECT_ORIENTED_THEORY') && (
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 rounded-xl text-xs font-semibold text-brand-900 flex items-center justify-between">
                  <span>
                    Unit Contact Hours: <strong className="text-brand-700 font-bold">{unitContactHours} Hours/Unit</strong> (Total 5 Theory Units = {theoryContactHours} Hours)
                  </span>
                  <span className="text-[11px] font-bold text-brand-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                    Active: Unit {activeUnitTab} of 5
                  </span>
                </div>

                {/* 5 Tab Buttons for Unit 1 to 5 */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-b border-purple-100">
                  {[1, 2, 3, 4, 5].map((uNum) => {
                    const uData = units.find((u) => u.unitNumber === uNum);
                    const isFilled = Boolean(uData?.unitName?.trim() && uData?.content?.trim());
                    const isActive = activeUnitTab === uNum;

                    return (
                      <button
                        key={uNum}
                        type="button"
                        onClick={() => setActiveUnitTab(uNum)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 shrink-0 border ${
                          isActive
                            ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                            : isFilled
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isFilled ? (
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                        ) : (
                          <BookOpen className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        )}
                        <span>Unit {uNum}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Unit Tab Content Panel */}
                {(() => {
                  const unit = units[activeUnitTab - 1] || { unitNumber: activeUnitTab, unitName: '', content: '' };
                  const idx = activeUnitTab - 1;

                  return (
                    <div className="p-5 border rounded-2xl bg-slate-50/50 space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <span className="text-xs font-extrabold text-brand-700 flex items-center uppercase">
                          <BookOpen className="w-4 h-4 mr-1.5 text-brand-600" />
                          Unit {unit.unitNumber} Syllabus Content
                        </span>
                        <div className="flex items-center space-x-2">
                          {activeUnitTab > 1 && (
                            <button
                              type="button"
                              onClick={() => setActiveUnitTab(activeUnitTab - 1)}
                              className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center"
                            >
                              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev Unit
                            </button>
                          )}
                          {activeUnitTab < 5 && (
                            <button
                              type="button"
                              onClick={() => setActiveUnitTab(activeUnitTab + 1)}
                              className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center"
                            >
                              Next Unit <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Unit {unit.unitNumber} Title *
                          </label>
                          <input
                            type="text"
                            disabled={isLocked}
                            value={unit.unitName}
                            onChange={(e) => {
                              const newUnits = [...units];
                              newUnits[idx].unitName = e.target.value.toUpperCase();
                              setUnits(newUnits);
                            }}
                            placeholder={`Unit ${unit.unitNumber} Title (e.g. DIFFERENTIAL CALCULUS)...`}
                            className="w-full px-3.5 py-2.5 text-xs border rounded-xl font-bold bg-white focus:ring-brand-500 uppercase tracking-wide"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Unit {unit.unitNumber} Topics & Detailed Breakdown *
                          </label>
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
                    </div>
                  );
                })()}
              </div>
            )}

            {(templateType === 'LAB' || templateType === 'PROJECT' || templateType === 'LAB_ORIENTED_THEORY' || templateType === 'PROJECT_ORIENTED_THEORY') && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    Laboratory / Practical Experiments
                    {templateType === 'LAB' || templateType === 'PROJECT'
                      ? ' (Exactly 10 Experiments Required)'
                      : ' (Minimum 7, Maximum 10 Experiments Required)'}
                  </h4>
                  <span className="text-xs font-bold text-brand-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                    {experiments.length} Experiments
                  </span>
                </div>

                {experiments.map((exp, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-500 w-16 shrink-0">Exp #{idx + 1}</span>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={exp.title}
                      onChange={(e) => {
                        const newExps = [...experiments];
                        newExps[idx].title = e.target.value;
                        setExperiments(newExps);
                      }}
                      placeholder={`Experiment ${idx + 1} Title...`}
                      className="flex-1 px-3 py-2 text-xs border rounded-xl font-medium bg-white focus:ring-brand-500"
                    />
                    {!isLocked && (templateType === 'LAB_ORIENTED_THEORY' || templateType === 'PROJECT_ORIENTED_THEORY') && experiments.length > 7 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = experiments.filter((_, i) => i !== idx).map((e, i) => ({ ...e, experimentNumber: i + 1 }));
                          setExperiments(updated);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        title="Remove Experiment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {!isLocked && (templateType === 'LAB_ORIENTED_THEORY' || templateType === 'PROJECT_ORIENTED_THEORY') && experiments.length < 10 && (
                  <button
                    type="button"
                    onClick={() => {
                      setExperiments([
                        ...experiments,
                        { experimentNumber: experiments.length + 1, title: '' },
                      ]);
                    }}
                    className="px-4 py-2 text-xs font-bold text-brand-700 bg-purple-50 hover:bg-purple-100 rounded-xl flex items-center shadow-xs border border-purple-200"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Add Experiment (up to 10 max)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: COURSE OUTCOMES WITH COGNITIVE LEVEL */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase text-brand-700">Step 3: Course Outcomes (COs) & Cognitive Levels</h3>
            <p className="text-xs text-desc">
              {templateType === 'LAB'
                ? "Define 5 common Course Outcomes for the given laboratory experiments and select Cognitive Level (Bloom's Taxonomy)."
                : "Define exactly 5 mandatory Course Outcomes corresponding to Units 1 to 5 and select Cognitive Level (Bloom's Taxonomy)."}
            </p>
            {courseOutcomes.map((co, idx) => (
              <div key={idx} className="p-4 border rounded-2xl bg-slate-50/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700">
                    {templateType === 'LAB' ? `CO${idx + 1} (Common Outcome ${idx + 1}) *` : `CO${idx + 1} (Corresponds to Unit ${idx + 1}) *`}
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-semibold text-slate-600">Cognitive Level:</span>
                    <select
                      disabled={isLocked}
                      value={co.cognitiveLevel || ''}
                      onChange={(e) => {
                        const newCOs = [...courseOutcomes];
                        newCOs[idx].cognitiveLevel = e.target.value;
                        setCourseOutcomes(newCOs);
                      }}
                      className={`text-xs font-bold rounded-xl px-2.5 py-1 focus:ring-brand-500 ${
                        !co.cognitiveLevel
                          ? 'text-rose-700 bg-rose-50 border border-rose-300'
                          : 'text-brand-800 bg-purple-100 border border-purple-300'
                      }`}
                    >
                      <option value="">Select Cognitive Level *</option>
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
                  className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-brand-500 bg-white"
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
                  <div key={idx} className="p-4 border rounded-2xl bg-white space-y-3 hover:border-purple-200 transition-all shadow-2xs">
                    {editingTbIdx === idx ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="font-bold text-brand-700 text-xs">Edit Textbook #{idx + 1}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editTb.title}
                            onChange={(e) => setEditTb({ ...editTb, title: e.target.value })}
                            placeholder="Book Title *"
                            className="px-3 py-1.5 text-xs border rounded-xl font-bold bg-white focus:ring-brand-500"
                          />
                          <input
                            type="text"
                            value={editTb.authors}
                            onChange={(e) => setEditTb({ ...editTb, authors: e.target.value })}
                            placeholder="Authors *"
                            className="px-3 py-1.5 text-xs border rounded-xl bg-white focus:ring-brand-500"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={editTb.edition}
                            onChange={(e) => setEditTb({ ...editTb, edition: e.target.value })}
                            placeholder="Edition"
                            className="px-3 py-1.5 text-xs border rounded-xl bg-white focus:ring-brand-500"
                          />
                          <input
                            type="text"
                            value={editTb.publisher}
                            onChange={(e) => setEditTb({ ...editTb, publisher: e.target.value })}
                            placeholder="Publisher"
                            className="px-3 py-1.5 text-xs border rounded-xl bg-white focus:ring-brand-500"
                          />
                          <input
                            type="text"
                            value={editTb.year}
                            onChange={(e) => setEditTb({ ...editTb, year: e.target.value })}
                            placeholder="Year"
                            className="px-3 py-1.5 text-xs border rounded-xl bg-white focus:ring-brand-500"
                          />
                        </div>
                        <div className="flex justify-end space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingTbIdx(null)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={!editTb.title.trim()}
                            onClick={() => {
                              if (!editTb.title.trim()) return;
                              const updated = [...textbooks];
                              updated[idx] = { ...editTb };
                              setTextbooks(updated);
                              setEditingTbIdx(null);
                            }}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
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
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTbIdx(idx);
                                setEditTb({ ...tb });
                              }}
                              className="p-2 text-brand-600 hover:bg-purple-50 rounded-xl"
                              title="Edit Textbook"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setTextbooks(textbooks.filter((_, i) => i !== idx))}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                              title="Remove Textbook"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
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
                  <div key={idx} className="p-4 border rounded-2xl bg-white space-y-3 hover:border-purple-200 transition-all shadow-2xs">
                    {editingRefIdx === idx ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="font-bold text-brand-700 text-xs">Edit Reference #{idx + 1}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editRef.title}
                            onChange={(e) => setEditRef({ ...editRef, title: e.target.value })}
                            placeholder="Reference Title *"
                            className="px-3 py-1.5 text-xs border rounded-xl font-bold bg-white focus:ring-brand-500"
                          />
                          <input
                            type="text"
                            value={editRef.authors}
                            onChange={(e) => setEditRef({ ...editRef, authors: e.target.value })}
                            placeholder="Authors"
                            className="px-3 py-1.5 text-xs border rounded-xl bg-white focus:ring-brand-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={editRef.edition}
                            onChange={(e) => setEditRef({ ...editRef, edition: e.target.value })}
                            placeholder="Edition"
                            className="px-3 py-1.5 text-xs border rounded-xl bg-white focus:ring-brand-500"
                          />
                          <input
                            type="text"
                            value={editRef.publisher}
                            onChange={(e) => setEditRef({ ...editRef, publisher: e.target.value })}
                            placeholder="Publisher"
                            className="px-3 py-1.5 text-xs border rounded-xl bg-white focus:ring-brand-500"
                          />
                          <input
                            type="text"
                            value={editRef.url}
                            onChange={(e) => setEditRef({ ...editRef, url: e.target.value })}
                            placeholder="Web Link URL"
                            className="px-3 py-1.5 text-xs border rounded-xl bg-white focus:ring-brand-500"
                          />
                        </div>
                        <div className="flex justify-end space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingRefIdx(null)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={!editRef.title.trim()}
                            onClick={() => {
                              if (!editRef.title.trim()) return;
                              const updated = [...references];
                              updated[idx] = { ...editRef };
                              setReferences(updated);
                              setEditingRefIdx(null);
                            }}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
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
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRefIdx(idx);
                                setEditRef({ ...ref });
                              }}
                              className="p-2 text-brand-600 hover:bg-purple-50 rounded-xl"
                              title="Edit Reference"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setReferences(references.filter((_, i) => i !== idx))}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                              title="Remove Reference"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
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

        {/* STEP 7: CO/PO JUSTIFICATION WITH TABBED VIEW */}
        {activeStep === 7 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold uppercase text-brand-700">Step 7: CO / PO Justification</h3>
              <p className="text-xs text-desc mt-0.5">Select each Course Outcome tab below and provide mandatory justification text for mapped PO/PSO correlations.</p>
            </div>

            {/* CO Tab Bar */}
            <div className="flex items-center space-x-2 border-b pb-3 overflow-x-auto">
              {[1, 2, 3, 4, 5].map((coNum) => {
                const coPairs = correlatedPairs.filter((p) => p.coNumber === coNum);
                const isJustified = coPairs.length > 0 && coPairs.every((p) => (coPoJustifications[`${p.coNumber}_${p.poKey}`] || '').trim().length > 0);

                return (
                  <button
                    key={coNum}
                    type="button"
                    onClick={() => setActiveJustificationCO(coNum)}
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 text-xs ${
                      activeJustificationCO === coNum
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>CO{coNum}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                      activeJustificationCO === coNum
                        ? 'bg-brand-700 text-white'
                        : coPairs.length === 0
                        ? 'bg-slate-200 text-slate-600'
                        : isJustified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {coPairs.length} Mapped
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active CO Tab Justification Cards */}
            {(() => {
              const activePairs = correlatedPairs.filter((p) => p.coNumber === activeJustificationCO);

              if (activePairs.length === 0) {
                return (
                  <div className="p-6 border border-dashed rounded-2xl text-center text-desc text-xs bg-slate-50">
                    No non-zero PO/PSO correlations mapped for CO{activeJustificationCO} in Step 6.
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {activePairs.map((pair) => {
                    const key = `${pair.coNumber}_${pair.poKey}`;
                    const stmtObj = pair.poKey.startsWith('PSO')
                      ? psoStatements.find((s) => s.psoKey === pair.poKey)
                      : poStatements.find((s) => s.poKey === pair.poKey);
                    const stmtText = stmtObj?.statement;

                    return (
                      <div key={key} className="p-4 border rounded-2xl bg-slate-50/70 space-y-2">
                        <div className="flex justify-between items-start">
                          <label className="block text-xs font-bold text-brand-700">
                            Justification for CO{pair.coNumber} → {pair.poKey} (Correlation Level: {pair.correlation}) *
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
                          className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-brand-500 bg-white font-sans"
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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
              unitTopics={unitTopics}
              experiments={experiments}
              sdgGoals={sdgGoals}
              sdgMappings={sdgMappings}
              onChange={setSdgMappings}
              disabled={isLocked}
              isLabCourse={templateType === 'LAB' || templateType === 'PROJECT'}
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
                <p className="font-extrabold text-slate-900 mt-0.5 font-mono">
                  {subject.facultyDeadline
                    ? (() => {
                        const d = new Date(subject.facultyDeadline);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        return `${day}/${month}/${year} 23:59`;
                      })()
                    : '01/10/2026 23:59'}
                </p>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  Assigned Faculty: <span className="font-mono font-extrabold text-brand-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">{subject.assignedFaculty?.userCode || subject.assignedFaculty?.email?.split('@')[0]?.toUpperCase() || 'CSF01'}</span>
                </p>
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
                  <p>Course Objectives: <strong className="text-slate-900">{objectives.filter((o) => o && typeof o === 'string' && o.trim()).length} / 5 Defined</strong></p>
                  <p>Course Outcomes: <strong className="text-slate-900">{courseOutcomes.filter((c) => (typeof c === 'string' ? c.trim() : (typeof c?.description === 'string' ? c.description.trim() : ''))).length} / 5 Mandatory COs</strong></p>
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
                    <span>2. {templateType === 'LAB' ? 'Laboratory Experiments' : 'Syllabus Units & Practical'}</span>
                  </h4>
                  <button onClick={() => setActiveStep(2)} className="text-[11px] font-bold text-brand-600 hover:underline">
                    Edit →
                  </button>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  {templateType === 'LAB' ? (
                    <p>Laboratory Experiments: <strong className="text-slate-900">{experiments.filter((e) => e && e.title && typeof e.title === 'string' && e.title.trim()).length} / 10 Completed</strong></p>
                  ) : (
                    <>
                      <p>Syllabus Units: <strong className="text-slate-900">{units.filter((u) => u && u.content && typeof u.content === 'string' && u.content.trim()).length} / 5 Completed</strong></p>
                      {experiments.filter((e) => e && e.title && typeof e.title === 'string' && e.title.trim()).length > 0 && (
                        <p>Laboratory Experiments: <strong className="text-slate-900">{experiments.filter((e) => e && e.title && typeof e.title === 'string' && e.title.trim()).length} Experiments Listed</strong></p>
                      )}
                    </>
                  )}
                  <p className="text-desc text-[10px]">
                    {templateType === 'LAB' ? 'Minimum 10 Laboratory experiments configured.' : 'Topic Builder used for clean structured layout (no manual hyphens).'}
                  </p>
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
                  <span>{templateType === 'LAB' ? 'Minimum 10 Laboratory Experiments completed' : 'All 5 Syllabus Units completed'}</span>
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

            {/* Submit Action Button & PDF Preview */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t gap-3">
              <span className="text-desc text-xs">
                {isLocked ? 'Syllabus has been finalized and locked.' : 'Once submitted, syllabus will be locked for HoD review.'}
              </span>
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowPdfModal(true)}
                  className="px-6 py-3.5 bg-purple-100 hover:bg-purple-200 text-brand-900 font-extrabold text-xs rounded-2xl shadow-xs flex items-center space-x-2 transition-all border border-purple-200 shrink-0"
                >
                  <Eye className="w-4 h-4 text-brand-700" />
                  <span>Preview PDF</span>
                </button>
                {!isLocked && (
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center space-x-2 transition-all w-full sm:w-auto justify-center"
                  >
                    <Send className="w-4 h-4" />
                    <span>{loading ? 'Submitting Syllabus...' : 'Submit Syllabus to Head of Department'}</span>
                  </button>
                )}
              </div>
            </div>
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
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

      {/* Submission Success Pop-up Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-center border-2 border-emerald-400">
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                You Successfully Submitted to HoD!
              </h3>
              <p className="text-xs text-desc mt-1">
                Syllabus for <strong className="text-slate-800">{subject.subjectCode} — {subject.subjectName}</strong> has been submitted to the Head of Department for review.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1.5 text-left">
              <p className="font-bold flex items-center text-emerald-800 border-b border-emerald-200 pb-1">
                <FileCheck className="w-4 h-4 mr-1.5 shrink-0" /> Submission Summary:
              </p>
              <p>• <strong>Status:</strong> Locked for HoD Review</p>
              <p>• <strong>Total Contact Hours:</strong> {totalContactHours} Hours</p>
              <p>• <strong>Assigned Faculty:</strong> {subject.assignedFaculty?.name || 'Faculty Member'} ({subject.assignedFaculty?.userCode || 'CSF01'})</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowPdfModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Acknowledgement PDF</span>
              </button>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  window.location.reload();
                }}
                className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
