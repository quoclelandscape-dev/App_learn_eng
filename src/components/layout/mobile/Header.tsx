'use client';

import React from 'react';
import { Flame, Award, Sun, Moon, Settings as SettingsIcon, Plus } from 'lucide-react';
import type { UserStats } from '../../../types';

interface HeaderProps {
  userStats: UserStats;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  onSettingsClick: () => void;
  onAddClick: () => void;
}

export default function Header({
  userStats,
  theme,
  onThemeToggle,
  onSettingsClick,
  onAddClick,
}: HeaderProps) {
  return (
    <div className={`p-4 border-b flex flex-col gap-3 sticky top-0 z-30 backdrop-blur-md transition-all duration-200 ${
      theme === 'dark'
        ? 'bg-zinc-950/80 border-white/5 text-zinc-100'
        : 'bg-white/90 border-zinc-200 text-zinc-900 shadow-sm'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-sm tracking-tighter text-white shadow-md shadow-purple-500/20">
            SD
          </div>
          <span className={`font-semibold tracking-wider text-sm bg-gradient-to-r ${
            theme === 'dark' ? 'from-purple-400 to-indigo-300' : 'from-purple-600 to-indigo-500'
          } bg-clip-text text-transparent`}>
            ShadowDictate
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onThemeToggle}
            className={`rounded-xl p-2.5 transition-colors active:scale-95 ${
              theme === 'dark'
                ? 'bg-white/5 text-zinc-400 hover:text-zinc-100'
                : 'bg-zinc-100 text-zinc-650 hover:text-zinc-900 shadow-sm'
            }`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={onSettingsClick}
            className={`rounded-xl p-2.5 transition-colors active:scale-95 ${
              theme === 'dark'
                ? 'bg-white/5 text-zinc-400 hover:text-zinc-100'
                : 'bg-zinc-100 text-zinc-650 hover:text-zinc-900 shadow-sm'
            }`}
          >
            <SettingsIcon size={15} />
          </button>
          <button
            onClick={onAddClick}
            className="rounded-xl p-2.5 bg-purple-600 text-white hover:bg-purple-500 active:scale-95 shadow-md shadow-purple-500/10"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-2">
        <div className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-3 py-2 ${
          theme === 'dark'
            ? 'bg-orange-500/5 border-orange-500/10 text-orange-400'
            : 'bg-orange-50 border-orange-100 text-orange-600'
        }`}>
          <Flame size={15} className="animate-pulse" />
          <div className="flex items-center gap-1 text-[11px] font-bold">
            <span className="opacity-70 text-3xs font-medium uppercase tracking-wider block">Streak:</span>
            <span>{userStats.streak} ngày</span>
          </div>
        </div>

        <div className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-3 py-2 ${
          theme === 'dark'
            ? 'bg-purple-500/5 border-purple-500/10 text-purple-400'
            : 'bg-purple-50 border-purple-100 text-purple-600'
        }`}>
          <Award size={15} />
          <div className="flex items-center gap-1 text-[11px] font-bold">
            <span className="opacity-70 text-3xs font-medium uppercase tracking-wider block">XP:</span>
            <span>{userStats.totalXP}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
