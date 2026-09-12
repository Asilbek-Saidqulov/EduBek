"use client";

import { useLocale } from "next-intl";

export function GoogleAuthButton({ label = "Continue with Google" }: { label?: string }) {
  const locale = useLocale();
  return (
    <a
      href={`/api/auth/google?locale=${encodeURIComponent(locale)}`}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.55-5.17 3.55-8.65z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.72-2.47 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09C3.25 21.3 7.31 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.27A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.09z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.76 0 3.33.6 4.58 1.79l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75z"
        />
      </svg>
      {label}
    </a>
  );
}
