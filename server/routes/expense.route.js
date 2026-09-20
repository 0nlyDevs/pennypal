import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  createExpenseController,
  getExpenseController,
  getAllExpensesController,
  updateExpenseController,
  deleteExpenseController,
} from "../controllers/expense.controller.js";
import {
  getExpenseValidator,
  deleteExpenseValidator,
  listExpensesValidator,
} from "../middleware/validation/index.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// @route   POST /api/expenses
// @desc    Create a new expense with optional receipt upload
// @access  Private
router.post(
  "/",
  upload.single("receipt"),
  createExpenseController
);

// @route   GET /api/expenses/:id
// @desc    Get a single expense by ID
// @access  Private
router.get("/:id", getExpenseValidator, getExpenseController);

// @route   GET /api/expenses
// @desc    Get all expenses for the authenticated user
// @access  Private
router.get("/", listExpensesValidator, getAllExpensesController);

// @route   PUT /api/expenses/:id
// @desc    Update an expense with optional receipt upload
// @access  Private
router.put(
  "/:id",
  upload.single("receipt"),
  updateExpenseController
);

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete("/:id", deleteExpenseValidator, deleteExpenseController);

export default router;
