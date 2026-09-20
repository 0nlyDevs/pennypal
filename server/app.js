import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "node:path";
import { requireAuth } from "./middleware/auth.middleware.js";
import incomeRoutes from "./routes/income.route.js";
import authRoutes from "./routes/auth.route.js";
import categoryRoutes from "./routes/category.route.js";
import userRoutes from "./routes/user.route.js";
import expenseRoutes from "./routes/expense.route.js";
import summaryRoutes from "./routes/summary.route.js";
import { root, health, dbCheck } from "./controllers/ops.controller.js";

const app = express();
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production" ? undefined : false,
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(path.resolve("uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/incomes", requireAuth, incomeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/user", requireAuth, userRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/summary", requireAuth, summaryRoutes);

app.get("/", root);
app.get("/api/health", health);
app.get("/api/db-check", dbCheck);

// global error handler (keep last)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err?.status || 500;
  const payload = { error: err?.message || "Internal Server Error" };
  if (err?.details) payload.details = err.details;
  if (status >= 500) {
    console.error("Unhandled error:", err);
  }
  res.status(status).json(payload);
});

export default app;