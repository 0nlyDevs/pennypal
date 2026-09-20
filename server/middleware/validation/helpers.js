import { BadRequestError } from "../../utils/errors.js";
import isEmail from "validator/lib/isEmail.js";
import normalizeEmail from "validator/lib/normalizeEmail.js";

export const requireFields =
  (...fields) =>
  (req, _res, next) => {
    for (const f of fields) {
      const v = req.body?.[f];
      if (v == null || v === "") {
        return next(new BadRequestError(`Missing field: ${f}`));
      }
    }
    next();
  };

export const requireFieldsWithMessage =
  (fields, message) =>
  (req, _res, next) => {
    for (const f of fields) {
      const v = req.body?.[f];
      if (v == null || v === "") {
        return next(new BadRequestError(message));
      }
    }
    next();
  };

// Normalize and validate email. Sets req.body.email to the normalized lowercase value.
export const validateEmail =
  () =>
  (req, _res, next) => {
    const raw = String(req.body.email || "").trim();
    if (!isEmail(raw)) return next(new BadRequestError("Invalid email format"));
    const normalized = normalizeEmail(raw, {
      all_lowercase: true,
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false,
    });
    req.body.email = normalized;
    next();
  };

export const sanitizeBody =
  (...fields) =>
  (req, _res, next) => {
    for (const f of fields) {
      if (typeof req.body?.[f] === "string") {
        req.body[f] = req.body[f].trim();
      }
    }
    next();
  };

export const validateTextMaxLengths =
  (limits) =>
  (req, _res, next) => {
    for (const [field, max] of Object.entries(limits || {})) {
      const v = req.body?.[field];
      if (typeof v === "string" && v.length > max) {
        return next(
          new BadRequestError(`${field} is too long (max ${max} characters)`)
        );
      }
    }
    next();
  };

export const validateIdParam =
  (paramName) =>
  (req, _res, next) => {
    const id = req.params[paramName];
    if (!id || isNaN(parseInt(id, 10))) {
      return next(new BadRequestError(`Invalid ID in parameter: ${paramName}`));
    }
    next();
  };

export const validatePositiveNumber =
  (field, message = `${field} must be greater than 0`) =>
  (req, _res, next) => {
    const value = req.body?.[field];
    if (value !== undefined) {
      const parsed = parseFloat(value);
      if (isNaN(parsed) || parsed <= 0) {
        return next(new BadRequestError(message));
      }
    }
    next();
  };

export const validateDateFormat =
  (field = "date", message = "Invalid date format") =>
  (req, _res, next) => {
    const value = req.body?.[field];
    if (value) {
      const parsed = new Date(value);
      if (isNaN(parsed.getTime()) || value.trim() === "") {
        return next(new BadRequestError(message));
      }
    }
    next();
  };

export const validateDateRange =
  () =>
  (req, _res, next) => {
    const { start, end } = req.query;
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (startDate > endDate) {
        return next(
          new BadRequestError("Invalid date range", [
            "Start date cannot be after end date",
          ])
        );
      }
    }
    next();
  };