'use client';

import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical, CornerDownRight, Edit2, Check } from 'lucide-react';

export interface SubTopicItem {
  id: string;
  title: string;
}

export interface TopicItem {
  id: string;
  title: string;
  subtopics: SubTopicItem[];
}

interface TopicBuilderProps {
  unitNumber: number;
  topics: TopicItem[];
  onChange: (topics: TopicItem[]) => void;
  disabled?: boolean;
}

export const parseTopicsFromContentString = (content: string): TopicItem[] => {
  if (!content || !content.trim()) return [];
  
  // Clean trailing hyphens or dashes
  const cleanStr = content.replace(/[–\-\s]+$/, '').trim();
  const parts = cleanStr.split(/\s+[–\-]\s+/).map((s) => s.trim()).filter(Boolean);
  
  if (parts.length === 0) return [];

  return parts.map((p, idx) => ({
    id: `topic_${idx}_${Math.random().toString(36).substr(2, 6)}`,
    title: p,
    subtopics: [],
  }));
};

export const formatTopicsToContentString = (topics: TopicItem[]): string => {
  const parts: string[] = [];
  topics.forEach((t) => {
    if (t.title.trim()) {
      parts.push(t.title.trim());
      (t.subtopics || []).forEach((st) => {
        if (st.title.trim()) {
          parts.push(st.title.trim());
        }
      });
    }
  });
  return parts.join(' – ');
};

export const TopicBuilder: React.FC<TopicBuilderProps> = ({
  unitNumber,
  topics,
  onChange,
  disabled = false,
}) => {
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [activeSubtopicInput, setActiveSubtopicInput] = useState<string | null>(null);
  const [newSubtopicTitle, setNewSubtopicTitle] = useState('');

  const handleAddTopic = () => {
    if (!newTopicTitle.trim() || disabled) return;
    const newTopic: TopicItem = {
      id: `topic_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: newTopicTitle.trim(),
      subtopics: [],
    };
    onChange([...topics, newTopic]);
    setNewTopicTitle('');
  };

  const handleAddSubtopic = (topicId: string) => {
    if (!newSubtopicTitle.trim() || disabled) return;
    const updated = topics.map((t) => {
      if (t.id === topicId) {
        return {
          ...t,
          subtopics: [
            ...t.subtopics,
            {
              id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              title: newSubtopicTitle.trim(),
            },
          ],
        };
      }
      return t;
    });
    onChange(updated);
    setNewSubtopicTitle('');
    setActiveSubtopicInput(null);
  };

  const handleDeleteTopic = (topicId: string) => {
    if (disabled) return;
    onChange(topics.filter((t) => t.id !== topicId));
  };

  const handleDeleteSubtopic = (topicId: string, subId: string) => {
    if (disabled) return;
    onChange(
      topics.map((t) => {
        if (t.id === topicId) {
          return {
            ...t,
            subtopics: t.subtopics.filter((st) => st.id !== subId),
          };
        }
        return t;
      })
    );
  };

  const handleMoveTopic = (index: number, direction: 'UP' | 'DOWN') => {
    if (disabled) return;
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= topics.length) return;
    const copy = [...topics];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    onChange(copy);
  };

  const handleMoveSubtopic = (topicId: string, subIndex: number, direction: 'UP' | 'DOWN') => {
    if (disabled) return;
    onChange(
      topics.map((t) => {
        if (t.id === topicId) {
          const targetIdx = direction === 'UP' ? subIndex - 1 : subIndex + 1;
          if (targetIdx < 0 || targetIdx >= t.subtopics.length) return t;
          const copy = [...t.subtopics];
          const temp = copy[subIndex];
          copy[subIndex] = copy[targetIdx];
          copy[targetIdx] = temp;
          return { ...t, subtopics: copy };
        }
        return t;
      })
    );
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
          Structured Topics & Subtopics (Unit {unitNumber})
        </span>
        <span className="text-[10px] text-desc">
          No hyphens needed — topics are automatically formatted cleanly for PDFs and SDG mapping.
        </span>
      </div>

      {/* Topic List */}
      <div className="space-y-3">
        {topics.length === 0 ? (
          <div className="p-4 border border-dashed border-slate-200 rounded-2xl text-center text-desc text-[11px]">
            No topics added yet. Type a topic name below and click "+ Add Topic".
          </div>
        ) : (
          topics.map((topic, index) => (
            <div
              key={topic.id}
              className="p-3.5 border rounded-2xl bg-slate-50/70 border-slate-200 space-y-2.5 shadow-2xs hover:border-purple-200 transition-all"
            >
              {/* Topic Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1">
                  <span className="text-slate-400 font-mono text-[10px] font-bold select-none cursor-grab">⋮⋮</span>
                  <span className="font-extrabold text-brand-700 w-5">{index + 1}.</span>
                  <input
                    type="text"
                    disabled={disabled}
                    value={topic.title}
                    onChange={(e) => {
                      const updated = topics.map((t) => (t.id === topic.id ? { ...t, title: e.target.value } : t));
                      onChange(updated);
                    }}
                    placeholder="Enter main topic title..."
                    className="flex-1 px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-brand-500 bg-white"
                  />
                </div>

                {!disabled && (
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveTopic(index, 'UP')}
                      className="p-1 text-slate-500 hover:bg-slate-200 rounded disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === topics.length - 1}
                      onClick={() => handleMoveTopic(index, 'DOWN')}
                      className="p-1 text-slate-500 hover:bg-slate-200 rounded disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubtopicInput(activeSubtopicInput === topic.id ? null : topic.id);
                        setNewSubtopicTitle('');
                      }}
                      className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-brand-800 font-bold rounded-lg text-[10px] flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-0.5" /> Subtopic
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                      title="Delete Topic"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Subtopics List */}
              {topic.subtopics.length > 0 && (
                <div className="pl-7 space-y-1.5 border-l-2 border-purple-200 ml-3">
                  {topic.subtopics.map((sub, subIdx) => (
                    <div key={sub.id} className="flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-2 flex-1">
                        <CornerDownRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <input
                          type="text"
                          disabled={disabled}
                          value={sub.title}
                          onChange={(e) => {
                            const updated = topics.map((t) => {
                              if (t.id === topic.id) {
                                return {
                                  ...t,
                                  subtopics: t.subtopics.map((st) => (st.id === sub.id ? { ...st, title: e.target.value } : st)),
                                };
                              }
                              return t;
                            });
                            onChange(updated);
                          }}
                          placeholder="Enter subtopic..."
                          className="flex-1 px-2.5 py-1 text-xs border rounded-lg font-medium bg-white focus:ring-brand-500"
                        />
                      </div>

                      {!disabled && (
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            disabled={subIdx === 0}
                            onClick={() => handleMoveSubtopic(topic.id, subIdx, 'UP')}
                            className="p-0.5 text-slate-400 hover:bg-slate-200 rounded disabled:opacity-30"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={subIdx === topic.subtopics.length - 1}
                            onClick={() => handleMoveSubtopic(topic.id, subIdx, 'DOWN')}
                            className="p-0.5 text-slate-400 hover:bg-slate-200 rounded disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubtopic(topic.id, sub.id)}
                            className="p-0.5 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Subtopic Form Inline */}
              {activeSubtopicInput === topic.id && !disabled && (
                <div className="pl-7 flex items-center space-x-2 pt-1 border-l-2 border-purple-200 ml-3">
                  <CornerDownRight className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={newSubtopicTitle}
                    onChange={(e) => setNewSubtopicTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtopic(topic.id);
                      }
                    }}
                    placeholder="Type subtopic name and press Enter..."
                    className="flex-1 px-2.5 py-1 text-xs border border-purple-300 rounded-lg font-medium focus:ring-purple-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSubtopic(topic.id)}
                    className="px-2.5 py-1 bg-brand-600 text-white font-bold rounded-lg text-[10px]"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubtopicInput(null)}
                    className="px-2 py-1 bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Main Topic Form */}
      {!disabled && (
        <div className="flex items-center space-x-2 pt-2 border-t border-purple-100">
          <input
            type="text"
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTopic();
              }
            }}
            placeholder={`+ Enter new Topic ${topics.length + 1} for Unit ${unitNumber}...`}
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium focus:ring-brand-500 bg-white"
          />
          <button
            type="button"
            onClick={handleAddTopic}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Topic</span>
          </button>
        </div>
      )}
    </div>
  );
};
