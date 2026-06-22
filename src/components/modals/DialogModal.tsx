'use client';

import React, { useState } from 'react';
import { X, Sparkles, Plus, Trash2, Send, Save, Loader2, Info } from 'lucide-react';
import type { Dialogue, DialogueLine } from '../../types';
import { generateDialogueFromAI } from '../../utils/ai';

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
    if (!topic.trim()) {
      setError(lessonType === 'paragraph' ? 'Vui lòng nhập chủ đề bạn muốn viết đoạn văn.' : 'Vui lòng nhập chủ đề bạn muốn hội thoại.');
      return;
    }
    if (!geminiApiKey) {
      setError('Vui lòng cài đặt API Key Gemini trước khi tự động sinh.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateDialogueFromAI(topic, geminiApiKey, lessonType, sentenceLength);
      
      // Save it immediately
      onSave({
        title: result.title,
        description: result.description,
        tags: result.tags,
        type: lessonType,
        sentenceLength: sentenceLength,
        lines: result.lines.map((l, index) => ({
          id: `line-${Date.now()}-${index}`,
          speaker: lessonType === 'paragraph' ? 'Paragraph' : (l.speaker || 'A'),
          en: l.en,
          vi: l.vi
        }))
      });

      // Clear topic
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

    if (!title.trim()) {
      setError(lessonType === 'paragraph' ? 'Vui lòng nhập tên chủ đề đoạn văn.' : 'Vui lòng nhập tên hội thoại.');
      return;
    }

    const filteredLines = lines.filter(l => l.en.trim() && l.vi.trim());
    if (filteredLines.length < 1) {
      setError('Bài học phải có ít nhất 1 câu hoàn chỉnh.');
      return;
    } else if (lessonType === 'dialogue' && filteredLines.length < 2) {
      setError('Hội thoại phải có ít nhất 2 câu hoàn chỉnh.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    onSave({
      title,
      description,
      tags: tags.length > 0 ? tags : (lessonType === 'paragraph' ? ['doan-van'] : ['giao-tiep']),
      type: lessonType,
      lines: filteredLines.map((l, index) => ({
        id: `line-${Date.now()}-${index}`,
        speaker: lessonType === 'paragraph' ? 'Paragraph' : (l.speaker || 'A'),
        en: l.en.trim(),
        vi: l.vi.trim()
      }))
    });

    // Reset Form
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
      <div className={`w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-2xl border shadow-2xl transition-colors duration-200 ${
        theme === 'dark'
          ? 'border-white/10 bg-zinc-900/95 text-zinc-100 shadow-purple-500/10'
          : 'border-zinc-200 bg-white text-zinc-900 shadow-zinc-300/50'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b p-5 ${theme === 'dark' ? 'border-white/5' : 'border-zinc-150'}`}>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <Plus size={20} />
            </div>
            <h2 className="text-xl font-semibold tracking-wide">Thêm Hội Thoại Mới</h2>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-1.5 transition-colors ${theme === 'dark' ? 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className={`flex border-b p-1 ${theme === 'dark' ? 'border-white/5 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-100'}`}>
          <button
            type="button"
            onClick={() => { setMode('ai'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
              mode === 'ai'
                ? theme === 'dark'
                  ? 'bg-purple-600/20 border border-purple-500/20 text-purple-400 shadow-inner'
                  : 'bg-white border border-zinc-250 text-purple-700 shadow-sm font-semibold'
                : theme === 'dark'
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Sparkles size={16} />
            Tạo bằng AI (Gemini)
          </button>
          <button
            type="button"
            onClick={() => { setMode('manual'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
              mode === 'manual'
                ? theme === 'dark'
                  ? 'bg-purple-600/20 border border-purple-500/20 text-purple-400 shadow-inner'
                  : 'bg-white border border-zinc-250 text-purple-700 shadow-sm font-semibold'
                : theme === 'dark'
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-zinc-650 hover:text-zinc-900'
            }`}
          >
            <Plus size={16} />
            Tự viết thủ công
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-400 flex items-start gap-2">
            <Info size={14} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {mode === 'ai' ? (
            /* AI Mode */
            <div className="space-y-4 py-2">
              {/* Lựa chọn loại bài học */}
              <div className="space-y-1.5">
                <label className="text-2xs font-semibold uppercase tracking-wider text-zinc-400">
                  Loại bài học
                </label>
                <div className={`flex gap-1.5 p-1 rounded-xl border ${
                  theme === 'dark' ? 'bg-zinc-950/40 border-white/5' : 'bg-zinc-100 border-zinc-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setLessonType('dialogue')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      lessonType === 'dialogue'
                        ? theme === 'dark'
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-inner'
                          : 'bg-white border border-zinc-250 text-purple-700 shadow-sm'
                        : theme === 'dark'
                        ? 'text-zinc-450 hover:text-zinc-250'
                        : 'text-zinc-650 hover:text-zinc-900'
                    }`}
                  >
                    Hội thoại đối đáp (Dialogue)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLessonType('paragraph')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      lessonType === 'paragraph'
                        ? theme === 'dark'
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-inner'
                          : 'bg-white border border-zinc-250 text-purple-700 shadow-sm'
                        : theme === 'dark'
                        ? 'text-zinc-450 hover:text-zinc-250'
                        : 'text-zinc-650 hover:text-zinc-900'
                    }`}
                  >
                    Đoạn văn ngắn (Paragraph)
                  </button>
                </div>
              </div>

              {/* Lựa chọn độ dài câu */}
              <div className="space-y-1.5">
                <label className="text-2xs font-semibold uppercase tracking-wider text-zinc-400">
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
                        className={`flex-1 py-2 text-3xs md:text-2xs font-semibold rounded-lg transition-all ${
                          sentenceLength === len
                            ? theme === 'dark'
                              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-inner'
                              : 'bg-white border border-zinc-250 text-purple-700 shadow-sm'
                            : theme === 'dark'
                            ? 'text-zinc-450 hover:text-zinc-250'
                            : 'text-zinc-650 hover:text-zinc-900'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {lessonType === 'paragraph' ? 'Chủ đề đoạn văn muốn học' : 'Chủ đề hội thoại muốn học'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={
                      lessonType === 'paragraph'
                        ? "ví dụ: Tả một ngày làm việc của bạn, Thư gửi bạn thân, Kể về ngày mưa..."
                        : "ví dụ: Đặt trà sữa, Phỏng vấn lập trình viên, Hỏi đường đi Big C..."
                    }
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={loading}
                    className={`flex-1 rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
                      theme === 'dark'
                        ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-500 focus:border-purple-500/50 focus:bg-white/10'
                        : 'border-zinc-300 bg-zinc-50 text-zinc-950 placeholder-zinc-400 focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500/30'
                    }`}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={loading}
                    className="px-5 rounded-xl bg-purple-600 text-sm font-medium text-white flex items-center gap-2 hover:bg-purple-500 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Gửi AI
                  </button>
                </div>
                <p className="text-3xs text-zinc-500 leading-relaxed mt-1 flex gap-1 items-start">
                  <Info size={12} className="mt-0.5" />
                  {lessonType === 'paragraph'
                    ? "Gemini sẽ tự động soạn thảo một đoạn văn ngắn liền mạch (gồm 3-5 câu ngắn gọn) kèm dịch nghĩa tiếng Việt và tag phù hợp."
                    : "Gemini sẽ tự động xây dựng kịch bản hội thoại tiếng Anh gồm 4-8 câu kèm nghĩa tiếng Việt và các tag phù hợp cho bạn luyện tập."}
                </p>
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 size={36} className="animate-spin text-purple-500" />
                  <span className="text-sm text-zinc-400">
                    {lessonType === 'paragraph'
                      ? "Đang soạn thảo đoạn văn ngắn với AI..."
                      : "Đang soạn kịch bản hội thoại với AI..."}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Manual Mode */
            <form onSubmit={handleManualSave} className="space-y-4">
              {/* Lựa chọn loại bài học khi tự viết */}
              <div className="space-y-1.5">
                <label className="text-2xs font-semibold uppercase tracking-wider text-zinc-400">
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
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      lessonType === 'dialogue'
                        ? theme === 'dark'
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-inner'
                          : 'bg-white border border-zinc-250 text-purple-700 shadow-sm'
                        : theme === 'dark'
                        ? 'text-zinc-455 hover:text-zinc-250'
                        : 'text-zinc-650 hover:text-zinc-900'
                    }`}
                  >
                    Hội thoại đối đáp (Dialogue)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLessonType('paragraph');
                      setLines([
                        { speaker: 'Paragraph', en: '', vi: '' }
                      ]);
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      lessonType === 'paragraph'
                        ? theme === 'dark'
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-inner'
                          : 'bg-white border border-zinc-250 text-purple-700 shadow-sm'
                        : theme === 'dark'
                        ? 'text-zinc-455 hover:text-zinc-250'
                        : 'text-zinc-650 hover:text-zinc-900'
                    }`}
                  >
                    Đoạn văn ngắn (Paragraph)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {lessonType === 'paragraph' ? 'Tên chủ đề đoạn văn' : 'Tên chủ đề hội thoại'}
                  </label>
                  <input
                    type="text"
                    placeholder={lessonType === 'paragraph' ? "Nhập tên chủ đề (ví dụ: Một ngày mưa)" : "Nhập tên chủ đề (ví dụ: Đi taxi)"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-purple-500/50 ${
                      theme === 'dark'
                        ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-500'
                        : 'border-zinc-300 bg-zinc-50 text-zinc-950 placeholder-zinc-400 focus:bg-white'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Tag / Thẻ phân loại (ngăn cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    placeholder="ví dụ: du-lich, doi-song, taxi"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-purple-500/50 ${
                      theme === 'dark'
                        ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-500'
                        : 'border-zinc-300 bg-zinc-50 text-zinc-950 placeholder-zinc-400 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Mô tả ngắn (ngữ cảnh)
                </label>
                <input
                  type="text"
                  placeholder={lessonType === 'paragraph' ? "Nhập mô tả hoàn cảnh đoạn văn" : "Nhập mô tả ngữ cảnh cuộc nói chuyện"}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-purple-500/50 ${
                    theme === 'dark'
                      ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-500'
                      : 'border-zinc-300 bg-zinc-50 text-zinc-950 placeholder-zinc-400 focus:bg-white'
                  }`}
                />
              </div>

              {/* Rows of Dialogue */}
              <div className={`space-y-3 pt-3 border-t ${theme === 'dark' ? 'border-white/5' : 'border-zinc-200'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {lessonType === 'paragraph' ? 'Nội dung đoạn văn' : 'Kịch bản hội thoại'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                  >
                    <Plus size={14} /> {lessonType === 'paragraph' ? 'Thêm câu tiếp theo' : 'Thêm câu nói'}
                  </button>
                </div>

                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                  {lines.map((line, index) => (
                    <div
                      key={index}
                      className={`flex gap-2.5 items-start rounded-xl p-3 border ${
                        theme === 'dark' ? 'bg-zinc-950/20 border-white/5' : 'bg-zinc-100 border-zinc-200'
                      }`}
                    >
                      {/* Speaker */}
                      {lessonType === 'dialogue' && (
                        <div className="w-16 space-y-1">
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wider block">Người nói</label>
                          <input
                            type="text"
                            placeholder="A, B..."
                            value={line.speaker}
                            onChange={(e) => handleLineChange(index, 'speaker', e.target.value)}
                            className={`w-full text-center rounded-lg border py-1 text-sm outline-none focus:border-purple-500 ${
                              theme === 'dark'
                                ? 'border-white/10 bg-white/5 text-zinc-100'
                                : 'border-zinc-300 bg-white text-zinc-950'
                            }`}
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 space-y-2">
                        <div>
                          <input
                            type="text"
                            placeholder={lessonType === 'paragraph' ? `Nhập câu tiếng Anh thứ ${index + 1}` : "Tiếng Anh (ví dụ: Hello, can I see the bill?)"}
                            value={line.en}
                            onChange={(e) => handleLineChange(index, 'en', e.target.value)}
                            className={`w-full rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-purple-500 ${
                              theme === 'dark'
                                ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-650'
                                : 'border-zinc-300 bg-white text-zinc-950 placeholder-zinc-400'
                            }`}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder={lessonType === 'paragraph' ? `Nghĩa Tiếng Việt tương ứng` : "Nghĩa Tiếng Việt (ví dụ: Xin chào, tôi có thể xem hóa đơn được không?)"}
                            value={line.vi}
                            onChange={(e) => handleLineChange(index, 'vi', e.target.value)}
                            className={`w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:border-purple-500 ${
                              theme === 'dark'
                                ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-650'
                                : 'border-zinc-300 bg-white text-zinc-950 placeholder-zinc-400'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Remove Button */}
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(index)}
                          className="mt-6 rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
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
          <div className={`flex gap-3 border-t p-5 ${theme === 'dark' ? 'border-white/5 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'border-white/10 hover:bg-white/5 text-zinc-300 bg-transparent'
                  : 'border-zinc-300 hover:bg-zinc-100 text-zinc-700 bg-white'
              }`}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleManualSave}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-medium text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition-all active:scale-[0.98]"
            >
              <Save size={16} />
              Lưu hội thoại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
