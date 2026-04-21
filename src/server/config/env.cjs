const path = require("path");

const packageJson = require(path.resolve(__dirname, "../../../package.json"));

function normalizeOrigin(origin) {
  return origin.trim().replace(/\/+$/, "");
}

function parsePositiveInteger(value, fallback, fieldName) {
  if (value === undefined || value === "") return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return parsed;
}

function parseBodyLimit(value, fallback) {
  const limit = (value || fallback || "").trim();
  if (!/^\d+(kb|mb)$/i.test(limit)) {
    throw new Error("JSON_BODY_LIMIT must look like 512kb or 1mb.");
  }

  return limit.toLowerCase();
}

function loadConfig() {
  const env = process.env;
  const nodeEnv = env.NODE_ENV?.trim() || "development";
  const isProd = nodeEnv === "production";
  const localDevOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ];

  const requiredValues = {
    MONGO_URI: env.MONGO_URI?.trim(),
    JWT_SECRET: env.JWT_SECRET?.trim(),
  };

  const missing = Object.entries(requiredValues)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (isProd && !env.CORS_ORIGINS?.trim() && !env.CORS_ORIGIN?.trim()) {
    missing.push("CORS_ORIGINS");
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const configuredOrigins = (env.CORS_ORIGINS || env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  const allowedOrigins = [...new Set(
    isProd ? configuredOrigins : [...configuredOrigins, ...localDevOrigins]
  )];

  return {
    appVersion: packageJson.version,
    env: nodeEnv,
    isProd,
    port: parsePositiveInteger(env.PORT, 5000, "PORT"),
    mongoUri: requiredValues.MONGO_URI,
    jwtSecret: requiredValues.JWT_SECRET,
    allowedOrigins,
    requestTimeoutMs: parsePositiveInteger(
      env.REQUEST_TIMEOUT_MS,
      30_000,
      "REQUEST_TIMEOUT_MS"
    ),
    jsonBodyLimit: parseBodyLimit(env.JSON_BODY_LIMIT, "1mb"),
  };
}

module.exports = {
  loadConfig,
  normalizeOrigin,
};
