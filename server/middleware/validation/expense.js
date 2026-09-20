// middleware/validation/expense.js
import { body, param, query } from "express-validator";

export const createExpenseValidator = [
  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number")
    .notEmpty()
    .withMessage("Amount is required"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 2000 })
    .withMessage("Description must be less than 2000 characters"),

  body("type")
    .optional()
    .isIn(["one-time", "recurring"])
    .withMessage("Type must be either one-time or recurring"),

  // If type is absent (defaults to one-time) OR explicitly 'one-time', require date
  body("date")
    .custom((value, { req }) => {
      const type = req.body.type || "one-time";
      if (type === "one-time" && !value) {
        throw new Error("Date is required for one-time expenses");
      }
      return true;
    })
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Date must be a valid ISO date"),

  body("startDate")
    .if(body("type").equals("recurring"))
    .notEmpty()
    .withMessage("Start date is required for recurring expenses")
    .isISO8601()
    .withMessage("Start date must be a valid ISO date"),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO date")
    .custom((value, { req }) => {
      if (
        value &&
        req.body.startDate &&
        new Date(value) < new Date(req.body.startDate)
      ) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("categoryId")
    .notEmpty()
    .withMessage("Category ID is required")
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),
];

export const updateExpenseValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Expense ID must be a positive integer")
    .toInt(),

  body("amount")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 2000 })
    .withMessage("Description must be less than 2000 characters"),

  body("type")
    .optional()
    .isIn(["one-time", "recurring"])
    .withMessage("Type must be either one-time or recurring"),

  // If explicitly switching to one-time, require date
  body("date")
    .custom((value, { req }) => {
      if (req.body.type === "one-time" && !value) {
        throw new Error("Date is required when type is one-time");
      }
      return true;
    })
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Date must be a valid ISO date"),

  // If explicitly switching to recurring, require startDate
  body("startDate")
    .if(body("type").equals("recurring"))
    .notEmpty()
    .withMessage("Start date is required when type is recurring")
    .isISO8601()
    .withMessage("Start date must be a valid ISO date"),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO date")
    .custom((value, { req }) => {
      if (
        value &&
        req.body.startDate &&
        new Date(value) < new Date(req.body.startDate)
      ) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("categoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Category ID must be a positive integer"),

  body("receipt").optional(), // file upload handled by multer
];

export const getExpenseValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Expense ID must be a positive integer")
    .toInt(),
];

export const deleteExpenseValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Expense ID must be a positive integer")
    .toInt(),
];

export const listExpensesValidator = [
  query("start")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO date"),

  query("end")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO date"),

  query("category")
    .optional()
    .isString()
    .withMessage("Category must be a string"),

  query("type")
    .optional()
    .isIn(["recurring", "one-time"])
    .withMessage("Type must be either recurring or one-time"),
];