import { beforeEach, describe, expect, it } from "vitest";
import { authenticator } from "otplib";
import request from "supertest";
import app from "../app.js";
import { prisma } from "../db/prisma.js";
import { resetDb } from "./helpers/db.js";
import { cookieHeader, parseCookies, signup } from "./helpers/auth.js";

beforeEach(async () => {
  await resetDb();
});

const enableMfa = async () => {
  const { email, cookies } = await signup();
  const setup = await request(app)
    .get("/api/auth/mfa/setup")
    .set("Cookie", cookieHeader({ token: cookies.token }));
  expect(setup.status).toBe(200);
  const secret = setup.body.secret;

  const verify = await request(app)
    .post("/api/auth/mfa/verify")
    .set("Cookie", cookieHeader({ token: cookies.token }))
    .send({ token: authenticator.generate(secret) });
  expect(verify.status).toBe(200);
  const backupCodes = verify.body.backupCodes;
  expect(backupCodes).toHaveLength(10);

  return { email, secret, backupCodes, cookies };
};

const loginRaw = async (email, password) =>
  request(app).post("/api/auth/login").send({ email, password });

describe("TOTP MFA", () => {
  it("enrolls via setup + verify and returns backup codes", async () => {
    const { secret, backupCodes } = await enableMfa();
    expect(secret).toBeTruthy();
    expect(backupCodes).toHaveLength(10);
  });

  it("requires a code instead of issuing full session when MFA is enabled", async () => {
    const { email } = await enableMfa();

    const login = await loginRaw(email, "StrongPw1");
    expect(login.status).toBe(200);
    expect(login.body.mfaRequired).toBe(true);
    const names = (login.headers["set-cookie"] || []).join(" ");
    expect(names).toContain("mfa_challenge");
    expect(names).not.toMatch(/token=/);
    expect(names).not.toMatch(/refresh=/);
  });

  it("completes login with a valid TOTP code", async () => {
    const { email, secret } = await enableMfa();

    const login = await loginRaw(email, "StrongPw1");
    expect(login.body.mfaRequired).toBe(true);
    const challenge = parseCookies(login.headers["set-cookie"]).mfa_challenge;

    const complete = await request(app)
      .post("/api/auth/mfa/login")
      .set("Cookie", cookieHeader({ mfa_challenge: challenge }))
      .send({ token: authenticator.generate(secret) });
    expect(complete.status).toBe(200);
    expect(complete.body.email).toBe(email);
    const cookies = parseCookies(complete.headers["set-cookie"]);
    expect(cookies.token).toBeTruthy();

    const me = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookieHeader({ token: cookies.token }));
    expect(me.status).toBe(200);
  });

  it("rejects a single-use challenge after it has been consumed", async () => {
    const { email, secret } = await enableMfa();

    const login = await loginRaw(email, "StrongPw1");
    const challenge = parseCookies(login.headers["set-cookie"]).mfa_challenge;

    const first = await request(app)
      .post("/api/auth/mfa/login")
      .set("Cookie", cookieHeader({ mfa_challenge: challenge }))
      .send({ token: authenticator.generate(secret) });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/api/auth/mfa/login")
      .set("Cookie", cookieHeader({ mfa_challenge: challenge }))
      .send({ token: authenticator.generate(secret) });
    expect(second.status).toBe(401);
  });

  it("rejects an invalid TOTP code", async () => {
    const { email } = await enableMfa();
    const login = await loginRaw(email, "StrongPw1");
    const challenge = parseCookies(login.headers["set-cookie"]).mfa_challenge;

    const res = await request(app)
      .post("/api/auth/mfa/login")
      .set("Cookie", cookieHeader({ mfa_challenge: challenge }))
      .send({ token: "000000" });
    expect(res.status).toBe(401);
  });
});

describe("backup codes", () => {
  it("logs in with a backup code and consumes it", async () => {
    const { email, backupCodes } = await enableMfa();

    const login = await loginRaw(email, "StrongPw1");
    const challenge = parseCookies(login.headers["set-cookie"]).mfa_challenge;

    const res = await request(app)
      .post("/api/auth/mfa/login")
      .set("Cookie", cookieHeader({ mfa_challenge: challenge }))
      .send({ token: backupCodes[0] });
    expect(res.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user.backup_codes).toHaveLength(9);
  });
});