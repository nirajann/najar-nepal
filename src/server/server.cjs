const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const fs = require("fs");
const path = require("path");

const { connectDB, disconnectDB, getDbState } = require("./config/db.cjs");
const { loadConfig, normalizeOrigin } = require("./config/env.cjs");
const authMiddleware = require("./middleware/authMiddleware.cjs");
const adminMiddleware = require("./middleware/adminMiddleware.cjs");

const nodeEnv = process.env.NODE_ENV?.trim() || "development";
const envFiles = [
  ".env",
  `.env.${nodeEnv}`,
  ".env.local",
  `.env.${nodeEnv}.local`,
];

envFiles.forEach((file) => {
  const filePath = path.resolve(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: true });
  }
});

const app = express();
const config = loadConfig();

let server;
let isShuttingDown = false;

function generateRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createError(statusCode, code, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeMongoOperators(target) {
  if (Array.isArray(target)) {
    target.forEach((item) => sanitizeMongoOperators(item));
    return target;
  }

  if (!isPlainObject(target)) {
    return target;
  }

  Object.keys(target).forEach((key) => {
    const value = target[key];

    if (key.startsWith("$") || key.includes(".")) {
      delete target[key];
      return;
    }

    sanitizeMongoOperators(value);
  });

  return target;
}

function collapseDuplicateQueryValues(target, whitelist = new Set()) {
  if (!isPlainObject(target)) {
    return target;
  }

  Object.keys(target).forEach((key) => {
    const value = target[key];

    if (Array.isArray(value) && !whitelist.has(key)) {
      target[key] = value[value.length - 1];
      return;
    }

    if (isPlainObject(value)) {
      collapseDuplicateQueryValues(value, whitelist);
    }
  });

  return target;
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
}

function requestLogger(req, res, next) {
  const startedAt = Date.now();
  req.requestId = req.headers["x-request-id"] || generateRequestId();
  res.setHeader("x-request-id", req.requestId);

  res.on("finish", () => {
    if (req.path === "/api/health") return;

    const durationMs = Date.now() - startedAt;
    const logPayload = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"] || "unknown",
    };

    if (res.statusCode >= 500) {
      console.error("[server-error-response]", logPayload);
    } else if (res.statusCode >= 400) {
      console.warn("[client-error-response]", logPayload);
    } else {
      console.log("[request-complete]", logPayload);
    }
  });

  next();
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: true,
    code: "not_found",
    message: "Route not found",
    details: {
      requestId: req.requestId,
      path: req.originalUrl,
      method: req.method,
    },
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;

  console.error(`[error:${req.requestId || "unknown"}]`, {
    message: err.message,
    code: err.code || null,
    statusCode,
    details: err.details || null,
    stack: config.isProd ? undefined : err.stack,
  });

  if (res.headersSent) {
    return next(err);
  }

  return res.status(statusCode).json({
    error: true,
    code: err.code || (isServerError ? "internal_server_error" : "request_error"),
    message: isServerError && config.isProd ? "Internal server error" : err.message,
    details: {
      requestId: req.requestId,
      ...(err.details ? { extra: err.details } : {}),
    },
  });
}

async function startServer() {
  try {
    await connectDB(config.mongoUri);
    console.log("Database connected successfully");

    app.set("trust proxy", 1);
    app.disable("x-powered-by");

    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      })
    );

    app.use(compression());
    app.use(requestLogger);

    app.use(
      cors({
        origin(origin, callback) {
          if (!origin) {
            return callback(null, true);
          }

          if (config.allowedOrigins.length === 0 && !config.isProd) {
            return callback(null, true);
          }

          const normalizedOrigin = normalizeOrigin(origin);

          if (config.allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
          }

          return callback(
            createError(
              403,
              "cors_origin_not_allowed",
              `CORS origin not allowed: ${origin}`,
              { origin }
            )
          );
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
        credentials: true,
      })
    );

    const generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      handler(req, res) {
        return res.status(429).json({
          error: true,
          code: "too_many_requests",
          message: "Too many requests. Please try again later.",
          details: { requestId: req.requestId },
        });
      },
    });

    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      handler(req, res) {
        return res.status(429).json({
          error: true,
          code: "auth_rate_limited",
          message: "Too many authentication attempts. Please try again later.",
          details: { requestId: req.requestId },
        });
      },
    });

    const writeLimiter = rateLimit({
      windowMs: 10 * 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
      handler(req, res) {
        return res.status(429).json({
          error: true,
          code: "write_rate_limited",
          message: "Too many write requests. Please try again later.",
          details: { requestId: req.requestId },
        });
      },
    });

    app.use(generalLimiter);

    app.use((req, res, next) => {
      res.setTimeout(config.requestTimeoutMs, () => {
        if (!res.headersSent) {
          res.status(408).json({
            error: true,
            code: "request_timeout",
            message: "Request timed out",
            details: { requestId: req.requestId },
          });
        }
      });
      next();
    });

    app.use(express.json({ limit: config.jsonBodyLimit }));
    app.use(express.urlencoded({ extended: true, limit: config.jsonBodyLimit }));
    app.use((req, res, next) => {
      sanitizeMongoOperators(req.body);
      sanitizeMongoOperators(req.query);
      collapseDuplicateQueryValues(req.query);
      next();
    });

    app.get("/", (req, res) => {
      res.send("Najar Nepal API is running");
    });

    app.get("/api/health", async (req, res) => {
      const db = getDbState();

      res.json({
        status: db.status === "connected" ? "ok" : "degraded",
        uptime: Math.round(process.uptime()),
        memory: {
          rss: process.memoryUsage().rss,
          heapTotal: process.memoryUsage().heapTotal,
          heapUsed: process.memoryUsage().heapUsed,
          external: process.memoryUsage().external,
        },
        db,
        version: config.appVersion,
        environment: config.env,
        timestamp: new Date().toISOString(),
      });
    });

    app.use("/api/auth", authLimiter, require("./routes/authRoutes.cjs"));
    app.use("/api/leaders", require("./routes/leaderRoutes.cjs"));
    app.use("/api/districts", require("./routes/districtRoutes.cjs"));
    app.use("/api/district-feedback", writeLimiter, require("./routes/districtFeedbackRoutes.cjs"));
    app.use("/api/ratings", writeLimiter, require("./routes/ratingRoutes.cjs"));
    app.use("/api/complaints", writeLimiter, require("./routes/complaintRoutes.cjs"));
    app.use("/api/reports", writeLimiter, require("./routes/reportRoutes.cjs"));
    app.use("/api/support", writeLimiter, require("./routes/supportRoutes.cjs"));
    app.use("/api/projects", require("./routes/projectRoutes.cjs"));
    app.use("/api/comments", writeLimiter, require("./routes/commentRoutes.cjs"));
    app.use("/api/analytics", writeLimiter, require("./routes/analyticsEventRoutes.cjs"));

    // Admin-only routes protected here at mount level
    app.use("/api/admin/projects", authMiddleware, adminMiddleware, require("./routes/projectAdminRoutes.cjs"));
    app.use("/api/admin/analytics", authMiddleware, adminMiddleware, require("./routes/analyticsRoutes.cjs"));
    app.use("/api/admin/complaints", authMiddleware, adminMiddleware, require("./routes/complaintRoutes.cjs"));

    app.use(notFoundHandler);
    app.use(errorHandler);

    server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });

    server.requestTimeout = config.requestTimeoutMs;
    server.headersTimeout = config.requestTimeoutMs + 5_000;
    server.keepAliveTimeout = 65_000;
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}. Shutting down gracefully...`);

  const forceShutdownTimer = setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }

    await disconnectDB();
    clearTimeout(forceShutdownTimer);

    console.log("Shutdown complete");
    process.exit(0);
  } catch (error) {
    clearTimeout(forceShutdownTimer);
    console.error("Graceful shutdown failed:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("uncaughtException");
});

process.on("warning", (warning) => {
  console.warn("Process warning:", {
    name: warning.name,
    message: warning.message,
    stack: warning.stack,
  });
});

startServer();
