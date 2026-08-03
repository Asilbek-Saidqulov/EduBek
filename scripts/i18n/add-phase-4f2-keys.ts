/**
 * Add Phase 4F.2 — Discovery & Recommendation i18n keys
 * to all three locale catalogs (en, uz, ru).
 */
import * as fs from "node:fs";
import * as path from "node:path";

const MESSAGES_DIR = "/home/z/my-project/messages";

type Catalog = Record<string, any>;

function loadCatalog(locale: string): Catalog {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function saveCatalog(locale: string, catalog: Catalog): void {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  fs.writeFileSync(filePath, JSON.stringify(catalog, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Translation catalogs for Phase 4F.2 — Discovery & Recommendations
// ---------------------------------------------------------------------------

const TRANSLATIONS: Record<string, Record<string, any>> = {
  en: {
    discovery: {
      feed: {
        continueLearning: "Continue Learning",
        continueLearningReason: "Continue where you left off",
        recommendedToday: "Recommended Today",
        popularReason: "Popular with learners",
        weakTopics: "Practice Weak Topics",
        weakTopicReason: "You scored below 50% on this topic",
        nextPrerequisites: "Next Prerequisites",
        prerequisiteReason: "Required prerequisite for your next topic",
        trending: "Trending",
        trendingReason: "Recently trending",
        marketplacePicks: "Marketplace Picks",
        marketplaceReason: "High-quality marketplace resource",
        aiRecommendations: "AI Recommendations",
        aiReason: "Based on your interests",
        teacherRecommendations: "Teacher Recommendations",
        teacherReason: "Recommended by your teacher",
        organizationResources: "Organization Resources",
        organizationReason: "From your organization",
        recentlyUpdated: "Recently Updated",
        recentlyUpdatedReason: "Recently updated content",
      },
      nextStep: {
        learnPrerequisite: "Learn prerequisite",
        practiceWeak: "Practice weak topic",
        reviewForgotten: "Review forgotten topic",
        continueTopic: "Continue topic",
        advanceTopic: "Advance to next topic",
        popular: "Popular with learners",
        explanation: {
          prerequisiteRequired: "This topic is required before studying the next one",
          prerequisiteLowMastery: "Your mastery of this prerequisite is currently low",
          weakTopicScore: "You scored below 50% on this topic",
          practiceHelps: "Targeted practice will help close this gap",
          forgottenTime: "It's been a while since you reviewed this topic",
          reviewPreventsDecay: "Periodic review prevents knowledge decay",
          currentlyLearning: "You're currently learning this topic",
          continueBuildsMastery: "Continue to build mastery",
          masteredTopic: "You've mastered this topic",
          naturalNextStep: "This is the natural next step",
          popularWithLearners: "Popular with other learners",
          highQuality: "High-quality content",
        },
      },
      explanation: {
        interestMatch: "Matches your interest in {interest}",
        masteryWeak: "Your mastery is weak — practice recommended",
        masteryStrong: "You've mastered this topic",
        quality: "Quality score: {percent}%",
        popularity: "Popularity: {percent}%",
        graphProximity: "Connected to {count} related topics",
        prerequisitesMet: "You've mastered all prerequisites",
        default: "Recommended for you",
      },
      intent: {
        learn_concept: "Learning a concept",
        prepare_exam: "Preparing for an exam",
        find_worksheet: "Finding a worksheet",
        generate_quiz: "Generating a quiz",
        create_lesson: "Creating a lesson plan",
        review_mistakes: "Reviewing mistakes",
        homework_help: "Homework help",
        research: "Deep research",
      },
      providers: {
        hash: "Built-in hash embeddings (default)",
        gemini: "Google Gemini embeddings",
        openai: "OpenAI embeddings",
        voyage: "Voyage AI embeddings",
        cohere: "Cohere embeddings",
        jina: "Jina AI embeddings",
        nomic: "Nomic embeddings",
        local: "Local sentence-transformer model",
        edubek: "EduBek proprietary embeddings",
      },
    },
    semanticSearch: {
      title: "Semantic Search",
      detectedIntent: "Detected intent: {intent}",
      confidence: "Confidence: {percent}%",
      expandedTerms: "Also searched for: {terms}",
      responseTime: "Response time: {ms}ms",
      noResults: "No semantic matches found",
      weights: "Ranking weights",
      resultCount: "{count} results found",
    },
    recommendation: {
      impression: "Impression",
      click: "Click",
      open: "Open",
      complete: "Complete",
      ignore: "Ignore",
      dismiss: "Dismiss",
      helpful: "Helpful",
      notHelpful: "Not helpful",
      whyRecommended: "Why was this recommended?",
      overallScore: "Overall recommendation score: {percent}%",
      analytics: {
        clickThroughRate: "Click-through rate: {percent}%",
        helpfulRate: "Helpful rate: {percent}%",
        totalImpressions: "Total impressions: {count}",
        totalClicks: "Total clicks: {count}",
      },
    },
  },
  uz: {
    discovery: {
      feed: {
        continueLearning: "O'rganishni davom ettiring",
        continueLearningReason: "Qoldirgan joyingizdan davom eting",
        recommendedToday: "Bugun tavsiya etiladi",
        popularReason: "O'quvchilar orasida mashhur",
        weakTopics: "Zaif mavzularda mashq qiling",
        weakTopicReason: "Bu mavzuda 50% dan past ball oldingiz",
        nextPrerequisites: "Keyingi oldindan talablar",
        prerequisiteReason: "Keyingi mavzuingiz uchun zarur oldindan talab",
        trending: "Trendda",
        trendingReason: "Yaqinda trendda bo'ldi",
        marketplacePicks: "Bozor tanlovlari",
        marketplaceReason: "Yuqori sifatli bozor resursi",
        aiRecommendations: "AI tavsiyalari",
        aiReason: "Qiziqishlaringizga asoslangan",
        teacherRecommendations: "O'qituvchi tavsiyalari",
        teacherReason: "O'qituvchingiz tavsiya qildi",
        organizationResources: "Tashkilot resurslari",
        organizationReason: "Tashkilotingizdan",
        recentlyUpdated: "Yaqinda yangilangan",
        recentlyUpdatedReason: "Yaqinda yangilangan kontent",
      },
      nextStep: {
        learnPrerequisite: "Oldindan talabni o'rganing",
        practiceWeak: "Zaif mavzuda mashq qiling",
        reviewForgotten: "Unutilgan mavzuni takrorlang",
        continueTopic: "Mavzuni davom ettiring",
        advanceTopic: "Keyingi mavzuga o'ting",
        popular: "O'quvchilar orasida mashhur",
        explanation: {
          prerequisiteRequired: "Bu mavzu keyingisini o'rganishdan oldin kerak",
          prerequisiteLowMastery: "Bu oldindan talabda bilishingiz hozircha past",
          weakTopicScore: "Bu mavzuda 50% dan past ball oldingiz",
          practiceHelps: "Mo'ljallangan mashq bu bo'shliqni yopishga yordam beradi",
          forgottenTime: "Bu mavzuni takrorlamaganga ancha vaqt bo'ldi",
          reviewPreventsDecay: "Muntazam takrorlash bilim yo'qolishini oldini oladi",
          currentlyLearning: "Hozirda bu mavzuni o'rganmoqdasiz",
          continueBuildsMastery: "Bilim oshirish uchun davom eting",
          masteredTopic: "Bu mavzuni o'zlashtirdingiz",
          naturalNextStep: "Bu tabiiy keyingi qadam",
          popularWithLearners: "Boshqa o'quvchilar orasida mashhur",
          highQuality: "Yuqori sifatli kontent",
        },
      },
      explanation: {
        interestMatch: "Sizning {interest}ga qiziqishingizga mos keladi",
        masteryWeak: "Bilishingiz zaif — mashq tavsiya etiladi",
        masteryStrong: "Bu mavzuni o'zlashtirdingiz",
        quality: "Sifat balli: {percent}%",
        popularity: "Mashhurlik: {percent}%",
        graphProximity: "{count} ta bog'liq mavzu bilan bog'langan",
        prerequisitesMet: "Barcha oldindan talablarni o'zlashtirdingiz",
        default: "Siz uchun tavsiya etiladi",
      },
      intent: {
        learn_concept: "Tushunchani o'rganish",
        prepare_exam: "Imtihonga tayyorgarlik",
        find_worksheet: "Ish varaqi topish",
        generate_quiz: "Kviz yaratish",
        create_lesson: "Dars reja tuzish",
        review_mistakes: "Xatolarni takrorlash",
        homework_help: "Uy vazifasiga yordam",
        research: "Chuqur tadqiqot",
      },
      providers: {
        hash: "Ichki hash embeddings (standart)",
        gemini: "Google Gemini embeddings",
        openai: "OpenAI embeddings",
        voyage: "Voyage AI embeddings",
        cohere: "Cohere embeddings",
        jina: "Jina AI embeddings",
        nomic: "Nomic embeddings",
        local: "Mahalliy sentence-transformer modeli",
        edubek: "EduBek maxsus embeddings",
      },
    },
    semanticSearch: {
      title: "Semantik qidiruv",
      detectedIntent: "Aniqlangan maqsad: {intent}",
      confidence: "Ishonch: {percent}%",
      expandedTerms: "Shuningdek qidirildi: {terms}",
      responseTime: "Javob vaqti: {ms}ms",
      noResults: "Semantik mosliklar topilmadi",
      weights: "Reyting og'irliklari",
      resultCount: "{count} ta natija topildi",
    },
    recommendation: {
      impression: "Ko'rsatilgan",
      click: "Bosilgan",
      open: "Ochilgan",
      complete: "Bajarilgan",
      ignore: "E'tiborsiz qoldirilgan",
      dismiss: "Rad etilgan",
      helpful: "Foydali",
      notHelpful: "Foydasiz",
      whyRecommended: "Bu nima uchun tavsiya etildi?",
      overallScore: "Umumiy tavsiya balli: {percent}%",
      analytics: {
        clickThroughRate: "Bosish darajasi: {percent}%",
        helpfulRate: "Foydali darajasi: {percent}%",
        totalImpressions: "Jami ko'rsatishlar: {count}",
        totalClicks: "Jami bosishlar: {count}",
      },
    },
  },
  ru: {
    discovery: {
      feed: {
        continueLearning: "Продолжить обучение",
        continueLearningReason: "Продолжите с того места, где остановились",
        recommendedToday: "Рекомендуется сегодня",
        popularReason: "Популярно среди учеников",
        weakTopics: "Практика по слабым темам",
        weakTopicReason: "Вы набрали ниже 50% по этой теме",
        nextPrerequisites: "Следующие предварительные требования",
        prerequisiteReason: "Требуется для вашей следующей темы",
        trending: "В тренде",
        trendingReason: "Недавно в тренде",
        marketplacePicks: "Подборки магазина",
        marketplaceReason: "Качественный ресурс магазина",
        aiRecommendations: "ИИ-рекомендации",
        aiReason: "На основе ваших интересов",
        teacherRecommendations: "Рекомендации учителя",
        teacherReason: "Рекомендовано вашим учителем",
        organizationResources: "Ресурсы организации",
        organizationReason: "Из вашей организации",
        recentlyUpdated: "Недавно обновлено",
        recentlyUpdatedReason: "Недавно обновлённый контент",
      },
      nextStep: {
        learnPrerequisite: "Изучить предварительное требование",
        practiceWeak: "Практика по слабой теме",
        reviewForgotten: "Повторить забытую тему",
        continueTopic: "Продолжить тему",
        advanceTopic: "Перейти к следующей теме",
        popular: "Популярно среди учеников",
        explanation: {
          prerequisiteRequired: "Эта тема требуется перед изучением следующей",
          prerequisiteLowMastery: "Ваше знание этого требования пока низкое",
          weakTopicScore: "Вы набрали ниже 50% по этой теме",
          practiceHelps: "Целенаправленная практика поможет закрыть пробел",
          forgottenTime: "Прошло много времени с момента повторения этой темы",
          reviewPreventsDecay: "Периодическое повторение предотвращает забывание",
          currentlyLearning: "Вы сейчас изучаете эту тему",
          continueBuildsMastery: "Продолжите, чтобы закрепить знания",
          masteredTopic: "Вы освоили эту тему",
          naturalNextStep: "Это естественный следующий шаг",
          popularWithLearners: "Популярно среди других учеников",
          highQuality: "Качественный контент",
        },
      },
      explanation: {
        interestMatch: "Соответствует вашему интересу к {interest}",
        masteryWeak: "Ваши знания слабы — рекомендована практика",
        masteryStrong: "Вы освоили эту тему",
        quality: "Оценка качества: {percent}%",
        popularity: "Популярность: {percent}%",
        graphProximity: "Связано с {count} родственными темами",
        prerequisitesMet: "Вы освоили все предварительные требования",
        default: "Рекомендовано для вас",
      },
      intent: {
        learn_concept: "Изучение концепции",
        prepare_exam: "Подготовка к экзамену",
        find_worksheet: "Поиск рабочего листа",
        generate_quiz: "Создание викторины",
        create_lesson: "Создание плана урока",
        review_mistakes: "Повторение ошибок",
        homework_help: "Помощь с домашним заданием",
        research: "Глубокое исследование",
      },
      providers: {
        hash: "Встроенные хэш-эмбеддинги (по умолчанию)",
        gemini: "Google Gemini эмбеддинги",
        openai: "OpenAI эмбеддинги",
        voyage: "Voyage AI эмбеддинги",
        cohere: "Cohere эмбеддинги",
        jina: "Jina AI эмбеддинги",
        nomic: "Nomic эмбеддинги",
        local: "Локальная sentence-transformer модель",
        edubek: "Фирменные EduBek эмбеддинги",
      },
    },
    semanticSearch: {
      title: "Семантический поиск",
      detectedIntent: "Обнаруженное намерение: {intent}",
      confidence: "Уверенность: {percent}%",
      expandedTerms: "Также искали: {terms}",
      responseTime: "Время ответа: {ms}мс",
      noResults: "Семантических совпадений не найдено",
      weights: "Веса ранжирования",
      resultCount: "Найдено {count} результатов",
    },
    recommendation: {
      impression: "Показ",
      click: "Клик",
      open: "Открытие",
      complete: "Завершение",
      ignore: "Игнорирование",
      dismiss: "Отклонение",
      helpful: "Полезно",
      notHelpful: "Неполезно",
      whyRecommended: "Почему это было рекомендовано?",
      overallScore: "Общая оценка рекомендации: {percent}%",
      analytics: {
        clickThroughRate: "Кликабельность: {percent}%",
        helpfulRate: "Доля полезных: {percent}%",
        totalImpressions: "Всего показов: {count}",
        totalClicks: "Всего кликов: {count}",
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

const locales = ["en", "uz", "ru"];
for (const locale of locales) {
  const catalog = loadCatalog(locale);
  const newKeys = TRANSLATIONS[locale]!;

  // Merge top-level keys (discovery, semanticSearch, recommendation)
  for (const [topKey, value] of Object.entries(newKeys)) {
    catalog[topKey] = { ...(catalog[topKey] ?? {}), ...value };
  }

  saveCatalog(locale, catalog);
  console.log(`✓ Updated ${locale}.json — added ${Object.keys(newKeys).length} top-level keys`);
}

console.log("\nAll locale catalogs updated.");
