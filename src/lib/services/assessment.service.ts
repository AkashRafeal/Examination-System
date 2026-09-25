import { db } from '@/lib/db';
import { AssessmentStatus, Prisma } from '@prisma/client';
import { getActiveQuestionIds } from '@/lib/cache/question-cache';

export const EXAM_DURATION_MINUTES = 60; // Strictly 1 hour (60 minutes)

export interface SanitizedOption {
  key: string;
  text: string;
}

export interface SanitizedQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  options: SanitizedOption[];
}

export interface AssessmentResponse {
  id: string;
  status: AssessmentStatus;
  totalQuestions: number;
  attemptedQuestions: number;
  startedAt: string;
  deadlineAt: string;
  durationMinutes: number;
  remainingSeconds: number;
  submittedAt?: string | null;
  questions: SanitizedQuestion[];
  answers: Record<string, string>; // questionId -> selectedOption
}

/**
 * Fisher-Yates array shuffle.
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Calculates remaining seconds based on server authoritative deadline.
 */
function computeRemainingSeconds(deadlineAt: Date): number {
  const diffMs = deadlineAt.getTime() - Date.now();
  return Math.max(0, Math.floor(diffMs / 1000));
}

/**
 * Starts a new assessment or resumes an existing in-progress assessment.
 * Strictly enforces 1 attempt per user, 60-minute duration, and 50 randomized questions.
 */
export async function startOrResumeAssessment(userId: string): Promise<AssessmentResponse> {
  // 1. Check for existing assessment
  const existingAssessment = await db.assessment.findFirst({
    where: { userId },
    include: {
      questions: {
        orderBy: { questionOrder: 'asc' },
        include: {
          question: {
            include: {
              options: {
                orderBy: { optionKey: 'asc' },
                select: {
                  optionKey: true,
                  optionText: true,
                },
              },
            },
          },
        },
      },
      answers: true,
    },
  });

  if (existingAssessment) {
    if (existingAssessment.status === AssessmentStatus.COMPLETED) {
      throw new Error('You have already completed the assessment. Only one attempt is permitted.');
    }

    // Ensure deadline is set
    const dur = existingAssessment.durationMinutes || existingAssessment.totalQuestions || EXAM_DURATION_MINUTES;
    let deadline = existingAssessment.deadlineAt;
    if (!deadline) {
      deadline = new Date(existingAssessment.startedAt.getTime() + dur * 60 * 1000);
    }

    // If deadline has expired while candidate was away, auto-submit immediately
    if (Date.now() >= deadline.getTime()) {
      await submitAssessment(existingAssessment.id, userId, 'time_expired');
      throw new Error(`The ${dur}-minute assessment duration has expired. The exam has been automatically submitted.`);
    }

    // Resume IN_PROGRESS assessment
    const answersMap: Record<string, string> = {};
    for (const ans of existingAssessment.answers) {
      answersMap[ans.questionId] = ans.selectedOption;
    }

    return {
      id: existingAssessment.id,
      status: existingAssessment.status,
      totalQuestions: existingAssessment.totalQuestions,
      attemptedQuestions: Object.keys(answersMap).length,
      startedAt: existingAssessment.startedAt.toISOString(),
      deadlineAt: deadline.toISOString(),
      durationMinutes: existingAssessment.durationMinutes || EXAM_DURATION_MINUTES,
      remainingSeconds: computeRemainingSeconds(deadline),
      submittedAt: existingAssessment.submittedAt?.toISOString() || null,
      questions: existingAssessment.questions.map((aq: any) => ({
        id: aq.question.id,
        questionNumber: aq.questionOrder,
        questionText: aq.question.questionText,
        options: aq.question.options.map((opt: any) => ({
          key: opt.optionKey,
          text: opt.optionText,
        })),
      })),
      answers: answersMap,
    };
  }

  // 2. No assessment exists: Check if admin has set category question quantities
  const configuredCategories = await db.category.findMany({
    where: { questionQuantity: { gt: 0 } },
    include: {
      questions: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  let selectedQuestionIds: string[] = [];

  if (configuredCategories.length > 0) {
    // Validate each configured category has enough active questions
    for (const cat of (configuredCategories as any[])) {
      if (cat.questions.length < cat.questionQuantity) {
        throw new Error(
          `Category "${cat.name}" requires ${cat.questionQuantity} questions for the assessment, but only ${cat.questions.length} active questions exist in the question bank. Please add more active questions or adjust the category question quantity in the Admin panel.`
        );
      }
      // Shuffle questions within this category and pick the configured quantity
      const catShuffled: string[] = shuffleArray(cat.questions.map((q: any) => q.id as string));
      selectedQuestionIds.push(...catShuffled.slice(0, cat.questionQuantity));
    }

    // Shuffle the final selected question set so candidate sees randomized questions
    selectedQuestionIds = shuffleArray(selectedQuestionIds);
  } else {
    // If no category has a specific quantity configured by admin, prevent starting an unconfigured exam
    throw new Error(
      'The administrator has not yet configured the question quantities for this assessment. Please configure category question distribution in the Admin Categories panel before starting.'
    );
  }

  const totalQuestions = selectedQuestionIds.length;
  // Strictly 1 minute per question
  const durationMinutes = Math.max(1, totalQuestions);
  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

  // 3. Create Assessment and AssessmentQuestion records in an atomic transaction
  const newAssessment = await db.$transaction(async (tx: any) => {
    const assessment = await tx.assessment.create({
      data: {
        userId,
        status: AssessmentStatus.IN_PROGRESS,
        totalQuestions,
        unanswered: totalQuestions,
        durationMinutes,
        startedAt,
        deadlineAt,
      },
    });

    // Create assigned questions with fixed order (1 to totalQuestions)
    await tx.assessmentQuestion.createMany({
      data: selectedQuestionIds.map((qId, idx) => ({
        assessmentId: assessment.id,
        questionId: qId,
        questionOrder: idx + 1,
      })),
    });

    return assessment;
  });

  // 4. Return sanitized questions and countdown data for the newly created assessment
  return getAssessmentForUser(newAssessment.id, userId);
}

/**
 * Retrieves assessment state for a user with strict IDOR verification, timer synchronization, and data sanitization.
 */
export async function getAssessmentForUser(
  assessmentId: string,
  userId: string
): Promise<AssessmentResponse> {
  const assessment = await db.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      questions: {
        orderBy: { questionOrder: 'asc' },
        include: {
          question: {
            include: {
              options: {
                orderBy: { optionKey: 'asc' },
                select: {
                  optionKey: true,
                  optionText: true,
                },
              },
            },
          },
        },
      },
      answers: true,
    },
  });

  if (!assessment) {
    throw new Error('Assessment not found.');
  }

  // Strict IDOR verification
  if (assessment.userId !== userId) {
    throw new Error('Unauthorized: You do not have access to this assessment.');
  }

  if (assessment.status === AssessmentStatus.COMPLETED) {
    throw new Error('You have already completed the assessment. Only one attempt is permitted.');
  }

  // Authoritative deadline calculation
  const dur = assessment.durationMinutes || assessment.totalQuestions || EXAM_DURATION_MINUTES;
  let deadline = assessment.deadlineAt;
  if (!deadline) {
    deadline = new Date(assessment.startedAt.getTime() + dur * 60 * 1000);
  }

  // Check if deadline has elapsed
  if (Date.now() >= deadline.getTime()) {
    await submitAssessment(assessment.id, userId, 'time_expired');
    throw new Error(`The ${dur}-minute assessment duration has expired. The exam has been automatically submitted.`);
  }

  const answersMap: Record<string, string> = {};
  for (const ans of assessment.answers) {
    answersMap[ans.questionId] = ans.selectedOption;
  }

  return {
    id: assessment.id,
    status: assessment.status,
    totalQuestions: assessment.totalQuestions,
    attemptedQuestions: Object.keys(answersMap).length,
    startedAt: assessment.startedAt.toISOString(),
    deadlineAt: deadline.toISOString(),
    durationMinutes: assessment.durationMinutes || EXAM_DURATION_MINUTES,
    remainingSeconds: computeRemainingSeconds(deadline),
    submittedAt: assessment.submittedAt?.toISOString() || null,
    questions: assessment.questions.map((aq: any) => ({
      id: aq.question.id,
      questionNumber: aq.questionOrder,
      questionText: aq.question.questionText,
      options: aq.question.options.map((opt: any) => ({
        key: opt.optionKey,
        text: opt.optionText,
      })),
    })),
    answers: answersMap,
  };
}

/**
 * Autosaves or updates an individual question's answer during an active assessment.
 * Optimized for high concurrency: minimal database round trips.
 */
export async function autosaveAnswer(
  assessmentId: string,
  userId: string,
  questionId: string,
  selectedOption: string
): Promise<{ success: boolean }> {
  // Validate option is A, B, C, or D
  const validOption = selectedOption.toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(validOption)) {
    throw new Error('Invalid option selected.');
  }

  // 1. Single database check for ownership, status, and deadline
  const assessment = await db.assessment.findUnique({
    where: { id: assessmentId },
    select: {
      userId: true,
      status: true,
      deadlineAt: true,
      startedAt: true,
      durationMinutes: true,
      totalQuestions: true,
    },
  });

  if (!assessment) throw new Error('Assessment not found.');
  if (assessment.userId !== userId) throw new Error('Unauthorized assessment access.');
  if (assessment.status !== AssessmentStatus.IN_PROGRESS) {
    throw new Error('Cannot modify answers for a completed assessment.');
  }

  // 2. Authoritative deadline check with 15-second grace window for in-flight requests
  const dur = assessment.durationMinutes || assessment.totalQuestions || EXAM_DURATION_MINUTES;
  const deadline =
    assessment.deadlineAt ||
    new Date(assessment.startedAt.getTime() + dur * 60 * 1000);

  if (Date.now() > deadline.getTime() + 15000) {
    await submitAssessment(assessmentId, userId, 'time_expired');
    throw new Error('Exam time has expired. Answers can no longer be modified.');
  }

  // 3. Atomic upsert using composite unique constraint (assessmentId_questionId)
  await db.assessmentAnswer.upsert({
    where: {
      assessmentId_questionId: {
        assessmentId,
        questionId,
      },
    },
    update: {
      selectedOption: validOption,
      answeredAt: new Date(),
    },
    create: {
      assessmentId,
      questionId,
      selectedOption: validOption,
      answeredAt: new Date(),
    },
  });

  return { success: true };
}

/**
 * Submits the assessment and executes server-side atomic evaluation.
 * Returns only a generic message with zero scores/answer keys leaked to the user.
 */
export async function submitAssessment(
  assessmentId: string,
  userId: string,
  reason: string = 'manual'
): Promise<{ message: string }> {
  // 1. Lightweight projection: Only fetch correct option keys and student answers
  const assessment = await db.assessment.findUnique({
    where: { id: assessmentId },
    select: {
      id: true,
      userId: true,
      status: true,
      totalQuestions: true,
      questions: {
        select: {
          questionId: true,
          question: {
            select: {
              options: {
                where: { isCorrect: true },
                select: {
                  optionKey: true,
                },
              },
            },
          },
        },
      },
      answers: {
        select: {
          questionId: true,
          selectedOption: true,
        },
      },
    },
  });

  if (!assessment) throw new Error('Assessment not found.');
  if (assessment.userId !== userId) throw new Error('Unauthorized assessment access.');
  if (assessment.status === AssessmentStatus.COMPLETED) {
    // Idempotent return to prevent duplicate submission errors
    return {
      message: 'Your assessment has already been submitted. Your result will be available to the administrator.',
    };
  }

  // 2. Server-Side Evaluation
  const correctAnswerMap = new Map<string, string>();
  for (const aq of assessment.questions) {
    const correctOpt = aq.question.options[0];
    if (correctOpt) {
      correctAnswerMap.set(aq.questionId, correctOpt.optionKey.toUpperCase());
    }
  }

  const userAnswersMap = new Map<string, string>();
  for (const ans of assessment.answers) {
    userAnswersMap.set(ans.questionId, ans.selectedOption.toUpperCase());
  }

  let correctCount = 0;
  let incorrectCount = 0;
  let attemptedCount = 0;

  for (const [questionId, correctKey] of correctAnswerMap.entries()) {
    const userSelected = userAnswersMap.get(questionId);
    if (userSelected) {
      attemptedCount++;
      if (userSelected === correctKey) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    }
  }

  const total = assessment.totalQuestions || 50;
  const unansweredCount = Math.max(0, total - attemptedCount);
  const score = correctCount;
  const percentage = (score / total) * 100;

  // 3. Execute atomic update with condition to ensure exactly-once submission
  await db.assessment.update({
    where: { id: assessmentId },
    data: {
      status: AssessmentStatus.COMPLETED,
      attemptedQuestions: attemptedCount,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      unanswered: unansweredCount,
      score,
      percentage,
      submittedAt: new Date(),
      submissionReason: reason,
    },
  });

  return {
    message:
      'Your assessment has been submitted successfully. Your result will be available to the administrator.',
  };
}

/**
 * Allows candidate(s) to re-attend the examination by resetting/clearing their existing attempt(s).
 */
export async function allowUserRetake(params: {
  userIds?: string[];
  assessmentIds?: string[];
}) {
  const targetUserIds = new Set<string>(params.userIds || []);

  if (params.assessmentIds && params.assessmentIds.length > 0) {
    const assessments = await db.assessment.findMany({
      where: { id: { in: params.assessmentIds } },
      select: { userId: true },
    });
    for (const a of assessments) {
      targetUserIds.add(a.userId);
    }
  }

  const userIdsArray = Array.from(targetUserIds);
  if (userIdsArray.length === 0) {
    return { count: 0, message: 'No candidate specified for retake.' };
  }

  // Find all assessments belonging to these candidates
  const assessmentsToDelete = await db.assessment.findMany({
    where: { userId: { in: userIdsArray } },
    select: { id: true },
  });

  if (assessmentsToDelete.length === 0) {
    return { count: 0, message: 'No existing assessments found for the specified candidates.' };
  }

  const assessmentIdsToDelete = assessmentsToDelete.map((a: { id: string }) => a.id);

  await db.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.assessmentAnswer.deleteMany({
      where: { assessmentId: { in: assessmentIdsToDelete } },
    });
    await tx.assessmentQuestion.deleteMany({
      where: { assessmentId: { in: assessmentIdsToDelete } },
    });
    await tx.assessment.deleteMany({
      where: { id: { in: assessmentIdsToDelete } },
    });
  });

  return {
    count: assessmentIdsToDelete.length,
    usersCount: userIdsArray.length,
    message: `Successfully enabled retake for ${userIdsArray.length} candidate(s).`,
  };
}

