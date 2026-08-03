import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const ROOT = process.cwd();
const KEYS = {
  en: { title: "Workflow Automation", description: "Business process orchestration and no-code automation platform.",
    builder: { title: "Workflow Builder", total: "{count} workflows", active: "{count} active", draft: "{count} draft" },
    triggers: { title: "Trigger Engine", total: "{count} triggers" },
    conditions: { title: "Condition Engine", operators: "14 operators + 3 logical" },
    actions: { title: "Action Engine", total: "{count} actions" },
    executions: { title: "Execution Engine", modes: "live, simulation, dry_run" },
    scheduler: { title: "Scheduler", total: "{count} schedules" },
    approvals: { title: "Approval Engine", pending: "{count} pending" },
    monitoring: { title: "Monitoring", running: "{count} running", successRate: "Success rate: {value}%" },
    templates: { title: "Template Library", total: "{count} templates" },
    analytics: { title: "Analytics", savings: "{count} hours saved", stepsAvoided: "{count} manual steps avoided" },
    dashboard: { title: "Automation Dashboard", maturity: "Maturity score: {value}/100" },
  },
  uz: { title: "Workflow Avtomatlashtirish", description: "Biznes jarayonlarni orkestratsiya qilish va no-code avtomatlashtirish platformasi.",
    builder: { title: "Workflow konstruktori", total: "{count} workflow", active: "{count} faol", draft: "{count} qoralama" },
    triggers: { title: "Trigger mexanizmi", total: "{count} trigger" },
    conditions: { title: "Shart mexanizmi", operators: "14 operator + 3 mantiqiy" },
    actions: { title: "Action mexanizmi", total: "{count} action" },
    executions: { title: "Bajarish mexanizmi", modes: "live, simulyatsiya, dry_run" },
    scheduler: { title: "Rejalashtiruvchi", total: "{count} reja" },
    approvals: { title: "Tasdiqlash mexanizmi", pending: "{count} kutilmoqda" },
    monitoring: { title: "Monitoring", running: "{count} ishlamoqda", successRate: "Muvaffaqiyat: {value}%" },
    templates: { title: "Shablon kutubxonasi", total: "{count} shablon" },
    analytics: { title: "Analitika", savings: "{count} soat tejaldi", stepsAvoided: "{count} qo'lda qadamlar tejaldi" },
    dashboard: { title: "Avtomatlashtirish paneli", maturity: "Etuklik balli: {value}/100" },
  },
  ru: { title: "Автоматизация Рабочих Процессов", description: "Оркестрация бизнес-процессов и платформа автоматизации без кода.",
    builder: { title: "Конструктор процессов", total: "{count} процессов", active: "{count} активных", draft: "{count} черновиков" },
    triggers: { title: "Движок триггеров", total: "{count} триггеров" },
    conditions: { title: "Движок условий", operators: "14 операторов + 3 логических" },
    actions: { title: "Движок действий", total: "{count} действий" },
    executions: { title: "Движок выполнения", modes: "live, симуляция, dry_run" },
    scheduler: { title: "Планировщик", total: "{count} расписаний" },
    approvals: { title: "Движок утверждений", pending: "{count} ожидает" },
    monitoring: { title: "Мониторинг", running: "{count} выполняется", successRate: "Успех: {value}%" },
    templates: { title: "Библиотека шаблонов", total: "{count} шаблонов" },
    analytics: { title: "Аналитика", savings: "{count} часов сэкономлено", stepsAvoided: "{count} ручных шагов избежано" },
    dashboard: { title: "Панель автоматизации", maturity: "Оценка зрелости: {value}/100" },
  },
} as const;
for (const locale of ["en", "uz", "ru"] as const) {
  const filePath = join(ROOT, "messages", `${locale}.json`);
  const content = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  content.workflowAutomation = KEYS[locale];
  writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf-8");
  console.log(`Added workflowAutomation keys to ${locale}.json`);
}
