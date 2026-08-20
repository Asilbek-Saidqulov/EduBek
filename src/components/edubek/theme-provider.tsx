/**
 * Theme provider — mounts next-themes so the .dark CSS variables flip.
 * SSR-safe; uses `suppressHydrationWarning` on the html tag.
 */
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
