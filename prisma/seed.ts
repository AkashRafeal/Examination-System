import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPass(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('--- Starting Database Seed (Admin Only) ---');

  const adminPassword = await hashPass('Admin@123456');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@assessment.com' },
    update: {
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
  console.log(`✓ Seeded Admin User: ${admin.email}`);
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
