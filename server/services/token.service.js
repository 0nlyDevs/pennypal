import jwt from "jsonwebtoken";
import { issueRefreshToken } from "./session.service.js";

export const ACCESS_COOKIE = "token";
export const REFRESH_COOKIE = "refresh";
export const MFA_CHALLENGE_COOKIE = "mfa_challenge";

export const getIssuer = () => process.env.JWT_ISSUER || "expense-tracker";
export const getAudience = () =>
  process.env.JWT_AUDIENCE || "expense-tracker-api";

const isProd = () => process.env.NODE_ENV === "production";

export const stripMaxAge = ({ maxAge, ...rest }) => rest;

export const accessCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: "lax",
  path: "/",
  maxAge: 15 * 60 * 1000,
});

export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: "lax",
  path: "/api",
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

export const mfaCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: "lax",
  path: "/",
  maxAge: 10 * 60 * 1000,
});

export const oauthCookieOpts = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: isProd() ? "none" : "lax",
  path: "/",
  maxAge: 10 * 60 * 1000,
});

export const signAccessToken = (payload) => {
  if (!process.env.JWT_SECRET) throw new Error("Missing JWT_SECRET");
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_TTL || "15m",
    issuer: getIssuer(),
    audience: getAudience(),
    header: { kid: "access-v1" },
  });
};

export const signVerificationToken = (email) => {
  if (!process.env.JWT_SECRET) throw new Error("Missing JWT_SECRET");
  return jwt.sign({ email, purpose: "email_verify" }, process.env.JWT_SECRET, {
    expiresIn: "24h",
    issuer: getIssuer(),
    audience: getAudience(),
    header: { kid: "email-v1" },
  });
};

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: getIssuer(),
    audience: getAudience(),
  });

export const verifyVerificationToken = (token) =>
  jwt.verify(String(token), process.env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: getIssuer(),
    audience: getAudience(),
  });

export const setAuthCookies = async (req, res, user) => {
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
  res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
};

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, stripMaxAge(accessCookieOptions()));
  res.clearCookie(REFRESH_COOKIE, stripMaxAge(refreshCookieOptions()));
  res.clearCookie(MFA_CHALLENGE_COOKIE, stripMaxAge(mfaCookieOptions()));
};