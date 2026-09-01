'use client';

import React, { useState } from 'react';
import { Globe, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

export interface SDGGoalItem {
  id: string;
  sdgNumber: number;
  name: string;
}

export interface SDGMappingItem {
  coNumber: number; // 1..5
  sdgNumber: number; // 1..17
  topic: string;
}

interface SDGMappingFormProps {
  sdgGoals?: SDGGoalItem[];
  units: { unitNumber: number; unitName: string; content: string }[];
  sdgMappings: SDGMappingItem[];
  onChange: (updated: SDGMappingItem[]) => void;
  disabled?: boolean;
}

const default17SDGs: SDGGoalItem[] = [
  { id: 'sdg-1', sdgNumber: 1, name: 'No Poverty' },
  { id: 'sdg-2', sdgNumber: 2, name: 'Zero Hunger' },
  { id: 'sdg-3', sdgNumber: 3, name: 'Good Health and Well-being' },
  { id: 'sdg-4', sdgNumber: 4, name: 'Quality Education' },
  { id: 'sdg-5', sdgNumber: 5, name: 'Gender Equality' },
  { id: 'sdg-6', sdgNumber: 6, name: 'Clean Water and Sanitation' },
  { id: 'sdg-7', sdgNumber: 7, name: 'Affordable and Clean Energy' },
  { id: 'sdg-8', sdgNumber: 8, name: 'Decent Work and Economic Growth' },
  { id: 'sdg-9', sdgNumber: 9, name: 'Industry, Innovation and Infrastructure' },
  { id: 'sdg-10', sdgNumber: 10, name: 'Reduced Inequality' },
  { id: 'sdg-11', sdgNumber: 11, name: 'Sustainable Cities and Communities' },
  { id: 'sdg-12', sdgNumber: 12, name: 'Responsible Consumption and Production' },
  { id: 'sdg-13', sdgNumber: 13, name: 'Climate Action' },
  { id: 'sdg-14', sdgNumber: 14, name: 'Life Below Water' },
  { id: 'sdg-15', sdgNumber: 15, name: 'Life on Land' },
  { id: 'sdg-16', sdgNumber: 16, name: 'Peace, Justice and Strong Institutions' },
  { id: 'sdg-17', sdgNumber: 17, name: 'Partnerships for the Goals' },
];

export function parseUnitTopics(content: string): string[] {
  if (!content || !content.trim()) return [];
  const parts = content.split(/[-–—;]/g);
  return parts
    .map((p) => p.replace(/^[.\s,]+|[.\s,]+$/g, '').trim())
    .filter((p) => p.length > 0);
}

export const SDGMappingForm: React.FC<SDGMappingFormProps> = ({
  sdgGoals = [],
  units,
  sdgMappings,
  onChange,
  disabled = false,
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

  const currentTopics = parseUnitTopics(currentUnit.content);

  const handleAddMapping = () => {
    if (!selectedSDG || !selectedTopic.trim() || disabled) return;

    const exists = sdgMappings.some(
      (m) => m.coNumber === activeCO && m.sdgNumber === selectedSDG && m.topic === selectedTopic
    );

    if (!exists) {
      onChange([...sdgMappings, { coNumber: activeCO, sdgNumber: selectedSDG, topic: selectedTopic }]);
      setSelectedTopic('');
    }
  };

  const handleRemoveMapping = (coNum: number, sdgNum: number, topicStr: string) => {
    if (disabled) return;
    onChange(sdgMappings.filter((m) => !(m.coNumber === coNum && m.sdgNumber === sdgNum && m.topic === topicStr)));
  };

  return (
    <div className="space-y-6 text-xs text-slate-800 font-sans">
      {/* CO Selection Navigation Bar */}
      <div className="flex items-center justify-between border-b pb-3 overflow-x-auto">
        <div className="flex items-center space-x-2">
          {cos.map((coNum) => {
            const isMapped = sdgMappings.some((m) => m.coNumber === coNum);
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

      {/* Active CO Unit Details & Form */}
      <div className="p-6 bg-white rounded-3xl border border-purple-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
          <div>
            <span className="text-[10px] font-bold text-brand-700 bg-purple-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
              Course Outcome CO{activeCO}
            </span>
            <h4 className="text-sm font-extrabold text-slate-900 mt-1">
              Unit {currentUnit.unitNumber}: {currentUnit.unitName || `Unit ${currentUnit.unitNumber}`}
            </h4>
          </div>

          <div className="text-xs">
            {sdgMappings.some((m) => m.coNumber === activeCO) ? (
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

        {/* 2-Step Interactive Form */}
        {!disabled && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
              Create New SDG & Topic Mapping for CO{activeCO}
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
                  2. Select Unit {currentUnit.unitNumber} Syllabus Topic *
                </label>
                <select
                  disabled={disabled || currentTopics.length === 0}
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl font-bold bg-white focus:ring-brand-500"
                >
                  <option value="">
                    {currentTopics.length === 0 ? 'No unit topics found. Please add topics in Step 2.' : 'Choose Unit Topic...'}
                  </option>
                  {currentTopics.map((top, idx) => (
                    <option key={idx} value={top}>
                      {top}
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
                                onClick={() => handleRemoveMapping(mapItem.coNumber, mapItem.sdgNumber, mapItem.topic)}
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
