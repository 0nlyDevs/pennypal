import { BadRequestError } from "../../utils/errors.js";
import { requireFields, sanitizeBody, validateTextMaxLengths } from "./helpers.js";

export const validateCategoryCreate = [
  requireFields("name"),
  sanitizeBody("name"),
  validateTextMaxLengths({ name: 50 }),
];

export const validateCategoryUpdate = [
  sanitizeBody("name"),
  validateTextMaxLengths({ name: 50 }),
  (req, _res, next) => {
    const { name } = req.body;
    if (name != null && name === "") {
      return next(new BadRequestError("name cannot be empty"));
    }
    next();
  },
];