import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app";
import { env } from "./config";
import { prisma } from "./lib/prisma";
import { setSocketServer } from "./lib/socket";
import { findOrProvisionUser, verifyAccessToken } from "./services/keycloak.service";

// Socket.io needs a raw http.Server to attach to (not just the Express app)
// so the same port serves both regular HTTP and WebSocket upgrades.
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: env.CORS_ORIGIN ?? true },
});

// Every socket connection must present the same Keycloak access token used
// for REST auth — sent as `auth: { token }` in the client's connection
// options, not a header (the initial WS handshake doesn't carry custom
// headers the same way a fetch() does). Runs once per connection, not per
// message — the frontend passes `auth` as a function (re-evaluated on every
// reconnect) so a token that expired between connections doesn't strand a
// long-open tab, see SocketContext.tsx.
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));

    const claims = await verifyAccessToken(token);
    const user = await findOrProvisionUser(claims);

    socket.data.userId = user.id;
    next();
  } catch {
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  // One room per user (not per socket) — a user with multiple tabs/devices
  // open all land in the same room, so emitToUser() reaches all of them.
  const userId = socket.data.userId as string;
  socket.join(userId);
});

setSocketServer(io);

const server = httpServer.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});

const shutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
