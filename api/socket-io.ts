import http from "http";
import { Server } from "socket.io";
import { attachClassicLive } from "../src/features/multiplayer/classic-live";

/**
 * Vercel Fluid WebSocket + Socket.IO entry.
 * Deployed at /api/socket-io
 * Client path must be /api/socket-io/socket.io and transports: ["websocket"]
 */
const server = http.createServer((req, res) => {
  if (req.url?.startsWith("/api/socket-io/socket.io")) return;
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, service: "edubek-vercel-socket" }));
});

const io = new Server(server, {
  path: "/api/socket-io/socket.io",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 20000,
  pingInterval: 10000,
});

attachClassicLive(io);

export default server;
