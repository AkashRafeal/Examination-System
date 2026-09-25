import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { Role, Difficulty } from '@prisma/client';
import { confirmImportBatch } from '@/lib/services/question.service';
import { RawParsedQuestion } from '@/lib/parsers/question-parser';
import { z } from 'zod';

const confirmSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  categoryId: z.string().optional().nullable(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  questions: z.array(
    z.object({
      questionNumber: z.number().optional(),
      questionText: z.string().min(1, 'Question text cannot be empty'),
      options: z.array(
        z.object({
          key: z.string(),
          text: z.string().min(1, 'Option text cannot be empty'),
        })
      ),
      correctAnswer: z.string().min(1),
      isValid: z.boolean(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const result = confirmSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { fileName, fileType, categoryId, difficulty, questions } = result.data;

    const batch = await confirmImportBatch({
      fileName,
      fileType,
      uploadedBy: session.name || session.email,
      categoryId: categoryId || undefined,
      difficulty: (difficulty as Difficulty) || Difficulty.MEDIUM,
      questions: questions as RawParsedQuestion[],
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${batch.importedQuestions} questions into the question bank.`,
      batch,
    });
  } catch (error: any) {
    console.error('Import confirm error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save imported questions.' },
      { status: 500 }
    );
  }
}
