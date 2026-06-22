'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Volume2, Gauge, Info, Save, Settings as SettingsIcon } from 'lucide-react';
import type { Settings } from '../../../types';
import { getAvailableVoices } from '../../../utils/speech';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Settings) => void;
  currentSettings: Settings;
  theme: 'dark' | 'light';
}

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
  currentSettings,
  theme,
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(currentSettings.geminiApiKey);
  const [voiceName, setVoiceName] = useState(currentSettings.voiceName);
  const [speechRate, setSpeechRate] = useState(currentSettings.speechRate);
  const [showConfidence, setShowConfidence] = useState(currentSettings.showConfidence);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (isOpen) {
      const loadVoices = () => {
        const list = getAvailableVoices();
        const enVoices = list.filter(v => v.lang.startsWith('en'));
        setVoices(enVoices.length > 0 ? enVoices : list);
      };

      loadVoices();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      geminiApiKey: apiKey,
      voiceName,
      speechRate,
      showConfidence,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className={`w-full max-h-[88vh] overflow-hidden flex flex-col rounded-t-3xl border shadow-2xl transition-colors duration-200 ${
        theme === 'dark'
          ? 'border-white/10 bg-zinc-900/95 text-zinc-100 shadow-purple-500/10'
          : 'border-zinc-200 bg-white text-zinc-900 shadow-zinc-300/50'
      }`}>
        
        {/* Drag handle decoration */}
        <div className="flex justify-center py-2.5 flex-shrink-0">
          <div className={`w-12 h-1.5 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-250'}`} />
        </div>

        {/* Header */}
        <div className={`flex items-center justify-between border-b px-5 pb-4 ${theme === 'dark' ? 'border-white/5' : 'border-zinc-150'}`}>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-50/10 p-2 text-purple-400">
              <SettingsIcon size={18} />
            </div>
            <h2 className="text-md font-bold tracking-wide">Cài Đặt Hệ Thống</h2>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-1.5 transition-colors ${theme === 'dark' ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-550 hover:bg-zinc-100'}`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-3xs font-semibold uppercase tracking-wider text-zinc-400">
              <Key size={13} className="text-purple-400" />
              Gemini API Key
            </label>
            <input
              type="password"
              placeholder="Nhập API Key để sử dụng các tính năng AI"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-base outline-none transition-all ${
                theme === 'dark'
                  ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-500 focus:border-purple-500/50'
                  : 'border-zinc-300 bg-zinc-50 text-zinc-955 placeholder-zinc-450 focus:border-purple-500'
              }`}
            />
            <p className="flex items-start gap-1.5 text-3xs text-zinc-500 leading-relaxed">
              <Info size={12} className="mt-0.5 flex-shrink-0 text-zinc-450" />
              Để trống sẽ sử dụng hệ thống API Key chung nếu được cài đặt trong biến môi trường.
            </p>
          </div>

          {/* Voice Selector */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-3xs font-semibold uppercase tracking-wider text-zinc-450">
              <Volume2 size={13} className="text-purple-400" />
              Giọng đọc tiếng Anh (TTS)
            </label>
            <select
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2.5 text-base outline-none transition-all ${
                theme === 'dark'
                  ? 'border-white/10 bg-zinc-800 text-zinc-100 focus:border-purple-500/50'
                  : 'border-zinc-300 bg-zinc-50 text-zinc-950 focus:border-purple-500'
              }`}
            >
              <option value="">Giọng đọc mặc định hệ thống</option>
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Speech Rate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-3xs font-semibold uppercase tracking-wider text-zinc-400">
              <span className="flex items-center gap-2">
                <Gauge size={13} className="text-purple-400" />
                Tốc độ đọc mặc định
              </span>
              <span className="text-purple-400 font-bold">{speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className={`h-1.5 w-full cursor-pointer appearance-none rounded-lg accent-purple-500 focus:outline-none ${theme === 'dark' ? 'bg-white/10' : 'bg-zinc-200'}`}
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>0.5x (Chậm)</span>
              <span>1.0x (Chuẩn)</span>
              <span>1.5x (Nhanh)</span>
            </div>
          </div>

          {/* Show confidence score */}
          <div className={`flex items-center justify-between rounded-xl p-3.5 transition-colors ${theme === 'dark' ? 'bg-white/5' : 'bg-zinc-100'}`}>
            <div className="space-y-0.5">
              <span className="text-xs font-semibold">Hiển thị độ chính xác mic</span>
              <p className="text-3xs text-zinc-450">Hiện % tin cậy giọng đọc của trình duyệt</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={showConfidence}
                onChange={(e) => setShowConfidence(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-5 w-9 rounded-full bg-zinc-700 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-purple-500 peer-checked:after:translate-x-full"></div>
            </label>
          </div>
        </form>

        {/* Buttons footer */}
        <div className={`flex gap-3 p-4 border-t flex-shrink-0 ${theme === 'dark' ? 'border-white/5 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold active:scale-95 transition-colors ${
              theme === 'dark' ? 'border-white/10 text-zinc-300 bg-transparent' : 'border-zinc-300 bg-white text-zinc-700'
            }`}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-lg active:scale-95 hover:bg-purple-500 transition-all"
          >
            <Save size={14} />
            Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
}
