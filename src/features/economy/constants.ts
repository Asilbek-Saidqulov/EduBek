import { AiSkuDefinition, KillSwitchFlags, SubscriptionPlanConfig } from "./types";

export const COMMISSION_RATE_BPS = 3000; // 30% Platform, 70% Creator (out of 10,000 bps)
export const CREATOR_SHARE_BPS = 7000;

export const MIN_CREATOR_PAYOUT_UZS = 100_000n; // 100,000 UZS
export const PAYOUT_FEE_UZS = 5_000n; // 5,000 UZS flat transfer fee
export const CREATOR_HOLD_DAYS = 14; // refund/chargeback window before eligible

export const PROMO_EXPIRATION_DAYS = 30; // 30 days default for promo lots
export const SUBSCRIPTION_CREDIT_EXPIRATION_DAYS = 31; // Month-bound credits
export const PURCHASED_CREDIT_EXPIRATION_DAYS = 365; // 1 year for purchased lots

export const AI_SKUS: Record<string, AiSkuDefinition> = {
  "ai.quiz.generate.v1": {
    sku: "ai.quiz.generate.v1",
    title: "AI Quiz Generation",
    description: "Generate a complete curriculum-aligned assessment quiz with options and explanations",
    baseCredits: 25,
    maxInputTokens: 4096,
    maxOutputTokens: 2048,
    modelAllowlist: ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-1.5-flash"],
    timeoutMs: 30000,
    retryLimit: 2,
  },
  "ai.explain.item.v1": {
    sku: "ai.explain.item.v1",
    title: "Question Explanation",
    description: "Step-by-step reasoning and pedagogical explanation for question response",
    baseCredits: 5,
    maxInputTokens: 2048,
    maxOutputTokens: 1024,
    modelAllowlist: ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-1.5-flash"],
    timeoutMs: 15000,
    retryLimit: 2,
  },
  "ai.tutor.message.v1": {
    sku: "ai.tutor.message.v1",
    title: "AI Interactive Tutor Turn",
    description: "Multi-turn Socratic dialogue and live tutoring assistance",
    baseCredits: 10,
    maxInputTokens: 4096,
    maxOutputTokens: 1024,
    modelAllowlist: ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-1.5-flash"],
    timeoutMs: 20000,
    retryLimit: 2,
  },
  "ai.practice.set.v1": {
    sku: "ai.practice.set.v1",
    title: "Adaptive Practice Set",
    description: "Personalized practice exercise sequence tailored to student mastery level",
    baseCredits: 20,
    maxInputTokens: 4096,
    maxOutputTokens: 2048,
    modelAllowlist: ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-1.5-flash"],
    timeoutMs: 25000,
    retryLimit: 2,
  },
  "ai.assessment.generate.v1": {
    sku: "ai.assessment.generate.v1",
    title: "Comprehensive Exam Generation",
    description: "Full-scale multi-section formal examination and grading rubric generator",
    baseCredits: 35,
    maxInputTokens: 8192,
    maxOutputTokens: 4096,
    modelAllowlist: ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-1.5-flash"],
    timeoutMs: 45000,
    retryLimit: 2,
  },
};

export interface CreditPackConfig {
  id: string;
  name: string;
  units: number;
  priceUzs: bigint;
  popular?: boolean;
  savingsLabel?: string;
}

export const AI_CREDIT_PACKS: CreditPackConfig[] = [
  {
    id: "pack_starter",
    name: "Starter Pack",
    units: 100,
    priceUzs: 25_000n, // 25,000 UZS (250 UZS/credit)
  },
  {
    id: "pack_standard",
    name: "Standard Pack",
    units: 500,
    priceUzs: 100_000n, // 100,000 UZS (200 UZS/credit)
    popular: true,
    savingsLabel: "Save 20%",
  },
  {
    id: "pack_pro",
    name: "Pro Pack",
    units: 1500,
    priceUzs: 250_000n, // 250,000 UZS (166 UZS/credit)
    savingsLabel: "Save 33%",
  },
  {
    id: "pack_enterprise",
    name: "Educator Bulk Pack",
    units: 5000,
    priceUzs: 700_000n, // 700,000 UZS (140 UZS/credit)
    savingsLabel: "Best Value (Save 44%)",
  },
];

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlanConfig> = {
  FREE: {
    tier: "FREE",
    name: "EduBek Free",
    priceMonthlyUzs: 0n,
    priceYearlyUzs: 0n,
    aiCreditsMonthly: 5,
    features: [
      "Access to public quizzes & assessments",
      "5 Monthly AI Credits (hard cap)",
      "Standard tutor assistance",
      "Public marketplace browsing",
    ],
  },
  PRO: {
    tier: "PRO",
    name: "EduBek Pro Teacher",
    priceMonthlyUzs: 50_000n, // 50,000 UZS/month
    priceYearlyUzs: 500_000n, // 500,000 UZS/year (2 months free)
    aiCreditsMonthly: 400,
    features: [
      "400 AI Credits refreshed every billing period",
      "Assessment generation within plan quota",
      "Priority AI response latency",
      "Live analytics & anti-cheat reports",
      "Verified educator badge",
    ],
  },
  ULTRA: {
    tier: "ULTRA",
    name: "EduBek Ultra School / Power Creator",
    priceMonthlyUzs: 120_000n, // 120,000 UZS/month
    priceYearlyUzs: 1_200_000n, // 1,200,000 UZS/year
    aiCreditsMonthly: 1200,
    features: [
      "1,200 AI Credits refreshed monthly",
      "Top-tier AI reasoning models with zero queue",
      "Marketplace reduced creator fee (85% Creator split)",
      "Custom branding on exams & student certificates",
      "Dedicated classroom analytics & multi-teacher support",
    ],
  },
};

export const DEFAULT_KILL_SWITCHES: KillSwitchFlags = {
  AI_GLOBAL_OFF: false,
  CREDIT_MINT_OFF: false,
  PROMO_MINT_OFF: false,
  MARKETPLACE_PURCHASE_OFF: false,
  CREATOR_PAYOUT_OFF: false,
  PROVIDER_CLICK_OFF: false,
  ECONOMY_READ_ONLY: false,
  WALLET_FREEZE: false,
  AI_PER_USER_DAILY_COGS_LIMIT: 500_000, // 500,000 UZS daily max cost per user
  AI_PER_ACTION_MAX_CREDITS: 100, // max single request spend
};
