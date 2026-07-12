// ─── Prisma Client Singleton ─────────────────────────
// Prevents creating multiple PrismaClient instances in development
// (which would exhaust database connections).

const { PrismaClient } = require("@prisma/client");
const env = require("./env");

let prisma;

if (env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // In development, reuse the same client across hot-reloads
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ["query", "warn", "error"],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
