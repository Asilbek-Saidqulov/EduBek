/**
 * Add ai-governance i18n keys to en/uz/ru messages.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const KEYS = {
  en: {
    title: "AI Governance",
    description: "AI governance, safety, compliance, privacy, risk, approvals, audit, explainability, and trust.",
    policies: { title: "Policy Engine", total: "{count} policies", active: "{count} active" },
    safety: { title: "Safety Engine", findings: "{count} finding(s)", score: "Safety score: {value}/100" },
    privacy: { title: "Privacy Engine", findings: "{count} finding(s)", score: "Privacy score: {value}/100" },
    compliance: { title: "Compliance Engine", score: "Compliance score: {value}/100", frameworks: "GDPR, FERPA, COPPA, ISO 27001, SOC2" },
    risk: { title: "Risk Engine", score: "Risk score: {value}/100", critical: "{count} critical risk(s)" },
    approvals: { title: "Approval Workflows", pending: "{count} pending", approved: "{count} approved" },
    audit: { title: "Governance Audit", entries: "{count} audit entries" },
    explainability: { title: "Explainability", confidence: "Confidence: {value}" },
    access: { title: "Access Governance", policies: "{count} access policies" },
    models: { title: "Model Governance", total: "{count} models", approved: "{count} approved" },
    dashboard: { title: "Governance Dashboard", compliance: "Compliance: {value}/100", maturity: "AI maturity: {value}/100" },
    reports: { title: "Governance Reports", types: "8 report types available" },
  },
  uz: {
    title: "AI Boshqaruvi",
    description: "AI boshqaruvi, xavfsizlik, moslik, maxfiylik, xavf, tasdiqlash, audit, tushuntirish va ishonch.",
    policies: { title: "Siyosat mexanizmi", total: "{count} siyosat", active: "{count} faol" },
    safety: { title: "Xavfsizlik mexanizmi", findings: "{count} topilma", score: "Xavfsizlik balli: {value}/100" },
    privacy: { title: "Maxfiylik mexanizmi", findings: "{count} topilma", score: "Maxfiylik balli: {value}/100" },
    compliance: { title: "Moslik mexanizmi", score: "Moslik balli: {value}/100", frameworks: "GDPR, FERPA, COPPA, ISO 27001, SOC2" },
    risk: { title: "Xavf mexanizmi", score: "Xavf balli: {value}/100", critical: "{count} kritik xavf" },
    approvals: { title: "Tasdiqlash jarayonlari", pending: "{count} kutilmoqda", approved: "{count} tasdiqlangan" },
    audit: { title: "Boshqaruv auditi", entries: "{count} audit yozuvlari" },
    explainability: { title: "Tushuntirish", confidence: "Ishonch: {value}" },
    access: { title: "Kirish boshqaruvi", policies: "{count} kirish siyosati" },
    models: { title: "Model boshqaruvi", total: "{count} model", approved: "{count} tasdiqlangan" },
    dashboard: { title: "Boshqaruv paneli", compliance: "Moslik: {value}/100", maturity: "AI etukligi: {value}/100" },
    reports: { title: "Boshqaruv hisobotlari", types: "8 hisobot turi mavjud" },
  },
  ru: {
    title: "AI Управление",
    description: "AI управление, безопасность, соответствие, конфиденциальность, риск, утверждения, аудит, объяснимость и доверие.",
    policies: { title: "Движок политик", total: "{count} политик", active: "{count} активных" },
    safety: { title: "Движок безопасности", findings: "{count} находок", score: "Безопасность: {value}/100" },
    privacy: { title: "Движок конфиденциальности", findings: "{count} находок", score: "Конфиденциальность: {value}/100" },
    compliance: { title: "Движок соответствия", score: "Соответствие: {value}/100", frameworks: "GDPR, FERPA, COPPA, ISO 27001, SOC2" },
    risk: { title: "Движок рисков", score: "Риск: {value}/100", critical: "{count} критических рисков" },
    approvals: { title: "Рабочие процессы утверждений", pending: "{count} ожидает", approved: "{count} утверждено" },
    audit: { title: "Аудит управления", entries: "{count} записей аудита" },
    explainability: { title: "Объяснимость", confidence: "Уверенность: {value}" },
    access: { title: "Управление доступом", policies: "{count} политик доступа" },
    models: { title: "Управление моделями", total: "{count} моделей", approved: "{count} утверждено" },
    dashboard: { title: "Панель управления", compliance: "Соответствие: {value}/100", maturity: "Зрелость AI: {value}/100" },
    reports: { title: "Отчёты управления", types: "Доступно 8 типов отчётов" },
  },
} as const;

for (const locale of ["en", "uz", "ru"] as const) {
  const filePath = join(ROOT, "messages", `${locale}.json`);
  const content = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  content.aiGovernance = KEYS[locale];
  writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf-8");
  console.log(`Added aiGovernance keys to ${locale}.json`);
}
