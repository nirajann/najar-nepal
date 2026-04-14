const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db.cjs");
const path = require("path");
const District = require("./models/District.cjs");
const Leader = require("./models/Leader.cjs");

dotenv.config();

const app = express();

const districtModelPath = path.resolve(__dirname, "models", "District.cjs");
const leaderModelPath = path.resolve(__dirname, "models", "Leader.cjs");
console.log("[startup] District model path:", districtModelPath);
console.log("[startup] District modelName:", District?.modelName || null);
console.log("[startup] District find type:", typeof District?.find);
console.log("[startup] Leader model path:", leaderModelPath);
console.log("[startup] Leader modelName:", Leader?.modelName || null);
console.log("[startup] Leader find type:", typeof Leader?.find);

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is required to start the server.");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required to start the server.");
    }

    const isProd = process.env.NODE_ENV === "production";

    await connectDB();
    console.log("Database connected successfully");

    const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "")
      .split(",")
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean);

    if (isProd && allowedOrigins.length === 0) {
      throw new Error("CORS_ORIGINS must be set in production.");
    }

    app.disable("x-powered-by");
    app.use(helmet());
    app.use(
      cors({
        origin(origin, callback) {
          if (!origin) {
            return callback(null, true);
          }

          if (allowedOrigins.length === 0 && !isProd) {
            return callback(null, true);
          }

          const normalizedOrigin = origin.replace(/\/+$/, "");

          if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
          }

          return callback(new Error(`CORS origin not allowed: ${origin}`));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    const generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    });

    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
    });

    const writeLimiter = rateLimit({
      windowMs: 10 * 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    });

    app.use(generalLimiter);
    app.use(express.json({ limit: "20mb" }));

    app.get("/", (req, res) => {
      res.send("Najar Nepal API is running");
    });

    app.get("/api/debug-models", (req, res) => {
      res.json({
        districtModelName: District?.modelName || null,
        districtFindType: typeof District?.find,
        leaderModelName: Leader?.modelName || null,
        leaderFindType: typeof Leader?.find,
      });
    });

    app.use("/api/auth", authLimiter, require("./routes/authRoutes.cjs"));
    app.use("/api/leaders", require("./routes/leaderRoutes.cjs"));
    app.use("/api/districts", require("./routes/districtRoutes.cjs"));
    app.use("/api/district-feedback", writeLimiter, require("./routes/districtFeedbackRoutes.cjs"));
    app.use("/api/ratings", writeLimiter, require("./routes/ratingRoutes.cjs"));
    app.use("/api/complaints", writeLimiter, require("./routes/complaintRoutes.cjs"));
    app.use("/api/reports", writeLimiter, require("./routes/reportRoutes.cjs"));
    app.use("/api/projects", require("./routes/projectRoutes.cjs"));
    app.use("/api/comments", writeLimiter, require("./routes/commentRoutes.cjs"));
    app.use("/api/analytics", writeLimiter, require("./routes/analyticsEventRoutes.cjs"));
    app.use("/api/admin/projects", require("./routes/projectAdminRoutes.cjs"));
    app.use("/api/admin/analytics", require("./routes/analyticsRoutes.cjs"));
    app.use("/api/admin/complaints", require("./routes/complaintRoutes.cjs"));

    app.use((err, req, res, next) => {
      console.error("Server error:", err);
      res.status(500).json({ message: err.message || "Internal server error" });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
