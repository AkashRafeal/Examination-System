import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const configuredCategories = await db.category.findMany({
      where: { questionQuantity: { gt: 0 } },
      select: { questionQuantity: true },
    });

    const totalQuestions = configuredCategories.reduce(
      (acc, c) => acc + c.questionQuantity,
      0
    );

    return NextResponse.json({
      totalQuestions,
      durationMinutes: Math.max(1, totalQuestions),
      hasConfiguration: totalQuestions > 0,
    });
  } catch (error: any) {
    return NextResponse.json({ totalQuestions: 0, hasConfiguration: false }, { status: 500 });
  }
}
