import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies, hasAdminAccess } from '@/lib/auth/session';
import {
  getCategories,
  createCategory,
  updateCategory,
  updateCategoryQuantities,
  deleteCategory,
} from '@/lib/services/question.service';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  questionQuantity: z.number().int().min(0).optional(),
});

const updateCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).optional(),
  questionQuantity: z.number().int().min(0).optional(),
  quantities: z
    .array(
      z.object({
        id: z.string(),
        questionQuantity: z.number().int().min(0),
      })
    )
    .optional(),
});

import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || !hasAdminAccess(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId') || undefined;

    // Regular ADMIN can ONLY see categories created by them
    // SUPER_ADMIN can see all, or filter by specific adminId
    const createdById = session.role === 'ADMIN' ? session.userId : (adminId || undefined);

    const [categories, admins] = await Promise.all([
      getCategories(createdById),
      session.role === 'SUPER_ADMIN'
        ? db.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({ categories, admins });
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
    const result = createCategorySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const category = await createCategory(result.data.name, result.data.questionQuantity, session.userId);
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || !hasAdminAccess(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const result = updateCategorySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    if (result.data.quantities && result.data.quantities.length > 0) {
      // If admin, verify ownership of all categories
      if (session.role === 'ADMIN') {
        const catIds = result.data.quantities.map((q) => q.id);
        const nonOwned = await db.category.count({
          where: {
            id: { in: catIds },
            createdById: { not: session.userId },
          } as any,
        });
        if (nonOwned > 0) {
          return NextResponse.json(
            { error: 'Forbidden: You can only update quantities for your own categories.' },
            { status: 403 }
          );
        }
      }

      await updateCategoryQuantities(result.data.quantities);
      return NextResponse.json({ success: true, message: 'Category quantities updated successfully.' });
    }

    if (result.data.id) {
      if (session.role === 'ADMIN') {
        const existing: any = await db.category.findUnique({
          where: { id: result.data.id },
          select: { createdById: true } as any,
        });
        if (!existing) {
          return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
        }
        if (existing.createdById && existing.createdById !== session.userId) {
          return NextResponse.json(
            { error: 'Forbidden: You can only modify categories created by you.' },
            { status: 403 }
          );
        }
      }

      const updated = await updateCategory(result.data.id, {
        name: result.data.name,
        questionQuantity: result.data.questionQuantity,
      });
      return NextResponse.json({ success: true, category: updated });
    }

    return NextResponse.json({ error: 'Missing category ID or quantities array.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || !hasAdminAccess(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    if (session.role === 'ADMIN') {
      const existing: any = await db.category.findUnique({
        where: { id },
        select: { createdById: true } as any,
      });
      if (!existing) {
        return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
      }
      if (existing.createdById && existing.createdById !== session.userId) {
        return NextResponse.json(
          { error: 'Forbidden: You can only delete categories created by you.' },
          { status: 403 }
        );
      }
    }

    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
