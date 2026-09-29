import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPass(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('--- Starting Database Seed (Super Admin & Admin) ---');

  // 1. Seed Super Administrator
  const superAdminPassword = await hashPass('SuperAdmin@123456');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@assessment.com' },
    update: {
      name: 'System Super Administrator',
      passwordHash: superAdminPassword,
      role: 'SUPER_ADMIN' as any,
      isActive: true,
    },
    create: {
      name: 'System Super Administrator',
      email: 'superadmin@assessment.com',
      passwordHash: superAdminPassword,
      role: 'SUPER_ADMIN' as any,
      isActive: true,
    },
  });
  console.log(`✓ Seeded Super Admin User: ${superAdmin.email} (Password: SuperAdmin@123456)`);

  // 2. Seed Standard Administrator
  const adminPassword = await hashPass('Admin@123456');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@assessment.com' },
    update: {
      name: 'System Administrator',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      name: 'System Administrator',
      email: 'admin@assessment.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✓ Seeded Admin User: ${admin.email} (Password: Admin@123456)`);
  console.log('--- Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
