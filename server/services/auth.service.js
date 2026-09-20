import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../db/prisma.js';
import { revokeAllSessionTokens } from './session.service.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';

const publicUserSelect = {
  user_id: true,
  email: true,
  username: true,
  firstname: true,
  lastname: true,
  created_at: true,
  token_version: true,
};

export const signupUser = async ({ email, password, username, firstname, lastname }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError('Email already in use');

  const hashed_password = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      hashed_password,
      username: username || email.split('@')[0],
      firstname: firstname || '',
      lastname: lastname || '',
    },
    select: publicUserSelect,
  });
  return user;
};

export const loginUser = async ({ email, password, ip, userAgent }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedError('Invalid credentials');

  const ok = await bcrypt.compare(password, user.hashed_password);
  if (!ok) throw new UnauthorizedError('Invalid credentials');

  const publicUser = {
    user_id: user.user_id,
    email: user.email,
    username: user.username,
    firstname: user.firstname,
    lastname: user.lastname,
    created_at: user.created_at,
    token_version: user.token_version,
  };
  return { user: publicUser, mfaRequired: false };
};

export const getPublicUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { user_id: userId }, select: publicUserSelect });
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const upsertOAuthUser = async ({ email, given_name, family_name, name }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      user_id: existing.user_id,
      email: existing.email,
      username: existing.username,
      firstname: existing.firstname,
      lastname: existing.lastname,
      created_at: existing.created_at,
    };
  }

  const randomPass = 'oauth-' + crypto.randomBytes(32).toString('hex');
  const hashed_password = await bcrypt.hash(randomPass, 12);
  const preferred = (given_name && String(given_name).trim())
    || (name && String(name).trim())
    || (email && String(email).split('@')[0])
    || 'user';
  const username = preferred.slice(0, 50);

  const user = await prisma.user.create({
    data: {
      email,
      hashed_password,
      username,
      firstname: given_name || name || '',
      lastname: family_name || '',
    },
    select: publicUserSelect,
  });
  return user;
};

//--------------------------------------------------------

//UPDATE USER, in order to allow user to change their profile informations

export const updateUserProfile = async (userId, { firstname, lastname, username }) => {
  const user = await prisma.user.update({
    where: { user_id: userId },
    data: {
      firstname: firstname || undefined,
      lastname: lastname || undefined,
      username: username || undefined,
    },
    select: publicUserSelect,
  });
  return user;
};

//possibility to change password

export const changeUserPassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { user_id: userId } });
  if (!user) throw new NotFoundError('User not found');

  const ok = await bcrypt.compare(currentPassword, user.hashed_password);
  if (!ok) throw new UnauthorizedError('Current password is incorrect');

  const hashed_password = await bcrypt.hash(newPassword, 12);
  
  await prisma.user.update({
    where: { user_id: userId },
    data: { hashed_password },
  });
  await revokeAllSessionTokens(userId);

  return { message: 'Password updated successfully' };
};
