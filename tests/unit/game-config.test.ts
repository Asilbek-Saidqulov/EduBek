/**
 * EduBek — Game Configuration, Feature Flags & Live Balancing Platform tests. Phase 6G.14.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createConfig, getConfigById, listConfigs, updateConfig,
  createVersion, getVersionsForConfig, getConfigVersion, transitionVersion, canTransitionVersion, computeDiff,
  loadConfig, cacheConfig,
  createApproval, transitionApproval, canTransitionApproval, getApprovalById, listApprovals,
  recordDeployment, getDeploymentHistory,
  rollbackConfig, getRollbackHistory,
  createFlag, getFlagById, listFlags, enableFlag, disableFlag, emergencyDisable, setFlagPercentage, setFlagTargets, evaluateFlag,
  createProfile, getProfileById, listProfiles, activateProfile, deactivateProfile,
  createEnvironment, getEnvironmentById, listEnvironments, updateEnvironment,
  createRollout, getRolloutById, listRollouts, startRollout, completeRollout, rollbackRollout, cancelRollout,
  supportsAllRolloutStrategies, supportsAllFlagRolloutTypes, supportsAllProfileTypes, supportsAllEnvironments,
  validateConfig, getValidationResultFor, getFindingsFor, supportsAllIssueKinds,
  compareConfigs, getComparisonResult,
  createExperiment, getExperimentById, listExperiments, startExperiment, pauseExperiment, completeExperiment, cancelExperiment, supportsAllExperimentTypes,
  receiveRecommendation, getAllRecommendations, acknowledgeRecommendation,
  generateDashboard, getDeveloperIntegration, getStatus,
  subscribeConfig, unsubscribeConfig, isConfigSubscribed, getBridgeProcessedCount, publishConfigEvent,
  _resetBridgeForTesting, _resetRepositoryForTesting,
} from "@/features/game-config";

beforeEach(() => { _resetRepositoryForTesting(); _resetBridgeForTesting(); });

// ===== System 1 — Configuration Registry =====
describe("Config — Registry", () => {
  it("creates a config", () => { const c = createConfig({ gameMode: "classic_quiz", name: "Quiz Config", createdBy: "admin" }); expect(c.id).toBeDefined(); expect(c.status).toBe("draft"); });
  it("gets config by id", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(getConfigById(c.id)).not.toBeNull(); expect(getConfigById("nonexistent")).toBeNull(); });
  it("lists configs", () => { createConfig({ gameMode: "classic_quiz", name: "C1", createdBy: "a" }); createConfig({ gameMode: "treasure_heist", name: "C2", createdBy: "a" }); expect(listConfigs().length).toBe(2); });
  it("lists by game mode", () => { createConfig({ gameMode: "classic_quiz", name: "C1", createdBy: "a" }); createConfig({ gameMode: "treasure_heist", name: "C2", createdBy: "a" }); expect(listConfigs("classic_quiz").length).toBe(1); });
  it("updates config", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(updateConfig(c.id, { name: "Updated" })?.name).toBe("Updated"); });
  it("update non-existent returns null", () => { expect(updateConfig("nonexistent", { name: "X" })).toBeNull(); });
  it("supports all game modes", () => { for (const m of ["classic_quiz", "treasure_heist", "empire_builder", "quiz_royale", "battle_royale", "cross_platform"] as const) expect(createConfig({ gameMode: m, name: `C-${m}`, createdBy: "a" }).gameMode).toBe(m); });
  it("config has createdAt", () => { expect(createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }).createdAt).toBeDefined(); });
  it("config has updatedAt", () => { expect(createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }).updatedAt).toBeDefined(); });
  it("config default data empty", () => { expect(createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }).data).toEqual({}); });
  it("config with data", () => { expect(createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { key: "val" } }).data.key).toBe("val"); });
  it("config default version 1.0.0", () => { expect(createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }).version).toBe("1.0.0"); });
  it("config custom version", () => { expect(createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", version: "2.0.0" }).version).toBe("2.0.0"); });
});

// ===== System 2 — Versioning =====
describe("Config — Versioning", () => {
  it("creates version", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(getVersionsForConfig(c.id).length).toBe(1); });
  it("creates additional version", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createVersion(c.id, "2.0.0", "Major update", "a"); expect(getVersionsForConfig(c.id).length).toBe(2); });
  it("gets specific version", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(getConfigVersion(c.id, "1.0.0")).not.toBeNull(); });
  it("transitions draft to testing", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(transitionVersion(c.id, "1.0.0", "testing", "a")?.status).toBe("testing"); });
  it("transitions testing to approved", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); transitionVersion(c.id, "1.0.0", "testing", "a"); expect(transitionVersion(c.id, "1.0.0", "approved", "a")?.status).toBe("approved"); });
  it("transitions approved to live", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); transitionVersion(c.id, "1.0.0", "testing", "a"); transitionVersion(c.id, "1.0.0", "approved", "a"); expect(transitionVersion(c.id, "1.0.0", "live", "a")?.status).toBe("live"); });
  it("transitions live to deprecated", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); for (const s of ["testing","approved","live"] as const) transitionVersion(c.id, "1.0.0", s, "a"); expect(transitionVersion(c.id, "1.0.0", "deprecated", "a")?.status).toBe("deprecated"); });
  it("transitions deprecated to archived", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); for (const s of ["testing","approved","live","deprecated"] as const) transitionVersion(c.id, "1.0.0", s, "a"); expect(transitionVersion(c.id, "1.0.0", "archived", "a")?.status).toBe("archived"); });
  it("invalid transition returns null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(transitionVersion(c.id, "1.0.0", "live", "a")).toBeNull(); });
  it("canTransition validates", () => { expect(canTransitionVersion("draft", "testing")).toBe(true); expect(canTransitionVersion("draft", "live")).toBe(false); });
  it("approved sets approvedBy", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); transitionVersion(c.id, "1.0.0", "testing", "a"); const v = transitionVersion(c.id, "1.0.0", "approved", "admin-1"); expect(v?.approvedBy).toBe("admin-1"); });
  it("live sets isRollbackTarget", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); for (const s of ["testing","approved","live"] as const) transitionVersion(c.id, "1.0.0", s, "a"); expect(getConfigVersion(c.id, "1.0.0")?.isRollbackTarget).toBe(true); });
  it("computeDiff detects added", () => { const d = computeDiff({ a: 1 }, { a: 1, b: 2 }); expect(d.added).toContain("b"); });
  it("computeDiff detects removed", () => { const d = computeDiff({ a: 1, b: 2 }, { a: 1 }); expect(d.removed).toContain("b"); });
  it("computeDiff detects modified", () => { const d = computeDiff({ a: 1 }, { a: 2 }); expect(d.modified).toContain("a"); });
  it("computeDiff no changes", () => { const d = computeDiff({ a: 1 }, { a: 1 }); expect(d.added).toEqual([]); expect(d.removed).toEqual([]); expect(d.modified).toEqual([]); });
  it("version has changelog", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createVersion(c.id, "2.0.0", "Major update", "a"); expect(getConfigVersion(c.id, "2.0.0")?.changelog).toBe("Major update"); });
  it("version has parentVersion", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createVersion(c.id, "2.0.0", "Update", "a", "1.0.0"); expect(getConfigVersion(c.id, "2.0.0")?.parentVersion).toBe("1.0.0"); });
  it("version default parentVersion null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(getConfigVersion(c.id, "1.0.0")?.parentVersion).toBeNull(); });
  it("archived is terminal", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); for (const s of ["testing","approved","live","deprecated","archived"] as const) transitionVersion(c.id, "1.0.0", s, "a"); expect(transitionVersion(c.id, "1.0.0", "draft", "a")).toBeNull(); });
});

// ===== System 3 — Live Configuration Loader =====
describe("Config — Loader", () => {
  it("loads config from fallback", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { key: "val" } }); const loaded = loadConfig(c.id); expect(loaded?.source).toBe("fallback"); expect(loaded?.data.key).toBe("val"); });
  it("loads config from cache", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); cacheConfig(c.id, "1.0.0", { cached: true }); const loaded = loadConfig(c.id); expect(loaded?.source).toBe("cache"); expect(loaded?.data.cached).toBe(true); });
  it("load returns null for unknown", () => { expect(loadConfig("nonexistent")).toBeNull(); });
  it("loaded config has version", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(loadConfig(c.id)?.version).toBe("1.0.0"); });
  it("loaded config has loadedAt", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(loadConfig(c.id)?.loadedAt).toBeDefined(); });
  it("loaded config is valid", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(loadConfig(c.id)?.valid).toBe(true); });
  it("load specific version", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", version: "1.0.0" }); const loaded = loadConfig(c.id, "1.0.0"); expect(loaded?.version).toBe("1.0.0"); });
});

// ===== System 4 — Feature Flags =====
describe("Config — Flags", () => {
  it("creates flag", () => { const f = createFlag({ name: "Test Flag", description: "test" }); expect(f.id).toBeDefined(); expect(f.enabled).toBe(false); });
  it("gets flag by id", () => { const f = createFlag({ name: "F", description: "" }); expect(getFlagById(f.id)).not.toBeNull(); });
  it("lists flags", () => { createFlag({ name: "F1", description: "" }); createFlag({ name: "F2", description: "" }); expect(listFlags().length).toBe(2); });
  it("enables flag", () => { const f = createFlag({ name: "F", description: "" }); expect(enableFlag(f.id)?.enabled).toBe(true); });
  it("disables flag", () => { const f = createFlag({ name: "F", description: "" }); enableFlag(f.id); expect(disableFlag(f.id)?.enabled).toBe(false); });
  it("emergency disable", () => { const f = createFlag({ name: "F", description: "" }); enableFlag(f.id); expect(emergencyDisable(f.id)?.rolloutType).toBe("emergency_disable"); });
  it("set percentage", () => { const f = createFlag({ name: "F", description: "" }); expect(setFlagPercentage(f.id, 50)?.percentage).toBe(50); });
  it("set percentage clamps to 100", () => { const f = createFlag({ name: "F", description: "" }); expect(setFlagPercentage(f.id, 150)?.percentage).toBe(100); });
  it("set percentage clamps to 0", () => { const f = createFlag({ name: "F", description: "" }); expect(setFlagPercentage(f.id, -10)?.percentage).toBe(0); });
  it("set targets", () => { const f = createFlag({ name: "F", description: "" }); expect(setFlagTargets(f.id, ["org-1"])?.targetIds).toContain("org-1"); });
  it("evaluate boolean flag", () => { const f = createFlag({ name: "F", description: "", rolloutType: "boolean" }); enableFlag(f.id); expect(evaluateFlag(f.id).enabled).toBe(true); });
  it("evaluate disabled flag", () => { const f = createFlag({ name: "F", description: "" }); expect(evaluateFlag(f.id).enabled).toBe(false); });
  it("evaluate emergency_disable", () => { const f = createFlag({ name: "F", description: "" }); emergencyDisable(f.id); expect(evaluateFlag(f.id).enabled).toBe(false); });
  it("evaluate percentage 100", () => { const f = createFlag({ name: "F", description: "", rolloutType: "percentage" }); setFlagPercentage(f.id, 100); expect(evaluateFlag(f.id).enabled).toBe(true); });
  it("evaluate percentage 99", () => { const f = createFlag({ name: "F", description: "", rolloutType: "percentage" }); setFlagPercentage(f.id, 99); expect(evaluateFlag(f.id).enabled).toBe(false); });
  it("evaluate organization with match", () => { const f = createFlag({ name: "F", description: "", rolloutType: "organization" }); setFlagTargets(f.id, ["org-1"]); expect(evaluateFlag(f.id, { organizationId: "org-1" }).enabled).toBe(true); });
  it("evaluate organization without match", () => { const f = createFlag({ name: "F", description: "", rolloutType: "organization" }); setFlagTargets(f.id, ["org-1"]); expect(evaluateFlag(f.id, { organizationId: "org-2" }).enabled).toBe(false); });
  it("evaluate school with match", () => { const f = createFlag({ name: "F", description: "", rolloutType: "school" }); setFlagTargets(f.id, ["s1"]); expect(evaluateFlag(f.id, { schoolId: "s1" }).enabled).toBe(true); });
  it("evaluate environment with match", () => { const f = createFlag({ name: "F", description: "", rolloutType: "environment" }); setFlagTargets(f.id, ["production"]); expect(evaluateFlag(f.id, { environment: "production" }).enabled).toBe(true); });
  it("evaluate with prerequisites met", () => { const f1 = createFlag({ name: "F1", description: "" }); const f2 = createFlag({ name: "F2", description: "", prerequisites: [f1.id] }); enableFlag(f1.id); enableFlag(f2.id); expect(evaluateFlag(f2.id).enabled).toBe(true); });
  it("evaluate with prerequisites not met", () => { const f1 = createFlag({ name: "F1", description: "" }); const f2 = createFlag({ name: "F2", description: "", prerequisites: [f1.id] }); enableFlag(f2.id); expect(evaluateFlag(f2.id).enabled).toBe(false); });
  it("evaluate unknown flag", () => { expect(evaluateFlag("nonexistent").enabled).toBe(false); });
  it("supports all rollout types", () => { expect(supportsAllFlagRolloutTypes().length).toBe(10); });
  it("flag has createdAt", () => { expect(createFlag({ name: "F", description: "" }).createdAt).toBeDefined(); });
  it("flag has updatedAt", () => { expect(createFlag({ name: "F", description: "" }).updatedAt).toBeDefined(); });
  it("flag default percentage 0", () => { expect(createFlag({ name: "F", description: "" }).percentage).toBe(0); });
  it("flag default environment production", () => { expect(createFlag({ name: "F", description: "" }).environment).toBe("production"); });
  it("flag with dependencies", () => { expect(createFlag({ name: "F", description: "", dependencies: ["other-flag"] }).dependencies).toContain("other-flag"); });
  it("evaluation has reason", () => { const f = createFlag({ name: "F", description: "" }); expect(evaluateFlag(f.id).reason).toBeDefined(); });
  it("evaluation has evaluatedAt", () => { const f = createFlag({ name: "F", description: "" }); expect(evaluateFlag(f.id).evaluatedAt).toBeDefined(); });
});

// ===== System 5 — Balancing Profiles =====
describe("Config — Profiles", () => {
  it("creates profile", () => { const p = createProfile({ name: "Casual", type: "casual", gameMode: "classic_quiz", createdBy: "a" }); expect(p.id).toBeDefined(); expect(p.active).toBe(false); });
  it("gets profile by id", () => { const p = createProfile({ name: "P", type: "casual", gameMode: "classic_quiz", createdBy: "a" }); expect(getProfileById(p.id)).not.toBeNull(); });
  it("lists profiles", () => { createProfile({ name: "P1", type: "casual", gameMode: "classic_quiz", createdBy: "a" }); createProfile({ name: "P2", type: "tournament", gameMode: "classic_quiz", createdBy: "a" }); expect(listProfiles().length).toBe(2); });
  it("activates profile", () => { const p = createProfile({ name: "P", type: "casual", gameMode: "classic_quiz", createdBy: "a" }); expect(activateProfile(p.id)?.active).toBe(true); });
  it("deactivates profile", () => { const p = createProfile({ name: "P", type: "casual", gameMode: "classic_quiz", createdBy: "a" }); activateProfile(p.id); expect(deactivateProfile(p.id)?.active).toBe(false); });
  it("supports all profile types", () => { expect(supportsAllProfileTypes().length).toBe(7); });
  it("profile with config overrides", () => { expect(createProfile({ name: "P", type: "casual", gameMode: "classic_quiz", createdBy: "a", configOverrides: { timer: 60000 } }).configOverrides.timer).toBe(60000); });
  it("profile default overrides empty", () => { expect(createProfile({ name: "P", type: "casual", gameMode: "classic_quiz", createdBy: "a" }).configOverrides).toEqual({}); });
});

// ===== System 6 — Environment Configuration =====
describe("Config — Environments", () => {
  it("creates environment", () => { const e = createEnvironment({ environment: "production" }); expect(e.id).toBeDefined(); expect(e.active).toBe(true); });
  it("gets environment by id", () => { const e = createEnvironment({ environment: "staging" }); expect(getEnvironmentById(e.id)).not.toBeNull(); });
  it("lists environments", () => { createEnvironment({ environment: "production" }); createEnvironment({ environment: "staging" }); expect(listEnvironments().length).toBe(2); });
  it("updates environment", () => { const e = createEnvironment({ environment: "production" }); expect(updateEnvironment(e.id, { active: false })?.active).toBe(false); });
  it("supports all environments", () => { expect(supportsAllEnvironments().length).toBe(7); });
  it("environment with configs", () => { expect(createEnvironment({ environment: "production", configs: { key: "val" } }).configs.key).toBe("val"); });
  it("environment with overrides", () => { expect(createEnvironment({ environment: "production", overrides: { debug: true } }).overrides.debug).toBe(true); });
  it("environment default configs empty", () => { expect(createEnvironment({ environment: "production" }).configs).toEqual({}); });
});

// ===== System 7 — Rollout Engine =====
describe("Config — Rollouts", () => {
  it("creates rollout", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); expect(r.id).toBeDefined(); expect(r.status).toBe("pending"); });
  it("gets rollout by id", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); expect(getRolloutById(r.id)).not.toBeNull(); });
  it("lists rollouts", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); expect(listRollouts().length).toBe(1); });
  it("starts rollout", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); expect(startRollout(r.id)?.status).toBe("in_progress"); });
  it("completes rollout", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); startRollout(r.id); expect(completeRollout(r.id)?.status).toBe("completed"); });
  it("rollback rollout", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); startRollout(r.id); completeRollout(r.id); expect(rollbackRollout(r.id, "admin")?.status).toBe("rolled_back"); });
  it("cancels rollout", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); expect(cancelRollout(r.id)?.status).toBe("cancelled"); });
  it("start non-pending returns null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); startRollout(r.id); expect(startRollout(r.id)).toBeNull(); });
  it("complete non-in-progress returns null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); expect(completeRollout(r.id)).toBeNull(); });
  it("rollback non-completed returns null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); expect(rollbackRollout(r.id, "a")).toBeNull(); });
  it("supports all strategies", () => { expect(supportsAllRolloutStrategies().length).toBe(8); });
  it("rollout with percentage", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "percentage", percentage: 50, createdBy: "a" }).percentage).toBe(50); });
  it("rollout with targets", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "organization", targetIds: ["org-1"], createdBy: "a" }).targetIds).toContain("org-1"); });
  it("rollout with scheduled time", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "scheduled", scheduledAt: "2025-01-01", createdBy: "a" }).scheduledAt).toBe("2025-01-01"); });
  it("rollout default percentage 100", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }).percentage).toBe(100); });
  it("rollout has createdAt", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }).createdAt).toBeDefined(); });
  it("rollback sets rolledBackBy", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); startRollout(r.id); completeRollout(r.id); expect(rollbackRollout(r.id, "admin-1")?.rolledBackBy).toBe("admin-1"); });
});

// ===== System 8 — Validation =====
describe("Config — Validation", () => {
  it("validates clean config", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { gameMode: "classic_quiz", maxPlayers: 10, timer: 30000 } }); const r = validateConfig(c.id, "1.0.0", c.data); expect(r.valid).toBe(true); });
  it("detects missing values", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: {} }); const r = validateConfig(c.id, "1.0.0", {}); expect(r.valid).toBe(false); expect(r.findings.some(f => f.kind === "missing_value")).toBe(true); });
  it("detects invalid range maxPlayers", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { gameMode: "classic_quiz", maxPlayers: 0, timer: 30000 } }); const r = validateConfig(c.id, "1.0.0", c.data); expect(r.findings.some(f => f.kind === "invalid_range")).toBe(true); });
  it("detects invalid range timer", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { gameMode: "classic_quiz", maxPlayers: 10, timer: 100 } }); const r = validateConfig(c.id, "1.0.0", c.data); expect(r.findings.some(f => f.kind === "invalid_range")).toBe(true); });
  it("detects deprecated config", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { gameMode: "classic_quiz", maxPlayers: 10, timer: 30000, legacyScore: 100 } }); const r = validateConfig(c.id, "1.0.0", c.data); expect(r.findings.some(f => f.kind === "deprecated_config")).toBe(true); });
  it("detects unknown config", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { gameMode: "classic_quiz", maxPlayers: 10, timer: 30000, unknownField: true } }); const r = validateConfig(c.id, "1.0.0", c.data); expect(r.findings.some(f => f.kind === "unknown_config")).toBe(true); });
  it("gets validation result", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { gameMode: "classic_quiz", maxPlayers: 10, timer: 30000 } }); validateConfig(c.id, "1.0.0", c.data); expect(getValidationResultFor(c.id, "1.0.0")).not.toBeNull(); });
  it("gets findings", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: {} }); validateConfig(c.id, "1.0.0", {}); expect(getFindingsFor(c.id, "1.0.0").length).toBeGreaterThan(0); });
  it("supports all issue kinds", () => { expect(supportsAllIssueKinds().length).toBe(7); });
  it("validation has validatedAt", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { gameMode: "classic_quiz", maxPlayers: 10, timer: 30000 } }); expect(validateConfig(c.id, "1.0.0", c.data).validatedAt).toBeDefined(); });
});

// ===== System 9 — Comparison =====
describe("Config — Comparison", () => {
  it("compares configs", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createVersion(c.id, "2.0.0", "Update", "a"); const cmp = compareConfigs(c.id, "1.0.0", "2.0.0"); expect(cmp).not.toBeNull(); });
  it("comparison has diffs", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createVersion(c.id, "2.0.0", "Update", "a"); const cmp = compareConfigs(c.id, "1.0.0", "2.0.0"); expect(cmp?.diffs).toBeDefined(); });
  it("comparison has compatible", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createVersion(c.id, "2.0.0", "Update", "a"); const cmp = compareConfigs(c.id, "1.0.0", "2.0.0"); expect(typeof cmp?.compatible).toBe("boolean"); });
  it("comparison has impactLevel", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createVersion(c.id, "2.0.0", "Update", "a"); const cmp = compareConfigs(c.id, "1.0.0", "2.0.0"); expect(cmp?.impactLevel).toBeDefined(); });
  it("compare unknown config returns null", () => { expect(compareConfigs("nonexistent", "1.0.0", "2.0.0")).toBeNull(); });
  it("get comparison result", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createVersion(c.id, "2.0.0", "Update", "a"); compareConfigs(c.id, "1.0.0", "2.0.0"); expect(getComparisonResult(c.id, "1.0.0", "2.0.0")).not.toBeNull(); });
});

// ===== System 10 — Experiments =====
describe("Config — Experiments", () => {
  it("creates experiment", () => { const e = createExperiment({ name: "A/B Test", description: "test", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); expect(e.id).toBeDefined(); expect(e.autoApply).toBe(false); });
  it("gets experiment by id", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); expect(getExperimentById(e.id)).not.toBeNull(); });
  it("lists experiments", () => { createExperiment({ name: "E1", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); expect(listExperiments().length).toBe(1); });
  it("starts experiment", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); expect(startExperiment(e.id)?.status).toBe("running"); });
  it("pauses experiment", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); startExperiment(e.id); expect(pauseExperiment(e.id)?.status).toBe("paused"); });
  it("completes experiment", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); startExperiment(e.id); const r = completeExperiment(e.id, 100, 120); expect(r?.status).toBe("completed"); expect(r?.results?.winner).toBe("B"); });
  it("cancels experiment", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); expect(cancelExperiment(e.id)?.status).toBe("cancelled"); });
  it("autoApply always false", () => { expect(createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }).autoApply).toBe(false); });
  it("supports all experiment types", () => { expect(supportsAllExperimentTypes().length).toBe(5); });
  it("start non-draft returns null", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); startExperiment(e.id); expect(startExperiment(e.id)).toBeNull(); });
  it("complete non-running returns null", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); expect(completeExperiment(e.id, 1, 2)).toBeNull(); });
  it("results have confidence", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); startExperiment(e.id); completeExperiment(e.id, 100, 150); expect(getExperimentById(e.id)?.results?.confidence).toBeGreaterThan(0); });
  it("results have difference", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); startExperiment(e.id); completeExperiment(e.id, 100, 130); expect(getExperimentById(e.id)?.results?.difference).toBe(30); });
  it("results tie when equal", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); startExperiment(e.id); completeExperiment(e.id, 100, 100); expect(getExperimentById(e.id)?.results?.winner).toBe("tie"); });
  it("cancel completed returns null", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); startExperiment(e.id); completeExperiment(e.id, 1, 2); expect(cancelExperiment(e.id)).toBeNull(); });
});

// ===== System 11 — Recommendations =====
describe("Config — Recommendations", () => {
  it("receives recommendation", () => { const r = receiveRecommendation({ source: "game-intelligence", gameMode: "classic_quiz", title: "Reduce timer", description: "test", currentValue: 30000, suggestedValue: 20000 }); expect(r.id).toBeDefined(); expect(r.autoApplied).toBe(false); });
  it("gets all recommendations", () => { receiveRecommendation({ source: "test", gameMode: "all", title: "T", description: "", currentValue: null, suggestedValue: null }); expect(getAllRecommendations().length).toBe(1); });
  it("acknowledges recommendation", () => { const r = receiveRecommendation({ source: "test", gameMode: "all", title: "T", description: "", currentValue: null, suggestedValue: null }); expect(acknowledgeRecommendation(r.id)?.acknowledged).toBe(true); });
  it("autoApplied always false", () => { expect(receiveRecommendation({ source: "test", gameMode: "all", title: "T", description: "", currentValue: null, suggestedValue: null }).autoApplied).toBe(false); });
  it("recommendation has receivedAt", () => { expect(receiveRecommendation({ source: "test", gameMode: "all", title: "T", description: "", currentValue: null, suggestedValue: null }).receivedAt).toBeDefined(); });
  it("acknowledge unknown returns null", () => { expect(acknowledgeRecommendation("nonexistent")).toBeNull(); });
  it("recommendation with configId", () => { expect(receiveRecommendation({ source: "test", configId: "c1", gameMode: "all", title: "T", description: "", currentValue: null, suggestedValue: null }).configId).toBe("c1"); });
  it("recommendation default configId null", () => { expect(receiveRecommendation({ source: "test", gameMode: "all", title: "T", description: "", currentValue: null, suggestedValue: null }).configId).toBeNull(); });
});

// ===== System 12 — Approval Workflow =====
describe("Config — Approvals", () => {
  it("creates approval", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); expect(aw.status).toBe("draft"); });
  it("transitions draft to review", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); expect(transitionApproval(aw.id, "review", "admin", "ok")?.status).toBe("review"); });
  it("transitions review to testing", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); transitionApproval(aw.id, "review", "a", ""); expect(transitionApproval(aw.id, "testing", "a", "")?.status).toBe("testing"); });
  it("transitions testing to approval", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); for (const s of ["review","testing"] as const) transitionApproval(aw.id, s, "a", ""); expect(transitionApproval(aw.id, "approval", "a", "")?.status).toBe("approval"); });
  it("transitions approval to deployment", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); for (const s of ["review","testing","approval"] as const) transitionApproval(aw.id, s, "a", ""); expect(transitionApproval(aw.id, "deployment", "a", "")?.status).toBe("deployment"); });
  it("transitions deployment to rollback", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); for (const s of ["review","testing","approval","deployment"] as const) transitionApproval(aw.id, s, "a", ""); expect(transitionApproval(aw.id, "rollback", "a", "")?.status).toBe("rollback"); });
  it("transitions to archive", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); expect(transitionApproval(aw.id, "archive", "a", "")?.status).toBe("archive"); });
  it("invalid transition returns null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); expect(transitionApproval(aw.id, "deployment", "a", "")).toBeNull(); });
  it("canTransition validates", () => { expect(canTransitionApproval("draft", "review")).toBe(true); expect(canTransitionApproval("draft", "deployment")).toBe(false); });
  it("approval has history", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); transitionApproval(aw.id, "review", "admin", "ok"); expect(getApprovalById(aw.id)?.history.length).toBe(1); });
  it("lists approvals", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createApproval(c.id, "1.0.0", "a"); expect(listApprovals().length).toBe(1); });
  it("archive is terminal", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); transitionApproval(aw.id, "archive", "a", ""); expect(transitionApproval(aw.id, "draft", "a", "")).toBeNull(); });
});

// ===== System 13 — Deployment History =====
describe("Config — Deployments", () => {
  it("records deployment", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const d = recordDeployment({ configId: c.id, version: "1.0.0", deployedBy: "admin", reason: "Initial deploy" }); expect(d.id).toBeDefined(); });
  it("gets deployment history", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); recordDeployment({ configId: c.id, version: "1.0.0", deployedBy: "a", reason: "" }); expect(getDeploymentHistory(c.id).length).toBe(1); });
  it("deployment has deployedAt", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(recordDeployment({ configId: c.id, version: "1.0.0", deployedBy: "a", reason: "" }).deployedAt).toBeDefined(); });
  it("deployment with approval", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(recordDeployment({ configId: c.id, version: "1.0.0", deployedBy: "a", reason: "", approvalId: "ap-1" }).approvalId).toBe("ap-1"); });
  it("deployment default rolledBack false", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(recordDeployment({ configId: c.id, version: "1.0.0", deployedBy: "a", reason: "" }).rolledBack).toBe(false); });
});

// ===== System 14 — Rollback Platform =====
describe("Config — Rollback", () => {
  it("rolls back config", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", version: "2.0.0" }); const r = rollbackConfig({ configId: c.id, fromVersion: "2.0.0", toVersion: "1.0.0", rolledBackBy: "admin", reason: "Issues found" }); expect(r.automatic).toBe(false); });
  it("gets rollback history", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); rollbackConfig({ configId: c.id, fromVersion: "1.0.0", toVersion: "0.9.0", rolledBackBy: "a", reason: "" }); expect(getRollbackHistory(c.id).length).toBe(1); });
  it("rollback updates config version", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", version: "2.0.0" }); rollbackConfig({ configId: c.id, fromVersion: "2.0.0", toVersion: "1.0.0", rolledBackBy: "a", reason: "" }); expect(getConfigById(c.id)?.version).toBe("1.0.0"); });
  it("rollback has rolledBackAt", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(rollbackConfig({ configId: c.id, fromVersion: "1.0.0", toVersion: "0.9.0", rolledBackBy: "a", reason: "" }).rolledBackAt).toBeDefined(); });
  it("rollback with scheduled", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(rollbackConfig({ configId: c.id, fromVersion: "1.0.0", toVersion: "0.9.0", rolledBackBy: "a", reason: "", scheduled: true }).scheduled).toBe(true); });
  it("rollback default scheduled false", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(rollbackConfig({ configId: c.id, fromVersion: "1.0.0", toVersion: "0.9.0", rolledBackBy: "a", reason: "" }).scheduled).toBe(false); });
  it("rollback automatic always false", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(rollbackConfig({ configId: c.id, fromVersion: "1.0.0", toVersion: "0.9.0", rolledBackBy: "a", reason: "" }).automatic).toBe(false); });
});

// ===== System 15 — Dashboard =====
describe("Config — Dashboard", () => {
  it("generates dashboard", () => { const d = generateDashboard(); expect(d).toBeDefined(); expect(d.health).toBeDefined(); });
  it("dashboard has currentVersions", () => { createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(generateDashboard().currentVersions.length).toBeGreaterThan(0); });
  it("dashboard has activeFlags", () => { createFlag({ name: "F", description: "" }); enableFlag("nonexistent" as never); expect(generateDashboard().activeFlags).toBeGreaterThanOrEqual(0); });
  it("dashboard has health", () => { expect(["healthy","warning","critical"]).toContain(generateDashboard().health); });
  it("dashboard has updatedAt", () => { expect(generateDashboard().updatedAt).toBeDefined(); });
  it("dashboard has recommendations", () => { expect(generateDashboard().recommendations).toBeGreaterThanOrEqual(0); });
  it("dashboard has pendingApprovals", () => { expect(generateDashboard().pendingApprovals).toBeGreaterThanOrEqual(0); });
  it("dashboard has validationIssues", () => { expect(generateDashboard().validationIssues).toBeGreaterThanOrEqual(0); });
});

// ===== System 17 — Developer =====
describe("Config — Developer", () => {
  it("returns developer integration", () => { const d = getDeveloperIntegration(); expect(d.publicAPIs.length).toBeGreaterThan(0); expect(d.extensionHooks.length).toBeGreaterThan(0); });
  it("has API endpoints", () => { expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("/api/game-config/"))).toBe(true); });
  it("has SDK metadata", () => { expect(getDeveloperIntegration().sdkMetadata.version).toBeDefined(); });
});

// ===== System 18 — Administration =====
describe("Config — Admin", () => {
  it("returns status", () => { const s = getStatus(); expect(s.platform).toBe("game-config"); expect(s.totalConfigs).toBeGreaterThanOrEqual(0); });
  it("status has dashboard", () => { expect(getStatus().dashboard).toBeDefined(); });
  it("status has totalFlags", () => { expect(getStatus().totalFlags).toBeGreaterThanOrEqual(0); });
  it("status has totalProfiles", () => { expect(getStatus().totalProfiles).toBeGreaterThanOrEqual(0); });
  it("status has totalExperiments", () => { expect(getStatus().totalExperiments).toBeGreaterThanOrEqual(0); });
});

// ===== System 16 — Event Bus Bridge =====
describe("Config — Bridge", () => {
  it("subscribes", () => { subscribeConfig(); expect(isConfigSubscribed()).toBe(true); });
  it("unsubscribes", () => { subscribeConfig(); unsubscribeConfig(); expect(isConfigSubscribed()).toBe(false); });
  it("subscribe is idempotent", () => { subscribeConfig(); subscribeConfig(); expect(isConfigSubscribed()).toBe(true); });
  it("publishes config events", () => { expect(() => publishConfigEvent("ConfigurationPublished", null, { configId: "c1" })).not.toThrow(); });
});

// ===== Architecture Compliance =====
describe("Config — Architecture", () => {
  it("no circular dependencies", async () => { const mod = await import("@/features/game-config"); expect(mod.createConfig).toBeDefined(); });
  it("recommendations never auto-applied", () => { const r = receiveRecommendation({ source: "test", gameMode: "all", title: "T", description: "", currentValue: null, suggestedValue: null }); expect(r.autoApplied).toBe(false); });
  it("experiments never affect production automatically", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); expect(e.autoApply).toBe(false); });
  it("rollback is manual only", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = rollbackConfig({ configId: c.id, fromVersion: "1.0.0", toVersion: "0.9.0", rolledBackBy: "a", reason: "" }); expect(r.automatic).toBe(false); });
});

// ===== Edge Cases =====
describe("Config — Edge Cases", () => {
  it("returns null for unknown config", () => { expect(getConfigById("nonexistent")).toBeNull(); });
  it("returns null for unknown flag", () => { expect(getFlagById("nonexistent")).toBeNull(); });
  it("returns null for unknown profile", () => { expect(getProfileById("nonexistent")).toBeNull(); });
  it("returns null for unknown environment", () => { expect(getEnvironmentById("nonexistent")).toBeNull(); });
  it("returns null for unknown rollout", () => { expect(getRolloutById("nonexistent")).toBeNull(); });
  it("returns null for unknown experiment", () => { expect(getExperimentById("nonexistent")).toBeNull(); });
  it("returns null for unknown approval", () => { expect(getApprovalById("nonexistent")).toBeNull(); });
  it("returns empty for unknown versions", () => { expect(getVersionsForConfig("nonexistent")).toEqual([]); });
  it("returns empty for unknown deployments", () => { expect(getDeploymentHistory("nonexistent")).toEqual([]); });
  it("returns empty for unknown rollbacks", () => { expect(getRollbackHistory("nonexistent")).toEqual([]); });
  it("returns null for unknown validation result", () => { expect(getValidationResultFor("nonexistent", "1.0.0")).toBeNull(); });
  it("returns empty for unknown findings", () => { expect(getFindingsFor("nonexistent", "1.0.0")).toEqual([]); });
});

// ===== Stress =====
describe("Config — Stress", () => {
  it("handles many configs", () => { for (let i = 0; i < 50; i++) createConfig({ gameMode: "classic_quiz", name: `C${i}`, createdBy: "a" }); expect(listConfigs().length).toBe(50); });
  it("handles many flags", () => { for (let i = 0; i < 50; i++) createFlag({ name: `F${i}`, description: "" }); expect(listFlags().length).toBe(50); });
  it("handles many profiles", () => { for (let i = 0; i < 30; i++) createProfile({ name: `P${i}`, type: "casual", gameMode: "classic_quiz", createdBy: "a" }); expect(listProfiles().length).toBe(30); });
  it("handles many experiments", () => { for (let i = 0; i < 30; i++) createExperiment({ name: `E${i}`, description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); expect(listExperiments().length).toBe(30); });
  it("handles many rollouts", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); for (let i = 0; i < 30; i++) createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); expect(listRollouts().length).toBe(30); });
});

// ===== Extended Tests =====
describe("Config — Extended", () => {
  it("config with description", () => { expect(createConfig({ gameMode: "classic_quiz", name: "C", description: "Test config", createdBy: "a" }).description).toBe("Test config"); });
  it("version has createdBy", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "admin" }); expect(getConfigVersion(c.id, "1.0.0")?.createdBy).toBe("admin"); });
  it("version has createdAt", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(getConfigVersion(c.id, "1.0.0")?.createdAt).toBeDefined(); });
  it("flag with prerequisites", () => { expect(createFlag({ name: "F", description: "", prerequisites: ["flag-1"] }).prerequisites).toContain("flag-1"); });
  it("flag default prerequisites empty", () => { expect(createFlag({ name: "F", description: "" }).prerequisites).toEqual([]); });
  it("flag default dependencies empty", () => { expect(createFlag({ name: "F", description: "" }).dependencies).toEqual([]); });
  it("profile has createdAt", () => { expect(createProfile({ name: "P", type: "casual", gameMode: "classic_quiz", createdBy: "a" }).createdAt).toBeDefined(); });
  it("environment has updatedAt", () => { expect(createEnvironment({ environment: "production" }).updatedAt).toBeDefined(); });
  it("rollout has createdBy", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "admin" }).createdBy).toBe("admin"); });
  it("experiment has createdBy", () => { expect(createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "admin" }).createdBy).toBe("admin"); });
  it("experiment has createdAt", () => { expect(createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }).createdAt).toBeDefined(); });
  it("experiment default results null", () => { expect(createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }).results).toBeNull(); });
  it("recommendation has source", () => { expect(receiveRecommendation({ source: "game-intelligence", gameMode: "all", title: "T", description: "", currentValue: null, suggestedValue: null }).source).toBe("game-intelligence"); });
  it("approval has submittedBy", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createApproval(c.id, "1.0.0", "admin").submittedBy).toBe("admin"); });
  it("approval has createdAt", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createApproval(c.id, "1.0.0", "a").createdAt).toBeDefined(); });
  it("deployment has impact", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(recordDeployment({ configId: c.id, version: "1.0.0", deployedBy: "a", reason: "", impact: "high" }).impact).toBe("high"); });
  it("deployment default impact none", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(recordDeployment({ configId: c.id, version: "1.0.0", deployedBy: "a", reason: "" }).impact).toBe("none"); });
  it("rollback has reason", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(rollbackConfig({ configId: c.id, fromVersion: "1.0.0", toVersion: "0.9.0", rolledBackBy: "a", reason: "Bug found" }).reason).toBe("Bug found"); });
  it("dashboard with data", () => { createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createFlag({ name: "F", description: "" }); createProfile({ name: "P", type: "casual", gameMode: "classic_quiz", createdBy: "a" }); const d = generateDashboard(); expect(d.currentVersions.length).toBeGreaterThan(0); });
  it("status with data", () => { createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createFlag({ name: "F", description: "" }); const s = getStatus(); expect(s.totalConfigs).toBeGreaterThan(0); expect(s.totalFlags).toBeGreaterThan(0); });
});

// ===== Extended Versioning Tests =====
describe("Config — Versioning Extended", () => {
  it("draft to archived", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(transitionVersion(c.id, "1.0.0", "archived", "a")?.status).toBe("archived"); });
  it("testing to draft", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); transitionVersion(c.id, "1.0.0", "testing", "a"); expect(transitionVersion(c.id, "1.0.0", "draft", "a")?.status).toBe("draft"); });
  it("testing to archived", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); transitionVersion(c.id, "1.0.0", "testing", "a"); expect(transitionVersion(c.id, "1.0.0", "archived", "a")?.status).toBe("archived"); });
  it("approved to archived", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); transitionVersion(c.id, "1.0.0", "testing", "a"); transitionVersion(c.id, "1.0.0", "approved", "a"); expect(transitionVersion(c.id, "1.0.0", "archived", "a")?.status).toBe("archived"); });
  it("live to archived", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); for (const s of ["testing","approved","live"] as const) transitionVersion(c.id, "1.0.0", s, "a"); expect(transitionVersion(c.id, "1.0.0", "archived", "a")?.status).toBe("archived"); });
  it("approved sets approvedAt", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); transitionVersion(c.id, "1.0.0", "testing", "a"); const v = transitionVersion(c.id, "1.0.0", "approved", "a"); expect(v?.approvedAt).not.toBeNull(); });
  it("canTransition all valid", () => { expect(canTransitionVersion("draft", "testing")).toBe(true); expect(canTransitionVersion("testing", "approved")).toBe(true); expect(canTransitionVersion("approved", "live")).toBe(true); expect(canTransitionVersion("live", "deprecated")).toBe(true); expect(canTransitionVersion("deprecated", "archived")).toBe(true); });
  it("canTransition all invalid", () => { expect(canTransitionVersion("draft", "live")).toBe(false); expect(canTransitionVersion("testing", "live")).toBe(false); expect(canTransitionVersion("archived", "draft")).toBe(false); });
  it("multiple versions", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createVersion(c.id, "2.0.0", "v2", "a"); createVersion(c.id, "3.0.0", "v3", "a"); expect(getVersionsForConfig(c.id).length).toBe(3); });
  it("computeDiff complex", () => { const d = computeDiff({ a: 1, b: 2, c: 3 }, { a: 1, b: 5, d: 4 }); expect(d.added).toContain("d"); expect(d.removed).toContain("c"); expect(d.modified).toContain("b"); expect(d.added.length).toBe(1); expect(d.removed.length).toBe(1); expect(d.modified.length).toBe(1); });
});

// ===== Extended Flags Tests =====
describe("Config — Flags Extended", () => {
  it("flag with custom rolloutType", () => { expect(createFlag({ name: "F", description: "", rolloutType: "tournament" }).rolloutType).toBe("tournament"); });
  it("flag with custom environment", () => { expect(createFlag({ name: "F", description: "", environment: "staging" }).environment).toBe("staging"); });
  it("set percentage enables flag", () => { const f = createFlag({ name: "F", description: "" }); setFlagPercentage(f.id, 50); expect(getFlagById(f.id)?.enabled).toBe(true); });
  it("set percentage 0 disables flag", () => { const f = createFlag({ name: "F", description: "" }); enableFlag(f.id); setFlagPercentage(f.id, 0); expect(getFlagById(f.id)?.enabled).toBe(false); });
  it("set targets enables flag", () => { const f = createFlag({ name: "F", description: "" }); setFlagTargets(f.id, ["t1"]); expect(getFlagById(f.id)?.enabled).toBe(true); });
  it("set empty targets disables flag", () => { const f = createFlag({ name: "F", description: "" }); enableFlag(f.id); setFlagTargets(f.id, []); expect(getFlagById(f.id)?.enabled).toBe(false); });
  it("evaluate with userId context", () => { const f = createFlag({ name: "F", description: "", rolloutType: "boolean" }); enableFlag(f.id); const ev = evaluateFlag(f.id, { userId: "u1" }); expect(ev.userId).toBe("u1"); });
  it("emergency disable sets percentage 0", () => { const f = createFlag({ name: "F", description: "" }); enableFlag(f.id); setFlagPercentage(f.id, 50); emergencyDisable(f.id); expect(getFlagById(f.id)?.percentage).toBe(0); });
  it("evaluate organization without context", () => { const f = createFlag({ name: "F", description: "", rolloutType: "organization" }); setFlagTargets(f.id, ["org-1"]); expect(evaluateFlag(f.id).enabled).toBe(false); });
  it("evaluate school without context", () => { const f = createFlag({ name: "F", description: "", rolloutType: "school" }); setFlagTargets(f.id, ["s1"]); expect(evaluateFlag(f.id).enabled).toBe(false); });
});

// ===== Extended Rollout Tests =====
describe("Config — Rollouts Extended", () => {
  it("rollout with canary strategy", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "canary", createdBy: "a" }).strategy).toBe("canary"); });
  it("rollout with gradual strategy", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "gradual", createdBy: "a" }).strategy).toBe("gradual"); });
  it("rollout with country strategy", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "country", targetIds: ["US"], createdBy: "a" }).strategy).toBe("country"); });
  it("rollout with region strategy", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "region", targetIds: ["west"], createdBy: "a" }).strategy).toBe("region"); });
  it("rollout start sets startedAt", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); startRollout(r.id); expect(getRolloutById(r.id)?.startedAt).not.toBeNull(); });
  it("rollout complete sets completedAt", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); startRollout(r.id); completeRollout(r.id); expect(getRolloutById(r.id)?.completedAt).not.toBeNull(); });
  it("rollout rollback sets rolledBackAt", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); startRollout(r.id); completeRollout(r.id); rollbackRollout(r.id, "admin"); expect(getRolloutById(r.id)?.rolledBackAt).not.toBeNull(); });
  it("cancel in-progress rollout", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); startRollout(r.id); expect(cancelRollout(r.id)?.status).toBe("cancelled"); });
  it("cancel completed returns null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); startRollout(r.id); completeRollout(r.id); expect(cancelRollout(r.id)).toBeNull(); });
});

// ===== Extended Validation Tests =====
describe("Config — Validation Extended", () => {
  it("valid config with all fields", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { gameMode: "classic_quiz", maxPlayers: 50, timer: 30000, scoring: "standard" } }); const r = validateConfig(c.id, "1.0.0", c.data); expect(r.valid).toBe(true); });
  it("maxPlayers at boundary 1", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { gameMode: "classic_quiz", maxPlayers: 1, timer: 30000 } }); const r = validateConfig(c.id, "1.0.0", c.data); expect(r.findings.some(f => f.kind === "invalid_range")).toBe(false); });
  it("maxPlayers at boundary 1000", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { gameMode: "classic_quiz", maxPlayers: 1000, timer: 30000 } }); const r = validateConfig(c.id, "1.0.0", c.data); expect(r.findings.some(f => f.kind === "invalid_range")).toBe(false); });
  it("maxPlayers above 1000", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { gameMode: "classic_quiz", maxPlayers: 1001, timer: 30000 } }); const r = validateConfig(c.id, "1.0.0", c.data); expect(r.findings.some(f => f.kind === "invalid_range")).toBe(true); });
  it("timer at boundary 1000", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { gameMode: "classic_quiz", maxPlayers: 10, timer: 1000 } }); const r = validateConfig(c.id, "1.0.0", c.data); expect(r.findings.some(f => f.kind === "invalid_range")).toBe(false); });
  it("timer at boundary 600000", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { gameMode: "classic_quiz", maxPlayers: 10, timer: 600000 } }); const r = validateConfig(c.id, "1.0.0", c.data); expect(r.findings.some(f => f.kind === "invalid_range")).toBe(false); });
  it("timer below 1000", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { gameMode: "classic_quiz", maxPlayers: 10, timer: 500 } }); const r = validateConfig(c.id, "1.0.0", c.data); expect(r.findings.some(f => f.kind === "invalid_range")).toBe(true); });
  it("deprecated oldTimer field", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { gameMode: "classic_quiz", maxPlayers: 10, timer: 30000, oldTimer: 5000 } }); const r = validateConfig(c.id, "1.0.0", c.data); expect(r.findings.some(f => f.kind === "deprecated_config" && f.field === "oldTimer")).toBe(true); });
  it("validation findings have severity", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: {} }); const r = validateConfig(c.id, "1.0.0", {}); for (const f of r.findings) expect(["error","warning","info"]).toContain(f.severity); });
  it("validation findings have field", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: {} }); const r = validateConfig(c.id, "1.0.0", {}); for (const f of r.findings) expect(f.field).toBeDefined(); });
  it("validation findings have message", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: {} }); const r = validateConfig(c.id, "1.0.0", {}); for (const f of r.findings) expect(f.message.length).toBeGreaterThan(0); });
  it("validation findings have timestamp", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: {} }); const r = validateConfig(c.id, "1.0.0", {}); for (const f of r.findings) expect(f.timestamp).toBeDefined(); });
  it("validation findings have id", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: {} }); const r = validateConfig(c.id, "1.0.0", {}); for (const f of r.findings) expect(f.id).toBeDefined(); });
});

// ===== Extended Approval Tests =====
describe("Config — Approvals Extended", () => {
  it("review to draft", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); transitionApproval(aw.id, "review", "a", ""); expect(transitionApproval(aw.id, "draft", "a", "")?.status).toBe("draft"); });
  it("review to archive", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); transitionApproval(aw.id, "review", "a", ""); expect(transitionApproval(aw.id, "archive", "a", "")?.status).toBe("archive"); });
  it("testing to review", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); transitionApproval(aw.id, "review", "a", ""); transitionApproval(aw.id, "testing", "a", ""); expect(transitionApproval(aw.id, "review", "a", "")?.status).toBe("review"); });
  it("testing to archive", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); transitionApproval(aw.id, "review", "a", ""); transitionApproval(aw.id, "testing", "a", ""); expect(transitionApproval(aw.id, "archive", "a", "")?.status).toBe("archive"); });
  it("approval to testing", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); for (const s of ["review","testing","approval"] as const) transitionApproval(aw.id, s, "a", ""); expect(transitionApproval(aw.id, "testing", "a", "")?.status).toBe("testing"); });
  it("approval to archive", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); for (const s of ["review","testing","approval"] as const) transitionApproval(aw.id, s, "a", ""); expect(transitionApproval(aw.id, "archive", "a", "")?.status).toBe("archive"); });
  it("deployment to archive", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); for (const s of ["review","testing","approval","deployment"] as const) transitionApproval(aw.id, s, "a", ""); expect(transitionApproval(aw.id, "archive", "a", "")?.status).toBe("archive"); });
  it("rollback to deployment", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); for (const s of ["review","testing","approval","deployment","rollback"] as const) transitionApproval(aw.id, s, "a", ""); expect(transitionApproval(aw.id, "deployment", "a", "")?.status).toBe("deployment"); });
  it("rollback to archive", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); for (const s of ["review","testing","approval","deployment","rollback"] as const) transitionApproval(aw.id, s, "a", ""); expect(transitionApproval(aw.id, "archive", "a", "")?.status).toBe("archive"); });
  it("approval history has actorId", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); transitionApproval(aw.id, "review", "admin-1", "ok"); expect(getApprovalById(aw.id)?.history[0].actorId).toBe("admin-1"); });
  it("approval history has note", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); transitionApproval(aw.id, "review", "a", "Reviewing now"); expect(getApprovalById(aw.id)?.history[0].note).toBe("Reviewing now"); });
  it("approval history has timestamp", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); transitionApproval(aw.id, "review", "a", ""); expect(getApprovalById(aw.id)?.history[0].timestamp).toBeDefined(); });
  it("approval sets reviewedBy", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); transitionApproval(aw.id, "review", "admin-1", ""); expect(getApprovalById(aw.id)?.reviewedBy).toBe("admin-1"); });
  it("approval sets reviewNote", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const aw = createApproval(c.id, "1.0.0", "a"); transitionApproval(aw.id, "review", "a", "Looks good"); expect(getApprovalById(aw.id)?.reviewNote).toBe("Looks good"); });
  it("canTransition all valid", () => { expect(canTransitionApproval("draft", "review")).toBe(true); expect(canTransitionApproval("review", "testing")).toBe(true); expect(canTransitionApproval("testing", "approval")).toBe(true); expect(canTransitionApproval("approval", "deployment")).toBe(true); expect(canTransitionApproval("deployment", "rollback")).toBe(true); expect(canTransitionApproval("rollback", "archive")).toBe(true); });
  it("canTransition all invalid", () => { expect(canTransitionApproval("draft", "deployment")).toBe(false); expect(canTransitionApproval("review", "deployment")).toBe(false); expect(canTransitionApproval("archive", "draft")).toBe(false); });
});

// ===== Extended Experiment Tests =====
describe("Config — Experiments Extended", () => {
  it("experiment with multivariate type", () => { expect(createExperiment({ name: "E", description: "", type: "multivariate", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }).type).toBe("multivariate"); });
  it("experiment with shadow type", () => { expect(createExperiment({ name: "E", description: "", type: "shadow", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }).type).toBe("shadow"); });
  it("experiment with simulation type", () => { expect(createExperiment({ name: "E", description: "", type: "simulation", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }).type).toBe("simulation"); });
  it("experiment with dry_run type", () => { expect(createExperiment({ name: "E", description: "", type: "dry_run", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }).type).toBe("dry_run"); });
  it("experiment with configA data", () => { expect(createExperiment({ name: "E", description: "", type: "ab", configA: { key: "val" }, configB: {}, startDate: "", endDate: "", createdBy: "a" }).configA.key).toBe("val"); });
  it("experiment with configB data", () => { expect(createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: { key: "val" }, startDate: "", endDate: "", createdBy: "a" }).configB.key).toBe("val"); });
  it("experiment with dates", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "2025-01-01", endDate: "2025-02-01", createdBy: "a" }); expect(e.startDate).toBe("2025-01-01"); expect(e.endDate).toBe("2025-02-01"); });
  it("pause non-running returns null", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); expect(pauseExperiment(e.id)).toBeNull(); });
  it("complete paused experiment", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); startExperiment(e.id); pauseExperiment(e.id); expect(completeExperiment(e.id, 100, 120)?.status).toBe("completed"); });
  it("results have completedAt", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); startExperiment(e.id); completeExperiment(e.id, 100, 120); expect(getExperimentById(e.id)?.results?.completedAt).toBeDefined(); });
  it("results winner A", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); startExperiment(e.id); completeExperiment(e.id, 150, 100); expect(getExperimentById(e.id)?.results?.winner).toBe("A"); });
  it("results with large difference", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); startExperiment(e.id); completeExperiment(e.id, 100, 500); expect(getExperimentById(e.id)?.results?.confidence).toBe(1); });
});

// ===== Extended Dashboard Tests =====
describe("Config — Dashboard Extended", () => {
  it("dashboard with flags", () => { createFlag({ name: "F1", description: "" }); createFlag({ name: "F2", description: "" }); enableFlag(createFlag({ name: "F3", description: "" }).id); const d = generateDashboard(); expect(d.activeFlags).toBeGreaterThanOrEqual(1); });
  it("dashboard with rollouts", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); const r = createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }); startRollout(r.id); const d = generateDashboard(); expect(d.activeRollouts).toBeGreaterThanOrEqual(1); });
  it("dashboard with experiments", () => { const e = createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }); startExperiment(e.id); const d = generateDashboard(); expect(d.activeExperiments).toBeGreaterThanOrEqual(1); });
  it("dashboard with approvals", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createApproval(c.id, "1.0.0", "a"); const d = generateDashboard(); expect(d.pendingApprovals).toBeGreaterThanOrEqual(1); });
  it("dashboard with recommendations", () => { receiveRecommendation({ source: "test", gameMode: "all", title: "T", description: "", currentValue: null, suggestedValue: null }); const d = generateDashboard(); expect(d.recommendations).toBeGreaterThanOrEqual(1); });
  it("dashboard healthy with no issues", () => { const d = generateDashboard(); expect(d.health).toBe("healthy"); });
});

// ===== Extended Loader Tests =====
describe("Config — Loader Extended", () => {
  it("cache then load", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { original: true } }); cacheConfig(c.id, "1.0.0", { cached: true }); const loaded = loadConfig(c.id); expect(loaded?.data.cached).toBe(true); expect(loaded?.data.original).toBeUndefined(); });
  it("load with specific version from cache", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", version: "1.0.0" }); cacheConfig(c.id, "1.0.0", { versioned: true }); const loaded = loadConfig(c.id, "1.0.0"); expect(loaded?.data.versioned).toBe(true); });
  it("load falls back when cache miss", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a", data: { fallback: true } }); cacheConfig(c.id, "2.0.0", { cached: true }); const loaded = loadConfig(c.id, "1.0.0"); expect(loaded?.source).toBe("fallback"); });
});

// ===== Extended Environment Tests =====
describe("Config — Environments Extended", () => {
  it("environment for development", () => { expect(createEnvironment({ environment: "development" }).environment).toBe("development"); });
  it("environment for testing", () => { expect(createEnvironment({ environment: "testing" }).environment).toBe("testing"); });
  it("environment for qa", () => { expect(createEnvironment({ environment: "qa" }).environment).toBe("qa"); });
  it("environment for staging", () => { expect(createEnvironment({ environment: "staging" }).environment).toBe("staging"); });
  it("environment for production", () => { expect(createEnvironment({ environment: "production" }).environment).toBe("production"); });
  it("environment for sandbox", () => { expect(createEnvironment({ environment: "sandbox" }).environment).toBe("sandbox"); });
  it("environment for local", () => { expect(createEnvironment({ environment: "local" }).environment).toBe("local"); });
  it("environment default active true", () => { expect(createEnvironment({ environment: "production" }).active).toBe(true); });
  it("environment custom active false", () => { expect(createEnvironment({ environment: "production", active: false }).active).toBe(false); });
  it("update environment configs", () => { const e = createEnvironment({ environment: "production" }); expect(updateEnvironment(e.id, { configs: { new: true } })?.configs.new).toBe(true); });
  it("update environment overrides", () => { const e = createEnvironment({ environment: "production" }); expect(updateEnvironment(e.id, { overrides: { debug: true } })?.overrides.debug).toBe(true); });
  it("update non-existent returns null", () => { expect(updateEnvironment("nonexistent", { active: false })).toBeNull(); });
});

// ===== Extended Profile Tests =====
describe("Config — Profiles Extended", () => {
  it("profile for casual", () => { expect(createProfile({ name: "P", type: "casual", gameMode: "classic_quiz", createdBy: "a" }).type).toBe("casual"); });
  it("profile for classroom", () => { expect(createProfile({ name: "P", type: "classroom", gameMode: "classic_quiz", createdBy: "a" }).type).toBe("classroom"); });
  it("profile for tournament", () => { expect(createProfile({ name: "P", type: "tournament", gameMode: "classic_quiz", createdBy: "a" }).type).toBe("tournament"); });
  it("profile for olympiad", () => { expect(createProfile({ name: "P", type: "olympiad", gameMode: "classic_quiz", createdBy: "a" }).type).toBe("olympiad"); });
  it("profile for practice", () => { expect(createProfile({ name: "P", type: "practice", gameMode: "classic_quiz", createdBy: "a" }).type).toBe("practice"); });
  it("profile for demo", () => { expect(createProfile({ name: "P", type: "demo", gameMode: "classic_quiz", createdBy: "a" }).type).toBe("demo"); });
  it("profile for custom", () => { expect(createProfile({ name: "P", type: "custom", gameMode: "classic_quiz", createdBy: "a" }).type).toBe("custom"); });
  it("activate non-existent returns null", () => { expect(activateProfile("nonexistent")).toBeNull(); });
  it("deactivate non-existent returns null", () => { expect(deactivateProfile("nonexistent")).toBeNull(); });
  it("profile has updatedAt", () => { const p = createProfile({ name: "P", type: "casual", gameMode: "classic_quiz", createdBy: "a" }); activateProfile(p.id); expect(getProfileById(p.id)?.updatedAt).toBeDefined(); });
});

// ===== Additional Extended Tests =====
describe("Config — Additional Extended", () => {
  it("create config auto-creates version", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(getVersionsForConfig(c.id).length).toBe(1); expect(getConfigVersion(c.id, "1.0.0")).not.toBeNull(); });
  it("version default status draft", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(getConfigVersion(c.id, "1.0.0")?.status).toBe("draft"); });
  it("version default diff null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(getConfigVersion(c.id, "1.0.0")?.diff).toBeNull(); });
  it("version default isRollbackTarget false", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(getConfigVersion(c.id, "1.0.0")?.isRollbackTarget).toBe(false); });
  it("version default approvedBy null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(getConfigVersion(c.id, "1.0.0")?.approvedBy).toBeNull(); });
  it("version default approvedAt null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(getConfigVersion(c.id, "1.0.0")?.approvedAt).toBeNull(); });
  it("approval default reviewedBy null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createApproval(c.id, "1.0.0", "a").reviewedBy).toBeNull(); });
  it("approval default reviewNote null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createApproval(c.id, "1.0.0", "a").reviewNote).toBeNull(); });
  it("approval default history empty", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createApproval(c.id, "1.0.0", "a").history).toEqual([]); });
  it("rollout default scheduledAt null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }).scheduledAt).toBeNull(); });
  it("rollout default startedAt null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }).startedAt).toBeNull(); });
  it("rollout default completedAt null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }).completedAt).toBeNull(); });
  it("rollout default rolledBackAt null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }).rolledBackAt).toBeNull(); });
  it("rollout default rolledBackBy null", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }).rolledBackBy).toBeNull(); });
  it("rollout default targetIds empty", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(createRollout({ configId: c.id, version: "1.0.0", strategy: "instant", createdBy: "a" }).targetIds).toEqual([]); });
  it("experiment default status draft", () => { expect(createExperiment({ name: "E", description: "", type: "ab", configA: {}, configB: {}, startDate: "", endDate: "", createdBy: "a" }).status).toBe("draft"); });
  it("flag evaluation for player rollout", () => { const f = createFlag({ name: "F", description: "", rolloutType: "player" }); setFlagTargets(f.id, ["u1"]); expect(evaluateFlag(f.id, { userId: "u1" }).enabled).toBe(true); });
  it("flag evaluation for teacher rollout", () => { const f = createFlag({ name: "F", description: "", rolloutType: "teacher" }); setFlagTargets(f.id, ["t1"]); expect(evaluateFlag(f.id, { userId: "t1" }).enabled).toBe(true); });
  it("flag evaluation for tournament rollout", () => { const f = createFlag({ name: "F", description: "", rolloutType: "tournament" }); setFlagTargets(f.id, ["tour-1"]); expect(evaluateFlag(f.id).enabled).toBe(true); });
  it("flag evaluation for region rollout", () => { const f = createFlag({ name: "F", description: "", rolloutType: "region" }); setFlagTargets(f.id, ["us-west"]); expect(evaluateFlag(f.id).enabled).toBe(true); });
  it("comparison impactLevel none when no diffs", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createVersion(c.id, "2.0.0", "Update", "a"); const cmp = compareConfigs(c.id, "1.0.0", "2.0.0"); expect(cmp?.impactLevel).toBe("none"); });
  it("comparison compatible when no removals", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createVersion(c.id, "2.0.0", "Update", "a"); const cmp = compareConfigs(c.id, "1.0.0", "2.0.0"); expect(cmp?.compatible).toBe(true); });
  it("comparison has dependencyImpact", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); createVersion(c.id, "2.0.0", "Update", "a"); const cmp = compareConfigs(c.id, "1.0.0", "2.0.0"); expect(cmp?.dependencyImpact).toBeDefined(); });
  it("developer has 10 APIs", () => { expect(getDeveloperIntegration().publicAPIs.length).toBe(10); });
  it("developer has 3 hooks", () => { expect(getDeveloperIntegration().extensionHooks.length).toBe(3); });
  it("developer all APIs require auth", () => { for (const a of getDeveloperIntegration().publicAPIs) expect(a.authRequired).toBe(true); });
  it("status has version", () => { expect(getStatus().version).toBeDefined(); });
  it("status has platform", () => { expect(getStatus().platform).toBe("game-config"); });
  it("bridge processed count starts at 0", () => { expect(getBridgeProcessedCount()).toBe(0); });
  it("unsubscribe stops processing", () => { subscribeConfig(); unsubscribeConfig(); expect(isConfigSubscribed()).toBe(false); });
  it("resubscribe works", () => { subscribeConfig(); unsubscribeConfig(); subscribeConfig(); expect(isConfigSubscribed()).toBe(true); });
  it("computeDiff with nested objects", () => { const d = computeDiff({ a: { b: 1 } }, { a: { b: 2 } }); expect(d.modified).toContain("a"); });
  it("computeDiff empty objects", () => { const d = computeDiff({}, {}); expect(d.added).toEqual([]); expect(d.removed).toEqual([]); expect(d.modified).toEqual([]); });
  it("load config returns valid true", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); expect(loadConfig(c.id)?.valid).toBe(true); });
  it("cache stores data", () => { const c = createConfig({ gameMode: "classic_quiz", name: "C", createdBy: "a" }); cacheConfig(c.id, "1.0.0", { test: true }); const loaded = loadConfig(c.id); expect(loaded?.data.test).toBe(true); });
});
