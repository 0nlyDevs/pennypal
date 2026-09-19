import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
  signupUser,
  loginUser,
  getPublicUser,
  upsertOAuthUser,
} from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError } from "../utils/errors.js";
import isStrongPassword from "validator/lib/isStrongPassword.js";
import {
  buildGoogleAuthUrl,
  exchangeGoogleCodeForProfile,
} from "../services/oauth.service.js";

const TOKEN_COOKIE_NAME = "token";

const generateToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET");
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const setAuthCookie = (res, payload) => {
  const token = generateToken(payload);
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
  return token;
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
  setAuthCookie(res, { user_id: user.user_id, email: user.email });
  return res.status(201).json(user);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    throw new BadRequestError("Email and password are required");
  const publicUser = await loginUser({ email: req.body.email, password });
  setAuthCookie(res, { user_id: publicUser.user_id, email: publicUser.email });
  return res.json(publicUser);
});

export const me = asyncHandler(async (req, res) => {
  const user = await getPublicUser(req.user.user_id);
  return res.json(user);
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie("token", {
    path: "/",
    sameSite: "none",
    httpOnly: true,
    secure: true,
  });
  return res.status(204).send();
});

const getFrontendBase = () =>
  process.env.FRONTEND_URL ||
  process.env.CORS_ORIGIN ||
  "http://localhost:5173";

const getRedirectUri = (req) =>
  process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

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

  res.clearCookie("g_state", { ...oauthCookieOpts(), maxAge: undefined });

  const redirectUri = getRedirectUri(req);
  const profile = await exchangeGoogleCodeForProfile({ code: String(code), redirectUri });

  const email = profile?.email;
  if (!email) throw new BadRequestError("Email not available from Google");

  const publicUser = await upsertOAuthUser({
    email,
    given_name: profile?.given_name,
    family_name: profile?.family_name,
    name: profile?.name,
  });

  setAuthCookie(res, { user_id: publicUser.user_id, email: publicUser.email });

  // Generate short-lived one-time code (valid 60 seconds)
  const otc = crypto.randomBytes(24).toString("hex");
  otcStore.set(otc, {
    payload: { user_id: publicUser.user_id, email: publicUser.email },
    user: publicUser,
    expiresAt: Date.now() + 60000,
  });

  const frontend = getFrontendBase();
  return res.redirect(302, `${frontend.replace(/\/$/, "")}/auth/callback?code=${encodeURIComponent(otc)}`);
});

// In-memory store for short-lived one-time exchange codes (OTC)
const otcStore = new Map();

// Periodically clean expired OTC entries
setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of otcStore.entries()) {
    if (now > entry.expiresAt) {
      otcStore.delete(code);
    }
  }
}, 60000).unref();

export const exchangeOtc = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== "string") {
    throw new BadRequestError("One-time code required");
  }

  const entry = otcStore.get(code);
  otcStore.delete(code); // single-use

  if (!entry || Date.now() > entry.expiresAt) {
    throw new BadRequestError("Invalid or expired one-time code");
  }

  setAuthCookie(res, entry.payload);
  return res.json(entry.user);
});
