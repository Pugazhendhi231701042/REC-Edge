import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Sparkles, Save } from 'lucide-react';
import { calculateCredits, formatSubjectCode } from '@/lib/calculations';

interface SubjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departmentCode: string;
  regulationCode?: string;
  semester: number;
  subjectTypes: any[];
  subjectCategories: any[];
  editingSubject?: any;
}

export const SubjectFormModal: React.FC<SubjectFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departmentCode,
  regulationCode = '26',
  semester,
  subjectTypes,
  subjectCategories,
  editingSubject,
}) => {
  const [subjectName, setSubjectName] = useState('');
  const [subjectTypeId, setSubjectTypeId] = useState('');
  const [subjectCategoryId, setSubjectCategoryId] = useState('');
  const [lecture, setLecture] = useState(3);
  const [tutorial, setTutorial] = useState(0);
  const [practical, setPractical] = useState(0);
  const [lWeight, setLWeight] = useState(1.0);
  const [tWeight, setTWeight] = useState(1.0);
  const [pWeight, setPWeight] = useState(0.5);
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
        }
      }
    } catch (err) {
      console.error('Failed to fetch credit weights');
    }
  };

  useEffect(() => {
    if (editingSubject) {
      setSubjectName(editingSubject.subjectName || '');
      setSubjectTypeId(editingSubject.subjectTypeId || '');
      setSubjectCategoryId(editingSubject.subjectCategoryId || '');
      setLecture(editingSubject.lecture ?? 3);
      setTutorial(editingSubject.tutorial ?? 0);
      setPractical(editingSubject.practical ?? 0);
    } else {
      setSubjectName('');
      setSubjectTypeId(subjectTypes[0]?.id || '');
      setSubjectCategoryId(subjectCategories[0]?.id || '');
      setLecture(3);
      setTutorial(0);
      setPractical(0);
    }
    setError('');
  }, [editingSubject, isOpen, subjectTypes, subjectCategories]);

  if (!isOpen) return null;

  const creditResult = calculateCredits(lecture, tutorial, practical, lWeight, tWeight, pWeight);

  const selectedType = subjectTypes.find((t) => t.id === subjectTypeId);
  const typeCode = selectedType ? selectedType.code : 1;

  // LTPC Validation Rule for Non-Theory Courses (P >= 1)
  const isNonTheory = selectedType
    ? selectedType.templateType !== 'THEORY' || selectedType.name.toLowerCase() !== 'theory'
    : false;
  const isInvalidNonTheoryPractical = isNonTheory && practical < 1;

  // Live preview subject code
  const codePreview = formatSubjectCode(departmentCode, regulationCode, semester, typeCode, editingSubject ? 1 : 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!creditResult.valid) {
      setError(creditResult.warning || 'Invalid credit combination.');
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
          semester,
          subjectTypeId,
          subjectCategoryId,
          subjectName,
          lecture,
          tutorial,
          practical,
        }),
      });

      const data = await res.json();
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
              {editingSubject ? 'Edit Subject Details' : `Add New Subject — Semester ${semester}`}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Type *</label>
              <select
                value={subjectTypeId}
                onChange={(e) => setSubjectTypeId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              >
                {subjectTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Category *</label>
              <select
                value={subjectCategoryId}
                onChange={(e) => setSubjectCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              >
                {subjectCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                  className="w-full px-2 py-1.5 text-center text-sm font-semibold border border-slate-300 rounded-lg focus:ring-brand-500"
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
                  value={practical}
                  onChange={(e) => setPractical(parseInt(e.target.value) || 0)}
                  className={`w-full px-2 py-1.5 text-center text-sm font-semibold border rounded-lg focus:ring-brand-500 ${
                    isInvalidNonTheoryPractical ? 'border-red-500 bg-red-50 text-red-900 font-bold' : 'border-slate-300'
                  }`}
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
