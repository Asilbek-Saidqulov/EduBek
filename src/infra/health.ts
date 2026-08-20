import { db } from "@/lib/db";

export async function checkDatabaseHealth(): Promise<{ status: "healthy" | "unhealthy"; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch (err: any) {
    return { status: "unhealthy", latencyMs: Date.now() - start, error: err.message };
  }
}

export const livenessCheck = async () => ({ status: "healthy", timestamp: new Date().toISOString() });
export const readinessCheck = async () => ({ status: "ready", database: await checkDatabaseHealth() });
export const metricsExport = async () => ({ timestamp: new Date().toISOString(), memoryUsage: process.memoryUsage?.() || {} });

