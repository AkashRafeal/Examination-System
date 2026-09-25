import { db } from '@/lib/db';
import { RawParsedQuestion } from './question-parser';

/**
 * Normalizes question text for robust comparison.
 * Strips punctuation, multiple spaces, and converts to lowercase.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks parsed questions against the existing database question bank for duplicates.
 */
export async function annotateDuplicates(questions: RawParsedQuestion[]): Promise<void> {
  const existingQuestions = await db.question.findMany({
    select: {
      id: true,
      questionText: true,
    },
  });

  const existingMap = new Map<string, string>();
  for (const eq of existingQuestions) {
    existingMap.set(normalizeText(eq.questionText), eq.id);
  }

  for (const q of questions) {
    const norm = normalizeText(q.questionText);
    if (existingMap.has(norm)) {
      q.isDuplicate = true;
      q.duplicateOf = existingMap.get(norm);
    }
  }
}
