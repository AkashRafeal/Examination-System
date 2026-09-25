import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { getAssessmentForUser } from '@/lib/services/assessment.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const assessmentData = await getAssessmentForUser(id, session.userId);

    return NextResponse.json({ success: true, data: assessmentData });
  } catch (error: any) {
    const message = error.message || 'Unable to load assessment.';
    const isCompleted =
      message.includes('completed') || message.includes('expired');

    return NextResponse.json(
      {
        error: message,
        completed: isCompleted,
      },
      { status: isCompleted ? 403 : 400 }
    );
  }
}
