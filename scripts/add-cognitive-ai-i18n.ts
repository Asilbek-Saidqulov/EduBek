/**
 * Add cognitive-ai i18n keys to en/uz/ru messages.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const KEYS = {
  en: {
    title: "Cognitive AI",
    description: "Long-horizon reasoning, multi-level memory, and autonomous educational decision engine.",
    memory: {
      working: "Working Memory",
      episodic: "Episodic Memory",
      semantic: "Semantic Memory",
      recorded: "Memory recorded",
      retrieved: "Memory retrieved — {count} entries",
      expired: "Working memory entries expired — {count} evicted",
    },
    reasoning: {
      start: "Reasoning started",
      complete: "Reasoning complete — confidence {confidence}%, {evidence} evidence, {duration}ms",
      stage_complete: "Stage {stage} completed in {duration}ms",
      stage_failed: "Stage {stage} failed: {error}",
      llm_invoked: "LLM was invoked for this reasoning",
      deterministic: "Answer generated deterministically (no LLM)",
    },
    planning: {
      created: "Plan created — {nodes} nodes, {duration} min estimated",
      template_selected: "Plan template selected: {template}",
      no_template: "No matching plan template found",
    },
    goals: {
      created: "Goal created: {title}",
      ranked: "Goals ranked for context",
      progress_updated: "Goal progress updated to {progress}%",
      achieved: "Goal achieved: {title}",
    },
    retrieval: {
      start: "Retrieving evidence from {sources} sources",
      complete: "Retrieved {evidence} evidence items from {sources} sources ({duplicates} duplicates removed)",
    },
    tools: {
      selected: "Selected {count} tools — estimated cost ${cost}",
      rejected: "Rejected {count} tools",
      llm_required: "LLM call required for selected tools",
    },
    decision: {
      evaluated: "Decision evaluated — {count} options considered",
      chosen: "Chosen: {option} (score {score}/100, confidence {confidence}%)",
    },
    uncertainty: {
      estimated: "Uncertainty estimated — confidence {confidence}%",
      missing: "Missing information: {items}",
      next_questions: "Suggested next questions: {questions}",
    },
    verification: {
      verified: "Answer verified — all checks passed",
      inconsistencies: "Inconsistencies found — {count} check(s) failed",
      repaired: "Inconsistencies repaired automatically",
      cannot_deliver: "Answer cannot be delivered — verification failed",
    },
    reflection: {
      recorded: "Reflection recorded — overall score {score}",
      lessons: "Lessons learned: {count}",
      memory_update: "Memory update recommended",
    },
    explanation: {
      built: "Explanation built — {evidence} evidence, {alternatives} alternatives",
      summary: "Confidence {confidence}%, cost ${cost}, {time_saved} min saved",
    },
    conversation: {
      started: "Conversation started",
      updated: "Conversation state updated",
      ended: "Conversation ended",
    },
    learning: {
      cycle_complete: "Learning cycle complete — {count} updates applied",
      parameter_set: "Parameter {key} set to {value}",
      cache_cleared: "Reasoning cache cleared",
    },
    analytics: {
      generated: "Cognitive analytics generated",
      avg_latency: "Average reasoning latency: {value}ms",
      success_rate: "AI success rate: {value}%",
      llm_saved: "LLM calls saved: {count}",
    },
  },
  uz: {
    title: "Kognitiv AI",
    description: "Uzoq muddatli mulohaza, ko'p darajali xotira va avtonom ta'lim qarorlar mexanizmi.",
    memory: {
      working: "Ishchi xotira",
      episodic: "Epizodik xotira",
      semantic: "Semantik xotira",
      recorded: "Xotira yozildi",
      retrieved: "Xotira olindi — {count} yozuv",
      expired: "Ishchi xotira yozuvlari muddati o'tdi — {count} tozalandi",
    },
    reasoning: {
      start: "Mulohaza boshlandi",
      complete: "Mulohaza yakunlandi — ishonch {confidence}%, {evidence} dalil, {duration}ms",
      stage_complete: "{stage} bosqichi {duration}ms da yakunlandi",
      stage_failed: "{stage} bosqichi xato: {error}",
      llm_invoked: "Bu mulohaza uchun LLM chaqirildi",
      deterministic: "Javob deterministik tarzda yaratildi (LLM yo'q)",
    },
    planning: {
      created: "Reja yaratildi — {nodes} tugun, {duration} daqiqa taxminiy",
      template_selected: "Reja shabloni tanlandi: {template}",
      no_template: "Mos reja shabloni topilmadi",
    },
    goals: {
      created: "Maqsad yaratildi: {title}",
      ranked: "Kontekst uchun maqsadlar reytinglandi",
      progress_updated: "Maqsad progressi {progress}% ga yangilandi",
      achieved: "Maqsadga erishildi: {title}",
    },
    retrieval: {
      start: "{sources} manbadan dalil olinmoqda",
      complete: "{sources} manbadan {evidence} dalil olindi ({duplicates} dublikat olib tashlandi)",
    },
    tools: {
      selected: "{count} vosita tanlandi — taxminiy xarajat ${cost}",
      rejected: "{count} vosita rad etildi",
      llm_required: "Tanlangan vositalar uchun LLM chaqiruvi talab qilinadi",
    },
    decision: {
      evaluated: "Qaror baholandi — {count} variant ko'rib chiqildi",
      chosen: "Tanlandi: {option} (ball {score}/100, ishonch {confidence}%)",
    },
    uncertainty: {
      estimated: "Noaniqlik baholandi — ishonch {confidence}%",
      missing: "Yetishmayotgan ma'lumot: {items}",
      next_questions: "Keyingi tavsiya qilingan savollar: {questions}",
    },
    verification: {
      verified: "Javob tasdiqlandi — barcha tekshiruvlar o'tdi",
      inconsistencies: "Nomuvofiqliklar topildi — {count} tekshiruv xato",
      repaired: "Nomuvofiqliklar avtomatik tuzatildi",
      cannot_deliver: "Javob yetkazib bo'lmaydi — tasdiqlash xato",
    },
    reflection: {
      recorded: "Refleksiya yozildi — umumiy ball {score}",
      lessons: "Olingan saboqlar: {count}",
      memory_update: "Xotirani yangilash tavsiya etiladi",
    },
    explanation: {
      built: "Tushuntirish qurildi — {evidence} dalil, {alternatives} alternativa",
      summary: "Ishonch {confidence}%, xarajat ${cost}, {time_saved} daqiqa tejaldi",
    },
    conversation: {
      started: "Suhbat boshlandi",
      updated: "Suhbat holati yangilandi",
      ended: "Suhbat yakunlandi",
    },
    learning: {
      cycle_complete: "O'rganish tsikli yakunlandi — {count} yangilanish qo'llandi",
      parameter_set: "{key} parametri {value} ga o'rnatildi",
      cache_cleared: "Mulohaza keshi tozalandi",
    },
    analytics: {
      generated: "Kognitiv tahlil yaratildi",
      avg_latency: "O'rtacha mulohaza kechikishi: {value}ms",
      success_rate: "AI muvaffaqiyat darajasi: {value}%",
      llm_saved: "Tejalgan LLM chaqiruvlari: {count}",
    },
  },
  ru: {
    title: "Когнитивный ИИ",
    description: "Долгосрочное рассуждение, многоуровневая память и автономный движок образовательных решений.",
    memory: {
      working: "Рабочая память",
      episodic: "Эпизодическая память",
      semantic: "Семантическая память",
      recorded: "Память записана",
      retrieved: "Память извлечена — {count} записей",
      expired: "Записи рабочей памяти истекли — {count} удалено",
    },
    reasoning: {
      start: "Рассуждение начато",
      complete: "Рассуждение завершено — уверенность {confidence}%, {evidence} доказательств, {duration}мс",
      stage_complete: "Этап {stage} завершён за {duration}мс",
      stage_failed: "Этап {stage} failed: {error}",
      llm_invoked: "Для этого рассуждения был вызван LLM",
      deterministic: "Ответ сгенерирован детерминированно (без LLM)",
    },
    planning: {
      created: "План создан — {nodes} узлов, {duration} мин оценочно",
      template_selected: "Выбран шаблон плана: {template}",
      no_template: "Подходящий шаблон плана не найден",
    },
    goals: {
      created: "Цель создана: {title}",
      ranked: "Цели ранжированы для контекста",
      progress_updated: "Прогресс цели обновлён до {progress}%",
      achieved: "Цель достигнута: {title}",
    },
    retrieval: {
      start: "Извлечение доказательств из {sources} источников",
      complete: "Извлечено {evidence} доказательств из {sources} источников ({duplicates} дубликатов удалено)",
    },
    tools: {
      selected: "Выбрано {count} инструментов — оценочная стоимость ${cost}",
      rejected: "Отклонено {count} инструментов",
      llm_required: "Для выбранных инструментов требуется вызов LLM",
    },
    decision: {
      evaluated: "Решение оценено — рассмотрено {count} вариантов",
      chosen: "Выбрано: {option} (балл {score}/100, уверенность {confidence}%)",
    },
    uncertainty: {
      estimated: "Неопределённость оценена — уверенность {confidence}%",
      missing: "Отсутствующая информация: {items}",
      next_questions: "Предложенные следующие вопросы: {questions}",
    },
    verification: {
      verified: "Ответ проверен — все проверки пройдены",
      inconsistencies: "Найдены несоответствия — {count} проверок failed",
      repaired: "Несоответствия автоматически исправлены",
      cannot_deliver: "Ответ не может быть доставлен — проверка failed",
    },
    reflection: {
      recorded: "Рефлексия записана — общий балл {score}",
      lessons: "Полученные уроки: {count}",
      memory_update: "Рекомендуется обновить память",
    },
    explanation: {
      built: "Объяснение построено — {evidence} доказательств, {alternatives} альтернатив",
      summary: "Уверенность {confidence}%, стоимость ${cost}, {time_saved} мин сэкономлено",
    },
    conversation: {
      started: "Разговор начат",
      updated: "Состояние разговора обновлено",
      ended: "Разговор завершён",
    },
    learning: {
      cycle_complete: "Цикл обучения завершён — {count} обновлений применено",
      parameter_set: "Параметр {key} установлен в {value}",
      cache_cleared: "Кэш рассуждений очищен",
    },
    analytics: {
      generated: "Когнитивная аналитика сгенерирована",
      avg_latency: "Средняя задержка рассуждения: {value}мс",
      success_rate: "Успешность ИИ: {value}%",
      llm_saved: "Сохранено вызовов LLM: {count}",
    },
  },
} as const;

for (const locale of ["en", "uz", "ru"] as const) {
  const filePath = join(ROOT, "messages", `${locale}.json`);
  const content = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  content.cognitiveAi = KEYS[locale];
  writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf-8");
  console.log(`Added cognitiveAi keys to ${locale}.json`);
}
