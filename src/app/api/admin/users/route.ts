import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies, hasAdminAccess } from '@/lib/auth/session';
import { getUsers, createUser, deleteUsers } from '@/lib/services/user.service';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'USER']).optional().default('USER'),
  batchId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || !hasAdminAccess(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;
    const batchId = searchParams.get('batchId') || undefined;
    const roleParam = searchParams.get('role');
    const role = (roleParam === 'SUPER_ADMIN' || roleParam === 'ADMIN' || roleParam === 'USER') ? roleParam : undefined;
    const adminId = searchParams.get('adminId') || undefined;

    const data = await getUsers({
      page,
      limit,
      search,
      batchId,
      role,
      actorRole: session.role,
      actorUserId: session.userId,
      adminId,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || !hasAdminAccess(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const result = createUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    // Strict Enforcement: Only Super Administrator can create Administrator accounts
    if (result.data.role === 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Administrators have permission to create Administrator accounts.' },
        { status: 403 }
      );
    }

    const created = await createUser(
      {
        name: result.data.name,
        email: result.data.email,
        password: result.data.password || undefined,
        role: result.data.role,
        batchId: result.data.batchId || null,
      },
      session.role,
      session.userId
    );

    const roleLabel = (created.user as any).role === 'ADMIN' ? 'Administrator' : 'Candidate';
    return NextResponse.json(
      {
        success: true,
        message: `${roleLabel} ${created.user.name} created successfully.`,
        user: created.user,
        plainPassword: created.plainPassword,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: error.message?.includes('already exists') ? 409 : 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || !hasAdminAccess(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const { userIds, all, batchId, search } = body;

    if (!all && (!Array.isArray(userIds) || userIds.length === 0)) {
      return NextResponse.json(
        { error: 'Provide userIds array or specify all: true' },
        { status: 400 }
      );
    }

    const result = await deleteUsers(
      all
        ? { all: true, batchId: batchId || undefined, search }
        : { ids: userIds },
      session.userId,
      session.role
    );
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.count} user(s).`,
      count: result.count,
    });
  } catch (error: any) {
    console.error('Error bulk deleting users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete users' },
      { status: 500 }
    );
  }
}

