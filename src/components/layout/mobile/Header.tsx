'use client';

import React from 'react';
import { Flame, Award, Sun, Moon, Settings as SettingsIcon, Plus, Calendar, Shield } from 'lucide-react';
import type { UserStats } from '../../../types';

interface HeaderProps {
  userStats: UserStats;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  onSettingsClick: () => void;
  onAddClick: () => void;
  onAttendanceClick: () => void;
  onLeaderboardClick: () => void;
}

export default function Header({
  userStats,
  theme,
  onThemeToggle,
  onSettingsClick,
  onAddClick,
  onAttendanceClick,
  onLeaderboardClick,
}: HeaderProps) {
  return (
    <div className={`px-4 py-2.5 border-b flex flex-col gap-2.5 sticky top-0 z-30 backdrop-blur-md transition-all duration-200 ${
      theme === 'dark'
        ? 'bg-zinc-950/80 border-white/5 text-zinc-100'
        : 'bg-white/90 border-zinc-200 text-zinc-900 shadow-sm'
    }`}>
      {/* Row 1: Logo & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-purple-500/20">
            SD
          </div>
          <span className={`font-bold tracking-wider text-xs bg-gradient-to-r ${
            theme === 'dark' ? 'from-purple-400 to-indigo-300' : 'from-purple-600 to-indigo-500'
          } bg-clip-text text-transparent`}>
            ShadowDictate
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onThemeToggle}
            className={`rounded-lg p-1.5 transition-colors active:scale-95 border ${
              theme === 'dark'
                ? 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-100'
                : 'bg-zinc-100 border-zinc-250 text-zinc-650 hover:text-zinc-900 shadow-xs'
            }`}
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <button
            onClick={onSettingsClick}
            className={`rounded-lg p-1.5 transition-colors active:scale-95 border ${
              theme === 'dark'
                ? 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-100'
                : 'bg-zinc-100 border-zinc-250 text-zinc-650 hover:text-zinc-900 shadow-xs'
            }`}
          >
            <SettingsIcon size={13} />
          </button>
          <button
            onClick={onAddClick}
            className="rounded-lg p-1.5 bg-purple-600 text-white hover:bg-purple-500 active:scale-95 shadow-md shadow-purple-500/10"
          >
            <Plus size={13} />
          </button>
          <a
            href="/admin/setup-app-operations"
            className={`rounded-lg p-1.5 transition-colors active:scale-95 border ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                : 'bg-zinc-100 border-zinc-250 text-zinc-650 hover:bg-zinc-200 shadow-xs'
            }`}
            title="Cấu hình quản trị"
          >
            <Shield size={13} />
          </a>
        </div>
      </div>

      {/* Row 2: Stats & Quick Access */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          {/* Streak */}
          <div className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${
            theme === 'dark'
              ? 'bg-orange-500/5 border-orange-500/10 text-orange-400'
              : 'bg-orange-50 border-orange-100 text-orange-650'
          }`}>
            <Flame size={12} className="animate-pulse text-orange-500" />
            <span className="text-[10px] font-bold">{userStats.streak}d</span>
          </div>

          {/* XP */}
          <div className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${
            theme === 'dark'
              ? 'bg-purple-500/5 border-purple-500/10 text-purple-400'
              : 'bg-purple-50 border-purple-100 text-purple-650'
          }`}>
            <Award size={12} className="text-purple-550" />
            <span className="text-[10px] font-bold">{userStats.totalXP} XP</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Attendance Check-in */}
          <button
            onClick={onAttendanceClick}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg border text-[10px] font-bold transition-all active:scale-95 ${
              theme === 'dark'
                ? 'bg-purple-600/10 border-purple-500/20 text-purple-400 hover:bg-purple-600/20'
                : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 shadow-xs'
            }`}
          >
            <Calendar size={11} className="text-purple-400" />
            <span>Điểm danh</span>
          </button>

          {/* Leaderboard Top */}
          <button
            onClick={onLeaderboardClick}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg border text-[10px] font-bold transition-all active:scale-95 ${
              theme === 'dark'
                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
                : 'bg-yellow-50 border-yellow-250 text-yellow-750 hover:bg-yellow-100 shadow-xs'
            }`}
          >
            <Award size={11} className="text-yellow-500" />
            <span>Top</span>
          </button>
        </div>
      </div>
    </div>
  );
}
