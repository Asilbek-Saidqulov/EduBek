import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const ROOT = process.cwd();
const KEYS = {
  en: { title: "Integration Platform", description: "Enterprise integration platform — API gateway, webhooks, connectors, OAuth, API keys, transformations, sync, automation, triggers, rate limiting, monitoring, and developer portal.",
    gateway: { title: "API Gateway", endpoints: "{count} endpoints" },
    registry: { title: "Integration Registry", total: "{count} integrations", active: "{count} active" },
    connectors: { title: "Connector Framework", total: "{count} connectors" },
    webhooks: { title: "Webhook Platform", delivered: "{count} delivered", failed: "{count} failed" },
    oauth: { title: "OAuth Manager", clients: "{count} clients" },
    apikeys: { title: "API Key Management", total: "{count} keys", active: "{count} active" },
    transformations: { title: "Transformation Engine", mappings: "{count} mappings" },
    sync: { title: "Synchronization Engine", jobs: "{count} jobs", successRate: "Success rate: {value}%" },
    automation: { title: "Automation Engine", rules: "{count} rules", simulation: "{count} in simulation" },
    triggers: { title: "Workflow Triggers", total: "{count} triggers" },
    rateLimiter: { title: "Rate Limiting", throttled: "{count} throttled" },
    monitor: { title: "Integration Monitoring", healthy: "{count} healthy", down: "{count} down" },
    dashboard: { title: "Integration Dashboard", integrations: "{count} integrations" },
    developer: { title: "Developer Portal", apis: "{count} APIs", sdks: "{count} SDKs" },
  },
  uz: { title: "Integratsiya Platformasi", description: "Korxona integratsiya platformasi — API gateway, webhooklar, bog'lovchilar, OAuth, API kalitlari, transformatsiyalar, sinxronlashtirish, avtomatlashtirish, triggerlar, tezlik cheklovi, monitoring va dasturchi portali.",
    gateway: { title: "API Gateway", endpoints: "{count} endpoint" },
    registry: { title: "Integratsiya reestri", total: "{count} integratsiya", active: "{count} faol" },
    connectors: { title: "Bog'lovchi framework", total: "{count} bog'lovchi" },
    webhooks: { title: "Webhook platformasi", delivered: "{count} yetkazilgan", failed: "{count} xato" },
    oauth: { title: "OAuth menejeri", clients: "{count} mijoz" },
    apikeys: { title: "API kalit boshqaruvi", total: "{count} kalit", active: "{count} faol" },
    transformations: { title: "Transformatsiya mexanizmi", mappings: "{count} mapping" },
    sync: { title: "Sinxronlashtirish mexanizmi", jobs: "{count} ish", successRate: "Muvaffaqiyat: {value}%" },
    automation: { title: "Avtomatlashtirish mexanizmi", rules: "{count} qoida", simulation: "{count} simulyatsiya" },
    triggers: { title: "Workflow triggerlari", total: "{count} trigger" },
    rateLimiter: { title: "Tezlik cheklovi", throttled: "{count} cheklangan" },
    monitor: { title: "Integratsiya monitoringi", healthy: "{count} sog'lom", down: "{count} o'chirilgan" },
    dashboard: { title: "Integratsiya paneli", integrations: "{count} integratsiya" },
    developer: { title: "Dasturchi portali", apis: "{count} API", sdks: "{count} SDK" },
  },
  ru: { title: "Платформа Интеграции", description: "Корпоративная платформа интеграции — API gateway, вебхуки, коннекторы, OAuth, API ключи, трансформации, синхронизация, автоматизация, триггеры, ограничение скорости, мониторинг и портал разработчика.",
    gateway: { title: "API Gateway", endpoints: "{count} эндпоинтов" },
    registry: { title: "Реестр интеграций", total: "{count} интеграций", active: "{count} активных" },
    connectors: { title: "Фреймворк коннекторов", total: "{count} коннекторов" },
    webhooks: { title: "Платформа вебхуков", delivered: "{count} доставлено", failed: "{count} ошибок" },
    oauth: { title: "Менеджер OAuth", clients: "{count} клиентов" },
    apikeys: { title: "Управление API ключами", total: "{count} ключей", active: "{count} активных" },
    transformations: { title: "Движок трансформации", mappings: "{count} маппингов" },
    sync: { title: "Движок синхронизации", jobs: "{count} задач", successRate: "Успех: {value}%" },
    automation: { title: "Движок автоматизации", rules: "{count} правил", simulation: "{count} симуляция" },
    triggers: { title: "Триггеры рабочих процессов", total: "{count} триггеров" },
    rateLimiter: { title: "Ограничение скорости", throttled: "{count} ограничено" },
    monitor: { title: "Мониторинг интеграций", healthy: "{count} здоровых", down: "{count} недоступных" },
    dashboard: { title: "Панель интеграции", integrations: "{count} интеграций" },
    developer: { title: "Портал разработчика", apis: "{count} API", sdks: "{count} SDK" },
  },
} as const;
for (const locale of ["en", "uz", "ru"] as const) {
  const filePath = join(ROOT, "messages", `${locale}.json`);
  const content = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  content.integrationPlatform = KEYS[locale];
  writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf-8");
  console.log(`Added integrationPlatform keys to ${locale}.json`);
}
