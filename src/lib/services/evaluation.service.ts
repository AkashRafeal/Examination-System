import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface ResultFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'score' | 'submittedAt' | 'percentage';
  sortOrder?: 'asc' | 'desc';
  batchId?: string;
}

export async function getAssessmentResults(filters: ResultFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.AssessmentWhereInput = {
    status: 'COMPLETED',
  };

  if (filters.search) {
    where.user = {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ],
    };
  }

  if (filters.batchId) {
    const batchCondition = { batchId: filters.batchId };
    if (where.user) {
      // Combine existing user filter with batchId using AND
      where.AND = [
        { user: where.user as object },
        { user: batchCondition },
      ];
      delete where.user;
    } else {
      where.user = batchCondition;
    }
  }

  const orderBy: Prisma.AssessmentOrderByWithRelationInput = {};
  const sortField = filters.sortBy || 'submittedAt';
  const sortDirection = filters.sortOrder || 'desc';
  orderBy[sortField] = sortDirection;

  const [total, assessments] = await Promise.all([
    db.assessment.count({ where }),
    db.assessment.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    assessments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDetailedAssessmentResult(assessmentId: string) {
  const assessment = await db.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
      questions: {
        orderBy: { questionOrder: 'asc' },
        include: {
          question: {
            include: {
              options: {
                orderBy: { optionKey: 'asc' },
              },
            },
          },
        },
      },
      answers: true,
    },
  });

  if (!assessment) throw new Error('Assessment not found');

  const answerMap = new Map<string, string>();
  for (const ans of assessment.answers) {
    answerMap.set(ans.questionId, ans.selectedOption);
  }

  const detailedQuestions = assessment.questions.map((aq) => {
    const q = aq.question;
    const userOptionKey = answerMap.get(q.id) || null;
    const correctOpt = q.options.find((o) => o.isCorrect);
    const correctOptionKey = correctOpt?.optionKey || 'A';

    const userOption = q.options.find((o) => o.optionKey === userOptionKey);
    const correctOption = q.options.find((o) => o.optionKey === correctOptionKey);

    let status: 'CORRECT' | 'INCORRECT' | 'UNANSWERED' = 'UNANSWERED';
    if (userOptionKey) {
      status = userOptionKey === correctOptionKey ? 'CORRECT' : 'INCORRECT';
    }

    return {
      order: aq.questionOrder,
      questionId: q.id,
      questionText: q.questionText,
      category: 'General',
      difficulty: q.difficulty,
      options: q.options.map((opt) => ({
        key: opt.optionKey,
        text: opt.optionText,
        isCorrect: opt.isCorrect,
      })),
      userAnswer: userOptionKey
        ? {
            key: userOptionKey,
            text: userOption?.optionText || '',
          }
        : null,
      correctAnswer: {
        key: correctOptionKey,
        text: correctOption?.optionText || '',
      },
      status,
    };
  });

  return {
    assessment: {
      id: assessment.id,
      status: assessment.status,
      totalQuestions: assessment.totalQuestions,
      attemptedQuestions: assessment.attemptedQuestions,
      correctAnswers: assessment.correctAnswers,
      incorrectAnswers: assessment.incorrectAnswers,
      unanswered: assessment.unanswered,
      score: assessment.score,
      percentage: assessment.percentage,
      startedAt: assessment.startedAt,
      submittedAt: assessment.submittedAt,
    },
    user: assessment.user,
    questions: detailedQuestions,
  };
}

/**
 * Generates CSV string of assessment results for Admin export.
 */
export async function generateResultsCSV(): Promise<string> {
  const assessments = await db.assessment.findMany({
    where: { status: 'COMPLETED' },
    orderBy: { submittedAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const header = [
    'User Name',
    'Email',
    'Assessment ID',
    'Total Questions',
    'Attempted',
    'Correct',
    'Incorrect',
    'Unanswered',
    'Score',
    'Percentage',
    'Started At',
    'Submitted At',
  ].join(',');

  const rows = assessments.map((a) => {
    return [
      `"${a.user.name.replace(/"/g, '""')}"`,
      `"${a.user.email}"`,
      `"${a.id}"`,
      a.totalQuestions,
      a.attemptedQuestions,
      a.correctAnswers,
      a.incorrectAnswers,
      a.unanswered,
      a.score,
      `"${a.percentage.toFixed(1)}%"`,
      `"${a.startedAt.toISOString()}"`,
      `"${a.submittedAt ? a.submittedAt.toISOString() : ''}"`,
    ].join(',');
  });

  return [header, ...rows].join('\n');
}
