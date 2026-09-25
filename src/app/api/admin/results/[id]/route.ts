import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { getDetailedAssessmentResult } from '@/lib/services/evaluation.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await params;
    const detail = await getDetailedAssessmentResult(id);
    return NextResponse.json(detail);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
