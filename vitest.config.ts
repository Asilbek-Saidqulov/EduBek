/**
 * EduBek — Vitest configuration.
 *
 * Phase 4D.7 — Testing infrastructure.
 *
 * Run tests:
 *   npx vitest run                    # all tests
 *   npx vitest run tests/unit         # unit tests only
 *   npx vitest run --coverage         # with coverage
 */
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/features/**", "src/infra/**"],
      exclude: ["src/**/*.test.ts", "src/**/index.ts"],
    },
    setupFiles: [],
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
