import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
  var prismaPool: Pool | undefined;
}

const DEFAULT_POOL_MAX = 1;

function getPoolMax() {
  const configuredValue = Number(process.env["PG_POOL_MAX"] ?? "");

  if (!Number.isFinite(configuredValue) || configuredValue < 1) {
    return DEFAULT_POOL_MAX;
  }

  return Math.floor(configuredValue);
}

function getPgPool() {
  if (globalThis.prismaPool) {
    return globalThis.prismaPool;
  }

  const connectionString = process.env["DATABASE_URL"];

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const pool = new Pool({
    connectionString,
    max: getPoolMax(),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  globalThis.prismaPool = pool;
  return pool;
}

function createPrismaClient() {
  const adapter = new PrismaPg(getPgPool(), {
    onPoolError(error) {
      console.error("Postgres pool error", error);
    },
  });

  return new PrismaClient({ adapter });
}

export function getPrismaClient() {
  if (globalThis.prisma) {
    return globalThis.prisma;
  }

  const prisma = createPrismaClient();
  globalThis.prisma = prisma;

  return prisma;
}
