import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const ROOT = process.cwd();
const KEYS = {
  en: { title: "Enterprise Operations", description: "Enterprise commercial platform — tenants, subscriptions, billing, contracts, procurement, customer success, renewals, revenue analytics, deployments, and reporting.",
    tenants: { title: "Tenant Manager", total: "{count} tenants" },
    subscriptions: { title: "Subscriptions", active: "{count} active", mrr: "MRR: ${value}" },
    billing: { title: "Billing", revenue: "Revenue: ${value}", refunds: "Refunds: ${value}" },
    invoices: { title: "Invoices", issued: "{count} issued", outstanding: "Outstanding: ${value}" },
    contracts: { title: "Contracts", active: "{count} active", value: "Total value: ${value}" },
    procurement: { title: "Procurement", open: "{count} open POs" },
    customers: { title: "Customer Success", health: "Avg health: {value}/100", atRisk: "{count} at risk" },
    renewals: { title: "Renewal Intelligence", upcoming: "{count} upcoming", churn: "{count} churn risk" },
    health: { title: "Organization Health", score: "Health: {value}/100" },
    revenue: { title: "Revenue Analytics", mrr: "MRR: ${value}", arr: "ARR: ${value}", ltv: "LTV: ${value}" },
    deployments: { title: "Deployment Manager", total: "{count} deployments", active: "{count} active" },
    dashboard: { title: "Enterprise Dashboard", orgs: "{count} organizations", revenue: "Revenue: ${value}" },
    forecast: { title: "Business Forecasting", metrics: "{count} metrics forecasted" },
    reports: { title: "Business Reports", types: "7 report types available" },
  },
  uz: { title: "Korxona Operatsiyalari", description: "Korxona tijorat platformasi — ijaraçilar, obunalar, to'lovlar, shartnomalar, xaridlar, mijoz muvaffaqiyati, yangilashlar, daromad tahlili, joylashtirish va hisobotlar.",
    tenants: { title: "Ijarachi Menejeri", total: "{count} ijarachi" },
    subscriptions: { title: "Obunalar", active: "{count} faol", mrr: "MRR: ${value}" },
    billing: { title: "To'lovlar", revenue: "Daromad: ${value}", refunds: "Qaytarib berish: ${value}" },
    invoices: { title: "Invoyslar", issued: "{count} chiqarilgan", outstanding: "Qarz: ${value}" },
    contracts: { title: "Shartnomalar", active: "{count} faol", value: "Umumiy qiymat: ${value}" },
    procurement: { title: "Xaridlar", open: "{count} ochiq PO" },
    customers: { title: "Mijoz Muvaffaqiyati", health: "O'rtacha salomatlik: {value}/100", atRisk: "{count} xavf ostida" },
    renewals: { title: "Yangilash Intellekti", upcoming: "{count} yaqinlashmoqda", churn: "{count} churn xavfi" },
    health: { title: "Tashkilot Salomatligi", score: "Salomatlik: {value}/100" },
    revenue: { title: "Daromad Tahlili", mrr: "MRR: ${value}", arr: "ARR: ${value}", ltv: "LTV: ${value}" },
    deployments: { title: "Joylashtirish Menejeri", total: "{count} joylashtirish", active: "{count} faol" },
    dashboard: { title: "Korxona Paneli", orgs: "{count} tashkilot", revenue: "Daromad: ${value}" },
    forecast: { title: "Biznes Prognozi", metrics: "{count} metrika prognoz qilindi" },
    reports: { title: "Biznes Hisobotlari", types: "7 hisobot turi mavjud" },
  },
  ru: { title: "Корпоративные Операции", description: "Корпоративная коммерческая платформа — арендаторы, подписки, биллинг, контракты, закупки, успех клиентов, продления, аналитика доходов, развёртывания и отчёты.",
    tenants: { title: "Менеджер Арендаторов", total: "{count} арендаторов" },
    subscriptions: { title: "Подписки", active: "{count} активных", mrr: "MRR: ${value}" },
    billing: { title: "Биллинг", revenue: "Доход: ${value}", refunds: "Возвраты: ${value}" },
    invoices: { title: "Счета", issued: "{count} выставлено", outstanding: "Задолженность: ${value}" },
    contracts: { title: "Контракты", active: "{count} активных", value: "Общая стоимость: ${value}" },
    procurement: { title: "Закупки", open: "{count} открытых PO" },
    customers: { title: "Успех Клиентов", health: "Ср. здоровье: {value}/100", atRisk: "{count} в зоне риска" },
    renewals: { title: "Интеллект Продлений", upcoming: "{count} предстоящих", churn: "{count} риск оттока" },
    health: { title: "Здоровье Организации", score: "Здоровье: {value}/100" },
    revenue: { title: "Аналитика Доходов", mrr: "MRR: ${value}", arr: "ARR: ${value}", ltv: "LTV: ${value}" },
    deployments: { title: "Менеджер Развёртывания", total: "{count} развёртываний", active: "{count} активных" },
    dashboard: { title: "Корпоративная Панель", orgs: "{count} организаций", revenue: "Доход: ${value}" },
    forecast: { title: "Бизнес Прогнозирование", metrics: "{count} метрик прогнозировано" },
    reports: { title: "Бизнес Отчёты", types: "Доступно 7 типов отчётов" },
  },
} as const;
for (const locale of ["en", "uz", "ru"] as const) {
  const filePath = join(ROOT, "messages", `${locale}.json`);
  const content = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  content.enterpriseOperations = KEYS[locale];
  writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf-8");
  console.log(`Added enterpriseOperations keys to ${locale}.json`);
}
