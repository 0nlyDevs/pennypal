import { prisma } from "../../db/prisma.js";

export const resetDb = () =>
  prisma.$executeRawUnsafe('TRUNCATE TABLE "user" RESTART IDENTITY CASCADE');

export const closeDb = () => prisma.$disconnect();