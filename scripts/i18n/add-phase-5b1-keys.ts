/** Add Phase 5B.1 — Enterprise Integration i18n keys. */
import * as fs from "node:fs";
import * as path from "node:path";
const MESSAGES_DIR = "/home/z/my-project/messages";
type Catalog = Record<string, any>;
function load(locale: string): Catalog { return JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf-8")); }
function save(locale: string, c: Catalog): void { fs.writeFileSync(path.join(MESSAGES_DIR, `${locale}.json`), JSON.stringify(c, null, 2) + "\n", "utf-8"); }
const T: Record<string, Record<string, any>> = {
  en: { enterprise: {
    connector: { list: "Available connectors", notFound: "Connector not found" },
    integration: { created: "Integration created", connected: "Integration connected", disconnected: "Integration disconnected", synced: "Sync completed", healthChecked: "Health check completed" },
    webhook: { created: "Webhook endpoint created", deleted: "Webhook endpoint deleted", delivered: "Webhook delivered", deliveryFailed: "Webhook delivery failed" },
    apiKey: { created: "API key created", revoked: "API key revoked", invalid: "Invalid API key" },
    oauth: { clientCreated: "OAuth client created" },
    aiProvider: { registered: "AI provider registered", toggled: "AI provider toggled" },
    importExport: { jobCreated: "Import/export job created", jobCompleted: "Job completed", jobFailed: "Job failed" },
    marketplace: { appPublished: "App published", appApproved: "App approved" },
    tenant: { created: "Tenant created", notFound: "Tenant not found" },
    event: { subscriptionCreated: "Event subscription created", published: "Event published" },
  }},
  uz: { enterprise: {
    connector: { list: "Mavjud ulagichlar", notFound: "Ulagich topilmadi" },
    integration: { created: "Integratsiya yaratildi", connected: "Integratsiya ulandi", disconnected: "Integratsiya uzildi", synced: "Sinxronizatsiya yakunlandi", healthChecked: "Sog'liq tekshiruvi yakunlandi" },
    webhook: { created: "Webhook endpoint yaratildi", deleted: "Webhook endpoint o'chirildi", delivered: "Webhook yetkazildi", deliveryFailed: "Webhook yetkazilmadi" },
    apiKey: { created: "API kalit yaratildi", revoked: "API kalit bekor qilindi", invalid: "Noto'g'ri API kalit" },
    oauth: { clientCreated: "OAuth mijozi yaratildi" },
    aiProvider: { registered: "AI provayder ro'yxatdan o'tdi", toggled: "AI provayder o'zgartirildi" },
    importExport: { jobCreated: "Import/export vazifasi yaratildi", jobCompleted: "Vazifa yakunlandi", jobFailed: "Vazifa amalga oshmadi" },
    marketplace: { appPublished: "Ilova nashr etildi", appApproved: "Ilova tasdiqlandi" },
    tenant: { created: "Tennant yaratildi", notFound: "Tennant topilmadi" },
    event: { subscriptionCreated: "Hodisa obunasi yaratildi", published: "Hodisa nashr etildi" },
  }},
  ru: { enterprise: {
    connector: { list: "Доступные коннекторы", notFound: "Коннектор не найден" },
    integration: { created: "Интеграция создана", connected: "Интеграция подключена", disconnected: "Интеграция отключена", synced: "Синхронизация завершена", healthChecked: "Проверка здоровья завершена" },
    webhook: { created: "Webhook endpoint создан", deleted: "Webhook endpoint удалён", delivered: "Webhook доставлен", deliveryFailed: "Webhook не доставлен" },
    apiKey: { created: "API ключ создан", revoked: "API ключ отозван", invalid: "Недействительный API ключ" },
    oauth: { clientCreated: "OAuth клиент создан" },
    aiProvider: { registered: "AI провайдер зарегистрирован", toggled: "AI провайдер переключён" },
    importExport: { jobCreated: "Задача импорта/экспорта создана", jobCompleted: "Задача завершена", jobFailed: "Задача не удалась" },
    marketplace: { appPublished: "Приложение опубликовано", appApproved: "Приложение одобрено" },
    tenant: { created: "Тенант создан", notFound: "Тенант не найден" },
    event: { subscriptionCreated: "Подписка на события создана", published: "Событие опубликовано" },
  }},
};
for (const loc of ["en", "uz", "ru"]) { const c = load(loc); for (const [k, v] of Object.entries(T[loc]!)) c[k] = { ...(c[k] ?? {}), ...v }; save(loc, c); console.log(`✓ ${loc}.json`); }
