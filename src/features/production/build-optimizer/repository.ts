/**
 * EduBek — Build Optimizer repository.
 *
 * Thin filesystem + package.json reader. All business logic lives in
 * the dedicated analyzer files. No Prisma — this module reads the
 * repository itself.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep, dirname } from "node:path";

const ROOT = process.cwd();

// ===========================================================================
// Filesystem helpers
// ===========================================================================

export function readTextFile(relPath: string): string | null {
  try {
    const abs = join(ROOT, relPath);
    if (!existsSync(abs)) return null;
    return readFileSync(abs, "utf-8");
  } catch {
    return null;
  }
}

export function fileExists(relPath: string): boolean {
  return existsSync(join(ROOT, relPath));
}

export function listFiles(dir: string, opts: { extension?: string; recursive?: boolean; exclude?: string[] } = {}): string[] {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  const results: string[] = [];
  const exclude = new Set(opts.exclude ?? ["node_modules", ".next", ".git", "dist", "build"]);
  // The prefix starts with the input directory so paths are relative to ROOT
  const walk = (d: string, prefix: string) => {
    const entries = readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      if (exclude.has(e.name)) continue;
      const full = join(d, e.name);
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory() && opts.recursive !== false) {
        walk(full, rel);
      } else if (e.isFile()) {
        if (!opts.extension || e.name.endsWith(opts.extension)) {
          results.push(rel);
        }
      }
    }
  };
  walk(abs, dir);
  return results;
}

export function countLines(relPath: string): number {
  const content = readTextFile(relPath);
  if (!content) return 0;
  return content.split("\n").length;
}

export function getFileStat(relPath: string): { size: number; lines: number; mtime: Date } | null {
  try {
    const abs = join(ROOT, relPath);
    const stat = statSync(abs);
    return { size: stat.size, lines: countLines(relPath), mtime: stat.mtime };
  } catch {
    return null;
  }
}

export function getFolderDepth(relPath: string): number {
  if (!relPath) return 0;
  return relPath.split(sep).length;
}

// ===========================================================================
// Package.json reader
// ===========================================================================

export interface PackageJson {
  name: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
}

export function readPackageJson(): PackageJson | null {
  const content = readTextFile("package.json");
  if (!content) return null;
  try {
    return JSON.parse(content) as PackageJson;
  } catch {
    return null;
  }
}

// ===========================================================================
// Config readers
// ===========================================================================

export function readTsConfig(): Record<string, unknown> | null {
  const content = readTextFile("tsconfig.json");
  if (!content) return null;
  try {
    // Strip comments — tsconfig allows // and /* */ comments.
    // We must not strip inside strings (e.g., "@/*" path aliases).
    const stripped = stripJsonComments(content);
    return JSON.parse(stripped) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Strip JSON comments while respecting string literals.
 * Handles // line comments and /* block comments, but not inside strings.
 */
function stripJsonComments(text: string): string {
  let result = "";
  let i = 0;
  let inString = false;
  while (i < text.length) {
    const char = text[i];
    // Handle string literals
    if (char === '"' && text[i - 1] !== "\\") {
      inString = !inString;
      result += char;
      i++;
      continue;
    }
    if (inString) {
      result += char;
      i++;
      continue;
    }
    // Handle line comments
    if (char === "/" && text[i + 1] === "/") {
      // Skip to end of line
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }
    // Handle block comments
    if (char === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2; // skip */
      continue;
    }
    result += char;
    i++;
  }
  return result;
}

export function readEslintConfig(): string | null {
  const candidates = [".eslintrc.js", ".eslintrc.json", ".eslintrc.mjs", "eslint.config.mjs", "eslint.config.js"];
  for (const c of candidates) {
    if (fileExists(c)) return readTextFile(c);
  }
  return null;
}

export function readVitestConfig(): string | null {
  const candidates = ["vitest.config.ts", "vitest.config.js", "vitest.config.mts"];
  for (const c of candidates) {
    if (fileExists(c)) return readTextFile(c);
  }
  return null;
}

export function readNextConfig(): string | null {
  const candidates = ["next.config.ts", "next.config.mjs", "next.config.js", "next.config.json"];
  for (const c of candidates) {
    if (fileExists(c)) return readTextFile(c);
  }
  return null;
}

// ===========================================================================
// Import extraction
// ===========================================================================

export function extractImports(filePath: string): string[] {
  const content = readTextFile(filePath);
  if (!content) return [];
  const imports: string[] = [];
  // Match: import ... from '...' or import '...' or require('...')
  const esModule = content.matchAll(/from\s+['"]([^'"]+)['"]/g);
  for (const m of esModule) imports.push(m[1]);
  const sideEffect = content.matchAll(/import\s+['"]([^'"]+)['"]/g);
  for (const m of sideEffect) {
    if (!imports.includes(m[1])) imports.push(m[1]);
  }
  const requireMatches = content.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g);
  for (const m of requireMatches) {
    if (!imports.includes(m[1])) imports.push(m[1]);
  }
  return imports;
}

export function isAliasImport(imp: string): boolean {
  return imp.startsWith("@/") || imp.startsWith("~/") || imp.startsWith("@/");
}

export function isRelativeImport(imp: string): boolean {
  return imp.startsWith("./") || imp.startsWith("../");
}

export function isBareImport(imp: string): boolean {
  return !isAliasImport(imp) && !isRelativeImport(imp) && !imp.startsWith("node:");
}

export function isDeepImport(imp: string): boolean {
  // Deep import = importing from a sub-path of a package
  if (isRelativeImport(imp) || isAliasImport(imp)) return false;
  const parts = imp.split("/");
  // Scoped package: @scope/name/sub
  if (imp.startsWith("@")) return parts.length > 2;
  // Regular package: name/sub
  return parts.length > 1;
}

// ===========================================================================
// Comment / annotation extraction
// ===========================================================================

export function extractComments(filePath: string, type: "TODO" | "FIXME" | "HACK" | "XXX" | "DEPRECATED"): Array<{ line: number; text: string }> {
  const content = readTextFile(filePath);
  if (!content) return [];
  const results: Array<{ line: number; text: string }> = [];
  const lines = content.split("\n");
  const regex = new RegExp(`(//|/\\*|\\*)\\s*${type}[:\\s]?(.*)`, "i");
  lines.forEach((line, idx) => {
    const m = line.match(regex);
    if (m) {
      results.push({ line: idx + 1, text: line.trim() });
    }
  });
  return results;
}

// ===========================================================================
// Helpers
// ===========================================================================

export function relativePath(absPath: string): string {
  return relative(ROOT, absPath).split(sep).join("/");
}

export function getRoot(): string {
  return ROOT;
}

export function getDirname(relPath: string): string {
  return dirname(relPath).split(sep).join("/");
}

export { join, relative };
