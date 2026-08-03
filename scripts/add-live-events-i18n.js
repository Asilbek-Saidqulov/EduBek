/**
 * Adds the liveEvents i18n namespace to en/uz/ru messages files.
 */
const fs = require("fs");
const path = require("path");
const messagesDir = "/home/z/my-project/messages";

const translations = {
  en: {
    title: "Live Events Platform",
    description: "Live operations, campaigns, seasonal events, and academic celebrations.",
    eventTypes: { daily: "Daily", weekly: "Weekly", monthly: "Monthly", seasonal: "Seasonal", academic: "Academic", national: "National", organization: "Organization", classroom: "Classroom", club: "Club", university: "University", special: "Special", custom: "Custom" },
    approvalStatuses: { draft: "Draft", review: "Review", approved: "Approved", scheduled: "Scheduled", running: "Running", paused: "Paused", completed: "Completed", cancelled: "Cancelled", archived: "Archived" },
    participationStatuses: { enrolled: "Enrolled", active: "Active", completed: "Completed", abandoned: "Abandoned", expired: "Expired" },
    objectiveTypes: { play_matches: "Play Matches", win_matches: "Win Matches", reach_level: "Reach Level", complete_quizzes: "Complete Quizzes", join_club: "Join Club", complete_challenge: "Complete Challenge", earn_xp: "Earn XP", gain_rating: "Gain Rating", publish_extension: "Publish Extension", custom: "Custom" },
    rewardKinds: { xp: "XP", badge: "Badge", cosmetic: "Cosmetic", title: "Title", avatar: "Avatar", frame: "Frame", banner: "Banner", season_token: "Season Token", certificate: "Certificate" },
    rolloutTypes: { enable: "Enable", disable: "Disable", gradual: "Gradual Rollout", organization: "Organization Rollout", country: "Country Rollout", school: "School Rollout", ab_test: "A/B Test", emergency_stop: "Emergency Stop" },
    orgTypes: { school: "School", university: "University", district: "District", government: "Government", enterprise: "Enterprise" },
    templates: { academic_week: "Academic Week", stem_week: "STEM Week", math_olympiad: "Math Olympiad", economics_challenge: "Economics Challenge", national_holiday: "National Holiday", university_week: "University Week", school_championship: "School Championship", reading_week: "Reading Week", programming_month: "Programming Month", teacher_campaign: "Teacher Campaign" },
    dashboard: { runningEvents: "Running Events", upcomingEvents: "Upcoming Events", completedEvents: "Completed Events", totalParticipants: "Total Participants", completionRate: "Completion Rate", conversionRate: "Conversion Rate", dropoutRate: "Dropout Rate", topCampaigns: "Top Campaigns", teacherAdoption: "Teacher Adoption", organizationAdoption: "Organization Adoption" },
    notifications: { title: "Notifications", pending: "Pending", sent: "Sent", cancelled: "Cancelled", audience: { all: "All Users", participants: "Participants", organization: "Organization", custom: "Custom" } },
    featureFlags: { title: "Feature Flags", active: "Active", inactive: "Inactive", percentage: "Percentage", emergencyStop: "Emergency Stop", gradualRollout: "Gradual Rollout" },
    analytics: { totalParticipants: "Total Participants", completionRate: "Completion Rate", averageCompletionTime: "Average Completion Time", dropoutRate: "Dropout Rate", peakParticipation: "Peak Participation", participationByDay: "Participation by Day", objectiveCompletion: "Objective Completion" },
    scheduler: { title: "Scheduler", scheduledStart: "Scheduled Start", scheduledEnd: "Scheduled End", timezone: "Timezone", recurrence: "Recurrence", holidayAware: "Holiday Aware", blackoutAware: "Blackout Aware", academicCalendar: "Academic Calendar", blackoutPeriods: "Blackout Periods" },
    campaigns: { title: "Campaigns", stages: "Stages", milestones: "Milestones", objectives: "Objectives", schedule: "Schedule", visibility: "Visibility", expiration: "Expiration" },
    registry: { title: "Event Registry", eventName: "Event Name", eventType: "Event Type", status: "Status", startDate: "Start Date", endDate: "End Date", maxParticipants: "Max Participants", enrolled: "Enrolled", active: "Active", completed: "Completed", abandoned: "Abandoned", expired: "Expired" },
    developer: { title: "Developer Integration", publicAPIs: "Public APIs", eventContracts: "Event Contracts", extensionHooks: "Extension Hooks", sdkVersion: "SDK Version", documentationUrl: "Documentation URL" },
    validation: { eventNotFound: "Event not found", campaignNotFound: "Campaign not found", objectiveNotFound: "Objective not found", templateNotFound: "Template not found", flagNotFound: "Feature flag not found", notAuthorized: "Not authorized", eventIdRequired: "Event ID required" }
  },
  ru: {
    title: "Платформа живых событий",
    description: "Живые операции, кампании, сезонные события и академические праздники.",
    eventTypes: { daily: "Ежедневное", weekly: "Еженедельное", monthly: "Ежемесячное", seasonal: "Сезонное", academic: "Академическое", national: "Национальное", organization: "Организация", classroom: "Классное", club: "Клубное", university: "Университетское", special: "Специальное", custom: "Свое" },
    approvalStatuses: { draft: "Черновик", review: "На проверке", approved: "Одобрено", scheduled: "Запланировано", running: "Идёт", paused: "Приостановлено", completed: "Завершено", cancelled: "Отменено", archived: "Архив" },
    participationStatuses: { enrolled: "Записан", active: "Активен", completed: "Завершено", abandoned: "Брошено", expired: "Истекло" },
    objectiveTypes: { play_matches: "Играть матчи", win_matches: "Выиграть матчи", reach_level: "Достичь уровня", complete_quizzes: "Пройти квизы", join_club: "Вступить в клуб", complete_challenge: "Завершить челлендж", earn_xp: "Заработать XP", gain_rating: "Поднять рейтинг", publish_extension: "Опубликовать расширение", custom: "Свое" },
    rewardKinds: { xp: "XP", badge: "Значок", cosmetic: "Косметика", title: "Титул", avatar: "Аватар", frame: "Рамка", banner: "Баннер", season_token: "Сезонный токен", certificate: "Сертификат" },
    rolloutTypes: { enable: "Включить", disable: "Отключить", gradual: "Постепенный", organization: "Организация", country: "Страна", school: "Школа", ab_test: "A/B тест", emergency_stop: "Экстренная остановка" },
    orgTypes: { school: "Школа", university: "Университет", district: "Район", government: "Правительство", enterprise: "Предприятие" },
    templates: { academic_week: "Академическая неделя", stem_week: "STEM неделя", math_olympiad: "Математическая олимпиада", economics_challenge: "Экономический челлендж", national_holiday: "Национальный праздник", university_week: "Университетская неделя", school_championship: "Школьный чемпионат", reading_week: "Неделя чтения", programming_month: "Месяц программирования", teacher_campaign: "Кампания учителя" },
    dashboard: { runningEvents: "Текущие события", upcomingEvents: "Предстоящие", completedEvents: "Завершённые", totalParticipants: "Всего участников", completionRate: "Коэффициент завершения", conversionRate: "Конверсия", dropoutRate: "Отсев", topCampaigns: "Топ кампании", teacherAdoption: "Внедрение учителями", organizationAdoption: "Внедрение организациями" },
    notifications: { title: "Уведомления", pending: "Ожидают", sent: "Отправлены", cancelled: "Отменены", audience: { all: "Все", participants: "Участники", organization: "Организация", custom: "Своя" } },
    featureFlags: { title: "Флаги функций", active: "Активен", inactive: "Неактивен", percentage: "Процент", emergencyStop: "Экстренная остановка", gradualRollout: "Постепенный rollout" },
    analytics: { totalParticipants: "Всего участников", completionRate: "Коэффициент завершения", averageCompletionTime: "Среднее время завершения", dropoutRate: "Коэффициент отсева", peakParticipation: "Пиковая активность", participationByDay: "Участие по дням", objectiveCompletion: "Завершение целей" },
    scheduler: { title: "Планировщик", scheduledStart: "Запланированный старт", scheduledEnd: "Запланированный конец", timezone: "Часовой пояс", recurrence: "Повторение", holidayAware: "Учитывает праздники", blackoutAware: "Учитывает блэкауты", academicCalendar: "Академический календарь", blackoutPeriods: "Периоды блэкаута" },
    campaigns: { title: "Кампании", stages: "Этапы", milestones: "Этапы", objectives: "Цели", schedule: "Расписание", visibility: "Видимость", expiration: "Истечение" },
    registry: { title: "Реестр событий", eventName: "Название", eventType: "Тип", status: "Статус", startDate: "Начало", endDate: "Конец", maxParticipants: "Макс. участников", enrolled: "Записано", active: "Активно", completed: "Завершено", abandoned: "Брошено", expired: "Истекло" },
    developer: { title: "Интеграция разработчика", publicAPIs: "Публичные API", eventContracts: "Контракты событий", extensionHooks: "Хуки расширений", sdkVersion: "Версия SDK", documentationUrl: "URL документации" },
    validation: { eventNotFound: "Событие не найдено", campaignNotFound: "Кампания не найдена", objectiveNotFound: "Цель не найдена", templateNotFound: "Шаблон не найден", flagNotFound: "Флаг не найден", notAuthorized: "Нет авторизации", eventIdRequired: "Требуется ID события" }
  },
  uz: {
    title: "Jonli tadbirlar platformasi",
    description: "Jonli operatsiyalar, kampaniyalar, mavsumiy tadbirlar va akademik nishonlar.",
    eventTypes: { daily: "Kunlik", weekly: "Haftalik", monthly: "Oylik", seasonal: "Mavsumiy", academic: "Akademik", national: "Milliy", organization: "Tashkilot", classroom: "Sinflik", club: "Klublik", university: "Universitetlik", special: "Maxsus", custom: "Maxsus" },
    approvalStatuses: { draft: "Qoralama", review: "Ko'rib chiqilmoqda", approved: "Tasdiqlangan", scheduled: "Rejalashtirilgan", running: "Davom etmoqda", paused: "To'xtatilgan", completed: "Tugagan", cancelled: "Bekor qilingan", archived: "Arxivlangan" },
    participationStatuses: { enrolled: "Yozilgan", active: "Faol", completed: "Tugatgan", abandoned: "Tashlab ketgan", expired: "Muddati o'tgan" },
    objectiveTypes: { play_matches: "O'yinlar o'ynash", win_matches: "O'yinlar yutish", reach_level: "Darajaga yetish", complete_quizzes: "Viktorinalarni tugatish", join_club: "Klubga qo'shilish", complete_challenge: "Chellenjni tugatish", earn_xp: "XP ishlab chiqish", gain_rating: "Reytingni oshirish", publish_extension: "Kengaytma chop etish", custom: "Maxsus" },
    rewardKinds: { xp: "XP", badge: "Nishon", cosmetic: "Kosmetika", title: "Unvon", avatar: "Avatar", frame: "Rama", banner: "Banner", season_token: "Mavsum tokeni", certificate: "Sertifikat" },
    rolloutTypes: { enable: "Yoqish", disable: "O'chirish", gradual: "Bosqichma-bosqich", organization: "Tashkilot bo'yicha", country: "Davlat bo'yicha", school: "Maktab bo'yicha", ab_test: "A/B test", emergency_stop: "Favqulodda to'xtash" },
    orgTypes: { school: "Maktab", university: "Universitet", district: "Tuman", government: "Hukumat", enterprise: "Korxona" },
    templates: { academic_week: "Akademik hafta", stem_week: "STEM hafta", math_olympiad: "Matematika olimpiadasi", economics_challenge: "Iqtisodiy chellenj", national_holiday: "Milliy bayram", university_week: "Universitet haftasi", school_championship: "Maktab chempionati", reading_week: "O'qish haftasi", programming_month: "Dasturlash oyi", teacher_campaign: "O'qituvchi kampaniyasi" },
    dashboard: { runningEvents: "Davom etayotgan tadbirlar", upcomingEvents: "Kelgusi tadbirlar", completedEvents: "Tugagan tadbirlar", totalParticipants: "Jami ishtirokchilar", completionRate: "Tugatish darajasi", conversionRate: "Konversiya", dropoutRate: "Tark etish", topCampaigns: "Top kampaniyalar", teacherAdoption: "O'qituvchilar qabuli", organizationAdoption: "Tashkilotlar qabuli" },
    notifications: { title: "Bildirishnomalar", pending: "Kutilmoqda", sent: "Yuborildi", cancelled: "Bekor qilindi", audience: { all: "Barcha", participants: "Ishtirokchilar", organization: "Tashkilot", custom: "Maxsus" } },
    featureFlags: { title: "Funktsiya bayroqlari", active: "Faol", inactive: "Nofaol", percentage: "Foiz", emergencyStop: "Favqulodda to'xtash", gradualRollout: "Bosqichma-bosqich" },
    analytics: { totalParticipants: "Jami ishtirokchilar", completionRate: "Tugatish darajasi", averageCompletionTime: "O'rtacha tugatish vaqti", dropoutRate: "Tark etish darajasi", peakParticipation: "Eng yuqori ishtirok", participationByDay: "Kun bo'yicha ishtirok", objectiveCompletion: "Maqsad tugatish" },
    scheduler: { title: "Rejalashtiruvchi", scheduledStart: "Rejalashtirilgan boshlanish", scheduledEnd: "Rejalashtirilgan tugash", timezone: "Vaqt mintaqasi", recurrence: "Takrorlanish", holidayAware: "Bayramlarni hisobga oladi", blackoutAware: "Bləkautlarni hisobga oladi", academicCalendar: "Akademik kalendar", blackoutPeriods: "Bləkaut davrlari" },
    campaigns: { title: "Kampaniyalar", stages: "Bosqichlar", milestones: "Miltillovlar", objectives: "Maqsadlar", schedule: "Jadval", visibility: "Ko'rinish", expiration: "Muddat" },
    registry: { title: "Tadbir reestri", eventName: "Tadbir nomi", eventType: "Tadbir turi", status: "Status", startDate: "Boshlanish", endDate: "Tugash", maxParticipants: "Maks. ishtirokchilar", enrolled: "Yozilgan", active: "Faol", completed: "Tugagan", abandoned: "Tashlab ketilgan", expired: "Muddati o'tgan" },
    developer: { title: "Dasturchi integratsiyasi", publicAPIs: "Ommaviy API", eventContracts: "Voqea kontraktlari", extensionHooks: "Kengaytma hooklari", sdkVersion: "SDK versiyasi", documentationUrl: "Hujjat URL" },
    validation: { eventNotFound: "Tadbir topilmadi", campaignNotFound: "Kampaniya topilmadi", objectiveNotFound: "Maqsad topilmadi", templateNotFound: "Shablon topilmadi", flagNotFound: "Bayroq topilmadi", notAuthorized: "Ruxsat yo'q", eventIdRequired: "Tadbir ID talab qilinadi" }
  }
};

for (const [locale, data] of Object.entries(translations)) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
  content.liveEvents = data;
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf8");
  console.log(`Added liveEvents namespace to ${locale}.json`);
}

function countKeys(obj) { let count = 0; for (const k in obj) { if (typeof obj[k] === "object" && obj[k] !== null) count += countKeys(obj[k]); else count++; } return count; }
for (const locale of ["en", "ru", "uz"]) {
  const content = JSON.parse(fs.readFileSync(path.join(messagesDir, `${locale}.json`), "utf8"));
  console.log(`${locale}.json — liveEvents keys: ${countKeys(content.liveEvents)}`);
}
