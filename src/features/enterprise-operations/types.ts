/**
 * EduBek — Enterprise Operations types.
 * Phase 6C.1: Enterprise commercial backbone — tenants, subscriptions,
 * billing, invoices, contracts, procurement, customer success, renewals,
 * organization health, revenue analytics, deployments, dashboard,
 * forecasting, and reporting.
 * All systems produce recommendations only — never automatic financial decisions.
 */

// ===========================================================================
// SYSTEM 1 — Enterprise Tenant Manager
// ===========================================================================

export type TenantType = "ministry" | "district" | "university" | "school" | "franchise" | "subsidiary";

export interface EnterpriseTenant {
  id: string;
  organizationId: string;
  name: string;
  type: TenantType;
  parentId: string | null;
  children: string[];
  country: string | null;
  seats: number;
  usedSeats: number;
  plan: string;
  branding: { logo: string | null; primaryColor: string | null; customDomain: string | null };
  resourceLimits: { maxStorageGb: number; maxAiCallsPerMonth: number; maxUsers: number };
  health: "healthy" | "warning" | "critical";
  createdAt: string;
}

export interface TenantManagerReport {
  generatedAt: string;
  tenants: EnterpriseTenant[];
  totalTenants: number;
  byType: Record<string, number>;
  hierarchyDepth: number;
}

// ===========================================================================
// SYSTEM 2 — Subscription Engine
// ===========================================================================

export type PlanTier = "free" | "teacher_pro" | "school" | "enterprise" | "ministry" | "custom";

export interface SubscriptionInfo {
  id: string;
  organizationId: string | null;
  userId: string | null;
  tier: PlanTier;
  status: "active" | "trialing" | "past_due" | "canceled" | "expired";
  seats: number;
  usedSeats: number;
  aiCreditsMonthly: number;
  aiCreditsUsed: number;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  renewalAt: string | null;
  startedAt: string;
}

export interface SubscriptionEngineReport {
  generatedAt: string;
  subscriptions: SubscriptionInfo[];
  totalActive: number;
  totalTrialing: number;
  totalCanceled: number;
  byTier: Record<string, number>;
  totalMRR: number;
}

// ===========================================================================
// SYSTEM 3 — Billing Engine
// ===========================================================================

export interface BillingSummary {
  generatedAt: string;
  totalRevenue: number;
  totalRefunds: number;
  totalTaxCollected: number;
  totalDiscountsApplied: number;
  outstandingBalance: number;
  currency: string;
  byRegion: Array<{ region: string; revenue: number; percent: number }>;
  byFeature: Array<{ feature: string; revenue: number; percent: number }>;
  paymentMethods: Array<{ method: string; count: number; volume: number }>;
  recommendations: string[];
}

// ===========================================================================
// SYSTEM 4 — Invoice Management
// ===========================================================================

export type InvoiceType = "monthly" | "annual" | "usage" | "marketplace" | "ai" | "enterprise";

export interface InvoiceSummary {
  id: string;
  number: string;
  type: InvoiceType;
  userId: string;
  organizationId: string | null;
  amount: number;
  tax: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  issuedAt: string;
  dueAt: string | null;
  paidAt: string | null;
  pdfUrl: string | null;
}

export interface InvoiceReport {
  generatedAt: string;
  invoices: InvoiceSummary[];
  totalIssued: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  byType: Record<string, number>;
}

// ===========================================================================
// SYSTEM 5 — Contract Manager
// ===========================================================================

export interface EnterpriseContract {
  id: string;
  organizationId: string;
  title: string;
  type: "enterprise" | "sla" | "support" | "procurement";
  status: "draft" | "negotiating" | "active" | "expired" | "terminated";
  startDate: string;
  endDate: string | null;
  value: number;
  currency: string;
  slaTier: "standard" | "premium" | "enterprise" | "custom";
  supportPlan: string;
  documents: string[];
  renewalStatus: "not_due" | "due_soon" | "overdue" | "renewed";
  createdAt: string;
}

export interface ContractReport {
  generatedAt: string;
  contracts: EnterpriseContract[];
  totalActive: number;
  totalValue: number;
  expiringSoon: number;
  overdue: number;
}

// ===========================================================================
// SYSTEM 6 — Procurement
// ===========================================================================

export interface PurchaseOrder {
  id: string;
  organizationId: string;
  poNumber: string;
  vendor: string;
  description: string;
  amount: number;
  currency: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "fulfilled" | "cancelled";
  budgetCode: string | null;
  approvedBy: string | null;
  createdAt: string;
  fulfilledAt: string | null;
}

export interface ProcurementReport {
  generatedAt: string;
  purchaseOrders: PurchaseOrder[];
  totalOpen: number;
  totalApproved: number;
  totalValue: number;
  byVendor: Array<{ vendor: string; count: number; totalValue: number }>;
  budgetUtilization: Array<{ budgetCode: string; allocated: number; spent: number; percent: number }>;
}

// ===========================================================================
// SYSTEM 7 — Customer Success
// ===========================================================================

export interface CustomerSuccessEntry {
  organizationId: string;
  organizationName: string;
  onboardingStatus: "not_started" | "in_progress" | "completed";
  onboardingProgress: number;
  adoptionScore: number;
  healthScore: number;
  renewalProbability: number;
  trainingCompleted: boolean;
  supportTickets: number;
  openIssues: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  lastContactAt: string | null;
  recommendations: string[];
}

export interface CustomerSuccessReport {
  generatedAt: string;
  entries: CustomerSuccessEntry[];
  totalOrganizations: number;
  avgHealthScore: number;
  avgRenewalProbability: number;
  atRiskCount: number;
}

// ===========================================================================
// SYSTEM 8 — Renewal Intelligence
// ===========================================================================

export interface RenewalPrediction {
  organizationId: string;
  organizationName: string;
  renewalAt: string | null;
  prediction: "will_renew" | "likely_renew" | "at_risk" | "will_churn";
  probability: number;
  expansionOpportunity: number;
  churnRiskFactors: string[];
  recommendedActions: string[];
}

export interface RenewalReport {
  generatedAt: string;
  predictions: RenewalPrediction[];
  totalUpcoming: number;
  willRenew: number;
  atRisk: number;
  willChurn: number;
  potentialExpansionRevenue: number;
}

// ===========================================================================
// SYSTEM 9 — Organization Health
// ===========================================================================

export interface OrganizationHealthReport {
  generatedAt: string;
  organizationId: string;
  overallHealth: number;
  usage: number;
  engagement: number;
  aiAdoption: number;
  teacherAdoption: number;
  studentAdoption: number;
  marketplaceUsage: number;
  curriculumCompletion: number;
  assessmentActivity: number;
  trend: "improving" | "stable" | "declining";
  recommendations: string[];
}

// ===========================================================================
// SYSTEM 10 — Revenue Analytics
// ===========================================================================

export interface RevenueAnalyticsReport {
  generatedAt: string;
  mrr: number;
  arr: number;
  ltv: number;
  cac: number;
  expansionRevenue: number;
  churnRate: number;
  netRevenueRetention: number;
  byCountry: Array<{ country: string; revenue: number; percent: number }>;
  byOrganization: Array<{ organization: string; revenue: number; percent: number }>;
  byFeature: Array<{ feature: string; revenue: number; percent: number }>;
  byAI: { aiRevenue: number; aiCost: number; aiMargin: number; percent: number };
  marketplaceRevenue: number;
  totalRevenue: number;
  recommendations: string[];
}

// ===========================================================================
// SYSTEM 11 — Deployment Manager
// ===========================================================================

export type DeploymentType = "cloud" | "on_prem" | "hybrid";

export interface DeploymentInfo {
  id: string;
  organizationId: string;
  type: DeploymentType;
  version: string;
  status: "provisioning" | "active" | "maintenance" | "decommissioned";
  region: string | null;
  licenseKey: string | null;
  health: "healthy" | "warning" | "critical";
  migrationHistory: Array<{ date: string; fromVersion: string; toVersion: string; status: string }>;
  lastHealthCheck: string;
}

export interface DeploymentReport {
  generatedAt: string;
  deployments: DeploymentInfo[];
  totalDeployments: number;
  activeCount: number;
  byType: Record<DeploymentType, number>;
  needingAttention: number;
}

// ===========================================================================
// SYSTEM 12 — Enterprise Dashboard
// ===========================================================================

export interface EnterpriseDashboard {
  generatedAt: string;
  organizations: { total: number; active: number; newThisMonth: number };
  revenue: { mrr: number; arr: number; growth: number; ytd: number };
  deployments: { total: number; active: number; cloud: number; onPrem: number };
  usage: { activeUsers: number; aiCalls: number; marketplaceVolume: number };
  growth: { userGrowth: number; orgGrowth: number; revenueGrowth: number };
  support: { openTickets: number; avgResolutionHours: number; satisfaction: number };
  contracts: { active: number; expiringSoon: number; totalValue: number };
  subscriptions: { active: number; byTier: Record<string, number> };
  alerts: Array<{ severity: string; title: string; description: string }>;
}

// ===========================================================================
// SYSTEM 13 — Business Forecasting
// ===========================================================================

export interface BusinessForecast {
  generatedAt: string;
  forecasts: Array<{
    metric: string;
    currentValue: number;
    forecastedValue: number;
    unit: string;
    confidence: number;
    trend: "increasing" | "stable" | "decreasing";
    risk: "low" | "medium" | "high";
    dataPoints: Array<{ date: string; value: number }>;
  }>;
}

// ===========================================================================
// SYSTEM 14 — Business Reports
// ===========================================================================

export type ReportType =
  | "executive" | "financial" | "customer" | "subscription"
  | "organization" | "growth" | "usage";

export interface BusinessReport {
  id: string;
  type: ReportType;
  title: string;
  period: string;
  summary: string;
  sections: Array<{ title: string; content: string; metrics: Record<string, number> }>;
  generatedAt: string;
}
