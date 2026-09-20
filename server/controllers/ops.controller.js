import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const root = (_req, res) => {
  res.json({ message: "Expense Tracker API", status: "running" });
};

export const health = (_req, res) => {
  res.json({ status: "OK" });
};

export const dbCheck = asyncHandler(async (_req, res) => {
  const result = await prisma.$queryRaw`SELECT NOW() as now`;
  const now = Array.isArray(result)
    ? result[0]?.now ?? result[0]?.NOW ?? result[0]
    : result?.now ?? result;
  res.json({ ok: true, now });
});