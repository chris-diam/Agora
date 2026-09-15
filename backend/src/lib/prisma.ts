import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient instance across module reloads in dev
// (tsx watch re-imports modules on change; without this we'd open a new
// connection pool on every save).
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
