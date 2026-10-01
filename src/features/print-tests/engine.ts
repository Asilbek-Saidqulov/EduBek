/**
 * Print-test variant engine.
 *
 * Teachers get N unique paper versions that test the same skills.
 * Math items are parameterized (different numbers, same structure).
 * Passage items swap numbers / names drawn from uploaded material.
 */

export type QuestionKind = "mcq" | "short";
export type LocaleCode = "en" | "uz" | "ru";

export interface PrintQuestion {
  id: string;
  skill: string;
  kind: QuestionKind;
  prompt: string;
  options?: string[];
  answer: string;
  work?: string;
}

export interface StudentSheet {
  index: number;
  code: string;
  studentName: string;
  questions: PrintQuestion[];
}

export interface PrintPack {
  id: string;
  title: string;
  subject: string;
  grade: string;
  locale: LocaleCode;
  questionCount: number;
  studentCount: number;
  createdAt: string;
  sourceName: string;
  skills: string[];
  sheets: StudentSheet[];
  key: Array<{ code: string; studentName: string; answers: string[] }>;
}

export interface GenerateInput {
  title?: string;
  subject?: string;
  grade?: string;
  locale?: LocaleCode;
  studentCount: number;
  questionCount: number;
  materialText?: string;
  sourceName?: string;
  studentNames?: string[];
  preferKinds?: QuestionKind[];
  bank?: BankItem[];
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function randInt(rng: () => number, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length)];
}

function shuffle<T>(rng: () => number, list: T[]): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

function versionCode(packId: string, index: number): string {
  const raw = hashSeed(`${packId}:${index}`).toString(36).toUpperCase();
  return `EB-${raw.slice(0, 4)}-${String(index + 1).padStart(2, "0")}`;
}

function t(locale: LocaleCode, table: Record<LocaleCode, string>) {
  return table[locale] || table.en;
}

export function readableMaterial(text: string): string {
  const clean = text.replace(/\u0000/g, " ").replace(/[^\S\n]+/g, " ").trim();
  if (clean.includes("%PDF") || clean.includes("endobj")) return "";
  const letters = (clean.match(/[A-Za-zА-Яа-яЎўҚқҒғҲҳ]/g) || []).length;
  if (letters < 20 || letters / Math.max(clean.length, 1) < 0.3) return "";
  return clean.slice(0, 40000);
}

export function extractPlainText(fileName: string, raw: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf") || raw.includes("%PDF")) return "";
  return readableMaterial(raw);
}

function extractSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 40 && s.length <= 240)
    .slice(0, 40);
}

export interface BankItem {
  skill: string;
  prompt: string;
  options: string[];
  answer: string;
}

export function compactSource(text: string, maxChars = 1600): string {
  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 2);
  const pairs = lines.filter((line) => /^[A-Za-zА-Яа-я][A-Za-zА-Яа-я'’-]{1,24}\s*[-–—:|]/.test(line)).slice(0, 40);
  const body = pairs.length >= 4 ? pairs : [...lines.filter((line) => line.length < 90).slice(0, 16), ...extractSentences(text).slice(0, 8)];
  return body.join("\n").slice(0, maxChars);
}
  const words = text.match(/[A-Za-zА-Яа-яЎўҚқҒғҲҳʼ']{5,24}/g) || [];
  const stop = new Set(
    "because there their which while after before about would could should these those using given find solve chapter section example student teacher".split(
      " "
    )
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    const k = w.toLowerCase();
    if (stop.has(k) || seen.has(k)) continue;
    seen.add(k);
    out.push(w);
    if (out.length >= 24) break;
  }
  return out;
}

type Builder = (rng: () => number, locale: LocaleCode, material: string) => PrintQuestion;

function linearEquation(rng: () => number, locale: LocaleCode): PrintQuestion {
  const a = randInt(rng, 2, 9);
  const x = randInt(rng, -8, 12) || 3;
  const b = randInt(rng, 1, 18);
  const c = a * x + b;
  const prompt = t(locale, {
    en: `Solve for x: ${a}x + ${b} = ${c}`,
    uz: `x ni toping: ${a}x + ${b} = ${c}`,
    ru: `Найдите x: ${a}x + ${b} = ${c}`,
  });
  const distractors = [x + 1, x - 1, x + a, -x, c - b, Math.round(c / a)].filter((n, i, arr) => n !== x && arr.indexOf(n) === i);
  const options = shuffle(rng, [x, ...distractors.slice(0, 3)].map(String));
  return {
    id: "linear",
    skill: "Linear equation",
    kind: "mcq",
    prompt,
    options,
    answer: String(x),
    work: `${a}x = ${c} − ${b} = ${c - b}; x = ${x}`,
  };
}

function twoStep(rng: () => number, locale: LocaleCode): PrintQuestion {
  const a = randInt(rng, 2, 8);
  const x = randInt(rng, 2, 15);
  const b = randInt(rng, 2, 12);
  const c = a * x - b;
  const prompt = t(locale, {
    en: `Solve for x: ${a}x − ${b} = ${c}`,
    uz: `x ni toping: ${a}x − ${b} = ${c}`,
    ru: `Найдите x: ${a}x − ${b} = ${c}`,
  });
  return {
    id: "two-step",
    skill: "Two-step equation",
    kind: "short",
    prompt,
    answer: String(x),
    work: `${a}x = ${c + b}; x = ${x}`,
  };
}

function percentOf(rng: () => number, locale: LocaleCode): PrintQuestion {
  const p = pick(rng, [10, 15, 20, 25, 30, 40, 50]);
  const n = randInt(rng, 4, 24) * 10;
  const ans = (p * n) / 100;
  const prompt = t(locale, {
    en: `What is ${p}% of ${n}?`,
    uz: `${n} ning ${p}% i nechiga teng?`,
    ru: `Чему равны ${p}% от ${n}?`,
  });
  const distractors = [ans + n * 0.05, ans - p, (p * n) / 10, n - ans].map((v) => Math.round(v));
  const options = shuffle(rng, [ans, ...distractors.filter((d) => d !== ans)].slice(0, 4).map(String));
  return {
    id: "percent",
    skill: "Percent",
    kind: "mcq",
    prompt,
    options,
    answer: String(ans),
    work: `${p}/100 × ${n} = ${ans}`,
  };
}

function rectangleArea(rng: () => number, locale: LocaleCode): PrintQuestion {
  const l = randInt(rng, 6, 18);
  const w = randInt(rng, 3, 12);
  const ans = l * w;
  const prompt = t(locale, {
    en: `A rectangle is ${l} cm long and ${w} cm wide. What is its area?`,
    uz: `To‘g‘ri to‘rtburchak uzunligi ${l} cm, eni ${w} cm. Yuzini toping.`,
    ru: `Прямоугольник длиной ${l} см и шириной ${w} см. Найдите площадь.`,
  });
  const options = shuffle(rng, [ans, l + w, 2 * (l + w), l * w + w].map(String));
  return {
    id: "area",
    skill: "Area",
    kind: "mcq",
    prompt,
    options,
    answer: String(ans),
    work: `${l} × ${w} = ${ans}`,
  };
}

function fractionAdd(rng: () => number, locale: LocaleCode): PrintQuestion {
  const d = pick(rng, [6, 8, 10, 12]);
  const a = randInt(rng, 1, d - 2);
  const b = randInt(rng, 1, d - a);
  const g = gcd(a + b, d);
  const ans = `${(a + b) / g}/${d / g}`;
  const prompt = t(locale, {
    en: `Compute ${a}/${d} + ${b}/${d}. Write the answer in lowest terms.`,
    uz: `${a}/${d} + ${b}/${d} yig‘indisini qisqartirib yozing.`,
    ru: `Вычислите ${a}/${d} + ${b}/${d} и сократите дробь.`,
  });
  return {
    id: "fraction",
    skill: "Fractions",
    kind: "short",
    prompt,
    answer: ans,
    work: `${a + b}/${d} = ${ans}`,
  };
}

function proportion(rng: () => number, locale: LocaleCode): PrintQuestion {
  const a = randInt(rng, 2, 9);
  const b = randInt(rng, 2, 9);
  const k = randInt(rng, 2, 8);
  const c = a * k;
  const d = b * k;
  const prompt = t(locale, {
    en: `Find the missing number: ${a} / ${b} = ${c} / ?`,
    uz: `Teng nisbatdagi noma’lum sonni toping: ${a} / ${b} = ${c} / ?`,
    ru: `Найдите неизвестное: ${a} / ${b} = ${c} / ?`,
  });
  const options = shuffle(rng, [d, d + a, c, b * a].map(String));
  return {
    id: "proportion",
    skill: "Proportion",
    kind: "mcq",
    prompt,
    options,
    answer: String(d),
    work: `${a}/${b} = ${c}/${d}`,
  };
}

function integerQuadratic(rng: () => number, locale: LocaleCode): PrintQuestion {
  const r1 = randInt(rng, 1, 6);
  const r2 = randInt(rng, 1, 6);
  const b = -(r1 + r2);
  const c = r1 * r2;
  const bStr = b >= 0 ? `+ ${b}x` : `− ${-b}x`;
  const cStr = c >= 0 ? `+ ${c}` : `− ${-c}`;
  const prompt = t(locale, {
    en: `Find the roots of x² ${bStr} ${cStr} = 0`,
    uz: `x² ${bStr} ${cStr} = 0 tenglamaning ildizlarini toping`,
    ru: `Найдите корни уравнения x² ${bStr} ${cStr} = 0`,
  });
  const roots = [r1, r2].sort((x, y) => x - y).join(" and ");
  return {
    id: "quadratic",
    skill: "Quadratic roots",
    kind: "short",
    prompt,
    answer: roots,
    work: `(x − ${r1})(x − ${r2}) = 0`,
  };
}

function wordBuy(rng: () => number, locale: LocaleCode): PrintQuestion {
  const price = randInt(rng, 4, 18) * 1000;
  const qty = randInt(rng, 2, 7);
  const paid = price * qty + randInt(rng, 2, 9) * 1000;
  const change = paid - price * qty;
  const prompt = t(locale, {
    en: `One notebook costs ${price} so‘m. A student buys ${qty} notebooks and pays ${paid} so‘m. How much change should they receive?`,
    uz: `Bitta daftar ${price} so‘m. O‘quvchi ${qty} ta daftar olib, ${paid} so‘m berdi. Qaytim qancha?`,
    ru: `Одна тетрадь стоит ${price} сум. Ученик купил ${qty} тетрадей и дал ${paid} сум. Сколько сдачи?`,
  });
  const options = shuffle(rng, [change, paid - price, price * qty, change + 1000].map(String));
  return {
    id: "money",
    skill: "Word problem",
    kind: "mcq",
    prompt,
    options,
    answer: String(change),
    work: `${paid} − ${price}×${qty} = ${change}`,
  };
}

function evaluateExpression(rng: () => number, locale: LocaleCode): PrintQuestion {
  const a = randInt(rng, 2, 9);
  const b = randInt(rng, 3, 12);
  const c = randInt(rng, 2, 8);
  const ans = a * b + c;
  const prompt = t(locale, {
    en: `Evaluate: ${a} × ${b} + ${c}`,
    uz: `Hisoblang: ${a} × ${b} + ${c}`,
    ru: `Вычислите: ${a} × ${b} + ${c}`,
  });
  const options = shuffle(rng, [ans, a * (b + c), a + b + c, a * b - c].map(String));
  return {
    id: "order",
    skill: "Order of operations",
    kind: "mcq",
    prompt,
    options,
    answer: String(ans),
    work: `${a * b} + ${c} = ${ans}`,
  };
}

function materialBlank(rng: () => number, locale: LocaleCode, material: string): PrintQuestion | null {
  const terms = extractTerms(material);
  if (terms.length < 4) return null;
  const term = pick(rng, terms);
  const sentences = extractSentences(material).filter((s) => s.toLowerCase().includes(term.toLowerCase()));
  const sentence =
    sentences[0] ||
    t(locale, {
      en: `In this unit the key idea is connected to "${term}".`,
      uz: `Ushbu mavzuda asosiy tushuncha "${term}" bilan bog‘liq.`,
      ru: `В этой теме ключевая идея связана с «${term}».`,
    });
  const blanked = sentence.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "________");
  const distractors = shuffle(
    rng,
    terms.filter((x) => x.toLowerCase() !== term.toLowerCase())
  ).slice(0, 3);
  const options = shuffle(rng, [term, ...distractors]);
  return {
    id: "passage-blank",
    skill: "Source material",
    kind: "mcq",
    prompt: t(locale, {
      en: `From the uploaded material, complete the sentence:\n${blanked}`,
      uz: `Yuklangan materialga qarab jumlani to‘ldiring:\n${blanked}`,
      ru: `По загруженному материалу закончите предложение:\n${blanked}`,
    }),
    options,
    answer: term,
  };
}

function materialTrueFalse(rng: () => number, locale: LocaleCode, material: string): PrintQuestion | null {
  const sentences = extractSentences(material);
  if (!sentences.length) return null;
  const sentence = pick(rng, sentences);
  const flip = rng() > 0.55;
  const terms = extractTerms(material);
  let claim = sentence;
  if (flip && terms.length >= 2) {
    claim = sentence.replace(terms[0], terms[1]);
  }
  const answer = flip ? "False" : "True";
  const prompt = t(locale, {
    en: `True or false, based on the uploaded material:\n"${claim}"`,
    uz: `Yuklangan materialga ko‘ra, to‘g‘ri yoki noto‘g‘ri:\n"${claim}"`,
    ru: `Верно или неверно по загруженному материалу:\n«${claim}»`,
  });
  return {
    id: "passage-tf",
    skill: "Source material",
    kind: "mcq",
    prompt,
    options: locale === "uz" ? ["To‘g‘ri", "Noto‘g‘ri"] : locale === "ru" ? ["Верно", "Неверно"] : ["True", "False"],
    answer: locale === "uz" ? (flip ? "Noto‘g‘ri" : "To‘g‘ri") : locale === "ru" ? (flip ? "Неверно" : "Верно") : answer,
  };
}

function vocabPairs(text: string): Array<{ word: string; meaning: string }> {
  const entries: Array<{ word: string; meaning: string }> = [];
  const seen = new Set<string>();
  for (const line of text.split(/\n+/)) {
    const match = line.match(/^([A-Za-z][A-Za-z'’-]{2,24})\s*(?:[-–—:|]| means )\s+(.{4,160})$/);
    if (!match) continue;
    const key = match[1].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ word: match[1], meaning: match[2].trim() });
    if (entries.length >= 80) break;
  }
  return entries;
}

function vocabMeaning(rng: () => number, locale: LocaleCode, material: string): PrintQuestion | null {
  const pairs = vocabPairs(material);
  if (pairs.length < 4) return null;
  const item = pick(rng, pairs);
  const distractors = shuffle(rng, pairs.filter((pair) => pair.word !== item.word)).slice(0, 3);
  const options = shuffle(rng, [item.meaning, ...distractors.map((pair) => pair.meaning)]);
  return {
    id: "vocab-meaning",
    skill: "Vocabulary",
    kind: "mcq",
    prompt: t(locale, {
      en: `What does "${item.word}" mean?`,
      uz: `"${item.word}" so‘zi nimani anglatadi?`,
      ru: `Что означает «${item.word}»?`,
    }),
    options,
    answer: item.meaning,
  };
}

function vocabWord(rng: () => number, locale: LocaleCode, material: string): PrintQuestion | null {
  const pairs = vocabPairs(material);
  if (pairs.length < 4) return null;
  const item = pick(rng, pairs);
  const distractors = shuffle(rng, pairs.filter((pair) => pair.word !== item.word)).slice(0, 3);
  const options = shuffle(rng, [item.word, ...distractors.map((pair) => pair.word)]);
  return {
    id: "vocab-word",
    skill: "Vocabulary",
    kind: "mcq",
    prompt: t(locale, {
      en: `Which word means: ${item.meaning}`,
      uz: `Qaysi so‘z shu ma’noni bildiradi: ${item.meaning}`,
      ru: `Какое слово означает: ${item.meaning}`,
    }),
    options,
    answer: item.word,
  };
}

function wantsLanguage(subject: string, title: string, material: string): boolean {
  return /english|vocab|vocabulary|sat|language|so‘z|soz|lexic/i.test(`${subject} ${title}`) || vocabPairs(material).length >= 4;
}
  (rng, locale) => linearEquation(rng, locale),
  (rng, locale) => twoStep(rng, locale),
  (rng, locale) => percentOf(rng, locale),
  (rng, locale) => rectangleArea(rng, locale),
  (rng, locale) => fractionAdd(rng, locale),
  (rng, locale) => proportion(rng, locale),
  (rng, locale) => integerQuadratic(rng, locale),
  (rng, locale) => wordBuy(rng, locale),
  (rng, locale) => evaluateExpression(rng, locale),
];

export function generatePrintPack(input: GenerateInput): PrintPack {
  const studentCount = Math.max(1, Math.min(40, Math.floor(input.studentCount || 1)));
  const questionCount = Math.max(3, Math.min(35, Math.floor(input.questionCount || 5)));
  const locale: LocaleCode = input.locale === "uz" || input.locale === "ru" ? input.locale : "en";
  const material = readableMaterial(input.materialText || "");
  const title = (input.title || "").trim() || t(locale, {
    en: "Class test",
    uz: "Sinf testi",
    ru: "Классная работа",
  });
  const packId = `pt_${hashSeed(`${title}:${Date.now()}:${studentCount}:${questionCount}`).toString(36)}`;

  const languageTest = wantsLanguage(input.subject || "", title, material);
  const bank = (input.bank || []).filter((item) => item.prompt && item.answer && item.options.length >= 2);
  const builders: Builder[] = bank.length
    ? bank.map((item) => (rng) => ({
        id: "ai",
        skill: item.skill || "Source material",
        kind: "mcq" as const,
        prompt: item.prompt,
        options: shuffle(rng, item.options).slice(0, 4),
        answer: item.answer,
      }))
    : languageTest
      ? [
          (rng, loc, mat) => vocabMeaning(rng, loc, mat) || materialBlank(rng, loc, mat) || linearEquation(rng, loc),
          (rng, loc, mat) => vocabWord(rng, loc, mat) || materialTrueFalse(rng, loc, mat) || percentOf(rng, loc),
          (rng, loc, mat) => materialBlank(rng, loc, mat) || vocabMeaning(rng, loc, mat) || linearEquation(rng, loc),
        ]
      : MATH_BUILDERS.slice();
  if (!bank.length && !languageTest && material.length >= 80) {
    builders.unshift((rng, loc, mat) => materialBlank(rng, loc, mat) || linearEquation(rng, loc));
    builders.unshift((rng, loc, mat) => materialTrueFalse(rng, loc, mat) || percentOf(rng, loc));
  }

  const skillOrder = builders.slice(0, Math.max(questionCount, builders.length));
  const names = (input.studentNames || []).map((n) => n.trim()).filter(Boolean);
  const sheets: StudentSheet[] = [];

  for (let i = 0; i < studentCount; i++) {
    const rng = mulberry32(hashSeed(`${packId}:s${i}`));
    const questions: PrintQuestion[] = [];
    for (let q = 0; q < questionCount; q++) {
      const builder = skillOrder[q % skillOrder.length];
      const item = builder(rng, locale, material);
      questions.push({
        ...item,
        id: `${item.id}-${q + 1}`,
      });
    }
    const name =
      names[i] ||
      t(locale, {
        en: `Student ${i + 1}`,
        uz: `${i + 1}-o‘quvchi`,
        ru: `Ученик ${i + 1}`,
      });
    sheets.push({
      index: i + 1,
      code: versionCode(packId, i),
      studentName: name,
      questions,
    });
  }

  return {
    id: packId,
    title,
    subject: (input.subject || "").trim() || "General",
    grade: (input.grade || "").trim() || "",
    locale,
    questionCount,
    studentCount,
    createdAt: new Date().toISOString(),
    sourceName: input.sourceName || (material ? "Uploaded material" : "Built-in item bank"),
    skills: Array.from(new Set(sheets[0]?.questions.map((q) => q.skill) || [])),
    sheets,
    key: sheets.map((s) => ({
      code: s.code,
      studentName: s.studentName,
      answers: s.questions.map((q) => q.answer),
    })),
  };
}

export function buildPrintHtml(pack: PrintPack, mode: "students" | "key"): string {
  const header = `
    <style>
      @page { size: A4; margin: 14mm; }
      body { font-family: Georgia, "Times New Roman", serif; color: #111; }
      h1 { font-size: 18px; margin: 0 0 4px; }
      .meta { font-size: 12px; color: #333; margin-bottom: 10px; }
      .sheet { page-break-after: always; }
      .sheet:last-child { page-break-after: auto; }
      .top { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 12px; }
      .q { margin: 0 0 14px; }
      .q .p { white-space: pre-wrap; font-size: 14px; }
      .opts { margin: 6px 0 0 18px; }
      .line { border-bottom: 1px solid #999; height: 22px; margin-top: 6px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
      .brand { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
    </style>
  `;

  if (mode === "key") {
    const rows = pack.key
      .map((row) => {
        const cells = row.answers.map((a, i) => `<td>${i + 1}. ${escapeHtml(a)}</td>`).join("");
        return `<tr><td><b>${escapeHtml(row.code)}</b><br/>${escapeHtml(row.studentName)}</td>${cells}</tr>`;
      })
      .join("");
    return `<!doctype html><html><head><title>${escapeHtml(pack.title)} — key</title>${header}</head><body>
      <h1>${escapeHtml(pack.title)} — teacher answer key</h1>
      <div class="meta">${escapeHtml(pack.subject)} ${escapeHtml(pack.grade)} · ${pack.studentCount} versions · do not hand this page to students</div>
      <table><thead><tr><th>Version</th>${pack.sheets[0]?.questions.map((_, i) => `<th>Q${i + 1}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody></table>
      <p class="meta">Worked notes appear on each student preview in the teacher dashboard only.</p>
    </body></html>`;
  }

  const pages = pack.sheets
    .map((sheet) => {
      const qs = sheet.questions
        .map((q, i) => {
          const opts = q.options
            ? `<div class="opts">${q.options
                .map((o, idx) => `${String.fromCharCode(65 + idx)}) ${escapeHtml(o)}`)
                .join("<br/>")}</div>`
            : `<div class="line"></div><div class="line"></div>`;
          return `<div class="q"><div class="p"><b>${i + 1}.</b> ${escapeHtml(q.prompt)}</div>${opts}</div>`;
        })
        .join("");
      return `<section class="sheet">
        <div class="top">
          <div>
            <div class="brand">EduBek print test</div>
            <h1>${escapeHtml(pack.title)}</h1>
            <div class="meta">${escapeHtml(pack.subject)}${pack.grade ? " · " + escapeHtml(pack.grade) : ""}</div>
          </div>
          <div class="meta">
            Name: <b>${escapeHtml(sheet.studentName)}</b><br/>
            Version: <b>${escapeHtml(sheet.code)}</b><br/>
            Date: ______________
          </div>
        </div>
        ${qs}
        <div class="meta">Show your work. Do not copy another version — numbers are different on purpose.</div>
      </section>`;
    })
    .join("");

  return `<!doctype html><html><head><title>${escapeHtml(pack.title)}</title>${header}</head><body>${pages}</body></html>`;
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
