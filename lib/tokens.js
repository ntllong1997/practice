import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const QR_WINDOW_SECONDS = 60;
export const ENTRY_TTL_SECONDS = 15 * 60;
export const STAFF_TTL_SECONDS = 30 * 24 * 60 * 60;

const hmac = (value) =>
  createHmac("sha256", process.env.SALON_SECRET).update(value).digest("base64url");

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
};

const currentWindow = () => Math.floor(Date.now() / 1000 / QR_WINDOW_SECONDS);

const qrTokenFor = (window) => hmac(`qr:${window}`).slice(0, 22);

// The QR code changes every minute. A scan is accepted for the current and the
// previous minute, so a link is valid for at most ~2 minutes.
export const currentQrToken = () => {
  const window = currentWindow();
  const secondsLeft = (window + 1) * QR_WINDOW_SECONDS - Math.floor(Date.now() / 1000);
  return { token: qrTokenFor(window), secondsLeft };
};

export const isValidQrToken = (token) => {
  if (typeof token !== "string" || token.length !== 22) return false;
  const window = currentWindow();
  return safeEqual(token, qrTokenFor(window)) || safeEqual(token, qrTokenFor(window - 1));
};

export const newNonce = () => randomBytes(18).toString("base64url");

// Signed cookie value: base64url(json).signature
export const signValue = (payload, ttlSeconds) => {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds })
  ).toString("base64url");
  return `${body}.${hmac(`cookie:${body}`)}`;
};

export const readSignedValue = (value) => {
  if (typeof value !== "string") return null;
  const [body, signature] = value.split(".");
  if (!body || !signature || !safeEqual(signature, hmac(`cookie:${body}`))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch {
    return null;
  }
};
