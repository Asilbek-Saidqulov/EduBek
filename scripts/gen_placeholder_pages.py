"""Generate placeholder pages for all authed routes the AppShell links to."""
from pathlib import Path

BASE = Path("/home/z/my-project/src/app/[locale]")

# (slug, title_key, desc_key)
ROUTES = [
    ("discover", "Discover", "Browse free AI-generated quizzes and creator content."),
    ("live-quiz", "Live Quiz", "Join a live quiz or host one for your class."),
    ("marketplace", "Marketplace", "Discover and purchase educational resources from creators."),
    ("profile", "Profile", "Your public profile, achievements, and cosmetics."),
    ("library", "Library", "Your saved resources, quizzes, and study materials."),
    ("wallet", "Wallet", "Check your EduToken balance and transaction history."),
    ("ai-workspace", "AI Workspace", "Generate quizzes, worksheets, and lesson plans with AI."),
    ("classrooms", "Classrooms", "Manage your classes and assignments."),
    ("settings", "Settings", "Account preferences, security, and notifications."),
    ("admin", "Admin", "Platform administration and moderation tools."),
]

TEMPLATE = '''import {{ setRequestLocale }} from "next-intl/server";
import {{ getTranslations }} from "next-intl/server";
import {{ PlaceholderPage }} from "@/components/edubek/placeholder-page";

export const dynamic = "force-dynamic";

export default async function {ComponentName}({{
  params,
}}: {{
  params: Promise<{{ locale: string }}>;
}}) {{
  const {{ locale }} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  return (
    <PlaceholderPage
      title={{t("comingSoon")}}
      description="{description}"
    />
  );
}}
'''

for slug, title, description in ROUTES:
    safe = slug.replace("-", "_")
    ComponentName = "".join(p.capitalize() for p in slug.split("-")) + "Page"
    target = BASE / slug / "page.tsx"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        TEMPLATE.format(
            ComponentName=ComponentName,
            description=description.replace('"', '\\"'),
        )
    )
    print(f"  wrote {target}")

print("done")
