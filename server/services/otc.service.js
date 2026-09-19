import jwt from "jsonwebtoken";
import { BadRequestError } from "../utils/errors.js";

/**
 * Creates a stateless, short-lived (60s) signed OTC token.
 * @param {object} payload Session payload (user_id, email, etc.)
 * @returns {string} Signed JWT token valid for 60 seconds
 */
export const createOtcCode = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET");
  }
  return jwt.sign({ ...payload, otc: true }, process.env.JWT_SECRET, {
    expiresIn: "60s",
  });
};

/**
 * Verifies and consumes a stateless short-lived OTC token.
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
    if (!payload?.otc || !payload?.user_id) {
      throw new BadRequestError("Invalid one-time code");
    }
    return {
      user_id: payload.user_id,
      email: payload.email,
    };
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    throw new BadRequestError("Invalid or expired one-time code");
  }
};
