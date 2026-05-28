import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';

const globalForPrisma = global;

// Determine URL and Auth Token based on environment
let dbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
let authToken = process.env.TURSO_AUTH_TOKEN;

// Local fallback if no environment variable or file URL is specified
if (!dbUrl || dbUrl.startsWith('file:')) {
  const dbPath = path.join(process.cwd(), 'dev.db');
  dbUrl = `file:${dbPath}`;
  authToken = undefined;
}

console.log('Initializing Prisma 7 LibSQL Adapter at URL:', dbUrl);

// In Prisma 7, the PrismaLibSql adapter acts as a factory constructor and takes the config object directly
const adapter = new PrismaLibSql({
  url: dbUrl,
  authToken: authToken,
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
