import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { startOrResumeAssessment } from '@/lib/services/assessment.service';

export async function POST() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const assessmentData = await startOrResumeAssessment(session.userId);
    return NextResponse.json({ success: true, data: assessmentData });
  } catch (error: any) {
    console.error('Error starting assessment:', error);
    const isCompleted =
      error.message && error.message.toLowerCase().includes('already completed');
    return NextResponse.json(
      {
        error:
          error.message ||
          'Unable to start assessment. Only one attempt is permitted per candidate.',
        alreadyCompleted: isCompleted,
      },
      { status: isCompleted ? 403 : 400 }
    );
  }
}
