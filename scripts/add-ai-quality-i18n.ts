/**
 * Add ai-quality i18n keys to en/uz/ru messages.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const KEYS = {
  en: {
    title: "AI Quality",
    description: "AI evaluation, benchmarking, hallucination detection, citation validation, and quality scoring.",
    benchmarks: {
      title: "Benchmark Library",
      total: "{count} benchmark question(s)",
      categories: "{count} categories covered",
    },
    evaluation: {
      title: "Evaluation Engine",
      metrics: "11 deterministic metrics",
      score: "Overall score: {value}%",
      confidence: "Confidence: {value}%",
      llmFree: "No LLM calls used for evaluation",
    },
    hallucination: {
      title: "Hallucination Detector",
      findings: "{count} finding(s) detected",
      risk: "Risk level: {level}",
      rate: "Rate: {value} per 1000 words",
    },
    citation: {
      title: "Citation Validator",
      integrity: "Citation integrity: {value}%",
      total: "{count} citation(s) checked",
      broken: "{count} broken citation(s)",
    },
    retrieval: {
      title: "Retrieval Evaluator",
      precision: "Precision: {value}",
      recall: "Recall: {value}",
      overall: "Overall retrieval score: {value}",
    },
    regression: {
      title: "Prompt Regression Testing",
      regressions: "{count} regression(s) detected",
      improvements: "{count} improvement(s) detected",
      rollback: "{count} rollback recommendation(s)",
    },
    models: {
      title: "Model Comparator",
      compared: "{count} model(s) compared",
      best: "Best overall: {name}",
    },
    scoring: {
      title: "AI Quality Scoring",
      overall: "Overall quality: {value}/100 (grade {grade})",
      dimensions: "{count} dimensions scored",
    },
    datasets: {
      title: "Dataset Manager",
      total: "{count} dataset(s)",
      questions: "{count} total questions",
      pending: "{count} pending approval(s)",
    },
    leaderboard: {
      title: "AI Quality Leaderboard",
      prompts: "{count} best prompt(s)",
      models: "{count} best model(s)",
      trends: "{count} historical trend(s)",
    },
  },
  uz: {
    title: "AI sifati",
    description: "AI baholash, benchmarking, hallusinatsiya aniqlash, iqtibos tekshirish va sifat baholash.",
    benchmarks: {
      title: "Benchmark kutubxonasi",
      total: "{count} benchmark savol(lar)i",
      categories: "{count} toifa qoplangan",
    },
    evaluation: {
      title: "Baholash mexanizmi",
      metrics: "11 deterministik metrika",
      score: "Umumiy ball: {value}%",
      confidence: "Ishonch: {value}%",
      llmFree: "Baholash uchun LLM chaqiruvi ishlatilmadi",
    },
    hallucination: {
      title: "Hallusinatsiya detektori",
      findings: "{count} topilma aniqlandi",
      risk: "Xavf darajasi: {level}",
      rate: "Daraja: 1000 so'zga {value}",
    },
    citation: {
      title: "Iqtibos validatori",
      integrity: "Iqtibos yaxlitligi: {value}%",
      total: "{count} iqtibos tekshirildi",
      broken: "{count} buzilgan iqtibos",
    },
    retrieval: {
      title: "Qidiruv baholovchisi",
      precision: "Aniqlik: {value}",
      recall: "Esda saqlash: {value}",
      overall: "Umumiy qidiruv balli: {value}",
    },
    regression: {
      title: "Prompt regressiya testi",
      regressions: "{count} regressiya aniqlandi",
      improvements: "{count} yaxshilanish aniqlandi",
      rollback: "{count} rollback tavsiyasi",
    },
    models: {
      title: "Model taqqoslagichi",
      compared: "{count} model taqqoslandi",
      best: "Eng yaxshi: {name}",
    },
    scoring: {
      title: "AI sifat baholash",
      overall: "Umumiy sifat: {value}/100 (daraja {grade})",
      dimensions: "{count} o'lchov baholandi",
    },
    datasets: {
      title: "Ma'lumotlar to'plami menejeri",
      total: "{count} ma'lumotlar to'plami",
      questions: "Jami {count} savol",
      pending: "{count} tasdiqlash kutilmoqda",
    },
    leaderboard: {
      title: "AI sifat reytingi",
      prompts: "{count} eng yaxshi prompt",
      models: "{count} eng yaxshi model",
      trends: "{count} tarixiy trend",
    },
  },
  ru: {
    title: "Качество AI",
    description: "Оценка AI, бенчмаркинг, обнаружение галлюцинаций, проверка цитат и оценка качества.",
    benchmarks: {
      title: "Библиотека бенчмарков",
      total: "{count} вопрос(ов) бенчмарка",
      categories: "{count} категорий покрыто",
    },
    evaluation: {
      title: "Движок оценки",
      metrics: "11 детерминированных метрик",
      score: "Общий балл: {value}%",
      confidence: "Уверенность: {value}%",
      llmFree: "LLM не использовался для оценки",
    },
    hallucination: {
      title: "Детектор галлюцинаций",
      findings: "Обнаружено {count} находок",
      risk: "Уровень риска: {level}",
      rate: "Частота: {value} на 1000 слов",
    },
    citation: {
      title: "Валидатор цитат",
      integrity: "Целостность цитат: {value}%",
      total: "Проверено {count} цитат(ы)",
      broken: "{count} битых цитат",
    },
    retrieval: {
      title: "Оценка поиска",
      precision: "Точность: {value}",
      recall: "Полнота: {value}",
      overall: "Общий балл поиска: {value}",
    },
    regression: {
      title: "Регрессионное тестирование промптов",
      regressions: "Обнаружено {count} регрессий",
      improvements: "Обнаружено {count} улучшений",
      rollback: "{count} рекомендаций по откату",
    },
    models: {
      title: "Сравнение моделей",
      compared: "Сравнено {count} моделей",
      best: "Лучшая: {name}",
    },
    scoring: {
      title: "Оценка качества AI",
      overall: "Общее качество: {value}/100 (оценка {grade})",
      dimensions: "Оценено {count} измерений",
    },
    datasets: {
      title: "Менеджер датасетов",
      total: "{count} датасет(ов)",
      questions: "Всего {count} вопросов",
      pending: "{count} ожидают одобрения",
    },
    leaderboard: {
      title: "Таблица лидеров AI",
      prompts: "{count} лучших промптов",
      models: "{count} лучших моделей",
      trends: "{count} исторических трендов",
    },
  },
} as const;

for (const locale of ["en", "uz", "ru"] as const) {
  const filePath = join(ROOT, "messages", `${locale}.json`);
  const content = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  content.aiQuality = KEYS[locale];
  writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf-8");
  console.log(`Added aiQuality keys to ${locale}.json`);
}
