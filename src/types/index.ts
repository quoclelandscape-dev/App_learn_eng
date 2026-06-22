export interface DialogueLine {
  id: string;
  speaker: string; // e.g., 'A', 'B'
  en: string;
  vi: string;
  scores?: {
    shadow?: number;
    copy?: number;
    type?: number;
    listen?: number;
    ai_chat?: number;
  };
}

export type PracticeLevel = 'shadow' | 'copy' | 'type' | 'listen' | 'ai_chat';

export interface Dialogue {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  lines: DialogueLine[];
  createdAt: string;
  level?: PracticeLevel;
  practiceCount: number;
  lastPracticed?: string;
  lastScore?: number;
  levelScores?: Record<PracticeLevel, number>;
  spacedRepetitionDate?: string; // ISO date string
  isDeleted?: boolean;
  type?: 'dialogue' | 'paragraph';
  sentenceLength?: 'short' | 'medium' | 'long';
}

export interface Attempt {
  id: string;
  dialogueId: string;
  date: string;
  level: PracticeLevel;
  score: number; // 0 to 100
}

export interface Settings {
  geminiApiKey: string;
  voiceName: string;
  speechRate: number;
  showConfidence: boolean;
}

export interface UserStats {
  streak: number;
  lastActiveDate?: string; // YYYY-MM-DD
  totalXP: number;
  incorrectWords: Record<string, number>; // records frequency of incorrect words
  username?: string;
  age?: number;
  job?: string;
  learningNeed?: string;
  lastCheckinDate?: string; // YYYY-MM-DD
  checkinStreak?: number;
  checkinHistory?: number[]; // list of days checked in this week (1 = Mon, 7 = Sun)
  additionalCreations?: number; // bonus custom dialogue creations
  avatarUrl?: string; // Anime avatar image URL or code seed
}
