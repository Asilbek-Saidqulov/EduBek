/**
 * EduBek — Root layout (pass-through).
 *
 * In the i18n App Router structure, the root layout must exist but
 * should not render any HTML — the actual <html> tag lives in
 * `app/[locale]/layout.tsx` so that `lang` and `dir` attributes can
 * be set dynamically based on the locale.
 *
 * This layout simply passes children through.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
