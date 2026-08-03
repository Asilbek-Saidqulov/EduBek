/** Add Phase 5B.2 — Platform SDK i18n keys. */
import * as fs from "node:fs";
import * as path from "node:path";
const M = "/home/z/my-project/messages";
type C = Record<string, any>;
const l = (loc: string): C => JSON.parse(fs.readFileSync(path.join(M, `${loc}.json`), "utf-8"));
const s = (loc: string, c: C) => fs.writeFileSync(path.join(M, `${loc}.json`), JSON.stringify(c, null, 2) + "\n", "utf-8");
const T: Record<string, Record<string, any>> = {
  en: { platformSdk: {
    extension: { published: "Extension published", approved: "Extension approved", rejected: "Extension rejected", installed: "Extension installed", uninstalled: "Extension uninstalled", enabled: "Extension enabled", disabled: "Extension disabled" },
    hook: { executed: "Hooks executed", registered: "Hook registered" },
    sandbox: { executed: "Sandbox execution completed", timeout: "Sandbox execution timed out", failed: "Sandbox execution failed" },
    sdk: { listed: "SDKs listed", cliListed: "CLI commands listed" },
    graphql: { schemaRetrieved: "GraphQL schema retrieved" },
    developer: { portalRetrieved: "Developer portal info retrieved" },
    review: { created: "Review created" },
    subscription: { created: "Subscription created" },
    compatibility: { checked: "Compatibility checked", compatible: "Compatible", incompatible: "Incompatible", untested: "Untested" },
  }},
  uz: { platformSdk: {
    extension: { published: "Kengaytma nashr etildi", approved: "Kengaytma tasdiqlandi", rejected: "Kengaytma rad etildi", installed: "Kengaytma o'rnatildi", uninstalled: "Kengaytma o'chirildi", enabled: "Kengaytma yoqildi", disabled: "Kengaytma o'chirildi" },
    hook: { executed: "Hooklar bajarildi", registered: "Hook ro'yxatdan o'tdi" },
    sandbox: { executed: "Sandbox bajarilishi yakunlandi", timeout: "Sandbox bajarilishi vaqti tugadi", failed: "Sandbox bajarilishi amalga oshmadi" },
    sdk: { listed: "SDKlar ro'yxatga olindi", cliListed: "CLI buyruqlari ro'yxatga olindi" },
    graphql: { schemaRetrieved: "GraphQL sxemasi olindi" },
    developer: { portalRetrieved: "Dasturchi portali ma'lumotlari olindi" },
    review: { created: "Sharha yaratildi" },
    subscription: { created: "Obuna yaratildi" },
    compatibility: { checked: "Moslik tekshirildi", compatible: "Mos", incompatible: "Mos emas", untested: "Sinovdan o'tmagan" },
  }},
  ru: { platformSdk: {
    extension: { published: "Расширение опубликовано", approved: "Расширение одобрено", rejected: "Расширение отклонено", installed: "Расширение установлено", uninstalled: "Расширение удалено", enabled: "Расширение включено", disabled: "Расширение отключено" },
    hook: { executed: "Хуки выполнены", registered: "Хук зарегистрирован" },
    sandbox: { executed: "Выполнение в песочнице завершено", timeout: "Время выполнения истекло", failed: "Выполнение не удалось" },
    sdk: { listed: "SDK перечислены", cliListed: "CLI команды перечислены" },
    graphql: { schemaRetrieved: "GraphQL схема получена" },
    developer: { portalRetrieved: "Информация портала разработчика получена" },
    review: { created: "Отзыв создан" },
    subscription: { created: "Подписка создана" },
    compatibility: { checked: "Совместимость проверена", compatible: "Совместимо", incompatible: "Несовместимо", untested: "Не протестировано" },
  }},
};
for (const loc of ["en", "uz", "ru"]) { const c = l(loc); for (const [k, v] of Object.entries(T[loc]!)) c[k] = { ...(c[k] ?? {}), ...v }; s(loc, c); console.log(`✓ ${loc}.json`); }
