/**
 * EduBek — Custom Next.js server with Socket.IO attached for Live Quiz.
 *
 * Next.js by default does not expose the underlying HTTP server, so we
 * use the programmatic API to create one and attach Socket.IO before
 * Next.js takes over.
 *
 * This file is the production entry point. In dev, the user runs
 * `npm run dev:realtime` (which uses tsx watch) to enable Live Quiz
 * realtime alongside Next.js hot reload.
 *
 * Environment:
 *   - NODE_ENV=production → use `next build` output
 *   - NODE_ENV=development → use `next dev` with hot reload
 */
import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { setupRealtime, setRealtimeIo } from "@/infra/realtime";
import { registerAllListeners } from "@/infra/listeners/register";
import { registerShutdownHandler, gracefulShutdown } from "@/infra/distributed";
import { getLogger } from "@/lib/logger";
import { incrementCounter, setGauge } from "@/infra/metrics";

const log = getLogger("server");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = parseInt(process.env.PORT ?? "3000", 10);

async function main() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();
  await app.prepare();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "", true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.IO
  const realtime = setupRealtime(httpServer);
  setRealtimeIo(realtime.io);

  // Register event-bus listeners (audit, notifications, realtime, etc.)
  registerAllListeners();

  // Register graceful shutdown handlers (Phase 4D.3)
  registerShutdownHandler(async () => {
    log.info("shutdown.closing_realtime");
    realtime.close();
  });
  registerShutdownHandler(async () => {
    log.info("shutdown.closing_http");
    return new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  // Startup metrics
  incrementCounter("edubek_server_starts_total");
  setGauge("edubek_server_info", 1, { version: "4d", node_env: process.env.NODE_ENV ?? "development" });

  httpServer.listen(port, hostname, () => {
    log.info("server.ready", { port, hostname, dev, realtime: "/api/realtime" });
    console.log(`\n> EduBek ready on http://${hostname}:${port} (dev=${dev})`);
    console.log(`> Socket.IO endpoint: ws://${hostname}:${port}/api/realtime`);
    console.log(`> Health: http://${hostname}:${port}/api/health/ready`);
    console.log(`> Metrics: http://${hostname}:${port}/api/health/metrics\n`);
  });

  // Graceful shutdown (Phase 4D.3 — runs registered handlers in order)
  const shutdown = async (signal: string) => {
    log.info("server.shutting_down", { signal });
    incrementCounter("edubek_server_shutdowns_total");
    await gracefulShutdown(signal);
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Failed to start EduBek server:", err);
  process.exit(1);
});
