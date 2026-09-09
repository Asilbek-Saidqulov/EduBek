import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const external =
    process.env.REALTIME_URL || process.env.NEXT_PUBLIC_REALTIME_URL || "";

  if (!external) {
    return NextResponse.json({
      ok: true,
      service: "edubek-vercel-socket",
      mode: "vercel-fluid",
      url: "",
    });
  }

  const base = external.replace(/\/$/, "");
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(base, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) {
      return NextResponse.json({ ok: false, reason: "bad_status", url: base, mode: "external" });
    }
    const data = (await res.json().catch(() => ({}))) as { service?: string };
    return NextResponse.json({
      ok: true,
      service: data.service || "edubek-realtime",
      url: base,
      mode: "external",
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "unreachable", url: base, mode: "external" });
  }
}
