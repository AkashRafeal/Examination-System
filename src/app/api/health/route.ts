import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const startTime = Date.now();

  try {
    // Ultra-lightweight DB health probe
    await db.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          latencyMs,
        },
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          error: error.message,
        },
      },
      { status: 503 }
    );
  }
}
