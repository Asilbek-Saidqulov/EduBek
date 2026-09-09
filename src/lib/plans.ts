export const PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED === "true";

export type PlanId = "free" | "plus" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  priceUsd: number;
  period: "month";
  paymentsReady: boolean;
  highlight?: boolean;
  tutorHour: number;
  tutorDay: number;
  generateQuizHour: number;
  generateQuizDay: number;
  explainHour: number;
  explainDay: number;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceUsd: 0,
    period: "month",
    paymentsReady: true,
    tutorHour: 15,
    tutorDay: 30,
    generateQuizHour: 6,
    generateQuizDay: 12,
    explainHour: 20,
    explainDay: 40,
    features: [
      "Tutor: 15/hour and 30/day",
      "Generate 6 AI quizzes/hour and 12/day",
      "Unlimited published quizzes and classes",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    priceUsd: 5,
    period: "month",
    paymentsReady: PAYMENTS_ENABLED,
    highlight: true,
    tutorHour: 200,
    tutorDay: 500,
    generateQuizHour: 40,
    generateQuizDay: 80,
    explainHour: 80,
    explainDay: 160,
    features: [
      "Tutor: 200/hour and 500/day",
      "Generate 40 AI quizzes/hour and 80/day",
      "Faster tutor when busy",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 12,
    period: "month",
    paymentsReady: PAYMENTS_ENABLED,
    tutorHour: 800,
    tutorDay: 2000,
    generateQuizHour: 120,
    generateQuizDay: 250,
    explainHour: 200,
    explainDay: 400,
    features: [
      "Tutor: 800/hour and 2000/day",
      "Generate 120 AI quizzes/hour and 250/day",
      "For teachers who generate packs often",
    ],
  },
];

export function getPlan(id?: string | null): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

/** Paid plans stay Free until PAYMENTS_ENABLED=true and a provider is wired. */
export function getActivePlan(_userPlanId?: string | null): Plan {
  if (!PAYMENTS_ENABLED) return getPlan("free");
  return getPlan(_userPlanId);
}

export function listPlansForClient() {
  return {
    paymentsEnabled: PAYMENTS_ENABLED,
    currentPlanId: "free" as PlanId,
    plans: PLANS.map((plan) => ({
      ...plan,
      badge: plan.id === "free" ? "Current" : plan.paymentsReady ? "Upgrade" : "Disabled",
    })),
  };
}
