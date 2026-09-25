import { NextResponse } from 'next/server';
import { getSessionFromCookies, setSessionCookie, clearSessionCookie } from '@/lib/auth/session';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // 1. Try finding by ID
  let user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  // 2. Seamless fallback: If database was reseeded and ID changed, resolve by unique email
  if (!user && session.email) {
    user = await db.user.findUnique({
      where: { email: session.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    // Auto-sync cookie session with current user record
    if (user && user.isActive) {
      await setSessionCookie({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    }
  }

  // 3. If user doesn't exist or is deactivated, purge stale cookie
  if (!user || !user.isActive) {
    await clearSessionCookie();
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user,
  });
}
