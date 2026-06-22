'use client';

import React, { useState } from 'react';
import { X, Sparkles, Plus, Trash2, Send, Save, Loader2, Info } from 'lucide-react';
import type { Dialogue, DialogueLine } from '../../../types';
import { generateDialogueFromAI } from '../../../utils/ai';
import { sanitizeText } from '../../../utils/security';

interface DialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dialogue: Omit<Dialogue, 'id' | 'createdAt' | 'practiceCount'>) => void;
  geminiApiKey: string;
  theme: 'dark' | 'light';
}

export default function DialogModal({
  isOpen,
  onClose,
  onSave,
  geminiApiKey,
  theme,
}: DialogModalProps) {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonType, setLessonType] = useState<'dialogue' | 'paragraph'>('dialogue');
  const [sentenceLength, setSentenceLength] = useState<'short' | 'medium' | 'long'>('medium');

  // AI mode state
  const [topic, setTopic] = useState('');

  // Manual mode state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [lines, setLines] = useState<Omit<DialogueLine, 'id'>[]>([
    { speaker: 'A', en: '', vi: '' },
    { speaker: 'B', en: '', vi: '' },
  ]);

  if (!isOpen) return null;

  const handleAddLine = () => {
    if (lessonType === 'paragraph') {
      setLines([...lines, { speaker: 'Paragraph', en: '', vi: '' }]);
    } else {
      const lastSpeaker = lines[lines.length - 1]?.speaker;
      const nextSpeaker = lastSpeaker === 'A' ? 'B' : lastSpeaker === 'B' ? 'A' : 'A';
      setLines([...lines, { speaker: nextSpeaker, en: '', vi: '' }]);
    }
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: 'speaker' | 'en' | 'vi', value: string) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const handleGenerateAI = async () => {
    const sanitizedTopic = sanitizeText(topic);
    if (!sanitizedTopic) {
      setError(lessonType === 'paragraph' ? 'Vui lòng nhập chủ đề bạn muốn viết đoạn văn.' : 'Vui lòng nhập chủ đề bạn muốn hội thoại.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateDialogueFromAI(sanitizedTopic, geminiApiKey, lessonType, sentenceLength);
      
      onSave({
        title: sanitizeText(result.title),
        description: sanitizeText(result.description),
        tags: result.tags.map(t => sanitizeText(t)).filter(Boolean),
        type: lessonType,
        sentenceLength: sentenceLength,
        lines: result.lines.map((l, index) => ({
          id: `line-${Date.now()}-${index}`,
          speaker: lessonType === 'paragraph' ? 'Paragraph' : sanitizeText(l.speaker || 'A'),
          en: sanitizeText(l.en),
          vi: sanitizeText(l.vi)
        }))
      });

      setTopic('');
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể tạo kịch bản học bằng AI.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const sanitizedTitle = sanitizeText(title);
    if (!sanitizedTitle) {
      setError(lessonType === 'paragraph' ? 'Vui lòng nhập tên chủ đề đoạn văn.' : 'Vui lòng nhập tên hội thoại.');
      return;
    }

    const filteredLines = lines.filter(l => l.en.trim() && l.vi.trim());
    if (filteredLines.length < 1) {
      setError('Bài học phải có ít nhất 1 câu hoàn chỉnh.');
      return;
    } else if (lessonType === 'dialogue' && filteredLines.length < 2) {
      setError('Hội thoại phải có nhất 2 câu hoàn chỉnh.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => sanitizeText(t).toLowerCase())
      .filter(t => t.length > 0);

    onSave({
      title: sanitizedTitle,
      description: sanitizeText(description),
      tags: tags.length > 0 ? tags : (lessonType === 'paragraph' ? ['doan-van'] : ['giao-tiep']),
      type: lessonType,
      lines: filteredLines.map((l, index) => ({
        id: `line-${Date.now()}-${index}`,
        speaker: lessonType === 'paragraph' ? 'Paragraph' : sanitizeText(l.speaker || 'A'),
        en: sanitizeText(l.en),
        vi: sanitizeText(l.vi)
      }))
    });

    setTitle('');
    setDescription('');
    setTagsInput('');
    setLines([
      { speaker: 'A', en: '', vi: '' },
      { speaker: 'B', en: '', vi: '' },
    ]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className={`w-full max-h-[88vh] overflow-hidden flex flex-col rounded-t-3xl border shadow-2xl transition-colors duration-200 ${
        theme === 'dark'
          ? 'border-white/10 bg-zinc-900/95 text-zinc-100'
          : 'border-zinc-200 bg-white text-zinc-900'
      }`}>
        
        {/* Drag handle decoration */}
        <div className="flex justify-center py-2.5 flex-shrink-0">
          <div className={`w-12 h-1.5 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-250'}`} />
        </div>

        {/* Header */}
        <div className={`flex items-center justify-between border-b px-5 pb-4 ${theme === 'dark' ? 'border-white/5' : 'border-zinc-150'}`}>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <Plus size={18} />
            </div>
            <h2 className="text-md font-bold tracking-wide">Thêm Bài Học Mới</h2>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-1.5 transition-colors ${theme === 'dark' ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-550 hover:bg-zinc-100'}`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className={`flex p-1 border-b flex-shrink-0 ${theme === 'dark' ? 'border-white/5 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-100'}`}>
          <button
            type="button"
            onClick={() => { setMode('ai'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'ai'
                ? theme === 'dark'
                  ? 'bg-purple-600/20 border border-purple-500/20 text-purple-400 shadow-inner'
                  : 'bg-white border border-zinc-250 text-purple-700 shadow-sm'
                : theme === 'dark'
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-zinc-650 hover:text-zinc-900'
            }`}
          >
            <Sparkles size={14} />
            Tạo bằng AI (Gemini)
          </button>
          <button
            type="button"
            onClick={() => { setMode('manual'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'manual'
                ? theme === 'dark'
                  ? 'bg-purple-600/20 border border-purple-500/20 text-purple-400 shadow-inner'
                  : 'bg-white border border-zinc-250 text-purple-700 shadow-sm'
                : theme === 'dark'
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-zinc-650 hover:text-zinc-900'
            }`}
          >
            <Plus size={14} />
            Tự viết thủ công
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-3xs text-red-400 flex items-start gap-1.5 flex-shrink-0">
            <Info size={13} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'ai' ? (
            /* AI Mode */
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-3xs font-semibold uppercase tracking-wider text-zinc-400">
                  Loại bài học
                </label>
                <div className={`flex gap-1.5 p-1 rounded-xl border ${
                  theme === 'dark' ? 'bg-zinc-950/40 border-white/5' : 'bg-zinc-100 border-zinc-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setLessonType('dialogue')}
                    className={`flex-1 py-1.5 text-3xs font-bold rounded-lg transition-all ${
                      lessonType === 'dialogue'
                        ? theme === 'dark'
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-inner'
                          : 'bg-white border border-zinc-250 text-purple-700 shadow-sm'
                        : theme === 'dark'
                        ? 'text-zinc-450 hover:text-zinc-250'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Hội thoại (Dialogue)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLessonType('paragraph')}
                    className={`flex-1 py-1.5 text-3xs font-bold rounded-lg transition-all ${
                      lessonType === 'paragraph'
                        ? theme === 'dark'
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-inner'
                          : 'bg-white border border-zinc-250 text-purple-700 shadow-sm'
                        : theme === 'dark'
                        ? 'text-zinc-450 hover:text-zinc-250'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Đoạn văn (Paragraph)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-3xs font-semibold uppercase tracking-wider text-zinc-400">
                  Độ dài câu học (Độ khó)
                </label>
                <div className={`flex gap-1.5 p-1 rounded-xl border ${
                  theme === 'dark' ? 'bg-zinc-950/40 border-white/5' : 'bg-zinc-100 border-zinc-200'
                }`}>
                  {(['short', 'medium', 'long'] as const).map((len) => {
                    const label = {
                      short: 'Dễ & Ngắn (≤10 từ)',
                      medium: 'Trung bình (10-15 từ)',
                      long: 'Chi tiết (>15 từ)',
                    }[len];
                    return (
                      <button
                        key={len}
                        type="button"
                        onClick={() => setSentenceLength(len)}
                        className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg transition-all ${
                          sentenceLength === len
                            ? theme === 'dark'
                              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-inner'
                              : 'bg-white border border-zinc-250 text-purple-700 shadow-sm'
                            : theme === 'dark'
                            ? 'text-zinc-455 hover:text-zinc-250'
                            : 'text-zinc-650 hover:text-zinc-900'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-3xs font-semibold uppercase tracking-wider text-zinc-400">
                  {lessonType === 'paragraph' ? 'Chủ đề đoạn văn muốn học' : 'Chủ đề hội thoại muốn học'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={
                      lessonType === 'paragraph'
                        ? "ví dụ: Thư gửi bạn thân, Ngày mưa..."
                        : "ví dụ: Đặt trà sữa, Hỏi đường đi Big C..."
                    }
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={loading}
                    className={`flex-1 rounded-xl border px-3.5 py-2.5 text-base outline-none transition-all ${
                      theme === 'dark'
                        ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-500 focus:border-purple-500/50'
                        : 'border-zinc-300 bg-zinc-50 text-zinc-900 placeholder-zinc-450 focus:border-purple-500 focus:bg-white'
                    }`}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={loading}
                    className="px-4 rounded-xl bg-purple-600 text-xs font-semibold text-white flex items-center gap-1.5 hover:bg-purple-500 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    Gửi
                  </button>
                </div>
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center py-6 space-y-2">
                  <Loader2 size={28} className="animate-spin text-purple-500" />
                  <span className="text-2xs text-zinc-550">AI đang soạn bài học...</span>
                </div>
              )}
            </div>
          ) : (
            /* Manual Mode */
            <form onSubmit={handleManualSave} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-3xs font-semibold uppercase tracking-wider text-zinc-400">
                  Loại bài học
                </label>
                <div className={`flex gap-1.5 p-1 rounded-xl border ${
                  theme === 'dark' ? 'bg-zinc-950/40 border-white/5' : 'bg-zinc-100 border-zinc-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      setLessonType('dialogue');
                      setLines([
                        { speaker: 'A', en: '', vi: '' },
                        { speaker: 'B', en: '', vi: '' }
                      ]);
                    }}
                    className={`flex-1 py-1.5 text-3xs font-bold rounded-lg transition-all ${
                      lessonType === 'dialogue'
                        ? theme === 'dark'
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-inner'
                          : 'bg-white border border-zinc-250 text-purple-700 shadow-sm'
                        : theme === 'dark'
                        ? 'text-zinc-455 hover:text-zinc-250'
                        : 'text-zinc-650 hover:text-zinc-900'
                    }`}
                  >
                    Hội thoại (Dialogue)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLessonType('paragraph');
                      setLines([
                        { speaker: 'Paragraph', en: '', vi: '' }
                      ]);
                    }}
                    className={`flex-1 py-1.5 text-3xs font-bold rounded-lg transition-all ${
                      lessonType === 'paragraph'
                        ? theme === 'dark'
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-inner'
                          : 'bg-white border border-zinc-250 text-purple-700 shadow-sm'
                        : theme === 'dark'
                        ? 'text-zinc-455 hover:text-zinc-250'
                        : 'text-zinc-650 hover:text-zinc-900'
                    }`}
                  >
                    Đoạn văn (Paragraph)
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-3xs font-semibold uppercase tracking-wider text-zinc-400">
                    Tên chủ đề
                  </label>
                  <input
                    type="text"
                    placeholder="ví dụ: Đi xe taxi"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-base outline-none ${
                      theme === 'dark'
                        ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-500'
                        : 'border-zinc-350 bg-zinc-50 text-zinc-900'
                    }`}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-3xs font-semibold uppercase tracking-wider text-zinc-400">
                    Tags (ngăn cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    placeholder="ví dụ: du-lich, taxi"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-base outline-none ${
                      theme === 'dark'
                        ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-500'
                        : 'border-zinc-350 bg-zinc-50 text-zinc-900'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-3xs font-semibold uppercase tracking-wider text-zinc-400">
                    Mô tả ngắn (ngữ cảnh)
                  </label>
                  <input
                    type="text"
                    placeholder="Mô tả hoàn cảnh bài đọc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-base outline-none ${
                      theme === 'dark'
                        ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-500'
                        : 'border-zinc-350 bg-zinc-50 text-zinc-900'
                    }`}
                  />
                </div>
              </div>

              {/* Rows of lines */}
              <div className="space-y-2.5 pt-2.5 border-t border-dashed border-zinc-700/20">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-3xs font-semibold uppercase tracking-wider text-zinc-400">
                    Nội dung học
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 active:scale-95"
                  >
                    <Plus size={12} /> Thêm câu
                  </button>
                </div>

                <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                  {lines.map((line, index) => (
                    <div
                      key={index}
                      className={`flex gap-2 items-start rounded-xl p-3 border ${
                        theme === 'dark' ? 'bg-zinc-950/20 border-white/5' : 'bg-zinc-100/50 border-zinc-200'
                      }`}
                    >
                      {/* Speaker column */}
                      {lessonType === 'dialogue' && (
                        <div className="w-14 space-y-1 flex-shrink-0">
                          <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Vai</label>
                          <input
                            type="text"
                            placeholder="A/B"
                            value={line.speaker}
                            onChange={(e) => handleLineChange(index, 'speaker', e.target.value)}
                            className={`w-full text-center rounded-lg border py-1 text-xs outline-none ${
                              theme === 'dark' ? 'border-white/10 bg-white/5 text-zinc-100' : 'border-zinc-300 bg-white text-zinc-900'
                            }`}
                          />
                        </div>
                      )}

                      {/* Line content */}
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder={`Câu tiếng Anh thứ ${index + 1}`}
                          value={line.en}
                          onChange={(e) => handleLineChange(index, 'en', e.target.value)}
                          className={`w-full rounded-lg border px-2.5 py-1.5 text-base outline-none ${
                            theme === 'dark'
                              ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-650'
                              : 'border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400'
                          }`}
                        />
                        <input
                          type="text"
                          placeholder="Dịch nghĩa tiếng Việt"
                          value={line.vi}
                          onChange={(e) => handleLineChange(index, 'vi', e.target.value)}
                          className={`w-full rounded-lg border px-2.5 py-1.5 text-base outline-none ${
                            theme === 'dark'
                              ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-650'
                              : 'border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400'
                          }`}
                        />
                      </div>

                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(index)}
                          className="mt-4 rounded-lg p-1 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer for Manual mode */}
        {mode === 'manual' && (
          <div className={`flex gap-3 border-t p-4 flex-shrink-0 ${theme === 'dark' ? 'border-white/5 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold active:scale-95 transition-colors ${
                theme === 'dark' ? 'border-white/10 text-zinc-300' : 'border-zinc-300 bg-white text-zinc-700'
              }`}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleManualSave}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-lg active:scale-95 hover:bg-purple-500 transition-all"
            >
              <Save size={14} />
              Lưu bài học
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
