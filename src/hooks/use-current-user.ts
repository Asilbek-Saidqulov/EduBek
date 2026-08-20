"use client";

import * as React from "react";
import { api } from "@/lib/api-client";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  country?: string | null;
  locale?: string;
  roles?: string[];
  platformRoles?: string[];
  balanceEduTokens?: number;
  balanceFiat?: number;
  isCreator?: boolean;
}

export function useCurrentUser() {
  const [user, setUser] = React.useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchUser = React.useCallback(async () => {
    try {
      const res = await api.get("/api/auth/me");
      if (res?.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    isLoading,
    mutate: fetchUser,
  };
}
