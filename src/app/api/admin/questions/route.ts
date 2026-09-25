import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { Role, Difficulty } from '@prisma/client';
import { getQuestions, createQuestion, deleteQuestions } from '@/lib/services/question.service';
import { z } from 'zod';

const createQuestionSchema = z.object({
  questionText: z.string().min(3, 'Question text must be at least 3 characters'),
  categoryId: z.string().optional().nullable(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  isActive: z.boolean().default(true),
  options: z
    .array(
      z.object({
        key: z.enum(['A', 'B', 'C', 'D']),
        text: z.string().min(1, 'Option text is required'),
        isCorrect: z.boolean(),
      })
    )
    .length(4, 'Exactly 4 options (A, B, C, D) are required'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const difficulty = (searchParams.get('difficulty') as Difficulty) || undefined;
    const isActiveParam = searchParams.get('isActive');
    const isActive =
      isActiveParam !== null && isActiveParam !== undefined && isActiveParam !== ''
        ? isActiveParam === 'true'
        : undefined;

    const data = await getQuestions({
      page,
      limit,
      search,
      categoryId,
      difficulty,
      isActive,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const result = createQuestionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify exactly one option is marked isCorrect
    const correctCount = result.data.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      return NextResponse.json(
        { error: 'Exactly one option must be marked as correct.' },
        { status: 400 }
      );
    }

    const created = await createQuestion(result.data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create question' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const { questionIds, all, categoryId, isActive, search } = body;

    if (!all && (!Array.isArray(questionIds) || questionIds.length === 0)) {
      return NextResponse.json(
        { error: 'Provide questionIds array or specify all: true' },
        { status: 400 }
      );
    }

    const result = await deleteQuestions(
      all
        ? { all: true, categoryId: categoryId || undefined, isActive, search }
        : { ids: questionIds }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.count} question(s).`,
      count: result.count,
    });
  } catch (error: any) {
    console.error('Error deleting questions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete questions' },
      { status: 500 }
    );
  }
}

