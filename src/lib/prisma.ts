import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env["DATABASE_URL"];

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

export function getPrismaClient() {
  if (globalThis.prisma) {
    return globalThis.prisma;
  }

  const prisma = createPrismaClient();

  if (process.env["NODE_ENV"] !== "production") {
    globalThis.prisma = prisma;
  }

  return prisma;
}
