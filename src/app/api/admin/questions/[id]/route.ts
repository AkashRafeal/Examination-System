import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies, hasAdminAccess } from '@/lib/auth/session';
import {
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  toggleQuestionStatus,
} from '@/lib/services/question.service';

import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookies();
    if (!session || !hasAdminAccess(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await params;
    const question = await getQuestionById(id);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    if (session.role === 'ADMIN' && (question as any).createdById && (question as any).createdById !== session.userId) {
      return NextResponse.json({ error: 'Forbidden: You can only view questions created by you.' }, { status: 403 });
    }

    return NextResponse.json({ question });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookies();
    if (!session || !hasAdminAccess(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await params;
    
    if (session.role === 'ADMIN') {
      const existing: any = await db.question.findUnique({
        where: { id },
        select: { createdById: true } as any,
      });
      if (!existing) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
      if (existing.createdById && existing.createdById !== session.userId) {
        return NextResponse.json({ error: 'Forbidden: You can only modify questions created by you.' }, { status: 403 });
      }
    }

    const body = await request.json();

    // Check if toggle status action
    if (body.action === 'toggle-status') {
      const updated = await toggleQuestionStatus(id);
      return NextResponse.json({ success: true, question: updated });
    }

    const updated = await updateQuestion(id, body);
    return NextResponse.json({ success: true, question: updated });
  } catch (error: any) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookies();
    if (!session || !hasAdminAccess(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await params;

    if (session.role === 'ADMIN') {
      const existing: any = await db.question.findUnique({
        where: { id },
        select: { createdById: true } as any,
      });
      if (!existing) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
      if (existing.createdById && existing.createdById !== session.userId) {
        return NextResponse.json({ error: 'Forbidden: You can only delete questions created by you.' }, { status: 403 });
      }
    }

    await deleteQuestion(id);
    return NextResponse.json({ success: true, message: 'Question deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
