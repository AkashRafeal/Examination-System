import { NextResponse } from 'next/server';
import { getSessionFromCookies, hasAdminAccess } from '@/lib/auth/session';
import { getImportBatches } from '@/lib/services/question.service';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session || !hasAdminAccess(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const batches = await getImportBatches();
    return NextResponse.json({ batches });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
