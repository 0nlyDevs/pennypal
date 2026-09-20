import {
  signupUser,
  loginUser,
} from "../services/auth.service.js";
import {
  setAuthCookies,
  mfaCookieOptions,
} from "../services/token.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError } from "../utils/errors.js";

export const signup = asyncHandler(async (req, res) => {
  const { email, password, username, firstname, lastname } = req.body;
  if (!email || !password)
    throw new BadRequestError("Email and password are required");

  const user = await signupUser({
    email,
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
    email,
    password,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  if (result.mfaRequired) {
    res.cookie("mfa_challenge", result.challenge.challenge_id, mfaCookieOptions());
    return res.status(200).json({ mfaRequired: true, email });
  }
  await setAuthCookies(req, res, result.user);
  return res.json(result.user);
});