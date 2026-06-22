'use client';
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars */


import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Volume2,
  Mic,
  MicOff,
  Check,
  RotateCcw,
  Sparkles,
  Award,
  BookOpen,
  Keyboard,
  Ear,
  Eye,
  EyeOff,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Brain,
  Pause,
  Play
} from 'lucide-react';
import type { Dialogue, DialogueLine, PracticeLevel, Settings } from '../../types';
import { speak, stopSpeaking, pauseSpeaking, resumeSpeaking, SpeechRecognizer } from '../../utils/speech';
import { diffWords, WordDiff, calculateAccuracy } from '../../utils/diff';
import { generateAIChatFeedback, AIChatFeedback } from '../../utils/ai';
import { sanitizeText } from '../../utils/security';
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
  const [isRecording, setIsRecording] = useState<string | null>(null); // contains lineId
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
  
  // Audio playback speeds
  const [playbackRates, setPlaybackRates] = useState<Record<string, number>>({});

  // Audio preview for dictation/listening
  const [activeAudioPlaying, setActiveAudioPlaying] = useState<string | null>(null);

  // Pause/Resume state for listening mode
  const [isPaused, setIsPaused] = useState<string | null>(null); // contains lineId if paused

  // Session ref to prevent race conditions between concurrent speech handlers
  const speechSessionRef = useRef(0);

  // Speech Recognizer instance
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

  // Save drafts for other modes to localStorage
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

  // Reset tab-specific state on dialogue or level change
  useEffect(() => {
    stopSpeaking();
    setActiveSpeechLineId(null);
    setIsRecording(null);
    setRecordingError(null);
    setShowResults(false);
  }, [dialogue, level]);

  // Load dialogue drafts from localStorage when dialogue changes
  useEffect(() => {
    if (dialogue) {
      const inputsKey = `sd_draft_inputs_${dialogue.id}`;
      const resultsKey = `sd_draft_results_${dialogue.id}`;
      const statesKey = `sd_draft_states_${dialogue.id}`;
      
      let savedInputs: Record<string, string> = {};
      let savedStates: Record<string, { state: 'blur' | 'correct' | 'incorrect' | 'speaking' | 'recorded'; transcript?: string; diff?: WordDiff[] }> = {};
      let savedResults: Record<string, { score: number; diff: WordDiff[] }> = {};
      
      try {
        const cachedInputs = localStorage.getItem(inputsKey);
        if (cachedInputs) savedInputs = JSON.parse(cachedInputs);
      } catch (e) {
        console.error("Error reading saved inputs draft:", e);
      }
      
      try {
        const cachedStates = localStorage.getItem(statesKey);
        if (cachedStates) savedStates = JSON.parse(cachedStates);
      } catch (e) {
        console.error("Error reading saved states draft:", e);
      }

      try {
        const cachedResults = localStorage.getItem(resultsKey);
        if (cachedResults) savedResults = JSON.parse(cachedResults);
      } catch (e) {
        console.error("Error reading saved results draft:", e);
      }

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

  // Sync playback rates with settings.speechRate
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
          if (!settings.geminiApiKey) {
            showToast('warning', 'Thiếu API Key', 'Vui lòng thêm Gemini API Key trong phần Cài đặt để nhận feedback chi tiết từ AI.');
            setAiFeedback({
              generalFeedback: 'Không thể lấy feedback chi tiết vì chưa cấu hình Gemini API Key. Tuy nhiên, bạn đã hoàn thành bài luyện nói đóng vai!',
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
            settings.geminiApiKey
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      recognizer.stop();
    };
  }, [recognizer]);

  if (!dialogue) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 transition-colors duration-200 ${
        theme === 'dark' ? 'bg-zinc-900/20 text-zinc-400' : 'bg-zinc-50 text-zinc-650'
      }`}>
        <div className="max-w-md space-y-4">
          <div className={`h-16 w-16 mx-auto rounded-2xl flex items-center justify-center border animate-pulse ${
            theme === 'dark' ? 'bg-zinc-800 border-white/5 text-purple-400' : 'bg-white border-zinc-200 text-purple-600 shadow-sm'
          }`}>
            <BookOpen size={28} />
          </div>
          <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-800'}`}>Sẵn sàng luyện tập?</h2>
          <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Chọn một đoạn hội thoại ở thanh bên trái hoặc tạo một hội thoại mới bằng AI để bắt đầu rèn luyện kỹ năng nghe nói tiếng Anh ngay bây giờ.
          </p>
        </div>
      </div>
    );
  }

  /**
   * Core speech helper with session tracking to prevent race conditions.
   * Each call increments the session counter. The finally block only
   * clears state if no newer session has started.
   */
  const speakLine = async (line: DialogueLine) => {
    stopSpeaking();
    setIsPaused(null);
    
    const session = ++speechSessionRef.current;
    setActiveSpeechLineId(line.id);
    
    const rate = playbackRates[line.id] || 1.0;
    try {
      await speak(line.en, settings.voiceName, rate);
    } catch (e) {
      const isCancellation =
        e &&
        typeof e === 'object' &&
        'error' in e &&
        ((e as { error: unknown }).error === 'interrupted' ||
          (e as { error: unknown }).error === 'canceled');
      if (!isCancellation) {
        console.error('SpeechSynthesis error:', e);
      }
    } finally {
      // Only clear state if this is still the active session
      if (speechSessionRef.current === session) {
        setActiveSpeechLineId(null);
        setIsPaused(null);
      }
    }
  };

  // Play TTS (starts fresh)
  const handlePlayTTS = (line: DialogueLine) => speakLine(line);

  // Pause TTS for listening mode
  const handlePauseTTS = (lineId: string) => {
    pauseSpeaking();
    setIsPaused(lineId);
  };

  // Resume TTS for listening mode  
  const handleResumeTTS = (lineId: string) => {
    resumeSpeaking();
    setIsPaused(null);
  };

  // Replay TTS from beginning (same as play, force restart)
  const handleReplayTTS = (line: DialogueLine) => speakLine(line);

  // Toggle speed helper
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

  // Speak helper for whole sentence playback
  const playWholeDialogue = async () => {
    // Stop any current speech first
    stopSpeaking();
    setIsPaused(null);
    
    for (const line of dialogue.lines) {
      setActiveSpeechLineId(line.id);
      try {
        await speak(line.en, settings.voiceName, settings.speechRate);
        // Add a small pause between lines
        await new Promise(resolve => setTimeout(resolve, 600));
      } catch (e) {
        break;
      }
    }
    setActiveSpeechLineId(null);
  };


  // Toggle state manually in shadowing mode (blur -> correct -> incorrect -> blur)
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
    if (!dialogue) return;
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

  // Recording handler
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
        // Compute diff
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
        setRecordingError(`Lỗi ghi âm: ${err}`);
        setIsRecording(null);
        showToast('error', 'Lỗi ghi âm', `Không thể ghi âm giọng nói: ${err}`);
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

  // Confirm Dictation answers
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

    // Construct updatedLines to pass line-specific scores to parent component
    const updatedLines = dialogue.lines.map(line => {
      const userInput = sanitizeText(userInputs[`${level}_${line.id}`] || '');
      // A line is considered completed if user typed something in it
      const lineScore = userInput.trim() !== '' ? calculateAccuracy(line.en, userInput) : undefined;
      
      const currentScores = line.scores || {};
      return {
        ...line,
        scores: {
          ...currentScores,
          [level]: lineScore
        }
      };
    });

    // Clear draft values for this level and save the rest
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

    // Callback to save progress & stats
    onPracticeComplete(averageScore, level, updatedLines);
  };

  // Compute final Shadowing Score based on user responses
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
      } else {
        // Not practiced/blurred remains 0 score
        score = 0;
      }

      computedResults[line.id] = { score, diff };
    });

    const finalScore = answered > 0 ? Math.round(totalScore / dialogue.lines.length) : 0;
    setResults(computedResults);
    setShowResults(true);
    
    // Set all lines as revealed in lineStates
    setLineStates(prev => {
      const updated = { ...prev };
      dialogue.lines.forEach(l => {
        if (updated[l.id].state === 'blur') {
          updated[l.id] = {
            state: 'incorrect',
            diff: diffWords(l.en, '')
          };
        }
      });
      return updated;
    });

    // Construct updatedLines for shadowing
    const updatedLines = dialogue.lines.map(line => {
      const state = lineStates[line.id]?.state;
      let lineScore = undefined;
      if (state === 'correct') {
        lineScore = 100;
      } else if (state === 'incorrect') {
        const recorded = lineStates[line.id]?.transcript;
        if (recorded) {
          lineScore = calculateAccuracy(line.en, recorded);
        } else {
          lineScore = 40;
        }
      }

      const currentScores = line.scores || {};
      return {
        ...line,
        scores: {
          ...currentScores,
          shadow: lineScore
        }
      };
    });

    // Clear localStorage draft
    if (dialogue) {
      localStorage.removeItem(`sd_draft_states_${dialogue.id}`);
    }

    onPracticeComplete(finalScore, level, updatedLines);
  };

  const clearAIChatDraft = () => {
    if (dialogue) {
      localStorage.removeItem(`sd_draft_aichat_${dialogue.id}`);
    }
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
        setRecordingError(`Lỗi ghi âm: ${err}`);
        setIsRecording(null);
        showToast('error', 'Lỗi ghi âm', `Không thể ghi âm giọng nói: ${err}`);
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
        scores: {
          ...currentScores,
          ai_chat: lineScore
        }
      };
    });

    clearAIChatDraft();
    
    setSelectedRole(null);
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
    <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-200 ${
      theme === 'dark' ? 'bg-zinc-900/10 text-zinc-100' : 'bg-white text-zinc-900'
    }`}>
      {/* Dialogue Header */}
      <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        theme === 'dark' ? 'border-white/10 bg-zinc-900/30' : 'border-zinc-200 bg-zinc-50'
      }`}>
        <div>
          <div className="flex items-center gap-3">
            <h1 className={`text-xl md:text-2xl font-black tracking-wide ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent'
                : 'text-zinc-900'
            }`}>{dialogue.title}</h1>
            {dialogue.spacedRepetitionDate && (
              <span className="text-4xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                Lặp lại ngắt quãng
              </span>
            )}
          </div>
          {dialogue.description && (
            <p className={`text-xs mt-1.5 italic ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{dialogue.description}</p>
          )}
        </div>

        {/* Global Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={playWholeDialogue}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide border transition-all active:scale-[0.98] shadow-md ${
              theme === 'dark'
                ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border-purple-500/20 shadow-purple-600/5'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200 shadow-purple-100/50'
            }`}
          >
            <Volume2 size={15} />
            Nghe Toàn Bộ
          </button>
        </div>
      </div>
      {/* Level Selector Tabs */}
      <div className={`flex border-b p-1 flex-nowrap overflow-x-auto scrollbar-none gap-1 ${
        theme === 'dark' ? 'border-white/5 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-100'
      }`}>
        <button
          onClick={() => setLevel('shadow')}
          className={`flex-1 min-w-[110px] whitespace-nowrap flex items-center justify-center gap-2 py-3 px-4 text-xs md:text-sm font-semibold tracking-wide rounded-xl transition-all ${
            level === 'shadow'
              ? theme === 'dark'
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/25 shadow-inner'
                : 'bg-purple-100 text-purple-700 border border-purple-200 shadow-inner font-bold'
              : theme === 'dark'
              ? 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              : 'text-zinc-500 hover:text-zinc-800 border border-transparent'
          }`}
        >
          <Eye size={15} />
          Shadowing
        </button>
        <button
          onClick={() => setLevel('copy')}
          className={`flex-1 min-w-[110px] whitespace-nowrap flex items-center justify-center gap-2 py-3 px-4 text-xs md:text-sm font-semibold tracking-wide rounded-xl transition-all ${
            level === 'copy'
              ? theme === 'dark'
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/25 shadow-inner'
                : 'bg-purple-100 text-purple-700 border border-purple-200 shadow-inner font-bold'
              : theme === 'dark'
              ? 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              : 'text-zinc-500 hover:text-zinc-800 border border-transparent'
          }`}
        >
          <Keyboard size={15} />
          Copy Type
        </button>
        <button
          onClick={() => setLevel('type')}
          className={`flex-1 min-w-[110px] whitespace-nowrap flex items-center justify-center gap-2 py-3 px-4 text-xs md:text-sm font-semibold tracking-wide rounded-xl transition-all ${
            level === 'type'
              ? theme === 'dark'
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/25 shadow-inner'
                : 'bg-purple-100 text-purple-700 border border-purple-200 shadow-inner font-bold'
              : theme === 'dark'
              ? 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              : 'text-zinc-500 hover:text-zinc-800 border border-transparent'
          }`}
        >
          <Brain size={15} />
          Dictation
        </button>
        <button
          onClick={() => setLevel('listen')}
          className={`flex-1 min-w-[110px] whitespace-nowrap flex items-center justify-center gap-2 py-3 px-4 text-xs md:text-sm font-semibold tracking-wide rounded-xl transition-all ${
            level === 'listen'
              ? theme === 'dark'
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/25 shadow-inner'
                : 'bg-purple-100 text-purple-700 border border-purple-200 shadow-inner font-bold'
              : theme === 'dark'
              ? 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              : 'text-zinc-500 hover:text-zinc-800 border border-transparent'
          }`}
        >
          <Ear size={15} />
          Listening
        </button>
        <button
          onClick={() => setLevel('ai_chat')}
          className={`flex-1 min-w-[110px] whitespace-nowrap flex items-center justify-center gap-2 py-3 px-4 text-xs md:text-sm font-semibold tracking-wide rounded-xl transition-all ${
            level === 'ai_chat'
              ? theme === 'dark'
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/25 shadow-inner'
                : 'bg-purple-100 text-purple-700 border border-purple-200 shadow-inner font-bold'
              : theme === 'dark'
              ? 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              : 'text-zinc-500 hover:text-zinc-800 border border-transparent'
          }`}
        >
          <Sparkles size={15} />
          {dialogue.type === 'paragraph' ? 'AI Feedback' : 'AI Roleplay'}
        </button>
      </div>
      {/* Error display */}
      {recordingError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 text-2xs flex items-center gap-2">
          <AlertCircle size={14} />
          <span>{recordingError}</span>
        </div>
      )}

      {/* Main Practice Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {level === 'ai_chat' ? (
          <AIChatView
            dialogue={dialogue}
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
            onSelectRole={(role) => {
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
          dialogue.lines.map((line, index) => {
            const isSpeechPlaying = activeSpeechLineId === line.id;
            const isLineRecording = isRecording === line.id;
            const userState = lineStates[line.id] || { state: 'blur' };
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
                onUserInputChange={(text) => setUserInputs({ ...userInputs, [`${level}_${line.id}`]: text })}
                onCompleteLine={() => handleCompleteLine(line.id)}
                onRedoLine={() => handleRedoLine(line.id)}
                lessonType={dialogue.type}
              />
            );
          })
        )}
      </div>

      {/* Practice Control Footer / Scoring Banner */}
      <div className={`p-4 border-t flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        theme === 'dark' ? 'border-white/10 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-100'
      }`}>
        <div>
          {showResults && (
            <div className="flex items-center gap-2 text-emerald-400">
              <Award size={20} className="animate-bounce" />
              <div className="flex flex-col">
                <span className="text-3xs text-zinc-400 font-semibold uppercase tracking-wider">Kết quả luyện tập</span>
                <span className={`text-md font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  Đạt {Math.round(
                    dialogue.lines.reduce((sum, line) => {
                      const res = results[`${level}_${line.id}`];
                      return sum + (res ? res.score : 0);
                    }, 0) / dialogue.lines.length
                  )}% độ chính xác!
                </span>
              </div>
            </div>
          )}
          {!showResults && level === 'shadow' && (
            <p className="text-2xs text-zinc-500">
              Mẹo: Chạm vào dòng tiếng Anh mờ để ẩn/hiện hoặc tự tay đánh giá Đúng/Sai nếu không dùng Mic.
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showResults ? (
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
                
                // Clear shadowing states
                const clearedStates: Record<string, { state: 'blur' | 'correct' | 'incorrect' | 'speaking' | 'recorded' }> = {};
                dialogue.lines.forEach(line => clearedStates[line.id] = { state: 'blur' });
                setLineStates(clearedStates);

                // Save cleared drafts
                localStorage.setItem(`sd_draft_inputs_${dialogue.id}`, JSON.stringify(updatedInputs));
                localStorage.setItem(`sd_draft_results_${dialogue.id}`, JSON.stringify(updatedResults));
                localStorage.removeItem(`sd_draft_states_${dialogue.id}`);
              }}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 border rounded-xl px-5 py-3 text-xs font-semibold transition-all ${
                theme === 'dark'
                  ? 'border-white/10 hover:bg-white/5 text-zinc-300'
                  : 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 shadow-sm'
              }`}
            >
              <RotateCcw size={14} /> Luyện lại
            </button>
          ) : (
            <button
              onClick={level === 'shadow' ? handleConfirmShadowing : handleConfirmDictation}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-8 py-3 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition-all active:scale-[0.98]"
            >
              <Check size={14} />
              Xác Nhận & Hoàn Thành
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
