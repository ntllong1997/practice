import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ENTRY_TTL_SECONDS = 15 * 60;
export const STAFF_TTL_SECONDS = 30 * 24 * 60 * 60;

const hmac = (value) =>
  createHmac("sha256", process.env.SALON_SECRET).update(value).digest("base64url");

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
};

// The printed QR code links to /enter?k=<token>. The token is derived from
// SALON_SECRET, so it can't be guessed; rotating SALON_SECRET invalidates old
// prints (print a new one from /qr afterwards).
export const checkinToken = () => hmac("qr:printed").slice(0, 22);

export const isValidQrToken = (token) =>
  typeof token === "string" && safeEqual(token, checkinToken());

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
