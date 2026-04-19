const mongoose = require("mongoose");

let listenersAttached = false;

function attachConnectionListeners() {
  if (listenersAttached) return;

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connection established");
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB connection disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB connection re-established");
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
  });

  listenersAttached = true;
}

async function connectDB(mongoUri, options = {}) {
  const {
    maxRetries = 3,
    retryDelayMs = 2_000,
  } = options;

  attachConnectionListeners();

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      lastError = error;
      console.error(
        `MongoDB connection failed (attempt ${attempt}/${maxRetries}): ${error.message}`
      );

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  throw lastError;
}

async function disconnectDB() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
}

function getDbState() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    readyState: mongoose.connection.readyState,
    status: states[mongoose.connection.readyState] || "unknown",
  };
}

module.exports = {
  connectDB,
  disconnectDB,
  getDbState,
};
