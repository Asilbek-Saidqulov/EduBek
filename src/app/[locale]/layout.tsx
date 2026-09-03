import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "./globals.css";
import "katex/dist/katex.min.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/edubek/theme-provider";
import { QueryProvider } from "@/components/edubek/query-provider";
import { routing, getDir, type Locale } from "@/i18n/routing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

function resolveLocale(locale: string | undefined): Locale {
  if (locale && routing.locales.includes(locale as Locale)) {
    return locale as Locale;
  }
  return routing.defaultLocale;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);

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
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);

  if (!routing.locales.includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={getDir(locale)}
      suppressHydrationWarning
      className="scroll-smooth"
      data-scroll-behavior="smooth"
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