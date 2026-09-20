import {
  getMfaSetup,
  enableMfa,
  disableMfa,
  completeMfaLogin,
  requireBackupCodeToken,
} from "../services/mfa.service.js";
import { getPublicUser } from "../services/auth.service.js";
import {
  setAuthCookies,
  mfaCookieOptions,
  MFA_CHALLENGE_COOKIE,
  stripMaxAge,
} from "../services/token.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const mfaSetup = asyncHandler(async (req, res) => {
  const data = await getMfaSetup(req.user.user_id);
  return res.json(data);
});

export const mfaVerify = asyncHandler(async (req, res) => {
  const result = await enableMfa({
    userId: req.user.user_id,
    token: requireBackupCodeToken(req),
  });
  return res.json(result);
});

export const mfaDisable = asyncHandler(async (req, res) => {
  const result = await disableMfa({
    userId: req.user.user_id,
    token: requireBackupCodeToken(req),
  });
  return res.json(result);
});

export const mfaLogin = asyncHandler(async (req, res) => {
  const challengeId = req.cookies?.[MFA_CHALLENGE_COOKIE];
  const userId = await completeMfaLogin({
    challengeId,
    token: requireBackupCodeToken(req),
  });

  const user = await getPublicUser(userId);
  await setAuthCookies(req, res, user);
  res.clearCookie(MFA_CHALLENGE_COOKIE, stripMaxAge(mfaCookieOptions()));
  return res.json(user);
});