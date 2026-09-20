import { beforeEach, describe, expect, it } from "vitest";
import bcrypt from "bcrypt";
import request from "supertest";
import app from "../app.js";
import { prisma } from "../db/prisma.js";
import { resetDb } from "./helpers/db.js";

const EMAIL = "locked@example.com";
const PASSWORD = "StrongPw1";

beforeEach(async () => {
  await resetDb();
  await prisma.user.create({
    data: {
      email: EMAIL,
      hashed_password: await bcrypt.hash(PASSWORD, 4),
      username: "locked",
    },
  });
});

describe("login attempt lockout", () => {
  it("returns 429 after the failed-attempt threshold is reached", async () => {
    for (let i = 0; i < 5; i += 1) {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: EMAIL, password: "WrongPass1" });
      expect(res.status).toBe(401);
    }

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: EMAIL, password: PASSWORD });
    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/Too many failed attempts/);
  });

  it("does not lock out after successful login clears failures", async () => {
    for (let i = 0; i < 3; i += 1) {
      await request(app)
        .post("/api/auth/login")
        .send({ email: EMAIL, password: "WrongPass1" });
    }

    const ok = await request(app)
      .post("/api/auth/login")
      .send({ email: EMAIL, password: PASSWORD });
    expect(ok.status).toBe(200);

    const again = await request(app)
      .post("/api/auth/login")
      .send({ email: EMAIL, password: PASSWORD });
    expect(again.status).toBe(200);
  });
});