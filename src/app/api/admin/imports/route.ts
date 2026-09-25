import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { getImportBatches } from '@/lib/services/question.service';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const batches = await getImportBatches();
    return NextResponse.json({ batches });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
