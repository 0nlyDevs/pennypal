import { prisma } from "../db/prisma.js";

const MAX_FAILED_ATTEMPTS = parseInt(
  process.env.MAX_FAILED_LOGIN_ATTEMPTS || "5",
  10
);
const LOCKOUT_WINDOW_MS = parseInt(
  process.env.LOCKOUT_WINDOW_MS || String(15 * 60 * 1000),
  10
);

export const isLockedOut = async (email) => {
  if (MAX_FAILED_ATTEMPTS <= 0) return false;
  const recentFailures = await prisma.loginAttempt.count({
    where: {
      email,
      success: false,
      attempt_time: { gte: new Date(Date.now() - LOCKOUT_WINDOW_MS) },
    },
  });
  return recentFailures >= MAX_FAILED_ATTEMPTS;
};

export const recordFailedLogin = ({ user_id, email, ip }) =>
  prisma.loginAttempt.create({
    data: {
      user_id,
      email,
      ip: ip?.slice(0, 64) || null,
    },
  });

export const clearFailedLogins = (email) =>
  prisma.loginAttempt.deleteMany({ where: { email } });