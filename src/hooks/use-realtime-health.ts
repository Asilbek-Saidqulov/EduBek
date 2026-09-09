"use client";

import * as React from "react";

export function useRealtimeHealth() {
  const [online, setOnline] = React.useState<boolean | null>(null);
  const [url, setUrl] = React.useState<string | undefined>(
    process.env.NEXT_PUBLIC_REALTIME_URL || undefined,
  );

  React.useEffect(() => {
    let mounted = true;
    fetch("/api/realtime/health", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setOnline(Boolean(data?.ok));
        if (typeof data?.url === "string" && data.url.length > 0) {
          setUrl(data.url);
        }
      })
      .catch(() => {
        if (mounted) setOnline(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { online, url };
}
