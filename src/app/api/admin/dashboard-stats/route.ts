import { NextResponse } from 'next/server';
import { getSessionFromCookies, hasAdminAccess } from '@/lib/auth/session';
import { getDashboardStats } from '@/lib/services/question.service';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session || !hasAdminAccess(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const stats = await getDashboardStats(session.role === 'ADMIN' ? session.userId : undefined);
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
