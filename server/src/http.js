// Small HTTP helpers: JSON envelopes, body parsing, static files, client IP.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";

const MAX_BODY_BYTES = 16 * 1024;

const MIME = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
});

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Every JSON response uses the same envelope: { success, data, error }.
export function sendJson(res, status, data, error = null) {
  const body = JSON.stringify({ success: error === null, data: error === null ? data : null, error });
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

export const sendError = (res, status, message) => sendJson(res, status, null, message);

export async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "Request body too large");
    chunks.push(chunk);
  }
  if (size === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Body must be valid JSON");
  }
}

export function clientIp(req) {
  // Hosts like Render put the real client first in X-Forwarded-For.
  const forwarded = req.headers["x-forwarded-for"];
  return (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "") || req.socket.remoteAddress || "unknown";
}

// Serves files under rootDir; refuses anything that escapes it (path traversal).
export async function serveStatic(res, rootDir, urlPath) {
  const root = resolve(rootDir);
  const relative = decodeURIComponent(urlPath === "/" ? "/index.html" : urlPath);
  const filePath = resolve(join(root, normalize(relative)));
  if (filePath !== root && !filePath.startsWith(root + sep)) return false;
  try {
    const info = await stat(filePath);
    if (!info.isFile()) return false;
    res.writeHead(200, {
      "Content-Type": MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream",
      "Content-Length": info.size,
      "X-Content-Type-Options": "nosniff",
    });
    createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
}
