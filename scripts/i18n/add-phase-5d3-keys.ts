/** Add Phase 5D.3 — Civilization Engine i18n keys. */
import * as fs from "node:fs";
import * as path from "node:path";
const M = "/home/z/my-project/messages";
type C = Record<string, any>;
const l = (loc: string): C => JSON.parse(fs.readFileSync(path.join(M, `${loc}.json`), "utf-8"));
const s = (loc: string, c: C) => fs.writeFileSync(path.join(M, `${loc}.json`), JSON.stringify(c, null, 2) + "\n", "utf-8");
const T: Record<string, Record<string, any>> = {
  en: { civilizationEngine: {
    memory: { recorded: "Institutional memory recorded", searched: "Memory search completed" },
    decision: { analyzed: "Decision analyzed", updated: "Decision status updated" },
    strategy: { generated: "Strategic plan generated", activated: "Strategic plan activated" },
    advisor: { generated: "Advisor recommendations generated", acknowledged: "Recommendation acknowledged" },
    policy: { created: "Educational policy created", approved: "Policy approved and activated" },
    goal: { created: "Institutional goal created", updated: "Goal progress updated", achieved: "Goal achieved" },
    timeline: { recorded: "Timeline event recorded", replayed: "Timeline replayed" },
    knowledge: { created: "Knowledge base entry created", searched: "Knowledge search completed" },
    simulation: { completed: "Institutional simulation completed" },
    wisdom: { generated: "Wisdom insight generated" },
    dashboard: { retrieved: "Civilization dashboard retrieved" },
  }},
  uz: { civilizationEngine: {
    memory: { recorded: "Institutsional xotira qayd etildi", searched: "Xotira qidiruvi yakunlandi" },
    decision: { analyzed: "Qaror tahlil qilindi", updated: "Qaror holati yangilandi" },
    strategy: { generated: "Strategik reja yaratildi", activated: "Strategik reja faollashtirildi" },
    advisor: { generated: "Maslahatchi tavsiyalari yaratildi", acknowledged: "Tavsiya tasdiqlandi" },
    policy: { created: "Ta'lim siyosati yaratildi", approved: "Siyosat tasdiqlandi va faollashtirildi" },
    goal: { created: "Institutsional maqsad yaratildi", updated: "Maqsad progressi yangilandi", achieved: "Maqsadga erishildi" },
    timeline: { recorded: "Vaqt chizig'i hodisasi qayd etildi", replayed: "Vaqt chizig'i qayta o'ynaldi" },
    knowledge: { created: "Bilim bazasi yozuvi yaratildi", searched: "Bilim qidiruvi yakunlandi" },
    simulation: { completed: "Institutsional simulyatsiya yakunlandi" },
    wisdom: { generated: "Donolik tushunchasi yaratildi" },
    dashboard: { retrieved: "Sivilizatsiya dashboardi olindi" },
  }},
  ru: { civilizationEngine: {
    memory: { recorded: "Институциональная память записана", searched: "Поиск по памяти завершён" },
    decision: { analyzed: "Решение проанализировано", updated: "Статус решения обновлён" },
    strategy: { generated: "Стратегический план создан", activated: "Стратегический план активирован" },
    advisor: { generated: "Рекомендации советника сгенерированы", acknowledged: "Рекомендация подтверждена" },
    policy: { created: "Образовательная политика создана", approved: "Политика одобрена и активирована" },
    goal: { created: "Институциональная цель создана", updated: "Прогресс цели обновлён", achieved: "Цель достигнута" },
    timeline: { recorded: "Событие таймлайна записано", replayed: "Таймлайн воспроизведён" },
    knowledge: { created: "Запись базы знаний создана", searched: "Поиск знаний завершён" },
    simulation: { completed: "Институциональное моделирование завершено" },
    wisdom: { generated: "Инсайт мудрости сгенерирован" },
    dashboard: { retrieved: "Дашборд цивилизации получен" },
  }},
};
for (const loc of ["en", "uz", "ru"]) { const c = l(loc); for (const [k, v] of Object.entries(T[loc]!)) c[k] = { ...(c[k] ?? {}), ...v }; s(loc, c); console.log(`✓ ${loc}.json`); }
