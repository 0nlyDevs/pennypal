import isStrongPassword from "validator/lib/isStrongPassword.js";

export const PASSWORD_POLICY = {
  minLength: 6,
  minLowercase: 0,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 0,
};

export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 6 characters and include at least one uppercase letter and one number";

export const isStrongPasswordValue = (value) =>
  isStrongPassword(String(value), PASSWORD_POLICY);