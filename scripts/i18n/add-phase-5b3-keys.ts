/** Add Phase 5B.3 — Data Fabric i18n keys. */
import * as fs from "node:fs";
import * as path from "node:path";
const M = "/home/z/my-project/messages";
type C = Record<string, any>;
const l = (loc: string): C => JSON.parse(fs.readFileSync(path.join(M, `${loc}.json`), "utf-8"));
const s = (loc: string, c: C) => fs.writeFileSync(path.join(M, `${loc}.json`), JSON.stringify(c, null, 2) + "\n", "utf-8");
const T: Record<string, Record<string, any>> = {
  en: { dataFabric: {
    entity: { registered: "Entity registered in fabric", updated: "Entity state updated", notFound: "Entity not found in fabric" },
    event: { appended: "Event appended to store", reconstructed: "State reconstructed from events" },
    readModel: { projected: "Read model projected", retrieved: "Read model retrieved" },
    stream: { subscribed: "Stream subscription created", delivered: "Event delivered to subscriber" },
    sync: { completed: "Distributed sync completed", conflictDetected: "Sync conflict detected" },
    search: { indexed: "Entity indexed in global search", searched: "Global search completed", noResults: "No results found" },
    federated: { jobCreated: "Federated learning job created", contributed: "Parameters contributed", aggregated: "Parameters aggregated" },
    benchmark: { generated: "Benchmark report generated", compared: "Cross-institution comparison completed" },
    trace: { recorded: "Observability trace recorded" },
    governance: { policyCreated: "Governance policy created", enforced: "Retention policies enforced", entitiesArchived: "{count} entities archived", eventsDeleted: "{count} events deleted" },
    lake: { captured: "Intelligence snapshot captured" },
    overview: { retrieved: "Fabric overview retrieved" },
  }},
  uz: { dataFabric: {
    entity: { registered: "Ob'ekt fabric'ga ro'yxatdan o'tdi", updated: "Ob'ekt holati yangilandi", notFound: "Ob'ekt fabric'da topilmadi" },
    event: { appended: "Hodisa do'konga qo'shildi", reconstructed: "Holat hodisalardan qayta tiklandi" },
    readModel: { projected: "O'qish modeli proyeksiya qilindi", retrieved: "O'qish modeli olindi" },
    stream: { subscribed: "Oqim obunasi yaratildi", delivered: "Hodisa obunachiga yetkazildi" },
    sync: { completed: "Distributed sinxronizatsiya yakunlandi", conflictDetected: "Sinxronizatsiya mojarosi aniqlandi" },
    search: { indexed: "Ob'ekt global qidiruvga indekslandi", searched: "Global qidiruv yakunlandi", noResults: "Natijalar topilmadi" },
    federated: { jobCreated: "Federated learning vazifasi yaratildi", contributed: "Parametrlar hissa qo'shildi", aggregated: "Parametrlar agregatsiya qilindi" },
    benchmark: { generated: "Benchmark hisoboti yaratildi", compared: "Cross-institutsional taqqoslash yakunlandi" },
    trace: { recorded: "Kuzatuv izi qayd etildi" },
    governance: { policyCreated: "Boshqaruv siyosati yaratildi", enforced: "Saqlash siyosatlari amalga oshirildi", entitiesArchived: "{count} ob'ekt arxivlandi", eventsDeleted: "{count} hodisa o'chirildi" },
    lake: { captured: "Intellekt snapshoti saqlandi" },
    overview: { retrieved: "Fabric umumiy ko'rinishi olindi" },
  }},
  ru: { dataFabric: {
    entity: { registered: "Сущность зарегистрирована в fabric", updated: "Состояние сущности обновлено", notFound: "Сущность не найдена в fabric" },
    event: { appended: "Событие добавлено в хранилище", reconstructed: "Состояние реконструировано из событий" },
    readModel: { projected: "Модель чтения спроецирована", retrieved: "Модель чтения получена" },
    stream: { subscribed: "Подписка на поток создана", delivered: "Событие доставлено подписчику" },
    sync: { completed: "Распределённая синхронизация завершена", conflictDetected: "Обнаружен конфликт синхронизации" },
    search: { indexed: "Сущность проиндексирована в глобальном поиске", searched: "Глобальный поиск завершён", noResults: "Результаты не найдены" },
    federated: { jobCreated: "Задача федеративного обучения создана", contributed: "Параметры внесены", aggregated: "Параметры агрегированы" },
    benchmark: { generated: "Отчёт бенчмарка создан", compared: "Межинституциональное сравнение завершено" },
    trace: { recorded: "Трассировка наблюдаемости записана" },
    governance: { policyCreated: "Политика управления создана", enforced: "Политики хранения применены", entitiesArchived: "{count} сущностей архивировано", eventsDeleted: "{count} событий удалено" },
    lake: { captured: "Снимок интеллекта сохранён" },
    overview: { retrieved: "Обзор fabric получен" },
  }},
};
for (const loc of ["en", "uz", "ru"]) { const c = l(loc); for (const [k, v] of Object.entries(T[loc]!)) c[k] = { ...(c[k] ?? {}), ...v }; s(loc, c); console.log(`✓ ${loc}.json`); }
