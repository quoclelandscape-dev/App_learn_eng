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
    username: row.username || undefined,
    age: row.age || undefined,
    job: row.job || undefined,
    learningNeed: row.learning_need || undefined,
    lastCheckinDate: row.last_checkin_date || undefined,
    checkinStreak: row.checkin_streak ?? 0,
    checkinHistory: Array.isArray(row.checkin_history) ? row.checkin_history : [],
    additionalCreations: row.additional_creations ?? 0,
    avatarUrl: row.avatar_url || undefined,
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

// --- DEVICE UUID HELPER ---

/**
 * Generates a cryptographically strong UUID using the Web Crypto API,
 * with a fallback for environments that don't support it.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: RFC 4122 compliant UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns a unique browser Device UUID stored in localStorage to separate accounts/data.
 * - Uses crypto.randomUUID() for proper UUID generation (no collisions, sufficient entropy).
 * - Guards against SSR (server-side rendering) by checking for window/localStorage.
 * - Returns a temporary placeholder during SSR — callers must only invoke this client-side
 *   (e.g., inside useEffect or event handlers).
 */
export function getDeviceUuid(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    // This should never be used for DB queries. Callers must be client-side only.
    return '';
  }
  try {
    let uuid = localStorage.getItem('shadowdictate_device_uuid');
    if (!uuid || uuid === 'server-side') {
      // Migrate legacy 'server-side' value or create new UUID
      uuid = generateUUID();
      localStorage.setItem('shadowdictate_device_uuid', uuid);
    }
    return uuid;
  } catch {
    // localStorage might be blocked (e.g., incognito with strict settings)
    return generateUUID();
  }
}

// --- DATABASE FUNCTIONS ---

/**
 * Fetch all dialogues from Supabase ordered by created_at desc, filtered by seed or current device UUID
 */
export async function getDialogues(): Promise<Dialogue[]> {
  const uuid = getDeviceUuid();
  if (!uuid) throw new Error('Device UUID chưa sẵn sàng — chỉ gọi hàm này phía client.');

  const { data, error } = await supabase
    .from('dialogues')
    .select('*')
    .or(`id.like.seed-%,id.like.dialogue-${uuid}-%`)
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
 * Fetch user stats from Supabase (using device-specific stats ID)
 */
export async function getUserStats(): Promise<UserStats | null> {
  const uuid = getDeviceUuid();
  if (!uuid) throw new Error('Device UUID chưa sẵn sàng — chỉ gọi hàm này phía client.');

  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('id', `stats_${uuid}`)
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
 * Update user stats in Supabase (using device-specific stats ID)
 */
export async function saveUserStats(stats: UserStats): Promise<void> {
  const uuid = getDeviceUuid();
  if (!uuid) throw new Error('Device UUID chưa sẵn sàng — chỉ gọi hàm này phía client.');
  const row = {
    id: `stats_${uuid}`,
    streak: stats.streak,
    last_active_date: stats.lastActiveDate || null,
    total_xp: stats.totalXP,
    incorrect_words: stats.incorrectWords || {},
    username: stats.username || null,
    age: stats.age || null,
    job: stats.job || null,
    learning_need: stats.learningNeed || null,
    last_checkin_date: stats.lastCheckinDate || null,
    checkin_streak: stats.checkinStreak ?? 0,
    checkin_history: stats.checkinHistory || [],
    additional_creations: stats.additionalCreations ?? 0,
    avatar_url: stats.avatarUrl || null,
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
 * Fetch settings from Supabase (using device-specific settings ID)
 */
export async function getSettings(): Promise<Settings | null> {
  const uuid = getDeviceUuid();
  if (!uuid) throw new Error('Device UUID chưa sẵn sàng — chỉ gọi hàm này phía client.');

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', `settings_${uuid}`)
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
 * Update settings in Supabase (using device-specific settings ID)
 */
export async function saveSettings(settings: Settings): Promise<void> {
  const uuid = getDeviceUuid();
  if (!uuid) throw new Error('Device UUID chưa sẵn sàng — chỉ gọi hàm này phía client.');
  const row = {
    id: `settings_${uuid}`,
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

/**
 * Fetch top 10 users ordered by total_xp desc
 */
export async function getLeaderboard(): Promise<UserStats[]> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .order('total_xp', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Lỗi khi lấy danh sách bảng xếp hạng:', error);
    return [];
  }

  return (data || []).map(toUserStats);
}

/**
 * Fetch weekly attendance config
 */
export async function getAttendanceConfig(): Promise<any[]> {
  const { data, error } = await supabase
    .from('attendance_config')
    .select('rewards')
    .eq('id', 'weekly_rewards')
    .single();

  if (error) {
    // If not found in DB, return empty array so that the caller can use local fallback configuration
    if (error.code === 'PGRST116') {
      return [];
    }
    console.error('Lỗi khi lấy cấu hình điểm danh:', error);
    return [];
  }

  return data?.rewards || [];
}

/**
 * Save weekly attendance config
 */
export async function saveAttendanceConfig(rewards: any[]): Promise<void> {
  const { error } = await supabase
    .from('attendance_config')
    .upsert({ id: 'weekly_rewards', rewards });

  if (error) {
    console.error('Lỗi khi lưu cấu hình điểm danh lên Supabase:', error);
    throw error;
  }
}

