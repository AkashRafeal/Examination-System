import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function getUsers(filters: {
  page?: number;
  limit?: number;
  search?: string;
  batchId?: string;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  if (filters.batchId) {
    where.batchId = filters.batchId;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        assessments: {
          take: 1,
          orderBy: { startedAt: 'desc' },
          select: {
            id: true,
            status: true,
            score: true,
            percentage: true,
            submittedAt: true,
          },
        },
        batch: {
          select: {
            id: true,
            batchName: true,
          },
        },
      },
    }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function toggleUserStatus(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    select: { isActive: true, role: true },
  });

  if (!user) throw new Error('User not found');
  if (user.role === 'ADMIN') {
    throw new Error('Cannot deactivate admin account');
  }

  return db.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });
}

export async function deleteUser(id: string, currentUserId?: string) {
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, role: true, batchId: true },
  });

  if (!user) throw new Error('User not found');
  if (currentUserId && id === currentUserId) {
    throw new Error('You cannot delete your own logged-in administrator account');
  }
  if (user.role === 'ADMIN') {
    throw new Error('Administrator accounts cannot be deleted');
  }

  const res = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const assessments = await tx.assessment.findMany({
      where: { userId: id },
      select: { id: true },
    });
    const assessmentIds = assessments.map((a: { id: string }) => a.id);

    if (assessmentIds.length > 0) {
      await tx.assessmentAnswer.deleteMany({
        where: { assessmentId: { in: assessmentIds } },
      });
      await tx.assessmentQuestion.deleteMany({
        where: { assessmentId: { in: assessmentIds } },
      });
      await tx.assessment.deleteMany({
        where: { id: { in: assessmentIds } },
      });
    }

    const deleted = await tx.user.delete({
      where: { id },
    });

    if (user.batchId) {
      await tx.userBatch.update({
        where: { id: user.batchId },
        data: { totalCandidates: { decrement: 1 } },
      }).catch(() => {});
    }

    return deleted;
  });

  return res;
}

export async function deleteUsers(
  param:
    | string[]
    | {
        ids?: string[];
        all?: boolean;
        batchId?: string | null;
        search?: string;
      },
  currentUserId?: string
) {
  let ids: string[] | undefined;
  let all = false;
  let batchId: string | null | undefined;
  let search: string | undefined;

  if (Array.isArray(param)) {
    ids = param;
  } else {
    ids = param.ids;
    all = !!param.all;
    batchId = param.batchId;
    search = param.search;
  }

  const where: Prisma.UserWhereInput = {
    role: 'USER',
    ...(currentUserId ? { NOT: { id: currentUserId } } : {}),
  };

  if (!all && ids && ids.length > 0) {
    where.id = { in: ids };
  } else if (all) {
    if (batchId) {
      where.batchId = batchId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
  } else {
    return { count: 0 };
  }

  const nonAdminUsers = await db.user.findMany({
    where,
    select: { id: true, batchId: true },
  });

  if (nonAdminUsers.length === 0) {
    return { count: 0 };
  }

  const userIdsToDelete = nonAdminUsers.map((u: { id: string }) => u.id);

  const res = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const assessments = await tx.assessment.findMany({
      where: { userId: { in: userIdsToDelete } },
      select: { id: true },
    });
    const assessmentIds = assessments.map((a: { id: string }) => a.id);

    if (assessmentIds.length > 0) {
      await tx.assessmentAnswer.deleteMany({
        where: { assessmentId: { in: assessmentIds } },
      });
      await tx.assessmentQuestion.deleteMany({
        where: { assessmentId: { in: assessmentIds } },
      });
      await tx.assessment.deleteMany({
        where: { id: { in: assessmentIds } },
      });
    }

    const deleted = await tx.user.deleteMany({
      where: { id: { in: userIdsToDelete } },
    });

    const batchCounts: Record<string, number> = {};
    for (const u of nonAdminUsers) {
      if (u.batchId) {
        batchCounts[u.batchId] = (batchCounts[u.batchId] || 0) + 1;
      }
    }
    for (const [bId, count] of Object.entries(batchCounts)) {
      await tx.userBatch.update({
        where: { id: bId },
        data: { totalCandidates: { decrement: count } },
      }).catch(() => {});
    }

    return deleted;
  });

  return res;
}

export async function createCandidateUser(data: {
  name: string;
  email: string;
  password?: string;
  batchId?: string | null;
}) {
  const trimmedName = data.name.trim();
  const normalizedEmail = data.email.trim().toLowerCase();

  if (!trimmedName) {
    throw new Error('Candidate name is required.');
  }

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('A valid candidate email address is required.');
  }

  // Check if user already exists
  const existing = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  });

  if (existing) {
    throw new Error(`A user with email "${normalizedEmail}" already exists in the system.`);
  }

  // Determine password
  let plainPassword = data.password?.trim();
  if (!plainPassword) {
    const firstName =
      trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .split(/\s+/)[0] || 'candidate';
    plainPassword = `${firstName}@123`;
  }

  if (plainPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(plainPassword, salt);

  // Validate batchId if provided
  let validBatchId: string | null = null;
  if (data.batchId && data.batchId !== 'NONE' && data.batchId !== '') {
    const batch = await db.userBatch.findUnique({
      where: { id: data.batchId },
      select: { id: true },
    });
    if (batch) {
      validBatchId = batch.id;
    }
  }

  const user = await db.user.create({
    data: {
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
      role: 'USER',
      isActive: true,
      batchId: validBatchId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      batch: {
        select: {
          id: true,
          batchName: true,
        },
      },
    },
  });

  // If assigned to a batch, increment totalCandidates count
  if (validBatchId) {
    await db.userBatch.update({
      where: { id: validBatchId },
      data: { totalCandidates: { increment: 1 } },
    });
  }

  return {
    user,
    plainPassword,
  };
}
