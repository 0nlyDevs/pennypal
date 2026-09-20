import { prisma } from "../db/prisma.js";
import { getPublicUser } from "./auth.service.js";
import { sendVerificationEmail } from "./email.service.js";
import {
  signVerificationToken,
  verifyVerificationToken,
} from "./token.service.js";
import { getApiBase } from "../utils/urls.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

export const buildVerificationUrl = (email) => {
  const token = signVerificationToken(email);
  const apiBase = getApiBase();
  return `${apiBase}/auth/verify-email?token=${encodeURIComponent(token)}`;
};

export const requestVerificationEmail = async (userId) => {
  const user = await getPublicUser(userId);
  if (user.email_verified_at) return { alreadyVerified: true };
  const verificationUrl = buildVerificationUrl(user.email);
  const sent = await sendVerificationEmail({ to: user.email, verificationUrl });
  return { alreadyVerified: false, sent };
};

export const verifyEmailToken = async (token) => {
  let payload;
  try {
    payload = verifyVerificationToken(token);
  } catch {
    throw new BadRequestError("Invalid or expired verification token");
  }
  if (payload?.purpose !== "email_verify" || !payload?.email) {
    throw new BadRequestError("Invalid verification token");
  }
  const user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user) throw new NotFoundError("User not found");
  await prisma.user.update({
    where: { user_id: user.user_id },
    data: { email_verified_at: user.email_verified_at ?? new Date() },
  });
};