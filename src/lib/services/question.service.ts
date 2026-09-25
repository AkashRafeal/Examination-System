import { db } from '@/lib/db';
import { Difficulty, Prisma } from '@prisma/client';

export { Difficulty };

// Category and Question Bank Management Service
import { RawParsedQuestion } from '../parsers/question-parser';
import { invalidateQuestionCache } from '@/lib/cache/question-cache';

export interface QuestionFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  difficulty?: Difficulty;
  isActive?: boolean;
}

export async function getQuestions(filters: QuestionFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.QuestionWhereInput = {};

  if (filters.search) {
    where.questionText = {
      contains: filters.search,
      mode: 'insensitive',
    };
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.difficulty) {
    where.difficulty = filters.difficulty;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  const [total, questions] = await Promise.all([
    db.question.count({ where }),
    db.question.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        options: {
          orderBy: { optionKey: 'asc' },
        },
      },
    }),
  ]);

  return {
    questions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getQuestionById(id: string) {
  return db.question.findUnique({
    where: { id },
    include: {
      category: true,
      options: {
        orderBy: { optionKey: 'asc' },
      },
    },
  });
}

export async function createQuestion(data: {
  questionText: string;
  categoryId?: string | null;
  difficulty?: Difficulty;
  isActive?: boolean;
  options: { key: string; text: string; isCorrect: boolean }[];
}) {
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const question = await tx.question.create({
      data: {
        questionText: data.questionText,
        categoryId: data.categoryId || null,
        difficulty: data.difficulty || Difficulty.MEDIUM,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    await tx.questionOption.createMany({
      data: data.options.map((opt) => ({
        questionId: question.id,
        optionKey: opt.key.toUpperCase(),
        optionText: opt.text,
        isCorrect: opt.isCorrect,
      })),
    });

    invalidateQuestionCache();
    return question;
  });
}

export async function updateQuestion(
  id: string,
  data: {
    questionText?: string;
    categoryId?: string | null;
    difficulty?: Difficulty;
    isActive?: boolean;
    options?: { key: string; text: string; isCorrect: boolean }[];
  }
) {
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const question = await tx.question.update({
      where: { id },
      data: {
        ...(data.questionText ? { questionText: data.questionText } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.difficulty ? { difficulty: data.difficulty } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    if (data.options && data.options.length > 0) {
      await tx.questionOption.deleteMany({
        where: { questionId: id },
      });

      await tx.questionOption.createMany({
        data: data.options.map((opt) => ({
          questionId: id,
          optionKey: opt.key.toUpperCase(),
          optionText: opt.text,
          isCorrect: opt.isCorrect,
        })),
      });
    }

    invalidateQuestionCache();
    return question;
  });
}

export async function deleteQuestion(id: string) {
  const res = await db.question.delete({
    where: { id },
  });
  invalidateQuestionCache();
  return res;
}

export async function deleteQuestions(
  param:
    | string[]
    | {
        ids?: string[];
        all?: boolean;
        categoryId?: string | null;
        search?: string;
        isActive?: boolean;
      }
) {
  let ids: string[] | undefined;
  let all = false;
  let categoryId: string | null | undefined;
  let search: string | undefined;
  let isActive: boolean | undefined;

  if (Array.isArray(param)) {
    ids = param;
  } else {
    ids = param.ids;
    all = !!param.all;
    categoryId = param.categoryId;
    search = param.search;
    isActive = param.isActive;
  }

  const where: Prisma.QuestionWhereInput = {};

  if (!all && ids && ids.length > 0) {
    where.id = { in: ids };
  } else if (all) {
    if (categoryId) {
      if (categoryId === 'uncategorized') {
        where.categoryId = null;
      } else {
        where.categoryId = categoryId;
      }
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (search) {
      where.questionText = { contains: search, mode: 'insensitive' };
    }
  } else {
    return { count: 0 };
  }

  // Find all matching question IDs to cascade delete dependencies
  const matching = await db.question.findMany({
    where,
    select: { id: true },
  });

  const idsToDelete = matching.map((q: { id: string }) => q.id);
  if (idsToDelete.length === 0) return { count: 0 };

  const res = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.assessmentAnswer.deleteMany({ where: { questionId: { in: idsToDelete } } });
    await tx.assessmentQuestion.deleteMany({ where: { questionId: { in: idsToDelete } } });
    await tx.questionOption.deleteMany({ where: { questionId: { in: idsToDelete } } });
    return tx.question.deleteMany({
      where: { id: { in: idsToDelete } },
    });
  });

  invalidateQuestionCache();
  return res;
}

export async function toggleQuestionStatus(id: string) {
  const current = await db.question.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!current) throw new Error('Question not found');

  const res = await db.question.update({
    where: { id },
    data: { isActive: !current.isActive },
  });
  invalidateQuestionCache();
  return res;
}

export async function getCategories() {
  const categories = await db.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { questions: true },
      },
      questions: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  return categories.map((c: any) => ({
    id: c.id,
    name: c.name,
    questionQuantity: c.questionQuantity,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    _count: c._count,
    activeQuestionsCount: c.questions.length,
  }));
}

export async function createCategory(name: string, questionQuantity?: number) {
  const trimmed = name.trim();
  const qty = typeof questionQuantity === 'number' ? Math.max(0, questionQuantity) : 0;
  return db.category.upsert({
    where: { name: trimmed },
    update: {
      ...(typeof questionQuantity === 'number' ? { questionQuantity: qty } : {}),
    },
    create: {
      name: trimmed,
      questionQuantity: qty,
    },
  });
}

export async function updateCategory(
  id: string,
  data: { name?: string; questionQuantity?: number }
) {
  return db.category.update({
    where: { id },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(typeof data.questionQuantity === 'number'
        ? { questionQuantity: Math.max(0, data.questionQuantity) }
        : {}),
    },
  });
}

export async function updateCategoryQuantities(
  quantities: { id: string; questionQuantity: number }[]
) {
  return db.$transaction(
    quantities.map((item) =>
      db.category.update({
        where: { id: item.id },
        data: { questionQuantity: Math.max(0, Math.floor(item.questionQuantity)) },
      })
    )
  );
}

export async function deleteCategory(id: string) {
  return db.category.delete({
    where: { id },
  });
}

/**
 * Saves confirmed import questions into PostgreSQL inside an ImportBatch record.
 */
export async function confirmImportBatch(params: {
  fileName: string;
  fileType: string;
  uploadedBy: string;
  categoryId?: string | null;
  difficulty?: Difficulty;
  questions: RawParsedQuestion[];
}) {
  const validQuestions = params.questions.filter((q) => q.isValid);

  const batch = await db.$transaction(async (tx: any) => {
    // 1. Create ImportBatch
    const createdBatch = await tx.importBatch.create({
      data: {
        fileName: params.fileName,
        fileType: params.fileType,
        totalQuestions: params.questions.length,
        validQuestions: validQuestions.length,
        invalidQuestions: params.questions.length - validQuestions.length,
        importedQuestions: validQuestions.length,
        uploadedBy: params.uploadedBy,
      },
    });

    // 2. Insert valid questions and their options
    for (const q of validQuestions) {
      const createdQuestion = await tx.question.create({
        data: {
          questionText: q.questionText,
          categoryId: params.categoryId || null,
          difficulty: params.difficulty || Difficulty.MEDIUM,
          isActive: true,
          sourceFileName: params.fileName,
          sourceImportId: createdBatch.id,
        },
      });

      await tx.questionOption.createMany({
        data: q.options.map((opt) => ({
          questionId: createdQuestion.id,
          optionKey: opt.key.toUpperCase(),
          optionText: opt.text,
          isCorrect: opt.key.toUpperCase() === q.correctAnswer.toUpperCase(),
        })),
      });
    }

    return createdBatch;
  });

  invalidateQuestionCache();
  return batch;
}

export async function getImportBatches() {
  return db.importBatch.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDashboardStats() {
  const [
    totalQuestions,
    activeQuestions,
    inactiveQuestions,
    totalUsers,
    assessmentsStarted,
    assessmentsCompleted,
    categories,
    recentAssessments,
    completedAggregation,
  ] = await Promise.all([
    db.question.count(),
    db.question.count({ where: { isActive: true } }),
    db.question.count({ where: { isActive: false } }),
    db.user.count({ where: { role: 'USER' } }),
    db.assessment.count(),
    db.assessment.count({ where: { status: 'COMPLETED' } }),
    db.category.findMany({
      include: {
        _count: { select: { questions: true } },
      },
    }),
    db.assessment.findMany({
      take: 10,
      orderBy: { startedAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    db.assessment.aggregate({
      where: { status: 'COMPLETED' },
      _avg: {
        score: true,
        percentage: true,
      },
    }),
  ]);

  const avgScore = completedAggregation._avg.score?.toFixed(1) || '0.0';
  const avgPercentage = completedAggregation._avg.percentage?.toFixed(1) || '0.0';

  return {
    totalQuestions,
    activeQuestions,
    inactiveQuestions,
    totalUsers,
    assessmentsStarted,
    assessmentsCompleted,
    avgScore,
    avgPercentage,
    categories,
    recentAssessments,
  };
}
