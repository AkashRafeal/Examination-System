import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function POST() {
  await clearSessionCookie();
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('examination_auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.delete('examination_auth_token');
  return response;
}

export async function GET(request: Request) {
  await clearSessionCookie();
  const loginUrl = new URL('/login', request.url);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set('examination_auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.delete('examination_auth_token');
  return response;
}
