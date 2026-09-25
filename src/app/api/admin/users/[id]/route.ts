import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { toggleUserStatus, deleteUser } from '@/lib/services/user.service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await params;
    const updated = await toggleUserStatus(id);
    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await params;

    // Safety check: Prevent admin from deleting their own current session account
    if (session.userId === id) {
      return NextResponse.json(
        { error: 'You cannot delete your own logged-in administrator account.' },
        { status: 400 }
      );
    }

    const deleted = await deleteUser(id, session.userId);
    return NextResponse.json({
      success: true,
      message: `User "${deleted.name}" has been permanently deleted.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
