'use client';

import React from 'react';
import { X, Award, Flame, User, Trophy, ShieldAlert } from 'lucide-react';
import type { UserStats } from '../../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboardData: UserStats[];
  currentUserStats: UserStats;
  currentUserStatsId: string;
  theme: 'dark' | 'light';
}

export default function LeaderboardModal({
  isOpen,
  onClose,
  leaderboardData,
  currentUserStats,
  currentUserStatsId,
  theme,
}: LeaderboardModalProps) {
  if (!isOpen) return null;

  // Check if current user is in top 10
  const isCurrentUserInTop = leaderboardData.some(
    (u) => `stats_${u.avatarUrl /* Wait, no, the ID in DB corresponds to the device id. Let's match by username or XP/streak or check the ID */}`
    // Wait, in Supabase query, we loaded rows mapped to UserStats type.
    // How do we match the current user?
    // We can pass the current user's username or match stats by comparing their properties!
    // Since stats row has 'username', we can match by username!
    // If stats has username:
  );

  // Match by username or stats values
  const isMatchUser = (user: UserStats) => {
    return user.username === currentUserStats.username && user.totalXP === currentUserStats.totalXP;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-zinc-950 font-black shadow-md border border-amber-300">
          👑
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-350 text-zinc-950 font-black shadow-md border border-slate-200">
          🥈
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black shadow-md border border-amber-600">
          🥉
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center w-6 h-6 text-2xs text-zinc-500 font-bold">
        {rank}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors duration-200 ${
        theme === 'dark'
          ? 'border-white/10 bg-zinc-900/95 text-zinc-100'
          : 'border-zinc-200 bg-white text-zinc-900'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-5 py-4 flex-shrink-0 bg-gradient-to-r ${
          theme === 'dark'
            ? 'from-zinc-950/40 via-purple-950/10 to-zinc-950/40 border-white/5'
            : 'from-zinc-50 via-purple-50/20 to-zinc-50 border-zinc-150'
        }`}>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-yellow-500/10 p-2 text-yellow-500">
              <Trophy size={18} />
            </div>
            <h2 className="text-md font-bold tracking-wide">Bảng Xếp Hạng Đua Top</h2>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-1.5 transition-colors ${
              theme === 'dark' ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-550 hover:bg-zinc-100'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Leaderboard List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
          {leaderboardData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
              <ShieldAlert size={32} className="text-zinc-550 animate-bounce" />
              <p className="text-xs text-zinc-500">Chưa có dữ liệu bảng xếp hạng.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboardData.map((user, idx) => {
                const rank = idx + 1;
                const isCurrent = isMatchUser(user);
                const userAvatarUrl = `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(
                  user.avatarUrl || 'Sora'
                )}`;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
                      isCurrent
                        ? theme === 'dark'
                          ? 'bg-purple-600/15 border-purple-500/40 text-purple-200 scale-[1.01] shadow-inner'
                          : 'bg-purple-100/50 border-purple-300 text-purple-800 scale-[1.01] shadow-sm font-semibold'
                        : theme === 'dark'
                        ? 'bg-zinc-950/20 border-white/5 hover:bg-zinc-950/40 text-zinc-300'
                        : 'bg-zinc-100/40 border-zinc-200/60 hover:bg-zinc-100 text-zinc-750'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Indicator */}
                      <div className="w-6 flex items-center justify-center flex-shrink-0">
                        {getRankBadge(rank)}
                      </div>

                      {/* Avatar preview */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={userAvatarUrl}
                        alt={`${user.username || 'User'}'s avatar`}
                        className="w-10 h-10 rounded-full border border-zinc-700/25 bg-zinc-900/40 p-0.5 flex-shrink-0"
                      />

                      {/* User Info */}
                      <div className="min-w-0 flex flex-col justify-center">
                        <span className="text-xs font-bold truncate">
                          {user.username || 'Học viên ẩn danh'}
                          {isCurrent && <span className="text-3xs font-extrabold ml-1.5 px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/25 text-purple-400">Bạn</span>}
                        </span>
                        <span className="text-[9px] text-zinc-500 flex items-center gap-2">
                          <span>{user.job || 'Công việc tự do'}</span>
                          <span>•</span>
                          <span>{user.learningNeed || 'Thử thách bản thân'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Stats Score */}
                    <div className="flex flex-col items-end flex-shrink-0 pl-2">
                      <span className="text-xs font-extrabold text-purple-400">
                        {user.totalXP} XP
                      </span>
                      <span className="text-[9px] text-orange-500 font-semibold flex items-center gap-0.5">
                        <Flame size={10} />
                        {user.streak || 0} ngày
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Current User Stats footer (shows position if user is not in top 10) */}
        <div className={`p-4 border-t flex-shrink-0 ${
          theme === 'dark' ? 'border-white/5 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(
                  currentUserStats.avatarUrl || 'Sora'
                )}`}
                className="w-8 h-8 rounded-full border border-zinc-700/25 bg-zinc-900/40 p-0.5"
                alt="My Avatar"
              />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Điểm của bạn</span>
                <span className="text-xs font-black">{currentUserStats.username || 'Chưa thiết lập'}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-purple-400">{currentUserStats.totalXP} XP</span>
              <div className="text-[10px] text-zinc-500 font-bold">{currentUserStats.streak} ngày streak</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
