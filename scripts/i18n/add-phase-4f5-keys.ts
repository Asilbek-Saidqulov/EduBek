/**
 * Add Phase 4F.5 — Knowledge Intelligence i18n keys to en/uz/ru catalogs.
 */
import * as fs from "node:fs";
import * as path from "node:path";

const MESSAGES_DIR = "/home/z/my-project/messages";

type Catalog = Record<string, any>;
function loadCatalog(locale: string): Catalog {
  return JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf-8"));
}
function saveCatalog(locale: string, catalog: Catalog): void {
  fs.writeFileSync(
    path.join(MESSAGES_DIR, `${locale}.json`),
    JSON.stringify(catalog, null, 2) + "\n",
    "utf-8",
  );
}

const TRANSLATIONS: Record<string, Record<string, any>> = {
  en: {
    knowledge: {
      concept: {
        extracted: "Concepts extracted from resource",
        created: "Concept created",
        notFound: "Concept not found",
      },
      curriculum: {
        mapped: "Resource mapped to curriculum standards",
        mappingCreated: "Curriculum mapping created",
        noAlignment: "No curriculum alignment found",
        frameworkSeeded: "Curriculum framework seeded",
        frameworkCreated: "Custom curriculum framework created",
        standardCreated: "Curriculum standard created",
      },
      coverage: {
        computed: "Coverage analysis computed",
        fullCoverage: "Excellent coverage",
        partialCoverage: "Partial coverage",
        noCoverage: "No coverage data available",
        uncovered: "Uncovered standard",
        duplicate: "Duplicate lesson detected",
      },
      gap: {
        created: "Knowledge gap identified",
        resolved: "Knowledge gap resolved",
        ignored: "Knowledge gap ignored",
        missingPrerequisite: "Missing prerequisite",
        weakCoverage: "Weak concept coverage",
        noAssessment: "No assessment for standard",
      },
      prediction: {
        computed: "Learning prediction computed",
        interventionNeeded: "Intervention recommended",
        noIntervention: "No intervention needed",
      },
      quality: {
        analyzed: "Resource quality analyzed",
        highQuality: "High-quality resource",
        needsImprovement: "Resource needs improvement",
      },
      similarity: {
        duplicatesFound: "Duplicates found",
        noDuplicates: "No duplicates detected",
        clusterCreated: "Similarity cluster created",
        scanCompleted: "Duplicate scan completed",
      },
      relationship: {
        autoLinked: "Auto-linked to knowledge graph",
        edgeCreated: "Graph edge created",
      },
      assistant: {
        coverageFull: "Excellent coverage — keep up the good work!",
        coveragePartial: "Partial coverage — see uncovered standards below.",
        noGaps: "No knowledge gaps detected.",
        gapsFound: "Knowledge gaps found — see evidence below.",
        noPrerequisites: "No prerequisites discovered yet.",
        prerequisitesFound: "Prerequisites identified.",
        noGenerateNeeded: "All standards covered — no new lessons needed.",
        generateReady: "Ready to generate lessons for uncovered standards.",
        noDuplicates: "No duplicate lessons detected.",
        duplicatesFound: "Duplicate lessons found — consider merging.",
        fallback: "I can help with coverage questions, gap analysis, prerequisite discovery, lesson generation, and duplicate detection.",
        noFramework: "Please specify a curriculum framework.",
        noConceptMentioned: "Please mention a specific concept or topic.",
      },
      health: {
        computed: "Knowledge health snapshot computed",
        highScore: "Strong knowledge health",
        lowScore: "Knowledge health needs attention",
      },
      bloom: {
        remember: "Remember",
        understand: "Understand",
        apply: "Apply",
        analyze: "Analyze",
        evaluate: "Evaluate",
        create: "Create",
      },
      framework: {
        uzbekistan: "Uzbekistan National Curriculum",
        cambridge: "Cambridge International Curriculum",
        ib: "International Baccalaureate",
        ap: "Advanced Placement",
        sat: "SAT",
        gcse: "GCSE",
        custom: "Custom Curriculum",
      },
    },
  },
  uz: {
    knowledge: {
      concept: {
        extracted: "Resursdan tushunchalar ajratib olindi",
        created: "Tushuncha yaratildi",
        notFound: "Tushuncha topilmadi",
      },
      curriculum: {
        mapped: "Resurs o'quv reja standartlariga moslashtirildi",
        mappingCreated: "O'quv reja moslashuvi yaratildi",
        noAlignment: "O'quv reja moslashuvi topilmadi",
        frameworkSeeded: "O'quv reja frameworki qo'shildi",
        frameworkCreated: "Maxsus o'quv reja frameworki yaratildi",
        standardCreated: "O'quv reja standarti yaratildi",
      },
      coverage: {
        computed: "Qoplash tahlili hisoblandi",
        fullCoverage: "Ajoyib qoplash",
        partialCoverage: "Qisman qoplash",
        noCoverage: "Qoplash ma'lumotlari mavjud emas",
        uncovered: "Qoplanmagan standart",
        duplicate: "Takroriy dars aniqlandi",
      },
      gap: {
        created: "Bilim bo'shlig'i aniqlandi",
        resolved: "Bilim bo'shlig'i hal qilindi",
        ignored: "Bilim bo'shlig'i e'tiborsiz qoldirildi",
        missingPrerequisite: "Oldindan talab yetishmayapti",
        weakCoverage: "Zaif tushuncha qoplashi",
        noAssessment: "Standart uchun baholash yo'q",
      },
      prediction: {
        computed: "O'rganish prognozi hisoblandi",
        interventionNeeded: "Aralash tavsiya etiladi",
        noIntervention: "Aralash kerak emas",
      },
      quality: {
        analyzed: "Resurs sifati tahlil qilindi",
        highQuality: "Yuqori sifatli resurs",
        needsImprovement: "Resurs yaxshilanishi kerak",
      },
      similarity: {
        duplicatesFound: "Takroriy nusxalar topildi",
        noDuplicates: "Takroriy nusxalar aniqlanmadi",
        clusterCreated: "O'xshashlik klasteri yaratildi",
        scanCompleted: "Takroriy nusxalar skanerlashi yakunlandi",
      },
      relationship: {
        autoLinked: "Bilim grafiga avtomatik bog'landi",
        edgeCreated: "Graf chizig'i yaratildi",
      },
      assistant: {
        coverageFull: "Ajoyib qoplash — ishni shunday davom ettiring!",
        coveragePartial: "Qisman qoplash — qoplanmagan standartlarni ko'ring.",
        noGaps: "Bilim bo'shliqlari aniqlanmadi.",
        gapsFound: "Bilim bo'shliqlari topildi — dalillarni ko'ring.",
        noPrerequisites: "Hozircha oldindan talablar aniqlanmadi.",
        prerequisitesFound: "Oldindan talablar aniqlandi.",
        noGenerateNeeded: "Barcha standartlar qoplangan — yangi darslar kerak emas.",
        generateReady: "Qoplanmagan standartlar uchun darslarni yaratishga tayyor.",
        noDuplicates: "Takroriy darslar aniqlanmadi.",
        duplicatesFound: "Takroriy darslar topildi — birlashtirishni o'ylab ko'ring.",
        fallback: "Men qoplash savollari, bo'shliq tahlili, oldindan talablarni topish, dars yaratish va takroriy nusxalarni aniqlashda yordam bera olaman.",
        noFramework: "Iltimos, o'quv reja frameworkini ko'rsating.",
        noConceptMentioned: "Iltimos, aniq tushuncha yoki mavzuni tilga oling.",
      },
      health: {
        computed: "Bilim salomatligi snapshoti hisoblandi",
        highScore: "Kuchli bilim salomatligi",
        lowScore: "Bilim salomatligi e'tibor talab qiladi",
      },
      bloom: {
        remember: "Eslab qolish",
        understand: "Tushunish",
        apply: "Qo'llash",
        analyze: "Tahlil qilish",
        evaluate: "Baholash",
        create: "Yaratish",
      },
      framework: {
        uzbekistan: "O'zbekiston Milliy O'quv Rejasi",
        cambridge: "Cambridge Xalqaro O'quv Rejasi",
        ib: "Xalqaro Bakalavriat",
        ap: "Advanced Placement",
        sat: "SAT",
        gcse: "GCSE",
        custom: "Maxsus O'quv Reja",
      },
    },
  },
  ru: {
    knowledge: {
      concept: {
        extracted: "Концепции извлечены из ресурса",
        created: "Концепция создана",
        notFound: "Концепция не найдена",
      },
      curriculum: {
        mapped: "Ресурс сопоставлен со стандартами учебной программы",
        mappingCreated: "Сопоставление создано",
        noAlignment: "Сопоставление не найдено",
        frameworkSeeded: "Фреймворк учебной программы добавлен",
        frameworkCreated: "Создан кастомный фреймворк",
        standardCreated: "Стандарт учебной программы создан",
      },
      coverage: {
        computed: "Анализ покрытия выполнен",
        fullCoverage: "Отличное покрытие",
        partialCoverage: "Частичное покрытие",
        noCoverage: "Данные о покрытии отсутствуют",
        uncovered: "Непокрытый стандарт",
        duplicate: "Обнаружен дублирующий урок",
      },
      gap: {
        created: "Обнаружен пробел в знаниях",
        resolved: "Пробел в знаниях устранён",
        ignored: "Пробел в знаниях проигнорирован",
        missingPrerequisite: "Отсутствует предварительное требование",
        weakCoverage: "Слабое покрытие концепции",
        noAssessment: "Нет оценки для стандарта",
      },
      prediction: {
        computed: "Прогноз обучения вычислен",
        interventionNeeded: "Рекомендуется интервенция",
        noIntervention: "Интервенция не требуется",
      },
      quality: {
        analyzed: "Качество ресурса проанализировано",
        highQuality: "Высококачественный ресурс",
        needsImprovement: "Ресурс требует улучшения",
      },
      similarity: {
        duplicatesFound: "Найдены дубликаты",
        noDuplicates: "Дубликаты не обнаружены",
        clusterCreated: "Кластер сходства создан",
        scanCompleted: "Сканирование дубликатов завершено",
      },
      relationship: {
        autoLinked: "Автоматически связан с графом знаний",
        edgeCreated: "Ребро графа создано",
      },
      assistant: {
        coverageFull: "Отличное покрытие — продолжайте в том же духе!",
        coveragePartial: "Частичное покрытие — см. непокрытые стандарты ниже.",
        noGaps: "Пробелы в знаниях не обнаружены.",
        gapsFound: "Найдены пробелы в знаниях — см. доказательства ниже.",
        noPrerequisites: "Предварительные требования пока не обнаружены.",
        prerequisitesFound: "Предварительные требования определены.",
        noGenerateNeeded: "Все стандарты покрыты — новые уроки не нужны.",
        generateReady: "Готовы генерировать уроки для непокрытых стандартов.",
        noDuplicates: "Дублирующие уроки не обнаружены.",
        duplicatesFound: "Найдены дубликаты — рассмотрите объединение.",
        fallback: "Я могу помочь с вопросами о покрытии, анализом пробелов, обнаружением предварительных требований, генерацией уроков и поиском дубликатов.",
        noFramework: "Укажите фреймворк учебной программы.",
        noConceptMentioned: "Укажите конкретную концепцию или тему.",
      },
      health: {
        computed: "Снимок здоровья знаний вычислен",
        highScore: "Сильное здоровье знаний",
        lowScore: "Здоровье знаний требует внимания",
      },
      bloom: {
        remember: "Запоминание",
        understand: "Понимание",
        apply: "Применение",
        analyze: "Анализ",
        evaluate: "Оценка",
        create: "Создание",
      },
      framework: {
        uzbekistan: "Национальная программа Узбекистана",
        cambridge: "Международная программа Cambridge",
        ib: "Международный бакалавриат",
        ap: "Advanced Placement",
        sat: "SAT",
        gcse: "GCSE",
        custom: "Кастомная программа",
      },
    },
  },
};

const locales = ["en", "uz", "ru"];
for (const locale of locales) {
  const catalog = loadCatalog(locale);
  const newKeys = TRANSLATIONS[locale]!;
  for (const [topKey, value] of Object.entries(newKeys)) {
    catalog[topKey] = { ...(catalog[topKey] ?? {}), ...value };
  }
  saveCatalog(locale, catalog);
  console.log(`✓ Updated ${locale}.json`);
}
console.log("\nAll locale catalogs updated.");
