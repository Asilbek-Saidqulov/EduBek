/**
 * Add Phase 4F.3 — Learning Planner i18n keys to en/uz/ru catalogs.
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
    learning: {
      difficulty: {
        stepUp: "Strong performance — increasing difficulty.",
        stepDownAccuracy: "Low accuracy — reducing difficulty to rebuild confidence.",
        stepDownFailures: "Recent failures — stepping back to consolidate understanding.",
        stepDownConfidence: "Low confidence with mediocre accuracy — easing back.",
        hold: "Holding at current difficulty — performance is in the target band.",
        holdSlow: "Holding — responses are slow but accuracy is acceptable.",
        alreadyMax: "Already at maximum difficulty — holding at expert.",
        alreadyMin: "Already at minimum difficulty — holding at easy.",
        insufficientData: "Not enough session data to adjust difficulty.",
      },
      coach: {
        takeBreak: "Take a break — you're showing signs of burnout.",
        reviewPrerequisite: "Review this prerequisite before continuing.",
        practiceWeak: "Practice this weak topic to close the gap.",
        reviewForgotten: "Review this topic — it's been a while.",
        advanceTopic: "Advance to the next topic in your learning path.",
        aiTutorSession: "Try an AI tutor session to deepen your understanding.",
        mockExam: "Take a mock exam to test your readiness.",
        marketplaceResource: "A marketplace resource may help with this topic.",
        changeDifficulty: "Adjust your difficulty setting based on recent performance.",
        action: {
          stepAway: "Step away from the screen for 10-15 minutes",
          lighterContent: "Try lighter content next session",
          reviewInsteadOfNew: "Switch from new material to a review session",
          spendMinutesReviewing: "Spend 20 minutes reviewing the topic",
          attemptPracticeProblem: "Then attempt a practice problem on the next topic",
          completePracticeProblems: "Complete 10 practice problems on the topic",
          reviewMistakesFirst: "Review your previous mistakes before starting",
          quickReview: "Quick 15-minute review of the topic",
          useFlashcards: "Use flashcards if available",
          startSession: "Start a 30-minute session on the topic",
          keepNotes: "Keep notes on concepts you find difficult",
          startAiTutor: "Start an AI tutor session focused on the topic",
          askAboutConcept: "Ask the AI to explain one concept you're unsure about",
        },
      },
      agenda: {
        reviewDue: "Spaced-repetition review due now",
        nextPlanItem: "Next item in your study plan",
      },
      plan: {
        defaultReason: "Recommended for your learning path",
        item: {
          reviewPrerequisite: "Prerequisite review",
          practiceWeak: "Practice weak topic",
          studyInterest: "Study based on your interest",
          quiz: "Quiz to test understanding",
          aiTutor: "AI tutor session",
        },
      },
      burnout: {
        factor: {
          sessionCount: "Too many sessions in 24h",
          longTime: "Long total study time in 24h",
          lowPerformance: "Low recent performance",
          decreasingAccuracy: "Decreasing accuracy",
          longSession: "Long single session",
        },
        rec: {
          takeBreak: "Take a 15-minute break before continuing.",
          lighterContent: "Switch to lighter content or a review session.",
          noNewMaterial: "Avoid starting new material today.",
          shortBreak: "Consider a short break or review session.",
        },
      },
      report: {
        summary: {
          noActivity: "No study sessions this week. Try to study at least 15 minutes a day to maintain your streak.",
          improved: "Great week! You improved significantly. Keep up the momentum.",
          declined: "Quiz accuracy decreased this week. Consider reviewing weak topics.",
          steady: "Steady week of consistent study. Keep it up!",
        },
      },
      milestone: {
        topic_mastered: "Topic mastered",
        questions_completed: "Questions completed",
        plan_finished: "Study plan finished",
        streak_reached: "Streak reached",
        readiness_reached: "Readiness reached",
        concept_learned: "Concept learned",
      },
      notification: {
        studyPlan: "Today's study plan is ready",
        reviewDue: "You have reviews due",
        goalAlmostCompleted: "Your goal is almost complete",
        fallingBehind: "You're falling behind schedule",
        topicMastered: "You've mastered a new topic",
        prerequisiteUnlocked: "New prerequisite unlocked",
        aiTutorSuggested: "AI tutor session suggested",
      },
    },
  },
  uz: {
    learning: {
      difficulty: {
        stepUp: "Kuchli natija — qiyinlik darajasi oshiriladi.",
        stepDownAccuracy: "Past natija — ishonchni tiklash uchun qiyinlik kamaytiriladi.",
        stepDownFailures: "So'nggi xatolar — mustahkamlash uchun orqaga qaytish.",
        stepDownConfidence: "Past ishonch — qiyinlik oshiriladi.",
        hold: "Joriy qiyinlik saqlanmoqda — natija maqbul diapazonda.",
        holdSlow: "Saqlanmoqda — javoblar sekin, ammo aniqlik yetarli.",
        alreadyMax: "Maksimal qiyinlik — ekspert darajasida saqlanmoqda.",
        alreadyMin: "Minimal qiyinlik — oson darajasida saqlanmoqda.",
        insufficientData: "Qiyinlikni sozlash uchun yetarli ma'lumot yo'q.",
      },
      coach: {
        takeBreak: "Tanaffus qiling — charchash belgilari ko'rinmoqda.",
        reviewPrerequisite: "Davom etishdan oldin ushbu oldindan talabni takrorlang.",
        practiceWeak: "Zaif mavzuda mashq qiling.",
        reviewForgotten: "Mavzuni takrorlang — ancha vaqt o'tdi.",
        advanceTopic: "O'rganish yo'lingizdagi keyingi mavzuga o'ting.",
        aiTutorSession: "Tushunchangizni chuqurlashtirish uchun AI tutor sessiyasini sinab ko'ring.",
        mockExam: "Tayyorgarligingizni sinash uchun mock imtihon topshiring.",
        marketplaceResource: "Bozordan resurs bu mavzuda yordam berishi mumkin.",
        changeDifficulty: "So'nggi natijalarga qarab qiyinlik darajasini sozlang.",
        action: {
          stepAway: "Ekrandan 10-15 daqiqa uzoqlashing",
          lighterContent: "Keyingi sessiya uchun osonroq kontent sinab ko'ring",
          reviewInsteadOfNew: "Yangi o'rniga takrorlash sessiyasiga o'ting",
          spendMinutesReviewing: "Mavzuni takrorlashga 20 daqiqa sarflang",
          attemptPracticeProblem: "Keyin keyingi mavzuda mashq masalasini yeching",
          completePracticeProblems: "Mavzuda 10 ta mashq masalasini yeching",
          reviewMistakesFirst: "Boshlashdan oldin avvalgi xatolaringizni ko'rib chiqing",
          quickReview: "Mavzuni 15 daqiqalik tezkor takrorlang",
          useFlashcards: "Mavjud bo'lsa, fleshkartalardan foydalaning",
          startSession: "Mavzuda 30 daqiqalik sessiyani boshlang",
          keepNotes: "Qiyin deb topgan tushunchalaringizni yozing",
          startAiTutor: "Mavzuga qaratilgan AI tutor sessiyasini boshlang",
          askAboutConcept: "AI dan tushunmagan bir tushunchani so'rang",
        },
      },
      agenda: {
        reviewDue: "Takrorlash vaqti yetdi",
        nextPlanItem: "O'quv rejangizdagi keyingi qadam",
      },
      plan: {
        defaultReason: "O'rganish yo'lingiz uchun tavsiya etiladi",
        item: {
          reviewPrerequisite: "Oldindan talabni takrorlash",
          practiceWeak: "Zaif mavzuda mashq",
          studyInterest: "Qiziqishingiz asosida o'rganish",
          quiz: "Tushunishni tekshirish uchun kviz",
          aiTutor: "AI tutor sessiyasi",
        },
      },
      burnout: {
        factor: {
          sessionCount: "24 soat ichida juda ko'p sessiya",
          longTime: "24 soat ichida uzoq o'qish vaqti",
          lowPerformance: "So'nggi past natija",
          decreasingAccuracy: "Kamayayotgan aniqlik",
          longSession: "Uzun bitta sessiya",
        },
        rec: {
          takeBreak: "Davom etishdan oldin 15 daqiqalik tanaffus qiling.",
          lighterContent: "Yengilroq kontent yoki takrorlash sessiyasiga o'ting.",
          noNewMaterial: "Bugun yangi material boshlamang.",
          shortBreak: "Qisqa tanaffus yoki takrorlash sessiyasini o'ylab ko'ring.",
        },
      },
      report: {
        summary: {
          noActivity: "Bu hafta o'qish sessiyalari yo'q. Streakni saqlash uchun kuniga kamida 15 daqiqa o'qing.",
          improved: "Zo'r hafta! Siz sezilarli yutuqga erishdingiz. Keep it up.",
          declined: "Bu hafta kviz aniqligi kamaydi. Zaif mavzularni takrorlashni o'ylab ko'ring.",
          steady: "Barqaror hafta. Shunday davom eting!",
        },
      },
      milestone: {
        topic_mastered: "Mavzu o'zlashtirildi",
        questions_completed: "Savollar bajarildi",
        plan_finished: "O'quv reja yakunlandi",
        streak_reached: "Streakga erishildi",
        readiness_reached: "Tayyorgarlik darajasiga erishildi",
        concept_learned: "Tushuncha o'rganildi",
      },
      notification: {
        studyPlan: "Bugungi o'quv reja tayyor",
        reviewDue: "Takrorlashlar vaqti yetdi",
        goalAlmostCompleted: "Maqsadingiz deyarli tugadi",
        fallingBehind: "Jadvaldan orqada qolyapsiz",
        topicMastered: "Yangi mavzuni o'zlashtirdingiz",
        prerequisiteUnlocked: "Yangi oldindan talab ochildi",
        aiTutorSuggested: "AI tutor sessiyasi tavsiya etiladi",
      },
    },
  },
  ru: {
    learning: {
      difficulty: {
        stepUp: "Сильный результат — повышаем сложность.",
        stepDownAccuracy: "Низкая точность — снижаем сложность для восстановления уверенности.",
        stepDownFailures: "Недавние ошибки — шаг назад для закрепления.",
        stepDownConfidence: "Низкая уверенность — смягчаем сложность.",
        hold: "Текущая сложность сохраняется — результат в целевом диапазоне.",
        holdSlow: "Сохраняется — ответы медленные, но точность приемлемая.",
        alreadyMax: "Уже максимальная сложность — удерживаем на экспертв.",
        alreadyMin: "Уже минимальная сложность — удерживаем на новичке.",
        insufficientData: "Недостаточно данных для корректировки сложности.",
      },
      coach: {
        takeBreak: "Сделайте перерыв — признаки выгорания.",
        reviewPrerequisite: "Повторите предпосылку перед продолжением.",
        practiceWeak: "Потренируйте слабую тему.",
        reviewForgotten: "Повторите тему — прошло много времени.",
        advanceTopic: "Перейдите к следующей теме.",
        aiTutorSession: "Попробуйте сессию с ИИ-тьютором.",
        mockExam: "Пройдите пробный экзамен.",
        marketplaceResource: "Ресурс из магазина может помочь.",
        changeDifficulty: "Настройте сложность по результатам.",
        action: {
          stepAway: "Отойдите от экрана на 10-15 минут",
          lighterContent: "Попробуйте более лёгкий контент",
          reviewInsteadOfNew: "Перейдите к повторению вместо нового материала",
          spendMinutesReviewing: "Потратьте 20 минут на повторение темы",
          attemptPracticeProblem: "Затем решите практическую задачу",
          completePracticeProblems: "Решите 10 практических задач по теме",
          reviewMistakesFirst: "Сначала просмотрите прошлые ошибки",
          quickReview: "Быстрое 15-минутное повторение темы",
          useFlashcards: "Используйте флеш-карточки при наличии",
          startSession: "Начните 30-минутную сессию по теме",
          keepNotes: "Записывайте сложные концепции",
          startAiTutor: "Начните сессию с ИИ-тьютором по теме",
          askAboutConcept: "Спросите ИИ о концепции, которую не понимаете",
        },
      },
      agenda: {
        reviewDue: "Повторение по расписанию",
        nextPlanItem: "Следующий пункт вашего плана",
      },
      plan: {
        defaultReason: "Рекомендовано для вашего пути обучения",
        item: {
          reviewPrerequisite: "Повторение предпосылки",
          practiceWeak: "Практика слабой темы",
          studyInterest: "Изучение по интересу",
          quiz: "Викторина для проверки",
          aiTutor: "Сессия с ИИ-тьютором",
        },
      },
      burnout: {
        factor: {
          sessionCount: "Слишком много сессий за 24ч",
          longTime: "Долгое время обучения за 24ч",
          lowPerformance: "Низкая эффективность",
          decreasingAccuracy: "Снижение точности",
          longSession: "Длинная одиночная сессия",
        },
        rec: {
          takeBreak: "Сделайте 15-минутный перерыв.",
          lighterContent: "Перейдите на более лёгкий контент.",
          noNewMaterial: "Не начинайте новый материал сегодня.",
          shortBreak: "Рассмотрите короткий перерыв.",
        },
      },
      report: {
        summary: {
          noActivity: "На этой неделе не было сессий. Учитесь хотя бы 15 минут в день.",
          improved: "Отличная неделя! Значительный прогресс.",
          declined: "Точность снизилась. Повторите слабые темы.",
          steady: "Стабильная неделя. Продолжайте!",
        },
      },
      milestone: {
        topic_mastered: "Тема освоена",
        questions_completed: "Вопросы выполнены",
        plan_finished: "План завершён",
        streak_reached: "Серия достигнута",
        readiness_reached: "Готовность достигнута",
        concept_learned: "Концепция изучена",
      },
      notification: {
        studyPlan: "План на сегодня готов",
        reviewDue: "Есть повторения на сегодня",
        goalAlmostCompleted: "Цель почти достигнута",
        fallingBehind: "Вы отстаёте от графика",
        topicMastered: "Освоена новая тема",
        prerequisiteUnlocked: "Открыта новая предпосылка",
        aiTutorSuggested: "Рекомендована сессия с ИИ-тьютором",
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
