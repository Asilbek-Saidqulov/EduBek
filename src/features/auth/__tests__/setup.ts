import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll } from 'vitest';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Set required environment variables for tests
  process.env.IP_SALT = 'test-salt-for-testing-only';
  
  // Clean up test data
  await prisma.userSession.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test-',
      },
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
