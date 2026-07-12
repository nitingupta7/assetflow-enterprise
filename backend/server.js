// ─── Server Entry Point ──────────────────────────────
// Loads env, connects Prisma, and starts the server.

const env = require("./config/env");
const app = require("./app");
const prisma = require("./config/db");

const PORT = env.PORT;

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("✅ MySQL connected via Prisma");

    app.listen(PORT, () => {
      console.log(`🚀 AssetFlow API running on port ${PORT}`);
      console.log(`📋 Health check: ${env.SERVER_URL}/api/health`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
