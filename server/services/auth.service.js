import bcrypt from "bcrypt";
import { prisma } from "../db/prisma.js";
import { createMfaChallenge } from "./mfa.service.js";
import {
  isLockedOut,
  recordFailedLogin,
  clearFailedLogins,
} from "./lockout.service.js";
import { publicUserSelect, toPublicUser } from "../utils/userSelect.js";
import {
  isStrongPasswordValue,
  PASSWORD_POLICY_MESSAGE,
} from "../utils/passwordPolicy.js";
import {
  ConflictError,
  HttpError,
  UnauthorizedError,
  NotFoundError,
} from "../utils/errors.js";

export const signupUser = async ({ email, password, username, firstname, lastname }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError("Email already in use");
  if (!isStrongPasswordValue(password)) {
    throw new HttpError(PASSWORD_POLICY_MESSAGE, 400);
  }

  const hashed_password = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      hashed_password,
      username: username || email.split("@")[0],
      firstname: firstname || "",
      lastname: lastname || "",
    },
    select: publicUserSelect,
  });
  return user;
};

export const loginUser = async ({ email, password, ip, userAgent }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedError("Invalid credentials");

  if (await isLockedOut(email)) {
    throw new HttpError("Too many failed attempts. Please try again later.", 429);
  }

  const ok = await bcrypt.compare(password, user.hashed_password);
  if (!ok) {
    await recordFailedLogin({ user_id: user.user_id, email, ip });
    throw new UnauthorizedError("Invalid credentials");
  }

  await clearFailedLogins(email);

  if (user.totp_enabled) {
    const challenge_id = await createMfaChallenge(user.user_id);
    return {
      user: null,
      mfaRequired: true,
      challenge: { challenge_id },
    };
  }

  return { user: toPublicUser(user), mfaRequired: false };
};

export const getPublicUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: publicUserSelect,
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
};