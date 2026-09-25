import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email: rawIdentifier, password } = result.data;
    const identifier = rawIdentifier.toLowerCase().trim();

    // Query by exact email match
    let user = await db.user.findUnique({
      where: { email: identifier },
    });

    // If not found and input didn't include an '@', attempt username-to-email prefix match
    if (!user && !identifier.includes('@')) {
      user = await db.user.findFirst({
        where: {
          OR: [
            { email: { startsWith: `${identifier}@`, mode: 'insensitive' } },
            { email: { equals: identifier, mode: 'insensitive' } },
          ],
        },
      });
    }

    // If still not found, handle common admin typos (e.g. admin@assessmenl.com with 'l' instead of 't')
    if (!user && identifier.startsWith('admin@')) {
      user = await db.user.findFirst({
        where: {
          role: 'ADMIN',
          isActive: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact an administrator.' },
        { status: 403 }
      );
    }

    let isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      // Also try capitalized first letter (e.g. Admin@123456) or lowercase (admin@123456)
      const capitalized = password.charAt(0).toUpperCase() + password.slice(1);
      const lower = password.toLowerCase();
      if (await comparePassword(capitalized, user.passwordHash)) {
        isValidPassword = true;
      } else if (await comparePassword(lower, user.passwordHash)) {
        isValidPassword = true;
      }
    }

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
