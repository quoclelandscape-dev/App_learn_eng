/**
 * Security utility functions for input sanitization and rate limiting.
 */

/**
 * Strips HTML tags and trims whitespace to prevent script injection/XSS and database spam
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').trim();
}

export function checkWeeklyLimit(
  dialogues: Array<{ createdAt: string; id: string }>,
  additionalCreations: number = 0
): boolean {
  // Filter user-created dialogues (exclude system seed dialogues)
  const userCreated = dialogues.filter(d => d.id && !d.id.startsWith('seed-'));
  
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const weeklyCreatedCount = userCreated.filter(d => {
    if (!d.createdAt) return false;
    const createdDate = new Date(d.createdAt);
    return createdDate >= sevenDaysAgo;
  }).length;
  
  return weeklyCreatedCount < (50 + additionalCreations);
}

export function getWeeklyCreatedCount(
  dialogues: Array<{ createdAt: string; id: string }>
): number {
  const userCreated = dialogues.filter(d => d.id && !d.id.startsWith('seed-'));
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return userCreated.filter(d => {
    if (!d.createdAt) return false;
    const createdDate = new Date(d.createdAt);
    return createdDate >= sevenDaysAgo;
  }).length;
}

