import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Sparkles, Save } from 'lucide-react';
import { calculateCredits, formatSubjectCode } from '@/lib/calculations';

interface SubjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departmentCode: string;
  departmentId?: string;
  regulationCode?: string;
  semester: number;
  subjectTypes: any[];
  subjectCategories: any[];
  editingSubject?: any;
}

const VERTICAL_OPTIONS = [
  'Vertical A',
  'Vertical B',
  'Vertical C',
  'Vertical D',
  'Vertical E',
  'Vertical F',
  'Vertical G',
  'Vertical H',
];

export const SubjectFormModal: React.FC<SubjectFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departmentCode,
  departmentId,
  regulationCode = '27',
  semester,
  subjectTypes,
  subjectCategories,
  editingSubject,
}) => {
  const [selectedSemester, setSelectedSemester] = useState<number | ''>(semester || '');
  const [selectedVertical, setSelectedVertical] = useState('Vertical A');
  const [subjectName, setSubjectName] = useState('');
  const [subjectTypeId, setSubjectTypeId] = useState('');
  const [subjectCategoryId, setSubjectCategoryId] = useState('');
  const [useCustomPrefix, setUseCustomPrefix] = useState(false);
  const [coursePrefix, setCoursePrefix] = useState(departmentCode || 'CS');
  const [customPrefixesList, setCustomPrefixesList] = useState<string[]>([]);
  const [lecture, setLecture] = useState(0);
  const [tutorial, setTutorial] = useState(0);
  const [practical, setPractical] = useState(0);
  const [lWeight, setLWeight] = useState(1.0);
  const [tWeight, setTWeight] = useState(1.0);
  const [pWeight, setPWeight] = useState(0.5);
  const [calculationMethod, setCalculationMethod] = useState('WEIGHTED');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    fetchCreditConfig();
  }, []);

  const fetchCreditConfig = async () => {
    try {
      const res = await fetch('/api/master-admin/credit-config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setLWeight(data.config.lWeight ?? 1.0);
          setTWeight(data.config.tWeight ?? 1.0);
          setPWeight(data.config.pWeight ?? 0.5);
          setCalculationMethod(data.config.calculationMethod || 'WEIGHTED');
          if (data.config.customPrefixes) {
            const list = data.config.customPrefixes
              .split(',')
              .map((s: string) => s.trim().toUpperCase())
              .filter(Boolean);
            if (list.length > 0) {
              setCustomPrefixesList(list);
              if (!editingSubject) {
                setCoursePrefix(list[0]);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch credit weights');
    }
  };

  const availablePrefixes = customPrefixesList.length > 0
    ? customPrefixesList
    : ['GE', 'PH', 'HS', 'MC', 'CD', 'AI', 'CB', 'EC', 'EE', 'ME', 'CE', 'IT'];

  useEffect(() => {
    setSelectedSemester(editingSubject ? editingSubject.semester : '');
    if (editingSubject) {
      setSubjectName(editingSubject.subjectName || '');
      setSubjectTypeId(editingSubject.subjectTypeId || '');
      setSubjectCategoryId(editingSubject.subjectCategoryId || '');
      setLecture(editingSubject.lecture ?? 0);
      setTutorial(editingSubject.tutorial ?? 0);
      setPractical(editingSubject.practical ?? 0);
      if (editingSubject.vertical) {
        setSelectedVertical(editingSubject.vertical);
      }
      const codePrefix = editingSubject.subjectCode ? editingSubject.subjectCode.substring(0, 2) : departmentCode;
      setCoursePrefix(codePrefix);
      setUseCustomPrefix(codePrefix !== departmentCode);
    } else {
      setSubjectName('');
      setSubjectTypeId(''); // Default to - Select Subject Type -
      setSubjectCategoryId(''); // Default to - Select Subject Category -
      setCoursePrefix(availablePrefixes[0] || departmentCode || 'CS');
      setUseCustomPrefix(false);
      setSelectedVertical('Vertical A');
      setLecture(0);
      setTutorial(0);
      setPractical(0);
    }
    setError('');
  }, [editingSubject, isOpen, subjectTypes, subjectCategories, semester, departmentCode]);

  if (!isOpen) return null;

  const creditResult = calculateCredits(lecture, tutorial, practical, lWeight, tWeight, pWeight, calculationMethod);

  const selectedType = subjectTypes.find((t) => t.id === subjectTypeId);
  const typeCode = selectedType ? selectedType.code : 1;

  const selectedCategory = subjectCategories.find((c) => c.id === subjectCategoryId);
  const isElectiveCategory = selectedCategory && selectedCategory.code !== 'PC';

  // LTPC Validation Rule for Non-Theory Courses (P >= 1)
  const isNonTheory = selectedType
    ? selectedType.templateType !== 'THEORY' || selectedType.name.toLowerCase() !== 'theory'
    : false;
  const isInvalidNonTheoryPractical = isNonTheory && practical < 1;
  const isInvalidTheoryLecture = !isNonTheory && lecture < 1;

  // Extract vertical letter (e.g. "Vertical E" -> "E")
  const verticalLetter = selectedVertical.toUpperCase().startsWith('VERTICAL ')
    ? selectedVertical.split(' ')[1]
    : selectedVertical;

  // Live preview subject code (e.g. CD27E31 for electives with custom prefix, CS27421 for PC)
  const semOrVertStr = isElectiveCategory ? verticalLetter : selectedSemester;
  const activePrefix = isElectiveCategory && useCustomPrefix ? coursePrefix : (departmentCode || 'CS');
  const codePreview = formatSubjectCode(activePrefix, regulationCode, semOrVertStr, typeCode, editingSubject ? 1 : 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subjectCategoryId) {
      setError('Please select a Subject Category.');
      return;
    }

    if (!subjectTypeId) {
      setError('Please select a Subject Type.');
      return;
    }

    if (!isElectiveCategory && (!selectedSemester || Number(selectedSemester) < 1)) {
      setError('Please select a valid Semester.');
      return;
    }

    if (!isNonTheory && lecture < 1) {
      setError('Lecture hours (L) must be at least 1 for Theory courses.');
      return;
    }

    if (isNonTheory && practical < 1) {
      setError('Practical hours (P) must be at least 1 for Lab / Practical courses.');
      return;
    }

    if (!creditResult.valid) {
      setError(creditResult.warning || 'Invalid credit combination.');
      return;
    }

    const confirmMsg = editingSubject
      ? `Are you sure you want to update subject "${subjectName.trim()}"?`
      : `Are you sure you want to add subject "${subjectName.trim()}" to the department curriculum?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/hod/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSubject?.id,
          departmentId: departmentId || undefined,
          semester: Number(selectedSemester),
          vertical: isElectiveCategory ? selectedVertical : null,
          subjectTypeId,
          subjectCategoryId,
          subjectName,
          lecture,
          tutorial,
          practical,
          customPrefix: isElectiveCategory && useCustomPrefix ? coursePrefix : departmentCode,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        throw new Error(text || `Server returned status ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save subject.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] h-screen w-screen bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-purple-100/80 animate-in fade-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-purple-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editingSubject ? 'Edit Subject Details' : isElectiveCategory ? `Add New Elective Subject — ${selectedVertical}` : `Add New Subject — Semester ${selectedSemester}`}
            </h3>
            <p className="text-xs text-desc">Regulation {regulationCode} | Department Code: {departmentCode}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {(error || isInvalidNonTheoryPractical) && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start text-xs text-red-700">
            <AlertCircle className="w-4 h-4 mr-2 text-red-500 shrink-0 mt-0.5" />
            <span>{isInvalidNonTheoryPractical ? 'Practical hours (P) must be at least 1 for non-Theory courses.' : error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name *</label>
            <input
              type="text"
              required
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Data Structures and Algorithms"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Category *</label>
              <select
                required
                value={subjectCategoryId}
                onChange={(e) => setSubjectCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              >
                <option value="" disabled>
                  - Select Category -
                </option>
                {subjectCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {isElectiveCategory ? (
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">Vertical Group *</label>
                <select
                  value={selectedVertical}
                  onChange={(e) => setSelectedVertical(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-amber-300 rounded-xl font-bold bg-amber-50 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                >
                  {VERTICAL_OPTIONS.map((v, i) => (
                    <option key={v} value={v}>
                      {v} (Digit {i + 1})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Semester *</label>
                <select
                  required
                  value={selectedSemester || ''}
                  onChange={(e) => setSelectedSemester(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-bold bg-purple-50 text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                >
                  <option value="" disabled>
                    - Select Semester -
                  </option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Sem {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Type *</label>
            <select
              value={subjectTypeId}
              onChange={(e) => {
                const newTypeId = e.target.value;
                setSubjectTypeId(newTypeId);
                const st = subjectTypes.find((t) => t.id === newTypeId);
                if (st && (st.templateType === 'THEORY' || (st.name.toLowerCase().includes('theory') && !st.name.toLowerCase().includes('lab')))) {
                  setPractical(0);
                }
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-medium"
            >
              <option value="" disabled>
                - Select Subject Type -
              </option>
              {subjectTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Course Code Prefix Toggle & Selection (For Non-PC Categories) */}
          {isElectiveCategory && (
            <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/80 space-y-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-900 block">Custom Course Code Prefix</span>
                  <span className="text-[10px] text-amber-700">Enable to override department prefix ({departmentCode}) with custom domain prefix</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseCustomPrefix(!useCustomPrefix)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    useCustomPrefix ? 'bg-amber-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      useCustomPrefix ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {useCustomPrefix && (
                <div className="pt-2 border-t border-amber-200/60 space-y-1.5 animate-in fade-in duration-150">
                  <p className="text-[11px] font-semibold text-slate-700">Select Offering Dept / Domain Prefix:</p>
                  <div className="flex flex-wrap gap-2">
                    {availablePrefixes.map((pfx) => (
                      <label
                        key={pfx}
                        className={`cursor-pointer px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all flex items-center space-x-1.5 ${
                          coursePrefix === pfx
                            ? 'bg-amber-600 text-white border-amber-700 shadow-xs ring-2 ring-amber-300'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name="coursePrefix"
                          value={pfx}
                          checked={coursePrefix === pfx}
                          onChange={(e) => setCoursePrefix(e.target.value)}
                          className="sr-only"
                        />
                        <span>{pfx}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LTPC Credit Calculator Section */}
          <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">L-T-P-C Credit Calculation</span>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">L (Lecture)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={lecture}
                  onChange={(e) => setLecture(parseInt(e.target.value) || 0)}
                  className={`w-full px-2 py-1.5 text-center text-sm font-semibold border rounded-lg focus:ring-brand-500 ${
                    isInvalidTheoryLecture ? 'border-red-500 bg-red-50 text-red-900 font-bold' : 'border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">T (Tutorial)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={tutorial}
                  onChange={(e) => setTutorial(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-center text-sm font-semibold border border-slate-300 rounded-lg focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">P (Practical)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={!isNonTheory ? 0 : practical}
                  disabled={!isNonTheory}
                  onChange={(e) => setPractical(parseInt(e.target.value) || 0)}
                  className={`w-full px-2 py-1.5 text-center text-sm font-semibold border rounded-lg focus:ring-brand-500 ${
                    !isNonTheory ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : isInvalidNonTheoryPractical ? 'border-red-500 bg-red-50 text-red-900 font-bold' : 'border-slate-300'
                  }`}
                  title={!isNonTheory ? 'Practical hours fixed to 0 for Theory courses' : 'Practical hours'}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">C (Credits)</label>
                <div className={`w-full py-1.5 text-sm font-bold rounded-lg border text-center ${creditResult.valid && !isInvalidNonTheoryPractical ? 'bg-brand-600 text-white border-brand-700 shadow-xs' : 'bg-red-100 text-red-700 border-red-300'}`}>
                  {creditResult.credits}
                </div>
              </div>
            </div>

            {!creditResult.valid && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-100/90 border border-amber-300 flex items-start text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 mr-2 text-amber-700 shrink-0 mt-0.5" />
                <span>{creditResult.warning}</span>
              </div>
            )}
          </div>

          {/* Subject Code Live Preview */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center">
              <Sparkles className="w-4 h-4 text-amber-500 mr-2" />
              <div>
                <p className="text-xs font-semibold text-slate-700">Subject Code</p>
                <p className="text-[10px] text-desc">Automatically generated by backend sequence engine</p>
              </div>
            </div>
            <span className="font-mono text-base font-bold text-brand-700 bg-purple-100 px-3 py-1 rounded-lg border border-purple-200">
              {editingSubject ? editingSubject.subjectCode : `${codePreview}*`}
            </span>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-purple-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !creditResult.valid || isInvalidNonTheoryPractical}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md disabled:opacity-50 flex items-center transition-all"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  {editingSubject ? 'Update Subject' : 'Create Subject'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
