import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client instance.
 * Import this everywhere to share a single connection pool.
 */
const prisma = new PrismaClient();

export default prisma;
