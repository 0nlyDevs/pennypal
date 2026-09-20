import {
  requestVerificationEmail,
  verifyEmailToken,
} from "../services/verification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError } from "../utils/errors.js";

export const requestVerification = asyncHandler(async (req, res) => {
  const result = await requestVerificationEmail(req.user.user_id);
  if (result.alreadyVerified) {
    return res.status(200).json({ message: "Email already verified" });
  }
  if (!result.sent) throw new BadRequestError("Email provider is not configured");
  return res.json({ message: "Verification email sent" });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw new BadRequestError("Verification token required");
  await verifyEmailToken(String(token));
  return res.json({ message: "Email verified" });
});