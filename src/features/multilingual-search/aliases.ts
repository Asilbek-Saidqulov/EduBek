/**
 * EduBek — Cross-language search alias registry.
 *
 * Maps educational terms across languages so that searching for
 * "photosynthesis" also finds "fotosintez" (Uzbek) and "фотосинтез"
 * (Russian), and vice versa.
 *
 * The registry is seeded with common educational terms. Future phases
 * can load aliases from the database (admin-managed) or from AI-
 * generated synonym tables.
 */

export interface AliasEntry {
  canonical: string;
  aliases: string[];
  language: string;
}

// Common educational terms across en/uz/ru
const ALIAS_REGISTRY: AliasEntry[] = [
  { canonical: "photosynthesis", language: "en", aliases: ["fotosintez", "фотосинтез"] },
  { canonical: "mathematics", language: "en", aliases: ["matematika", "математика"] },
  { canonical: "physics", language: "en", aliases: ["fizika", "физика"] },
  { canonical: "chemistry", language: "en", aliases: ["kimyo", "химия"] },
  { canonical: "biology", language: "en", aliases: ["biologiya", "биология"] },
  { canonical: "history", language: "en", aliases: ["tarix", "история"] },
  { canonical: "geography", language: "en", aliases: ["geografiya", "география"] },
  { canonical: "literature", language: "en", aliases: ["adabiyot", "литература"] },
  { canonical: "algebra", language: "en", aliases: ["algebra", "алгебра"] },
  { canonical: "geometry", language: "en", aliases: ["geometriya", "геометрия"] },
  { canonical: "science", language: "en", aliases: ["fan", "наука"] },
  { canonical: "education", language: "en", aliases: ["ta'lim", "образование"] },
  { canonical: "teacher", language: "en", aliases: ["o'qituvchi", "учитель"] },
  { canonical: "student", language: "en", aliases: ["o'quvchi", "ученик"] },
  { canonical: "quiz", language: "en", aliases: ["test", "тест"] },
  { canonical: "exam", language: "en", aliases: ["imtihon", "экзамен"] },
  { canonical: "homework", language: "en", aliases: ["uy vazifasi", "домашнее задание"] },
  { canonical: "lesson", language: "en", aliases: ["dars", "урок"] },
  { canonical: "worksheet", language: "en", aliases: ["ish varaqi", "рабочий лист"] },
  { canonical: "flashcards", language: "en", aliases: ["flashkartalar", "карточки"] },
  { canonical: "fraction", language: "en", aliases: ["kasr", "дробь"] },
  { canonical: "equation", language: "en", aliases: ["tenglama", "уравнение"] },
  { canonical: "gravity", language: "en", aliases: ["tortish kuchi", "гравитация"] },
  { canonical: "ecosystem", language: "en", aliases: ["ekotizim", "экосистема"] },
  { canonical: "evolution", language: "en", aliases: ["evolyutsiya", "эволюция"] },
  { canonical: "democracy", language: "en", aliases: ["demokratiya", "демократия"] },
  { canonical: "cell", language: "en", aliases: ["hujayra", "клетка"] },
  { canonical: "atom", language: "en", aliases: ["atom", "атом"] },
  { canonical: "energy", language: "en", aliases: ["energiya", "энергия"] },
  { canonical: "force", language: "en", aliases: ["kuch", "сила"] },
];

// Build a reverse lookup map: any term → all equivalent terms
const ALIAS_MAP = new Map<string, Set<string>>();
for (const entry of ALIAS_REGISTRY) {
  const allTerms = new Set([entry.canonical, ...entry.aliases]);
  for (const term of allTerms) {
    const lower = term.toLowerCase();
    if (!ALIAS_MAP.has(lower)) {
      ALIAS_MAP.set(lower, new Set());
    }
    for (const t of allTerms) {
      ALIAS_MAP.get(lower)!.add(t.toLowerCase());
    }
  }
}

/**
 * Expand a search query by replacing terms with their cross-language
 * aliases. Returns the original query plus all alias expansions.
 */
export function expandQuery(query: string): {
  expandedTerms: string[];
  aliasesUsed: string[];
} {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const expanded = new Set<string>([query.toLowerCase()]);
  const aliasesUsed: string[] = [];

  for (const term of terms) {
    const aliases = ALIAS_MAP.get(term);
    if (aliases) {
      for (const alias of aliases) {
        expanded.add(alias);
        if (alias !== term) {
          aliasesUsed.push(alias);
        }
      }
    }
  }

  return {
    expandedTerms: [...expanded],
    aliasesUsed,
  };
}

/**
 * Check if a term has cross-language aliases.
 */
export function hasAliases(term: string): boolean {
  return ALIAS_MAP.has(term.toLowerCase());
}

/**
 * Get all aliases for a term.
 */
export function getAliases(term: string): string[] {
  const aliases = ALIAS_MAP.get(term.toLowerCase());
  return aliases ? [...aliases] : [];
}
