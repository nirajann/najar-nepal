const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PRIVATE_UPLOAD_DIR = path.join(__dirname, "..", "private_uploads", "verification");

function ensureVerificationUploadDir() {
  fs.mkdirSync(PRIVATE_UPLOAD_DIR, { recursive: true });
}

function parseDataUrl(dataUrl) {
  const trimmed = typeof dataUrl === "string" ? dataUrl.trim() : "";
  const matches = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!matches) {
    return null;
  }

  return {
    mimeType: matches[1].toLowerCase(),
    base64: matches[2],
  };
}

function extensionForMimeType(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function buildStoredFileName(userId, documentKey, mimeType) {
  const extension = extensionForMimeType(mimeType);
  const unique = crypto.randomBytes(8).toString("hex");
  return `${String(userId)}-${documentKey}-${Date.now()}-${unique}.${extension}`;
}

function deleteStoredFile(storedValue) {
  if (!storedValue || typeof storedValue !== "string") return;
  if (storedValue.startsWith("data:")) return;

  const filePath = path.join(PRIVATE_UPLOAD_DIR, path.basename(storedValue));

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function saveVerificationImageFromDataUrl({ userId, documentKey, dataUrl }) {
  ensureVerificationUploadDir();

  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    throw new Error("Invalid verification image format");
  }

  const fileName = buildStoredFileName(userId, documentKey, parsed.mimeType);
  const filePath = path.join(PRIVATE_UPLOAD_DIR, fileName);

  fs.writeFileSync(filePath, Buffer.from(parsed.base64, "base64"));

  return fileName;
}

function readStoredVerificationImage(storedValue) {
  if (!storedValue || typeof storedValue !== "string") {
    return null;
  }

  if (storedValue.startsWith("data:")) {
    const parsed = parseDataUrl(storedValue);
    if (!parsed) return null;

    return {
      buffer: Buffer.from(parsed.base64, "base64"),
      mimeType: parsed.mimeType,
    };
  }

  const filePath = path.join(PRIVATE_UPLOAD_DIR, path.basename(storedValue));

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const extension = path.extname(filePath).slice(1).toLowerCase();
  const mimeType =
    extension === "png"
      ? "image/png"
      : extension === "webp"
      ? "image/webp"
      : "image/jpeg";

  return {
    buffer: fs.readFileSync(filePath),
    mimeType,
  };
}

module.exports = {
  deleteStoredFile,
  parseDataUrl,
  readStoredVerificationImage,
  saveVerificationImageFromDataUrl,
};
