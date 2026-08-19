import React, { useState } from 'react';
import { Globe, Plus, Trash2, Check, AlertTriangle, Sparkles } from 'lucide-react';

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
  sdgGoals: SDGGoalItem[];
  units: { unitNumber: number; unitName: string; content: string }[];
  sdgMappings: SDGMappingItem[];
  onChange: (updated: SDGMappingItem[]) => void;
  disabled?: boolean;
}

/**
 * Parses raw unit content string into discrete selectable topic items by splitting on hyphens (-), en-dashes (–), em-dashes (—), or semicolons (;).
 * Trims unnecessary spaces and trailing punctuation around each topic string.
 * Does NOT alter original syllabus text.
 */
export function parseUnitTopics(content: string): string[] {
  if (!content || !content.trim()) return [];

  // Regex matches hyphen (-), en-dash (–), em-dash (—), or semicolon (;)
  const parts = content.split(/[-–—;]/g);

  return parts
    .map((p) => p.replace(/^[.\s,]+|[.\s,]+$/g, '').trim())
    .filter((p) => p.length > 0);
}

export const SDGMappingForm: React.FC<SDGMappingFormProps> = ({
  sdgGoals,
  units,
  sdgMappings,
  onChange,
  disabled = false,
}) => {
  const cos = [1, 2, 3, 4, 5];

  // Helper to find unit for a CO
  const getUnitForCO = (coNum: number) => {
    return units.find((u) => u.unitNumber === coNum) || { unitNumber: coNum, unitName: `Unit ${coNum}`, content: '' };
  };

  // State for active dropdown additions per CO
  const [selectedSDGForCO, setSelectedSDGForCO] = useState<Record<number, number>>({});
  const [selectedTopicForCO, setSelectedTopicForCO] = useState<Record<number, string>>({});

  const handleAddMapping = (coNum: number) => {
    const sdgNum = selectedSDGForCO[coNum];
    const topicStr = selectedTopicForCO[coNum];

    if (!sdgNum || !topicStr) return;

    // Check if mapping already exists
    const exists = sdgMappings.some(
      (m) => m.coNumber === coNum && m.sdgNumber === sdgNum && m.topic === topicStr
    );

    if (!exists) {
      const updated = [...sdgMappings, { coNumber: coNum, sdgNumber: sdgNum, topic: topicStr }];
      onChange(updated);
    }
  };

  const handleRemoveMapping = (coNum: number, sdgNum: number, topicStr: string) => {
    const updated = sdgMappings.filter(
      (m) => !(m.coNumber === coNum && m.sdgNumber === sdgNum && m.topic === topicStr)
    );
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100/80 flex items-start space-x-3">
        <Globe className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-1">
          <p className="font-bold text-brand-800">UN Sustainable Development Goals (SDGs) Mapping</p>
          <p>
            Map each Course Outcome (CO) to relevant UN SDGs and specific syllabus topics. Each CO maps <strong>strictly to its corresponding Unit</strong> (CO1 → Unit 1, CO2 → Unit 2, etc.). Topics are automatically parsed from unit content separated by hyphens (<code>-</code>) or en-dashes (<code>–</code>).
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {cos.map((coNum) => {
          const unit = getUnitForCO(coNum);
          const topics = parseUnitTopics(unit.content);
          const coMappings = sdgMappings.filter((m) => m.coNumber === coNum);

          // Group coMappings by SDG Number
          const groupedBySDG = new Map<number, string[]>();
          coMappings.forEach((m) => {
            const existing = groupedBySDG.get(m.sdgNumber) || [];
            if (!existing.includes(m.topic)) existing.push(m.topic);
            groupedBySDG.set(m.sdgNumber, existing);
          });

          return (
            <div key={coNum} className="p-6 bg-white rounded-3xl border border-purple-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-9 h-9 rounded-xl bg-brand-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    CO{coNum}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      CO{coNum} — Unit {unit.unitNumber}: {unit.unitName || `Unit ${unit.unitNumber}`}
                    </h4>
                    <p className="text-xs text-desc">
                      Available Unit Topics ({topics.length}): {topics.length > 0 ? topics.join(' • ') : 'No topics parsed. Separate topics in Unit content with - or –'}
                    </p>
                  </div>
                </div>
                {groupedBySDG.size > 0 ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center">
                    <Check className="w-3.5 h-3.5 mr-1" /> {groupedBySDG.size} SDG(s) Mapped
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Missing SDG Mapping
                  </span>
                )}
              </div>

              {/* Controls to Add SDG & Topic Mapping */}
              {!disabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">1. Select UN SDG *</label>
                    <select
                      value={selectedSDGForCO[coNum] || ''}
                      onChange={(e) => setSelectedSDGForCO({ ...selectedSDGForCO, [coNum]: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-brand-500 font-semibold"
                    >
                      <option value="">Select SDG Goal...</option>
                      {sdgGoals.map((sdg) => (
                        <option key={sdg.id} value={sdg.sdgNumber}>
                          SDG {sdg.sdgNumber} — {sdg.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">2. Select Unit {unit.unitNumber} Topic *</label>
                    <select
                      value={selectedTopicForCO[coNum] || ''}
                      onChange={(e) => setSelectedTopicForCO({ ...selectedTopicForCO, [coNum]: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-brand-500 font-semibold"
                    >
                      <option value="">Select Unit Topic...</option>
                      {topics.map((t, idx) => (
                        <option key={idx} value={t}>
                          • {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => handleAddMapping(coNum)}
                      disabled={!selectedSDGForCO[coNum] || !selectedTopicForCO[coNum]}
                      className="w-full py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add SDG Mapping
                    </button>
                  </div>
                </div>
              )}

              {/* Mapped Summary View */}
              <div className="space-y-3 pt-2">
                {groupedBySDG.size === 0 ? (
                  <p className="text-xs text-desc italic p-3 text-center bg-slate-50 rounded-xl border border-dashed">
                    No SDGs or topics mapped for CO{coNum} yet.
                  </p>
                ) : (
                  Array.from(groupedBySDG.entries()).map(([sdgNum, topicList]) => {
                    const sdgObj = sdgGoals.find((g) => g.sdgNumber === sdgNum);
                    return (
                      <div key={sdgNum} className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-brand-800 flex items-center">
                            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                            SDG {sdgNum} — {sdgObj?.name || 'SDG Goal'}
                          </span>
                          <span className="text-[10px] font-bold text-desc uppercase">{topicList.length} Topic(s)</span>
                        </div>
                        <ul className="space-y-1.5 pl-4 border-l-2 border-purple-300">
                          {topicList.map((t, tIdx) => {
                            const isStale = topics.length > 0 && !topics.includes(t);
                            return (
                              <li key={tIdx} className="flex items-center justify-between text-xs text-slate-800">
                                <span className="flex items-center">
                                  • {t}
                                  {isStale && (
                                    <span className="ml-2 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center border border-amber-200">
                                      <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" /> Topic no longer matches syllabus content - please update
                                    </span>
                                  )}
                                </span>
                                {!disabled && (
                                  <button
                                    onClick={() => handleRemoveMapping(coNum, sdgNum, t)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
