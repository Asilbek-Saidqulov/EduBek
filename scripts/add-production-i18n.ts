/**
 * Add production i18n keys to en/uz/ru messages.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const KEYS = {
  en: {
    title: "Production Hardening",
    description: "Performance audit, database optimization, cache audit, and production readiness scoring.",
    performance: {
      title: "Performance Audit",
      slowEndpoints: "{count} slow endpoint(s) detected (p95 > 500ms)",
      slowQueries: "{count} slow query pattern(s) detected (p95 > 100ms)",
      nPlusOne: "{count} N+1 query pattern(s) detected",
      eventLoopLag: "Event loop lag: {value}ms",
      queueLatency: "Queue {queue} p95 latency: {value}ms",
    },
    database: {
      title: "Database Optimization",
      missingIndexes: "{count} model(s) need indexes",
      missingPagination: "{count} model(s) lack pagination",
      largePayloads: "{count} query pattern(s) return large payloads",
      duplicatedQueries: "{count} duplicated query pattern(s) detected",
    },
    cache: {
      title: "Cache Optimization",
      hitRate: "Cache hit rate: {value}%",
      candidates: "{count} cache candidate(s) identified",
      ttlAdjustments: "{count} namespace(s) need TTL adjustments",
      warmupRecommended: "Warmup recommended for {count} namespace(s)",
    },
    api: {
      title: "API Performance",
      slowest: "Slowest endpoint: {route} (p95={value}ms)",
      avgBreakdown: "Average: validation={val}ms, db={db}ms, ai={ai}ms, serialization={ser}ms",
    },
    jobs: {
      title: "Background Job Analyzer",
      bottlenecks: "{count} slow job(s) detected (>30s)",
      retryRate: "Average retry count: {value}",
      deadLetter: "{count} job(s) in dead-letter queue",
      queueDepth: "Queue {queue} depth: {value}",
    },
    resources: {
      title: "Resource Usage",
      ram: "RAM: {percent}% ({status})",
      cpu: "CPU: {percent}% ({status})",
      aiCredits: "AI credits: {percent}% of budget ({status})",
      dbConnections: "DB connections: {current}/{max} ({status})",
      workers: "Workers: {active}/{total} active ({status})",
    },
    dependencies: {
      title: "Dependency Analysis",
      circular: "{count} circular dependency cycle(s) detected",
      deepChains: "{count} deep dependency chain(s) found",
      highCoupling: "{count} highly-coupled module(s)",
      unused: "{count} unused service(s)",
      dead: "{count} dead module(s)",
      duplicates: "{count} duplicate utility function(s)",
    },
    startup: {
      title: "Startup Analysis",
      total: "Total startup: {value}ms",
      slowest: "Slowest phase: {phase} ({value}ms)",
    },
    reliability: {
      title: "Reliability Analysis",
      retryCoverage: "Retry policy coverage: {value}%",
      breakerCoverage: "Circuit breaker coverage: {value}%",
      idempotencyCoverage: "Idempotency coverage: {value}%",
      recoveryRate: "Error recovery rate: {value}%",
      missingProtections: "{count} missing protection(s) identified",
    },
    readiness: {
      title: "Production Readiness Score",
      overall: "Overall score: {value}/100 (grade {grade})",
      dimensions: "{count} dimensions scored",
      strengths: "Top strengths: {count}",
      weaknesses: "Top weaknesses: {count}",
      priorityRecs: "{count} priority recommendation(s)",
    },
  },
  uz: {
    title: "Ishlab chiqarishni mustahkamlash",
    description: "Audit, ma'lumotlar bazasini optimallashtirish, kesh audit va ishlab chiqarishga tayyorlikni baholash.",
    performance: {
      title: "Audit",
      slowEndpoints: "{count} sekin endpoint aniqlandi (p95 > 500ms)",
      slowQueries: "{count} sekin so'rov aniqlandi (p95 > 100ms)",
      nPlusOne: "{count} N+1 so'rov aniqlandi",
      eventLoopLag: "Event loop kechikishi: {value}ms",
      queueLatency: "Navbat {queue} p95 kechikish: {value}ms",
    },
    database: {
      title: "Ma'lumotlar bazasini optimallashtirish",
      missingIndexes: "{count} modelga indeks kerak",
      missingPagination: "{count} modelda pagination yo'q",
      largePayloads: "{count} so'rov katta payload qaytaradi",
      duplicatedQueries: "{count} takroriy so'rov aniqlandi",
    },
    cache: {
      title: "Kesh optimallashtirish",
      hitRate: "Kesh hit rate: {value}%",
      candidates: "{count} kesh nomzodi aniqlandi",
      ttlAdjustments: "{count} namespace uchun TTL sozlash kerak",
      warmupRecommended: "{count} namespace uchun warmup tavsiya etiladi",
    },
    api: {
      title: "API",
      slowest: "Eng sekin endpoint: {route} (p95={value}ms)",
      avgBreakdown: "O'rtacha: validation={val}ms, db={db}ms, ai={ai}ms, serialization={ser}ms",
    },
    jobs: {
      title: "Fon vazifalari",
      bottlenecks: "{count} sekin vazifa aniqlandi (>30s)",
      retryRate: "O'rtacha retry soni: {value}",
      deadLetter: "{count} vazifa dead-letter navbatida",
      queueDepth: "Navbat {queue} chuqurligi: {value}",
    },
    resources: {
      title: "Resurs foydalanishi",
      ram: "RAM: {percent}% ({status})",
      cpu: "CPU: {percent}% ({status})",
      aiCredits: "AI kreditlari: byudjetning {percent}% ({status})",
      dbConnections: "DB ulanishlari: {current}/{max} ({status})",
      workers: "Workerlar: {active}/{total} faol ({status})",
    },
    dependencies: {
      title: "Bog'liqlik tahlili",
      circular: "{count} tsiklik bog'liqlik aniqlandi",
      deepChains: "{count} chuqur bog'liqlik zanjiri topildi",
      highCoupling: "{count} yuqori bog'langan modul",
      unused: "{count} ishlatilmagan xizmat",
      dead: "{count} o'lik modul",
      duplicates: "{count} takroriy utility funksiya",
    },
    startup: {
      title: "Ishga tushirish tahlili",
      total: "Jami ishga tushish: {value}ms",
      slowest: "Eng sekin bosqich: {phase} ({value}ms)",
    },
    reliability: {
      title: "Ishonchlilik tahlili",
      retryCoverage: "Retry qoplamasi: {value}%",
      breakerCoverage: "Circuit breaker qoplamasi: {value}%",
      idempotencyCoverage: "Idempotency qoplamasi: {value}%",
      recoveryRate: "Xato tiklash darajasi: {value}%",
      missingProtections: "{count} himoya etishmasligi aniqlandi",
    },
    readiness: {
      title: "Ishlab chiqarishga tayyorlik balli",
      overall: "Umumiy ball: {value}/100 (daraja {grade})",
      dimensions: "{count} o'lchov baholandi",
      strengths: "Eng katta kuchli tomonlar: {count}",
      weaknesses: "Eng katta zaif tomonlar: {count}",
      priorityRecs: "{count} ustuvor tavsiya",
    },
  },
  ru: {
    title: "Укрепление продакшена",
    description: "Аудит производительности, оптимизация БД, аудит кэша и оценка готовности к продакшену.",
    performance: {
      title: "Аудит производительности",
      slowEndpoints: "Обнаружено {count} медленных endpoint'ов (p95 > 500мс)",
      slowQueries: "Обнаружено {count} медленных запросов (p95 > 100мс)",
      nPlusOne: "Обнаружено {count} N+1 паттернов",
      eventLoopLag: "Задержка event loop: {value}мс",
      queueLatency: "Очередь {queue} p95 задержка: {value}мс",
    },
    database: {
      title: "Оптимизация БД",
      missingIndexes: "{count} моделям нужны индексы",
      missingPagination: "{count} модулей без пагинации",
      largePayloads: "{count} запросов возвращают большие payload",
      duplicatedQueries: "Обнаружено {count} дубликатов запросов",
    },
    cache: {
      title: "Оптимизация кэша",
      hitRate: "Cache hit rate: {value}%",
      candidates: "Идентифицировано {count} кандидатов на кэширование",
      ttlAdjustments: "{count} namespace'ам нужна корректировка TTL",
      warmupRecommended: "Рекомендован warmup для {count} namespace",
    },
    api: {
      title: "Производительность API",
      slowest: "Самый медленный endpoint: {route} (p95={value}мс)",
      avgBreakdown: "Среднее: validation={val}мс, db={db}мс, ai={ai}мс, serialization={ser}мс",
    },
    jobs: {
      title: "Анализ фоновых задач",
      bottlenecks: "Обнаружено {count} медленных задач (>30с)",
      retryRate: "Среднее количество retry: {value}",
      deadLetter: "{count} задач в dead-letter очереди",
      queueDepth: "Глубина очереди {queue}: {value}",
    },
    resources: {
      title: "Использование ресурсов",
      ram: "RAM: {percent}% ({status})",
      cpu: "CPU: {percent}% ({status})",
      aiCredits: "AI кредиты: {percent}% бюджета ({status})",
      dbConnections: "Подключения к БД: {current}/{max} ({status})",
      workers: "Воркеры: {active}/{total} активны ({status})",
    },
    dependencies: {
      title: "Анализ зависимостей",
      circular: "Обнаружено {count} циклических зависимостей",
      deepChains: "Найдено {count} глубоких цепочек зависимостей",
      highCoupling: "{count} сильно-связанных модулей",
      unused: "{count} неиспользуемых сервисов",
      dead: "{count} мёртвых модулей",
      duplicates: "{count} дубликатов utility-функций",
    },
    startup: {
      title: "Анализ запуска",
      total: "Общее время запуска: {value}мс",
      slowest: "Самый медленный этап: {phase} ({value}мс)",
    },
    reliability: {
      title: "Анализ надёжности",
      retryCoverage: "Покрытие retry: {value}%",
      breakerCoverage: "Покрытие circuit breaker: {value}%",
      idempotencyCoverage: "Покрытие idempotency: {value}%",
      recoveryRate: "Коэффициент восстановления ошибок: {value}%",
      missingProtections: "Идентифицировано {count} недостающих защит",
    },
    readiness: {
      title: "Оценка готовности к продакшену",
      overall: "Общий балл: {value}/100 (оценка {grade})",
      dimensions: "Оценено {count} измерений",
      strengths: "Главные сильные стороны: {count}",
      weaknesses: "Главные слабые стороны: {count}",
      priorityRecs: "{count} приоритетных рекомендаций",
    },
  },
} as const;

for (const locale of ["en", "uz", "ru"] as const) {
  const filePath = join(ROOT, "messages", `${locale}.json`);
  const content = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  content.production = KEYS[locale];
  writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf-8");
  console.log(`Added production keys to ${locale}.json`);
}
