'use client';

import React from 'react';
import { Volume2, Mic, MicOff, Check, RotateCcw, Sparkles, RefreshCw, Brain } from 'lucide-react';
import type { Dialogue, DialogueLine } from '../../../types';
import { WordDiff } from '../../../utils/diff';
import { AIChatFeedback } from '../../../utils/ai';

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
    const role1 = (uniqueSpeakers[0] || 'A') as 'A' | 'B' | 'Paragraph';
    const role2 = (uniqueSpeakers[1] || 'B') as 'A' | 'B' | 'Paragraph';

    return (
      <div className="max-w-md mx-auto py-6 px-3 flex flex-col items-center justify-center text-center space-y-5 animate-fade-in">
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border ${
          theme === 'dark' ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-650 shadow-sm'
        }`}>
          <Sparkles size={24} className="animate-pulse" />
        </div>
        <div className="space-y-1">
          <h2 className={`text-md font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>Luyện Nói Đóng Vai Với AI</h2>
          <p className="text-2xs leading-relaxed text-zinc-500 max-w-xs">
            Chọn một vai để đối đáp. AI sẽ tự động đóng vai còn lại và chấm điểm phát âm cho bạn.
          </p>
        </div>
        
        <div className="flex flex-col gap-3 w-full max-w-xs pt-2">
          <button
            onClick={() => onSelectRole(role1)}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-[0.98] ${
              theme === 'dark'
                ? 'bg-zinc-900/40 border-white/5 hover:border-purple-500/30'
                : 'bg-zinc-50 border-zinc-200 hover:border-purple-400 shadow-sm'
            }`}
          >
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${
              theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
            }`}>Đóng vai 1</span>
            <span className={`text-sm font-bold ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>Nhân vật {role1}</span>
          </button>
          
          <button
            onClick={() => onSelectRole(role2)}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-[0.98] ${
              theme === 'dark'
                ? 'bg-zinc-900/40 border-white/5 hover:border-indigo-500/30'
                : 'bg-zinc-50 border-zinc-200 hover:border-indigo-400 shadow-sm'
            }`}
          >
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${
              theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
            }`}>Đóng vai 2</span>
            <span className={`text-sm font-bold ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>Nhân vật {role2}</span>
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = currentLineIndex >= dialogue.lines.length;

  return (
    <div className="flex flex-col h-full space-y-3.5 max-w-md mx-auto pb-4">
      {/* Active Role Info Header */}
      <div className={`flex items-center justify-between p-3 rounded-xl border flex-shrink-0 ${
        theme === 'dark' ? 'bg-zinc-950/20 border-white/5' : 'bg-zinc-50 border-zinc-200'
      }`}>
        <div className="flex items-center gap-1.5">
          <span className="text-3xs font-semibold uppercase text-zinc-500 tracking-wider">
            {dialogue.type === 'paragraph' ? 'Luyện tập:' : 'Đóng vai:'}
          </span>
          <span className={`text-3xs font-extrabold px-2 py-0.5 rounded-lg border ${
            theme === 'dark' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-purple-100 border-purple-200 text-purple-700'
          }`}>
            {dialogue.type === 'paragraph' ? 'Đọc Đoạn Văn' : selectedRole}
          </span>
        </div>
        <button
          onClick={onResetAIChat}
          className={`flex items-center gap-0.5 text-3xs font-bold ${
            theme === 'dark' ? 'text-zinc-455 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <RotateCcw size={11} />
          {dialogue.type === 'paragraph' ? 'Đọc lại' : 'Làm lại'}
        </button>
      </div>

      {/* Chat Bubbles Container */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {dialogue.lines.map((line, idx) => {
          const isUser = line.speaker === selectedRole;
          const isLineActive = idx === currentLineIndex;
          const isLinePassed = idx < currentLineIndex;

          if (!isLineActive && !isLinePassed) return null;

          if (isUser) {
            return (
              <div key={line.id} className="flex flex-col items-end space-y-1 animate-fade-in">
                <span className="text-[9px] text-zinc-500 font-bold mr-1.5 uppercase">
                  {dialogue.type === 'paragraph' ? `Câu ${idx + 1}` : `${line.speaker} (Bạn)`}
                </span>
                
                {isLinePassed ? (
                  (() => {
                    const resultItem = aiChatTranscript.find(t => t.lineId === line.id);
                    return (
                      <div className="max-w-[90%] space-y-1">
                        <div className={`p-3 rounded-2xl rounded-tr-none border text-xs ${
                          theme === 'dark'
                            ? 'bg-purple-600/10 border-purple-500/25 text-zinc-200'
                            : 'bg-purple-50 border-purple-200 text-zinc-900'
                        }`}>
                          {resultItem?.diff ? (
                            <div className="flex flex-wrap gap-0.5">
                              {resultItem.diff.map((w, wi) => (
                                <span
                                  key={wi}
                                  className={`px-0.5 rounded ${
                                    w.type === 'correct'
                                      ? 'text-emerald-450 font-semibold'
                                      : w.type === 'incorrect'
                                      ? 'text-rose-455 line-through bg-rose-500/10'
                                      : 'text-amber-500 italic'
                                  }`}
                                >
                                  {w.text}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p>{line.en}</p>
                          )}
                          <p className={`text-[10px] mt-1 pt-1 border-t ${theme === 'dark' ? 'border-white/5 text-zinc-500' : 'border-zinc-200 text-zinc-500'}`}>
                            Nghĩa: {line.vi}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-end gap-1.5 text-[10px] text-zinc-550 mr-1">
                          <span className={resultItem && resultItem.score >= 80 ? 'text-emerald-500 font-bold' : resultItem && resultItem.score >= 50 ? 'text-amber-500 font-bold' : 'text-rose-500 font-bold'}>
                            Khớp {resultItem?.score || 0}%
                          </span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className={`w-full p-4 rounded-2xl border shadow-sm space-y-3 animate-slide-up ${
                    theme === 'dark' ? 'bg-zinc-900/60 border-purple-500/30' : 'bg-white border-purple-300'
                  }`}>
                    <div className="space-y-1">
                      <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Hãy đọc câu sau:</span>
                      <p className={`text-base font-bold leading-relaxed ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                        {line.en}
                      </p>
                      <p className="text-2xs italic text-zinc-500">
                        Nghĩa: {line.vi}
                      </p>
                    </div>

                    {hasRecordedCurrentLine && (
                      <div className={`p-2.5 rounded-xl border text-xs ${
                        theme === 'dark' ? 'bg-zinc-950/40 border-white/5' : 'bg-zinc-50 border-zinc-200'
                      }`}>
                        <div className="flex flex-wrap gap-0.5 mb-1.5">
                          {aiUserDiff.map((w, wi) => (
                            <span
                              key={wi}
                              className={`px-0.5 rounded ${
                                w.type === 'correct'
                                  ? 'text-emerald-450 font-semibold'
                                  : w.type === 'incorrect'
                                  ? 'text-rose-455 line-through bg-rose-500/10'
                                  : 'text-amber-500 italic'
                              }`}
                            >
                              {w.text}
                            </span>
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-zinc-550 border-t border-dashed border-zinc-700/25 pt-1">
                          <span className="truncate max-w-[150px]">Bạn nói: &quot;{aiUserRecordedTranscript}&quot;</span>
                          <span className={aiUserScore >= 80 ? 'text-emerald-450' : aiUserScore >= 50 ? 'text-amber-450' : 'text-rose-500'}>
                            {aiUserScore}%
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleRecordAIChat(line)}
                        className={`flex items-center gap-1 py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 flex-1 justify-center ${
                          isRecording === line.id
                            ? 'bg-red-650 text-white animate-pulse'
                            : 'bg-purple-600 text-white'
                        }`}
                      >
                        {isRecording === line.id ? <MicOff size={14} /> : <Mic size={14} />}
                        <span>{isRecording === line.id ? 'Đang nghe...' : 'Bấm Nói'}</span>
                      </button>

                      {hasRecordedCurrentLine ? (
                        <button
                          onClick={onConfirmUserLine}
                          className="flex items-center justify-center gap-1 py-2 px-4 rounded-xl text-xs font-bold bg-emerald-600 text-white active:scale-95 flex-1"
                        >
                          <Check size={14} /> Đi tiếp
                        </button>
                      ) : (
                        <button
                          onClick={onConfirmUserLine}
                          className={`py-2 px-3.5 rounded-xl text-xs font-semibold border active:scale-95 ${
                            theme === 'dark' ? 'border-white/10 text-zinc-400' : 'border-zinc-300 text-zinc-550 bg-white'
                          }`}
                        >
                          Bỏ qua
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
                <span className="text-[9px] text-zinc-500 font-bold ml-1.5 uppercase">{line.speaker} (AI)</span>
                
                <div className="flex items-start gap-1.5 max-w-[90%]">
                  <div className={`p-3 rounded-2xl rounded-tl-none border transition-all duration-300 text-xs ${
                    isLineActive
                      ? theme === 'dark' ? 'bg-zinc-900 border-purple-500/50' : 'bg-purple-50/50 border-purple-300'
                      : theme === 'dark' ? 'bg-zinc-900/20 border-white/5 text-zinc-300' : 'bg-zinc-100/80 border-zinc-200'
                  }`}>
                    {isLineActive ? (
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex space-x-0.5 items-center">
                          <span className="w-1 h-2 bg-purple-500 rounded-full animate-bounce"></span>
                          <span className="w-1 h-3 bg-purple-500 rounded-full animate-bounce delay-75"></span>
                          <span className="w-1 h-2 bg-purple-500 rounded-full animate-bounce delay-150"></span>
                        </div>
                        <span className="text-2xs italic text-zinc-500">AI đang trả lời...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="leading-relaxed">{line.en}</p>
                        <p className={`text-[10px] italic border-t pt-1 ${theme === 'dark' ? 'border-white/5 text-zinc-500' : 'border-zinc-250 text-zinc-500'}`}>
                          Nghĩa: {line.vi}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {isLinePassed && (
                    <button
                      onClick={() => onPlayTTS(line)}
                      className={`p-1.5 rounded-lg border transition-all mt-1 active:scale-95 ${
                        isSpeechPlaying
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-white/5 border-white/5 text-zinc-500'
                      }`}
                    >
                      <Volume2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          }
        })}
      </div>

      {isCompleted && (
        <div className="space-y-4 animate-slide-up">
          {isGeneratingFeedback ? (
            <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center space-y-2.5 ${
              theme === 'dark' ? 'bg-zinc-900/30 border-white/5' : 'bg-zinc-50 border-zinc-200 shadow-sm'
            }`}>
              <RefreshCw className="animate-spin text-purple-500" size={24} />
              <div className="space-y-0.5">
                <h3 className="font-bold text-xs">AI đang chấm điểm phát âm...</h3>
                <p className="text-[10px] text-zinc-500">Vui lòng chờ trong giây lát.</p>
              </div>
            </div>
          ) : aiFeedback ? (
            <div className="space-y-3.5">
              <div className={`p-5 rounded-2xl border space-y-4 ${
                theme === 'dark' ? 'bg-zinc-900/40 border-purple-500/20' : 'bg-zinc-50 border-purple-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-4 justify-between border-b border-dashed border-zinc-700/20 pb-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-purple-500/15 border-purple-500/20 text-purple-400">
                      Hoàn thành
                    </span>
                    <h3 className="text-sm font-bold">Nhận Xét Từ AI</h3>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center h-16 w-16 rounded-full border-2 border-purple-500/40 bg-purple-500/5">
                    <span className="text-sm font-black">
                      {Math.round(
                        aiChatTranscript.reduce((sum, item) => sum + item.score, 0) / aiChatTranscript.length
                      )}%
                    </span>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Độ khớp</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
                    <Sparkles size={11} className="text-purple-400" /> Nhận xét tổng quan
                  </h4>
                  <p className="text-xs leading-relaxed text-zinc-400">
                    {aiFeedback.generalFeedback}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  theme === 'dark' ? 'bg-zinc-900/30 border-white/5' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <h4 className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
                    <Volume2 size={11} className="text-purple-400" /> Phát âm cần lưu ý
                  </h4>
                  <ul className="space-y-1.5">
                    {aiFeedback.pronunciationTips.map((tip, ti) => (
                      <li key={ti} className="text-[11px] leading-relaxed flex items-start gap-1.5 text-zinc-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`p-4 rounded-2xl border space-y-2 ${
                  theme === 'dark' ? 'bg-zinc-900/30 border-white/5' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <h4 className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
                    <Brain size={11} className="text-purple-400" /> Diễn đạt nâng cao
                  </h4>
                  <ul className="space-y-1.5">
                    {aiFeedback.expressionSuggestions.map((sug, si) => (
                      <li key={si} className="text-[11px] leading-relaxed flex items-start gap-1.5 text-zinc-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={onConfirmAIChat}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-purple-600 text-white font-bold py-2.5 text-xs shadow-md active:scale-95"
                >
                  <Check size={13} /> Lưu Kết Quả
                </button>
                <button
                  onClick={onResetAIChat}
                  className={`flex items-center justify-center gap-1 border rounded-xl px-4 py-2.5 text-xs font-bold active:scale-95 ${
                    theme === 'dark' ? 'border-white/10 text-zinc-300' : 'border-zinc-300 bg-white text-zinc-700'
                  }`}
                >
                  <RotateCcw size={13} /> Làm lại
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
