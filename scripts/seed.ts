/**
 * EduBek — Database seed script.
 *
 * Populates the database with sample marketplace quizzes across categories
 * so the landing page's Marketplace browse section shows real content.
 *
 * Run with: `bun run db:seed` (added to package.json scripts)
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const CREATORS = [
  { email: 'sarah.chen@edubek.example', name: 'Sarah Chen', username: 'sarahchen', bio: 'High school math teacher. 12 years of classroom experience.', country: 'US' },
  { email: 'akmal.karimov@edubek.example', name: 'Akmal Karimov', username: 'akmalk', bio: 'Biology teacher and curriculum designer.', country: 'UZ' },
  { email: 'maria.silva@edubek.example', name: 'Maria Silva', username: 'mariasilva', bio: 'English as a Second Language specialist.', country: 'BR' },
  { email: 'david.park@edubek.example', name: 'David Park', username: 'davidpark', bio: 'Physics professor and quiz enthusiast.', country: 'KR' },
  { email: 'elena.volkova@edubek.example', name: 'Elena Volkova', username: 'elenav', bio: 'History teacher with a love for storytelling.', country: 'RU' },
  { email: 'james.okafor@edubek.example', name: 'James Okafor', username: 'jameso', bio: 'Computer Science educator and coding bootcamp lead.', country: 'NG' },
]

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
  creatorIndex: number
  priceEduTokens: number
  priceFiat: number
  tier: string
  rating: number
  purchaseCount: number
  questions: QuestionData[]
}

const QUIZZES: QuizSeed[] = [
  {
    title: 'Algebra Fundamentals: Linear Equations',
    description: 'Master solving linear equations, from one-step to multi-step problems. Perfect for Grade 8-9 students building algebra foundations.',
    category: 'mathematics',
    difficulty: 'medium',
    language: 'en',
    creatorIndex: 0,
    priceEduTokens: 0,
    priceFiat: 0,
    tier: 'free',
    rating: 4.8,
    purchaseCount: 1247,
    questions: [
      { question: 'Solve for x: 2x + 5 = 13', options: ['x = 3', 'x = 4', 'x = 5', 'x = 6'], correctIndex: 1, explanation: 'Subtract 5 from both sides: 2x = 8. Divide by 2: x = 4.' },
      { question: 'What is the slope of the line y = 3x - 7?', options: ['-7', '3', '-3', '7'], correctIndex: 1, explanation: 'In the slope-intercept form y = mx + b, m is the slope. Here m = 3.' },
      { question: 'Solve: 5(x - 2) = 3x + 4', options: ['x = 7', 'x = 6', 'x = 5', 'x = 14'], correctIndex: 0, explanation: '5x - 10 = 3x + 4 → 2x = 14 → x = 7.' },
      { question: 'If 3x = 21, what is x?', options: ['6', '7', '8', '9'], correctIndex: 1, explanation: 'Divide both sides by 3: x = 21/3 = 7.' },
      { question: 'What is the y-intercept of y = -2x + 5?', options: ['-2', '2', '5', '-5'], correctIndex: 2, explanation: 'In y = mx + b, b is the y-intercept. Here b = 5.' },
    ],
  },
  {
    title: 'Photosynthesis: Energy from Sunlight',
    description: 'Explore how plants convert light energy into chemical energy. Covers chloroplasts, the light-dependent reactions, and the Calvin cycle.',
    category: 'science',
    difficulty: 'medium',
    language: 'en',
    creatorIndex: 1,
    priceEduTokens: 5,
    priceFiat: 2.99,
    tier: 'paid',
    rating: 4.9,
    purchaseCount: 856,
    questions: [
      { question: 'Where does photosynthesis primarily occur in a plant cell?', options: ['Mitochondria', 'Nucleus', 'Chloroplast', 'Cell membrane'], correctIndex: 2, explanation: 'Chloroplasts contain chlorophyll and are the site of photosynthesis.' },
      { question: 'What gas do plants absorb during photosynthesis?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'], correctIndex: 1, explanation: 'Plants absorb CO₂ from the air through stomata.' },
      { question: 'What is the main product of the light-dependent reactions?', options: ['Glucose', 'ATP and NADPH', 'Oxygen only', 'Carbon dioxide'], correctIndex: 1, explanation: 'Light reactions produce ATP and NADPH, which power the Calvin cycle.' },
      { question: 'Which pigment is primarily responsible for absorbing light in photosynthesis?', options: ['Carotene', 'Chlorophyll', 'Xanthophyll', 'Anthocyanin'], correctIndex: 1, explanation: 'Chlorophyll a is the primary photosynthetic pigment.' },
      { question: 'The Calvin cycle takes place in the...', options: ['Thylakoid membrane', 'Stroma', 'Matrix', 'Cytoplasm'], correctIndex: 1, explanation: 'The Calvin cycle occurs in the stroma of the chloroplast.' },
    ],
  },
  {
    title: 'English Grammar: Tenses Mastery',
    description: 'A comprehensive quiz on all 12 English tenses with clear examples. Ideal for ESL learners at intermediate level (B1-B2).',
    category: 'language',
    difficulty: 'easy',
    language: 'en',
    creatorIndex: 2,
    priceEduTokens: 0,
    priceFiat: 0,
    tier: 'free',
    rating: 4.7,
    purchaseCount: 2103,
    questions: [
      { question: 'Choose the correct form: "She ___ to school every day."', options: ['go', 'goes', 'going', 'is go'], correctIndex: 1, explanation: 'Third person singular present simple adds -s/-es: "she goes".' },
      { question: 'What tense is: "I have been studying for three hours"?', options: ['Present simple', 'Present perfect', 'Present perfect continuous', 'Past continuous'], correctIndex: 2, explanation: 'have + been + verb-ing = present perfect continuous.' },
      { question: 'Choose the past participle of "write":', options: ['wrote', 'written', 'writed', 'writing'], correctIndex: 1, explanation: 'write → wrote → written (irregular verb).' },
      { question: 'Which sentence uses the future perfect tense?', options: ['I will study.', 'I will have studied.', 'I will be studying.', 'I study.'], correctIndex: 1, explanation: 'will + have + past participle = future perfect.' },
      { question: 'Choose the correct form: "By next year, I ___ here for a decade."', options: ['will work', 'will be working', 'will have been working', 'work'], correctIndex: 2, explanation: 'Future perfect continuous emphasizes duration up to a future point.' },
    ],
  },
  {
    title: 'Newton\'s Laws of Motion',
    description: 'Test your understanding of the three laws that govern motion. Covers inertia, F=ma, and action-reaction pairs with real-world examples.',
    category: 'science',
    difficulty: 'hard',
    language: 'en',
    creatorIndex: 3,
    priceEduTokens: 8,
    priceFiat: 4.99,
    tier: 'paid',
    rating: 4.9,
    purchaseCount: 634,
    questions: [
      { question: 'Which law states that an object in motion stays in motion unless acted upon by an external force?', options: ['First Law', 'Second Law', 'Third Law', 'Law of Gravitation'], correctIndex: 0, explanation: 'The First Law (Law of Inertia) describes this behavior.' },
      { question: 'If a 10 kg object accelerates at 2 m/s², what net force acts on it?', options: ['5 N', '12 N', '20 N', '0.2 N'], correctIndex: 2, explanation: 'F = ma = 10 kg × 2 m/s² = 20 N.' },
      { question: 'Newton\'s Third Law is often summarized as:', options: ['Force equals mass times acceleration', 'For every action there is an equal and opposite reaction', 'Energy is conserved', 'Objects resist changes in motion'], correctIndex: 1, explanation: 'The Third Law describes action-reaction pairs.' },
      { question: 'A book rests on a table. The table exerts what force on the book?', options: ['Friction', 'Normal force', 'Tension', 'Gravity'], correctIndex: 1, explanation: 'The normal force is the table pushing up on the book, equal in magnitude to gravity.' },
      { question: 'Which has more inertia: a 1 kg rock or a 10 kg rock?', options: ['1 kg rock', '10 kg rock', 'They have the same inertia', 'Neither has inertia'], correctIndex: 1, explanation: 'Inertia is proportional to mass — more mass means more inertia.' },
    ],
  },
  {
    title: 'World History: Ancient Civilizations',
    description: 'Journey through Mesopotamia, Egypt, Greece, and Rome. Test your knowledge of the foundations of human civilization.',
    category: 'history',
    difficulty: 'medium',
    language: 'en',
    creatorIndex: 4,
    priceEduTokens: 6,
    priceFiat: 3.49,
    tier: 'paid',
    rating: 4.6,
    purchaseCount: 489,
    questions: [
      { question: 'Which civilization is considered the cradle of civilization, located between the Tigris and Euphrates rivers?', options: ['Ancient Egypt', 'Mesopotamia', 'Indus Valley', 'Ancient Greece'], correctIndex: 1, explanation: 'Mesopotamia (modern-day Iraq) is often called the cradle of civilization.' },
      { question: 'Who was the first emperor of unified China?', options: ['Confucius', 'Qin Shi Huang', 'Sun Tzu', 'Lao Tzu'], correctIndex: 1, explanation: 'Qin Shi Huang unified China in 221 BCE.' },
      { question: 'The Great Pyramid of Giza was built during which period?', options: ['Old Kingdom of Egypt', 'New Kingdom of Egypt', 'Roman Empire', 'Greek Empire'], correctIndex: 0, explanation: 'Built around 2580-2560 BCE, during the Old Kingdom.' },
      { question: 'Which ancient civilization developed the first known system of writing called cuneiform?', options: ['Egyptians', 'Sumerians', 'Phoenicians', 'Minoans'], correctIndex: 1, explanation: 'The Sumerians developed cuneiform around 3200 BCE in Mesopotamia.' },
      { question: 'Democracy originated in which ancient city-state?', options: ['Sparta', 'Athens', 'Corinth', 'Thebes'], correctIndex: 1, explanation: 'Athens is credited with developing the first democratic system around 508 BCE.' },
    ],
  },
  {
    title: 'Python Programming Basics',
    description: 'Perfect for beginners learning Python. Covers variables, data types, control flow, functions, and basic data structures.',
    category: 'technology',
    difficulty: 'easy',
    language: 'en',
    creatorIndex: 5,
    priceEduTokens: 0,
    priceFiat: 0,
    tier: 'free',
    rating: 4.8,
    purchaseCount: 3421,
    questions: [
      { question: 'How do you create a variable named x with the value 5 in Python?', options: ['var x = 5', 'x = 5', 'int x = 5', 'x := 5'], correctIndex: 1, explanation: 'Python uses simple assignment: x = 5. No type declaration needed.' },
      { question: 'What is the output of: print(type(3.14))?', options: ["<class 'int'>", "<class 'float'>", "<class 'double'>", "<class 'number'>"], correctIndex: 1, explanation: '3.14 is a float in Python.' },
      { question: 'Which keyword defines a function in Python?', options: ['function', 'def', 'func', 'define'], correctIndex: 1, explanation: 'def is used to define functions in Python.' },
      { question: 'What does the len() function return for the list [1, 2, 3, 4]?', options: ['3', '4', '5', 'Error'], correctIndex: 1, explanation: 'len() returns the number of items — here, 4.' },
      { question: 'Which of these is a valid Python comment?', options: ['// comment', '<!-- comment -->', '# comment', '/* comment */'], correctIndex: 2, explanation: 'Python uses # for single-line comments.' },
    ],
  },
  {
    title: 'Geography: Capitals of the World',
    description: 'Test your knowledge of world capitals across all continents. A fun quiz for geography enthusiasts and students alike.',
    category: 'geography',
    difficulty: 'easy',
    language: 'en',
    creatorIndex: 2,
    priceEduTokens: 0,
    priceFiat: 0,
    tier: 'free',
    rating: 4.5,
    purchaseCount: 1876,
    questions: [
      { question: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correctIndex: 2, explanation: 'Canberra is the capital, not Sydney as many assume.' },
      { question: 'What is the capital of Japan?', options: ['Osaka', 'Kyoto', 'Tokyo', 'Nagoya'], correctIndex: 2, explanation: 'Tokyo has been the capital of Japan since 1868.' },
      { question: 'What is the capital of Brazil?', options: ['Rio de Janeiro', 'Brasília', 'São Paulo', 'Salvador'], correctIndex: 1, explanation: 'Brasília became the capital in 1960, replacing Rio de Janeiro.' },
      { question: 'What is the capital of Canada?', options: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'], correctIndex: 3, explanation: 'Ottawa is Canada\'s capital, located in Ontario.' },
      { question: 'What is the capital of South Korea?', options: ['Busan', 'Seoul', 'Incheon', 'Daegu'], correctIndex: 1, explanation: 'Seoul has been the capital of South Korea since its founding.' },
    ],
  },
  {
    title: 'Cell Biology: Structure and Function',
    description: 'Deep dive into cell organelles, their functions, and cellular processes. Designed for advanced biology students (Grade 10-12).',
    category: 'science',
    difficulty: 'hard',
    language: 'en',
    creatorIndex: 1,
    priceEduTokens: 10,
    priceFiat: 5.99,
    tier: 'paid',
    rating: 4.9,
    purchaseCount: 412,
    questions: [
      { question: 'Which organelle is known as the "powerhouse of the cell"?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus'], correctIndex: 1, explanation: 'Mitochondria produce ATP through cellular respiration.' },
      { question: 'What is the function of the ribosome?', options: ['Energy production', 'Protein synthesis', 'Waste removal', 'DNA storage'], correctIndex: 1, explanation: 'Ribosomes are the site of protein synthesis.' },
      { question: 'Which structure controls what enters and exits the cell?', options: ['Cell wall', 'Cell membrane', 'Nuclear envelope', 'Cytoskeleton'], correctIndex: 1, explanation: 'The cell membrane is selectively permeable.' },
      { question: 'Where is DNA primarily found in eukaryotic cells?', options: ['Cytoplasm', 'Nucleus', 'Mitochondria only', 'Ribosome'], correctIndex: 1, explanation: 'Most DNA is in the nucleus; a small amount is in mitochondria.' },
      { question: 'Which organelle modifies, sorts, and packages proteins?', options: ['Smooth ER', 'Rough ER', 'Golgi apparatus', 'Lysosome'], correctIndex: 2, explanation: 'The Golgi apparatus is the cell\'s "shipping center".' },
    ],
  },
]

async function main() {
  console.log('🌱 Seeding EduBek database...')

  // Wipe existing data so re-running is idempotent
  console.log('  🧹 Cleaning existing data...')
  await db.marketplaceReview.deleteMany()
  await db.marketplacePurchase.deleteMany()
  await db.marketplaceListing.deleteMany()
  await db.question.deleteMany()
  await db.quiz.deleteMany()
  await db.creator.deleteMany()
  await db.userRole.deleteMany()
  await db.profile.deleteMany()
  await db.user.deleteMany()

  // Create creators
  const creators = []
  for (const c of CREATORS) {
    const user = await db.user.create({
      data: {
        email: c.email,
        name: c.name,
        username: c.username,
        country: c.country,
        profile: { create: { displayName: c.name } },
        creatorProfile: {
          create: {
            displayName: c.name,
            bio: c.bio,
            verificationStatus: 'verified',
            verifiedAt: new Date(),
          },
        },
        roles: { create: [{ role: 'creator' }] },
      },
      include: { creatorProfile: true }
    })
    creators.push(user)
    console.log(`  ✓ Created creator: ${c.name}`)
  }

  // Create quizzes + marketplace listings
  for (const seed of QUIZZES) {
    const creator = creators[seed.creatorIndex]
    const quiz = await db.quiz.create({
      data: {
        title: seed.title,
        description: seed.description,
        category: seed.category,
        difficulty: seed.difficulty,
        language: seed.language,
        teacherId: creator.id,
        isPublished: true,
        isFeatured: seed.rating >= 4.8,
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

    // Create marketplace listing for the quiz
    await db.marketplaceListing.create({
      data: {
        sellerId: creator.id,
        contentType: 'quiz',
        contentId: quiz.id,
        title: seed.title,
        description: seed.description,
        priceEduTokens: seed.priceEduTokens,
        priceFiat: seed.priceFiat,
        tier: seed.tier,
        status: 'active',
        publishedAt: new Date(),
        reviewedAt: new Date(),
      },
    })

    console.log(`  ✓ Created quiz: ${seed.title} (${seed.questions.length} questions)`)
  }

  // Note: Reviews are skipped because MarketplaceReview requires a
  // MarketplacePurchase (purchaseId is @unique & required). Creating
  // purchases requires transactions + wallets, which is out of scope for
  // the seed. Reviews can be added later when the purchase flow is built.
  // For the landing page, we'll display star ratings from the QUIZZES seed
  // data (stored as a static map in the page constants).

  console.log('\n✅ Seed complete!')
  console.log(`  ${creators.length} creators`)
  console.log(`  ${QUIZZES.length} quizzes with full questions`)
  console.log(`  ${QUIZZES.length} marketplace listings`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
