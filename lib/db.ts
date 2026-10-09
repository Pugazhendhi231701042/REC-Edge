import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Resolve SQLite database absolute path so Next.js runtime always targets prisma/dev.db
const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
const dbUrl = process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')
  ? process.env.DATABASE_URL
  : `file:${dbPath}`;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
