import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const ROOT = process.cwd();
const KEYS = {
  en: { title: "Developer Platform", description: "Extension SDK, runtime, capabilities, permissions, marketplace, developer accounts, SDK generator, API explorer, webhooks, sandbox, validation, compatibility, analytics, publishing, dashboard, and documentation.",
    sdk: { title: "Extension SDK", manifests: "Manifest builder" },
    runtime: { title: "Extension Runtime", sandbox: "Sandbox configuration" },
    capabilities: { title: "Capability Registry", total: "{count} capabilities" },
    permissions: { title: "Permission Manager", total: "{count} permissions" },
    marketplace: { title: "Extension Marketplace", total: "{count} extensions", published: "{count} published" },
    publishers: { title: "Developer Accounts", total: "{count} developers", verified: "{count} verified" },
    explorer: { title: "API Explorer", endpoints: "{count} endpoints" },
    webhooks: { title: "Webhook Catalog", events: "{count} events" },
    sandbox: { title: "Developer Sandbox", mode: "Simulation mode — no real writes" },
    validation: { title: "Extension Validation", valid: "Validation passed: {value}" },
    compatibility: { title: "Compatibility Analyzer", status: "Status: {value}" },
    analytics: { title: "Developer Analytics", downloads: "{count} downloads", apiCalls: "{count} API calls" },
    publishing: { title: "Publishing Workflow", inReview: "{count} in review", published: "{count} published" },
    dashboard: { title: "Developer Dashboard", extensions: "{count} extensions", downloads: "{count} downloads" },
    documentation: { title: "Documentation Generator", deterministic: "Deterministic documentation generation" },
  },
  uz: { title: "Dasturchi Platformasi", description: "Kengaytma SDK, runtime, imkoniyatlar, ruxsatlar, marketplace, dasturchi hisoblari, SDK generatori, API explorer, webhooklar, sandbox, validatsiya, moslik, analitika, nashr qilish, panel va hujjatlar.",
    sdk: { title: "Kengaytma SDK", manifests: "Manifest konstruktori" },
    runtime: { title: "Kengaytma Runtime", sandbox: "Sandbox konfiguratsiyasi" },
    capabilities: { title: "Imkoniyatlar reestri", total: "{count} imkoniyat" },
    permissions: { title: "Ruxsat menejeri", total: "{count} ruxsat" },
    marketplace: { title: "Kengaytma Marketplace", total: "{count} kengaytma", published: "{count} nashr qilingan" },
    publishers: { title: "Dasturchi hisoblari", total: "{count} dasturchi", verified: "{count} tasdiqlangan" },
    explorer: { title: "API Explorer", endpoints: "{count} endpoint" },
    webhooks: { title: "Webhook katalogi", events: "{count} hodisa" },
    sandbox: { title: "Dasturchi sandbox", mode: "Simulyatsiya rejimi — real yozuv yo'q" },
    validation: { title: "Kengaytma validatsiyasi", valid: "Validatsiya o'tdi: {value}" },
    compatibility: { title: "Moslik tahlilchisi", status: "Holat: {value}" },
    analytics: { title: "Dasturchi analitikasi", downloads: "{count} yuklash", apiCalls: "{count} API chaqiruv" },
    publishing: { title: "Nashr jarayoni", inReview: "{count} ko'rib chiqilmoqda", published: "{count} nashr qilingan" },
    dashboard: { title: "Dasturchi paneli", extensions: "{count} kengaytma", downloads: "{count} yuklash" },
    documentation: { title: "Hujjat generatori", deterministic: "Deterministik hujjat generatsiyasi" },
  },
  ru: { title: "Платформа Разработчика", description: "SDK расширений, среда выполнения, возможности, разрешения, маркетплейс, аккаунты разработчиков, генератор SDK, API explorer, вебхуки, песочница, валидация, совместимость, аналитика, публикация, панель и документация.",
    sdk: { title: "SDK Расширений", manifests: "Конструктор манифестов" },
    runtime: { title: "Среда выполнения", sandbox: "Конфигурация песочницы" },
    capabilities: { title: "Реестр возможностей", total: "{count} возможностей" },
    permissions: { title: "Менеджер разрешений", total: "{count} разрешений" },
    marketplace: { title: "Маркетплейс расширений", total: "{count} расширений", published: "{count} опубликовано" },
    publishers: { title: "Аккаунты разработчиков", total: "{count} разработчиков", verified: "{count} верифицировано" },
    explorer: { title: "API Explorer", endpoints: "{count} эндпоинтов" },
    webhooks: { title: "Каталог вебхуков", events: "{count} событий" },
    sandbox: { title: "Песочница разработчика", mode: "Режим симуляции — без реальных записей" },
    validation: { title: "Валидация расширений", valid: "Валидация пройдена: {value}" },
    compatibility: { title: "Анализатор совместимости", status: "Статус: {value}" },
    analytics: { title: "Аналитика разработчика", downloads: "{count} загрузок", apiCalls: "{count} API вызовов" },
    publishing: { title: "Рабочий процесс публикации", inReview: "{count} на рассмотрении", published: "{count} опубликовано" },
    dashboard: { title: "Панель разработчика", extensions: "{count} расширений", downloads: "{count} загрузок" },
    documentation: { title: "Генератор документации", deterministic: "Детерминированная генерация документации" },
  },
} as const;
for (const locale of ["en", "uz", "ru"] as const) {
  const filePath = join(ROOT, "messages", `${locale}.json`);
  const content = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  content.developerPlatform = KEYS[locale];
  writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf-8");
  console.log(`Added developerPlatform keys to ${locale}.json`);
}
