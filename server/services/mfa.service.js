import crypto from 'crypto';
import { authenticator } from 'otplib';
import { prisma } from '../db/prisma.js';
import { BadRequestError, UnauthorizedError } from '../utils/errors.js';

authenticator.options = { window: 1 };

const CHALLENGE_TTL_MS = 10 * 60 * 1000;

const hash = (value) =>
  crypto.createHash('sha256').update(value).digest('hex');

export const generateSecret = () => authenticator.generateSecret();

export const generateOtpauthUrl = ({ secret, email }) =>
  authenticator.keyuri(email, 'PennyPal', secret);

export const verifyToken = ({ token, secret }) => {
  if (!token || !secret) return false;
  try {
    return authenticator.verify({ token: String(token).trim(), secret });
  } catch {
    return false;
  }
};

export const generateBackupCodes = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 10 }, () => {
    let raw = '';
    for (let i = 0; i < 10; i += 1) {
      raw += chars[Math.floor(Math.random() * chars.length)];
    }
    return raw.slice(0, 5) + '-' + raw.slice(5);
  });
};

export const hashBackupCodes = (codes) => codes.map((code) => hash(code));

export const createMfaChallenge = async (userId) => {
  const challenge_id = crypto.randomBytes(24).toString('hex');
  await prisma.mfaChallenge.create({
    data: {
      challenge_id,
      user_id: userId,
      expires_at: new Date(Date.now() + CHALLENGE_TTL_MS),
    },
  });
  return challenge_id;
};

export const consumeMfaChallenge = async (challenge_id) => {
  if (!challenge_id) throw new UnauthorizedError('Missing MFA challenge');
  const challenge = await prisma.mfaChallenge.findUnique({
    where: { challenge_id },
  });
  if (!challenge || challenge.expires_at <= new Date()) {
    throw new UnauthorizedError('MFA challenge expired or invalid');
  }
  if (challenge.used_at) {
    throw new UnauthorizedError('MFA challenge already used');
  }
  await prisma.mfaChallenge.update({
    where: { challenge_id },
    data: { used_at: new Date() },
  });
  return challenge.user_id;
};

export const verifyBackupCode = async (userId, code) => {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { backup_codes: true },
  });
  const stored = Array.isArray(user?.backup_codes) ? user.backup_codes : [];
  const target = hash(String(code).trim());
  const idx = stored.indexOf(target);
  if (idx === -1) {
    throw new UnauthorizedError('Invalid backup code');
  }
  const remaining = stored.filter((_, i) => i !== idx);
  await prisma.user.update({
    where: { user_id: userId },
    data: { backup_codes: remaining },
  });
  return true;
};

export const requireBackupCodeToken = (req) => {
  const { token } = req.body;
  if (!token) throw new BadRequestError('Token required');
  return String(token).trim();
};

export const getMfaSetup = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { totp_secret: true, email: true },
  });
  let secret = user?.totp_secret;
  if (!secret) {
    secret = generateSecret();
    await prisma.user.update({
      where: { user_id: userId },
      data: { totp_secret: secret },
    });
  }
  return { secret, otpauth_url: generateOtpauthUrl({ secret, email: user.email }) };
};

export const enableMfa = async ({ userId, token }) => {
  if (!token) throw new BadRequestError('Token required');
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { totp_secret: true, totp_enabled: true },
  });
  if (!user?.totp_secret) throw new BadRequestError('MFA not initialized');
  if (user.totp_enabled) return { message: 'MFA already enabled' };
  if (!verifyToken({ token, secret: user.totp_secret })) {
    throw new BadRequestError('Invalid verification code');
  }
  const backupCodes = generateBackupCodes();
  await prisma.user.update({
    where: { user_id: userId },
    data: {
      totp_enabled: true,
      backup_codes: hashBackupCodes(backupCodes),
    },
  });
  return { message: 'MFA enabled', backupCodes };
};

export const disableMfa = async ({ userId, token }) => {
  if (!token) throw new BadRequestError('Token required');
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { totp_secret: true },
  });
  if (!user?.totp_secret) throw new BadRequestError('MFA not enabled');
  if (!verifyToken({ token, secret: user.totp_secret })) {
    throw new BadRequestError('Invalid verification code');
  }
  await prisma.user.update({
    where: { user_id: userId },
    data: { totp_enabled: false, totp_secret: null, backup_codes: [] },
  });
  return { message: 'MFA disabled' };
};

export const completeMfaLogin = async ({ challengeId, token }) => {
  const userId = await consumeMfaChallenge(challengeId);
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { totp_enabled: true, totp_secret: true },
  });
  if (!user?.totp_enabled) throw new BadRequestError('MFA is not enabled');

  const validTotp = verifyToken({ token, secret: user.totp_secret });
  if (!validTotp) {
    let backupOk = false;
    try {
      await verifyBackupCode(userId, token);
      backupOk = true;
    } catch {
      backupOk = false;
    }
    if (!backupOk) throw new UnauthorizedError('Invalid verification code');
  }

  return userId;
};