/**
 * Add Phase 4F.4 — Collaboration i18n keys to en/uz/ru catalogs.
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
    collaboration: {
      studyGroup: {
        created: "Study group created",
        joined: "You joined the study group",
        left: "You left the study group",
        invitationSent: "Invitation sent",
        invitationAccepted: "Invitation accepted — you're now a member",
        invitationDeclined: "Invitation declined",
        invitationExpired: "Invitation has expired",
        atCapacity: "This group is at capacity",
        inviteOnly: "This group is invite-only — request an invitation",
        notActive: "This group is not active",
        lastAdmin: "Cannot leave — you are the only admin. Transfer ownership first.",
        roleChanged: "Member role updated",
        xpAwarded: "XP awarded",
      },
      discussion: {
        created: "Discussion started",
        replyCreated: "Reply posted",
        replyDeleted: "Reply deleted",
        answerAccepted: "Answer accepted",
        summaryGenerated: "AI summary generated",
        pinned: "Discussion pinned",
        closed: "Discussion closed",
        locked: "Discussion locked",
      },
      note: {
        created: "Note created",
        updated: "Note updated",
        reverted: "Note reverted to previous version",
        summaryGenerated: "AI summary generated",
        editorJoined: "Editor joined the note",
        editorLeft: "Editor left the note",
      },
      challenge: {
        created: "Challenge created",
        joined: "You joined the challenge",
        completed: "Challenge completed! Reward granted.",
        progressUpdated: "Progress updated",
        finalized: "Challenge finalized — rankings computed",
        notStarted: "Challenge hasn't started yet",
        ended: "Challenge has ended",
        notActive: "Challenge is not active",
      },
      mentorship: {
        requested: "Mentorship request sent",
        accepted: "Mentorship accepted",
        declined: "Mentorship declined",
        ended: "Mentorship ended",
        cannotSelfMentor: "Cannot mentor yourself",
      },
      teacher: {
        recommendationsGenerated: "AI teacher recommendations generated",
        recommendationApplied: "Recommendation applied",
        recommendationDismissed: "Recommendation dismissed",
        interventionCreated: "Intervention created",
        interventionResolved: "Intervention resolved",
        announcementCreated: "Announcement created",
        announcementPublished: "Announcement published",
        interventionRationale: "Based on student risk signals, a personal intervention is recommended.",
        remediationRationale: "Class mastery is below threshold — a targeted review would benefit the whole class.",
        enrichmentRationale: "Students have mastered this topic — consider enrichment material to keep them engaged.",
        assignmentRationale: "Assignment completion is below threshold — consider extending deadlines or sending reminders.",
        engagementRationale: "Engagement rate is low — a motivational announcement may help re-engage students.",
      },
      classroom: {
        insightComputed: "Classroom insights computed",
        atRisk: "Low accuracy + low engagement + missed assignments",
      },
      peer: {
        recommendationsGenerated: "Peer recommendations generated",
        recommendationAccepted: "Recommendation accepted",
        recommendationDismissed: "Recommendation dismissed",
        reason: {
          study_partner: "Recommended as a study partner",
          mentor: "Recommended as a mentor",
          mentee: "Recommended as a mentee",
          helper: "Recommended as a helper",
          discussion_participant: "Recommended as a discussion participant",
          project_teammate: "Recommended as a project teammate",
        },
      },
      network: {
        edgeAdded: "Network edge added",
        edgeRemoved: "Network edge removed",
        neighborhoodFetched: "Collaboration neighborhood fetched",
      },
      org: {
        insightComputed: "Organization insights computed",
      },
    },
  },
  uz: {
    collaboration: {
      studyGroup: {
        created: "O'quv guruhi yaratildi",
        joined: "O'quv guruhiga qo'shildingiz",
        left: "O'quv guruhini tark etdingiz",
        invitationSent: "Taklif yuborildi",
        invitationAccepted: "Taklif qabul qilindi — endi a'zosingiz",
        invitationDeclined: "Taklif rad etildi",
        invitationExpired: "Taklifning muddati tugagan",
        atCapacity: "Bu guruh to'la",
        inviteOnly: "Bu guruh faqat taklif bilan — taklif so'rang",
        notActive: "Bu guruh faol emas",
        lastAdmin: "Tark eta olmaysiz — yagona adminsiz. Avval egalikni o'tkazing.",
        roleChanged: "A'zo roli yangilandi",
        xpAwarded: "XP berildi",
      },
      discussion: {
        created: "Munozara boshlandi",
        replyCreated: "Javob yuborildi",
        replyDeleted: "Javob o'chirildi",
        answerAccepted: "Javob qabul qilindi",
        summaryGenerated: "AI xulosa yaratildi",
        pinned: "Munozara qadalgan",
        closed: "Munozara yopildi",
        locked: "Munozara qulflandi",
      },
      note: {
        created: "Eslatma yaratildi",
        updated: "Eslatma yangilandi",
        reverted: "Eslatma avvalgi versiyaga qaytarildi",
        summaryGenerated: "AI xulosa yaratildi",
        editorJoined: "Muharrir eslatmaga qo'shildi",
        editorLeft: "Muharrir eslatmani tark etdi",
      },
      challenge: {
        created: "Challenge yaratildi",
        joined: "Challange-ga qo'shildingiz",
        completed: "Challenge yakunlandi! Mukofot berildi.",
        progressUpdated: "Progress yangilandi",
        finalized: "Challenge yakunlandi — reytinglar hisoblandi",
        notStarted: "Challenge hali boshlanmadi",
        ended: "Challenge yakunlandi",
        notActive: "Challenge faol emas",
      },
      mentorship: {
        requested: "Mentorlik so'rovi yuborildi",
        accepted: "Mentorlik qabul qilindi",
        declined: "Mentorlik rad etildi",
        ended: "Mentorlik yakunlandi",
        cannotSelfMentor: "O'zingizni mentorlay olmaysiz",
      },
      teacher: {
        recommendationsGenerated: "AI o'qituvchi tavsiyalari yaratildi",
        recommendationApplied: "Tavsiya qo'llandi",
        recommendationDismissed: "Tavsiya rad etildi",
        interventionCreated: "Aralash yaratildi",
        interventionResolved: "Aralash hal qilindi",
        announcementCreated: "E'lon yaratildi",
        announcementPublished: "E'lon nashr etildi",
        interventionRationale: "Talaba xavf belgilariga asoslanan shaxsiy aralash tavsiya etiladi.",
        remediationRationale: "Sinif o'zlashtirvi past — mo'ljallangan takrorlash butun sinfga foyda keltiradi.",
        enrichmentRationale: "Talabalar mavzuni o'zlashtirgan — boyituvchi material tavsiya etiladi.",
        assignmentRationale: "Vazifalarni bajarish past — muddatni uzaytirish yoki eslatmalar tavsiya etiladi.",
        engagementRationale: "Faollik past — motivatsion e'lon yordam berishi mumkin.",
      },
      classroom: {
        insightComputed: "Sinuf tahlillari hisoblandi",
        atRisk: "Past aniqlik + past faollik + o'tkazib yuborilgan vazifalar",
      },
      peer: {
        recommendationsGenerated: "Tengdosh tavsiyalari yaratildi",
        recommendationAccepted: "Tavsiya qabul qilindi",
        recommendationDismissed: "Tavsiya rad etildi",
        reason: {
          study_partner: "O'quv sherigi sifatida tavsiya etiladi",
          mentor: "Mentor sifatida tavsiya etiladi",
          mentee: "Mentee sifatida tavsiya etiladi",
          helper: "Yordamchi sifatida tavsiya etiladi",
          discussion_participant: "Munozara ishtirokchisi sifatida tavsiya etiladi",
          project_teammate: "Loyiha jamoadoshi sifatida tavsiya etiladi",
        },
      },
      network: {
        edgeAdded: "Tarmoq chizig'i qo'shildi",
        edgeRemoved: "Tarmoq chizig'i olib tashlandi",
        neighborhoodFetched: "Hamkorlik mahallasi olindi",
      },
      org: {
        insightComputed: "Tashkilot tahlillari hisoblandi",
      },
    },
  },
  ru: {
    collaboration: {
      studyGroup: {
        created: "Учебная группа создана",
        joined: "Вы присоединились к группе",
        left: "Вы покинули группу",
        invitationSent: "Приглашение отправлено",
        invitationAccepted: "Приглашение принято — вы теперь участник",
        invitationDeclined: "Приглашение отклонено",
        invitationExpired: "Срок приглашения истёк",
        atCapacity: "Группа заполнена",
        inviteOnly: "Группа только по приглашению — запросите приглашение",
        notActive: "Группа неактивна",
        lastAdmin: "Нельзя покинуть — вы единственный админ. Сначала передайте владение.",
        roleChanged: "Роль участника обновлена",
        xpAwarded: "XP начислено",
      },
      discussion: {
        created: "Обсуждение начато",
        replyCreated: "Ответ опубликован",
        replyDeleted: "Ответ удалён",
        answerAccepted: "Ответ принят",
        summaryGenerated: "AI-резюме создано",
        pinned: "Обсуждение закреплено",
        closed: "Обсуждение закрыто",
        locked: "Обсуждение заблокировано",
      },
      note: {
        created: "Заметка создана",
        updated: "Заметка обновлена",
        reverted: "Заметка возвращена к предыдущей версии",
        summaryGenerated: "AI-резюме создано",
        editorJoined: "Редактор присоединился к заметке",
        editorLeft: "Редактор покинул заметку",
      },
      challenge: {
        created: "Челленендж создан",
        joined: "Вы присоединились к челленджу",
        completed: "Челлендж завершён! Награда выдана.",
        progressUpdated: "Прогресс обновлён",
        finalized: "Челлендж финализирован — рейтинги рассчитаны",
        notStarted: "Челлендж ещё не начался",
        ended: "Челлендж завершён",
        notActive: "Челлендж неактивен",
      },
      mentorship: {
        requested: "Запрос на наставничество отправлен",
        accepted: "Наставничество принято",
        declined: "Наставничество отклонено",
        ended: "Наставничество завершено",
        cannotSelfMentor: "Нельзя быть своим наставником",
      },
      teacher: {
        recommendationsGenerated: "AI-рекомендации преподавателю созданы",
        recommendationApplied: "Рекомендация применена",
        recommendationDismissed: "Рекомендация отклонена",
        interventionCreated: "Интервенция создана",
        interventionResolved: "Интервенция решена",
        announcementCreated: "Объявление создано",
        announcementPublished: "Объявление опубликовано",
        interventionRationale: "На основе сигналов риска рекомендуется личная интервенция.",
        remediationRationale: "Уровень класса ниже порога — обзорная сессия будет полезна всему классу.",
        enrichmentRationale: "Ученики освоили тему — рекомендуется материал для углубления.",
        assignmentRationale: "Завершаемость заданий ниже порога — продлите сроки или отправьте напоминания.",
        engagementRationale: "Вовлечённость низкая — мотивационное объявление может помочь.",
      },
      classroom: {
        insightComputed: "Аналитика класса рассчитана",
        atRisk: "Низкая точность + низкая вовлечённость + пропущенные задания",
      },
      peer: {
        recommendationsGenerated: "Рекомендации сверстников созданы",
        recommendationAccepted: "Рекомендация принята",
        recommendationDismissed: "Рекомендация отклонена",
        reason: {
          study_partner: "Рекомендован как партнёр для учёбы",
          mentor: "Рекомендован как наставник",
          mentee: "Рекомендован как подопечный",
          helper: "Рекомендован как помощник",
          discussion_participant: "Рекомендован как участник обсуждения",
          project_teammate: "Рекомендован как член команды проекта",
        },
      },
      network: {
        edgeAdded: "Ребро сети добавлено",
        edgeRemoved: "Ребро сети удалено",
        neighborhoodFetched: "Окрестность сотрудничества получена",
      },
      org: {
        insightComputed: "Аналитика организации рассчитана",
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
