import crypto from "crypto";
import { prisma } from "../db/prisma.js";
import { UnauthorizedError } from "../utils/errors.js";

const REFRESH_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || "30", 10);

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const issueRefreshToken = async ({
  user_id,
  family_id = crypto.randomUUID(),
  ip,
  userAgent,
}) => {
  const token = crypto.randomBytes(48).toString("base64url");
  await prisma.refreshToken.create({
    data: {
      token_hash: hashToken(token),
      family_id,
      user_id,
      ip: ip?.slice(0, 64) || null,
      user_agent: (userAgent || "").slice(0, 255) || null,
      expires_at: new Date(
        Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
      ),
    },
  });
  return { token, family_id };
};

const revokeFamily = async (familyId) => {
  await prisma.refreshToken.updateMany({
    where: { family_id: familyId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
};

export const rotateRefreshToken = async ({ token, ip, userAgent }) => {
  if (!token) throw new UnauthorizedError("Session is invalid");
  const tokenHash = hashToken(token);
  const existing = await prisma.refreshToken.findUnique({
    where: { token_hash: tokenHash },
  });
  if (!existing) throw new UnauthorizedError("Session is invalid");
  if (existing.expires_at <= new Date())
    throw new UnauthorizedError("Session has expired");

  if (existing.revoked_at) {
    await revokeFamily(existing.family_id);
    await prisma.user.update({
      where: { user_id: existing.user_id },
      data: { token_version: { increment: 1 } },
    });
    throw new UnauthorizedError("Session has been revoked");
  }

  const nextToken = crypto.randomBytes(48).toString("base64url");
  const nextTokenHash = hashToken(nextToken);
  const now = new Date();

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { token_hash: tokenHash },
      data: { revoked_at: now, replaced_by_token_hash: nextTokenHash },
    }),
    prisma.refreshToken.create({
      data: {
        token_hash: nextTokenHash,
        family_id: existing.family_id,
        user_id: existing.user_id,
        ip: ip?.slice(0, 64) || null,
        user_agent: (userAgent || "").slice(0, 255) || null,
        expires_at: existing.expires_at,
      },
    }),
  ]);

  return {
    token: nextToken,
    family_id: existing.family_id,
    user_id: existing.user_id,
  };
};

export const revokeRefreshToken = async (token) => {
  if (!token) return;
  const existing = await prisma.refreshToken.findUnique({
    where: { token_hash: hashToken(token) },
  });
  if (existing && !existing.revoked_at) {
    await prisma.refreshToken.update({
      where: { token_hash: existing.token_hash },
      data: { revoked_at: new Date() },
    });
  }
};

export const revokeAllSessionTokens = async (userId) => {
  await prisma.$transaction([
    prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    }),
    prisma.user.update({
      where: { user_id: userId },
      data: { token_version: { increment: 1 } },
    }),
  ]);
};

export const listSessions = async (userId) => {
  return prisma.refreshToken.findMany({
    where: { user_id: userId, revoked_at: null },
    orderBy: { created_at: "desc" },
    select: {
      family_id: true,
      ip: true,
      user_agent: true,
      created_at: true,
      expires_at: true,
    },
  });
};