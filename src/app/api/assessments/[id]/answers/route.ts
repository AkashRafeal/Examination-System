import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { autosaveAnswer } from '@/lib/services/assessment.service';
import { z } from 'zod';

const answerSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  selectedOption: z.enum(['A', 'B', 'C', 'D'], {
    errorMap: () => ({ message: 'Selected option must be A, B, C, or D' }),
  }),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id: assessmentId } = await params;
    const body = await request.json();
    const result = answerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { questionId, selectedOption } = result.data;
    const response = await autosaveAnswer(
      assessmentId,
      session.userId,
      questionId,
      selectedOption
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error autosaving answer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save answer.' },
      { status: 400 }
    );
  }
}
