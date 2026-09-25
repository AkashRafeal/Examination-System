import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { submitAssessment } from '@/lib/services/assessment.service';

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
    let reason = 'manual';
    try {
      const body = await request.json();
      if (body && typeof body.reason === 'string') {
        reason = body.reason;
      }
    } catch {
      // Body is optional
    }

    const result = await submitAssessment(assessmentId, session.userId);

    return NextResponse.json({ ...result, reason });
  } catch (error: any) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json(
      { error: error.message || 'Unable to submit assessment.' },
      { status: 400 }
    );
  }
}
