/** Add Phase 5A.2 — Assessment Platform i18n keys. */
import * as fs from "node:fs";
import * as path from "node:path";
const MESSAGES_DIR = "/home/z/my-project/messages";
type Catalog = Record<string, any>;
function load(locale: string): Catalog { return JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf-8")); }
function save(locale: string, c: Catalog): void { fs.writeFileSync(path.join(MESSAGES_DIR, `${locale}.json`), JSON.stringify(c, null, 2) + "\n", "utf-8"); }

const T: Record<string, Record<string, any>> = {
  en: { assessmentPlatform: {
    blueprint: { built: "Assessment blueprint built", notFound: "Blueprint not found" },
    grading: { completed: "AI grading completed", suggestedReview: "Teacher review suggested" },
    integrity: { checked: "Integrity check completed", reviewed: "Integrity check reviewed", riskLow: "Low risk", riskMedium: "Medium risk", riskHigh: "High risk" },
    secureExam: { started: "Secure exam started", paused: "Exam paused", resumed: "Exam resumed", submitted: "Exam submitted", autosaved: "Progress autosaved" },
    competency: { created: "Competency created", evidenceRecorded: "Evidence recorded", verified: "Competency verified", certificationReady: "Certification ready" },
    credential: { issued: "Credential issued", verified: "Credential verified", revoked: "Credential revoked", notFound: "Credential not found", expired: "Credential expired" },
    transcript: { rebuilt: "Transcript rebuilt", notFound: "Transcript not found" },
    quality: { analyzed: "Assessment quality analyzed", recommendations: "Recommendations generated" },
    accreditation: { generated: "Accreditation report generated", auditReady: "Audit ready", auditNotReady: "Audit readiness needs improvement" },
  }},
  uz: { assessmentPlatform: {
    blueprint: { built: "Baholash rejasi tuzildi", notFound: "Reja topilmadi" },
    grading: { completed: "AI baholash yakunlandi", suggestedReview: "O'qituvchi tekshiruvi tavsiya etiladi" },
    integrity: { checked: "Yaxlitlik tekshiruvi yakunlandi", reviewed: "Tekshiruv ko'rib chiqildi", riskLow: "Past xavf", riskMedium: "O'rta xavf", riskHigh: "Yuqori xavf" },
    secureExam: { started: "Xavfsiz imtihon boshlandi", paused: "Imtihon to'xtatildi", resumed: "Imtihon davom ettirildi", submitted: "Imtihon topshirildi", autosaved: "Progress saqlandi" },
    competency: { created: "Kompetensiya yaratildi", evidenceRecorded: "Dalil qayd etildi", verified: "Kompetensiya tasdiqlandi", certificationReady: "Sertifikatga tayyor" },
    credential: { issued: "Kredensial berildi", verified: "Kredensial tasdiqlandi", revoked: "Kredensial bekor qilindi", notFound: "Kredensial topilmadi", expired: "Kredensial muddati o'tgan" },
    transcript: { rebuilt: "Transkript qayta tuzildi", notFound: "Transkript topilmadi" },
    quality: { analyzed: "Baholash sifati tahlil qilindi", recommendations: "Tavsiyalar yaratildi" },
    accreditation: { generated: "Akkreditatsiya hisoboti yaratildi", auditReady: "Auditga tayyor", auditNotReady: "Audit tayyorgarligini yaxshilash kerak" },
  }},
  ru: { assessmentPlatform: {
    blueprint: { built: "План оценки создан", notFound: "План не найден" },
    grading: { completed: "AI-оценивание завершено", suggestedReview: "Рекомендуется проверка преподавателем" },
    integrity: { checked: "Проверка честности завершена", reviewed: "Проверка рассмотрена", riskLow: "Низкий риск", riskMedium: "Средний риск", riskHigh: "Высокий риск" },
    secureExam: { started: "Безопасный экзамен начат", paused: "Экзамен приостановлен", resumed: "Экзамен возобновлён", submitted: "Экзамен сдан", autosaved: "Прогресс сохранён" },
    competency: { created: "Компетенция создана", evidenceRecorded: "Свидетельство записано", verified: "Компетенция подтверждена", certificationReady: "Готов к сертификации" },
    credential: { issued: "Кредит выдан", verified: "Кредит подтверждён", revoked: "Кредит отозван", notFound: "Кредит не найден", expired: "Срок кредита истёк" },
    transcript: { rebuilt: "Транскрипт перестроен", notFound: "Транскрипт не найден" },
    quality: { analyzed: "Качество оценки проанализировано", recommendations: "Рекомендации созданы" },
    accreditation: { generated: "Отчёт аккредитации создан", auditReady: "Готов к аудиту", auditNotReady: "Необходимо улучшить готовность к аудиту" },
  }},
};
for (const loc of ["en", "uz", "ru"]) { const c = load(loc); for (const [k, v] of Object.entries(T[loc]!)) c[k] = { ...(c[k] ?? {}), ...v }; save(loc, c); console.log(`✓ ${loc}.json`); }
