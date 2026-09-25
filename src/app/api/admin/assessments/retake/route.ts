import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { allowUserRetake } from '@/lib/services/assessment.service';
import { z } from 'zod';

const retakeSchema = z.object({
  userIds: z.array(z.string()).optional(),
  userId: z.string().optional(),
  assessmentIds: z.array(z.string()).optional(),
  assessmentId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = retakeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input. Please provide userId, userIds, assessmentId, or assessmentIds.' },
        { status: 400 }
      );
    }

    const userIds: string[] = [];
    if (parsed.data.userId) userIds.push(parsed.data.userId);
    if (parsed.data.userIds) userIds.push(...parsed.data.userIds);

    const assessmentIds: string[] = [];
    if (parsed.data.assessmentId) assessmentIds.push(parsed.data.assessmentId);
    if (parsed.data.assessmentIds) assessmentIds.push(...parsed.data.assessmentIds);

    if (userIds.length === 0 && assessmentIds.length === 0) {
      return NextResponse.json(
        { error: 'Please specify at least one candidate or assessment to reset.' },
        { status: 400 }
      );
    }

    const result = await allowUserRetake({
      userIds,
      assessmentIds,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      count: result.count,
    });
  } catch (error: any) {
    console.error('Error allowing retake:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to allow retake' },
      { status: 500 }
    );
  }
}
