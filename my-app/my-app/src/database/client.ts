// AEGIS Database Client — Singleton Prisma client for Neon PostgreSQL
// Uses Prisma 7 driver adapter pattern with @neondatabase/serverless

import { neonConfig, Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@/app/generated/prisma/client';
import ws from 'ws';

// Required for Node.js environments
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  const pool = new Pool({ connectionString });
  // @ts-expect-error — Prisma 7 adapter type mismatch with @neondatabase/serverless Pool
  const adapter = new PrismaNeon(pool);

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
