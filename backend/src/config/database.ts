import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { logger } from '@/utils/logger';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? [] : ['error'],
  }).$extends(withAccelerate());
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env['NODE_ENV'] !== 'production') globalThis.prismaGlobal = prisma;

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('✅ Connected to PostgreSQL via Prisma Accelerate');

    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database connection test successful');
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('✅ Disconnected from PostgreSQL');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
