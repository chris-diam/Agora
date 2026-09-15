import type { Server } from "socket.io";

// A module-level singleton rather than passing `io` through every service —
// services already don't have access to the HTTP request/response, and
// threading a socket instance through every function signature just to
// reach two call sites (notifications, messages) isn't worth it.
let ioInstance: Server | null = null;

export const setSocketServer = (io: Server): void => {
  ioInstance = io;
};

// Rooms are named by userId (see server.ts's connection handler), so this
// reaches every open tab/device for that user.
export const emitToUser = (userId: string, event: string, payload: unknown): void => {
  ioInstance?.to(userId).emit(event, payload);
};
