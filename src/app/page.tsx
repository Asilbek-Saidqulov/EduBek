import { redirect } from "next/navigation"

// The root page redirects to the default locale's landing page.
// The actual landing page lives at src/app/[locale]/page.tsx.
export default function RootPage() {
  redirect("/en")
}
