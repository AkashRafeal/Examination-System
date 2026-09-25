import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'examination_system_fallback_secret_must_be_32_bytes_long_minimum'
);

const COOKIE_NAME = 'examination_auth_token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let session: { userId: string; role: string } | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = {
        userId: payload.userId as string,
        role: payload.role as string,
      };
    } catch {
      session = null;
    }
  }

  // Auth pages (/login, /register)
  // Allow direct access so users can view the login page, switch accounts, or see who is currently signed in.
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.next();
  }


  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/user/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // User routes
  if (pathname.startsWith('/user')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/user/:path*', '/login', '/register'],
};
