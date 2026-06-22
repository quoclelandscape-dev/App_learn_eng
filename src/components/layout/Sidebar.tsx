'use client';

import React, { useState } from 'react';
import {
  Flame,
  Search,
  Settings as SettingsIcon,
  Plus,
  Calendar,
  Award,
  ChevronRight,
  FileText,
  Sun,
  Moon,
  Trash2,
  Shield
} from 'lucide-react';
import type { Dialogue, UserStats } from '../../types';

interface SidebarProps {
  dialogues: Dialogue[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddClick: () => void;
  onSettingsClick: () => void;
  userStats: UserStats;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  onDeleteClick: (dialogue: Dialogue) => void;
  onAttendanceClick?: () => void;
  onLeaderboardClick?: () => void;
}

export default function Sidebar({
  dialogues,
  selectedId,
  onSelect,
  onAddClick,
  onSettingsClick,
  userStats,
  theme,
  onThemeToggle,
  onDeleteClick,
  onAttendanceClick,
  onLeaderboardClick,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showSpacedRepetitionOnly, setShowSpacedRepetitionOnly] = useState(false);

  // Extract unique tags from dialogues
  const allTags = Array.from(
    new Set(dialogues.flatMap(d => d.tags || []))
  );

  // Helper to check if a dialogue needs spaced repetition review today
  const isReviewNeeded = (dialogue: Dialogue) => {
    if (!dialogue.spacedRepetitionDate) return false;
    const reviewDate = new Date(dialogue.spacedRepetitionDate);
    const today = new Date();
    // Set hours to 0 to compare dates only
    reviewDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return reviewDate <= today;
  };

  // Filter dialogues
  const filteredDialogues = dialogues.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.lines.some(l => l.en.toLowerCase().includes(searchQuery.toLowerCase()) || l.vi.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = !selectedTag || d.tags.includes(selectedTag);

    const matchesReview = !showSpacedRepetitionOnly || isReviewNeeded(d);

    return matchesSearch && matchesTag && matchesReview;
  });

  return (
    <div className={`w-full md:w-80 border-r flex flex-col h-full overflow-hidden transition-all duration-200 ${
      theme === 'dark'
        ? 'bg-zinc-950/80 border-white/10 text-zinc-100'
        : 'bg-zinc-50 border-zinc-200 text-zinc-900'
    }`}>
      
      {/* App Header & Stats */}
      <div className={`p-4 border-b ${
        theme === 'dark'
          ? 'border-white/10 bg-zinc-900/40'
          : 'border-zinc-200 bg-zinc-100/60'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-sm tracking-tighter text-white shadow-md shadow-purple-500/20">
              SD
            </div>
            <span className={`font-semibold tracking-wider text-md bg-gradient-to-r ${
              theme === 'dark'
                ? 'from-purple-400 to-indigo-300'
                : 'from-purple-600 to-indigo-500'
            } bg-clip-text text-transparent`}>
              ShadowDictate
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onThemeToggle}
              className={`rounded-xl p-2 transition-colors ${
                theme === 'dark'
                  ? 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-100'
                  : 'bg-zinc-200/50 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
              }`}
              title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={onSettingsClick}
              className={`rounded-xl p-2 transition-colors ${
                theme === 'dark'
                  ? 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-100'
                  : 'bg-zinc-200/50 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
              }`}
              title="Cài đặt hệ thống"
            >
              <SettingsIcon size={16} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
            theme === 'dark'
              ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
              : 'bg-orange-50 border-orange-200 text-orange-600'
          }`}>
            <Flame size={18} className="animate-pulse" />
            <div className="flex flex-col">
              <span className={`text-3xs font-semibold uppercase tracking-wider ${
                theme === 'dark' ? 'text-orange-500' : 'text-orange-600'
              }`}>Streak</span>
              <span className="text-sm font-bold">{userStats.streak} ngày</span>
            </div>
          </div>
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
            theme === 'dark'
              ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
              : 'bg-purple-50 border-purple-200 text-purple-600'
          }`}>
            <Award size={18} />
            <div className="flex flex-col">
              <span className={`text-3xs font-semibold uppercase tracking-wider ${
                theme === 'dark' ? 'text-purple-500' : 'text-purple-600'
              }`}>Điểm XP</span>
              <span className="text-sm font-bold">{userStats.totalXP}</span>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex gap-2 mt-3 pt-2 border-t border-dashed border-zinc-700/20">
          <button
            onClick={onAttendanceClick}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border text-[10px] font-bold transition-all active:scale-95 ${
              theme === 'dark'
                ? 'bg-purple-650/10 border-purple-500/20 text-purple-450 hover:bg-purple-650/20'
                : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 shadow-sm'
            }`}
            title="Điểm danh tuần"
          >
            <Calendar size={13} className="text-purple-400" />
            Điểm Danh
          </button>
          <button
            onClick={onLeaderboardClick}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border text-[10px] font-bold transition-all active:scale-95 ${
              theme === 'dark'
                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20'
                : 'bg-yellow-50 border-yellow-250 text-yellow-750 hover:bg-yellow-100 shadow-sm'
            }`}
            title="Bảng xếp hạng"
          >
            <Award size={13} className="text-yellow-500" />
            Đua Top
          </button>
          <a
            href="/admin/setup-app-operations"
            className={`flex-shrink-0 flex items-center justify-center p-1.5 rounded-xl border transition-all active:scale-95 ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                : 'bg-zinc-100 border-zinc-250 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 shadow-sm'
            }`}
            title="Cấu hình quản trị"
          >
            <Shield size={13} />
          </a>
        </div>
      </div>

      {/* Control Panel: Add & Filter */}
      <div className={`p-4 space-y-3 border-b ${
        theme === 'dark' ? 'border-white/5' : 'border-zinc-200'
      }`}>
        {/* Add Dialogue Button */}
        <button
          onClick={onAddClick}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold tracking-wide text-white hover:bg-purple-500 transition-all active:scale-[0.98] shadow-lg shadow-purple-600/25"
        >
          <Plus size={18} />
          Thêm Hội Thoại Mới
        </button>

        {/* Search */}
        <div className="relative">
          <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`} />
          <input
            type="text"
            placeholder="Tìm chủ đề hoặc từ khóa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-xs outline-none transition-all ${
              theme === 'dark'
                ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-500 focus:border-purple-500/50'
                : 'border-zinc-300 bg-zinc-100 text-zinc-900 placeholder-zinc-400 focus:border-purple-500 focus:bg-white'
            }`}
          />
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowSpacedRepetitionOnly(!showSpacedRepetitionOnly)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-2xs font-medium transition-all ${
              showSpacedRepetitionOnly
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                : theme === 'dark'
                ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
                : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
            }`}
          >
            <Calendar size={12} />
            Cần Ôn Tập
          </button>
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="px-2 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-2xs font-medium hover:bg-red-500/20"
            >
              Bỏ lọc: {selectedTag}
            </button>
          )}
        </div>

        {/* Tags Row */}
        {allTags.length > 0 && !selectedTag && (
          <div className={`flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin ${
            theme === 'dark' ? 'scrollbar-thumb-zinc-800' : 'scrollbar-thumb-zinc-300'
          }`}>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`whitespace-nowrap rounded-lg border px-2.5 py-1 text-3xs transition-all ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dialogue List */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin ${
        theme === 'dark' ? 'scrollbar-thumb-zinc-800' : 'scrollbar-thumb-zinc-300'
      }`}>
        <div className={`flex justify-between items-center text-3xs font-bold uppercase tracking-wider mb-1 px-1 ${
          theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
        }`}>
          <span>Lịch sử hội thoại ({filteredDialogues.length})</span>
          {showSpacedRepetitionOnly && <span className="text-amber-500">Bộ lọc: Cần ôn</span>}
        </div>

        {filteredDialogues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
            <FileText size={32} className={theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'} />
            <p className="text-xs text-zinc-500">Không tìm thấy hội thoại nào.</p>
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
            const isSelected = selectedId === dialogue.id;
            const needsReview = isReviewNeeded(dialogue);

            return (
              <div
                key={dialogue.id}
                onClick={() => onSelect(dialogue.id)}
                className={`group relative flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? theme === 'dark'
                      ? 'bg-purple-600/10 border-purple-500/40 text-purple-200 shadow-md shadow-purple-900/10'
                      : 'bg-purple-50 border-purple-500 text-purple-700 shadow-md shadow-purple-100/30'
                    : theme === 'dark'
                    ? 'bg-zinc-900/40 border-white/5 hover:bg-zinc-900/80 hover:border-white/10 text-zinc-300'
                    : 'bg-zinc-100/50 border-zinc-200/60 hover:bg-zinc-200/50 hover:border-zinc-300 text-zinc-700'
                }`}
              >
                {/* Review Needed Alert dot */}
                {needsReview && (
                  <div className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Cần ôn tập hôm nay" />
                )}

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <p className={`font-medium text-xs truncate pr-3 transition-colors ${
                      theme === 'dark'
                        ? 'group-hover:text-purple-400'
                        : 'group-hover:text-purple-600'
                    }`}>
                      {dialogue.title}
                    </p>
                  </div>

                  {/* Level & Stats */}
                  <div className="flex flex-col gap-1.5">
                    <div className={`flex items-center gap-2 text-3xs ${
                      theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                    }`}>
                      {dialogue.lastScore !== undefined ? (
                        <span className={`flex items-center gap-0.5 font-bold ${
                          dialogue.lastScore >= 80 ? 'text-emerald-500' : dialogue.lastScore >= 50 ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          Thành thục: {dialogue.lastScore}%
                        </span>
                      ) : (
                        <span className={theme === 'dark' ? 'text-zinc-650' : 'text-zinc-400'}>Chưa học</span>
                      )}
                      <span>•</span>
                      <span>Luyện: {dialogue.practiceCount} lần</span>
                    </div>

                    {/* Level-specific completion badges */}
                    <div className="flex gap-1.5">
                      <span className={`text-[8px] font-extrabold border rounded flex items-center justify-center h-4 w-4 transition-colors duration-200 ${
                        (dialogue.levelScores?.shadow || 0) >= 80
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : (dialogue.levelScores?.shadow || 0) >= 50
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          : (dialogue.levelScores?.shadow || 0) > 0
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                          : theme === 'dark' ? 'bg-zinc-800 border-white/5 text-zinc-600' : 'bg-zinc-200/50 border-zinc-250 text-zinc-400'
                      }`} title={`Shadowing: ${dialogue.levelScores?.shadow || 0}%`}>S</span>

                      <span className={`text-[8px] font-extrabold border rounded flex items-center justify-center h-4 w-4 transition-colors duration-200 ${
                        (dialogue.levelScores?.copy || 0) >= 80
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : (dialogue.levelScores?.copy || 0) >= 50
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          : (dialogue.levelScores?.copy || 0) > 0
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                          : theme === 'dark' ? 'bg-zinc-800 border-white/5 text-zinc-600' : 'bg-zinc-200/50 border-zinc-250 text-zinc-400'
                      }`} title={`Copy Type: ${dialogue.levelScores?.copy || 0}%`}>C</span>

                      <span className={`text-[8px] font-extrabold border rounded flex items-center justify-center h-4 w-4 transition-colors duration-200 ${
                        (dialogue.levelScores?.type || 0) >= 80
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : (dialogue.levelScores?.type || 0) >= 50
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          : (dialogue.levelScores?.type || 0) > 0
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                          : theme === 'dark' ? 'bg-zinc-800 border-white/5 text-zinc-600' : 'bg-zinc-200/50 border-zinc-250 text-zinc-400'
                      }`} title={`Dictation: ${dialogue.levelScores?.type || 0}%`}>D</span>

                      <span className={`text-[8px] font-extrabold border rounded flex items-center justify-center h-4 w-4 transition-colors duration-200 ${
                        (dialogue.levelScores?.listen || 0) >= 80
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : (dialogue.levelScores?.listen || 0) >= 50
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          : (dialogue.levelScores?.listen || 0) > 0
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                          : theme === 'dark' ? 'bg-zinc-800 border-white/5 text-zinc-600' : 'bg-zinc-200/50 border-zinc-250 text-zinc-400'
                      }`} title={`Listening: ${dialogue.levelScores?.listen || 0}%`}>L</span>

                      <span className={`text-[8px] font-extrabold border rounded flex items-center justify-center h-4 w-4 transition-colors duration-200 ${
                        (dialogue.levelScores?.ai_chat || 0) >= 80
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : (dialogue.levelScores?.ai_chat || 0) >= 50
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          : (dialogue.levelScores?.ai_chat || 0) > 0
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                          : theme === 'dark' ? 'bg-zinc-800 border-white/5 text-zinc-600' : 'bg-zinc-200/50 border-zinc-250 text-zinc-400'
                      }`} title={`AI Chat: ${dialogue.levelScores?.ai_chat || 0}%`}>A</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex gap-1 flex-wrap">
                    {dialogue.tags.slice(0, 2).map(t => (
                      <span key={t} className={`text-4xs rounded-md px-1 py-0.5 ${
                        theme === 'dark'
                          ? 'bg-white/5 text-zinc-400'
                          : 'bg-zinc-200/60 text-zinc-600'
                      }`}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(dialogue);
                    }}
                    className={`p-1.5 rounded-lg transition-all md:opacity-0 group-hover:opacity-100 focus:opacity-100 max-md:opacity-85 ${
                      theme === 'dark'
                        ? 'text-zinc-550 hover:text-red-400 hover:bg-red-500/10'
                        : 'text-zinc-400 hover:text-red-600 hover:bg-red-50/80'
                    }`}
                    title="Xóa hội thoại"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight
                    size={14}
                    className={`transition-all ${
                      theme === 'dark'
                        ? 'text-zinc-600 group-hover:text-purple-400'
                        : 'text-zinc-400 group-hover:text-purple-600'
                    } ${
                      isSelected
                        ? theme === 'dark'
                          ? 'translate-x-0.5 text-purple-500'
                          : 'translate-x-0.5 text-purple-600'
                        : ''
                    }`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
