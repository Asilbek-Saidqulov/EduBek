"""Build all organization-platform API route stubs following the established pattern."""
from pathlib import Path

BASE = Path("/home/z/my-project/src/app/api/organizations")

ROUTES = [
    ("organizations", "GET", "List organizations", "listOrganizations"),
    ("tenants", "GET", "List tenants", "listTenants"),
    ("hierarchy", "GET", "List hierarchy nodes", "listHierarchyNodes"),
    ("campuses", "GET", "List campuses", "listCampuses"),
    ("departments", "GET", "List departments", "listDepartments"),
    ("faculties", "GET", "List faculties", "listFaculties"),
    ("workspaces", "GET", "List workspaces", "listWorkspaces"),
    ("memberships", "GET", "List memberships", "listMemberships"),
    ("invitations", "GET", "List invitations", "listInvitations"),
    ("branding", "GET", "List branding", "listBranding"),
    ("configuration", "GET", "List configuration", "listConfigs"),
    ("policies", "GET", "List policies", "listPolicies"),
    ("licenses", "GET", "List licenses", "listLicenses"),
    ("quotas", "GET", "List quotas", "listQuotas"),
    ("domains", "GET", "List domains", "listDomains"),
    ("isolation", "GET", "List isolations", "listIsolations"),
    ("audit", "GET", "List audit records", "listAuditRecords"),
    ("analytics", "GET", "Get analytics", "generateOrganizationAnalytics"),
    ("dashboard", "GET", "Get dashboard", "generateOrganizationDashboard"),
    ("developer", "GET", "Developer integration", "getDeveloperIntegration"),
    ("status", "GET", "Get admin status", "getOrganizationPlatformStatus"),
    ("documentation", "GET", "Get documentation", "generateDocumentation"),
    ("events", "GET", "List published events", "getPublishedEvents"),
]

TEMPLATE = '''/** {method} /api/organizations/{slug} — {summary} */
import {{ NextResponse }} from "next/server";
import {{ withErrorHandler }} from "@/lib/errors";
import {{ getAuthContext }} from "@/features/auth";
import {{ {fn} }} from "@/features/organization-platform";

export const {method} = withErrorHandler(async () => {{
  const ctx = await getAuthContext();
  if (!ctx.userId) {{ return NextResponse.json({{ error: {{ code: "UNAUTHORIZED", message: "Authentication required" }} }}, {{ status: 401 }}); }}
  return NextResponse.json({{ route: "{slug}", data: {fn}() }});
}});
'''

for slug, method, summary, fn in ROUTES:
    content = TEMPLATE.format(method=method, slug=slug, summary=summary, fn=fn)
    target = BASE / slug / "route.ts"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content)
    print(f"  wrote {target}")

print("done")
