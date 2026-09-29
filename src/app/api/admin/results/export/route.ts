import { NextResponse } from 'next/server';
import { getSessionFromCookies, hasAdminAccess } from '@/lib/auth/session';
import { generateResultsCSV } from '@/lib/services/evaluation.service';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session || !hasAdminAccess(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const csvContent = await generateResultsCSV(session.role === 'ADMIN' ? session.userId : undefined);
    const dateStr = new Date().toISOString().split('T')[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="assessment_results_${dateStr}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
