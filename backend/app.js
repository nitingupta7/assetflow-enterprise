// ─── Express App Configuration ───────────────────────
// Separated from server.js to keep the app testable.

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
const ApiError = require("./utils/apiError");
const env = require("./config/env");

const app = express();

// ─── Middleware ──────────────────────────────────────
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── API Routes ─────────────────────────────────────
app.use("/api", routes);

// ─── Health Check ───────────────────────────────────
app.get(["/", "/api/health"], (req, res) => {
  res.json({
    success: true,
    message: "AssetFlow API is running",
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler ───────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  if (env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Prisma known errors
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: `Duplicate value for: ${err.meta?.target?.join(", ") || "unique field"}`,
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found.",
    });
  }

  const statusCode = err instanceof ApiError ? err.statusCode : (err.status || 500);
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
  });
});

module.exports = app;
