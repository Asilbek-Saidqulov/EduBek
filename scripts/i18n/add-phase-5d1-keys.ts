/** Add Phase 5D.1 — Research Platform i18n keys. */
import * as fs from "node:fs";
import * as path from "node:path";
const M = "/home/z/my-project/messages";
type C = Record<string, any>;
const l = (loc: string): C => JSON.parse(fs.readFileSync(path.join(M, `${loc}.json`), "utf-8"));
const s = (loc: string, c: C) => fs.writeFileSync(path.join(M, `${loc}.json`), JSON.stringify(c, null, 2) + "\n", "utf-8");
const T: Record<string, Record<string, any>> = {
  en: { researchPlatform: {
    assistant: { queried: "Research assistant queried" },
    project: { created: "Research project created", statusUpdated: "Project status updated" },
    literature: { added: "Literature entry added", searched: "Literature search completed" },
    experiment: { designed: "Experiment designed" },
    dataset: { created: "Dataset created", validated: "FAIR compliance validated" },
    citation: { recorded: "Citation recorded", validated: "Citations validated" },
    review: { assigned: "Peer review assigned", submitted: "Review submitted" },
    patent: { created: "Patent workspace created", statusUpdated: "Patent status updated" },
    publication: { created: "Publication draft created", statusUpdated: "Publication status updated" },
    analytics: { generated: "Research analytics generated" },
  }},
  uz: { researchPlatform: {
    assistant: { queried: "Tadqiqot yordamchisiga so'rov berildi" },
    project: { created: "Tadqiqot loyihasi yaratildi", statusUpdated: "Loyiha holati yangilandi" },
    literature: { added: "Adabiyot yozuvi qo'shildi", searched: "Adabiyot qidiruvi yakunlandi" },
    experiment: { designed: "Eksperiment loyihasi tuzildi" },
    dataset: { created: "Ma'lumotlar to'plami yaratildi", validated: "FAIR mosligi tekshirildi" },
    citation: { recorded: "Iqtibos qayd etildi", validated: "Iqtiboslar tekshirildi" },
    review: { assigned: "Peer review tayinlandi", submitted: "Review topshirildi" },
    patent: { created: "Patent maydoni yaratildi", statusUpdated: "Patent holati yangilandi" },
    publication: { created: "Nashr loyihasi yaratildi", statusUpdated: "Nashr holati yangilandi" },
    analytics: { generated: "Tadqiqot tahlillari yaratildi" },
  }},
  ru: { researchPlatform: {
    assistant: { queried: "Запрос к исследовательскому ассистенту" },
    project: { created: "Исследовательский проект создан", statusUpdated: "Статус проекта обновлён" },
    literature: { added: "Литературная запись добавлена", searched: "Поиск литературы завершён" },
    experiment: { designed: "Дизайн эксперимента создан" },
    dataset: { created: "Набор данных создан", validated: "FAIR-соответствие проверено" },
    citation: { recorded: "Цитата записана", validated: "Цитаты проверены" },
    review: { assigned: "Рецензирование назначено", submitted: "Рецензия отправлена" },
    patent: { created: "Патентное рабочее пространство создано", statusUpdated: "Статус патента обновлён" },
    publication: { created: "Черновик публикации создан", statusUpdated: "Статус публикации обновлён" },
    analytics: { generated: "Исследовательская аналитика сгенерирована" },
  }},
};
for (const loc of ["en", "uz", "ru"]) { const c = l(loc); for (const [k, v] of Object.entries(T[loc]!)) c[k] = { ...(c[k] ?? {}), ...v }; s(loc, c); console.log(`✓ ${loc}.json`); }
