/** EduBek — Phase 5B.2 Platform SDK tests. */
import { describe, it, expect } from "vitest";
import {
  publishExtension, getExtension, listExtensions, approveExtension,
  installExtension, uninstallExtension, disableExtension, enableExtension, listInstalls,
  executeHooks, listHooks,
  executeInSandbox, listSandboxes,
  listSdks, listCliCommands,
  getGraphQLSchemaInfo,
  reviewExtension, listReviews,
  subscribeToExtension, listSubscriptions,
  checkCompatibility, listCompatibilityEntries,
  getDeveloperPortalInfo,
} from "@/features/platform-sdk";

const TEST_DEV = `test-dev-5b2-${Date.now()}`;

// ---------------------------------------------------------------------------
// Extension Runtime
// ---------------------------------------------------------------------------

describe("Extension Runtime", () => {
  it("publishes + retrieves + lists + approves an extension", async () => {
    const ext = await publishExtension({
      type: "dashboard", name: `Test Dashboard ${Date.now()}`,
      slug: `test-dash-${Date.now()}`, description: "A test dashboard extension",
      developerId: TEST_DEV, developerName: "Test Developer",
      permissions: ["read:users", "access:analytics"],
      hooks: ["quiz.published", "resource.created"],
      categories: ["analytics", "dashboard"],
    });
    expect(ext.id).toBeTruthy();
    expect(ext.status).toBe("submitted");
    expect(ext.permissions).toEqual(["read:users", "access:analytics"]);
    expect(ext.hooks).toEqual(["quiz.published", "resource.created"]);

    const retrieved = await getExtension(ext.id);
    expect(retrieved).toBeTruthy();
    expect(retrieved!.slug).toBe(ext.slug);

    const list = await listExtensions({ developerId: TEST_DEV });
    expect(list.length).toBeGreaterThan(0);

    const approved = await approveExtension(ext.id);
    expect(approved.status).toBe("published");
  });

  it("installs + enables + disables + uninstalls an extension", async () => {
    const ext = await publishExtension({
      type: "widget", name: `Test Widget ${Date.now()}`,
      slug: `test-widget-${Date.now()}`, developerId: TEST_DEV, developerName: "Test Dev",
      hooks: ["assessment.graded"],
    });
    await approveExtension(ext.id);

    const install = await installExtension({
      extensionId: ext.id, version: "1.0.0", installedBy: TEST_DEV,
      approvedPermissions: ["read:users"],
    });
    expect(install.status).toBe("enabled");
    expect(install.version).toBe("1.0.0");

    // Verify hooks were registered
    const hooks = await listHooks({ extensionInstallId: install.id });
    expect(hooks.length).toBe(1);
    expect(hooks[0]!.event).toBe("assessment.graded");

    // Disable
    const disabled = await disableExtension(install.id);
    expect(disabled.status).toBe("disabled");

    // Enable
    const enabled = await enableExtension(install.id);
    expect(enabled.status).toBe("enabled");

    // Uninstall
    await uninstallExtension(install.id);
    const installs = await listInstalls({ extensionId: ext.id });
    const uninstalled = installs.find((i) => i.id === install.id);
    expect(uninstalled!.status).toBe("uninstalled");
  });
});

// ---------------------------------------------------------------------------
// Workflow Hooks
// ---------------------------------------------------------------------------

describe("Workflow Hooks", () => {
  it("executes hooks for an event", async () => {
    const ext = await publishExtension({
      type: "automation", name: `Hook Test ${Date.now()}`,
      slug: `hook-test-${Date.now()}`, developerId: TEST_DEV, developerName: "Test Dev",
      hooks: ["test.event"],
    });
    await approveExtension(ext.id);
    const install = await installExtension({
      extensionId: ext.id, version: "1.0.0", installedBy: TEST_DEV,
    });

    const result = await executeHooks("test.event", { message: "test" });
    expect(result.executedCount).toBeGreaterThanOrEqual(0);
    expect(result.successCount + result.failCount).toBe(result.executedCount);
  });
});

// ---------------------------------------------------------------------------
// Sandboxed Execution
// ---------------------------------------------------------------------------

describe("Sandboxed Execution", () => {
  it("executes code in a sandbox", async () => {
    const ext = await publishExtension({
      type: "backend", name: `Sandbox Test ${Date.now()}`,
      slug: `sandbox-test-${Date.now()}`, developerId: TEST_DEV, developerName: "Test Dev",
    });
    await approveExtension(ext.id);
    const install = await installExtension({
      extensionId: ext.id, version: "1.0.0", installedBy: TEST_DEV,
      timeoutMs: 5000,
    });

    const result = await executeInSandbox({
      installId: install.id, code: "return 1 + 1;", input: { x: 1 },
    });
    expect(result.status).toBe("completed");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.output).toBeTruthy();
  });

  it("lists sandbox sessions", async () => {
    const sandboxes = await listSandboxes({ limit: 10 });
    expect(Array.isArray(sandboxes)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Plugin SDK + CLI + GraphQL
// ---------------------------------------------------------------------------

describe("Plugin SDK + CLI + GraphQL", () => {
  it("lists 7 SDK definitions", () => {
    const sdks = listSdks();
    expect(sdks.length).toBe(7);
    const langs = sdks.map((s) => s.language);
    expect(langs).toContain("TypeScript");
    expect(langs).toContain("Python");
    expect(langs).toContain("Go");
    expect(langs).toContain("PHP");
  });

  it("lists 9 CLI commands", () => {
    const cmds = listCliCommands();
    expect(cmds.length).toBe(9);
    const names = cmds.map((c) => c.name);
    expect(names).toContain("init");
    expect(names).toContain("create plugin");
    expect(names).toContain("publish");
    expect(names).toContain("deploy");
  });

  it("returns GraphQL schema info with types + queries + mutations + subscriptions", () => {
    const schema = getGraphQLSchemaInfo();
    expect(schema.types.length).toBeGreaterThan(10);
    expect(schema.queries.length).toBeGreaterThan(5);
    expect(schema.mutations.length).toBeGreaterThan(5);
    expect(schema.subscriptions.length).toBeGreaterThan(3);
    expect(schema.version).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Extension Marketplace — Reviews + Subscriptions
// ---------------------------------------------------------------------------

describe("Extension Marketplace", () => {
  it("creates + lists reviews", async () => {
    const ext = await publishExtension({
      type: "widget", name: `Review Test ${Date.now()}`,
      slug: `review-test-${Date.now()}`, developerId: TEST_DEV, developerName: "Test Dev",
    });
    await approveExtension(ext.id);

    const review = await reviewExtension({
      extensionId: ext.id, userId: TEST_DEV, rating: 5, review: "Great extension!",
    });
    expect(review.rating).toBe(5);

    const list = await listReviews({ extensionId: ext.id });
    expect(list.length).toBeGreaterThan(0);

    // Check rating was updated on the extension
    const extUpdated = await getExtension(ext.id);
    expect(extUpdated!.ratingAverage).toBe(5);
    expect(extUpdated!.ratingCount).toBe(1);
  });

  it("creates + lists subscriptions", async () => {
    const ext = await publishExtension({
      type: "ai", name: `Sub Test ${Date.now()}`,
      slug: `sub-test-${Date.now()}`, developerId: TEST_DEV, developerName: "Test Dev",
      pricingModel: "monthly", priceEduTokens: 10,
    });
    await approveExtension(ext.id);

    const sub = await subscribeToExtension({
      extensionId: ext.id, userId: TEST_DEV, plan: "monthly", pricePerCycle: 10,
    });
    expect(sub.status).toBe("active");
    expect(sub.plan).toBe("monthly");

    const list = await listSubscriptions({ extensionId: ext.id });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Version & Compatibility Manager
// ---------------------------------------------------------------------------

describe("Version & Compatibility Manager", () => {
  it("checks compatibility for an extension", async () => {
    const ext = await publishExtension({
      type: "widget", name: `Compat Test ${Date.now()}`,
      slug: `compat-test-${Date.now()}`, developerId: TEST_DEV, developerName: "Test Dev",
      minPlatformVersion: "5.0.0",
    });
    await approveExtension(ext.id);

    const result = await checkCompatibility({
      extensionId: ext.id, extensionVersion: "1.0.0", platformVersion: "5.2.0",
    });
    expect(result.status).toBe("compatible");
    expect(result.testedAt).toBeTruthy();
  });

  it("detects incompatibility when platform version is too low", async () => {
    const ext = await publishExtension({
      type: "widget", name: `Incompat Test ${Date.now()}`,
      slug: `incompat-test-${Date.now()}`, developerId: TEST_DEV, developerName: "Test Dev",
      minPlatformVersion: "6.0.0",
    });
    await approveExtension(ext.id);

    const result = await checkCompatibility({
      extensionId: ext.id, extensionVersion: "1.0.0", platformVersion: "5.2.0",
    });
    expect(result.status).toBe("incompatible");
  });

  it("lists compatibility entries", async () => {
    const entries = await listCompatibilityEntries({ limit: 100 });
    expect(Array.isArray(entries)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Developer Portal
// ---------------------------------------------------------------------------

describe("Developer Portal", () => {
  it("returns comprehensive developer portal info", async () => {
    const info = await getDeveloperPortalInfo();
    expect(info.sdks.length).toBe(7);
    expect(info.cliCommands.length).toBe(9);
    expect(info.platformVersion).toBeTruthy();
    expect(info.graphqlEnabled).toBe(true);
    expect(typeof info.totalExtensions).toBe("number");
    expect(typeof info.totalInstalls).toBe("number");
  });
});
