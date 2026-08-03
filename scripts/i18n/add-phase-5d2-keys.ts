/** Add Phase 5D.2 — Global Intelligence Network i18n keys. */
import * as fs from "node:fs";
import * as path from "node:path";
const M = "/home/z/my-project/messages";
type C = Record<string, any>;
const l = (loc: string): C => JSON.parse(fs.readFileSync(path.join(M, `${loc}.json`), "utf-8"));
const s = (loc: string, c: C) => fs.writeFileSync(path.join(M, `${loc}.json`), JSON.stringify(c, null, 2) + "\n", "utf-8");
const T: Record<string, Record<string, any>> = {
  en: { globalIntelligence: {
    model: { registered: "Foundation model registered", deployed: "Foundation model deployed" },
    equivalence: { created: "Curriculum equivalence created", found: "Equivalent standards found" },
    pattern: { discovered: "Educational pattern discovered" },
    synthetic: { generated: "Synthetic dataset generated" },
    benchmark: { recorded: "Global benchmark recorded" },
    reasoning: { completed: "Educational reasoning completed", retrieved: "Reasoning chain retrieved" },
    evolution: { recorded: "Knowledge evolution recorded" },
    observatory: { captured: "Global observatory snapshot captured", retrieved: "Observatory data retrieved" },
    apiCall: { completed: "Foundation API call completed" },
    insight: { published: "Collective insight published" },
    alignment: { created: "Multilingual alignment created" },
    participation: { joined: "Organization joined the network" },
  }},
  uz: { globalIntelligence: {
    model: { registered: "Foundation model ro'yxatdan o'tdi", deployed: "Foundation model joylashtirildi" },
    equivalence: { created: "O'quv reja ekvivalenti yaratildi", found: "Ekvivalent standartlar topildi" },
    pattern: { discovered: "Ta'lim patterni kashf etildi" },
    synthetic: { generated: "Sintetik ma'lumotlar to'plami yaratildi" },
    benchmark: { recorded: "Global benchmark qayd etildi" },
    reasoning: { completed: "Ta'limiy mulohaza yakunlandi", retrieved: "Mulohaza zanjiri olindi" },
    evolution: { recorded: "Bilim evolyutsiyasi qayd etildi" },
    observatory: { captured: "Global observatoriya snapshoti saqlandi", retrieved: "Observatoriya ma'lumotlari olindi" },
    apiCall: { completed: "Foundation API chaqiruvi yakunlandi" },
    insight: { published: "Kollektiv tushuncha nashr etildi" },
    alignment: { created: "Ko'p tilli moslik yaratildi" },
    participation: { joined: "Tashkilot tarmoqqa qo'shildi" },
  }},
  ru: { globalIntelligence: {
    model: { registered: "Фундаментальная модель зарегистрирована", deployed: "Модель развёрнута" },
    equivalence: { created: "Эквивалент учебной программы создан", found: "Эквивалентные стандарты найдены" },
    pattern: { discovered: "Образовательный паттерн обнаружен" },
    synthetic: { generated: "Синтетический набор данных создан" },
    benchmark: { recorded: "Глобальный бенчмарк записан" },
    reasoning: { completed: "Образовательное рассуждение завершено", retrieved: "Цепочка рассуждений получена" },
    evolution: { recorded: "Эволюция знания записана" },
    observatory: { captured: "Снимок глобальной обсерватории сохранён", retrieved: "Данные обсерватории получены" },
    apiCall: { completed: "Вызов Foundation API завершён" },
    insight: { published: "Коллективный инсайт опубликован" },
    alignment: { created: "Многоязычное выравнивание создано" },
    participation: { joined: "Организация присоединилась к сети" },
  }},
};
for (const loc of ["en", "uz", "ru"]) { const c = l(loc); for (const [k, v] of Object.entries(T[loc]!)) c[k] = { ...(c[k] ?? {}), ...v }; s(loc, c); console.log(`✓ ${loc}.json`); }
