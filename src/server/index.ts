import http from "http";
import { SocketGateway } from "@/features/multiplayer/socket-gateway";
import { onRoomEvent } from "@/features/multiplayer/bus";

const port = Number(process.env.REALTIME_PORT || 3001);

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, service: "edubek-realtime" }));
});

const gateway = SocketGateway.getInstance();
const io = gateway.initialize(server);

onRoomEvent((roomId, event, payload) => {
  io.to(roomId).emit(event, payload);
});

server.listen(port, () => {
  console.log(`[realtime] Socket.IO listening on :${port} path /api/socket/io`);
});
