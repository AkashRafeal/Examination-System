import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { getAssessmentResults } from '@/lib/services/evaluation.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;
    const sortBy = (searchParams.get('sortBy') as 'score' | 'submittedAt' | 'percentage') || 'submittedAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    const batchId = searchParams.get('batchId') || undefined;

    const data = await getAssessmentResults({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      batchId,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
