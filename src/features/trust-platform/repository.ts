/**
 * In-memory repository for Trust Platform. Phase 6G.20.
 * Stateless, Redis-compatible storage abstraction.
 */
import type {
  ModerationRegistryEntry,
  SafetyPolicy,
  Report,
  Investigation,
  Evidence,
  Sanction,
  Appeal,
  TrustScoreRule, TrustScore,
  SafetySignal,
  ContentModerationRecord,
  ComplianceRecord,
  ModeratorAssignment, ModeratorRole, ModeratorRoleAssignment,
  ModerationAuditEntry,
} from "./types";

const registry = new Map<string, ModerationRegistryEntry>();
const policies = new Map<string, SafetyPolicy>();
const reports = new Map<string, Report>();
const investigations = new Map<string, Investigation>();
const evidence = new Map<string, Evidence>();
const sanctions = new Map<string, Sanction>();
const appeals = new Map<string, Appeal>();
const trustScoreRules = new Map<string, TrustScoreRule>();
const trustScores = new Map<string, TrustScore>(); // by targetId
const signals = new Map<string, SafetySignal>();
const contentRecords = new Map<string, ContentModerationRecord>();
const complianceRecords = new Map<string, ComplianceRecord>();
const moderatorAssignments = new Map<string, ModeratorAssignment>();
const moderatorRoles = new Map<string, ModeratorRole>();
const moderatorRoleAssignments = new Map<string, ModeratorRoleAssignment>();
const audit: ModerationAuditEntry[] = [];

// === Registry ===
export const storeRegistryEntry = (e: ModerationRegistryEntry) => registry.set(e.id, e);
export const getRegistryEntry = (id: string) => registry.get(id) ?? null;
export const getAllRegistryEntries = () => Array.from(registry.values());

// === Policies ===
export const storePolicy = (p: SafetyPolicy) => policies.set(p.id, p);
export const getPolicy = (id: string) => policies.get(id) ?? null;
export const getPolicyByKey = (key: string) => Array.from(policies.values()).find(p => p.key === key) ?? null;
export const getAllPolicies = () => Array.from(policies.values());

// === Reports ===
export const storeReport = (r: Report) => reports.set(r.id, r);
export const getReport = (id: string) => reports.get(id) ?? null;
export const getAllReports = () => Array.from(reports.values());

// === Investigations ===
export const storeInvestigation = (i: Investigation) => investigations.set(i.id, i);
export const getInvestigation = (id: string) => investigations.get(id) ?? null;
export const getAllInvestigations = () => Array.from(investigations.values());

// === Evidence ===
export const storeEvidence = (e: Evidence) => evidence.set(e.id, e);
export const getEvidence = (id: string) => evidence.get(id) ?? null;
export const getAllEvidence = () => Array.from(evidence.values());

// === Sanctions ===
export const storeSanction = (s: Sanction) => sanctions.set(s.id, s);
export const getSanction = (id: string) => sanctions.get(id) ?? null;
export const getAllSanctions = () => Array.from(sanctions.values());

// === Appeals ===
export const storeAppeal = (a: Appeal) => appeals.set(a.id, a);
export const getAppeal = (id: string) => appeals.get(id) ?? null;
export const getAllAppeals = () => Array.from(appeals.values());

// === Trust Score Rules ===
export const storeTrustScoreRule = (r: TrustScoreRule) => trustScoreRules.set(r.id, r);
export const getTrustScoreRule = (id: string) => trustScoreRules.get(id) ?? null;
export const getTrustScoreRuleByKey = (key: string) => Array.from(trustScoreRules.values()).find(r => r.key === key) ?? null;
export const getAllTrustScoreRules = () => Array.from(trustScoreRules.values());

// === Trust Scores ===
export const storeTrustScore = (s: TrustScore) => trustScores.set(s.targetId, s);
export const getTrustScore = (targetId: string) => trustScores.get(targetId) ?? null;
export const getAllTrustScores = () => Array.from(trustScores.values());

// === Signals ===
export const storeSignal = (s: SafetySignal) => signals.set(s.id, s);
export const getSignal = (id: string) => signals.get(id) ?? null;
export const getAllSignals = () => Array.from(signals.values());

// === Content Records ===
export const storeContentRecord = (c: ContentModerationRecord) => contentRecords.set(c.id, c);
export const getContentRecord = (id: string) => contentRecords.get(id) ?? null;
export const getContentRecordByRef = (ref: string) => Array.from(contentRecords.values()).find(c => c.contentRef === ref) ?? null;
export const getAllContentRecords = () => Array.from(contentRecords.values());

// === Compliance Records ===
export const storeComplianceRecord = (c: ComplianceRecord) => complianceRecords.set(c.id, c);
export const getComplianceRecord = (id: string) => complianceRecords.get(id) ?? null;
export const getAllComplianceRecords = () => Array.from(complianceRecords.values());

// === Moderator Assignments ===
export const storeModeratorAssignment = (a: ModeratorAssignment) => moderatorAssignments.set(a.id, a);
export const getModeratorAssignment = (id: string) => moderatorAssignments.get(id) ?? null;
export const getAllModeratorAssignments = () => Array.from(moderatorAssignments.values());

// === Moderator Roles ===
export const storeModeratorRole = (r: ModeratorRole) => moderatorRoles.set(r.id, r);
export const getModeratorRole = (id: string) => moderatorRoles.get(id) ?? null;
export const getModeratorRoleByKey = (key: string) => Array.from(moderatorRoles.values()).find(r => r.key === key) ?? null;
export const getAllModeratorRoles = () => Array.from(moderatorRoles.values());

// === Moderator Role Assignments ===
export const storeModeratorRoleAssignment = (a: ModeratorRoleAssignment) => moderatorRoleAssignments.set(a.id, a);
export const getModeratorRoleAssignment = (id: string) => moderatorRoleAssignments.get(id) ?? null;
export const getAllModeratorRoleAssignments = () => Array.from(moderatorRoleAssignments.values());

// === Audit ===
export const appendAudit = (e: ModerationAuditEntry) => audit.push(e);
export const getAllAuditEntries = () => audit.slice();
export const getAuditForItem = (itemType: string, itemId: string) => audit.filter(e => e.itemType === itemType && e.itemId === itemId);

// === Reset ===
export function _resetRepositoryForTesting() {
  registry.clear();
  policies.clear();
  reports.clear();
  investigations.clear();
  evidence.clear();
  sanctions.clear();
  appeals.clear();
  trustScoreRules.clear();
  trustScores.clear();
  signals.clear();
  contentRecords.clear();
  complianceRecords.clear();
  moderatorAssignments.clear();
  moderatorRoles.clear();
  moderatorRoleAssignments.clear();
  audit.length = 0;
}
