import { beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import request from "supertest";
import app from "../app.js";
import { prisma } from "../db/prisma.js";
import { resetDb } from "./helpers/db.js";
import { cookieHeader } from "./helpers/auth.js";

const createUser = async (overrides = {}) =>
  prisma.user.create({
    data: {
      email: overrides.email || "jwt-user@example.com",
      hashed_password: await bcrypt.hash("StrongPw1", 4),
      username: "jwtuser",
      email_verified_at: new Date(),
    },
  });

const sign = (payload, secret, opts) =>
  jwt.sign(payload, secret, {
    expiresIn: "5m",
    algorithm: "HS256",
    issuer: process.env.JWT_ISSUER || "expense-tracker",
    audience: process.env.JWT_AUDIENCE || "expense-tracker-api",
    ...opts,
  });

beforeEach(async () => {
  await resetDb();
});

describe("JWT pinning", () => {
  it("accepts a token signed with the pinned issuer/audience/algorithm", async () => {
    const user = await createUser();
    const token = sign(
      { user_id: user.user_id, email: user.email, tv: user.token_version },
      process.env.JWT_SECRET
    );
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookieHeader({ token }));
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
  });

  it("rejects a token signed with a different issuer", async () => {
    const user = await createUser();
    const token = sign(
      { user_id: user.user_id, email: user.email, tv: user.token_version },
      process.env.JWT_SECRET,
      { issuer: "attacker" }
    );
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookieHeader({ token }));
    expect(res.status).toBe(401);
  });

  it("rejects a token with a different audience", async () => {
    const user = await createUser();
    const token = sign(
      { user_id: user.user_id, email: user.email, tv: user.token_version },
      process.env.JWT_SECRET,
      { audience: "other-api" }
    );
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookieHeader({ token }));
    expect(res.status).toBe(401);
  });

  it("rejects a token signed with algorithm none", async () => {
    const user = await createUser();
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, tv: user.token_version },
      "x",
      { algorithm: "none", expiresIn: "5m" }
    );
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookieHeader({ token }));
    expect(res.status).toBe(401);
  });

  it("rejects a token whose token_version is stale", async () => {
    const user = await createUser();
    const token = sign(
      { user_id: user.user_id, email: user.email, tv: 999 },
      process.env.JWT_SECRET
    );
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookieHeader({ token }));
    expect(res.status).toBe(401);
  });

  it("rejects a token for a deleted user", async () => {
    const user = await createUser({ email: "deleted@example.com" });
    await prisma.user.delete({ where: { user_id: user.user_id } });
    const token = sign(
      { user_id: user.user_id, email: user.email, tv: 0 },
      process.env.JWT_SECRET
    );
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookieHeader({ token }));
    expect(res.status).toBe(401);
  });
});