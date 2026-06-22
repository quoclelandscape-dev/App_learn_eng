'use client';

import React from 'react';
import {
  Volume2,
  Mic,
  MicOff,
  Check,
  EyeOff,
  RotateCcw,
  Pause,
  Play
} from 'lucide-react';
import type { DialogueLine, PracticeLevel } from '../../types';
import { WordDiff, calculateAccuracy } from '../../utils/diff';

interface PracticeLineProps {
  line: DialogueLine;
  index: number;
  level: PracticeLevel;
  theme: 'dark' | 'light';
  isSpeechPlaying: boolean;
  isSpeechPaused: boolean;
  isLineRecording: boolean;
  userState: {
    state: 'blur' | 'correct' | 'incorrect' | 'speaking' | 'recorded';
    transcript?: string;
    diff?: WordDiff[];
  };
  userText: string;
  lineResult?: {
    score: number;
    diff: WordDiff[];
  };
  lineRate: number;
  showResults: boolean;
  isRecognizerSupported: boolean;
  interimTranscript?: string;
  onPlayTTS: () => void;
  onPauseTTS: () => void;
  onResumeTTS: () => void;
  onReplayTTS: () => void;
  onToggleSpeed: () => void;
  onToggleShadowState: () => void;
  onToggleRecord: () => void;
  onUserInputChange: (text: string) => void;
  onCompleteLine?: () => void;
  onRedoLine?: () => void;
  lessonType?: 'dialogue' | 'paragraph';
}

export default function PracticeLine({
  line,
  index,
  level,
  theme,
  isSpeechPlaying,
  isSpeechPaused,
  isLineRecording,
  userState,
  userText,
  lineResult,
  lineRate,
  showResults,
  isRecognizerSupported,
  interimTranscript,
  onPlayTTS,
  onPauseTTS,
  onResumeTTS,
  onReplayTTS,
  onToggleSpeed,
  onToggleShadowState,
  onToggleRecord,
  onUserInputChange,
  onCompleteLine,
  onRedoLine,
  lessonType = 'dialogue',
}: PracticeLineProps) {
  // Real-time Copy Typing Character Comparison Helper
  const renderCopyTypeHelper = (targetText: string, userInput: string) => {
    const segments = targetText.split(/(\s+)/);
    let charIndex = 0;

    return (
      <div className="flex flex-wrap text-base md:text-lg font-mono tracking-wide select-none leading-relaxed gap-y-1">
        {segments.map((segment, segIdx) => {
          if (segment.trim() === '') {
            // Space chunk
            return segment.split('').map((char, i) => {
              const idx = charIndex++;
              let charClass = '';
              if (idx < userInput.length) {
                if (userInput[idx] === char) {
                  charClass = theme === 'dark'
                    ? 'text-emerald-400 font-semibold border-b border-emerald-500/30'
                    : 'text-emerald-600 font-bold border-b-2 border-emerald-500/40';
                } else {
                  charClass = theme === 'dark'
                    ? 'text-rose-400 font-semibold bg-rose-500/20 border-b border-rose-500'
                    : 'text-rose-600 font-bold bg-rose-100 border-b-2 border-rose-500';
                }
              } else if (idx === userInput.length) {
                charClass = theme === 'dark'
                  ? 'text-purple-400 font-bold bg-purple-500/10 border-b-2 border-purple-500 animate-pulse'
                  : 'text-purple-700 font-extrabold bg-purple-100 border-b-2 border-purple-650 animate-pulse';
              } else {
                charClass = theme === 'dark'
                  ? 'text-zinc-500/40 opacity-40'
                  : 'text-zinc-400/50 opacity-50';
              }
              return (
                <span key={`space-${segIdx}-${i}`} className={charClass}>
                  {'\u00A0'}
                </span>
              );
            });
          } else {
            // Normal word segment
            return (
              <span key={`word-${segIdx}`} className="inline-block whitespace-nowrap">
                {segment.split('').map((char) => {
                  const idx = charIndex++;
                  let charClass = '';
                  if (idx < userInput.length) {
                    if (userInput[idx] === char) {
                      charClass = theme === 'dark'
                        ? 'text-emerald-400 font-semibold border-b border-emerald-500/30'
                        : 'text-emerald-600 font-bold border-b-2 border-emerald-500/40';
                    } else {
                      charClass = theme === 'dark'
                        ? 'text-rose-400 font-semibold bg-rose-500/20 border-b border-rose-500'
                        : 'text-rose-600 font-bold bg-rose-100 border-b-2 border-rose-500';
                    }
                  } else if (idx === userInput.length) {
                    charClass = theme === 'dark'
                      ? 'text-purple-400 font-bold bg-purple-500/10 border-b-2 border-purple-500 animate-pulse'
                      : 'text-purple-700 font-extrabold bg-purple-100 border-b-2 border-purple-650 animate-pulse';
                  } else {
                    charClass = theme === 'dark'
                      ? 'text-zinc-500/40 opacity-40'
                      : 'text-zinc-400/50 opacity-50';
                  }
                  return (
                    <span key={`char-${idx}`} className={charClass}>
                      {char}
                    </span>
                  );
                })}
              </span>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col md:flex-row gap-6 p-5 md:p-6 rounded-3xl border transition-all duration-200 shadow-sm ${
        isSpeechPlaying
          ? theme === 'dark'
            ? 'bg-purple-600/5 border-purple-500/35'
            : 'bg-purple-50/50 border-purple-400/40 shadow-sm shadow-purple-50'
          : isLineRecording
          ? theme === 'dark'
            ? 'bg-red-500/5 border-red-500/35 animate-pulse'
            : 'bg-red-50/50 border-red-400/40 animate-pulse'
          : theme === 'dark'
          ? 'bg-zinc-900/35 border-white/5'
          : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/50 hover:border-zinc-300'
      }`}
    >
      {/* Speaker Label & Level Score Badge */}
      <div className="flex items-center gap-3 md:flex-col md:items-center md:justify-center md:w-28 flex-shrink-0">
        <div className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-extrabold shadow-md border ${
          lessonType === 'paragraph'
            ? theme === 'dark'
              ? 'bg-zinc-850 border-white/10 text-zinc-400'
              : 'bg-zinc-100 border-zinc-200 text-zinc-600'
            : line.speaker === 'A' || index % 2 === 0
            ? theme === 'dark'
              ? 'bg-purple-600/20 border-purple-500/30 text-purple-400'
              : 'bg-purple-100 border-purple-200 text-purple-700 shadow-purple-100/10'
            : theme === 'dark'
              ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400'
              : 'bg-indigo-100 border-indigo-200 text-indigo-700 shadow-indigo-100/10'
        }`}>
          {lessonType === 'paragraph' ? index + 1 : line.speaker}
        </div>
        
        {/* Previous Level Score / Completion Badge */}
        <div className="flex justify-center select-none">
          {(() => {
            const badge = (() => {
              if (level === 'shadow' && userState.state === 'blur') {
                return { text: 'Chưa hoàn thành', score: null };
              }
              if (level !== 'shadow' && level !== 'ai_chat' && userText.trim() === '') {
                return { text: 'Chưa hoàn thành', score: null };
              }

              if (lineResult !== undefined) {
                return { text: `Đã đạt: ${lineResult.score}%`, score: lineResult.score };
              }
              if (level === 'copy' && userText === line.en) {
                return { text: 'Đã đạt: 100%', score: 100 };
              }
              if (level === 'shadow' && userState.state !== 'blur') {
                const score = userState.state === 'correct' ? 100 : (userState.transcript ? calculateAccuracy(line.en, userState.transcript) : 40);
                return { text: `Đã đạt: ${score}%`, score };
              }

              if (line.scores?.[level] !== undefined) {
                return { text: `Đã đạt: ${line.scores[level]}%`, score: line.scores[level]! };
              }

              return { text: 'Chưa hoàn thành', score: null };
            })();

            if (badge.score !== null) {
              return (
                <span className={`text-[10px] whitespace-nowrap font-bold px-2 py-0.5 rounded-full border ${
                  badge.score >= 80
                    ? theme === 'dark' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-250 text-emerald-700'
                    : badge.score >= 50
                    ? theme === 'dark' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-250 text-amber-700'
                    : theme === 'dark' ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-rose-50 border-rose-250 text-rose-700'
                }`}>
                  {badge.text}
                </span>
              );
            }

            return (
              <span className={`text-[10px] whitespace-nowrap font-medium px-2 py-0.5 rounded-full border ${
                theme === 'dark'
                  ? 'bg-zinc-800 border-white/5 text-zinc-500'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-400'
              }`}>
                {badge.text}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Practice Content columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: English Target/Inputs */}
        <div className="flex flex-col justify-center min-h-[60px] relative">
          
          {/* LEVEL 1: SHADOWING */}
          {level === 'shadow' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={onPlayTTS}
                  className={`p-2 rounded-xl border transition-all ${
                    isSpeechPlaying
                      ? theme === 'dark'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-purple-100 text-purple-700 border-purple-350'
                      : theme === 'dark'
                      ? 'bg-white/5 text-zinc-400 hover:text-zinc-200 border-transparent'
                      : 'bg-zinc-100 text-zinc-650 hover:text-zinc-950 border-zinc-200 shadow-sm'
                  }`}
                  title="Phát phát âm mẫu"
                >
                  <Volume2 size={15} />
                </button>
                <button
                  onClick={onToggleSpeed}
                  className={`text-3xs px-2 py-1 rounded-md font-semibold border ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                  }`}
                  title="Thay đổi tốc độ"
                >
                  {lineRate}x
                </button>
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-650'}`}>Bấm loa để nghe mẫu</span>
              </div>

              {/* English Text Display (Blurred/Colored) */}
              <div
                onClick={onToggleShadowState}
                className={`text-base md:text-lg cursor-pointer p-3.5 rounded-xl select-none transition-all duration-300 border ${
                  userState.state === 'blur'
                    ? theme === 'dark'
                      ? 'filter blur-sm opacity-40 bg-zinc-950/20 border-dashed border-white/10 text-zinc-300 hover:opacity-80'
                      : 'filter blur-sm opacity-45 bg-zinc-150 border-dashed border-zinc-300 text-zinc-650 hover:opacity-80'
                    : userState.state === 'correct'
                    ? theme === 'dark'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                    : userState.state === 'incorrect'
                    ? theme === 'dark'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
                    : theme === 'dark'
                    ? 'bg-zinc-950/20 border-white/5 text-zinc-300'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                }`}
                title="Chạm để kiểm tra thủ công"
              >
                {/* Word breakdown display or pure text */}
                {userState.diff ? (
                  <div className="flex flex-wrap gap-1.5">
                    {userState.diff.map((w, wi) => (
                      <span
                        key={wi}
                        className={`px-0.5 rounded text-base md:text-lg ${
                          w.type === 'correct'
                            ? theme === 'dark' ? 'text-emerald-400 font-semibold' : 'text-emerald-700 font-bold'
                            : w.type === 'incorrect'
                            ? theme === 'dark' ? 'text-rose-450 line-through bg-rose-500/10' : 'text-rose-700 line-through bg-rose-100/50'
                            : theme === 'dark'
                            ? 'text-zinc-550 italic border-b border-dashed border-zinc-700'
                            : 'text-zinc-600 italic border-b border-dashed border-zinc-350'
                        }`}
                      >
                        {w.text}
                      </span>
                    ))}
                  </div>
                ) : (
                  line.en
                )}
              </div>

              {/* Speech Recognition controls */}
              {isRecognizerSupported && (
                <div className="flex items-center gap-3.5 mt-1.5">
                  <button
                    onClick={onToggleRecord}
                    className={`flex items-center gap-2 py-2 px-4 rounded-xl border text-3xs font-bold uppercase tracking-wider transition-all ${
                      isLineRecording
                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20'
                        : theme === 'dark'
                        ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950'
                    }`}
                  >
                    {isLineRecording ? (
                      <>
                        <MicOff size={13} /> Đang nghe...
                      </>
                    ) : (
                      <>
                        <Mic size={13} className="text-red-400" /> Bấm nói
                      </>
                    )}
                  </button>
                  
                  {isLineRecording && interimTranscript && (
                    <span className="text-xs text-purple-400 font-semibold italic animate-pulse truncate max-w-[240px]">
                      Đang nghe: &quot;{interimTranscript}&quot;
                    </span>
                  )}
                  {!isLineRecording && userState.transcript && (
                    <span className="text-xs text-zinc-550 italic truncate max-w-[240px]">
                      Bạn nói: &quot;{userState.transcript}&quot;
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 2: COPY TYPING */}
          {level === 'copy' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-3xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-650'}`}>Viết theo chữ có sẵn</span>
                <button
                  onClick={onPlayTTS}
                  className={`flex items-center gap-1 text-[11px] font-semibold ${
                    theme === 'dark' ? 'text-purple-400 hover:text-purple-300' : 'text-purple-650 hover:text-purple-800'
                  }`}
                >
                  <Volume2 size={13} />
                  Nghe phát âm
                </button>
              </div>

              {showResults && lineResult ? (
                /* Results Diff */
                <div className={`p-4 rounded-2xl border text-base md:text-lg flex flex-col space-y-2 ${
                  theme === 'dark' ? 'border-white/5 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50 shadow-sm'
                }`}>
                  <div className="flex flex-wrap gap-1.5">
                    {lineResult.diff.map((w, wi) => (
                      <span
                        key={wi}
                        className={`px-0.5 rounded ${
                          w.type === 'correct'
                            ? theme === 'dark' ? 'text-emerald-400 font-medium' : 'text-emerald-700 font-bold'
                            : w.type === 'incorrect'
                            ? theme === 'dark' ? 'text-rose-450 line-through bg-rose-500/10' : 'text-rose-700 line-through bg-rose-100/50'
                            : theme === 'dark' ? 'text-amber-500 italic border-b border-dashed border-amber-900/60' : 'text-amber-700 italic border-b border-dashed border-amber-300'
                        }`}
                      >
                        {w.text}
                      </span>
                    ))}
                  </div>
                  {lineResult.score < 100 && (
                    <div className={`text-2xs pt-1.5 border-t ${theme === 'dark' ? 'border-white/5 text-zinc-550' : 'border-zinc-200 text-zinc-500'}`}>
                      Mẫu gốc: <span className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-700'} italic select-all`}>{line.en}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Real-time typing display & Input box */
                <div className="space-y-3">
                  <div className={`p-4 rounded-2xl border shadow-inner ${
                    theme === 'dark' ? 'bg-zinc-950/30 border-white/5' : 'bg-zinc-100 border-zinc-200'
                  }`}>
                    {renderCopyTypeHelper(line.en, userText)}
                  </div>
                  <input
                    type="text"
                    placeholder="Nhìn chữ mờ ở trên và gõ lại..."
                    value={userText}
                    onChange={(e) => onUserInputChange(e.target.value)}
                    className={`w-full rounded-2xl border px-5 py-3 text-base outline-none transition-all font-sans ${
                      theme === 'dark'
                        ? 'border-white/10 bg-white/5 text-zinc-100 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20'
                        : 'border-zinc-300 bg-zinc-50 text-zinc-950 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10'
                    }`}
                  />
                  {userText === line.en && (
                    <span className={`text-[11px] font-semibold flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-lg w-fit border animate-fade-in ${
                      theme === 'dark' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-100 border-emerald-200'
                    }`}>
                      <Check size={12} /> Chính xác!
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 3: DICTATION */}
          {level === 'type' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xs text-zinc-500 font-semibold uppercase tracking-wider">Nhập câu tiếng Anh</span>
                <button
                  onClick={onPlayTTS}
                  className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                >
                  <Volume2 size={13} />
                  Gợi ý âm thanh
                </button>
              </div>

              {(showResults || !!lineResult) && lineResult ? (
                /* Results Diff */
                <div className={`p-4 rounded-2xl border text-base md:text-lg flex flex-col space-y-2 ${
                  theme === 'dark' ? 'border-white/5 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50 shadow-sm'
                }`}>
                  <div className="flex flex-wrap gap-1.5">
                    {lineResult.diff.map((w, wi) => (
                      <span
                        key={wi}
                        className={`px-0.5 rounded ${
                          w.type === 'correct'
                            ? theme === 'dark' ? 'text-emerald-400 font-medium' : 'text-emerald-700 font-bold'
                            : w.type === 'incorrect'
                            ? theme === 'dark' ? 'text-rose-450 line-through bg-rose-500/10' : 'text-rose-700 line-through bg-rose-100/50'
                            : theme === 'dark' ? 'text-amber-500 italic border-b border-dashed border-amber-900/60' : 'text-amber-700 italic border-b border-dashed border-amber-300'
                        }`}
                      >
                        {w.text}
                      </span>
                    ))}
                  </div>
                  {lineResult.score < 100 && (
                    <div className={`text-2xs pt-1.5 border-t ${theme === 'dark' ? 'border-white/5 text-zinc-550' : 'border-zinc-200 text-zinc-500'}`}>
                      Đáp án đúng: <span className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-700'} italic select-all`}>{line.en}</span>
                    </div>
                  )}
                  {onRedoLine && (
                    <button
                      onClick={onRedoLine}
                      className={`w-fit mt-1 flex items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold border transition-all active:scale-[0.98] ${
                        theme === 'dark'
                          ? 'border-white/10 hover:bg-white/5 text-zinc-300'
                          : 'border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-750 shadow-sm'
                      }`}
                    >
                      <RotateCcw size={11} /> Làm lại
                    </button>
                  )}
                </div>
              ) : (
                /* Input box */
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Type what you hear/read..."
                    value={userText}
                    onChange={(e) => onUserInputChange(e.target.value)}
                    className={`w-full rounded-2xl border px-5 py-3 text-base md:text-lg outline-none transition-all ${
                      theme === 'dark'
                        ? 'border-white/10 bg-white/5 text-zinc-100 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20'
                        : 'border-zinc-300 bg-zinc-50 text-zinc-950 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10'
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && onCompleteLine) {
                        onCompleteLine();
                      }
                    }}
                  />
                  {onCompleteLine && (
                    <button
                      onClick={onCompleteLine}
                      className="w-fit flex items-center gap-1 py-1 px-3.5 rounded-lg text-[10px] font-bold bg-purple-650 hover:bg-purple-550 text-white transition-all active:scale-[0.98] shadow-md shadow-purple-600/10"
                    >
                      <Check size={11} /> Hoàn thành
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 4: LISTENING */}
          {level === 'listen' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2">
                  {/* Button 1: Play/Pause toggle - single button that changes behavior based on state */}
                  <button
                    onClick={
                      isSpeechPlaying && !isSpeechPaused
                        ? onPauseTTS
                        : isSpeechPaused
                        ? onResumeTTS
                        : onPlayTTS
                    }
                    className={`p-2.5 rounded-xl border transition-all ${
                      isSpeechPlaying && !isSpeechPaused
                        ? theme === 'dark'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                          : 'bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100 shadow-sm'
                        : isSpeechPaused
                        ? theme === 'dark'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-300 hover:bg-emerald-100 shadow-sm'
                        : theme === 'dark'
                        ? 'bg-white/5 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30 border-white/10'
                        : 'bg-zinc-100 text-zinc-500 hover:text-purple-600 hover:bg-purple-50 hover:border-purple-300 border-zinc-200 shadow-sm'
                    }`}
                    title={
                      isSpeechPlaying && !isSpeechPaused
                        ? 'Tạm dừng'
                        : isSpeechPaused
                        ? 'Tiếp tục nghe'
                        : 'Phát Audio'
                    }
                  >
                    {isSpeechPlaying && !isSpeechPaused ? (
                      <Pause size={15} />
                    ) : (
                      <Play size={15} />
                    )}
                  </button>

                  {/* Button 2: Replay - always visible, always restarts from beginning */}
                  <button
                    onClick={onReplayTTS}
                    className={`p-2.5 rounded-xl border transition-all ${
                      theme === 'dark'
                        ? 'bg-white/5 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30 border-white/10'
                        : 'bg-zinc-100 text-zinc-500 hover:text-purple-600 hover:bg-purple-50 hover:border-purple-300 border-zinc-200 shadow-sm'
                    }`}
                    title="Nghe lại từ đầu"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>

                {/* Status text */}
                <span className={`text-3xs font-semibold uppercase tracking-wider ${
                  isSpeechPlaying && !isSpeechPaused
                    ? theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                    : isSpeechPaused
                    ? theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                    : theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'
                }`}>
                  {isSpeechPlaying && !isSpeechPaused
                    ? 'Đang phát...'
                    : isSpeechPaused
                    ? 'Đã tạm dừng'
                    : 'Nghe và ghi lại'}
                </span>
              </div>

              {(showResults || !!lineResult) && lineResult ? (
                /* Results Diff */
                <div className={`p-4 rounded-2xl border text-base md:text-lg flex flex-col space-y-2 ${
                  theme === 'dark' ? 'border-white/5 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50 shadow-sm'
                }`}>
                  <div className="flex flex-wrap gap-1.5">
                    {lineResult.diff.map((w, wi) => (
                      <span
                        key={wi}
                        className={`px-0.5 rounded ${
                          w.type === 'correct'
                            ? theme === 'dark' ? 'text-emerald-400 font-medium' : 'text-emerald-700 font-bold'
                            : w.type === 'incorrect'
                            ? theme === 'dark' ? 'text-rose-450 line-through bg-rose-500/10' : 'text-rose-700 line-through bg-rose-100/50'
                            : theme === 'dark' ? 'text-amber-500 italic border-b border-dashed border-amber-900/60' : 'text-amber-700 italic border-b border-dashed border-amber-300'
                        }`}
                      >
                        {w.text}
                      </span>
                    ))}
                  </div>
                  <div className={`text-2xs pt-1.5 border-t ${theme === 'dark' ? 'border-white/5 text-zinc-550' : 'border-zinc-200 text-zinc-500'}`}>
                    Đáp án đúng: <span className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-700'} italic select-all`}>{line.en}</span>
                  </div>
                  {onRedoLine && (
                    <button
                      onClick={onRedoLine}
                      className={`w-fit mt-1 flex items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold border transition-all active:scale-[0.98] ${
                        theme === 'dark'
                          ? 'border-white/10 hover:bg-white/5 text-zinc-300'
                          : 'border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-750 shadow-sm'
                      }`}
                    >
                      <RotateCcw size={11} /> Làm lại
                    </button>
                  )}
                </div>
              ) : (
                /* Input box */
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nghe Audio và nhập lại..."
                    value={userText}
                    onChange={(e) => onUserInputChange(e.target.value)}
                    className={`w-full rounded-2xl border px-5 py-3 text-base md:text-lg outline-none transition-all ${
                      theme === 'dark'
                        ? 'border-white/10 bg-white/5 text-zinc-100 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20'
                        : 'border-zinc-300 bg-zinc-50 text-zinc-950 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/10'
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && onCompleteLine) {
                        onCompleteLine();
                      }
                    }}
                  />
                  {onCompleteLine && (
                    <button
                      onClick={onCompleteLine}
                      className="w-fit flex items-center gap-1 py-1 px-3.5 rounded-lg text-[10px] font-bold bg-purple-650 hover:bg-purple-550 text-white transition-all active:scale-[0.98] shadow-md shadow-purple-600/10"
                    >
                      <Check size={11} /> Hoàn thành
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Vietnamese Translation */}
        <div className={`flex flex-col justify-center border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-5 ${
          theme === 'dark' ? 'border-white/5' : 'border-zinc-200'
        }`}>
          <span className="text-4xs text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Nghĩa tiếng Việt</span>
          
          {level === 'listen' && !showResults && !lineResult ? (
            /* In listening mode, hide the translation until they click Play or Reveal */
            <div className="flex items-center gap-1.5 text-sm text-zinc-500 italic">
              <EyeOff size={14} />
              <span>Nghĩa tiếng Việt bị ẩn ở Level 4</span>
            </div>
          ) : (
            /* Show translation */
            <p className={`text-sm md:text-base leading-relaxed font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-800'}`}>
              {line.vi}
            </p>
          )}

          {/* Individual line score display */}
          {(showResults || !!lineResult) && lineResult && (
            <div className="mt-3 text-2xs font-semibold text-zinc-500">
              Độ chính xác: <span className={lineResult.score >= 80 ? 'text-emerald-400' : lineResult.score >= 50 ? 'text-amber-400' : 'text-rose-450'}>{lineResult.score}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
