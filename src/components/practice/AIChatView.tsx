'use client';

import React from 'react';
import {
  Volume2,
  Mic,
  MicOff,
  Check,
  RotateCcw,
  Sparkles,
  Award,
  RefreshCw,
  Brain
} from 'lucide-react';
import type { Dialogue, DialogueLine } from '../../types';
import { WordDiff } from '../../utils/diff';
import { AIChatFeedback } from '../../utils/ai';

interface AIChatViewProps {
  dialogue: Dialogue;
  theme: 'dark' | 'light';
  selectedRole: 'A' | 'B' | 'Paragraph' | null;
  currentLineIndex: number;
  aiChatTranscript: Array<{
    lineId: string;
    lineText: string;
    userTranscript: string;
    score: number;
    diff?: WordDiff[];
  }>;
  isGeneratingFeedback: boolean;
  aiFeedback: AIChatFeedback | null;
  aiUserRecordedTranscript: string;
  aiUserScore: number;
  aiUserDiff: WordDiff[];
  hasRecordedCurrentLine: boolean;
  isRecording: string | null;
  activeSpeechLineId: string | null;
  
  onSelectRole: (role: 'A' | 'B' | 'Paragraph') => void;
  onResetAIChat: () => void;
  onToggleRecordAIChat: (line: DialogueLine) => void;
  onConfirmUserLine: () => void;
  onConfirmAIChat: () => void;
  onPlayTTS: (line: DialogueLine) => void;
}

export default function AIChatView({
  dialogue,
  theme,
  selectedRole,
  currentLineIndex,
  aiChatTranscript,
  isGeneratingFeedback,
  aiFeedback,
  aiUserRecordedTranscript,
  aiUserScore,
  aiUserDiff,
  hasRecordedCurrentLine,
  isRecording,
  activeSpeechLineId,
  onSelectRole,
  onResetAIChat,
  onToggleRecordAIChat,
  onConfirmUserLine,
  onConfirmAIChat,
  onPlayTTS,
}: AIChatViewProps) {
  if (!selectedRole) {
    const uniqueSpeakers = Array.from(new Set(dialogue.lines.map(l => l.speaker))).filter(Boolean);
    const role1 = (uniqueSpeakers[0] || 'A') as 'A' | 'B';
    const role2 = (uniqueSpeakers[1] || 'B') as 'A' | 'B';

    return (
      <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border ${
          theme === 'dark' ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-650 shadow-sm shadow-purple-100'
        }`}>
          <Sparkles size={28} className="animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-855'}`}>Luyện Nói Đóng Vai Với AI</h2>
          <p className={`text-sm max-w-md mx-auto leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Hãy chọn một vai trong đoạn hội thoại để bắt đầu nói chuyện. AI sẽ đóng vai đối phương, tự động phát âm và đánh giá chi tiết giọng nói của bạn.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg pt-4">
          <button
            onClick={() => onSelectRole(role1)}
            className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
              theme === 'dark'
                ? 'bg-zinc-900/40 border-white/5 hover:border-purple-500/30 hover:bg-purple-500/5'
                : 'bg-zinc-50 border-zinc-200 hover:border-purple-400 hover:bg-purple-50/50 shadow-sm'
            }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-3 ${
              theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
            }`}>Đóng vai 1</span>
            <span className={`text-lg font-black ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>Nhân vật {role1}</span>
            <span className={`text-xs mt-2 italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-450'}`}>
              Nói các câu của {role1}
            </span>
          </button>
          
          <button
            onClick={() => onSelectRole(role2)}
            className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
              theme === 'dark'
                ? 'bg-zinc-900/40 border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5'
                : 'bg-zinc-50 border-zinc-200 hover:border-indigo-400 hover:bg-indigo-50/50 shadow-sm'
            }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-3 ${
              theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
            }`}>Đóng vai 2</span>
            <span className={`text-lg font-black ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>Nhân vật {role2}</span>
            <span className={`text-xs mt-2 italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-450'}`}>
              Nói các câu của {role2}
            </span>
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = currentLineIndex >= dialogue.lines.length;

  return (
    <div className="flex flex-col h-full space-y-4 max-w-3xl mx-auto pb-8">
      {/* Active Role Info Header */}
      <div className={`flex items-center justify-between p-3 rounded-2xl border ${
        theme === 'dark' ? 'bg-zinc-950/20 border-white/5' : 'bg-zinc-50 border-zinc-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">
            {dialogue.type === 'paragraph' ? 'Luyện tập:' : 'Đóng vai:'}
          </span>
          <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-lg border ${
            theme === 'dark' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-purple-100 border-purple-200 text-purple-700'
          }`}>
            {dialogue.type === 'paragraph' ? 'Đọc Đoạn Văn' : selectedRole}
          </span>
        </div>
        <button
          onClick={onResetAIChat}
          className={`flex items-center gap-1 text-[11px] font-bold ${
            theme === 'dark' ? 'text-zinc-450 hover:text-zinc-200' : 'text-zinc-605 hover:text-zinc-900'
          }`}
        >
          <RotateCcw size={12} />
          {dialogue.type === 'paragraph' ? 'Đọc lại từ đầu' : 'Đổi vai / Làm lại'}
        </button>
      </div>

      {/* Chat Bubbles Container */}
      <div className="flex-1 space-y-4 overflow-y-auto min-h-[250px] pr-2">
        {dialogue.lines.map((line, idx) => {
          const isUser = line.speaker === selectedRole;
          const isLineActive = idx === currentLineIndex;
          const isLinePassed = idx < currentLineIndex;

          if (!isLineActive && !isLinePassed) return null;

          if (isUser) {
            return (
              <div key={line.id} className="flex flex-col items-end space-y-1 animate-fade-in">
                <span className="text-[10px] text-zinc-500 font-bold mr-2 uppercase">
                  {dialogue.type === 'paragraph' ? `Câu ${idx + 1}` : `${line.speaker} (Bạn)`}
                </span>
                
                {isLinePassed ? (
                  (() => {
                    const resultItem = aiChatTranscript.find(t => t.lineId === line.id);
                    return (
                      <div className="max-w-[85%] space-y-2">
                        <div className={`p-4 rounded-3xl rounded-tr-none border ${
                          theme === 'dark'
                            ? 'bg-purple-600/10 border-purple-500/25 text-zinc-200'
                            : 'bg-purple-50 border-purple-200 text-zinc-900 shadow-sm shadow-purple-50'
                        }`}>
                          {resultItem?.diff ? (
                            <div className="flex flex-wrap gap-1">
                              {resultItem.diff.map((w, wi) => (
                                <span
                                  key={wi}
                                  className={`px-0.5 rounded text-sm md:text-base ${
                                    w.type === 'correct'
                                      ? theme === 'dark' ? 'text-emerald-400 font-medium' : 'text-emerald-700 font-bold'
                                      : w.type === 'incorrect'
                                      ? theme === 'dark' ? 'text-rose-400 line-through bg-rose-500/10' : 'text-rose-600 line-through bg-rose-100/40'
                                      : theme === 'dark' ? 'text-amber-500 italic' : 'text-amber-700 italic'
                                  }`}
                                >
                                  {w.text}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm md:text-base">{line.en}</p>
                          )}
                          <p className={`text-4xs mt-1.5 italic border-t pt-1.5 ${theme === 'dark' ? 'border-white/5 text-zinc-500' : 'border-zinc-250 text-zinc-500'}`}>
                            Nghĩa: {line.vi}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-end gap-2 text-4xs font-bold text-zinc-500 mr-2">
                          <span>Mic nhận diện: &quot;{resultItem?.userTranscript || '(Không nghe được)'}&quot;</span>
                          <span>•</span>
                          <span className={resultItem && resultItem.score >= 80 ? 'text-emerald-500' : resultItem && resultItem.score >= 50 ? 'text-amber-500' : 'text-rose-500'}>
                            Khớp {resultItem?.score || 0}%
                          </span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className={`w-full p-5 rounded-3xl border shadow-md space-y-4 animate-slide-up ${
                    theme === 'dark' ? 'bg-zinc-900/60 border-purple-500/30' : 'bg-white border-purple-300 shadow-purple-50'
                  }`}>
                    <div className="space-y-1.5">
                      <span className="text-4xs text-purple-400 font-bold uppercase tracking-wider block">Hãy đọc câu sau:</span>
                      <p className={`text-lg md:text-xl font-bold font-sans tracking-wide leading-relaxed ${
                        theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'
                      }`}>
                        {line.en}
                      </p>
                      <p className={`text-sm italic ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        Dịch nghĩa: {line.vi}
                      </p>
                    </div>

                    {hasRecordedCurrentLine && (
                      <div className={`p-4 rounded-2xl border ${
                        theme === 'dark' ? 'bg-zinc-950/40 border-white/5' : 'bg-zinc-50 border-zinc-200'
                      }`}>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {aiUserDiff.map((w, wi) => (
                            <span
                              key={wi}
                              className={`px-0.5 rounded text-sm md:text-base ${
                                w.type === 'correct'
                                  ? theme === 'dark' ? 'text-emerald-400 font-medium' : 'text-emerald-700 font-bold'
                                  : w.type === 'incorrect'
                                  ? theme === 'dark' ? 'text-rose-450 line-through bg-rose-500/10' : 'text-rose-600 line-through bg-rose-100/50'
                                  : theme === 'dark' ? 'text-amber-500 italic' : 'text-amber-700 italic'
                              }`}
                            >
                              {w.text}
                            </span>
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-4xs font-bold text-zinc-500 border-t border-dashed border-zinc-700/30 pt-2">
                          <span>Mic nghe thấy: &quot;{aiUserRecordedTranscript}&quot;</span>
                          <span className={aiUserScore >= 80 ? 'text-emerald-450' : aiUserScore >= 50 ? 'text-amber-450' : 'text-rose-500'}>
                            Độ chính xác: {aiUserScore}%
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => onToggleRecordAIChat(line)}
                        className={`flex items-center gap-2 py-3 px-6 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md active:scale-[0.98] ${
                          isRecording === line.id
                            ? 'bg-red-650 text-white animate-pulse shadow-red-500/20'
                            : theme === 'dark'
                            ? 'bg-purple-650 hover:bg-purple-550 text-white shadow-purple-600/10'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/10'
                        }`}
                      >
                        {isRecording === line.id ? (
                          <>
                            <MicOff size={16} /> Đang nghe... Bấm để dừng
                          </>
                        ) : (
                          <>
                            <Mic size={16} /> Bắt đầu Nói
                          </>
                        )}
                      </button>

                      {hasRecordedCurrentLine ? (
                        <button
                          onClick={onConfirmUserLine}
                          className="flex items-center gap-1.5 py-3 px-6 rounded-2xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-md active:scale-[0.98]"
                        >
                          <Check size={16} /> Xác nhận & Đi tiếp
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            // Skip line
                            onConfirmUserLine();
                          }}
                          className={`flex items-center gap-1 py-3 px-4 rounded-2xl text-xs font-semibold border transition-all ${
                            theme === 'dark'
                              ? 'border-white/10 hover:bg-white/5 text-zinc-400'
                              : 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-500'
                          }`}
                        >
                          Bỏ qua câu này
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          } else {
            const isSpeechPlaying = activeSpeechLineId === line.id;

            return (
              <div key={line.id} className="flex flex-col items-start space-y-1 animate-fade-in">
                <span className="text-[10px] text-zinc-500 font-bold ml-2 uppercase">{line.speaker} (AI)</span>
                
                <div className="flex items-start gap-2.5 max-w-[85%]">
                  <div className={`p-4 rounded-3xl rounded-tl-none border transition-all duration-300 ${
                    isLineActive
                      ? theme === 'dark'
                        ? 'bg-zinc-900/60 border-purple-500/50 shadow-md shadow-purple-900/5'
                        : 'bg-purple-50/30 border-purple-400/40 shadow-md shadow-purple-100/30'
                      : theme === 'dark'
                      ? 'bg-zinc-900/20 border-white/5 text-zinc-300'
                      : 'bg-zinc-100/80 border-zinc-200 text-zinc-800'
                  }`}>
                    {isLineActive ? (
                      <div className="flex items-center gap-3">
                        <div className="flex space-x-1 items-center py-1">
                          <span className="w-1.5 h-3 bg-purple-500 rounded-full animate-bounce delay-75"></span>
                          <span className="w-1.5 h-4 bg-purple-500 rounded-full animate-bounce delay-150"></span>
                          <span className="w-1.5 h-3 bg-purple-500 rounded-full animate-bounce delay-225"></span>
                        </div>
                        <span className={`text-sm italic ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'}`}>AI đang trả lời bạn...</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-sm md:text-base leading-relaxed">{line.en}</p>
                        <p className={`text-4xs italic border-t pt-1.5 ${theme === 'dark' ? 'border-white/5 text-zinc-550' : 'border-zinc-250 text-zinc-550'}`}>
                          Nghĩa: {line.vi}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {isLinePassed && (
                    <button
                      onClick={() => onPlayTTS(line)}
                      className={`p-2 rounded-xl border transition-all mt-1 active:scale-95 ${
                        isSpeechPlaying
                          ? theme === 'dark' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-250'
                          : theme === 'dark' ? 'bg-white/5 border-white/5 text-zinc-500 hover:text-zinc-200' : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-950'
                      }`}
                      title="Nghe lại câu nói của AI"
                    >
                      <Volume2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          }
        })}
      </div>

      {isCompleted && (
        <div className="space-y-6 animate-slide-up">
          {isGeneratingFeedback ? (
            <div className={`p-8 rounded-3xl border flex flex-col items-center justify-center text-center space-y-4 ${
              theme === 'dark' ? 'bg-zinc-900/30 border-white/5' : 'bg-zinc-50 border-zinc-200 shadow-sm'
            }`}>
              <RefreshCw className="animate-spin text-purple-500" size={32} />
              <div className="space-y-1">
                <h3 className={`font-bold text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-800'}`}>AI đang phân tích giọng nói của bạn...</h3>
                <p className="text-xs text-zinc-500">Chúng tôi đang so sánh bản thu âm với người bản xứ và lấy feedback từ Gemini API.</p>
              </div>
            </div>
          ) : aiFeedback ? (
            <div className="space-y-5">
              <div className={`p-6 md:p-8 rounded-3xl border space-y-6 relative overflow-hidden ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-zinc-900/50 to-purple-950/10 border-purple-500/20'
                  : 'bg-gradient-to-br from-zinc-50/50 to-purple-50/30 border-purple-200 shadow-sm shadow-purple-100/30'
              }`}>
                <div className="absolute right-0 top-0 -translate-y-10 translate-x-10 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row items-center gap-6 justify-between border-b border-dashed border-zinc-700/20 pb-6">
                  <div className="space-y-2 text-center md:text-left">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      theme === 'dark' ? 'bg-purple-500/15 border-purple-500/20 text-purple-400' : 'bg-purple-100 border-purple-200 text-purple-700'
                    }`}>
                      {dialogue.type === 'paragraph' ? 'Passage Reading Complete' : 'AI Roleplay Complete'}
                    </span>
                    <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>Nhận Xét Từ AI</h3>
                    <p className="text-xs text-zinc-500">
                      {dialogue.type === 'paragraph'
                        ? 'Dưới đây là điểm số trung bình và nhận xét chi tiết cho phần đọc đoạn văn của bạn.'
                        : `Dưới đây là điểm số trung bình và nhận xét chi tiết cho vai diễn ${selectedRole} của bạn.`}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center h-28 w-28 rounded-full border-4 border-purple-500/40 relative shadow-inner bg-purple-500/5 animate-pulse">
                    <Award size={18} className="text-purple-400 absolute top-3" />
                    <span className={`text-2xl font-black ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'} mt-3`}>
                      {Math.round(
                        aiChatTranscript.reduce((sum, item) => sum + item.score, 0) / aiChatTranscript.length
                      )}%
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Độ khớp</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                    <Sparkles size={12} className="text-purple-400" /> Nhận xét tổng quan
                  </h4>
                  <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-800'}`}>
                    {aiFeedback.generalFeedback}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-6 rounded-3xl border space-y-3 ${
                  theme === 'dark' ? 'bg-zinc-900/30 border-white/5' : 'bg-zinc-50 border-zinc-200 shadow-sm'
                }`}>
                  <h4 className="text-xs font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                    <Volume2 size={12} className="text-purple-400" /> Lưu ý phát âm
                  </h4>
                  <ul className="space-y-2">
                    {aiFeedback.pronunciationTips.map((tip, ti) => (
                      <li key={ti} className="text-xs leading-relaxed flex items-start gap-2 text-zinc-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`p-6 rounded-3xl border space-y-3 ${
                  theme === 'dark' ? 'bg-zinc-900/30 border-white/5' : 'bg-zinc-50 border-zinc-200 shadow-sm'
                }`}>
                  <h4 className="text-xs font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                    <Brain size={12} className="text-purple-400" /> Gợi ý diễn đạt nâng cao
                  </h4>
                  <ul className="space-y-2">
                    {aiFeedback.expressionSuggestions.map((sug, si) => (
                      <li key={si} className="text-xs leading-relaxed flex items-start gap-2 text-zinc-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-dashed border-zinc-700/20">
                <button
                  onClick={onConfirmAIChat}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-purple-650 text-white hover:bg-purple-550 transition-all font-semibold px-8 py-3 text-xs shadow-lg shadow-purple-600/10 active:scale-[0.98]"
                >
                  <Check size={14} /> Xác Nhận & Lưu Kết Quả
                  </button>
                <button
                  onClick={onResetAIChat}
                  className={`flex items-center justify-center gap-2 border rounded-xl px-5 py-3 text-xs font-semibold transition-all ${
                    theme === 'dark' ? 'border-white/10 hover:bg-white/5 text-zinc-300' : 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <RotateCcw size={14} /> Luyện lại
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
