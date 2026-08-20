"""Add Sprint 1 missing i18n keys to en/uz/ru messages files."""
import json
from pathlib import Path

MESSAGES = Path("/home/z/my-project/messages")

# English content
SPRINT1_EN = {
    "auth": {
        "login": {
            "title": "Sign in",
            "subtitle": "Welcome back. Sign in to continue learning.",
            "emailLabel": "Email",
            "passwordLabel": "Password",
            "forgotLink": "Forgot password?",
            "submit": "Sign in",
            "submitting": "Signing in…",
            "noAccount": "Don't have an account?",
            "signUpLink": "Sign up",
            "failed": "Sign in failed. Please try again.",
            "networkError": "Network error. Please check your connection.",
        },
        "register": {
            "title": "Create your account",
            "subtitle": "Start your learning journey with EduBek.",
            "nameLabel": "Full name",
            "emailLabel": "Email",
            "passwordLabel": "Password",
            "passwordHint": "At least 8 characters, including one uppercase letter and one digit.",
            "confirmLabel": "Confirm password",
            "submit": "Create account",
            "submitting": "Creating account…",
            "haveAccount": "Already have an account?",
            "signInLink": "Sign in",
            "failed": "Registration failed. Please try again.",
            "networkError": "Network error. Please check your connection.",
            "termsNotice": "By creating an account, you agree to EduBek's terms of service.",
        },
        "forgot": {
            "title": "Forgot password?",
            "subtitle": "We'll send you instructions to reset your password.",
            "unavailableTitle": "Password reset is not yet available",
            "unavailableBody": "This MVP doesn't include a password reset endpoint. Please contact your administrator or sign up with a new email.",
            "submitDisabled": "Send reset link (coming soon)",
            "backToLogin": "Back to sign in",
        },
    },
    "theme": {
        "toggle": "Toggle theme",
        "light": "Light",
        "dark": "Dark",
        "system": "System",
    },
    "nav": {
        "sections": {
            "main": "Main",
            "tools": "Tools",
        },
        "discover": "Discover",
        "admin": "Admin",
        "wallet": "Wallet",
    },
    "dashboard": {
        "welcome": "Welcome",
        "welcomeSubtitle": "Your EduBek home base. More coming soon.",
        "sprint1Placeholder": "This is a Sprint 1 placeholder. The full teacher/student dashboards will arrive in later sprints.",
        "comingSoon": "Explore EduBek",
        "discoverDesc": "Browse free AI-generated quizzes and creator content.",
        "liveQuizDesc": "Join a live quiz or host one for your class.",
        "marketplaceDesc": "Discover and purchase educational resources from creators.",
        "aiWorkspaceDesc": "Generate quizzes, worksheets, and lesson plans with AI.",
        "libraryDesc": "Your saved resources, quizzes, and study materials.",
        "walletDesc": "Check your EduToken balance and transaction history.",
    },
    "errors": {
        "error": "Error",
        "unexpectedTitle": "Something went wrong",
        "unexpectedBody": "An unexpected error occurred. Please try again or return home.",
        "tryAgain": "Try again",
        "backHome": "Back to home",
        "notFoundTitle": "Page not found",
        "notFoundBody": "The page you're looking for doesn't exist or has been moved.",
        "goLogin": "Sign in",
    },
}

# Translations for uz and ru
SPRINT1_UZ = {
    "auth": {
        "login": {
            "title": "Tizimga kirish",
            "subtitle": "Xush kelibsiz. Davom etish uchun tizimga kiring.",
            "emailLabel": "Email",
            "passwordLabel": "Parol",
            "forgotLink": "Parolni unutdingizmi?",
            "submit": "Kirish",
            "submitting": "Kirilmoqda…",
            "noAccount": "Hisobingiz yo'qmi?",
            "signUpLink": "Ro'yxatdan o'tish",
            "failed": "Kirish amalga oshmadi. Qayta urinib ko'ring.",
            "networkError": "Tarmoq xatosi. Internet aloqangizni tekshiring.",
        },
        "register": {
            "title": "Hisob yarating",
            "subtitle": "EduBek bilan o'qish sayohatingizni boshlang.",
            "nameLabel": "To'liq ism",
            "emailLabel": "Email",
            "passwordLabel": "Parol",
            "passwordHint": "Kamida 8 ta belgi, bitta katta harf va bitta raqam.",
            "confirmLabel": "Parolni tasdiqlang",
            "submit": "Hisob yaratish",
            "submitting": "Hisob yaratilmoqda…",
            "haveAccount": "Hisobingiz bormi?",
            "signInLink": "Kirish",
            "failed": "Ro'yxatdan o'tish amalga oshmadi. Qayta urinib ko'ring.",
            "networkError": "Tarmoq xatosi. Internet aloqangizni tekshiring.",
            "termsNotice": "Hisob yaratish orqali siz EduBek foydalanish shartlariga rozisiz.",
        },
        "forgot": {
            "title": "Parolni unutdingizmi?",
            "subtitle": "Parolni tiklash ko'rsatmalarini yuboramiz.",
            "unavailableTitle": "Parolni tiklash hali mavjud emas",
            "unavailableBody": "Ushbu MVP'da parolni tiklash endpointi yo'q. Administratoringiz bilan bog'laning yoki yangi email bilan ro'yxatdan o'ting.",
            "submitDisabled": "Tiklash havolasini yuborish (tez orada)",
            "backToLogin": "Kirish sahifasiga qaytish",
        },
    },
    "theme": {
        "toggle": "Mavzuni o'zgartirish",
        "light": "Yorug'",
        "dark": "Qorong'i",
        "system": "Tizim",
    },
    "nav": {
        "sections": {
            "main": "Asosiy",
            "tools": "Vositalar",
        },
        "discover": "Kashf qilish",
        "admin": "Admin",
        "wallet": "Hamyon",
    },
    "dashboard": {
        "welcome": "Xush kelibsiz",
        "welcomeSubtitle": "EduBek uy bazangiz. Tez orada ko'proq imkoniyatlar.",
        "sprint1Placeholder": "Bu Sprint 1 platHOLDERi. To'liq o'qituvchi/talaba dashboardlari keyingi sprintlarda keladi.",
        "comingSoon": "EduBek'ni kashf qiling",
        "discoverDesc": "Bepul AI yaratilgan viktorinalar va mualif kontentini ko'ring.",
        "liveQuizDesc": "Jonli viktorinaga qoshiling yoki sinfingiz uchun o'tkazing.",
        "marketplaceDesc": "Mualiflardan ta'lim resurslarini kashf qiling va sotib oling.",
        "aiWorkspaceDesc": "AI bilan viktorinalar, ish varaqalari va dars rejalari yarating.",
        "libraryDesc": "Saqlangan resurslaringiz, viktorinalaringiz va o'quv materiallaringiz.",
        "walletDesc": "EduToken balansingizni va operatsiya tarixingizni tekshiring.",
    },
    "errors": {
        "error": "Xato",
        "unexpectedTitle": "Bir narsa noto'g'ri bajarildi",
        "unexpectedBody": "Kutilmagan xato yuz berdi. Qayta urinib ko'ring yoki uyga qayting.",
        "tryAgain": "Qayta urinish",
        "backHome": "Bosh sahifaga qaytish",
        "notFoundTitle": "Sahifa topilmadi",
        "notFoundBody": "Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan.",
        "goLogin": "Kirish",
    },
}

SPRINT1_RU = {
    "auth": {
        "login": {
            "title": "Вход",
            "subtitle": "С возвращением. Войдите, чтобы продолжить обучение.",
            "emailLabel": "Email",
            "passwordLabel": "Пароль",
            "forgotLink": "Забыли пароль?",
            "submit": "Войти",
            "submitting": "Вход…",
            "noAccount": "Нет аккаунта?",
            "signUpLink": "Регистрация",
            "failed": "Не удалось войти. Попробуйте ещё раз.",
            "networkError": "Ошибка сети. Проверьте подключение.",
        },
        "register": {
            "title": "Создать аккаунт",
            "subtitle": "Начните своё обучение с EduBek.",
            "nameLabel": "Полное имя",
            "emailLabel": "Email",
            "passwordLabel": "Пароль",
            "passwordHint": "Минимум 8 символов, включая одну заглавную букву и одну цифру.",
            "confirmLabel": "Подтвердите пароль",
            "submit": "Создать аккаунт",
            "submitting": "Создание аккаунта…",
            "haveAccount": "Уже есть аккаунт?",
            "signInLink": "Войти",
            "failed": "Не удалось зарегистрироваться. Попробуйте ещё раз.",
            "networkError": "Ошибка сети. Проверьте подключение.",
            "termsNotice": "Создавая аккаунт, вы соглашаетесь с условиями использования EduBek.",
        },
        "forgot": {
            "title": "Забыли пароль?",
            "subtitle": "Мы отправим инструкции по сбросу пароля.",
            "unavailableTitle": "Сброс пароля пока недоступен",
            "unavailableBody": "В этом MVP нет эндпоинта сброса пароля. Обратитесь к администратору или зарегистрируйтесь с новой почтой.",
            "submitDisabled": "Отправить ссылку (скоро)",
            "backToLogin": "Вернуться ко входу",
        },
    },
    "theme": {
        "toggle": "Сменить тему",
        "light": "Светлая",
        "dark": "Тёмная",
        "system": "Системная",
    },
    "nav": {
        "sections": {
            "main": "Основное",
            "tools": "Инструменты",
        },
        "discover": "Обзор",
        "admin": "Админ",
        "wallet": "Кошелёк",
    },
    "dashboard": {
        "welcome": "Добро пожаловать",
        "welcomeSubtitle": "Ваша база EduBek. Скоро больше возможностей.",
        "sprint1Placeholder": "Это заглушка Sprint 1. Полные панели преподавателя/студента появятся в следующих спринтах.",
        "comingSoon": "Исследуйте EduBek",
        "discoverDesc": "Просматривайте бесплатные AI-генерируемые викторины и контент авторов.",
        "liveQuizDesc": "Присоединитесь к живой викторине или устройте свою для класса.",
        "marketplaceDesc": "Находите и покупайте учебные материалы у авторов.",
        "aiWorkspaceDesc": "Создавайте викторины, рабочие листы и планы уроков с AI.",
        "libraryDesc": "Ваши сохранённые ресурсы, викторины и учебные материалы.",
        "walletDesc": "Проверьте баланс EduToken и историю транзакций.",
    },
    "errors": {
        "error": "Ошибка",
        "unexpectedTitle": "Что-то пошло не так",
        "unexpectedBody": "Произошла непредвиденная ошибка. Попробуйте ещё раз или вернитесь домой.",
        "tryAgain": "Повторить",
        "backHome": "На главную",
        "notFoundTitle": "Страница не найдена",
        "notFoundBody": "Страница, которую вы ищете, не существует или была перемещена.",
        "goLogin": "Войти",
    },
}


def deep_merge(base, overlay):
    """Recursively merge overlay into base (overlay wins)."""
    out = dict(base)
    for k, v in overlay.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def count_keys(obj):
    n = 0
    for v in obj.values():
        n += 1
        if isinstance(v, dict):
            n += count_keys(v)
    return n


for fname, overlay in [("en.json", SPRINT1_EN), ("uz.json", SPRINT1_UZ), ("ru.json", SPRINT1_RU)]:
    path = MESSAGES / fname
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    before = count_keys(data)
    merged = deep_merge(data, overlay)
    after = count_keys(merged)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
        f.write("\n")
    added = after - before
    print(f"  {fname}: +{added} keys (now {after})")

print("done")
