import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies, hasAdminAccess } from '@/lib/auth/session';
import { db } from '@/lib/db';

export async function GET(_request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || !hasAdminAccess(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const where: any = {};
    if (session.role === 'ADMIN') {
      where.OR = [
        { createdById: session.userId },
        { users: { some: { createdById: session.userId } } },
      ];
    }

    const batches = await db.userBatch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: session.role === 'ADMIN'
              ? { where: { createdById: session.userId } }
              : true,
          },
        },
        users: {
          where: session.role === 'ADMIN' ? { createdById: session.userId } : undefined,
          select: {
            assessments: {
              select: {
                status: true,
                score: true,
                percentage: true,
              },
            },
          },
        },
      } as any,
    });

    interface BatchRecord {
      id: string;
      fileName: string;
      batchName: string;
      createdAt: Date;
      _count: { users: number };
      users: {
        assessments: {
          status: string;
          score: number;
          percentage: number;
        }[];
      }[];
    }

    // Exclude batches with 0 candidates
    const activeBatches = (batches as unknown as BatchRecord[]).filter((b: BatchRecord) => b._count.users > 0);

    const result = activeBatches.map((batch: BatchRecord) => {
      const allAssessments = batch.users.flatMap((u: { assessments: { status: string; score: number; percentage: number }[] }) => u.assessments);
      const completed = allAssessments.filter((a: { status: string; score: number; percentage: number }) => a.status === 'COMPLETED');
      const avgScore =
        completed.length > 0
          ? (completed.reduce((s: number, a: { score: number }) => s + a.score, 0) / completed.length).toFixed(1)
          : null;
      const avgPct =
        completed.length > 0
          ? (completed.reduce((s: number, a: { percentage: number }) => s + a.percentage, 0) / completed.length).toFixed(1)
          : null;

      return {
        id: batch.id,
        fileName: batch.fileName,
        batchName: batch.batchName,
        totalCandidates: batch._count.users,
        testsStarted: allAssessments.length,
        testsCompleted: completed.length,
        avgScore,
        avgPercentage: avgPct,
        createdAt: batch.createdAt,
      };
    });

    return NextResponse.json({ batches: result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
