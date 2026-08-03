/** Add Phase 5C.2 — Learning Studio i18n keys. */
import * as fs from "node:fs";
import * as path from "node:path";
const M = "/home/z/my-project/messages";
type C = Record<string, any>;
const l = (loc: string): C => JSON.parse(fs.readFileSync(path.join(M, `${loc}.json`), "utf-8"));
const s = (loc: string, c: C) => fs.writeFileSync(path.join(M, `${loc}.json`), JSON.stringify(c, null, 2) + "\n", "utf-8");
const T: Record<string, Record<string, any>> = {
  en: { learningStudio: {
    experience: { created: "Learning experience created", published: "Experience published" },
    session: { started: "Session started", updated: "Session progress updated", completed: "Session completed" },
    simulation: { generated: "Simulation generated", notFound: "Simulation not found" },
    virtualLab: { generated: "Virtual lab generated" },
    programming: { created: "Programming workspace created", graded: "Submission graded" },
    tutor: { created: "AI tutor avatar created" },
    world: { generated: "Learning world generated" },
    scenario: { created: "Scenario task created" },
    artifact: { generated: "Content artifact generated" },
    composition: { created: "Experience composition created", published: "Composition published" },
  }},
  uz: { learningStudio: {
    experience: { created: "O'qish tajribasi yaratildi", published: "Tajriba nashr etildi" },
    session: { started: "Sessiya boshlandi", updated: "Sessiya progressi yangilandi", completed: "Sessiya yakunlandi" },
    simulation: { generated: "Simulyatsiya yaratildi", notFound: "Simulyatsiya topilmadi" },
    virtualLab: { generated: "Virtual laboratoriya yaratildi" },
    programming: { created: "Dasturlash maydoni yaratildi", graded: "Topshiriq baholandi" },
    tutor: { created: "AI o'qituvchi avatar yaratildi" },
    world: { generated: "O'qish dunyosi yaratildi" },
    scenario: { created: "Stsenariy vazifasi yaratildi" },
    artifact: { generated: "Kontent artifakti yaratildi" },
    composition: { created: "Tajriba kompozitsiyasi yaratildi", published: "Kompozitsiya nashr etildi" },
  }},
  ru: { learningStudio: {
    experience: { created: "Учебный опыт создан", published: "Опыт опубликован" },
    session: { started: "Сессия начата", updated: "Прогресс сессии обновлён", completed: "Сессия завершена" },
    simulation: { generated: "Симуляция создана", notFound: "Симуляция не найдена" },
    virtualLab: { generated: "Виртуальная лаборатория создана" },
    programming: { created: "Программная среда создана", graded: "Решение оценено" },
    tutor: { created: "AI тьютор-аватар создан" },
    world: { generated: "Учебный мир создан" },
    scenario: { created: "Сценарная задача создана" },
    artifact: { generated: "Контентный артефакт создан" },
    composition: { created: "Композиция опыта создана", published: "Композиция опубликована" },
  }},
};
for (const loc of ["en", "uz", "ru"]) { const c = l(loc); for (const [k, v] of Object.entries(T[loc]!)) c[k] = { ...(c[k] ?? {}), ...v }; s(loc, c); console.log(`✓ ${loc}.json`); }
