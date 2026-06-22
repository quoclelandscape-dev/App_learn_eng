'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Save, ArrowLeft, RefreshCw, Sparkles, CheckCircle2, AlertTriangle, LogOut, ShieldCheck } from 'lucide-react';
import { getAttendanceConfig, saveAttendanceConfig } from '../../../utils/supabase';
import type { AttendanceReward } from '../../../components/modals/AttendanceModal';

const DEFAULT_FALLBACK_REWARDS: AttendanceReward[] = [
  { dayOfWeek: 1, rewardType: 'multiplier', rewardValue: 2, rewardLabel: 'Nhân 2 kinh nghiệm (x2 XP)' },
  { dayOfWeek: 2, rewardType: 'creation', rewardValue: 1, rewardLabel: 'Thêm 1 lượt tạo bài học' },
  { dayOfWeek: 3, rewardType: 'xp', rewardValue: 50, rewardLabel: '+50 XP thưởng' },
  { dayOfWeek: 4, rewardType: 'creation', rewardValue: 2, rewardLabel: 'Thêm 2 lượt tạo bài học' },
  { dayOfWeek: 5, rewardType: 'xp', rewardValue: 100, rewardLabel: '+100 XP thưởng' },
  { dayOfWeek: 6, rewardType: 'multiplier', rewardValue: 3, rewardLabel: 'Nhân 3 kinh nghiệm (x3 XP)' },
  { dayOfWeek: 7, rewardType: 'creation', rewardValue: 3, rewardLabel: 'Thêm 3 lượt tạo bài học' },
];

export default function AdminSetupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [rewards, setRewards] = useState<AttendanceReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Check login status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('shadowdictate_theme');
      if (storedTheme === 'light') setTheme('light');
      
      const adminToken = localStorage.getItem('shadowdictate_admin_session');
      if (adminToken === 'authenticated') {
        setIsLoggedIn(true);
      }
    }
  }, []);

  // Fetch configs once logged in
  useEffect(() => {
    if (isLoggedIn) {
      const loadConfig = async () => {
        setLoading(true);
        try {
          const config = await getAttendanceConfig();
          if (config && config.length === 7) {
            setRewards(config);
          } else {
            setRewards(DEFAULT_FALLBACK_REWARDS);
          }
        } catch (e) {
          console.error('Failed to load attendance config:', e);
          setRewards(DEFAULT_FALLBACK_REWARDS);
        } finally {
          setLoading(false);
        }
      };
      loadConfig();
    }
  }, [isLoggedIn]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    // Verify email and password
    if (email === 'quocle.landscape@gmail.com' && password === '211061995@Vip') {
      setIsLoggedIn(true);
      localStorage.setItem('shadowdictate_admin_session', 'authenticated');
    } else {
      setLoginError('Email hoặc mật khẩu quản trị không chính xác.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('shadowdictate_admin_session');
    setEmail('');
    setPassword('');
  };

  const handleRewardFieldChange = (dayNum: number, field: keyof AttendanceReward, value: any) => {
    setRewards(prev =>
      prev.map(r => (r.dayOfWeek === dayNum ? { ...r, [field]: value } : r))
    );
  };

  const handleSaveConfig = async () => {
    setSaveStatus('saving');
    try {
      await saveAttendanceConfig(rewards);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save config:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  return (
    <div className={`min-h-screen w-screen overflow-x-hidden flex flex-col font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
    }`}>
      {/* Upper Navigation Bar */}
      <header className={`px-6 py-4 border-b flex items-center justify-between transition-colors ${
        theme === 'dark' ? 'border-white/10 bg-zinc-950/80' : 'border-zinc-200 bg-white shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className={`flex items-center gap-1.5 text-xs font-bold ${
              theme === 'dark' ? 'text-zinc-450 hover:text-zinc-200' : 'text-zinc-650 hover:text-zinc-900'
            }`}
          >
            <ArrowLeft size={14} /> Quay lại App
          </a>
          <span className="text-zinc-700">|</span>
          <span className="text-xs font-black uppercase tracking-wider text-purple-500 flex items-center gap-1">
            <ShieldCheck size={14} /> Admin Setup Panel
          </span>
        </div>
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
              theme === 'dark' ? 'border-white/10 hover:bg-white/5 text-zinc-350' : 'border-zinc-300 hover:bg-zinc-100 text-zinc-700 shadow-sm'
            }`}
          >
            <LogOut size={13} /> Đăng xuất
          </button>
        )}
      </header>

      {/* Main content display */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        {!isLoggedIn ? (
          /* Login Form Window */
          <div className={`w-full max-w-sm rounded-3xl border shadow-2xl p-6 space-y-6 animate-fade-in ${
            theme === 'dark'
              ? 'border-white/10 bg-zinc-900/95 text-zinc-100 shadow-purple-500/5'
              : 'border-zinc-200 bg-white text-zinc-900 shadow-zinc-300/50'
          }`}>
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
                <Lock size={22} className="animate-pulse" />
              </div>
              <h1 className="text-md font-bold tracking-wide pt-1">Xác Thực Quản Trị Viên</h1>
              <p className="text-3xs text-zinc-500 leading-relaxed">
                Nhập tài khoản quản trị để điều chỉnh phần thưởng hoạt động điểm danh trong tuần.
              </p>
            </div>

            {loginError && (
              <div className="p-3 text-3xs rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-455 font-semibold">
                ⚠️ {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block">Email Admin</label>
                <input
                  type="email"
                  placeholder="quocle.landscape@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2 text-base outline-none ${
                    theme === 'dark'
                      ? 'border-white/10 bg-white/5 text-zinc-100 focus:border-purple-500/50'
                      : 'border-zinc-350 bg-zinc-50 text-zinc-900 focus:border-purple-500 focus:bg-white'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block">Mật khẩu</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2 text-base outline-none ${
                    theme === 'dark'
                      ? 'border-white/10 bg-white/5 text-zinc-100 focus:border-purple-500/50'
                      : 'border-zinc-350 bg-zinc-50 text-zinc-900 focus:border-purple-500 focus:bg-white'
                  }`}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-650 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-550 active:scale-95 transition-all pt-2.5 mt-2"
              >
                Xác nhận Đăng nhập
              </button>
            </form>
          </div>
        ) : (
          /* Config Admin Panel View */
          <div className={`w-full max-w-4xl rounded-3xl border shadow-xl p-6 md:p-8 space-y-6 ${
            theme === 'dark'
              ? 'border-white/10 bg-zinc-900/60 text-zinc-100'
              : 'border-zinc-200 bg-white text-zinc-900'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dashed border-zinc-700/20 pb-5">
              <div className="space-y-1">
                <h1 className="text-md font-bold tracking-wide flex items-center gap-1.5">
                  <Sparkles className="text-purple-400 animate-pulse" size={18} />
                  Điều Chỉnh Phần Thưởng Điểm Danh Tuần
                </h1>
                <p className="text-3xs text-zinc-500 leading-relaxed">
                  Thiết lập phần thưởng điểm danh từ Thứ 2 đến Chủ nhật. Các tùy chọn bao gồm nhận điểm XP, nhận thêm lượt tạo bài học (giúp vượt giới hạn 50 bài), hoặc nhân đôi/nhân ba XP luyện tập.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveConfig}
                  disabled={saveStatus === 'saving' || loading}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-650 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/10 hover:bg-purple-550 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Save size={14} />
                  {saveStatus === 'saving' ? 'Đang lưu...' : 'Lưu cấu hình'}
                </button>
              </div>
            </div>

            {/* Config Form Status Messages */}
            {saveStatus === 'success' && (
              <div className="p-3 text-3xs rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-450 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>Lưu cấu hình phần thưởng lên hệ thống thành công! Dữ liệu sẽ tự động đồng bộ trên thiết bị của các học viên.</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="p-3 text-3xs rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-455 font-semibold flex items-center gap-1.5">
                <AlertTriangle size={14} />
                <span>Không thể lưu cấu hình. Có lỗi xảy ra trong kết nối Supabase, hãy thử lại sau.</span>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <RefreshCw className="animate-spin text-purple-500" size={28} />
                <span className="text-2xs text-zinc-550">Đang tải cấu hình phần thưởng từ database...</span>
              </div>
            ) : (
              /* Grid Config */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.map((reward) => {
                  const dayLabels = {
                    1: 'Thứ 2',
                    2: 'Thứ 3',
                    3: 'Thứ 4',
                    4: 'Thứ 5',
                    5: 'Thứ 6',
                    6: 'Thứ 7',
                    7: 'Chủ Nhật',
                  }[reward.dayOfWeek] || '';

                  return (
                    <div
                      key={reward.dayOfWeek}
                      className={`p-4 rounded-2xl border space-y-3.5 transition-all ${
                        theme === 'dark'
                          ? 'bg-zinc-950/20 border-white/5 hover:border-purple-500/20'
                          : 'bg-zinc-50 border-zinc-200 hover:border-purple-300 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-center border-b border-dashed border-zinc-700/20 pb-2">
                        <span className="text-xs font-black text-purple-400">{dayLabels}</span>
                        <span className="text-[10px] text-zinc-500 font-medium">Day {reward.dayOfWeek}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Reward Type selection dropdown */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Loại thưởng</label>
                          <select
                            value={reward.rewardType}
                            onChange={(e) => handleRewardFieldChange(reward.dayOfWeek, 'rewardType', e.target.value)}
                            className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${
                              theme === 'dark'
                                ? 'border-white/10 bg-zinc-900 text-zinc-100'
                                : 'border-zinc-300 bg-white text-zinc-900'
                            }`}
                          >
                            <option value="xp">Kinh nghiệm (XP)</option>
                            <option value="creation">Lượt tạo hội thoại</option>
                            <option value="multiplier">Hệ số nhân (Multiplier)</option>
                          </select>
                        </div>

                        {/* Reward Value input */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Giá trị thưởng</label>
                          <input
                            type="number"
                            min="1"
                            value={reward.rewardValue}
                            onChange={(e) => handleRewardFieldChange(reward.dayOfWeek, 'rewardValue', Number(e.target.value))}
                            className={`w-full rounded-xl border px-3 py-1.5 text-base outline-none ${
                              theme === 'dark'
                                ? 'border-white/10 bg-zinc-900 text-zinc-100'
                                : 'border-zinc-350 bg-white text-zinc-900'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Display Label text input */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Nhãn hiển thị (Label)</label>
                        <input
                          type="text"
                          value={reward.rewardLabel}
                          onChange={(e) => handleRewardFieldChange(reward.dayOfWeek, 'rewardLabel', e.target.value)}
                          className={`w-full rounded-xl border px-3 py-1.5 text-base outline-none ${
                            theme === 'dark'
                              ? 'border-white/10 bg-zinc-900 text-zinc-100'
                              : 'border-zinc-350 bg-white text-zinc-900'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
