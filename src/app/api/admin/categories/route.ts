import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { Role } from '@prisma/client';
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

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== Role.ADMIN) {
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

    const category = await createCategory(result.data.name, result.data.questionQuantity);
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== Role.ADMIN) {
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
      await updateCategoryQuantities(result.data.quantities);
      return NextResponse.json({ success: true, message: 'Category quantities updated successfully.' });
    }

    if (result.data.id) {
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
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
