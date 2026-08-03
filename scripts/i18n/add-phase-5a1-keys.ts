/**
 * Add Phase 5A.1 — Digital Twins i18n keys to en/uz/ru catalogs.
 */
import * as fs from "node:fs";
import * as path from "node:path";

const MESSAGES_DIR = "/home/z/my-project/messages";
type Catalog = Record<string, any>;
function load(locale: string): Catalog { return JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf-8")); }
function save(locale: string, c: Catalog): void { fs.writeFileSync(path.join(MESSAGES_DIR, `${locale}.json`), JSON.stringify(c, null, 2) + "\n", "utf-8"); }

const T: Record<string, Record<string, any>> = {
  en: {
    digitalTwins: {
      twin: { synced: "Digital twin synced", notFound: "Digital twin not found", historyRetrieved: "Twin history retrieved" },
      calendar: { created: "Academic calendar created", activated: "Calendar activated", eventAdded: "Calendar event added" },
      assistant: { prepareNextWeek: "Next week's lessons prepared", instructionExecuted: "Autonomous instruction executed" },
      workflow: { triggered: "Academic workflow triggered", completed: "Workflow completed", failed: "Workflow failed" },
      memory: { stored: "Academic memory stored", recalled: "Academic memory recalled" },
      scenario: { completed: "Scenario simulation completed", noData: "No scenario data available" },
      operations: { generated: "Operations dashboard generated", acknowledged: "Operation acknowledged", resolved: "Operation resolved", dismissed: "Operation dismissed" },
      twinType: { classroom: "Classroom Twin", student: "Student Twin", teacher: "Teacher Twin", institution: "Institution Twin" },
    },
  },
  uz: {
    digitalTwins: {
      twin: { synced: "Raqamli egizak sinxronlandi", notFound: "Raqamli egizak topilmadi", historyRetrieved: "Egizak tarixi olindi" },
      calendar: { created: "Akademik kalendar yaratildi", activated: "Kalendar faollashtirildi", eventAdded: "Kalendar hodisasi qo'shildi" },
      assistant: { prepareNextWeek: "Keyingi hafta darslari tayyorlandi", instructionExecuted: "Avtonom ko'rsatma bajarildi" },
      workflow: { triggered: "Akademik workflow ishga tushirildi", completed: "Workflow yakunlandi", failed: "Workflow amalga oshmadi" },
      memory: { stored: "Akademik xotira saqlandi", recalled: "Akademik xotira eslandi" },
      scenario: { completed: "Stsenariy simulyatsiyasi yakunlandi", noData: "Stsenariy ma'lumotlari mavjud emas" },
      operations: { generated: "Operatsiyalar dashboardi yaratildi", acknowledged: "Operatsiya tasdiqlandi", resolved: "Operatsiya hal qilindi", dismissed: "Operatsiya rad etildi" },
      twinType: { classroom: "Sinfxona Egizagi", student: "O'quvchi Egizagi", teacher: "O'qituvchi Egizagi", institution: "Muassasa Egizagi" },
    },
  },
  ru: {
    digitalTwins: {
      twin: { synced: "Цифровой двойник синхронизирован", notFound: "Цифровой двойник не найден", historyRetrieved: "История двойника получена" },
      calendar: { created: "Академический календарь создан", activated: "Календарь активирован", eventAdded: "Событие календаря добавлено" },
      assistant: { prepareNextWeek: "Уроки на следующую неделю подготовлены", instructionExecuted: "Автономная инструкция выполнена" },
      workflow: { triggered: "Академический workflow запущен", completed: "Workflow завершён", failed: "Workflow не удалось" },
      memory: { stored: "Академическая память сохранена", recalled: "Академическая память восстановлена" },
      scenario: { completed: "Симуляция сценария завершена", noData: "Данные сценария недоступны" },
      operations: { generated: "Дашборд операций создан", acknowledged: "Операция подтверждена", resolved: "Операция решена", dismissed: "Операция отклонена" },
      twinType: { classroom: "Двойник класса", student: "Двойник ученика", teacher: "Двойник учителя", institution: "Двойник учреждения" },
    },
  },
};

for (const loc of ["en", "uz", "ru"]) {
  const c = load(loc);
  for (const [k, v] of Object.entries(T[loc]!)) c[k] = { ...(c[k] ?? {}), ...v };
  save(loc, c);
  console.log(`✓ ${loc}.json`);
}
