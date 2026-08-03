/**
 * EduBek — Prisma client singleton.
 *
 * Repositories are the *only* layer that should import `db` directly. Services
 * compose repositories; routes compose services. Keeping Prisma out of the
 * higher layers makes the data layer swappable (e.g. for a read-replica or a
 * tenant-sharded client) without touching business logic.
 *
 * Query logging is gated by `env.logQueries` so that production traffic does
 * not pay the formatting cost of `log: ['query']` unless an operator has
 * explicitly turned it on.
 */

import { PrismaClient } from "@prisma/client";
import { env } from "@/config/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // Skip Prisma initialization during build if DATABASE_URL is not set
  if (!process.env.DATABASE_URL) {
    // Return a mock client that throws on any operation
    return new PrismaClient() as any;
  }
  
  // `log: ['query']` is verbose and slow; only enable it when the operator
  // (or a developer in dev mode) has explicitly opted in via env.logQueries.
  if (env.logQueries) {
    return new PrismaClient({
      log: [
        { emit: "stdout", level: "query" },
        { emit: "stdout", level: "error" },
        { emit: "stdout", level: "warn" },
      ],
    });
  }
  return new PrismaClient({
    log: [{ emit: "stdout", level: "error" }, { emit: "stdout", level: "warn" }],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (!env.isProd) globalForPrisma.prisma = db;
