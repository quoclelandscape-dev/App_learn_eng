'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import Header from './Header';
import PracticeArea from '../../practice/mobile/PracticeArea';
import { Search, Calendar, FileText, ChevronRight, Trash2, ArrowLeft } from 'lucide-react';
import type { Dialogue, UserStats, Settings, PracticeLevel, DialogueLine } from '../../../types';

interface MobileLayoutProps {
  dialogues: Dialogue[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddClick: () => void;
  onSettingsClick: () => void;
  userStats: UserStats;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  onDeleteClick: (dialogue: Dialogue) => void;
  settings: Settings;
  onPracticeComplete: (score: number, level: PracticeLevel, updatedLines: DialogueLine[]) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, description: string) => void;
}

export default function Layout({
  dialogues,
  selectedId,
  onSelect,
  onAddClick,
  onSettingsClick,
  userStats,
  theme,
  onThemeToggle,
  onDeleteClick,
  settings,
  onPracticeComplete,
  showToast,
}: MobileLayoutProps) {
  const [activeView, setActiveView] = useState<'list' | 'practice'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showSpacedRepetitionOnly, setShowSpacedRepetitionOnly] = useState(false);

  // Sync active view with selectedId
  useEffect(() => {
    if (selectedId) {
      setActiveView('practice');
    } else {
      setActiveView('list');
    }
  }, [selectedId]);

  // Extract unique tags
  const allTags = Array.from(
    new Set(dialogues.flatMap(d => d.tags || []))
  );

  const isReviewNeeded = (dialogue: Dialogue) => {
    if (!dialogue.spacedRepetitionDate) return false;
    const reviewDate = new Date(dialogue.spacedRepetitionDate);
    const today = new Date();
    reviewDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return reviewDate <= today;
  };

  const filteredDialogues = dialogues.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.lines.some(l => l.en.toLowerCase().includes(searchQuery.toLowerCase()) || l.vi.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = !selectedTag || d.tags.includes(selectedTag);
    const matchesReview = !showSpacedRepetitionOnly || isReviewNeeded(d);

    return matchesSearch && matchesTag && matchesReview;
  });

  const selectedDialogue = dialogues.find(d => d.id === selectedId) || null;

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden font-sans ${
      theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
    }`}>
      {activeView === 'list' ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300">
          <Header
            userStats={userStats}
            theme={theme}
            onThemeToggle={onThemeToggle}
            onSettingsClick={onSettingsClick}
            onAddClick={onAddClick}
          />

          {/* Search & Filters */}
          <div className={`p-4 space-y-3 border-b ${theme === 'dark' ? 'border-white/5 bg-zinc-900/10' : 'bg-white border-zinc-200'}`}>
            <div className="relative">
              <Search size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`} />
              <input
                type="text"
                placeholder="Tìm chủ đề hoặc từ khóa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-base outline-none transition-all ${
                  theme === 'dark'
                    ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-500 focus:border-purple-500/50'
                    : 'border-zinc-300 bg-zinc-100 text-zinc-900 placeholder-zinc-450 focus:border-purple-500 focus:bg-white'
                }`}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSpacedRepetitionOnly(!showSpacedRepetitionOnly)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-2xs font-semibold transition-all ${
                  showSpacedRepetitionOnly
                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                    : theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
                    : 'bg-zinc-100 border-zinc-250 text-zinc-650 hover:text-zinc-900'
                }`}
              >
                <Calendar size={12} />
                Cần Ôn Tập
              </button>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-2xs font-semibold"
                >
                  Bỏ lọc: {selectedTag}
                </button>
              )}
            </div>

            {allTags.length > 0 && !selectedTag && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`whitespace-nowrap rounded-lg border px-2.5 py-1 text-3xs transition-all ${
                      theme === 'dark'
                        ? 'bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dialogue List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            <div className={`flex justify-between items-center text-3xs font-bold uppercase tracking-wider mb-1 px-1 ${
              theme === 'dark' ? 'text-zinc-550' : 'text-zinc-400'
            }`}>
              <span>Danh sách bài học ({filteredDialogues.length})</span>
            </div>

            {filteredDialogues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                <FileText size={32} className={theme === 'dark' ? 'text-zinc-700' : 'text-zinc-350'} />
                <p className="text-xs text-zinc-500">Không tìm thấy bài học nào.</p>
                {dialogues.length === 0 && (
                  <button
                    onClick={onAddClick}
                    className="text-purple-400 hover:text-purple-300 text-2xs underline"
                  >
                    Tạo một bài học ngay!
                  </button>
                )}
              </div>
            ) : (
              filteredDialogues.map(dialogue => {
                const needsReview = isReviewNeeded(dialogue);
                return (
                  <div
                    key={dialogue.id}
                    onClick={() => {
                      onSelect(dialogue.id);
                      setActiveView('practice');
                    }}
                    className={`relative flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition-all duration-200 active:scale-[0.99] ${
                      theme === 'dark'
                        ? 'bg-zinc-900/30 border-white/5 hover:bg-zinc-900/50 text-zinc-200'
                        : 'bg-white border-zinc-200/80 hover:bg-zinc-50 text-zinc-800 shadow-sm'
                    }`}
                  >
                    {needsReview && (
                      <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    )}

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                          dialogue.type === 'paragraph'
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                        }`}>
                          {dialogue.type === 'paragraph' ? 'Đoạn văn' : 'Hội thoại'}
                        </span>
                        <p className="font-bold text-sm truncate pr-2">
                          {dialogue.title}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className={`flex items-center gap-2 text-3xs ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {dialogue.lastScore !== undefined ? (
                            <span className={`font-bold ${
                              dialogue.lastScore >= 80 ? 'text-emerald-500' : dialogue.lastScore >= 50 ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                              Thành thục: {dialogue.lastScore}%
                            </span>
                          ) : (
                            <span>Chưa học</span>
                          )}
                          <span>•</span>
                          <span>Luyện: {dialogue.practiceCount} lần</span>
                        </div>

                        {/* Level badges */}
                        <div className="flex gap-1">
                          {['shadow', 'copy', 'type', 'listen', 'ai_chat'].map((lvl, lIdx) => {
                            const score = dialogue.levelScores?.[lvl as PracticeLevel] || 0;
                            const char = ['S', 'C', 'D', 'L', 'A'][lIdx];
                            const lvlName = ['Shadowing', 'Copy Type', 'Dictation', 'Listening', 'AI Feedback'][lIdx];
                            return (
                              <span
                                key={lvl}
                                className={`text-[8px] font-extrabold border rounded flex items-center justify-center h-4.5 w-4.5 ${
                                  score >= 80
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                    : score >= 50
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                    : score > 0
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                    : theme === 'dark' ? 'bg-zinc-800/50 border-white/5 text-zinc-600' : 'bg-zinc-100 border-zinc-200 text-zinc-450'
                                }`}
                                title={`${lvlName}: ${score}%`}
                              >
                                {char}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick(dialogue);
                        }}
                        className={`p-2 rounded-xl active:scale-90 ${
                          theme === 'dark' ? 'text-zinc-650 hover:text-red-400 hover:bg-red-500/15' : 'text-zinc-400 hover:text-red-650 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 size={13} />
                      </button>
                      <ChevronRight size={16} className={theme === 'dark' ? 'text-zinc-650' : 'text-zinc-400'} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Practice Header with Back button */}
          <div className={`p-4 border-b flex items-center gap-3 justify-between sticky top-0 z-30 backdrop-blur-md ${
            theme === 'dark' ? 'bg-zinc-950/80 border-white/5' : 'bg-white/95 border-zinc-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => {
                  onSelect(null);
                  setActiveView('list');
                }}
                className={`p-2 rounded-xl transition-all active:scale-90 ${
                  theme === 'dark' ? 'bg-white/5 text-zinc-400' : 'bg-zinc-100 text-zinc-650 shadow-sm'
                }`}
              >
                <ArrowLeft size={16} />
              </button>
              <div className="min-w-0">
                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border mr-1.5 ${
                  selectedDialogue?.type === 'paragraph'
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                }`}>
                  {selectedDialogue?.type === 'paragraph' ? 'Đoạn văn' : 'Hội thoại'}
                </span>
                <span className="font-bold text-sm truncate inline-block align-middle max-w-[150px] md:max-w-[300px]">
                  {selectedDialogue?.title}
                </span>
              </div>
            </div>
          </div>

          {/* Practice Area details */}
          <div className="flex-1 overflow-hidden">
            <PracticeArea
              dialogue={selectedDialogue}
              settings={settings}
              onPracticeComplete={onPracticeComplete}
              theme={theme}
              showToast={showToast}
            />
          </div>
        </div>
      )}
    </div>
  );
}
