import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

// The root page redirects to the default locale's landing page.
// The actual landing page lives at src/app/[locale]/page.tsx.
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
