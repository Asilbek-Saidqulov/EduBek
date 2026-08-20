/**
 * Query client provider — mounts @tanstack/react-query for client-side
 * data fetching of authenticated APIs (e.g. /api/auth/me, /api/wallet/*).
 *
 * The client is created once per browser session via `useState` so it
 * survives re-renders without leaking across requests on the server.
 */
"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // SSR-friendly defaults
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
