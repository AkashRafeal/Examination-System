import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function getUsers(filters: {
  page?: number;
  limit?: number;
  search?: string;
  batchId?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  actorRole?: string;
  actorUserId?: string;
  adminId?: string;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  if (filters.actorRole === 'ADMIN') {
    // Regular admin can ONLY see USER (candidates) added by them
    where.role = 'USER';
    if (filters.actorUserId) {
      (where as any).createdById = filters.actorUserId;
    }
  } else {
    if (filters.role) {
      where.role = filters.role as any;
    }
    if (filters.adminId) {
      (where as any).createdById = filters.adminId;
    }
  }

  if (filters.batchId) {
    where.batchId = filters.batchId;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [total, users, admins] = await Promise.all([
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
        createdById: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
      } as any,
    }),
    filters.actorRole === 'SUPER_ADMIN'
      ? db.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true, name: true, email: true },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ]);

  return {
    users,
    admins,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function toggleUserStatus(id: string, actorRole?: string, actorUserId?: string) {
  const user: any = await db.user.findUnique({
    where: { id },
    select: { isActive: true, role: true, createdById: true } as any,
  });

  if (!user) throw new Error('User not found');
  
  if (user.role === 'SUPER_ADMIN') {
    throw new Error('Super Administrator accounts cannot be deactivated.');
  }

  if (actorRole === 'ADMIN') {
    if (user.role !== 'USER' || user.createdById !== actorUserId) {
      throw new Error('Unauthorized: You can only modify candidates added by you.');
    }
  }

  if (user.role === 'ADMIN') {
    if (actorRole !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: Only Super Administrators can deactivate or activate Administrator accounts.');
    }
  }

  return db.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });
}

export async function deleteUser(id: string, currentUserId?: string, actorRole?: string) {
  const user: any = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, role: true, batchId: true, createdById: true } as any,
  });

  if (!user) throw new Error('User not found');
  if (currentUserId && id === currentUserId) {
    throw new Error('You cannot delete your own logged-in account.');
  }
  if ((user.role as string) === 'SUPER_ADMIN') {
    throw new Error('Super Administrator accounts cannot be deleted.');
  }

  if (actorRole === 'ADMIN') {
    if (user.role !== 'USER' || (user as any).createdById !== currentUserId) {
      throw new Error('Unauthorized: You can only delete candidates added by you.');
    }
  }

  if (user.role === 'ADMIN') {
    if (actorRole !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: Only Super Administrators can delete Administrator accounts.');
    }
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
  currentUserId?: string,
  actorRole?: string
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

  const where: any = {
    role: 'USER',
    ...(currentUserId ? { NOT: { id: currentUserId } } : {}),
  };

  if (actorRole === 'ADMIN' && currentUserId) {
    where.createdById = currentUserId;
  }

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

export async function createUser(
  data: {
    name: string;
    email: string;
    password?: string;
    role?: 'ADMIN' | 'USER';
    batchId?: string | null;
  },
  creatorRole?: string,
  createdById?: string
) {
  const targetRole = data.role || 'USER';

  if (targetRole === 'ADMIN') {
    if (creatorRole !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: Only Super Administrators can create Administrator accounts.');
    }
  }

  const trimmedName = data.name.trim();
  const normalizedEmail = data.email.trim().toLowerCase();

  if (!trimmedName) {
    throw new Error(targetRole === 'ADMIN' ? 'Administrator name is required.' : 'Candidate name is required.');
  }

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('A valid email address is required.');
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
    if (targetRole === 'ADMIN') {
      plainPassword = 'Admin@' + Math.floor(100000 + Math.random() * 900000);
    } else {
      const firstName =
        trimmedName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .split(/\s+/)[0] || 'candidate';
      plainPassword = `${firstName}@123`;
    }
  }

  if (plainPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(plainPassword, salt);

  // Validate batchId if provided
  let validBatchId: string | null = null;
  if (targetRole === 'USER' && data.batchId && data.batchId !== 'NONE' && data.batchId !== '') {
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
      role: targetRole as any,
      isActive: true,
      batchId: validBatchId,
      createdById: createdById || null,
    } as any,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      createdById: true,
      batch: {
        select: {
          id: true,
          batchName: true,
        },
      },
    } as any,
  });

  // If assigned to a batch, increment totalCandidates count
  if (validBatchId) {
    await db.userBatch.update({
      where: { id: validBatchId },
      data: { totalCandidates: { increment: 1 } },
    }).catch(() => {});
  }

  return {
    user,
    plainPassword,
  };
}

export async function createCandidateUser(data: {
  name: string;
  email: string;
  password?: string;
  batchId?: string | null;
}) {
  return createUser({ ...data, role: 'USER' });
}
