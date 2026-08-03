/**
 * Add Phase 4F.7 — Platform Intelligence i18n keys to en/uz/ru catalogs.
 */
import * as fs from "node:fs";
import * as path from "node:path";

const MESSAGES_DIR = "/home/z/my-project/messages";

type Catalog = Record<string, any>;
function loadCatalog(locale: string): Catalog {
  return JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf-8"));
}
function saveCatalog(locale: string, catalog: Catalog): void {
  fs.writeFileSync(
    path.join(MESSAGES_DIR, `${locale}.json`),
    JSON.stringify(catalog, null, 2) + "\n",
    "utf-8",
  );
}

const TRANSLATIONS: Record<string, Record<string, any>> = {
  en: {
    platformIntelligence: {
      feedback: {
        recorded: "Feedback recorded",
        batchRecorded: "{count} feedback events recorded",
      },
      learning: {
        recommendation: "Recommendation learning computed",
        search: "Search learning computed",
        prompt: "Prompt learning computed",
        noData: "Not enough data to compute learning",
      },
      experiment: {
        created: "Experiment created",
        started: "Experiment started",
        paused: "Experiment paused",
        finalized: "Experiment finalized — winner: {winner}",
        noWinner: "Experiment finalized — no statistically significant winner",
        assigned: "User assigned to variant {variant}",
      },
      optimization: {
        run: "Optimization cycle completed",
        applied: "Optimization auto-applied (confidence: {confidence})",
        needsApproval: "Optimization requires manual approval (confidence: {confidence})",
      },
      forecast: {
        computed: "Forecast computed",
        dropout: "Predicted dropout probability: {value}%",
        examSuccess: "Predicted exam success rate: {value}%",
        resourcePopularity: "Predicted resource popularity: {value} views",
        marketplaceDemand: "Predicted marketplace demand: {value} purchases",
        teacherWorkload: "Predicted teacher workload: {value} hours",
        aiCreditUsage: "Predicted AI credit usage: {value} credits",
        resourceDecay: "Predicted knowledge decay: {value}%",
        curriculumGaps: "Predicted curriculum gaps: {value}",
        searchTrends: "Predicted search volume: {value}",
        topicPopularity: "Predicted topic popularity: {value}",
      },
      health: {
        checked: "Health check completed",
        healthy: "Subsystem is healthy",
        degraded: "Subsystem is degraded",
        down: "Subsystem is down",
        unknown: "Subsystem status is unknown",
        overallHealthy: "Platform is healthy",
        overallDegraded: "Platform is degraded",
        overallDown: "Platform is down",
      },
      audit: {
        recorded: "Audit event recorded",
        recommendation: "Recommendation audit",
        aiGeneration: "AI generation audit",
        workflowExecution: "Workflow execution audit",
        automationTrigger: "Automation trigger audit",
        optimizationApplied: "Optimization applied audit",
      },
      insight: {
        generated: "{count} platform insights generated",
        acknowledged: "Insight acknowledged",
        curriculumGaps: {
          title: "Curriculum gaps detected",
          description: "Several curriculum standards have no resources mapped to them.",
        },
        refundRisk: {
          title: "High refund risk detected",
          description: "Some marketplace listings have high refund rates.",
        },
        searchAbandonment: {
          title: "High search abandonment rate",
          description: "Users are abandoning many searches without clicking.",
        },
      },
      monitoring: {
        cycleStarted: "Monitoring cycle started",
        cycleCompleted: "Monitoring cycle completed",
        alertTriggered: "Alert triggered for subsystem {subsystem}",
        subsystemDown: "{count} subsystem(s) are down",
      },
      overview: {
        operational: "Platform is operational",
        degraded: "Platform is degraded",
        down: "Platform is down",
      },
      recompute: {
        started: "Recompute started",
        completed: "Recompute completed — {insights} insights, {optimizations} optimizations",
      },
    },
  },
  uz: {
    platformIntelligence: {
      feedback: {
        recorded: "Fikr-mulohaza qayd etildi",
        batchRecorded: "{count} ta fikr-mulohaza qayd etildi",
      },
      learning: {
        recommendation: "Tavsiya o'rganish hisoblandi",
        search: "Qidiruv o'rganish hisoblandi",
        prompt: "Prompt o'rganish hisoblandi",
        noData: "O'rganishni hisoblash uchun yetarli ma'lumot yo'q",
      },
      experiment: {
        created: "Eksperiment yaratildi",
        started: "Eksperiment boshlandi",
        paused: "Eksperiment to'xtatildi",
        finalized: "Eksperiment yakunlandi — g'olib: {winner}",
        noWinner: "Eksperiment yakunlandi — statistik jihatdan ahamiyatli g'olib yo'q",
        assigned: "Foydalanuvchi {variant} variantiga tayinlandi",
      },
      optimization: {
        run: "Optimallashtirish sikli yakunlandi",
        applied: "Optimallashtirish avtomatik qo'llanildi (ishonch: {confidence})",
        needsApproval: "Optimallashtirish qo'lda tasdiqlash talab qiladi (ishonch: {confidence})",
      },
      forecast: {
        computed: "Prognoz hisoblandi",
        dropout: "Tark etish ehtimoli: {value}%",
        examSuccess: "Imtihon muvaffaqiyat darajasi: {value}%",
        resourcePopularity: "Resurs mashhurligi: {value} ko'rish",
        marketplaceDemand: "Bozor talabi: {value} xarid",
        teacherWorkload: "O'qituvchi yuklamasi: {value} soat",
        aiCreditUsage: "AI kredit ishlatish: {value} kredit",
        resourceDecay: "Bilim parchalanishi: {value}%",
        curriculumGaps: "O'quv reja bo'shliqlari: {value}",
        searchTrends: "Qidiruv hajmi: {value}",
        topicPopularity: "Mavzu mashhurligi: {value}",
      },
      health: {
        checked: "Sog'liqni saqlash tekshiruvi yakunlandi",
        healthy: "Pastki tizim sog'lom",
        degraded: "Pastki tizim zaiflashgan",
        down: "Pastki tizim ishlamayapti",
        unknown: "Pastki tizim holati noma'lum",
        overallHealthy: "Platforma sog'lom",
        overallDegraded: "Platforma zaiflashgan",
        overallDown: "Platforma ishlamayapti",
      },
      audit: {
        recorded: "Audit hodisasi qayd etildi",
        recommendation: "Tavsiya auditi",
        aiGeneration: "AI yaratish auditi",
        workflowExecution: "Workflow bajarish auditi",
        automationTrigger: "Avtomatlashtirish auditi",
        optimizationApplied: "Optimallashtirish qo'llanish auditi",
      },
      insight: {
        generated: "{count} ta platforma tahlili yaratildi",
        acknowledged: "Tahlil tasdiqlandi",
        curriculumGaps: {
          title: "O'quv reja bo'shliqlari aniqlandi",
          description: "Bir nechta o'quv reja standartlariga resurslar moslashtirilmagan.",
        },
        refundRisk: {
          title: "Yuqori qaytarish xavfi aniqlandi",
          description: "Ba'zi bozor e'lonlari yuqori qaytarish darajasiga ega.",
        },
        searchAbandonment: {
          title: "Yuqori qidiruvdan voz kechish darajasi",
          description: "Foydalanuvchilar ko'plab qidiruvlarni bosmasdan tark etishmoqda.",
        },
      },
      monitoring: {
        cycleStarted: "Monitoring sikli boshlandi",
        cycleCompleted: "Monitoring sikli yakunlandi",
        alertTriggered: "Pastki tizim {subsystem} uchun ogohlantirish",
        subsystemDown: "{count} ta pastki tizim ishlamayapti",
      },
      overview: {
        operational: "Platforma ishlamoqda",
        degraded: "Platforma zaiflashgan",
        down: "Platforma ishlamayapti",
      },
      recompute: {
        started: "Qayta hisoblash boshlandi",
        completed: "Qayta hisoblash yakunlandi — {insights} tahlil, {optimizations} optimallashtirish",
      },
    },
  },
  ru: {
    platformIntelligence: {
      feedback: {
        recorded: "Отзыв записан",
        batchRecorded: "Записано {count} отзывов",
      },
      learning: {
        recommendation: "Анализ рекомендаций выполнен",
        search: "Анализ поиска выполнен",
        prompt: "Анализ промптов выполнен",
        noData: "Недостаточно данных для анализа",
      },
      experiment: {
        created: "Эксперимент создан",
        started: "Эксперимент запущен",
        paused: "Эксперимент приостановлен",
        finalized: "Эксперимент завершён — победитель: {winner}",
        noWinner: "Эксперимент завершён — нет статистически значимого победителя",
        assigned: "Пользователь назначен на вариант {variant}",
      },
      optimization: {
        run: "Цикл оптимизации завершён",
        applied: "Оптимизация применена автоматически (уверенность: {confidence})",
        needsApproval: "Оптимизация требует ручного подтверждения (уверенность: {confidence})",
      },
      forecast: {
        computed: "Прогноз вычислен",
        dropout: "Вероятность отсева: {value}%",
        examSuccess: "Прогноз экзаменационной успеваемости: {value}%",
        resourcePopularity: "Прогноз популярности ресурса: {value} просмотров",
        marketplaceDemand: "Прогноз спроса магазина: {value} покупок",
        teacherWorkload: "Прогноз нагрузки учителя: {value} часов",
        aiCreditUsage: "Прогноз использования AI-кредитов: {value}",
        resourceDecay: "Прогноз затухания знаний: {value}%",
        curriculumGaps: "Прогноз пробелов учебной программы: {value}",
        searchTrends: "Прогноз объёма поиска: {value}",
        topicPopularity: "Прогноз популярности темы: {value}",
      },
      health: {
        checked: "Проверка здоровья завершена",
        healthy: "Подсистема здорова",
        degraded: "Подсистема деградирована",
        down: "Подсистема недоступна",
        unknown: "Статус подсистемы неизвестен",
        overallHealthy: "Платформа здорова",
        overallDegraded: "Платформа деградирована",
        overallDown: "Платформа недоступна",
      },
      audit: {
        recorded: "Событие аудита записано",
        recommendation: "Аудит рекомендации",
        aiGeneration: "Аудит AI-генерации",
        workflowExecution: "Аудит выполнения workflow",
        automationTrigger: "Аудит автоматизации",
        optimizationApplied: "Аудит применения оптимизации",
      },
      insight: {
        generated: "Сгенерировано {count} инсайтов платформы",
        acknowledged: "Инсайт подтверждён",
        curriculumGaps: {
          title: "Обнаружены пробелы учебной программы",
          description: "Несколько стандартов не имеют сопоставленных ресурсов.",
        },
        refundRisk: {
          title: "Обнаружен высокий риск возвратов",
          description: "Некоторые объявления магазина имеют высокий уровень возвратов.",
        },
        searchAbandonment: {
          title: "Высокий уровень отказов от поиска",
          description: "Пользователи покидают многие поисковые запросы без клика.",
        },
      },
      monitoring: {
        cycleStarted: "Цикл мониторинга начат",
        cycleCompleted: "Цикл мониторинга завершён",
        alertTriggered: "Оповещение для подсистемы {subsystem}",
        subsystemDown: "{count} подсистем недоступны",
      },
      overview: {
        operational: "Платформа работает",
        degraded: "Платформа деградирована",
        down: "Платформа недоступна",
      },
      recompute: {
        started: "Пересчёт начат",
        completed: "Пересчёт завершён — {insights} инсайтов, {optimizations} оптимизаций",
      },
    },
  },
};

const locales = ["en", "uz", "ru"];
for (const locale of locales) {
  const catalog = loadCatalog(locale);
  const newKeys = TRANSLATIONS[locale]!;
  for (const [topKey, value] of Object.entries(newKeys)) {
    catalog[topKey] = { ...(catalog[topKey] ?? {}), ...value };
  }
  saveCatalog(locale, catalog);
  console.log(`✓ Updated ${locale}.json`);
}
console.log("\nAll locale catalogs updated.");
