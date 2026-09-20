import {
  requireFields,
  validateEmail,
  sanitizeBody,
  validateTextMaxLengths,
} from "./helpers.js";

export const validateSignup = [
  requireFields("email", "password"),
  validateEmail(),
  sanitizeBody("username", "firstname", "lastname"),
  validateTextMaxLengths({ username: 50, firstname: 50 }),
];

export const validateLogin = [
  requireFields("email", "password"),
  validateEmail(),
];