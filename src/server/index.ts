import { createServer } from "http";
import next from "next";
import { SocketGateway } from "@/features/multiplayer/socket-gateway";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(handle);

  const gateway = SocketGateway.getInstance();
  gateway.initialize(server);

  server.listen(port, hostname, () => {
    console.log(`[Server] EduBek ready on http://${hostname}:${port}`);
    console.log(`[Server] Socket.IO path: /api/socket/io`);
  });
});
