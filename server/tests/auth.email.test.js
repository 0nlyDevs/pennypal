import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { resetDb } from "./helpers/db.js";
import { cookieHeader, signup } from "./helpers/auth.js";

const { sendSpy } = vi.hoisted(() => ({ sendSpy: vi.fn() }));

vi.mock("../services/email.service.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    sendVerificationEmail: vi.fn(async (opts) => {
      sendSpy(opts);
      return true;
    }),
  };
});

beforeEach(async () => {
  await resetDb();
  sendSpy.mockClear();
});

describe("email verification", () => {
  it("marks an email verified after clicking the signed link", async () => {
    const { cookies } = await signup({ email: "verify-me@example.com" });

    const res = await request(app)
      .post("/api/auth/request-verification")
      .set("Cookie", cookieHeader({ token: cookies.token }));
    expect(res.status).toBe(200);
    expect(sendSpy).toHaveBeenCalledTimes(1);

    const { verificationUrl } = sendSpy.mock.calls[0][0];
    expect(verificationUrl).toContain("/auth/verify-email?token=");
    const token = new URL(verificationUrl).searchParams.get("token");
    expect(token).toBeTruthy();

    const verify = await request(app)
      .get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
    expect(verify.status).toBe(200);

    const me = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookieHeader({ token: cookies.token }));
    expect(me.status).toBe(200);
    expect(me.body.email_verified_at).toBeTruthy();
  });

  it("rejects a verification token with a wrong issuer", async () => {
    await signup({ email: "verify-issuer@example.com" });
    const token = jwt.sign(
      { email: "verify-issuer@example.com", purpose: "email_verify" },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
        algorithm: "HS256",
        issuer: "attacker",
        audience: process.env.JWT_AUDIENCE || "expense-tracker-api",
      }
    );
    const res = await request(app)
      .get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
    expect(res.status).toBe(400);
  });

  it("rejects an invalid verification token", async () => {
    const res = await request(app).get(
      "/api/auth/verify-email?token=not-a-jwt"
    );
    expect(res.status).toBe(400);
  });
});