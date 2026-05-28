import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';

const globalForPrisma = global;

// Resolve the absolute path to the database in the root folder, matching where Prisma CLI migrates/creates it
const dbPath = path.join(process.cwd(), 'dev.db');
const dbUrl = `file:${dbPath}`;

console.log('Initializing Prisma 7 LibSQL Adapter at path:', dbUrl);

// In Prisma 7, the PrismaLibSql adapter acts as a factory constructor and takes the config object directly
const adapter = new PrismaLibSql({
  url: dbUrl,
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
