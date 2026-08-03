"""Build all 25 extension-framework API route stubs following the ai-intelligence pattern."""
import os
from pathlib import Path

BASE = Path("/home/z/my-project/src/app/api/extension-framework")

ROUTES = [
    # (subdir, method, summary)
    ("extensions", "GET", "List extensions"),
    ("plugins", "GET", "List plugins"),
    ("sdk", "GET", "List SDKs"),
    ("manifests", "GET", "List manifests"),
    ("capabilities", "GET", "List capabilities"),
    ("hooks", "GET", "List hooks"),
    ("permissions", "GET", "List permission grants"),
    ("sandbox", "GET", "List sandbox policies"),
    ("compatibility", "GET", "List compatibility entries"),
    ("dependencies", "GET", "List dependency nodes"),
    ("lifecycle", "GET", "List lifecycle records"),
    ("marketplace", "GET", "List marketplace listings"),
    ("configuration", "GET", "List configurations"),
    ("events", "GET", "List event subscriptions"),
    ("apis", "GET", "List API contracts"),
    ("developer", "GET", "Developer integration metadata"),
    ("validation", "GET", "List validation reports"),
    ("audit", "GET", "List audit records"),
    ("analytics", "GET", "Get analytics"),
    ("dashboard", "GET", "Get dashboard"),
    ("status", "GET", "Get admin status"),
    ("documentation", "GET", "Get documentation"),
    ("registry", "GET", "Get registry summary"),
]

TEMPLATE = '''/** {method} /api/extension-framework/{slug} — {summary} */
import {{ NextResponse }} from "next/server";
import {{ withErrorHandler }} from "@/lib/errors";
import {{ getAuthContext }} from "@/features/auth";
import {{ {fn} }} from "@/features/extension-framework";

export const {method} = withErrorHandler(async () => {{
  const ctx = await getAuthContext();
  if (!ctx.userId) {{ return NextResponse.json({{ error: {{ code: "UNAUTHORIZED", message: "Authentication required" }} }}, {{ status: 401 }}); }}
  return NextResponse.json({{ route: "{slug}", data: {fn}() }});
}});
'''

# Map route slug to service function
FUNCTION_MAP = {
    "extensions": "listExtensions",
    "plugins": "listPlugins",
    "sdk": "listSdks",
    "manifests": "listManifests",
    "capabilities": "listCapabilities",
    "hooks": "listHooks",
    "permissions": "listPermissionGrants",
    "sandbox": "listSandboxPolicies",
    "compatibility": "listCompatibility",
    "dependencies": "listDependencyNodes",
    "lifecycle": "listLifecycleRecords",
    "marketplace": "listMarketplaceListings",
    "configuration": "listConfigs",
    "events": "listEventSubscriptions",
    "apis": "listApiContracts",
    "developer": "getDeveloperIntegration",
    "validation": "listValidationReports",
    "audit": "listAuditRecords",
    "analytics": "generateExtensionAnalytics",
    "dashboard": "generateExtensionDashboard",
    "status": "getExtensionFrameworkStatus",
    "documentation": "generateDocumentation",
    "registry": "getDeveloperIntegration",
}

for slug, method, summary in ROUTES:
    fn = FUNCTION_MAP[slug]
    content = TEMPLATE.format(method=method, slug=slug, summary=summary, fn=fn)
    target = BASE / slug / "route.ts"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content)
    print(f"  wrote {target}")

print("done")
