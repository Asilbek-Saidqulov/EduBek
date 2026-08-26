/**
 * Test setup file for Vitest.
 * 
 * IMPORTANT: This setup does NOT run any destructive database operations
 * (such as deleteMany, drop table, etc.) to ensure production data is never lost.
 */
import { beforeAll, afterAll } from "vitest";

beforeAll(async () => {
  // Safe environment setup - no destructive DB calls
  (process.env as Record<string, string | undefined>).NODE_ENV = "test";
});

afterAll(async () => {
  // Safe teardown
});
