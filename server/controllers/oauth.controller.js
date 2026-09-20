import {
  buildGoogleAuthUrl,
  exchangeGoogleCodeForProfile,
  upsertOAuthUser,
} from "../services/oauth.service.js";
import {
  setAuthCookies,
  oauthCookieOpts,
  stripMaxAge,
} from "../services/token.service.js";
import { getFrontendBase } from "../utils/urls.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError } from "../utils/errors.js";

const getRedirectUri = (req) =>
  process.env.GOOGLE_REDIRECT_URI ||
  `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

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

  res.clearCookie("g_state", stripMaxAge(oauthCookieOpts()));

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