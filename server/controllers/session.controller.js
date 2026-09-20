import { getPublicUser } from "../services/auth.service.js";
import {
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllSessionTokens,
  listSessions,
} from "../services/session.service.js";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  MFA_CHALLENGE_COOKIE,
  signAccessToken,
  accessCookieOptions,
  refreshCookieOptions,
  mfaCookieOptions,
  clearAuthCookies,
  stripMaxAge,
} from "../services/token.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const refresh = asyncHandler(async (req, res) => {
  const current = req.cookies?.[REFRESH_COOKIE];
  const session = await rotateRefreshToken({
    token: current,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  const user = await getPublicUser(session.user_id);
  res.cookie(
    ACCESS_COOKIE,
    signAccessToken({ user_id: user.user_id, email: user.email, tv: user.token_version }),
    accessCookieOptions()
  );
  res.cookie(REFRESH_COOKIE, session.token, refreshCookieOptions());
  res.clearCookie(MFA_CHALLENGE_COOKIE, stripMaxAge(mfaCookieOptions()));
  return res.json(user);
});

export const me = asyncHandler(async (req, res) => {
  const user = await getPublicUser(req.user.user_id);
  return res.json(user);
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
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