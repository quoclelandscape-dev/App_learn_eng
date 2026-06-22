'use client';

import React from 'react';
import { Volume2, Mic, MicOff, Check, RotateCcw, Pause, Play, EyeOff } from 'lucide-react';
import type { DialogueLine, PracticeLevel } from '../../../types';
import { WordDiff, calculateAccuracy } from '../../../utils/diff';

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
  
  const renderCopyTypeHelper = (targetText: string, userInput: string) => {
    const segments = targetText.split(/(\s+)/);
    let charIndex = 0;

    return (
      <div className="flex flex-wrap text-sm font-mono tracking-wide leading-relaxed gap-y-0.5">
        {segments.map((segment, segIdx) => {
          if (segment.trim() === '') {
            return segment.split('').map((char, i) => {
              const idx = charIndex++;
              let charClass = '';
              if (idx < userInput.length) {
                charClass = userInput[idx] === char
                  ? 'text-emerald-400 font-semibold border-b border-emerald-500/30'
                  : 'text-rose-455 font-semibold bg-rose-500/10 border-b border-rose-500';
              } else if (idx === userInput.length) {
                charClass = 'text-purple-400 font-bold bg-purple-500/10 border-b-2 border-purple-500 animate-pulse';
              } else {
                charClass = theme === 'dark' ? 'text-zinc-600 opacity-40' : 'text-zinc-400/50';
              }
              return <span key={`space-${segIdx}-${i}`} className={charClass}>{'\u00A0'}</span>;
            });
          } else {
            return (
              <span key={`word-${segIdx}`} className="inline-block">
                {segment.split('').map((char) => {
                  const idx = charIndex++;
                  let charClass = '';
                  if (idx < userInput.length) {
                    charClass = userInput[idx] === char
                      ? 'text-emerald-400 font-semibold border-b border-emerald-500/30'
                      : 'text-rose-455 font-semibold bg-rose-500/10 border-b border-rose-500';
                  } else if (idx === userInput.length) {
                    charClass = 'text-purple-400 font-bold bg-purple-500/10 border-b-2 border-purple-500 animate-pulse';
                  } else {
                    charClass = theme === 'dark' ? 'text-zinc-600 opacity-40' : 'text-zinc-400/50';
                  }
                  return <span key={`char-${idx}`} className={charClass}>{char}</span>;
                })}
              </span>
            );
          }
        })}
      </div>
    );
  };

  const badgeInfo = (() => {
    if (level === 'shadow' && userState.state === 'blur') return { text: 'Chưa học', score: null };
    if (level !== 'shadow' && userText.trim() === '') return { text: 'Chưa học', score: null };
    if (lineResult !== undefined) return { text: `Đạt: ${lineResult.score}%`, score: lineResult.score };
    if (level === 'copy' && userText === line.en) return { text: 'Đạt: 100%', score: 100 };
    if (level === 'shadow' && userState.state !== 'blur') {
      const score = userState.state === 'correct' ? 100 : (userState.transcript ? calculateAccuracy(line.en, userState.transcript) : 40);
      return { text: `Đạt: ${score}%`, score };
    }
    if (line.scores?.[level] !== undefined) return { text: `Đạt: ${line.scores[level]}%`, score: line.scores[level]! };
    return { text: 'Chưa học', score: null };
  })();

  return (
    <div className={`flex flex-col gap-3.5 p-4 rounded-2xl border transition-all duration-200 ${
      isSpeechPlaying
        ? theme === 'dark' ? 'bg-purple-650/10 border-purple-500/40' : 'bg-purple-50/70 border-purple-300'
        : isLineRecording
        ? theme === 'dark' ? 'bg-red-500/10 border-red-500/40 animate-pulse' : 'bg-red-50/70 border-red-300'
        : theme === 'dark' ? 'bg-zinc-900/35 border-white/5' : 'bg-white border-zinc-200/80 shadow-sm'
    }`}>
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-dashed border-zinc-700/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black border ${
            lessonType === 'paragraph'
              ? theme === 'dark' ? 'bg-zinc-800 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-650'
              : line.speaker === 'A' || index % 2 === 0
              ? theme === 'dark' ? 'bg-purple-600/20 border-purple-500/20 text-purple-400' : 'bg-purple-100 border-purple-200 text-purple-700'
              : theme === 'dark' ? 'bg-indigo-600/20 border-indigo-500/20 text-indigo-400' : 'bg-indigo-100 border-indigo-200 text-indigo-700'
          }`}>
            {lessonType === 'paragraph' ? index + 1 : line.speaker}
          </div>
          {lessonType !== 'paragraph' && (
            <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-zinc-450' : 'text-zinc-500'}`}>
              Người nói: {line.speaker}
            </span>
          )}
        </div>

        {badgeInfo.score !== null ? (
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
            badgeInfo.score >= 80
              ? theme === 'dark' ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-250 text-emerald-700'
              : badgeInfo.score >= 50
              ? theme === 'dark' ? 'bg-amber-500/15 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-250 text-amber-700'
              : theme === 'dark' ? 'bg-rose-500/15 border-rose-500/20 text-rose-455' : 'bg-rose-50 border-rose-250 text-rose-700'
          }`}>
            {badgeInfo.text}
          </span>
        ) : (
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
            theme === 'dark' ? 'bg-zinc-800/60 border-white/5 text-zinc-550' : 'bg-zinc-100 border-zinc-200 text-zinc-450'
          }`}>
            {badgeInfo.text}
          </span>
        )}
      </div>

      {/* English Practice Block */}
      <div className="space-y-3">
        {level === 'shadow' && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={onPlayTTS}
                className={`p-2 rounded-xl border transition-all active:scale-90 ${
                  isSpeechPlaying
                    ? theme === 'dark' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-100 text-purple-700 border-purple-300'
                    : theme === 'dark' ? 'bg-white/5 border-transparent text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-650'
                }`}
              >
                <Volume2 size={13} />
              </button>
              <button
                onClick={onToggleSpeed}
                className={`text-[9px] px-2 py-1 rounded-md font-semibold border ${
                  theme === 'dark' ? 'bg-white/5 border-white/5 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                }`}
              >
                {lineRate}x
              </button>
              <span className={`text-3xs font-medium ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>Bấm nghe mẫu</span>
            </div>

            <div
              onClick={onToggleShadowState}
              className={`text-sm p-3.5 rounded-xl border transition-all select-none ${
                userState.state === 'blur'
                  ? 'filter blur-sm opacity-45 bg-zinc-950/20 border-dashed border-white/5 text-zinc-400'
                  : userState.state === 'correct'
                  ? theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' : 'bg-emerald-50 border-emerald-250 text-emerald-700 font-semibold'
                  : userState.state === 'incorrect'
                  ? theme === 'dark' ? 'bg-rose-500/10 border-rose-500/20 text-rose-455' : 'bg-rose-50 border-rose-250 text-rose-700 font-semibold'
                  : 'bg-zinc-950/20 border-white/5 text-zinc-300'
              }`}
            >
              {userState.diff ? (
                <div className="flex flex-wrap gap-1">
                  {userState.diff.map((w, wi) => (
                    <span
                      key={wi}
                      className={`px-0.5 rounded text-sm ${
                        w.type === 'correct'
                          ? 'text-emerald-400 font-semibold'
                          : w.type === 'incorrect'
                          ? 'text-rose-400 line-through bg-rose-500/10'
                          : 'text-zinc-500 italic border-b border-dashed border-zinc-700'
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

            {isRecognizerSupported && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onToggleRecord}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-3xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                    isLineRecording
                      ? 'bg-red-600 border-red-500 text-white shadow-md'
                      : theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-650'
                  }`}
                >
                  {isLineRecording ? <MicOff size={11} /> : <Mic size={11} className="text-red-405" />}
                  <span>{isLineRecording ? 'Đang nghe' : 'Bấm nói'}</span>
                </button>
                {userState.transcript && (
                  <span className="text-[10px] text-zinc-550 italic truncate max-w-[150px]">
                    &quot;{userState.transcript}&quot;
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {level === 'copy' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-3xs text-zinc-500 font-semibold uppercase tracking-wider">Gõ lại chữ có sẵn</span>
              <button
                onClick={onPlayTTS}
                className="flex items-center gap-0.5 text-3xs text-purple-400 font-bold active:scale-95"
              >
                <Volume2 size={11} /> Nghe mẫu
              </button>
            </div>

            {showResults && lineResult ? (
              <div className={`p-3.5 rounded-xl border text-sm flex flex-col space-y-1.5 ${
                theme === 'dark' ? 'border-white/5 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50 shadow-sm'
              }`}>
                <div className="flex flex-wrap gap-1">
                  {lineResult.diff.map((w, wi) => (
                    <span
                      key={wi}
                      className={`px-0.5 rounded ${
                        w.type === 'correct'
                          ? 'text-emerald-400 font-semibold'
                          : w.type === 'incorrect'
                          ? 'text-rose-455 line-through bg-rose-500/10'
                          : 'text-amber-500 italic'
                      }`}
                    >
                      {w.text}
                    </span>
                  ))}
                </div>
                {lineResult.score < 100 && (
                  <div className="text-[10px] pt-1.5 border-t border-dashed border-zinc-700/20 text-zinc-500 italic">
                    Gốc: {line.en}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className={`p-3 rounded-xl border shadow-inner ${
                  theme === 'dark' ? 'bg-zinc-950/30 border-white/5' : 'bg-zinc-100 border-zinc-200'
                }`}>
                  {renderCopyTypeHelper(line.en, userText)}
                </div>
                <textarea
                  rows={2}
                  placeholder="Gõ lại câu trên..."
                  value={userText}
                  onChange={(e) => onUserInputChange(e.target.value)}
                  className={`w-full min-h-[60px] rounded-xl border px-3 py-2 text-base outline-none resize-none transition-all ${
                    theme === 'dark' ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-500' : 'border-zinc-350 bg-zinc-50 text-zinc-900 placeholder-zinc-450 focus:bg-white'
                  }`}
                />
              </div>
            )}
          </div>
        )}

        {(level === 'type' || level === 'listen') && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-3xs text-zinc-500 font-semibold uppercase tracking-wider">
                {level === 'type' ? 'Nhập câu bạn đọc được' : 'Ghi âm / Gõ những gì nghe được'}
              </span>
              <div className="flex items-center gap-1.5">
                {level === 'listen' ? (
                  <button
                    onClick={
                      isSpeechPlaying && !isSpeechPaused
                        ? onPauseTTS
                        : isSpeechPaused
                        ? onResumeTTS
                        : onPlayTTS
                    }
                    className={`p-1.5 rounded-lg border transition-all active:scale-95 ${
                      isSpeechPlaying && !isSpeechPaused
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    {isSpeechPlaying && !isSpeechPaused ? <Pause size={11} /> : <Play size={11} />}
                  </button>
                ) : (
                  <button
                    onClick={onPlayTTS}
                    className="flex items-center gap-0.5 text-3xs text-purple-400 font-bold active:scale-95"
                  >
                    <Volume2 size={11} /> Gợi ý âm thanh
                  </button>
                )}
                {level === 'listen' && (
                  <button
                    onClick={onReplayTTS}
                    className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-zinc-400 active:scale-95"
                  >
                    <RotateCcw size={11} />
                  </button>
                )}
              </div>
            </div>

            {(showResults || !!lineResult) && lineResult ? (
              <div className={`p-3.5 rounded-xl border text-sm flex flex-col space-y-1.5 ${
                theme === 'dark' ? 'border-white/5 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50 shadow-sm'
              }`}>
                <div className="flex flex-wrap gap-1">
                  {lineResult.diff.map((w, wi) => (
                    <span
                      key={wi}
                      className={`px-0.5 rounded ${
                        w.type === 'correct'
                          ? 'text-emerald-400 font-semibold'
                          : w.type === 'incorrect'
                          ? 'text-rose-455 line-through bg-rose-500/10'
                          : 'text-amber-500 italic'
                      }`}
                    >
                      {w.text}
                    </span>
                  ))}
                </div>
                {lineResult.score < 100 && (
                  <div className="text-[10px] pt-1.5 border-t border-dashed border-zinc-700/20 text-zinc-500 italic">
                    Đáp án đúng: {line.en}
                  </div>
                )}
                {onRedoLine && (
                  <button
                    onClick={onRedoLine}
                    className="w-fit flex items-center gap-0.5 border border-white/10 rounded-lg px-2.5 py-1 text-[9px] font-semibold hover:bg-white/5 active:scale-95"
                  >
                    <RotateCcw size={10} /> Làm lại
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <textarea
                  rows={2}
                  placeholder={level === 'listen' ? "Nghe Audio và gõ lại..." : "Type here..."}
                  value={userText}
                  onChange={(e) => onUserInputChange(e.target.value)}
                  className={`w-full min-h-[60px] rounded-xl border px-3.5 py-2 text-base outline-none resize-none transition-all ${
                    theme === 'dark' ? 'border-white/10 bg-white/5 text-zinc-100 placeholder-zinc-500' : 'border-zinc-350 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:bg-white'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (onCompleteLine) {
                        onCompleteLine();
                      }
                    }
                  }}
                />
                {onCompleteLine && (
                  <button
                    onClick={onCompleteLine}
                    className="w-fit flex items-center gap-1 py-1 px-3 rounded-lg text-3xs font-extrabold bg-purple-650 hover:bg-purple-550 text-white shadow-sm"
                  >
                    <Check size={10} /> Hoàn thành
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vietnamese translation block */}
      <div className={`mt-1.5 pt-3 border-t border-dashed border-zinc-700/10 flex flex-col gap-1`}>
        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Nghĩa tiếng Việt</span>
        
        {level === 'listen' && !showResults && !lineResult ? (
          <div className="flex items-center gap-1 text-xs text-zinc-500 italic">
            <EyeOff size={12} />
            <span>Nghĩa tiếng Việt bị ẩn ở chế độ Listen</span>
          </div>
        ) : (
          <p className={`text-xs font-semibold leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-750'}`}>
            {line.vi}
          </p>
        )}

        {(showResults || !!lineResult) && lineResult && (
          <span className="text-[10px] font-bold text-zinc-450 mt-1">
            Độ chính xác: <span className={lineResult.score >= 80 ? 'text-emerald-450' : lineResult.score >= 50 ? 'text-amber-450' : 'text-rose-500'}>{lineResult.score}%</span>
          </span>
        )}
      </div>
    </div>
  );
}
