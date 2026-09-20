import { BadRequestError } from "../../utils/errors.js";
import {
  requireFieldsWithMessage,
  sanitizeBody,
  validateDateFormat,
} from "./helpers.js";

const validateIncomeData = () => (req, _res, next) => {
  const { amount, source, description } = req.body;
  const errors = [];

  if (amount !== undefined) {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.push("Amount must be greater than 0");
    }
  }

  if (source && source.length > 100) {
    errors.push("Source cannot exceed 100 characters");
  }

  if (description && description.length > 500) {
    errors.push("Description cannot exceed 500 characters");
  }

  if (errors.length > 0) {
    return next(new BadRequestError("Validation failed", errors));
  }

  next();
};

const validateDateRange = () => (req, _res, next) => {
  const { start, end } = req.query;
  const errors = [];

  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate > endDate) {
      errors.push("Start date cannot be after end date");
    }
  }

  if (errors.length > 0) {
    return next(new BadRequestError("Invalid date range", errors));
  }

  next();
};

export const validateIncomeCreate = [
  requireFieldsWithMessage(
    ["amount", "date"],
    "Missing required fields: amount and date are required"
  ),
  sanitizeBody("source", "description"),
  validateDateFormat(),
  validateIncomeData(),
];

export const validateIncomeUpdate = [
  sanitizeBody("source", "description"),
  validateDateFormat(),
  validateIncomeData(),
];

export const validateIncomeQuery = [validateDateRange()];