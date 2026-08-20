/**
 * useCurrentUser — client-side hook for the authenticated user.
 *
 * Wraps `useQuery` around `GET /api/auth/me`. Returns:
 *   - `user` — the UserDto or `null` when unauthenticated
 *   - `isLoading` — true while the first fetch is in-flight
 *   - `error` — set when the fetch fails (401 is treated as anonymous,
 *     not an error)
 *   - `refetch` — manually re-query (e.g. after login)
 *
 * Caches for 30s; clears on logout via `invalidateQueries`.
 */
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export interface CurrentUser {
  id: string;
  email: string;
  emailVerified: string | null;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  country: string | null;
  locale: string | null;
  isBanned: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  platformRoles: string[];
}

async function fetchCurrentUser(): Promise<CurrentUser> {
  const res = await fetch("/api/auth/me", { credentials: "same-origin" });
  if (res.status === 401) return null as unknown as CurrentUser;
  if (!res.ok) throw new Error("Failed to load user");
  const data = (await res.json()) as { user: CurrentUser };
  return data.user;
}

export function useCurrentUser() {
  const qc = useQueryClient();
  const query = useQuery<CurrentUser | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return await fetchCurrentUser();
      } catch {
        return null;
      }
    },
    // Treat 401 as anonymous — not an error to surface.
    retry: false,
    staleTime: 30 * 1000,
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["auth", "me"] });
  }, [qc]);

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data,
    refetch: query.refetch,
    invalidate,
  };
}
