import jwt from "jsonwebtoken";
import {
  signupUser,
  loginUser,
  getPublicUser,
  upsertOAuthUser,
} from "../services/auth.service.js";
import { sendVerificationEmail } from "../services/email.service.js";
import { prisma } from "../db/prisma.js";
import {
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllSessionTokens,
  listSessions,
} from "../services/session.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import isStrongPassword from "validator/lib/isStrongPassword.js";
import {
  buildGoogleAuthUrl,
  exchangeGoogleCodeForProfile,
} from "../services/oauth.service.js";

const ACCESS_COOKIE_NAME = "token";
const REFRESH_COOKIE_NAME = "refresh";

const getIssuer = () => process.env.JWT_ISSUER || "expense-tracker";
const getAudience = () => process.env.JWT_AUDIENCE || "expense-tracker-api";

const isProd = () => process.env.NODE_ENV === "production";

const accessCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: "lax",
  path: "/",
  maxAge: 15 * 60 * 1000,
});

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: "lax",
  path: "/api",
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

const mfaCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: "lax",
  path: "/",
  maxAge: 10 * 60 * 1000,
});

const signAccessToken = (payload) => {
  if (!process.env.JWT_SECRET) throw new Error("Missing JWT_SECRET");
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_TTL || "15m",
    issuer: getIssuer(),
    audience: getAudience(),
    header: { kid: "access-v1" },
  });
};

const signVerificationToken = (email) => {
  if (!process.env.JWT_SECRET) throw new Error("Missing JWT_SECRET");
  return jwt.sign({ email, purpose: "email_verify" }, process.env.JWT_SECRET, {
    expiresIn: "24h",
    issuer: getIssuer(),
    audience: getAudience(),
    header: { kid: "email-v1" },
  });
};

const setAuthCookies = async (req, res, user) => {
  const accessToken = signAccessToken({
    user_id: user.user_id,
    email: user.email,
    tv: user.token_version,
  });
  const { token: refreshToken } = await issueRefreshToken({
    user_id: user.user_id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
};

const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, accessCookieOptions());
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  res.clearCookie("mfa_challenge", mfaCookieOptions());
};

export const signup = asyncHandler(async (req, res) => {
  const { email, password, username, firstname, lastname } = req.body;
  if (!email || !password)
    throw new BadRequestError("Email and password are required");
  if (
    !isStrongPassword(String(password), {
      minLength: 6,
      minLowercase: 0,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0,
    })
  ) {
    throw new BadRequestError(
      "Password must be at least 6 characters and include at least one uppercase letter and one number"
    );
  }
  const user = await signupUser({
    email: req.body.email,
    password,
    username,
    firstname,
    lastname,
  });
  await setAuthCookies(req, res, user);
  return res.status(201).json(user);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    throw new BadRequestError("Email and password are required");
  const result = await loginUser({
    email: req.body.email,
    password,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  if (result.mfaRequired) {
    res.cookie("mfa_challenge", result.challenge.challenge_id, mfaCookieOptions());
    return res.status(200).json({ mfaRequired: true, email: req.body.email });
  }
  await setAuthCookies(req, res, result.user);
  return res.json(result.user);
});

export const refresh = asyncHandler(async (req, res) => {
  const current = req.cookies?.[REFRESH_COOKIE_NAME];
  const session = await rotateRefreshToken({
    token: current,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  const user = await getPublicUser(session.user_id);
  res.cookie(
    ACCESS_COOKIE_NAME,
    signAccessToken({ user_id: user.user_id, email: user.email, tv: user.token_version }),
    accessCookieOptions()
  );
  res.cookie(REFRESH_COOKIE_NAME, session.token, refreshCookieOptions());
  res.clearCookie("mfa_challenge", mfaCookieOptions());
  return res.json(user);
});

export const me = asyncHandler(async (req, res) => {
  const user = await getPublicUser(req.user.user_id);
  return res.json(user);
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  await revokeRefreshToken(refreshToken);
  clearAuthCookies(res);
  return res.status(204).send();
});

export const logoutAll = asyncHandler(async (req, res) => {
  await revokeAllSessionTokens(req.user.user_id);
  clearAuthCookies(res);
  return res.status(204).send();
});

export const sessions = asyncHandler(async (req, res) => {
  const userSessions = await listSessions(req.user.user_id);
  return res.json({ sessions: userSessions });
});

const getFrontendBase = () =>
  process.env.FRONTEND_URL ||
  process.env.CORS_ORIGIN ||
  "http://localhost:5173";

const getRedirectUri = (req) =>
  process.env.GOOGLE_REDIRECT_URI ||
  `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

const oauthCookieOpts = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', path: '/', maxAge: 10 * 60 * 1000 };
}

export const googleAuth = asyncHandler(async (req, res) => {
  const redirectUri = getRedirectUri(req);
  const { url, state } = buildGoogleAuthUrl({ redirectUri });
  res.cookie("g_state", state, oauthCookieOpts());
  return res.redirect(url);
});

export const googleCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies?.g_state;

  if (!code || !state || !savedState || state !== savedState) {
    throw new BadRequestError("Invalid OAuth state");
  }

  res.clearCookie("g_state", oauthCookieOpts());

  const redirectUri = getRedirectUri(req);
  const profile = await exchangeGoogleCodeForProfile({
    code: String(code),
    redirectUri,
  });

  const email = profile?.email;
  if (!email) throw new BadRequestError("Email not available from Google");

  const user = await upsertOAuthUser({
    email,
    given_name: profile?.given_name,
    family_name: profile?.family_name,
    name: profile?.name,
  });

  await setAuthCookies(req, res, user);

  const frontend = getFrontendBase();
  return res.redirect(302, `${frontend.replace(/\/$/, "")}/auth/callback`);
});

export const requestVerification = asyncHandler(async (req, res) => {
  const user = await getPublicUser(req.user.user_id);
  if (user.email_verified_at) {
    return res.status(200).json({ message: "Email already verified" });
  }
  const token = signVerificationToken(user.email);
  const apiBase = (process.env.API_PUBLIC_URL || `${getFrontendBase()}/api`).replace(/\/$/, "");
  const verificationUrl = `${apiBase}/auth/verify-email?token=${encodeURIComponent(token)}`;
  const sent = await sendVerificationEmail({
    to: user.email,
    verificationUrl,
  });
  if (!sent) throw new BadRequestError("Email provider is not configured");
  return res.json({ message: "Verification email sent" });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw new BadRequestError("Verification token required");
  let payload;
  try {
    payload = jwt.verify(String(token), process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: getIssuer(),
      audience: getAudience(),
    });
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
  return res.json({ message: "Email verified" });
});