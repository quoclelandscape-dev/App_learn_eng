'use client';

import React, { useState } from 'react';
import { User, Calendar, Briefcase, Award, Sparkles, RefreshCw } from 'lucide-react';
import type { UserStats } from '../../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onSave: (profileData: {
    username: string;
    age: number;
    job: string;
    learningNeed: string;
    avatarUrl: string;
  }) => void;
  theme: 'dark' | 'light';
}

const PRESET_SEEDS = ['Sora', 'Luna', 'Kira', 'Yuki', 'Aki', 'Ren', 'Haru', 'Momo'];

const GOAL_OPTIONS = [
  'Hỗ trợ công việc',
  'Để đi du lịch',
  'Để giao lưu học hỏi bạn bè quốc tế',
  'Để thử thách bản thân',
];

export default function OnboardingModal({ isOpen, onSave, theme }: OnboardingModalProps) {
  const [username, setUsername] = useState('');
  const [age, setAge] = useState<number>(20);
  const [job, setJob] = useState('');
  const [learningNeed, setLearningNeed] = useState(GOAL_OPTIONS[0]);
  const [avatarSeed, setAvatarSeed] = useState(PRESET_SEEDS[0]);
  const [customSeed, setCustomSeed] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAvatarUrl = `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(
    customSeed.trim() !== '' ? customSeed : avatarSeed
  )}`;

  const handleRandomize = () => {
    const randomIdx = Math.floor(Math.random() * PRESET_SEEDS.length);
    setAvatarSeed(PRESET_SEEDS[randomIdx]);
    setCustomSeed('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Vui lòng điền họ tên của bạn.');
      return;
    }
    if (!job.trim()) {
      setError('Vui lòng điền nghề nghiệp/công việc.');
      return;
    }
    if (age <= 0 || age > 120) {
      setError('Tuổi không hợp lệ.');
      return;
    }

    onSave({
      username: username.trim(),
      age: Number(age),
      job: job.trim(),
      learningNeed,
      avatarUrl: customSeed.trim() !== '' ? customSeed.trim() : avatarSeed,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className={`w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
        theme === 'dark'
          ? 'border-white/10 bg-zinc-950 text-zinc-100 shadow-purple-500/10'
          : 'border-zinc-200 bg-white text-zinc-900 shadow-zinc-400/50'
      }`}>
        
        {/* Upper Accent Header */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 p-6 text-center text-white relative">
          <div className="absolute top-4 right-4 animate-pulse">
            <Sparkles size={16} />
          </div>
          <h2 className="text-lg font-black tracking-wide">Chào mừng bạn đến với ShadowDictate!</h2>
          <p className="text-2xs opacity-90 mt-1">Hãy thiết lập hồ sơ học tập để bắt đầu đua top nhé.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
          {error && (
            <div className="p-3 text-3xs rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-455 font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* Avatar Showcase & Config */}
          <div className="flex flex-col items-center space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Avatar Anime Của Bạn
            </label>
            <div className="relative group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 blur opacity-30 group-hover:opacity-60 transition-opacity" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentAvatarUrl}
                className="relative w-24 h-24 rounded-full border-2 border-purple-500 bg-zinc-900/40 p-1 shadow-lg transition-transform duration-300 group-hover:scale-105"
                alt="Anime Avatar"
              />
              <button
                type="button"
                onClick={handleRandomize}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-purple-600 text-white shadow-md hover:bg-purple-500 transition-all active:scale-90"
                title="Chọn ngẫu nhiên"
              >
                <RefreshCw size={12} className="animate-spin-slow" />
              </button>
            </div>

            {/* Presets Grid */}
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {PRESET_SEEDS.map((seed) => (
                <button
                  key={seed}
                  type="button"
                  onClick={() => {
                    setAvatarSeed(seed);
                    setCustomSeed('');
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold transition-all ${
                    (customSeed === '' && avatarSeed === seed)
                      ? 'bg-purple-600 border-purple-500 text-white scale-105'
                      : theme === 'dark'
                      ? 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-650 hover:bg-zinc-200'
                  }`}
                >
                  {seed}
                </button>
              ))}
            </div>

            {/* Custom Avatar Seed Input */}
            <div className="w-full space-y-1">
              <input
                type="text"
                placeholder="Hoặc tự gõ ký tự bất kỳ để sinh avatar khác..."
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value)}
                className={`w-full text-center rounded-xl border px-3 py-1.5 text-xs outline-none ${
                  theme === 'dark'
                    ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-600 focus:border-purple-500/50'
                    : 'border-zinc-350 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:border-purple-500 focus:bg-white'
                }`}
              />
            </div>
          </div>

          <div className="border-t border-dashed border-zinc-700/20 my-4" />

          {/* Form Fields */}
          <div className="space-y-3.5">
            {/* Username */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-450">
                <User size={12} className="text-purple-400" />
                Họ và Tên / Biệt Danh
              </label>
              <input
                type="text"
                placeholder="Nhập tên hiển thị trên bảng xếp hạng"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2 text-base outline-none ${
                  theme === 'dark'
                    ? 'border-white/10 bg-white/5 text-zinc-100 focus:border-purple-500/50'
                    : 'border-zinc-300 bg-zinc-50 text-zinc-900 focus:border-purple-500 focus:bg-white'
                }`}
              />
            </div>

            {/* Age & Job */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-450">
                  <Calendar size={12} className="text-purple-400" />
                  Tuổi
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className={`w-full rounded-xl border px-3.5 py-2 text-base outline-none ${
                    theme === 'dark'
                      ? 'border-white/10 bg-white/5 text-zinc-100 focus:border-purple-500/50'
                      : 'border-zinc-300 bg-zinc-50 text-zinc-900 focus:border-purple-500 focus:bg-white'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-450">
                  <Briefcase size={12} className="text-purple-400" />
                  Công việc / Học sinh
                </label>
                <input
                  type="text"
                  placeholder="Học sinh, Lập trình viên..."
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2 text-base outline-none ${
                    theme === 'dark'
                      ? 'border-white/10 bg-white/5 text-zinc-100 focus:border-purple-500/50'
                      : 'border-zinc-300 bg-zinc-50 text-zinc-900 focus:border-purple-500 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            {/* Goal Select */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-450">
                <Award size={12} className="text-purple-400" />
                Nhu Cầu Học Tập
              </label>
              <select
                value={learningNeed}
                onChange={(e) => setLearningNeed(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2 text-base outline-none ${
                  theme === 'dark'
                    ? 'border-white/10 bg-zinc-900 text-zinc-100 focus:border-purple-500/50'
                    : 'border-zinc-300 bg-zinc-50 text-zinc-900 focus:border-purple-500'
                }`}
              >
                {GOAL_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white shadow-lg hover:bg-purple-500 active:scale-[0.98] transition-all pt-2.5 mt-2"
          >
            <Sparkles size={16} />
            Bắt đầu học ngay
          </button>
        </form>
      </div>
    </div>
  );
}
