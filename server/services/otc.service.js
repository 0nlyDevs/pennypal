import crypto from "crypto";
import { BadRequestError } from "../utils/errors.js";

// In-memory store for short-lived one-time exchange codes (OTC)
const otcStore = new Map();

// Periodically clean expired OTC entries
setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of otcStore.entries()) {
    if (now > entry.expiresAt) {
      otcStore.delete(code);
    }
  }
}, 60000).unref();

/**
 * Creates a short-lived one-time exchange code.
 * @param {object} payload Session payload (user_id, email, etc.)
 * @param {object} user Public user object
 * @param {number} ttlMs Time-to-live in milliseconds (default: 60s)
 * @returns {string} The generated code
 */
export const createOtcCode = (payload, user, ttlMs = 60000) => {
  const code = crypto.randomBytes(24).toString("hex");
  otcStore.set(code, {
    payload,
    user,
    expiresAt: Date.now() + ttlMs,
  });
  return code;
};

/**
 * Consumes and invalidates a short-lived one-time exchange code.
 * @param {string} code
 * @returns {{ payload: object, user: object }} The stored entry data
 */
export const consumeOtcCode = (code) => {
  if (!code || typeof code !== "string") {
    throw new BadRequestError("One-time code required");
  }

  const entry = otcStore.get(code);
  otcStore.delete(code); // single-use

  if (!entry || Date.now() > entry.expiresAt) {
    throw new BadRequestError("Invalid or expired one-time code");
  }

  return entry;
};
