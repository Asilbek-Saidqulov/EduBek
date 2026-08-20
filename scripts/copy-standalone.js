/**
 * Cross-platform script to copy Next.js build output into the standalone dir.
 *
 * Replaces the Unix-only `cp -r` commands in the build script so the project
 * builds correctly on both Windows and Unix (macOS/Linux).
 *
 * Usage: node scripts/copy-standalone.js
 *
 * Copies:
 *   .next/static → .next/standalone/.next/static
 *   public      → .next/standalone/public
 */
const fs = require('fs');
const path = require('path');

const STANDALONE_DIR = path.join(process.cwd(), '.next', 'standalone');
const STATIC_SRC = path.join(process.cwd(), '.next', 'static');
const STATIC_DST = path.join(STANDALONE_DIR, '.next', 'static');
const PUBLIC_SRC = path.join(process.cwd(), 'public');
const PUBLIC_DST = path.join(STANDALONE_DIR, 'public');

/**
 * Recursively copy a directory, creating target dirs as needed.
 * Uses fs.cpSync (Node 16.7+) which handles recursive copy natively.
 */
function copyDir(src, dst, label) {
  if (!fs.existsSync(src)) {
    console.log(`  skip: ${label} (source not found: ${src})`);
    return;
  }
  try {
    fs.cpSync(src, dst, { recursive: true, force: true });
    console.log(`  copied: ${label} → ${dst}`);
  } catch (err) {
    console.error(`  error copying ${label}:`, err.message);
    process.exit(1);
  }
}

console.log('Copying standalone build output...');
copyDir(STATIC_SRC, STATIC_DST, '.next/static');
copyDir(PUBLIC_SRC, PUBLIC_DST, 'public');
console.log('Done.');
