'use client';

import React, { useState } from 'react';
import { X, Calendar, Gift, CheckCircle, Sparkles, Award } from 'lucide-react';
import type { UserStats } from '../../types';

export interface AttendanceReward {
  dayOfWeek: number; // 1-7 (Mon-Sun)
  rewardType: 'xp' | 'creation' | 'multiplier';
  rewardValue: number;
  rewardLabel: string;
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: UserStats;
  rewardsConfig: AttendanceReward[];
  onCheckin: (reward: AttendanceReward, randomXpBonus: number) => void;
  theme: 'dark' | 'light';
}

export default function AttendanceModal({
  isOpen,
  onClose,
  userStats,
  rewardsConfig,
  onCheckin,
  theme,
}: AttendanceModalProps) {
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState<AttendanceReward | null>(null);
  const [xpBonus, setXpBonus] = useState(0);

  if (!isOpen) return null;

  // Day of week calculation: Mon=1, Tue=2, ..., Sun=7
  const today = new Date();
  let dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  if (dayOfWeek === 0) dayOfWeek = 7; // remap Sun to 7

  const todayStr = today.toLocaleDateString('sv'); // YYYY-MM-DD
  const alreadyCheckedInToday = userStats.lastCheckinDate === todayStr;

  const handleCheckinClick = () => {
    if (alreadyCheckedInToday) return;

    // Get today's reward config
    const todayReward = rewardsConfig.find((r) => r.dayOfWeek === dayOfWeek) || {
      dayOfWeek,
      rewardType: 'xp',
      rewardValue: 20,
      rewardLabel: '+20 XP',
    };

    // Calculate a random extra XP bonus (10 - 40 XP) as requested
    const extraXp = Math.floor(Math.random() * 31) + 10;

    onCheckin(todayReward, extraXp);
    setRewardClaimed(todayReward);
    setXpBonus(extraXp);
    setJustCheckedIn(true);
  };

  const getDayName = (dayNum: number): string => {
    if (dayNum === 7) return 'Chủ Nhật';
    return `Thứ ${dayNum + 1}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-colors duration-200 ${
        theme === 'dark'
          ? 'border-white/10 bg-zinc-900/95 text-zinc-100 shadow-purple-500/10'
          : 'border-zinc-200 bg-white text-zinc-900 shadow-zinc-300/50'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-5 py-4 flex-shrink-0 ${
          theme === 'dark' ? 'border-white/5' : 'border-zinc-150'
        }`}>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <Calendar size={18} />
            </div>
            <h2 className="text-md font-bold tracking-wide">Điểm Danh Hàng Tuần</h2>
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

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {justCheckedIn && rewardClaimed ? (
            /* Animation Success View */
            <div className="text-center py-6 space-y-4 animate-scale-up relative">
              {/* Simulated fireworks using animated divs */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping absolute -top-4 -left-10" />
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-ping absolute -top-8 -right-16" />
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping absolute bottom-4 -left-12" />
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-ping absolute bottom-12 -right-8" />
              </div>

              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-md font-bold text-emerald-500">Điểm Danh Thành Công!</h3>
                <p className="text-2xs text-zinc-400 leading-relaxed">
                  Hệ thống ghi nhận điểm danh liên tục: <span className="text-amber-500 font-bold">{userStats.checkinStreak || 1} ngày</span>.
                </p>
              </div>

              {/* Reward detail cards */}
              <div className={`p-4 rounded-2xl max-w-xs mx-auto border space-y-2.5 ${
                theme === 'dark' ? 'bg-zinc-950/40 border-white/5' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="flex items-center justify-center gap-2 text-purple-400 font-bold text-xs">
                  <Gift size={14} />
                  Nhận: {rewardClaimed.rewardLabel}
                </div>
                <div className="flex items-center justify-center gap-2 text-emerald-450 font-bold text-xs">
                  <Sparkles size={14} />
                  Kèm bonus ngẫu nhiên: +{xpBonus} XP
                </div>
              </div>

              <button
                onClick={() => {
                  setJustCheckedIn(false);
                  setRewardClaimed(null);
                }}
                className="rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-purple-500 transition-all"
              >
                Tuyệt vời
              </button>
            </div>
          ) : (
            /* Weekly Calendar Calendar View */
            <div className="space-y-6">
              {/* Banner Streak Card */}
              <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-4xs text-purple-400 font-bold uppercase tracking-wider block">Chuỗi học tập</span>
                  <h3 className="text-sm font-black text-white">Chuỗi điểm danh: {userStats.checkinStreak || 0} ngày</h3>
                  <p className="text-4xs text-zinc-400">Điểm danh liên tục hàng ngày để nhận phần thưởng xịn hơn!</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Award size={24} />
                </div>
              </div>

              {/* 7 Days List Grid */}
              <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                  const reward = rewardsConfig.find((r) => r.dayOfWeek === dayNum);
                  const isChecked = userStats.checkinHistory?.includes(dayNum);
                  const isToday = dayOfWeek === dayNum;
                  
                  // Accent classes
                  let cardClass = 'border transition-all duration-300 rounded-xl p-2 flex flex-col items-center justify-between h-24 ';
                  if (isChecked) {
                    cardClass += theme === 'dark' 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                      : 'bg-emerald-50 border-emerald-250 text-emerald-700 font-semibold';
                  } else if (isToday) {
                    cardClass += alreadyCheckedInToday
                      ? (theme === 'dark' ? 'bg-zinc-950/20 border-white/5 text-zinc-550' : 'bg-zinc-100 border-zinc-200 text-zinc-400')
                      : (theme === 'dark' ? 'bg-purple-600/10 border-purple-500/40 text-purple-400 scale-[1.03] shadow-md shadow-purple-500/5 animate-pulse' : 'bg-purple-50 border-purple-300 text-purple-700 scale-[1.03] shadow-sm animate-pulse');
                  } else {
                    cardClass += theme === 'dark'
                      ? 'bg-zinc-950/20 border-white/5 text-zinc-500'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-500';
                  }

                  return (
                    <div key={dayNum} className={cardClass}>
                      <span className="text-[9px] uppercase font-bold tracking-tight">
                        T{dayNum + 1 === 8 ? 'CN' : dayNum + 1}
                      </span>
                      
                      <div className="flex flex-col items-center justify-center">
                        {isChecked ? (
                          <CheckCircle size={16} className="text-emerald-500 animate-bounce" />
                        ) : (
                          <Gift size={16} className={isToday && !alreadyCheckedInToday ? 'text-purple-400 animate-wiggle' : 'opacity-40'} />
                        )}
                      </div>

                      <span className="text-[8px] text-center font-semibold leading-tight line-clamp-2" title={reward?.rewardLabel}>
                        {reward ? reward.rewardLabel.split(' ')[0] + ' ' + (reward.rewardLabel.split(' ')[1] || '') : ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Action check-in button */}
              <div className="pt-2 text-center">
                {alreadyCheckedInToday ? (
                  <button
                    disabled
                    className={`w-full max-w-xs py-3 px-6 rounded-xl font-bold text-xs border bg-zinc-200/5 cursor-not-allowed ${
                      theme === 'dark' ? 'border-white/5 text-zinc-500' : 'border-zinc-200 text-zinc-400'
                    }`}
                  >
                    Hôm Nay Bạn Đã Điểm Danh Rồi
                  </button>
                ) : (
                  <button
                    onClick={handleCheckinClick}
                    className="w-full max-w-xs py-3 px-6 rounded-xl font-bold text-xs bg-purple-650 text-white shadow-lg shadow-purple-600/25 hover:bg-purple-550 active:scale-95 transition-all"
                  >
                    Bấm Điểm Danh Hôm Nay!
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
