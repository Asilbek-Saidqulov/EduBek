/**
 * Add engineering i18n keys to en/uz/ru messages.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const KEYS = {
  en: {
    title: "Engineering Readiness",
    description: "Build optimization, repository structure, bundle analysis, dependency hygiene, and developer experience.",
    build: {
      title: "TypeScript Build Optimizer",
      incremental: "Incremental builds: {enabled}",
      projectRefs: "Project references: {count}",
      largeModules: "{count} large module(s) detected (>500 lines)",
      circular: "{count} circular type dependency cycle(s)",
      memory: "Estimated compiler memory: {value}MB",
    },
    repository: {
      title: "Repository Structure",
      depth: "Max folder depth: {value}",
      features: "{count} feature modules",
      crossImports: "{count} cross-feature imports",
      violations: "{count} structure violation(s)",
    },
    bundle: {
      title: "Bundle Analyzer",
      size: "Estimated bundle size: {value}KB",
      largest: "Largest module: {name} ({value}KB)",
      duplicates: "{count} duplicate package(s)",
      lazyCandidates: "{count} lazy-loading candidate(s)",
    },
    dependencies: {
      title: "Dependency Hygiene",
      total: "Total packages: {count}",
      unused: "{count} unused package(s)",
      heavy: "{count} heavy dependency/dependencies",
      security: "{count} security update(s) available",
    },
    tests: {
      title: "Test Infrastructure",
      total: "Total tests: {count}",
      slow: "{count} slow test(s)",
      gaps: "{count} coverage gap(s)",
      duplicates: "{count} duplicate test(s)",
    },
    ci: {
      title: "CI/CD Readiness",
      lint: "Lint: {status}",
      tests: "Tests: {status}",
      build: "Build: {status}",
      migration: "Migration safety: {status}",
      rollback: "Rollback readiness: {status}",
      duration: "Pipeline duration: ~{value}min",
    },
    config: {
      title: "Configuration Analyzer",
      tsconfig: "tsconfig: {count} issue(s)",
      eslint: "ESLint: {count} issue(s)",
      envVars: "{count} undocumented env var(s)",
      flags: "{count} feature flag(s)",
    },
    documentation: {
      title: "Documentation Coverage",
      score: "Documentation score: {value}/100",
      apiDocs: "API docs: {value}%",
      moduleDocs: "Module docs: {value}%",
      missing: "{count} missing example(s)",
    },
    debt: {
      title: "Technical Debt",
      todos: "{count} TODO(s)",
      fixmes: "{count} FIXME(s)",
      deprecated: "{count} deprecated API(s)",
      complex: "{count} high-complexity function(s)",
      longFiles: "{count} long file(s)",
      backlog: "{count} prioritized debt item(s)",
    },
    readiness: {
      title: "Engineering Readiness Dashboard",
      overall: "Overall: {value}/100 (grade {grade})",
      strengths: "Top strengths: {count}",
      weaknesses: "Top weaknesses: {count}",
      actions: "{count} priority action(s)",
    },
  },
  uz: {
    title: "Muhandislik tayyorgarligi",
    description: "Build optimallashtirish, repo tuzilmasi, bundle tahlili, bog'liqlik gigiyenasi va dasturchi tajribasi.",
    build: {
      title: "TypeScript Build Optimizatori",
      incremental: "Inkremental buildlar: {enabled}",
      projectRefs: "Project reference'lar: {count}",
      largeModules: "{count} katta modul aniqlandi (>500 qator)",
      circular: "{count} tsiklik type bog'liqligi",
      memory: "Taxminiy kompilyator xotirasi: {value}MB",
    },
    repository: {
      title: "Repo tuzilmasi",
      depth: "Maksimal papka chuqurligi: {value}",
      features: "{count} feature modul",
      crossImports: "{count} cross-feature import",
      violations: "{count} tuzilma buzilishi",
    },
    bundle: {
      title: "Bundle tahlili",
      size: "Taxminiy bundle hajmi: {value}KB",
      largest: "Eng katta modul: {name} ({value}KB)",
      duplicates: "{count} takroriy paket",
      lazyCandidates: "{count} lazy-loading nomzodi",
    },
    dependencies: {
      title: "Bog'liqlik gigiyenasi",
      total: "Jami paketlar: {count}",
      unused: "{count} ishlatilmagan paket",
      heavy: "{count} og'ir bog'liqlik",
      security: "{count} xavfsizlik yangilanishi mavjud",
    },
    tests: {
      title: "Test infratuzilmasi",
      total: "Jami testlar: {count}",
      slow: "{count} sekin test",
      gaps: "{count} qoplam bo'shlig'i",
      duplicates: "{count} takroriy test",
    },
    ci: {
      title: "CI/CD tayyorgarligi",
      lint: "Lint: {status}",
      tests: "Testlar: {status}",
      build: "Build: {status}",
      migration: "Migratsiya xavfsizligi: {status}",
      rollback: "Rollback tayyorgarligi: {status}",
      duration: "Pipeline davomiyligi: ~{value}daq",
    },
    config: {
      title: "Konfiguratsiya tahlili",
      tsconfig: "tsconfig: {count} muammo",
      eslint: "ESLint: {count} muammo",
      envVars: "{count} hujjatsiz env o'zgaruvchi",
      flags: "{count} feature flag",
    },
    documentation: {
      title: "Hujjat qoplamasi",
      score: "Hujjat balli: {value}/100",
      apiDocs: "API hujjatlari: {value}%",
      moduleDocs: "Modul hujjatlari: {value}%",
      missing: "{count} yetishmayotgan misol",
    },
    debt: {
      title: "Texnik qarz",
      todos: "{count} TODO",
      fixmes: "{count} FIXME",
      deprecated: "{count} eskirgan API",
      complex: "{count} yuqori murakkablikdagi funksiya",
      longFiles: "{count} uzun fayl",
      backlog: "{count} ustuvor qarz elementi",
    },
    readiness: {
      title: "Muhandislik tayyorgarligi",
      overall: "Umumiy: {value}/100 (daraja {grade})",
      strengths: "Eng katta kuchli tomonlar: {count}",
      weaknesses: "Eng katta zaif tomonlar: {count}",
      actions: "{count} ustuvor harakat",
    },
  },
  ru: {
    title: "Инженерная готовность",
    description: "Оптимизация сборки, структура репозитория, анализ bundle, гигиена зависимостей и опыт разработчика.",
    build: {
      title: "Оптимизатор сборки TypeScript",
      incremental: "Инкрементальные сборки: {enabled}",
      projectRefs: "Project references: {count}",
      largeModules: "Обнаружено {count} больших модулей (>500 строк)",
      circular: "{count} циклических type-зависимостей",
      memory: "Оценка памяти компилятора: {value}МБ",
    },
    repository: {
      title: "Структура репозитория",
      depth: "Максимальная глубина папок: {value}",
      features: "{count} модулей функций",
      crossImports: "{count} cross-feature импортов",
      violations: "{count} нарушений структуры",
    },
    bundle: {
      title: "Анализ bundle",
      size: "Оценочный размер bundle: {value}КБ",
      largest: "Крупнейший модуль: {name} ({value}КБ)",
      duplicates: "{count} дубликатов пакетов",
      lazyCandidates: "{count} кандидатов на lazy-loading",
    },
    dependencies: {
      title: "Гигиена зависимостей",
      total: "Всего пакетов: {count}",
      unused: "{count} неиспользуемых пакетов",
      heavy: "{count} тяжёлых зависимостей",
      security: "{count} доступных обновлений безопасности",
    },
    tests: {
      title: "Тестовая инфраструктура",
      total: "Всего тестов: {count}",
      slow: "{count} медленных тестов",
      gaps: "{count} пробелов в покрытии",
      duplicates: "{count} дубликатов тестов",
    },
    ci: {
      title: "Готовность CI/CD",
      lint: "Lint: {status}",
      tests: "Тесты: {status}",
      build: "Сборка: {status}",
      migration: "Безопасность миграций: {status}",
      rollback: "Готовность к откату: {status}",
      duration: "Длительность pipeline: ~{value}мин",
    },
    config: {
      title: "Анализ конфигурации",
      tsconfig: "tsconfig: {count} проблем",
      eslint: "ESLint: {count} проблем",
      envVars: "{count} недокументированных env переменных",
      flags: "{count} feature flags",
    },
    documentation: {
      title: "Покрытие документации",
      score: "Оценка документации: {value}/100",
      apiDocs: "API документация: {value}%",
      moduleDocs: "Документация модулей: {value}%",
      missing: "{count} недостающих примеров",
    },
    debt: {
      title: "Технический долг",
      todos: "{count} TODO",
      fixmes: "{count} FIXME",
      deprecated: "{count} устаревших API",
      complex: "{count} функций с высокой сложностью",
      longFiles: "{count} длинных файлов",
      backlog: "{count} приоритетных элементов долга",
    },
    readiness: {
      title: "Инженерная готовность",
      overall: "Итого: {value}/100 (оценка {grade})",
      strengths: "Главные сильные стороны: {count}",
      weaknesses: "Главные слабые стороны: {count}",
      actions: "{count} приоритетных действий",
    },
  },
} as const;

for (const locale of ["en", "uz", "ru"] as const) {
  const filePath = join(ROOT, "messages", `${locale}.json`);
  const content = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  content.engineering = KEYS[locale];
  writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf-8");
  console.log(`Added engineering keys to ${locale}.json`);
}
