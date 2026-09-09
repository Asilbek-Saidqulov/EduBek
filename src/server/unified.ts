import http from "http";
import next from "next";
import { SocketGateway } from "@/features/multiplayer/socket-gateway";
import { onRoomEvent } from "@/features/multiplayer/bus";

const port = Number(process.env.PORT || process.env.REALTIME_PORT || 3000);
const dev = process.env.NODE_ENV !== "production";

async function main() {
  const app = next({ dev, hostname: "0.0.0.0", port });
  const handle = app.getRequestHandler();
  await app.prepare();

  const server = http.createServer((req, res) => {
    const url = req.url || "/";
    if (url.startsWith("/api/socket/io")) {
      return;
    }
    if (url === "/health" || url.startsWith("/api/realtime/health")) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, service: "edubek-unified" }));
      return;
    }
    void handle(req, res);
  });

  const gateway = SocketGateway.getInstance();
  const io = gateway.initialize(server);

  onRoomEvent((roomId, event, payload) => {
    io.to(roomId).emit(event, payload);
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`[edubek] Next + Socket.IO on :${port} (path /api/socket/io)`);
  });
}

main().catch((err) => {
  console.error("[edubek] unified server failed", err);
  process.exit(1);
});
