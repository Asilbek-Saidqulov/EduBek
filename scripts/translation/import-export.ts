/**
 * EduBek — Translation import/export utilities.
 *
 * Phase 4E.6: Export and import translation catalogs in JSON and CSV
 * formats. Useful for professional translation workflows.
 */
import * as fs from "node:fs";
import * as path from "node:path";

const MESSAGES_DIR = path.join(process.cwd(), "messages");
const LOCALES = ["en", "uz", "ru"];

function flattenKeys(obj: Record<string, unknown>, prefix = ""): Array<{ key: string; value: string }> {
  const entries: Array<{ key: string; value: string }> = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      entries.push({ key: fullKey, value });
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      entries.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else if (Array.isArray(value)) {
      entries.push({ key: fullKey, value: JSON.stringify(value) });
    }
  }
  return entries;
}

function setNestedValue(obj: Record<string, unknown>, key: string, value: string): void {
  const parts = key.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (typeof current[part] !== "object" || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  // Try to parse as JSON (for arrays/objects), otherwise keep as string
  try {
    current[parts[parts.length - 1]!] = JSON.parse(value);
  } catch {
    current[parts[parts.length - 1]!] = value;
  }
}

/**
 * Export all translation catalogs as a single CSV file.
 * Columns: key, en, uz, ru
 */
export function exportToCSV(outputPath: string): void {
  const catalogs: Record<string, Array<{ key: string; value: string }>> = {};
  for (const locale of LOCALES) {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    const catalog = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    catalogs[locale] = flattenKeys(catalog);
  }

  // Build a map of all keys
  const allKeys = new Set<string>();
  for (const locale of LOCALES) {
    for (const entry of catalogs[locale]!) {
      allKeys.add(entry.key);
    }
  }

  // Build value maps
  const valueMaps: Record<string, Map<string, string>> = {};
  for (const locale of LOCALES) {
    valueMaps[locale] = new Map(catalogs[locale]!.map((e) => [e.key, e.value]));
  }

  // Generate CSV
  const lines: string[] = [];
  lines.push(`key,${LOCALES.join(",")}`);

  for (const key of [...allKeys].sort()) {
    const values = LOCALES.map((locale) => {
      const value = valueMaps[locale]!.get(key) ?? "";
      // Escape CSV: wrap in quotes, escape inner quotes
      return `"${value.replace(/"/g, '""')}"`;
    });
    lines.push(`"${key}",${values.join(",")}`);
  }

  fs.writeFileSync(outputPath, lines.join("\n"), "utf-8");
  console.log(`✅ Exported ${allKeys.size} keys to ${outputPath}`);
}

/**
 * Import translations from a CSV file and update the message catalogs.
 * CSV format: key,en,uz,ru
 */
export function importFromCSV(inputPath: string, merge = true): void {
  const content = fs.readFileSync(inputPath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());

  if (lines.length < 2) {
    console.error("❌ CSV file must have a header row and at least one data row");
    process.exit(1);
  }

  // Parse header
  const header = parseCSVLine(lines[0]!);
  if (header[0] !== "key") {
    console.error("❌ First column must be 'key'");
    process.exit(1);
  }

  const csvLocales = header.slice(1);
  console.log(`Importing ${lines.length - 1} rows for locales: ${csvLocales.join(", ")}`);

  // Load existing catalogs
  const catalogs: Record<string, Record<string, unknown>> = {};
  for (const locale of csvLocales) {
    if (!LOCALES.includes(locale)) {
      console.error(`❌ Unknown locale: ${locale}. Supported: ${LOCALES.join(", ")}`);
      process.exit(1);
    }
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    catalogs[locale] = merge ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : {};
  }

  // Parse data rows
  let imported = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]!);
    const key = cols[0];
    if (!key) continue;

    for (let j = 0; j < csvLocales.length; j++) {
      const locale = csvLocales[j]!;
      const value = cols[j + 1] ?? "";
      if (value) {
        setNestedValue(catalogs[locale]!, key, value);
        imported++;
      }
    }
  }

  // Write updated catalogs
  for (const locale of csvLocales) {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    fs.writeFileSync(filePath, JSON.stringify(catalogs[locale], null, 2) + "\n", "utf-8");
    console.log(`  ✅ Updated ${locale}.json`);
  }

  console.log(`\n✅ Imported ${imported} values across ${csvLocales.length} locales`);
}

/**
 * Export all translation catalogs as separate JSON files (for external tools).
 */
export function exportToJSON(outputDir: string): void {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const locale of LOCALES) {
    const srcPath = path.join(MESSAGES_DIR, `${locale}.json`);
    const destPath = path.join(outputDir, `${locale}.json`);
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✅ Exported ${locale}.json → ${destPath}`);
  }

  // Also export a flat version (key-value pairs)
  for (const locale of LOCALES) {
    const catalog = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf-8"));
    const flat = flattenKeys(catalog);
    const flatObj: Record<string, string> = {};
    for (const entry of flat) {
      flatObj[entry.key] = entry.value;
    }
    const flatPath = path.join(outputDir, `${locale}.flat.json`);
    fs.writeFileSync(flatPath, JSON.stringify(flatObj, null, 2) + "\n", "utf-8");
    console.log(`  ✅ Exported ${locale}.flat.json → ${flatPath}`);
  }
}

// Helper: parse a CSV line respecting quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// CLI entry point
const command = process.argv[2];
if (command === "export-csv") {
  const output = process.argv[3] || "translations.csv";
  exportToCSV(output);
} else if (command === "import-csv") {
  const input = process.argv[3] || "translations.csv";
  importFromCSV(input);
} else if (command === "export-json") {
  const output = process.argv[3] || "translations-export";
  exportToJSON(output);
} else {
  console.log(`
EduBek Translation Import/Export Tool

Usage:
  npx tsx scripts/translation/import-export.ts export-csv [output.csv]
  npx tsx scripts/translation/import-export.ts import-csv [input.csv]
  npx tsx scripts/translation/import-export.ts export-json [output-dir]

Commands:
  export-csv   Export all catalogs as a single CSV (key,en,uz,ru)
  import-csv   Import translations from CSV and merge into catalogs
  export-json  Export catalogs as separate JSON files + flat versions
`);
}
