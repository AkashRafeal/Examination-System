import { db } from '@/lib/db';

interface QuestionCacheState {
  activeQuestionIds: string[];
  lastFetched: number;
}

let cache: QuestionCacheState | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

/**
 * Returns all active question IDs cached in memory.
 * Fetches from PostgreSQL only if the cache is empty, expired, or invalidated.
 */
export async function getActiveQuestionIds(): Promise<string[]> {
  const now = Date.now();

  if (cache && now - cache.lastFetched < CACHE_TTL_MS && cache.activeQuestionIds.length >= 50) {
    return cache.activeQuestionIds;
  }

  const questions = await db.question.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const ids = questions.map((q) => q.id);

  cache = {
    activeQuestionIds: ids,
    lastFetched: now,
  };

  return ids;
}

/**
 * Invalidates the in-memory question cache.
 * Must be invoked whenever questions are created, modified, deleted, or imported.
 */
export function invalidateQuestionCache(): void {
  cache = null;
}
