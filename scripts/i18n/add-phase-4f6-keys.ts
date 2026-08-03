/**
 * Add Phase 4F.6 — Education OS i18n keys to en/uz/ru catalogs.
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
    educationOs: {
      teacher: {
        capability: {
          lessonPlanning: "Lesson Planning",
          quizRecommendations: "Quiz Recommendations",
          interventions: "Intervention Suggestions",
          classroomAnalytics: "Classroom Analytics",
          assignmentPlanning: "Assignment Planning",
          aiResourceGeneration: "AI Resource Generation",
        },
        nextAction: {
          generateResources: "Generate AI resources for each lesson item",
          createAssignments: "Create assignments aligned with the plan",
          generateQuizzes: "Generate quizzes for the recommended topics",
          applyIntervention: "Apply the highest-confidence recommendation",
          interventions: "Generate interventions for at-risk students",
          generateAssignments: "Generate the assignment resources using AI",
          generateProblems: "Generate practice problems for the extracted concepts",
        },
      },
      student: {
        capability: {
          personalizedStudy: "Personalized Study",
          nextStep: "Next Step Planning",
          motivation: "Motivation",
          reviewScheduling: "Review Scheduling",
          burnout: "Burnout Prevention",
        },
        nextAction: {
          scheduleReviews: "Schedule reviews for weak topics",
          startStudy: "Start today's study session",
          urgentReview: "Start with the most urgent review",
          takeBreak: "Take a 15-minute break now",
          continue: "Continue with today's plan",
        },
      },
      curriculum: {
        capability: {
          alignment: "Curriculum Alignment",
          prerequisites: "Prerequisite Analysis",
          coverageGaps: "Coverage Gaps",
          resourceRecs: "Resource Recommendations",
          ask: "Ask Question",
        },
        nextAction: {
          recomputeCoverage: "Recompute coverage for affected scopes",
          findResources: "Find resources for the prerequisites",
          generateForGaps: "Generate resources for uncovered standards",
        },
      },
      assessment: {
        capability: {
          planning: "Assessment Planning",
          questionGen: "Question Generation",
          weakTopics: "Weak Topic Detection",
          mastery: "Mastery Analysis",
          predict: "Predict Outcome",
        },
        nextAction: {
          generateQuestions: "Generate questions for each assessment",
          expandTemplates: "Use AI Workspace to expand templates into full questions",
          interventions: "Generate interventions for weak topics",
          drillWeak: "Drill into weak topics for interventions",
          intervention: "Intervention needed",
          practiceWeak: "Schedule practice for weak topics",
        },
      },
      org: {
        capability: {
          analytics: "Organization Analytics",
          teacherPerf: "Teacher Performance",
          deptInsights: "Department Insights",
          completion: "Curriculum Completion",
          health: "Knowledge Health",
        },
        nextAction: {
          health: "Compute knowledge health for the org",
          coverageGaps: "Drill into coverage gaps",
          completion: "View curriculum completion breakdown",
        },
      },
      marketplace: {
        capability: {
          recommend: "Recommend Marketplace Resources",
          compare: "Compare Generate vs Buy",
          monetization: "Monetization Opportunities",
        },
        nextAction: {
          compare: "Compare buying vs generating the top result",
        },
      },
      planner: {
        capability: {
          longTerm: "Long-Term Plan",
          weekly: "Weekly Plan",
          daily: "Daily Agenda",
          estimate: "Estimate Completion",
          report: "Weekly Report",
        },
      },
      notification: {
        capability: {
          teacher: "Teacher Notifications",
          student: "Student Notifications",
          marketplace: "Marketplace Notifications",
          organization: "Organization Notifications",
        },
      },
      analytics: {
        capability: {
          teacher: "Teacher Dashboard",
          department: "Department Dashboard",
          school: "School Dashboard",
          district: "District Dashboard",
        },
        teacher: { summary: "Teacher dashboard generated" },
        school: { summary: "School dashboard generated" },
        district: { summary: "District dashboard generated" },
      },
      coordinator: {
        reasoning: "Coordinator executed agents to fulfill the request",
      },
      recommendation: {
        default: "Recommended by the Education OS",
        action: "Take action",
      },
      status: {
        operational: "Education OS is operational",
        degraded: "Education OS is degraded",
        down: "Education OS is down",
      },
      workflow: {
        completed: "Workflow completed successfully",
        failed: "Workflow failed",
        running: "Workflow is running",
      },
      automation: {
        fired: "Automation fired",
        rateLimited: "Automation rate-limited",
        actionFailed: "Automation action failed",
      },
      simulation: {
        completed: "Simulation completed",
        noData: "No simulation data available",
      },
      memory: {
        stored: "Memory stored",
        recalled: "Memory recalled",
        pruned: "Expired memories pruned",
      },
    },
  },
  uz: {
    educationOs: {
      teacher: {
        capability: {
          lessonPlanning: "Dars Rejalashtirish",
          quizRecommendations: "Kviz Tavsiyalari",
          interventions: "Aralash Tavsiyalari",
          classroomAnalytics: "Sinft Tahlili",
          assignmentPlanning: "Topshiriq Rejalashtirish",
          aiResourceGeneration: "AI Resurs Yaratish",
        },
        nextAction: {
          generateResources: "Har bir dars uchun AI resurslarini yaratish",
          createAssignments: "Rejaga mos topshiriqlar yaratish",
          generateQuizzes: "Tavsiya etilgan mavzular uchun kvizlar yaratish",
          applyIntervention: "Eng yuqori ishonchli tavsiyani qo'llash",
          interventions: "Xavf ostidagi o'quvchilar uchun aralashlar yaratish",
          generateAssignments: "Topshiriq resurslarini AI yordamida yaratish",
          generateProblems: "Ajratib olingan tushunchalar uchun mashq masalalarini yaratish",
        },
      },
      student: {
        capability: {
          personalizedStudy: "Shaxsiy O'qish",
          nextStep: "Keyingi Qadam Rejalashtirish",
          motivation: "Motivatsiya",
          reviewScheduling: "Takrorlash Rejalashtirish",
          burnout: "Charchash Oldini Olish",
        },
        nextAction: {
          scheduleReviews: "Zaif mavzular uchun takrorlash rejalashtirish",
          startStudy: "Bugungi o'qish sessiyasini boshlash",
          urgentReview: "Eng shoshilinch takrorlashdan boshlash",
          takeBreak: "Hozir 15 daqiqa tanaffus qiling",
          continue: "Bugungi rejani davom ettiring",
        },
      },
      curriculum: {
        capability: {
          alignment: "O'quv Reja Moslashuvi",
          prerequisites: "Oldindan Talab Tahlili",
          coverageGaps: "Qoplash Bo'shliqlari",
          resourceRecs: "Resurs Tavsiyalari",
          ask: "Savol Berish",
        },
        nextAction: {
          recomputeCoverage: "Ta'sir qilingan doiralar uchun qoplashni qayta hisoblash",
          findResources: "Oldindan talablar uchun resurslar topish",
          generateForGaps: "Qoplanmagan standartlar uchun resurslar yaratish",
        },
      },
      assessment: {
        capability: {
          planning: "Baholash Rejalashtirish",
          questionGen: "Savol Yaratish",
          weakTopics: "Zaif Mavzularni Aniqlash",
          mastery: "O'zlashtirish Tahlili",
          predict: "Natijani Bashorat Qilish",
        },
        nextAction: {
          generateQuestions: "Har bir baholash uchun savollar yaratish",
          expandTemplates: "AI Workspace yordamida shablonlarni to'liq savollarga aylantirish",
          interventions: "Zaif mavzular uchun aralashlar yaratish",
          drillWeak: "Zaif mavzularga kirish",
          intervention: "Aralash kerak",
          practiceWeak: "Zaif mavzular uchun mashq rejalashtirish",
        },
      },
      org: {
        capability: {
          analytics: "Tashkilot Tahlili",
          teacherPerf: "O'qituvchi Samaradorligi",
          deptInsights: "Bo'lim Tahlillari",
          completion: "O'quv Reja Yakunlanishi",
          health: "Bilim Salomatligi",
        },
        nextAction: {
          health: "Tashkilot uchun bilim salomatligini hisoblash",
          coverageGaps: "Qoplash bo'shliqlariga kirish",
          completion: "O'quv reja yakunlanishi tafsilotlarini ko'rish",
        },
      },
      marketplace: {
        capability: {
          recommend: "Bozor Resurslarini Tavsiya Qilish",
          compare: "Yaratish va Sotib Olishni Solishtirish",
          monetization: "Monetizatsiya Imkoniyatlari",
        },
        nextAction: {
          compare: "Eng yaxshi natijani sotib olish yoki yaratishni solishtirish",
        },
      },
      planner: {
        capability: {
          longTerm: "Uzoq Muddatli Reja",
          weekly: "Haftalik Reja",
          daily: "Kundalik Agenda",
          estimate: "Yakunlanishni Bashorat Qilish",
          report: "Haftalik Hisobot",
        },
      },
      notification: {
        capability: {
          teacher: "O'qituvchi Bildirishnomalari",
          student: "O'quvchi Bildirishnomalari",
          marketplace: "Bozor Bildirishnomalari",
          organization: "Tashkilot Bildirishnomalari",
        },
      },
      analytics: {
        capability: {
          teacher: "O'qituvchi Dashboardi",
          department: "Bo'lim Dashboardi",
          school: "Maktab Dashboardi",
          district: "Tuman Dashboardi",
        },
        teacher: { summary: "O'qituvchi dashboardi yaratildi" },
        school: { summary: "Maktab dashboardi yaratildi" },
        district: { summary: "Tuman dashboardi yaratildi" },
      },
      coordinator: {
        reasoning: "Kordinator so'rovni bajarish uchun agentlarni ishga tushirdi",
      },
      recommendation: {
        default: "Education OS tomonidan tavsiya etiladi",
        action: "Harakat qilish",
      },
      status: {
        operational: "Education OS ishlamoqda",
        degraded: "Education OS zaiflashgan",
        down: "Education OS ishlamayapti",
      },
      workflow: {
        completed: "Workflow muvaffaqiyatli yakunlandi",
        failed: "Workflow amalga oshmadi",
        running: "Workflow ishlamoqda",
      },
      automation: {
        fired: "Avtomatlashtirish ishga tushdi",
        rateLimited: "Avtomatlashtirish tezligi cheklangan",
        actionFailed: "Avtomatlashtirish harakati amalga oshmadi",
      },
      simulation: {
        completed: "Simulyatsiya yakunlandi",
        noData: "Simulyatsiya ma'lumotlari mavjud emas",
      },
      memory: {
        stored: "Xotira saqlandi",
        recalled: "Xotira eslandi",
        pruned: "Muddati o'tgan xotiralar tozalandi",
      },
    },
  },
  ru: {
    educationOs: {
      teacher: {
        capability: {
          lessonPlanning: "Планирование урока",
          quizRecommendations: "Рекомендации викторин",
          interventions: "Предложения вмешательств",
          classroomAnalytics: "Аналитика класса",
          assignmentPlanning: "Планирование заданий",
          aiResourceGeneration: "AI-генерация ресурсов",
        },
        nextAction: {
          generateResources: "Сгенерировать AI-ресурсы для каждого пункта урока",
          createAssignments: "Создать задания, согласованные с планом",
          generateQuizzes: "Создать викторины для рекомендованных тем",
          applyIntervention: "Применить рекомендацию с наивысшей уверенностью",
          interventions: "Сгенерировать вмешательства для отстающих учеников",
          generateAssignments: "Создать ресурсы заданий через AI",
          generateProblems: "Создать практические задачи для извлечённых концепций",
        },
      },
      student: {
        capability: {
          personalizedStudy: "Персонализированное обучение",
          nextStep: "Планирование следующего шага",
          motivation: "Мотивация",
          reviewScheduling: "Планирование повторений",
          burnout: "Предотвращение выгорания",
        },
        nextAction: {
          scheduleReviews: "Запланировать повторения для слабых тем",
          startStudy: "Начать сегодняшнюю сессию обучения",
          urgentReview: "Начать с самого срочного повторения",
          takeBreak: "Сделайте 15-минутный перерыв сейчас",
          continue: "Продолжить сегодняшним планом",
        },
      },
      curriculum: {
        capability: {
          alignment: "Согласование учебной программы",
          prerequisites: "Анализ предварительных требований",
          coverageGaps: "Пробелы в покрытии",
          resourceRecs: "Рекомендации ресурсов",
          ask: "Задать вопрос",
        },
        nextAction: {
          recomputeCoverage: "Пересчитать покрытие для затронутых областей",
          findResources: "Найти ресурсы для предварительных требований",
          generateForGaps: "Создать ресурсы для непокрытых стандартов",
        },
      },
      assessment: {
        capability: {
          planning: "Планирование оценивания",
          questionGen: "Генерация вопросов",
          weakTopics: "Обнаружение слабых тем",
          mastery: "Анализ освоения",
          predict: "Прогноз результата",
        },
        nextAction: {
          generateQuestions: "Создать вопросы для каждого оценивания",
          expandTemplates: "Использовать AI Workspace для расширения шаблонов",
          interventions: "Создать вмешательства для слабых тем",
          drillWeak: "Углубиться в слабые темы",
          intervention: "Требуется вмешательство",
          practiceWeak: "Запланировать практику для слабых тем",
        },
      },
      org: {
        capability: {
          analytics: "Аналитика организации",
          teacherPerf: "Эффективность учителей",
          deptInsights: "Инсайты отделов",
          completion: "Завершённость учебной программы",
          health: "Здоровье знаний",
        },
        nextAction: {
          health: "Вычислить здоровье знаний для организации",
          coverageGaps: "Углубиться в пробелы покрытия",
          completion: "Просмотреть разбивку завершённости",
        },
      },
      marketplace: {
        capability: {
          recommend: "Рекомендовать ресурсы магазина",
          compare: "Сравнить генерацию и покупку",
          monetization: "Возможности монетизации",
        },
        nextAction: {
          compare: "Сравнить покупку и генерацию лучшего результата",
        },
      },
      planner: {
        capability: {
          longTerm: "Долгосрочный план",
          weekly: "Недельный план",
          daily: "Дневная повестка",
          estimate: "Прогноз завершения",
          report: "Недельный отчёт",
        },
      },
      notification: {
        capability: {
          teacher: "Уведомления для учителей",
          student: "Уведомления для учеников",
          marketplace: "Уведомления магазина",
          organization: "Уведомления организации",
        },
      },
      analytics: {
        capability: {
          teacher: "Дашборд учителя",
          department: "Дашборд отдела",
          school: "Дашборд школы",
          district: "Дашборд округа",
        },
        teacher: { summary: "Дашборд учителя создан" },
        school: { summary: "Дашборд школы создан" },
        district: { summary: "Дашборд округа создан" },
      },
      coordinator: {
        reasoning: "Координатор выполнил агентов для обработки запроса",
      },
      recommendation: {
        default: "Рекомендовано Education OS",
        action: "Действовать",
      },
      status: {
        operational: "Education OS работает",
        degraded: "Education OS ограничен",
        down: "Education OS недоступен",
      },
      workflow: {
        completed: "Workflow успешно завершён",
        failed: "Workflow не удалось",
        running: "Workflow выполняется",
      },
      automation: {
        fired: "Автоматизация сработала",
        rateLimited: "Автоматизация ограничена по скорости",
        actionFailed: "Действие автоматизации не удалось",
      },
      simulation: {
        completed: "Симуляция завершена",
        noData: "Данные симуляции недоступны",
      },
      memory: {
        stored: "Память сохранена",
        recalled: "Память восстановлена",
        pruned: "Устаревшие записи удалены",
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
