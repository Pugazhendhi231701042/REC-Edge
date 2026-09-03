'use client';

import React, { useState } from 'react';
import { Globe, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

export interface SDGGoalItem {
  id: string;
  sdgNumber: number;
  name: string;
}

export interface SDGMapping {
  coNumber: number; // 1..5
  sdgNumber: number; // 1..17
  topic: string;
}
export type SDGMappingItem = SDGMapping;

interface SyllabusUnit {
  unitNumber: number;
  unitName: string;
  content: string;
}

interface SDGMappingFormProps {
  sdgGoals?: any[];
  units: SyllabusUnit[];
  experiments?: any[];
  sdgMappings: SDGMapping[];
  onChange: (mappings: SDGMapping[]) => void;
  disabled?: boolean;
  isLabCourse?: boolean;
}

const default17SDGs = [
  { id: '1', sdgNumber: 1, name: 'No Poverty' },
  { id: '2', sdgNumber: 2, name: 'Zero Hunger' },
  { id: '3', sdgNumber: 3, name: 'Good Health and Well-being' },
  { id: '4', sdgNumber: 4, name: 'Quality Education' },
  { id: '5', sdgNumber: 5, name: 'Gender Equality' },
  { id: '6', sdgNumber: 6, name: 'Clean Water and Sanitation' },
  { id: '7', sdgNumber: 7, name: 'Affordable and Clean Energy' },
  { id: '8', sdgNumber: 8, name: 'Decent Work and Economic Growth' },
  { id: '9', sdgNumber: 9, name: 'Industry, Innovation and Infrastructure' },
  { id: '10', sdgNumber: 10, name: 'Reduced Inequalities' },
  { id: '11', sdgNumber: 11, name: 'Sustainable Cities and Communities' },
  { id: '12', sdgNumber: 12, name: 'Responsible Consumption and Production' },
  { id: '13', sdgNumber: 13, name: 'Climate Action' },
  { id: '14', sdgNumber: 14, name: 'Life Below Water' },
  { id: '15', sdgNumber: 15, name: 'Life on Land' },
  { id: '16', sdgNumber: 16, name: 'Peace, Justice and Strong Institutions' },
  { id: '17', sdgNumber: 17, name: 'Partnerships for the Goals' },
];

function parseUnitTopics(content: string): string[] {
  if (!content) return [];
  const lines = content.split('\n');
  const topics: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const cleaned = trimmed.replace(/^[\d+.\-–—\s├└│|\\-•*]+/, '').trim();

    if (cleaned.length > 0 && !topics.includes(cleaned)) {
      topics.push(cleaned);
    }
  }

  if (topics.length > 0) return topics;

  const parts = content.split(/[,;\n]/);
  return parts
    .map((p) => p.replace(/^[.\s,\-–—]+|[.\s,\-–—]+$/g, '').trim())
    .filter((p) => p.length > 0);
}

export const SDGMappingForm: React.FC<SDGMappingFormProps> = ({
  sdgGoals = [],
  units,
  experiments = [],
  sdgMappings,
  onChange,
  disabled = false,
  isLabCourse = false,
}) => {
  const [activeCO, setActiveCO] = useState<number>(1);
  const cos = [1, 2, 3, 4, 5];
  const activeSDGList = sdgGoals && sdgGoals.length > 0 ? sdgGoals : default17SDGs;

  const [selectedSDG, setSelectedSDG] = useState<number>(0);
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  const currentUnit = units.find((u) => u.unitNumber === activeCO) || {
    unitNumber: activeCO,
    unitName: `Unit ${activeCO}`,
    content: '',
  };

  const currentTopics = isLabCourse
    ? experiments && experiments.length > 0
      ? experiments.map((exp, idx) => `Exp ${idx + 1}: ${exp.title || 'Experiment'}`)
      : Array.from(new Set(units.flatMap((u) => parseUnitTopics(u.content))))
    : parseUnitTopics(currentUnit.content);

  const handleAddMapping = () => {
    if (!selectedSDG || !selectedTopic.trim() || disabled) return;

    const targetCO = isLabCourse ? 1 : activeCO;
    const exists = sdgMappings.some(
      (m) => m.coNumber === targetCO && m.sdgNumber === selectedSDG && m.topic === selectedTopic
    );

    if (!exists) {
      onChange([...sdgMappings, { coNumber: targetCO, sdgNumber: selectedSDG, topic: selectedTopic }]);
      setSelectedTopic('');
      setSelectedSDG(0);
    }
  };

  const handleDeleteMapping = (index: number) => {
    if (disabled) return;
    const updated = [...sdgMappings];
    updated.splice(index, 1);
    onChange(updated);
  };

  const activeCOMappings = isLabCourse
    ? sdgMappings
    : sdgMappings.filter((m) => m.coNumber === activeCO);

  return (
    <div className="space-y-6 text-xs text-slate-800 font-sans">
      {!isLabCourse && (
        <div className="flex items-center justify-between border-b pb-3 overflow-x-auto">
          <div className="flex items-center space-x-2">
            {cos.map((coNum) => {
              const count = sdgMappings.filter((m) => m.coNumber === coNum).length;

              return (
                <button
                  key={coNum}
                  type="button"
                  onClick={() => {
                    setActiveCO(coNum);
                    setSelectedSDG(0);
                    setSelectedTopic('');
                  }}
                  className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
                    activeCO === coNum
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>CO{coNum}</span>
                  {count > 0 ? (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] ${activeCO === coNum ? 'bg-brand-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                      {count} Mapped
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] ${activeCO === coNum ? 'bg-purple-800 text-white' : 'bg-amber-100 text-amber-900'}`}>
                      Missing
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-bold text-desc">
            Total SDGs Mapped: <strong className="text-brand-700 font-extrabold">{sdgMappings.length} Mappings</strong>
          </span>
        </div>
      )}

      <div className="p-6 bg-white rounded-3xl border border-purple-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
          <div>
            <span className="text-[10px] font-bold text-brand-700 bg-purple-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
              {isLabCourse ? 'Lab Course SDG Mapping' : `Course Outcome CO${activeCO}`}
            </span>
            <h4 className="text-sm font-extrabold text-slate-900 mt-1">
              {isLabCourse
                ? 'Course Experiments SDG Mapping'
                : `Unit ${currentUnit.unitNumber}: ${currentUnit.unitName || `Unit ${currentUnit.unitNumber}`}`}
            </h4>
          </div>

          <div className="text-xs">
            {sdgMappings.length > 0 ? (
              <span className="inline-flex items-center px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                <Check className="w-3.5 h-3.5 mr-1" /> Mapped to SDGs
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Mapping Required
              </span>
            )}
          </div>
        </div>

        {!disabled && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
              {isLabCourse ? 'Create New SDG & Experiment Mapping' : `Create New SDG & Topic Mapping for CO${activeCO}`}
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">1. Select UN SDG Goal *</label>
                <select
                  disabled={disabled}
                  value={selectedSDG || ''}
                  onChange={(e) => setSelectedSDG(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl font-bold bg-white focus:ring-brand-500"
                >
                  <option value="">Choose SDG Goal...</option>
                  {activeSDGList.map((sdg) => (
                    <option key={sdg.id} value={sdg.sdgNumber}>
                      SDG {sdg.sdgNumber} — {sdg.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  {isLabCourse ? '2. Select Lab Experiment *' : `2. Select Unit ${currentUnit.unitNumber} Syllabus Topic *`}
                </label>
                <select
                  disabled={disabled || currentTopics.length === 0}
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl font-bold bg-white focus:ring-brand-500"
                >
                  <option value="">
                    {currentTopics.length === 0
                      ? isLabCourse
                        ? 'No lab experiments found. Please add experiments in Step 2.'
                        : 'No unit topics found. Please add topics in Step 2.'
                      : isLabCourse
                      ? 'Choose Experiment...'
                      : 'Choose Unit Topic...'}
                  </option>
                  {currentTopics.map((top, idx) => (
                    <option key={idx} value={top}>
                      {isLabCourse ? top : `Topic ${idx + 1}: ${top}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={!selectedSDG || !selectedTopic || disabled}
                onClick={handleAddMapping}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add SDG Mapping</span>
              </button>
            </div>
          </div>
        )}

        {/* Mapped SDG List Table for Active CO */}
        <div className="space-y-3">
          <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
            Active Mappings for CO{activeCO}
          </h5>

          {(() => {
            const coMappings = sdgMappings.filter((m) => m.coNumber === activeCO);

            if (coMappings.length === 0) {
              return (
                <div className="p-6 border border-dashed rounded-2xl text-center text-desc text-xs bg-slate-50">
                  No SDG mappings defined for CO{activeCO} yet. Select an SDG goal and unit topic above to add.
                </div>
              );
            }

            return (
              <div className="overflow-x-auto border border-purple-100 rounded-2xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-purple-50 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-3">SDG Goal</th>
                      <th className="p-3">Mapped Syllabus Topic</th>
                      {!disabled && <th className="p-3 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coMappings.map((mapItem, idx) => {
                      const sdgObj = activeSDGList.find((s) => s.sdgNumber === mapItem.sdgNumber);

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-brand-800">
                            <span className="bg-purple-100 text-brand-900 px-2 py-0.5 rounded font-mono text-[10px] mr-2">
                              SDG {mapItem.sdgNumber}
                            </span>
                            {sdgObj?.name || 'SDG Goal'}
                          </td>
                          <td className="p-3 text-slate-800 font-medium">{mapItem.topic}</td>
                          {!disabled && (
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteMapping(idx)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold inline-flex items-center space-x-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
