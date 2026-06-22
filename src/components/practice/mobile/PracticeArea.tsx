'use client';
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Volume2,
  Check,
  RotateCcw,
  Sparkles,
  Award,
  Keyboard,
  Ear,
  Eye,
  AlertCircle,
  Brain
} from 'lucide-react';
import type { Dialogue, DialogueLine, PracticeLevel, Settings } from '../../../types';
import { speak, stopSpeaking, pauseSpeaking, resumeSpeaking, SpeechRecognizer } from '../../../utils/speech';
import { diffWords, WordDiff, calculateAccuracy } from '../../../utils/diff';
import { generateAIChatFeedback, AIChatFeedback } from '../../../utils/ai';
import { sanitizeText } from '../../../utils/security';
import PracticeLine from './PracticeLine';
import AIChatView from './AIChatView';

interface PracticeAreaProps {
  dialogue: Dialogue | null;
  settings: Settings;
  onPracticeComplete: (score: number, level: PracticeLevel, updatedLines: DialogueLine[]) => void;
  theme: 'dark' | 'light';
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, description: string) => void;
}

export default function PracticeArea({
  dialogue,
  settings,
  onPracticeComplete,
  theme,
  showToast,
}: PracticeAreaProps) {
  const [level, setLevel] = useState<PracticeLevel>('shadow');
  
  // Shadowing Mode State
  const [lineStates, setLineStates] = useState<Record<string, {
    state: 'blur' | 'correct' | 'incorrect' | 'speaking' | 'recorded';
    transcript?: string;
    diff?: WordDiff[];
  }>>({});
  const [activeSpeechLineId, setActiveSpeechLineId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [interimTranscripts, setInterimTranscripts] = useState<Record<string, string>>({});
  const micSessionStartRef = useRef<number | null>(null);

  const checkMicTimeout = (): boolean => {
    const now = Date.now();
    if (!micSessionStartRef.current) {
      micSessionStartRef.current = now;
    } else if (now - micSessionStartRef.current > 30 * 60 * 1000) {
      recognizer.stop();
      setIsRecording(null);
      showToast('warning', 'Hết hạn sử dụng Mic', 'Thời gian sử dụng micro đã đạt giới hạn 30 phút để tiết kiệm năng lượng. Vui lòng bấm nói lại để xác nhận tiếp tục.');
      micSessionStartRef.current = null;
      return true;
    }
    return false;
  };

  // Dictation/Listening Mode State
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<Record<string, {
    score: number;
    diff: WordDiff[];
  }>>({});
  
  const [playbackRates, setPlaybackRates] = useState<Record<string, number>>({});
  const [isPaused, setIsPaused] = useState<string | null>(null);
  const speechSessionRef = useRef(0);
  const recognizer = useMemo(() => new SpeechRecognizer(), []);

  // AI Roleplay State
  const [selectedRole, setSelectedRole] = useState<'A' | 'B' | 'Paragraph' | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [aiChatTranscript, setAiChatTranscript] = useState<Array<{
    lineId: string;
    lineText: string;
    userTranscript: string;
    score: number;
    diff?: WordDiff[];
  }>>([]);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState<boolean>(false);
  const [aiFeedback, setAiFeedback] = useState<AIChatFeedback | null>(null);
  const [aiUserRecordedTranscript, setAiUserRecordedTranscript] = useState<string>('');
  const [aiUserScore, setAiUserScore] = useState<number>(0);
  const [aiUserDiff, setAiUserDiff] = useState<WordDiff[]>([]);
  const [hasRecordedCurrentLine, setHasRecordedCurrentLine] = useState<boolean>(false);

  // Load AI Roleplay draft on dialogue/level change
  useEffect(() => {
    if (dialogue && level === 'ai_chat') {
      const draftKey = `sd_draft_aichat_${dialogue.id}`;
      try {
        const draftStr = localStorage.getItem(draftKey);
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          setSelectedRole(draft.selectedRole);
          setCurrentLineIndex(draft.currentLineIndex);
          setAiChatTranscript(draft.aiChatTranscript || []);
          setAiFeedback(draft.aiFeedback || null);
        } else {
          setSelectedRole(dialogue.type === 'paragraph' ? 'Paragraph' : null);
          setCurrentLineIndex(0);
          setAiChatTranscript([]);
          setAiFeedback(null);
        }
      } catch (e) {
        console.error("Error loading AI Chat draft:", e);
      }
    } else {
      setSelectedRole(null);
      setCurrentLineIndex(0);
      setAiChatTranscript([]);
      setAiFeedback(null);
    }
  }, [dialogue, level]);

  // Save AI Roleplay draft
  useEffect(() => {
    if (!dialogue || level !== 'ai_chat' || showResults) return;
    if (selectedRole === null) return;
    
    const draftKey = `sd_draft_aichat_${dialogue.id}`;
    const draft = {
      selectedRole,
      currentLineIndex,
      aiChatTranscript,
      aiFeedback
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [selectedRole, currentLineIndex, aiChatTranscript, aiFeedback, dialogue, level, showResults]);

  // Save inputs drafts
  useEffect(() => {
    if (!dialogue || showResults) return;
    const inputsKey = `sd_draft_inputs_${dialogue.id}`;
    const hasInputs = Object.values(userInputs).some(val => val !== '');
    if (hasInputs) {
      localStorage.setItem(inputsKey, JSON.stringify(userInputs));
    } else {
      localStorage.removeItem(inputsKey);
    }
  }, [userInputs, dialogue, showResults]);

  useEffect(() => {
    if (!dialogue || showResults) return;
    const statesKey = `sd_draft_states_${dialogue.id}`;
    const hasStates = Object.values(lineStates).some(s => s?.state && s.state !== 'blur');
    if (hasStates) {
      localStorage.setItem(statesKey, JSON.stringify(lineStates));
    } else {
      localStorage.removeItem(statesKey);
    }
  }, [lineStates, dialogue, showResults]);

  useEffect(() => {
    if (!dialogue || showResults) return;
    const resultsKey = `sd_draft_results_${dialogue.id}`;
    const hasResults = Object.keys(results).length > 0;
    if (hasResults) {
      localStorage.setItem(resultsKey, JSON.stringify(results));
    } else {
      localStorage.removeItem(resultsKey);
    }
  }, [results, dialogue, showResults]);

  // Reset tab state
  useEffect(() => {
    stopSpeaking();
    setActiveSpeechLineId(null);
    setIsRecording(null);
    setRecordingError(null);
    setShowResults(false);
  }, [dialogue, level]);

  // Load drafts
  useEffect(() => {
    if (dialogue) {
      const inputsKey = `sd_draft_inputs_${dialogue.id}`;
      const resultsKey = `sd_draft_results_${dialogue.id}`;
      const statesKey = `sd_draft_states_${dialogue.id}`;
      
      let savedInputs: Record<string, string> = {};
      let savedStates: Record<string, any> = {};
      let savedResults: Record<string, any> = {};
      
      try {
        const cachedInputs = localStorage.getItem(inputsKey);
        if (cachedInputs) savedInputs = JSON.parse(cachedInputs);
      } catch (e) {}
      
      try {
        const cachedStates = localStorage.getItem(statesKey);
        if (cachedStates) savedStates = JSON.parse(cachedStates);
      } catch (e) {}

      try {
        const cachedResults = localStorage.getItem(resultsKey);
        if (cachedResults) savedResults = JSON.parse(cachedResults);
      } catch (e) {}

      const inputs = { ...savedInputs };
      const states = { ...savedStates };
      const rates: Record<string, number> = {};
      
      dialogue.lines.forEach(line => {
        if (states[line.id] === undefined) {
          states[line.id] = { state: 'blur' };
        }
        rates[line.id] = settings.speechRate;
      });
      
      setUserInputs(inputs);
      setLineStates(states);
      setPlaybackRates(rates);
      setResults(savedResults);
    } else {
      setUserInputs({});
      setLineStates({});
      setPlaybackRates({});
      setResults({});
    }
  }, [dialogue]);

  useEffect(() => {
    if (dialogue) {
      const rates: Record<string, number> = {};
      dialogue.lines.forEach(line => {
        rates[line.id] = settings.speechRate;
      });
      setPlaybackRates(rates);
    }
  }, [settings.speechRate, dialogue]);

  // AI Turn TTS Automation
  useEffect(() => {
    if (level !== 'ai_chat' || !selectedRole || !dialogue) return;
    if (currentLineIndex >= dialogue.lines.length) return;
    
    const currentLine = dialogue.lines[currentLineIndex];
    const isAiTurn = currentLine.speaker !== selectedRole;
    
    if (isAiTurn) {
      const playAiLine = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        setActiveSpeechLineId(currentLine.id);
        try {
          await speak(currentLine.en, settings.voiceName, settings.speechRate);
          await new Promise(resolve => setTimeout(resolve, 1000));
          setCurrentLineIndex(prev => prev + 1);
        } catch (e) {
          console.error("AI Roleplay TTS interrupted:", e);
        } finally {
          setActiveSpeechLineId(null);
        }
      };
      
      playAiLine();
    }
  }, [currentLineIndex, selectedRole, level, dialogue, settings.voiceName, settings.speechRate]);

  // AI Feedback generation
  useEffect(() => {
    if (level === 'ai_chat' && selectedRole && dialogue && currentLineIndex === dialogue.lines.length && aiChatTranscript.length > 0 && !aiFeedback && !isGeneratingFeedback) {
      const getFeedback = async () => {
        setIsGeneratingFeedback(true);
        try {
          const finalApiKey = settings.geminiApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
          if (!finalApiKey) {
            showToast('warning', 'Thiếu API Key', 'Vui lòng cấu hình Gemini API Key để nhận feedback từ AI.');
            setAiFeedback({
              generalFeedback: 'Không thể lấy feedback chi tiết vì chưa cấu hình Gemini API Key. Tuy nhiên, bạn đã hoàn thành bài học!',
              pronunciationTips: ['Vui lòng cấu hình API Key trong cài đặt.'],
              expressionSuggestions: ['Sử dụng Gemini API Key để nhận lời khuyên nâng cao.']
            });
            return;
          }
          
          const feedback = await generateAIChatFeedback(
            dialogue.title,
            aiChatTranscript.map(t => ({
              lineText: t.lineText,
              userTranscript: t.userTranscript,
              score: t.score
            })),
            finalApiKey
          );
          setAiFeedback(feedback);
        } catch (e) {
          console.error("Error generating feedback:", e);
          const errorMessage = e instanceof Error ? e.message : 'Không thể kết nối với Gemini API';
          showToast('error', 'Lỗi lấy feedback', errorMessage);
          setAiFeedback({
            generalFeedback: 'Lỗi khi gọi Gemini API. Bạn vẫn có thể xem điểm phát âm trung bình bên dưới.',
            pronunciationTips: [`Chi tiết lỗi: ${errorMessage}`],
            expressionSuggestions: ['Hãy kiểm tra lại cấu hình API key hoặc thử lại sau.']
          });
        } finally {
          setIsGeneratingFeedback(false);
        }
      };
      
      getFeedback();
    }
  }, [currentLineIndex, selectedRole, level, dialogue, aiChatTranscript, aiFeedback, isGeneratingFeedback, settings.geminiApiKey]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      recognizer.stop();
    };
  }, [recognizer]);

  if (!dialogue) return null;

  const speakLine = async (line: DialogueLine) => {
    stopSpeaking();
    setIsPaused(null);
    
    const session = ++speechSessionRef.current;
    setActiveSpeechLineId(line.id);
    const rate = playbackRates[line.id] || 1.0;
    try {
      await speak(line.en, settings.voiceName, rate);
    } catch (e) {
    } finally {
      if (speechSessionRef.current === session) {
        setActiveSpeechLineId(null);
        setIsPaused(null);
      }
    }
  };

  const handlePlayTTS = (line: DialogueLine) => speakLine(line);
  const handlePauseTTS = (lineId: string) => {
    pauseSpeaking();
    setIsPaused(lineId);
  };
  const handleResumeTTS = (lineId: string) => {
    resumeSpeaking();
    setIsPaused(null);
  };
  const handleReplayTTS = (line: DialogueLine) => speakLine(line);
  
  const toggleSpeed = (lineId: string) => {
    setPlaybackRates(prev => {
      const current = prev[lineId] || 1.0;
      let next = 1.0;
      if (current === 1.0) next = 0.75;
      else if (current === 0.75) next = 1.25;
      else next = 1.0;
      return { ...prev, [lineId]: next };
    });
  };

  const playWholeDialogue = async () => {
    stopSpeaking();
    setIsPaused(null);
    
    for (const line of dialogue.lines) {
      setActiveSpeechLineId(line.id);
      try {
        await speak(line.en, settings.voiceName, settings.speechRate);
        await new Promise(resolve => setTimeout(resolve, 600));
      } catch (e) {
        break;
      }
    }
    setActiveSpeechLineId(null);
  };

  const toggleShadowState = (lineId: string) => {
    setLineStates(prev => {
      const current = prev[lineId]?.state || 'blur';
      let next: 'blur' | 'correct' | 'incorrect' = 'blur';
      if (current === 'blur') next = 'correct';
      else if (current === 'correct') next = 'incorrect';
      
      return {
        ...prev,
        [lineId]: {
          state: next,
          diff: next === 'blur' ? undefined : [{ text: dialogue.lines.find(l => l.id === lineId)!.en, type: next === 'correct' ? 'correct' : 'incorrect' }]
        }
      };
    });
  };

  const handleCompleteLine = (lineId: string) => {
    const line = dialogue.lines.find(l => l.id === lineId);
    if (!line) return;
    const userInput = sanitizeText(userInputs[`${level}_${lineId}`] || '');
    const diff = diffWords(line.en, userInput);
    const score = userInput.trim() !== '' ? calculateAccuracy(line.en, userInput) : 0;

    setResults(prev => ({
      ...prev,
      [`${level}_${lineId}`]: { score, diff }
    }));
  };

  const handleRedoLine = (lineId: string) => {
    setUserInputs(prev => ({
      ...prev,
      [`${level}_${lineId}`]: ''
    }));
    setResults(prev => {
      const updated = { ...prev };
      delete updated[`${level}_${lineId}`];
      return updated;
    });
  };

  const handleToggleRecord = (line: DialogueLine) => {
    if (isRecording) {
      recognizer.stop();
      setInterimTranscripts(prev => {
        const next = { ...prev };
        delete next[isRecording];
        return next;
      });
      if (isRecording === line.id) {
        setIsRecording(null);
        return;
      }
    }

    if (checkMicTimeout()) return;

    setRecordingError(null);
    setIsRecording(line.id);

    recognizer.start(
      (result) => {
        const diff = diffWords(line.en, result.transcript);
        const acc = calculateAccuracy(line.en, result.transcript);
        const state = acc >= 80 ? 'correct' : 'incorrect';

        setLineStates(prev => ({
          ...prev,
          [line.id]: {
            state: state as 'correct' | 'incorrect',
            transcript: result.transcript,
            diff
          }
        }));
      },
      (err) => {
        setRecordingError(`Lỗi: ${err}`);
        setIsRecording(null);
        showToast('error', 'Lỗi ghi âm', `Không thể ghi âm: ${err}`);
      },
      () => {
        setIsRecording(null);
        setInterimTranscripts(prev => {
          const next = { ...prev };
          delete next[line.id];
          return next;
        });
      },
      (interimText) => {
        setInterimTranscripts(prev => ({
          ...prev,
          [line.id]: interimText
        }));
      }
    );
  };

  const handleConfirmDictation = () => {
    let totalScore = 0;
    const computedResults = { ...results };

    dialogue.lines.forEach(line => {
      const userInput = sanitizeText(userInputs[`${level}_${line.id}`] || '');
      const diff = diffWords(line.en, userInput);
      const score = userInput.trim() !== '' ? calculateAccuracy(line.en, userInput) : 0;
      computedResults[`${level}_${line.id}`] = { score, diff };
      totalScore += score;
    });

    const averageScore = Math.round(totalScore / dialogue.lines.length);
    setResults(computedResults);
    setShowResults(true);

    const updatedLines = dialogue.lines.map(line => {
      const userInput = sanitizeText(userInputs[`${level}_${line.id}`] || '');
      const lineScore = userInput.trim() !== '' ? calculateAccuracy(line.en, userInput) : undefined;
      const currentScores = line.scores || {};
      return {
        ...line,
        scores: { ...currentScores, [level]: lineScore }
      };
    });

    if (dialogue) {
      const updatedInputs = { ...userInputs };
      const updatedResults = { ...computedResults };
      dialogue.lines.forEach(line => {
        delete updatedInputs[`${level}_${line.id}`];
        delete updatedResults[`${level}_${line.id}`];
      });
      setUserInputs(updatedInputs);
      setResults(updatedResults);
      localStorage.setItem(`sd_draft_inputs_${dialogue.id}`, JSON.stringify(updatedInputs));
      localStorage.setItem(`sd_draft_results_${dialogue.id}`, JSON.stringify(updatedResults));
    }

    onPracticeComplete(averageScore, level, updatedLines);
  };

  const handleConfirmShadowing = () => {
    let totalScore = 0;
    let answered = 0;
    const computedResults: Record<string, { score: number; diff: WordDiff[] }> = {};

    dialogue.lines.forEach(line => {
      const state = lineStates[line.id]?.state;
      let score = 0;
      let diff = diffWords(line.en, '');

      if (state === 'correct') {
        score = 100;
        diff = [{ text: line.en, type: 'correct' }];
        totalScore += 100;
        answered++;
      } else if (state === 'incorrect') {
        const recorded = lineStates[line.id]?.transcript;
        if (recorded) {
          score = calculateAccuracy(line.en, recorded);
          diff = diffWords(line.en, recorded);
        } else {
          score = 40;
          diff = [{ text: line.en, type: 'incorrect' }];
        }
        totalScore += score;
        answered++;
      }

      computedResults[line.id] = { score, diff };
    });

    const finalScore = answered > 0 ? Math.round(totalScore / dialogue.lines.length) : 0;
    setResults(computedResults);
    setShowResults(true);
    
    setLineStates(prev => {
      const updated = { ...prev };
      dialogue.lines.forEach(l => {
        if (updated[l.id].state === 'blur') {
          updated[l.id] = { state: 'incorrect', diff: diffWords(l.en, '') };
        }
      });
      return updated;
    });

    const updatedLines = dialogue.lines.map(line => {
      const state = lineStates[line.id]?.state;
      let lineScore = undefined;
      if (state === 'correct') {
        lineScore = 100;
      } else if (state === 'incorrect') {
        const recorded = lineStates[line.id]?.transcript;
        lineScore = recorded ? calculateAccuracy(line.en, recorded) : 40;
      }

      const currentScores = line.scores || {};
      return {
        ...line,
        scores: { ...currentScores, shadow: lineScore }
      };
    });

    localStorage.removeItem(`sd_draft_states_${dialogue.id}`);
    onPracticeComplete(finalScore, level, updatedLines);
  };

  const clearAIChatDraft = () => {
    localStorage.removeItem(`sd_draft_aichat_${dialogue.id}`);
  };

  const handleToggleRecordAIChat = (line: DialogueLine) => {
    if (isRecording) {
      recognizer.stop();
      setIsRecording(null);
      return;
    }

    if (checkMicTimeout()) return;

    setRecordingError(null);
    setIsRecording(line.id);

    recognizer.start(
      (result) => {
        const diff = diffWords(line.en, result.transcript);
        const acc = calculateAccuracy(line.en, result.transcript);
        setAiUserRecordedTranscript(result.transcript);
        setAiUserScore(acc);
        setAiUserDiff(diff);
        setHasRecordedCurrentLine(true);
      },
      (err) => {
        setRecordingError(`Lỗi: ${err}`);
        setIsRecording(null);
        showToast('error', 'Lỗi ghi âm', `Không thể ghi âm: ${err}`);
      },
      () => {
        setIsRecording(null);
      },
      (interimText) => {
        setAiUserRecordedTranscript(interimText);
      }
    );
  };

  const handleConfirmUserLine = () => {
    const currentLine = dialogue.lines[currentLineIndex];
    setAiChatTranscript(prev => [
      ...prev,
      {
        lineId: currentLine.id,
        lineText: currentLine.en,
        userTranscript: aiUserRecordedTranscript,
        score: aiUserScore,
        diff: aiUserDiff
      }
    ]);
    
    setAiUserRecordedTranscript('');
    setAiUserScore(0);
    setAiUserDiff([]);
    setHasRecordedCurrentLine(false);
    setCurrentLineIndex(prev => prev + 1);
  };

  const handleConfirmAIChat = () => {
    const totalUserScore = aiChatTranscript.reduce((sum, item) => sum + item.score, 0);
    const averageRoleplayScore = aiChatTranscript.length > 0 ? Math.round(totalUserScore / aiChatTranscript.length) : 0;

    const updatedLines = dialogue.lines.map(line => {
      const currentScores = line.scores || {};
      let lineScore = averageRoleplayScore;
      const transcriptItem = aiChatTranscript.find(t => t.lineId === line.id);
      if (transcriptItem) {
        lineScore = transcriptItem.score;
      }
      
      return {
        ...line,
        scores: { ...currentScores, ai_chat: lineScore }
      };
    });

    clearAIChatDraft();
    setSelectedRole(dialogue?.type === 'paragraph' ? 'Paragraph' : null);
    setCurrentLineIndex(0);
    setAiChatTranscript([]);
    setAiFeedback(null);
    setIsGeneratingFeedback(false);

    onPracticeComplete(averageRoleplayScore, 'ai_chat', updatedLines);
  };

  const handleResetAIChat = () => {
    clearAIChatDraft();
    setSelectedRole(dialogue?.type === 'paragraph' ? 'Paragraph' : null);
    setCurrentLineIndex(0);
    setAiChatTranscript([]);
    setAiFeedback(null);
    setIsGeneratingFeedback(false);
    setAiUserRecordedTranscript('');
    setAiUserScore(0);
    setAiUserDiff([]);
    setHasRecordedCurrentLine(false);
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-all duration-200 ${
      theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'
    }`}>
      {/* Horizontal Level Selector Tabs */}
      <div className={`flex border-b px-2 py-1.5 overflow-x-auto scrollbar-none gap-1 flex-shrink-0 ${
        theme === 'dark' ? 'border-white/5 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-100/50'
      }`}>
        {([
          { lvl: 'shadow', icon: <Eye size={13} />, label: 'Shadow' },
          { lvl: 'copy', icon: <Keyboard size={13} />, label: 'Copy' },
          { lvl: 'type', icon: <Brain size={13} />, label: 'Dictate' },
          { lvl: 'listen', icon: <Ear size={13} />, label: 'Listen' },
          { lvl: 'ai_chat', icon: <Sparkles size={13} />, label: dialogue.type === 'paragraph' ? 'Feedback' : 'Roleplay' },
        ] as const).map(({ lvl, icon, label }) => (
          <button
            key={lvl}
            onClick={() => setLevel(lvl)}
            className={`flex items-center gap-1 py-2 px-3.5 text-2xs font-bold rounded-xl transition-all whitespace-nowrap active:scale-95 ${
              level === lvl
                ? theme === 'dark'
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/25'
                  : 'bg-purple-100 text-purple-700 border border-purple-200 font-extrabold'
                : 'text-zinc-550 border border-transparent'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {recordingError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 text-3xs flex items-center gap-1.5 flex-shrink-0">
          <AlertCircle size={13} />
          <span>{recordingError}</span>
        </div>
      )}

      {/* Main content scroll container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {level === 'ai_chat' ? (
          <AIChatView
            dialogue={dialogue!}
            theme={theme}
            selectedRole={selectedRole}
            currentLineIndex={currentLineIndex}
            aiChatTranscript={aiChatTranscript}
            isGeneratingFeedback={isGeneratingFeedback}
            aiFeedback={aiFeedback}
            aiUserRecordedTranscript={aiUserRecordedTranscript}
            aiUserScore={aiUserScore}
            aiUserDiff={aiUserDiff}
            hasRecordedCurrentLine={hasRecordedCurrentLine}
            isRecording={isRecording}
            activeSpeechLineId={activeSpeechLineId}
            onSelectRole={(role: 'A' | 'B' | 'Paragraph') => {
              setSelectedRole(role);
              setCurrentLineIndex(0);
              setAiChatTranscript([]);
              setAiFeedback(null);
            }}
            onResetAIChat={handleResetAIChat}
            onToggleRecordAIChat={handleToggleRecordAIChat}
            onConfirmUserLine={handleConfirmUserLine}
            onConfirmAIChat={handleConfirmAIChat}
            onPlayTTS={handlePlayTTS}
          />
        ) : (
          <div className="space-y-3.5">
            {dialogue.lines.map((line, index) => {
              const isSpeechPlaying = activeSpeechLineId === line.id;
              const isLineRecording = isRecording === line.id;
              const userState = lineStates[line.id] || { state: 'blur' as const };
              const userText = userInputs[`${level}_${line.id}`] || '';
              const lineResult = results[`${level}_${line.id}`];
              const lineRate = playbackRates[line.id] || 1.0;

              return (
                <PracticeLine
                  key={line.id}
                  line={line}
                  index={index}
                  level={level}
                  theme={theme}
                  isSpeechPlaying={isSpeechPlaying}
                  isSpeechPaused={isPaused === line.id}
                  isLineRecording={isLineRecording}
                  userState={userState}
                  userText={userText}
                  lineResult={lineResult}
                  lineRate={lineRate}
                  showResults={showResults}
                  isRecognizerSupported={recognizer.isSupported()}
                  interimTranscript={interimTranscripts[line.id]}
                  onPlayTTS={() => handlePlayTTS(line)}
                  onPauseTTS={() => handlePauseTTS(line.id)}
                  onResumeTTS={() => handleResumeTTS(line.id)}
                  onReplayTTS={() => handleReplayTTS(line)}
                  onToggleSpeed={() => toggleSpeed(line.id)}
                  onToggleShadowState={() => toggleShadowState(line.id)}
                  onToggleRecord={() => handleToggleRecord(line)}
                  onUserInputChange={(text: string) => setUserInputs({ ...userInputs, [`${level}_${line.id}`]: text })}
                  onCompleteLine={() => handleCompleteLine(line.id)}
                  onRedoLine={() => handleRedoLine(line.id)}
                  lessonType={dialogue.type}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Footer */}
      <div className={`p-4 border-t flex flex-col gap-3 flex-shrink-0 ${
        theme === 'dark' ? 'border-white/10 bg-zinc-950' : 'border-zinc-200 bg-zinc-50 shadow-sm'
      }`}>
        <div className="flex items-center justify-between">
          <button
            onClick={playWholeDialogue}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-3xs font-bold border transition-all active:scale-95 shadow-sm ${
              theme === 'dark'
                ? 'bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border-purple-500/20'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200'
            }`}
          >
            <Volume2 size={13} />
            Nghe Toàn Bộ
          </button>

          {!showResults ? (
            <button
              onClick={level === 'shadow' ? handleConfirmShadowing : handleConfirmDictation}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-2xs font-extrabold text-white shadow-md shadow-purple-600/20 active:scale-95 hover:bg-purple-500 transition-all"
            >
              <Check size={13} />
              Xác nhận
            </button>
          ) : (
            <button
              onClick={() => {
                setShowResults(false);
                const updatedInputs = { ...userInputs };
                const updatedResults = { ...results };
                dialogue.lines.forEach(line => {
                  updatedInputs[`${level}_${line.id}`] = '';
                  delete updatedResults[`${level}_${line.id}`];
                });
                setUserInputs(updatedInputs);
                setResults(updatedResults);
                const clearedStates: Record<string, any> = {};
                dialogue.lines.forEach(line => clearedStates[line.id] = { state: 'blur' });
                setLineStates(clearedStates);
                localStorage.setItem(`sd_draft_inputs_${dialogue.id}`, JSON.stringify(updatedInputs));
                localStorage.setItem(`sd_draft_results_${dialogue.id}`, JSON.stringify(updatedResults));
                localStorage.removeItem(`sd_draft_states_${dialogue.id}`);
              }}
              className={`flex items-center gap-1.5 border rounded-xl px-4 py-2 text-3xs font-bold active:scale-95 transition-all ${
                theme === 'dark' ? 'border-white/10 text-zinc-300' : 'border-zinc-300 bg-white text-zinc-700 shadow-sm'
              }`}
            >
              <RotateCcw size={13} /> Luyện lại
            </button>
          )}
        </div>

        {showResults && (
          <div className="flex items-center gap-2 border-t border-dashed border-zinc-700/20 pt-2.5">
            <Award size={18} className="text-emerald-400 animate-bounce" />
            <span className={`text-2xs font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Bài học đạt {Math.round(
                dialogue.lines.reduce((sum, line) => {
                  const res = results[`${level}_${line.id}`];
                  return sum + (res ? res.score : 0);
                }, 0) / dialogue.lines.length
              )}% độ chính xác!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
