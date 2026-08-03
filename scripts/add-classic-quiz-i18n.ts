import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const ROOT = process.cwd();
const KEYS = {
  en: { title: "Classic Quiz", description: "Flagship multiplayer quiz game mode.",
    rules: { title: "Rules", minPlayers: "Min players: {value}", maxPlayers: "Max players: {value}", rounds: "Rounds: {value}", questions: "Questions per round: {value}" },
    scoring: { title: "Scoring", base: "Base: {value}", speedBonus: "Speed bonus: {value}", max: "Max: {value}", wrong: "Wrong: 0" },
    leaderboard: { title: "Leaderboard", rank: "Rank {value}", accuracy: "Accuracy: {value}%", streak: "Streak: {value}" },
    teacher: { title: "Teacher Controls", pause: "Pause", resume: "Resume", skip: "Skip", extend: "Extend Timer", end: "End Match", emergency: "Emergency Stop" },
    student: { joining: "Joining...", waiting: "Waiting", countdown: "Get Ready!", question: "Question", submitted: "Answer Submitted!", results: "Results", finished: "Match Finished", reconnecting: "Reconnecting..." },
    summary: { winner: "Winner: {name}", top3: "Top 3", accuracy: "Average Accuracy: {value}%", speed: "Average Speed: {value}ms", replay: "Replay Available", export: "Export Available" },
    analytics: { title: "Analytics", completion: "Completion: {value}%", dropouts: "Dropouts: {value}", reconnects: "Reconnects: {value}", interventions: "Teacher Interventions: {value}" },
    achievements: { first_correct: "First Correct", five_correct: "5 Correct", ten_correct: "10 Correct", perfect_round: "Perfect Round", speed_master: "Speed Master", lightning: "Lightning", accuracy_100: "100% Accuracy", no_wrong: "No Wrong Answers", quick_thinker: "Quick Thinker", top_3: "Top 3", champion: "Champion" },
    streaks: { three: "3 in a Row!", five: "5 in a Row!", ten: "10 in a Row!", perfect: "Perfect Round!", combo: "Combo x{value}" },
    dashboard: { title: "Dashboard", live: "Live: {value}", ready: "Ready: {value}", question: "Question {value}", time: "Time: {value}s" },
    accessibility: { keyboard: "Keyboard Navigation", screenReader: "Screen Reader", reducedMotion: "Reduced Motion", highContrast: "High Contrast", largeTimer: "Large Timer", colorBlind: "Color Blind Friendly", mobile: "Mobile Friendly", tablet: "Tablet Friendly" },
    phases: { preload: "Loading...", countdown: "Starting in {value}...", reveal: "Question Revealed", collecting: "Collecting Answers...", locked: "Answers Locked", scoring: "Scoring...", leaderboard: "Leaderboard", nextQuestion: "Next Question..." },
    scoreTiers: { perfect: "Perfect!", great: "Great!", good: "Good!", ok: "OK", wrong: "Wrong!" },
  },
  uz: { title: "Classic Quiz", description: "Flagship ko'p o'yinchi quiz o'yin rejimi.",
    rules: { title: "Qoidalar", minPlayers: "Min o'yinchi: {value}", maxPlayers: "Max o'yinchi: {value}", rounds: "Raundlar: {value}", questions: "Har raundda savol: {value}" },
    scoring: { title: "Ball", base: "Asosiy: {value}", speedBonus: "Tezlik bonusi: {value}", max: "Max: {value}", wrong: "Noto'g'ri: 0" },
    leaderboard: { title: "Reyting", rank: "O'rin {value}", accuracy: "Aniqlik: {value}%", streak: "Ketma-ketlik: {value}" },
    teacher: { title: "O'qituvchi boshqaruvi", pause: "To'xtatish", resume: "Davom", skip: "O'tkazib yuborish", extend: "Vaqt uzaytirish", end: "O'yinni tugatish", emergency: "Favqulodda to'xtash" },
    student: { joining: "Qo'shilmoqda...", waiting: "Kutmoqda", countdown: "Tayyorlaning!", question: "Savol", submitted: "Javob yuborildi!", results: "Natijalar", finished: "O'yin tugadi", reconnecting: "Qayta ulanmoqda..." },
    summary: { winner: "G'olib: {name}", top3: "Top 3", accuracy: "O'rtacha aniqlik: {value}%", speed: "O'rtacha tezlik: {value}ms", replay: "Replay mavjud", export: "Eksport mavjud" },
    analytics: { title: "Analitika", completion: "Yakunlash: {value}%", dropouts: "Tark etganlar: {value}", reconnects: "Qayta ulanishlar: {value}", interventions: "O'qituvchi aralashuvlari: {value}" },
    achievements: { first_correct: "Birinchi to'g'ri", five_correct: "5 to'g'ri", ten_correct: "10 to'g'ri", perfect_round: "Mukammal raund", speed_master: "Tezlik ustasi", lightning: "Chaqnoq", accuracy_100: "100% aniqlik", no_wrong: "Noto'g'ri javob yo'q", quick_thinker: "Tez fikrli", top_3: "Top 3", champion: "Chempion" },
    streaks: { three: "3 ta ketma-ket!", five: "5 ta ketma-ket!", ten: "10 ta ketma-ket!", perfect: "Mukammal raund!", combo: "Kombo x{value}" },
    dashboard: { title: "Panel", live: "Jonli: {value}", ready: "Tayyor: {value}", question: "Savol {value}", time: "Vaqt: {value}s" },
    accessibility: { keyboard: "Klaviatura navigatsiyasi", screenReader: "Ekran o'qigich", reducedMotion: "Kamaytirilgan harakat", highContrast: "Yuqori kontrast", largeTimer: "Katta taymer", colorBlind: "Rang ko'r uchun", mobile: "Mobil uchun", tablet: "Planshet uchun" },
    phases: { preload: "Yuklanmoqda...", countdown: "{value} soniyadan boshlanadi...", reveal: "Savol ko'rsatildi", collecting: "Javoblar yig'ilmoqda...", locked: "Javoblar qulflandi", scoring: "Baholanmoqda...", leaderboard: "Reyting", nextQuestion: "Keyingi savol..." },
    scoreTiers: { perfect: "Mukammal!", great: "Zo'r!", good: "Yaxshi!", ok: "OK", wrong: "Noto'g'ri!" },
  },
  ru: { title: "Классическая Викторина", description: "Флагманский многопользовательский игровой режим викторины.",
    rules: { title: "Правила", minPlayers: "Мин. игроков: {value}", maxPlayers: "Макс. игроков: {value}", rounds: "Раундов: {value}", questions: "Вопросов в раунде: {value}" },
    scoring: { title: "Очки", base: "База: {value}", speedBonus: "Бонус скорости: {value}", max: "Макс: {value}", wrong: "Неверно: 0" },
    leaderboard: { title: "Таблица лидеров", rank: "Место {value}", accuracy: "Точность: {value}%", streak: "Серия: {value}" },
    teacher: { title: "Управление учителя", pause: "Пауза", resume: "Продолжить", skip: "Пропустить", extend: "Продлить таймер", end: "Завершить матч", emergency: "Экстренная остановка" },
    student: { joining: "Подключение...", waiting: "Ожидание", countdown: "Приготовьтесь!", question: "Вопрос", submitted: "Ответ отправлен!", results: "Результаты", finished: "Матч окончен", reconnecting: "Переподключение..." },
    summary: { winner: "Победитель: {name}", top3: "Топ 3", accuracy: "Средняя точность: {value}%", speed: "Средняя скорость: {value}мс", replay: "Повтор доступен", export: "Экспорт доступен" },
    analytics: { title: "Аналитика", completion: "Завершение: {value}%", dropouts: "Выбыло: {value}", reconnects: "Переподключений: {value}", interventions: "Вмешательств учителя: {value}" },
    achievements: { first_correct: "Первый верный", five_correct: "5 верных", ten_correct: "10 верных", perfect_round: "Идеальный раунд", speed_master: "Мастер скорости", lightning: "Молния", accuracy_100: "100% точность", no_wrong: "Без ошибок", quick_thinker: "Быстрый ум", top_3: "Топ 3", champion: "Чемпион" },
    streaks: { three: "3 подряд!", five: "5 подряд!", ten: "10 подряд!", perfect: "Идеальный раунд!", combo: "Комбо x{value}" },
    dashboard: { title: "Панель", live: "В игре: {value}", ready: "Готовы: {value}", question: "Вопрос {value}", time: "Время: {value}с" },
    accessibility: { keyboard: "Клавиатурная навигация", screenReader: "Экранный чтец", reducedMotion: "Уменьшенное движение", highContrast: "Высокий контраст", largeTimer: "Большой таймер", colorBlind: "Для дальтоников", mobile: "Для мобильных", tablet: "Для планшетов" },
    phases: { preload: "Загрузка...", countdown: "Начнётся через {value}...", reveal: "Вопрос показан", collecting: "Сбор ответов...", locked: "Ответы заблокированы", scoring: "Подсчёт...", leaderboard: "Таблица лидеров", nextQuestion: "Следующий вопрос..." },
    scoreTiers: { perfect: "Идеально!", great: "Отлично!", good: "Хорошо!", ok: "OK", wrong: "Неверно!" },
  },
} as const;
for (const locale of ["en", "uz", "ru"] as const) {
  const filePath = join(ROOT, "messages", `${locale}.json`);
  const content = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  content.classicQuiz = KEYS[locale];
  writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf-8");
  console.log(`Added classicQuiz keys to ${locale}.json`);
}
