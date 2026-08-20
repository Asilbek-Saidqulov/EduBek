import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function getCorrelationId(): Promise<string> {
  try {
    const h = await headers();
    return h.get("x-correlation-id") || crypto.randomUUID();
  } catch {
    return crypto.randomUUID();
  }
}

export function withCorrelationId<T = any>(handler: (req?: any, ctx?: any) => Promise<any> | any) {
  return async (req?: any, ctx?: any) => {
    const corrId = await getCorrelationId();
    const res = await handler(req, ctx);
    if (res instanceof NextResponse) {
      res.headers.set("x-correlation-id", corrId);
      return res;
    }
    return NextResponse.json(res, {
      headers: { "x-correlation-id": corrId },
    });
  };
}

