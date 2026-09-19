import jwt from "jsonwebtoken";
import crypto from "crypto";
import { BadRequestError } from "../utils/errors.js";

// Set to track used token identifiers (jti -> expiration timestamp)
const consumedJtis = new Map();

// Periodically clean expired jti entries
setInterval(() => {
  const now = Date.now();
  for (const [jti, expiresAt] of consumedJtis.entries()) {
    if (now > expiresAt) {
      consumedJtis.delete(jti);
    }
  }
}, 60000).unref();

/**
 * Creates a short-lived (60s) signed OTC token with a unique jti identifier.
 * @param {object} payload Session payload (user_id, email, etc.)
 * @returns {string} Signed JWT token valid for 60 seconds
 */
export const createOtcCode = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET");
  }
  const jti = crypto.randomBytes(16).toString("hex");
  return jwt.sign({ ...payload, otc: true, jti }, process.env.JWT_SECRET, {
    expiresIn: "60s",
  });
};

/**
 * Verifies and atomically consumes a short-lived OTC token.
 * Rejects any replayed token whose jti has already been consumed.
 * @param {string} code
 * @returns {object} The decoded payload
 */
export const consumeOtcCode = (code) => {
  if (!code || typeof code !== "string") {
    throw new BadRequestError("One-time code required");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET");
  }

  try {
    const payload = jwt.verify(code, process.env.JWT_SECRET);
    if (!payload?.otc || !payload?.user_id || !payload?.jti) {
      throw new BadRequestError("Invalid one-time code");
    }

    // Atomically check and mark jti as consumed
    if (consumedJtis.has(payload.jti)) {
      throw new BadRequestError("One-time code has already been used");
    }

    const expMs = payload.exp ? payload.exp * 1000 : Date.now() + 60000;
    consumedJtis.set(payload.jti, expMs);

    return {
      user_id: payload.user_id,
      email: payload.email,
    };
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    throw new BadRequestError("Invalid or expired one-time code");
  }
};
