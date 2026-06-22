/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import type { Dialogue, UserStats, Settings, PracticeLevel } from '../types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejtetvqfcebwprljknts.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_e4d2GFVHk8eLCFveaV4ClA_Izd-7jOw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to convert database row to Dialogue type
function toDialogue(row: any): Dialogue {
  const lines = Array.isArray(row.lines) ? row.lines : [];

  // Calculate levelScores dynamically based on line-by-line scores
  const levelScores: Record<PracticeLevel, number> = {
    shadow: 0,
    copy: 0,
    type: 0,
    listen: 0,
    ai_chat: 0
  };

  const levels: PracticeLevel[] = ['shadow', 'copy', 'type', 'listen', 'ai_chat'];
  levels.forEach(lvl => {
    let total = 0;
    lines.forEach((line: any) => {
      if (line && typeof line === 'object' && line.scores && typeof line.scores[lvl] === 'number') {
        total += line.scores[lvl];
      }
    });
    levelScores[lvl] = lines.length > 0 ? Math.round(total / lines.length) : 0;
  });

  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    lines: lines,
    createdAt: row.created_at,
    level: row.level || undefined,
    practiceCount: row.practice_count ?? 0,
    lastPracticed: row.last_practiced || undefined,
    lastScore: row.last_score !== null && row.last_score !== undefined ? row.last_score : undefined,
    levelScores: levelScores,
    spacedRepetitionDate: row.spaced_repetition_date || undefined,
    isDeleted: row.is_deleted ?? false,
    type: row.type || 'dialogue',
    sentenceLength: row.sentence_length || 'medium',
  };
}

// Helper to convert Dialogue type to database row format
function toDialogueRow(d: Dialogue): any {
  const row: any = {
    id: d.id,
    title: d.title,
    description: d.description || null,
    tags: d.tags,
    lines: d.lines,
    created_at: d.createdAt,
    level: d.level || null,
    practice_count: d.practiceCount,
    last_practiced: d.lastPracticed || null,
    last_score: d.lastScore !== undefined ? d.lastScore : null,
    spaced_repetition_date: d.spacedRepetitionDate || null,
    type: d.type || 'dialogue',
    sentence_length: d.sentenceLength || 'medium',
  };

  if (d.isDeleted === true) {
    row.is_deleted = true;
  }

  return row;
}

// Helper to convert database row to UserStats type
function toUserStats(row: any): UserStats {
  return {
    streak: row.streak ?? 0,
    lastActiveDate: row.last_active_date || undefined,
    totalXP: row.total_xp ?? 0,
    incorrectWords: typeof row.incorrect_words === 'object' && row.incorrect_words ? row.incorrect_words : {},
  };
}

// Helper to convert database row to Settings type
function toSettings(row: any): Settings {
  return {
    geminiApiKey: row.gemini_api_key || '',
    voiceName: row.voice_name || '',
    speechRate: row.speech_rate ?? 1.0,
    showConfidence: row.show_confidence ?? false,
  };
}

// --- DATABASE FUNCTIONS ---

/**
 * Fetch all dialogues from Supabase ordered by created_at desc
 */
export async function getDialogues(): Promise<Dialogue[]> {
  const { data, error } = await supabase
    .from('dialogues')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Lỗi khi lấy danh sách hội thoại từ Supabase:', error);
    throw error;
  }

  return (data || []).map(toDialogue).filter(d => !d.isDeleted);
}

/**
 * Save or update a dialogue in Supabase
 */
export async function saveDialogue(dialogue: Dialogue): Promise<void> {
  const row = toDialogueRow(dialogue);
  const { error } = await supabase
    .from('dialogues')
    .upsert(row);

  if (error) {
    console.error(`Lỗi khi lưu hội thoại ${dialogue.id} vào Supabase:`, error);
    throw error;
  }
}

/**
 * Fetch user stats from Supabase (using id: 'default_stats')
 */
export async function getUserStats(): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('id', 'default_stats')
    .single();

  if (error) {
    // If not found, it will be seeded by SQL schema or client
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Lỗi khi lấy chỉ số học tập từ Supabase:', error);
    throw error;
  }

  return data ? toUserStats(data) : null;
}

/**
 * Update user stats in Supabase
 */
export async function saveUserStats(stats: UserStats): Promise<void> {
  const row = {
    id: 'default_stats',
    streak: stats.streak,
    last_active_date: stats.lastActiveDate || null,
    total_xp: stats.totalXP,
    incorrect_words: stats.incorrectWords || {},
  };

  const { error } = await supabase
    .from('user_stats')
    .upsert(row);

  if (error) {
    console.error('Lỗi khi cập nhật chỉ số học tập vào Supabase:', error);
    throw error;
  }
}

/**
 * Fetch settings from Supabase (using id: 'default_settings')
 */
export async function getSettings(): Promise<Settings | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'default_settings')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Lỗi khi lấy cấu hình từ Supabase:', error);
    throw error;
  }

  return data ? toSettings(data) : null;
}

/**
 * Update settings in Supabase
 */
export async function saveSettings(settings: Settings): Promise<void> {
  const row = {
    id: 'default_settings',
    gemini_api_key: settings.geminiApiKey,
    voice_name: settings.voiceName,
    speech_rate: settings.speechRate,
    show_confidence: settings.showConfidence,
  };

  const { error } = await supabase
    .from('settings')
    .upsert(row);

  if (error) {
    console.error('Lỗi khi lưu cấu hình vào Supabase:', error);
    throw error;
  }
}

/**
 * Soft delete a dialogue in Supabase
 */
export async function softDeleteDialogue(id: string): Promise<void> {
  const { error } = await supabase
    .from('dialogues')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) {
    console.error(`Lỗi khi xóa mềm hội thoại ${id}:`, error);
    throw error;
  }
}
