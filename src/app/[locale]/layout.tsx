import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import "./globals.css";
import "katex/dist/katex.min.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/edubek/theme-provider";
import { QueryProvider } from "@/components/edubek/query-provider";
import { routing, getDir, type Locale } from "@/i18n/routing";

// Geist ships both Latin and Cyrillic subsets. Cyrillic is required for
// Uzbek (Cyrillic variant) and Russian — otherwise those locales fall
// back to system fonts and look broken.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

// Enable static rendering for all locales
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "EduBek — Connected Learning Ecosystem";
  const description =
    "EduBek is a connected learning ecosystem uniting interactive quizzes, knowledge discovery, contextual AI assistance, teacher workspaces, and an educational marketplace.";

  return {
    title,
    description,
    keywords: [
      "EduBek",
      "connected learning ecosystem",
      "interactive quizzes",
      "educational marketplace",
      "AI study tutor",
      "quiz arena",
      "teacher workspace",
      "student progress",
      "EdTech",
    ],
    authors: [{ name: "EduBek Team" }],
    icons: {
      icon: "/favicon.ico",
    },
    metadataBase: new URL("https://edubek.app"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        uz: "/uz",
        ru: "/ru",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://edubek.app/${locale}`,
      siteName: "EduBek",
      type: "website",
      locale: locale === "uz" ? "uz_UZ" : locale === "ru" ? "ru_RU" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description:
        "EduBek brings together knowledge discovery, interactive quizzes, contextual AI assistance, and an educational marketplace in one connected ecosystem.",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Load messages for the current locale
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={getDir(locale)}
      suppressHydrationWarning
      className="scroll-smooth"
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
              {children}
              <Toaster />
            </NextIntlClientProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
