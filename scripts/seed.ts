/**
 * EduBek official Discover catalog.
 * Replaces the fake creator seed (Sarah Chen and the rest).
 * Author on every quiz and listing: EduBek.
 * Run: npm run db:seed
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const OFFICIAL = {
  email: "official@edubek.uz",
  name: "EduBek",
  username: "edubek",
  bio: "EduBek rasmiy o‘quv paketlari. Maktab va abituriyent mashqi uchun yozilgan.",
  country: "UZ",
}

const OLD_SEED_EMAILS = ["sarah.chen@edubek.example", "akmal.karimov@edubek.example", "maria.silva@edubek.example", "david.park@edubek.example", "elena.volkova@edubek.example", "james.okafor@edubek.example"]

type QuestionData = {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

type QuizSeed = {
  title: string
  description: string
  category: string
  difficulty: string
  language: string
  note: string
  questions: QuestionData[]
}

const QUIZZES: QuizSeed[] = [{"title": "Foiz va oddiy tenglama", "description": "EduBek rasmiy paket · Matematika · 8–9-sinf. Foiz, chegirma va bir noma’lumli chiziqli tenglama. 8 ta savol, har birida izoh bor.", "category": "mathematics", "difficulty": "easy", "language": "uz", "note": "Foiz — songa nisbatan yuzdan bir. 20% of 150 = 150 × 20 / 100 = 30. Tenglamada ikkala tomonga bir xil amal qilinadi.", "questions": [{"question": "150 ning 20 foizi necha?", "options": ["20", "30", "35", "50"], "correctIndex": 1, "explanation": "150 × 20 / 100 = 30."}, {"question": "2x + 6 = 14. x nechaga teng?", "options": ["2", "4", "6", "8"], "correctIndex": 1, "explanation": "2x = 8, demak x = 4."}, {"question": "80 000 so‘mlik daftar 10% chegirma bilan necha so‘m turadi?", "options": ["70 000", "72 000", "78 000", "88 000"], "correctIndex": 1, "explanation": "Chegirma 8 000. To‘lov 80 000 − 8 000 = 72 000."}, {"question": "3(x − 2) = 9. x nechaga teng?", "options": ["3", "4", "5", "6"], "correctIndex": 2, "explanation": "x − 2 = 3, shuning uchun x = 5."}, {"question": "36 ning choragi necha?", "options": ["6", "8", "9", "12"], "correctIndex": 2, "explanation": "Chorak 1/4. 36 / 4 = 9."}, {"question": "Agar 4x = 28 bo‘lsa, x necha?", "options": ["6", "7", "8", "9"], "correctIndex": 1, "explanation": "x = 28 / 4 = 7."}, {"question": "y = 2x + 1 chiziqning burchak koeffitsienti necha?", "options": ["1", "2", "−1", "0"], "correctIndex": 1, "explanation": "y = mx + b da m burchak koeffitsienti. Bu yerda m = 2."}, {"question": "200 ning 15 foizi necha?", "options": ["15", "20", "30", "35"], "correctIndex": 2, "explanation": "200 × 15 / 100 = 30."}]}, {"title": "Nyuton qonunlari: kuch va harakat", "description": "EduBek rasmiy paket · Fizika · 8–9-sinf. Inersiya, F = ma va ta’sir–aks ta’sir. Kundalik misollar bilan.", "category": "science", "difficulty": "medium", "language": "uz", "note": "Kuch nyutonda o‘lchanadi. F = ma. Massa kg, tezlanish m/s². Birinchi qonun: tashqi kuch bo‘lmasa tezlik o‘zgarmaydi.", "questions": [{"question": "Kuchning Xalqaro birliklar tizimidagi birligi qaysi?", "options": ["Joul", "Vatt", "Nyuton", "Paskal"], "correctIndex": 2, "explanation": "Kuch nyuton (N) bilan o‘lchanadi."}, {"question": "5 kg massa 2 m/s² tezlanish bilan harakatlanmoqda. Natijaviy kuch necha?", "options": ["2,5 N", "7 N", "10 N", "25 N"], "correctIndex": 2, "explanation": "F = ma = 5 × 2 = 10 N."}, {"question": "Tashqi kuch bo‘lmasa jism o‘z holatini saqlaydi. Bu qaysi qonun?", "options": ["Birinchi qonun", "Ikkinchi qonun", "Uchinchi qonun", "Energiyaning saqlanishi"], "correctIndex": 0, "explanation": "Bu inersiya qonuni, ya’ni Nyutonning birinchi qonuni."}, {"question": "Nyutonning uchinchi qonuni nimani bildiradi?", "options": ["F = ma", "Har bir ta’sirga teng va qarama-qarshi aks ta’sir bor", "Energiya yo‘qolmaydi", "Og‘irlik massa bilan bir xil"], "correctIndex": 1, "explanation": "Ta’sir va aks ta’sir juft bo‘lib, kattaligi teng, yo‘nalishi qarama-qarshi."}, {"question": "100 m masofa 20 s da bosildi. O‘rtacha tezlik necha?", "options": ["2 m/s", "5 m/s", "20 m/s", "50 m/s"], "correctIndex": 1, "explanation": "v = s / t = 100 / 20 = 5 m/s."}, {"question": "Stol ustidagi kitobga stol qanday kuch bilan ta’sir qiladi?", "options": ["Ishqalanish", "Normal kuch", "Taranglik", "Arximed kuchi"], "correctIndex": 1, "explanation": "Tayanchning kitobga tik ta’siri normal kuch deb ataladi."}, {"question": "Qaysi jismning inersiyasi katta: 1 kg toshmi yoki 10 kg toshmi?", "options": ["1 kg tosh", "10 kg tosh", "Ikkalasi teng", "Toshda inersiya yo‘q"], "correctIndex": 1, "explanation": "Inersiya massaga bog‘liq. Massa katta bo‘lsa, inersiya ham katta."}, {"question": "Yer yuzida erkin tushish tezlanishi taxminan necha?", "options": ["1 m/s²", "9,8 m/s²", "100 m/s²", "3 × 10⁸ m/s"], "correctIndex": 1, "explanation": "Maktab hisobida g ≈ 9,8 m/s², ba’zan 10 m/s² olinadi."}]}, {"title": "Hujayra: tuzilishi va vazifasi", "description": "EduBek rasmiy paket · Biologiya · 8–9-sinf. Yadro, mitoxondriya, membrana va o‘simlik hujayrasi.", "category": "science", "difficulty": "easy", "language": "uz", "note": "Hayvon hujayrasida hujayra devori va xloroplast yo‘q. O‘simlik hujayrasida bor. Energiya asosan mitoxondriyada hosil bo‘ladi.", "questions": [{"question": "Hujayraning “energiya stansiyasi” qaysi organoid?", "options": ["Yadro", "Mitoxondriya", "Ribosoma", "Vakuol"], "correctIndex": 1, "explanation": "Mitoxondriyada nafas olish jarayonida ATP hosil bo‘ladi."}, {"question": "Eukariot hujayrada irsiy axborot asosan qayerda saqlanadi?", "options": ["Sitoplazma", "Yadro", "Hujayra devori", "Ribosoma"], "correctIndex": 1, "explanation": "DNKning asosiy qismi yadroda joylashgan."}, {"question": "Oqsil qaysi organoidda sintezlanadi?", "options": ["Ribosoma", "Lizosoma", "Yadrochada emas, membrana", "Vakuol"], "correctIndex": 0, "explanation": "Ribosoma oqsil sintezi joyi."}, {"question": "Moddalarning hujayraga kirib-chiqishini nima boshqaradi?", "options": ["Hujayra devori", "Hujayra membranasi", "Xloroplast", "Mitoxondriya"], "correctIndex": 1, "explanation": "Membrana tanlab o‘tkazuvchan."}, {"question": "Fotosintez qaysi organoidda boradi?", "options": ["Mitoxondriya", "Xloroplast", "Yadro", "Golji apparati"], "correctIndex": 1, "explanation": "Xloroplastda xlorofill bor va yorug‘lik energiyasi ushlanadi."}, {"question": "Quyidagidan qaysi biri o‘simlik hujayrasiga xos, hayvon hujayrasida yo‘q?", "options": ["Membrana", "Yadro", "Hujayra devori", "Sitoplazma"], "correctIndex": 2, "explanation": "Hujayra devori o‘simlik, zamburug‘ va bakteriya hujayrasida bo‘ladi. Hayvon hujayrasida yo‘q."}, {"question": "Prokariot hujayraning asosiy farqi nima?", "options": ["Membranasi yo‘q", "Rasmiy yadrosi yo‘q", "DNKsi yo‘q", "Ribosomasi yo‘q"], "correctIndex": 1, "explanation": "Bakteriya kabi prokariotlarda yadro qobig‘i bilan ajralgan yadro yo‘q."}, {"question": "O‘simlik yashil rangini asosan nima beradi?", "options": ["Gemoglobin", "Xlorofill", "Melanin", "Keratin"], "correctIndex": 1, "explanation": "Xlorofill yorug‘likni yutadi va bargga yashil rang beradi."}]}, {"title": "Modda, aralashma va oddiy belgilar", "description": "EduBek rasmiy paket · Kimyo · 7–8-sinf. Atom, molekula, toza modda, aralashma va kundalik formulalar.", "category": "science", "difficulty": "easy", "language": "uz", "note": "Toza moddaning tarkibi doimiy. Aralashmani fizik usul bilan ajratish mumkin. H₂O — suv, NaCl — osh tuzi.", "questions": [{"question": "Suvning kimyoviy formulasi qaysi?", "options": ["CO₂", "H₂O", "NaCl", "O₂"], "correctIndex": 1, "explanation": "Suv ikki vodorod va bitta kislorod atomidan iborat: H₂O."}, {"question": "Elementning kimyoviy xossasini saqlaydigan eng kichik zarrasi nima?", "options": ["Molekula", "Atom", "Aralashma", "Ion emas, faqat eritma"], "correctIndex": 1, "explanation": "Atom elementning kimyoviy xossasini saqlovchi eng kichik zarra."}, {"question": "Qum va temir qirindisini qanday ajratish oson?", "options": ["Magnit bilan", "Yonish bilan", "Faqat muzlatib", "Hech qanday usul yo‘q"], "correctIndex": 0, "explanation": "Bu mexanik aralashma. Temir magnitga yopishadi, qum qoladi."}, {"question": "Osh tuzining formulasi qaysi?", "options": ["NaCl", "HCl", "CaCO₃", "KMnO₄"], "correctIndex": 0, "explanation": "Osh tuzi — natriy xlorid, NaCl."}, {"question": "Neytral eritmaning pH qiymati taxminan necha?", "options": ["1", "7", "12", "14"], "correctIndex": 1, "explanation": "pH 7 neytral. 7 dan kichik kislotali, kattasi ishqoriy."}, {"question": "Yonishni qo‘llab-quvvatlaydigan gaz qaysi?", "options": ["Azot", "Kislorod", "Karbonat angidrid", "Vodorod emas, asosan geliy"], "correctIndex": 1, "explanation": "Havo tarkibidagi kislorod yonish uchun kerak."}, {"question": "Qattiq, suyuq va gaz — bular nima?", "options": ["Element turlari", "Moddaning agregat holatlari", "Faqat aralashmalar", "Faqat metallar"], "correctIndex": 1, "explanation": "Bu moddaning uchta asosiy agregat holati."}, {"question": "CO₂ qanday nomlanadi?", "options": ["Karbonat angidrid", "Uglerod oksidi (II)", "Suv", "Ammiak"], "correctIndex": 0, "explanation": "CO₂ — karbonat angidrid, nafas chiqarishda ham ajraladi."}]}, {"title": "Gap bo‘laklari va so‘z turlari", "description": "EduBek rasmiy paket · Ona tili · 8–9-sinf. Ega, kesim, ot, sifat va fe’lni ajratish.", "category": "language", "difficulty": "easy", "language": "uz", "note": "Ega savolga “kim?” yoki “nima?” deb javob beradi. Kesim gapning asosiy xabarini beradi. Ot narsa va shaxsni, fe’l harakatni, sifat belgini bildiradi.", "questions": [{"question": "“O‘quvchi daftar yozdi” gapida ega qaysi?", "options": ["daftar", "O‘quvchi", "yozdi", "gapda ega yo‘q"], "correctIndex": 1, "explanation": "Kim yozdi? — O‘quvchi. Ega shu."}, {"question": "Shu gapdagi kesim qaysi?", "options": ["O‘quvchi", "daftar", "yozdi", "ikki so‘z birga ega"], "correctIndex": 2, "explanation": "Nima qildi? — yozdi. Kesim harakatni bildiradi."}, {"question": "Qaysi so‘z ot?", "options": ["tez", "yugurmoq", "maktab", "chiroyli"], "correctIndex": 2, "explanation": "Maktab narsa-joy nomi, ot."}, {"question": "Qaysi so‘z sifat?", "options": ["kitob", "oq", "o‘qimoq", "bola"], "correctIndex": 1, "explanation": "Oq belgi bildiradi, sifat."}, {"question": "Qaysi so‘z fe’l?", "options": ["daryo", "baland", "o‘qidi", "besh"], "correctIndex": 2, "explanation": "O‘qidi harakatni bildiradi, fe’l."}, {"question": "“Kim?” savoliga javob beradigan gap bo‘lagi qaysi?", "options": ["Ega", "Aniqlovchi", "Hol", "Kirish so‘z"], "correctIndex": 0, "explanation": "Ega kim? yoki nima? savoliga javob beradi."}, {"question": "“Juda tez yugurdi” dagi “tez” qanday so‘z?", "options": ["Ot", "Ravish", "Son", "Olmosh"], "correctIndex": 1, "explanation": "Tez harakat belgisini bildiradi, bu yerda ravish."}, {"question": "Qaysi qator son?", "options": ["uch", "uchmoq", "uchinchi emas, faqat uchdi", "uchta kitobdagi kitob"], "correctIndex": 0, "explanation": "Uch miqdor bildiradi, son."}]}, {"title": "O‘zbekiston: mustaqillik davri", "description": "EduBek rasmiy paket · Tarix · 9–11-sinf. Mustaqillik sanasi, Konstitutsiya, ramzlar va poytaxt.", "category": "history", "difficulty": "medium", "language": "uz", "note": "Mustaqillik 1991-yil 1-sentabrda e’lon qilingan. Konstitutsiya 1992-yil 8-dekabrda qabul qilingan. Davlat tili — o‘zbek tili. Poytaxt — Toshkent.", "questions": [{"question": "O‘zbekiston mustaqilligi qachon e’lon qilindi?", "options": ["1990-yil 20-iyun", "1991-yil 1-sentabr", "1992-yil 8-dekabr", "1991-yil 31-avgust"], "correctIndex": 1, "explanation": "Mustaqillik 1991-yil 1-sentabrda e’lon qilindi."}, {"question": "O‘zbekiston Respublikasi Konstitutsiyasi qachon qabul qilindi?", "options": ["1991-yil 1-sentabr", "1992-yil 8-dekabr", "1993-yil 2-iyul", "1995-yil 26-mart"], "correctIndex": 1, "explanation": "Asosiy qonun 1992-yil 8-dekabrda qabul qilingan."}, {"question": "Davlat tili qaysi?", "options": ["Rus tili", "O‘zbek tili", "Ingliz tili", "Tojik tili"], "correctIndex": 1, "explanation": "Davlat tili — o‘zbek tili."}, {"question": "Poytaxt qaysi shahar?", "options": ["Samarqand", "Buxoro", "Toshkent", "Xiva"], "correctIndex": 2, "explanation": "O‘zbekiston poytaxti — Toshkent."}, {"question": "Mustaqillik bayrami qaysi kunda nishonlanadi?", "options": ["21-mart", "9-may", "1-sentabr", "8-dekabr"], "correctIndex": 2, "explanation": "1-sentabr — Mustaqillik kuni."}, {"question": "Bayroqdagi o‘n ikki yulduz nimani eslatadi?", "options": ["Faqat viloyatlar soni", "Madaniy-tarixiy ramz, oy va yulduzlar bilan birga", "Fanlar soni", "Daryolar soni"], "correctIndex": 1, "explanation": "Bayroqdagi hilol va 12 yulduz davlat ramzining qismi. Ular yangilanish va tarixiy-madaniy timsol sifatida qaraladi."}, {"question": "Milliy valyuta nima?", "options": ["Rubl", "So‘m", "Tanga", "Dollar"], "correctIndex": 1, "explanation": "Milliy valyuta — so‘m."}, {"question": "Navro‘z qaysi kunga to‘g‘ri keladi?", "options": ["1-yanvar", "21-mart", "1-sentabr", "1-oktabr"], "correctIndex": 1, "explanation": "Navro‘z 21-mart, bahorgi tengkunlik kuni nishonlanadi. Bu Mustaqillik kuni emas."}]}, {"title": "Ingliz tili: Present Simple", "description": "EduBek rasmiy paket · Ingliz tili · 7–8-sinf. Odat, uchinchi shaxs -s va inkor shakli.", "category": "language", "difficulty": "easy", "language": "uz", "note": "Present Simple odat va doimiy haqiqat uchun. He/she/it dan keyin fe’lga -s qo‘shiladi. Inkor: do/does + not.", "questions": [{"question": "She ___ to school every day.", "options": ["go", "goes", "going", "is go"], "correctIndex": 1, "explanation": "She uchinchi shaxs. Present Simple da goes ishlatiladi."}, {"question": "They ___ football on Sundays.", "options": ["plays", "play", "playing", "is play"], "correctIndex": 1, "explanation": "They ko‘plik. Fe’l asosiy shaklda: play."}, {"question": "He does not ___ milk.", "options": ["drinks", "drink", "drinking", "drank"], "correctIndex": 1, "explanation": "Does dan keyin fe’l asosiy shaklda qoladi: drink."}, {"question": "Qaysi gap odatni bildiradi?", "options": ["I am reading now.", "She reads every evening.", "They are playing.", "Look, it is raining."], "correctIndex": 1, "explanation": "Every evening odat belgisi. Present Simple kerak."}, {"question": "___ she like music?", "options": ["Do", "Does", "Is", "Has"], "correctIndex": 1, "explanation": "She uchun yordamchi does."}, {"question": "Water ___ at 100°C.", "options": ["boil", "boils", "boiling", "is boil"], "correctIndex": 1, "explanation": "Doimiy haqiqat. Water uchinchi shaxs, boils."}, {"question": "I ___ from Tashkent.", "options": ["is", "are", "am", "be"], "correctIndex": 2, "explanation": "I bilan am ishlatiladi."}, {"question": "My brother ___ not watch TV in the morning.", "options": ["do", "does", "is", "have"], "correctIndex": 1, "explanation": "Brother uchinchi shaxs. Inkor: does not watch."}]}, {"title": "Algoritm va dastur asoslari", "description": "EduBek rasmiy paket · Informatika · 7–9-sinf. Algoritm, o‘zgaruvchi, shart va sikl. Kod yozish shart emas.", "category": "technology", "difficulty": "easy", "language": "uz", "note": "Algoritm — masalani yechish uchun aniq qadamlar ketma-ketligi. O‘zgaruvchi qiymat saqlaydi. Shart if, takror sikl.", "questions": [{"question": "Algoritm nima?", "options": ["Faqat kompyuter markasi", "Masalani yechish uchun aniq qadamlar", "Faqat rasm", "Internet tezligi"], "correctIndex": 1, "explanation": "Algoritm aniq, tugallangan va tartibli qadamlar ketma-ketligi."}, {"question": "O‘zgaruvchi nima qiladi?", "options": ["Faqat rasm chizadi", "Qiymat saqlaydi", "Printerni o‘chiradi", "Faqat internet ochadi"], "correctIndex": 1, "explanation": "O‘zgaruvchi nomlangan joyda son, matn yoki boshqa qiymat saqlanadi."}, {"question": "Bir xil qadamni ko‘p marta bajarish nima?", "options": ["Shart", "Sikl", "Fayl", "Parol"], "correctIndex": 1, "explanation": "Takrorlanadigan qadam sikl, ya’ni loop."}, {"question": "“Agar yomg‘ir yog‘sa, soyabon ol” qanday tuzilma?", "options": ["Shart", "Faqat sikl", "O‘zgaruvchi emas", "Ro‘yxat"], "correctIndex": 0, "explanation": "Agar ... bo‘lsa — shart. Dasturda bu if."}, {"question": "Kompyuter ichida axborot asosan qanday ko‘rinishda saqlanadi?", "options": ["Faqat harflar", "0 va 1", "Faqat ranglar", "Faqat tovush to‘lqini"], "correctIndex": 1, "explanation": "Raqamli qurilma ikkilik sanoq tizimida, 0 va 1 bilan ishlaydi."}, {"question": "Qaysi qator to‘g‘ri tartib?", "options": ["Natija, keyin masala, keyin qadam", "Masala, qadamlar, natija", "Faqat natija", "Tasodifiy qadam"], "correctIndex": 1, "explanation": "Avval masala aniqlanadi, keyin qadamlar, oxirida natija tekshiriladi."}, {"question": "x = 5 dan keyin x nimani bildiradi?", "options": ["Har doim 0", "5 qiymatini", "Faqat matn “x”", "Xato"], "correctIndex": 1, "explanation": "x = 5 degani x o‘zgaruvchisiga 5 yozildi."}, {"question": "Dasturdagi xato odatda nima deb ataladi?", "options": ["Bug", "Piksel", "Router", "Skaner"], "correctIndex": 0, "explanation": "Dastur xatosi bug deyiladi. Uni tuzatish debugging."}]}]

async function main() {
  console.log('Seeding EduBek official catalog...')

  const cleanupEmails = [...OLD_SEED_EMAILS, OFFICIAL.email]
  const seedUsers = await db.user.findMany({ where: { email: { in: cleanupEmails } }, select: { id: true } })
  const seedUserIds = seedUsers.map((u: { id: string }) => u.id)
  if (seedUserIds.length) {
    await db.marketplaceReview.deleteMany({ where: { listing: { sellerId: { in: seedUserIds } } } }).catch(() => undefined)
    await db.marketplacePurchase.deleteMany({ where: { listing: { sellerId: { in: seedUserIds } } } }).catch(() => undefined)
    await db.marketplaceListing.deleteMany({ where: { sellerId: { in: seedUserIds } } })
    await db.question.deleteMany({ where: { quiz: { teacherId: { in: seedUserIds } } } })
    await db.quiz.deleteMany({ where: { teacherId: { in: seedUserIds } } })
    await db.user.deleteMany({ where: { id: { in: seedUserIds }, email: { in: OLD_SEED_EMAILS } } }).catch(() => undefined)
  }

  const creator = await db.user.upsert({
    where: { email: OFFICIAL.email },
    update: { name: OFFICIAL.name, username: OFFICIAL.username, country: OFFICIAL.country },
    create: {
      email: OFFICIAL.email,
      name: OFFICIAL.name,
      username: OFFICIAL.username,
      country: OFFICIAL.country,
      profile: { create: { displayName: OFFICIAL.name } },
      creatorProfile: {
        create: {
          displayName: OFFICIAL.name,
          bio: OFFICIAL.bio,
          verificationStatus: 'verified',
          verifiedAt: new Date(),
        },
      },
      roles: { create: [{ role: 'creator' }] },
    },
  })

  for (const seed of QUIZZES) {
    const quiz = await db.quiz.create({
      data: {
        title: seed.title,
        description: seed.description,
        category: seed.category,
        difficulty: seed.difficulty,
        language: seed.language,
        teacherId: creator.id,
        isPublished: true,
        isFeatured: true,
        publishedAt: new Date(),
        questions: {
          create: seed.questions.map((q, i) => ({
            question: q.question,
            options: JSON.stringify(q.options),
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            orderNum: i,
            points: 1,
          })),
        },
      },
    })

    await db.marketplaceListing.create({
      data: {
        sellerId: creator.id,
        contentType: 'quiz',
        contentId: quiz.id,
        title: seed.title,
        description: `${seed.description} Qisqa eslatma: ${seed.note}`,
        priceEduTokens: 0,
        priceFiat: 0,
        tier: 'free',
        status: 'published',
        publishedAt: new Date(),
        reviewedAt: new Date(),
      },
    })
    console.log(`  official quiz: ${seed.title} (${seed.questions.length})`)
  }

  console.log(`Done. 1 author (EduBek), ${QUIZZES.length} official quizzes.`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
