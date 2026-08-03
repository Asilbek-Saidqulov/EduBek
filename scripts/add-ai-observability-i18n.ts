/**
 * Add ai-observability i18n keys to en/uz/ru messages.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const KEYS = {
  en: {
    title: "AI Observability",
    description: "AI Control Tower for tracing, analytics, experimentation, drift detection, anomaly detection, optimization, forecasting, and alerting.",
    traces: { title: "Request Tracing", total: "{count} traces", successRate: "Success rate: {value}%" },
    latency: { title: "Latency Analytics", p95: "P95: {value}ms", suggestions: "{count} optimization suggestion(s)" },
    tokens: { title: "Token Analytics", total: "Total tokens: {value}", recommendations: "{count} recommendation(s)" },
    costs: { title: "Cost Analytics", today: "Today: ${value}", forecast: "Forecast: ${value}" },
    routing: { title: "Routing Analytics", confidence: "Routing confidence: {value}", providers: "{count} provider(s) active" },
    experiments: { title: "Experiment Engine", running: "{count} running", completed: "{count} completed" },
    drift: { title: "Drift Monitor", findings: "{count} drift finding(s)", critical: "{count} critical" },
    anomalies: { title: "Anomaly Detection", total: "{count} anomal(ies)", critical: "{count} critical" },
    optimization: { title: "Optimization Engine", recommendations: "{count} recommendation(s)", savings: "Est. savings: ${value}" },
    forecast: { title: "Forecasting", metrics: "{count} metric(s) forecasted", trend: "Trend: {value}" },
    dashboard: { title: "AI Control Tower", requests: "Total requests: {value}", successRate: "Success rate: {value}%" },
    alerts: { title: "Alert Manager", critical: "{count} critical", warning: "{count} warning" },
  },
  uz: {
    title: "AI Kuzatuvi",
    description: "AI nazorat minorasi — kuzatish, tahlil, eksperiment, drift, anomaliya, optimallashtirish, prognoz va ogohlantirish.",
    traces: { title: "So'rovlarni kuzatish", total: "{count} iz", successRate: "Muvaffaqiyat darajasi: {value}%" },
    latency: { title: "Kechikish tahlili", p95: "P95: {value}ms", suggestions: "{count} optimallashtirish taklifi" },
    tokens: { title: "Token tahlili", total: "Jami tokenlar: {value}", recommendations: "{count} tavsiya" },
    costs: { title: "Xarajat tahlili", today: "Bugun: ${value}", forecast: "Prognoz: ${value}" },
    routing: { title: "Yo'naltirish tahlili", confidence: "Yo'naltirish ishonchi: {value}", providers: "{count} provayder faol" },
    experiments: { title: "Eksperiment mexanizmi", running: "{count} ishlamoqda", completed: "{count} tugatilgan" },
    drift: { title: "Drift monitori", findings: "{count} drift topilma", critical: "{count} kritik" },
    anomalies: { title: "Anomaliya aniqlash", total: "{count} anomaliya", critical: "{count} kritik" },
    optimization: { title: "Optimallashtirish mexanizmi", recommendations: "{count} tavsiya", savings: "Taxminiy tejash: ${value}" },
    forecast: { title: "Prognozlash", metrics: "{count} metrika prognoz qilindi", trend: "Trend: {value}" },
    dashboard: { title: "AI Nazorat Minora", requests: "Jami so'rovlar: {value}", successRate: "Muvaffaqiyat: {value}%" },
    alerts: { title: "Ogohlantirish menejeri", critical: "{count} kritik", warning: "{count} ogohlantirish" },
  },
  ru: {
    title: "AI Наблюдаемость",
    description: "Башня контроля AI — отслеживание, аналитика, эксперименты, дрейф, аномалии, оптимизация, прогнозирование и оповещения.",
    traces: { title: "Отслеживание запросов", total: "{count} трассировок", successRate: "Успешность: {value}%" },
    latency: { title: "Аналитика задержек", p95: "P95: {value}мс", suggestions: "{count} предложений" },
    tokens: { title: "Аналитика токенов", total: "Всего токенов: {value}", recommendations: "{count} рекомендаций" },
    costs: { title: "Аналитика затрат", today: "Сегодня: ${value}", forecast: "Прогноз: ${value}" },
    routing: { title: "Аналитика маршрутизации", confidence: "Уверенность: {value}", providers: "{count} провайдеров" },
    experiments: { title: "Движок экспериментов", running: "{count} запущено", completed: "{count} завершено" },
    drift: { title: "Монитор дрейфа", findings: "{count} находок", critical: "{count} критических" },
    anomalies: { title: "Обнаружение аномалий", total: "{count} аномалий", critical: "{count} критических" },
    optimization: { title: "Движок оптимизации", recommendations: "{count} рекомендаций", savings: "Экономия: ${value}" },
    forecast: { title: "Прогнозирование", metrics: "{count} метрик", trend: "Тренд: {value}" },
    dashboard: { title: "Башня контроля AI", requests: "Всего запросов: {value}", successRate: "Успешность: {value}%" },
    alerts: { title: "Менеджер оповещений", critical: "{count} критических", warning: "{count} предупреждений" },
  },
} as const;

for (const locale of ["en", "uz", "ru"] as const) {
  const filePath = join(ROOT, "messages", `${locale}.json`);
  const content = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  content.aiObservability = KEYS[locale];
  writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf-8");
  console.log(`Added aiObservability keys to ${locale}.json`);
}
